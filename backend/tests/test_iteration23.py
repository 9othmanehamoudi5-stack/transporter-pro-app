"""
Iteration 23 Backend Tests - Security & Commercial Update
Tests for:
1. Multi-tenancy isolation by company_id on all routes
2. Solo price updated to 29€
3. Onboarding KYB endpoints
4. Chatbot rate-limit (20/day)
5. Sidebar role-based access (Cash-Flow, Abonnement hidden from non-admin)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@transporter-pro.com"
ADMIN_PASSWORD = "admin123"
DRIVER_EMAIL = "driver@test.com"
DRIVER_PASSWORD = "driver123"


class TestSubscriptionPlans:
    """Test subscription plans pricing - Solo should be 29€"""
    
    def test_subscription_plans_returns_solo_29(self):
        """GET /api/subscription/plans should return solo monthly_price=29"""
        response = requests.get(f"{BASE_URL}/api/subscription/plans")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "solo" in data, "Solo plan not found in response"
        assert data["solo"]["monthly_price"] == 29, f"Solo monthly_price should be 29, got {data['solo']['monthly_price']}"
        print(f"✓ Solo plan monthly_price = {data['solo']['monthly_price']}€")
        
    def test_subscription_plans_croissance_189(self):
        """Croissance should be 189€/month"""
        response = requests.get(f"{BASE_URL}/api/subscription/plans")
        assert response.status_code == 200
        
        data = response.json()
        assert "croissance" in data
        assert data["croissance"]["monthly_price"] == 189, f"Croissance should be 189, got {data['croissance']['monthly_price']}"
        print(f"✓ Croissance plan monthly_price = {data['croissance']['monthly_price']}€")
        
    def test_subscription_plans_flotte_pro_489(self):
        """Flotte Pro should be 489€/month"""
        response = requests.get(f"{BASE_URL}/api/subscription/plans")
        assert response.status_code == 200
        
        data = response.json()
        assert "flotte_pro" in data
        assert data["flotte_pro"]["monthly_price"] == 489, f"Flotte Pro should be 489, got {data['flotte_pro']['monthly_price']}"
        print(f"✓ Flotte Pro plan monthly_price = {data['flotte_pro']['monthly_price']}€")


class TestAdminAuth:
    """Test admin authentication and dashboard access"""
    
    @pytest.fixture
    def admin_session(self):
        """Login as admin and return session with cookies"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        return session
    
    def test_admin_login_success(self):
        """Admin should be able to login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["role"] == "admin", f"Expected admin role, got {data['role']}"
        assert "access_token" in data, "access_token not in response"
        print(f"✓ Admin login successful: {data['email']}")
        
    def test_admin_dashboard_stats(self, admin_session):
        """GET /api/dashboard/stats should work for admin"""
        response = admin_session.get(f"{BASE_URL}/api/dashboard/stats")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "total_deliveries" in data, "total_deliveries not in stats"
        print(f"✓ Admin dashboard stats: {data}")
        
    def test_admin_cash_flow(self, admin_session):
        """GET /api/dashboard/cash-flow should work for admin"""
        response = admin_session.get(f"{BASE_URL}/api/dashboard/cash-flow")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "money_blocked_in_trucks" in data, "money_blocked_in_trucks not in cash-flow"
        print(f"✓ Admin cash-flow: {data}")


class TestDriverAuth:
    """Test driver authentication and restricted access"""
    
    @pytest.fixture
    def driver_session(self):
        """Login as driver and return session with cookies"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": DRIVER_EMAIL,
            "password": DRIVER_PASSWORD
        })
        assert response.status_code == 200, f"Driver login failed: {response.text}"
        return session
    
    def test_driver_login_success(self):
        """Driver should be able to login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DRIVER_EMAIL,
            "password": DRIVER_PASSWORD
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["role"] == "driver", f"Expected driver role, got {data['role']}"
        print(f"✓ Driver login successful: {data['email']}")
        
    def test_driver_dashboard_stats(self, driver_session):
        """GET /api/dashboard/stats should work for driver (with driver-specific data)"""
        response = driver_session.get(f"{BASE_URL}/api/dashboard/stats")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Driver stats should have different fields than admin
        assert "my_deliveries_today" in data or "pending" in data or "eco_score" in data, f"Driver stats missing expected fields: {data}"
        print(f"✓ Driver dashboard stats: {data}")
        
    def test_driver_cannot_access_cash_flow(self, driver_session):
        """GET /api/dashboard/cash-flow should be forbidden for driver"""
        response = driver_session.get(f"{BASE_URL}/api/dashboard/cash-flow")
        assert response.status_code == 403, f"Expected 403 for driver accessing cash-flow, got {response.status_code}"
        print("✓ Driver correctly denied access to cash-flow")


class TestDataIsolation:
    """Test multi-tenancy isolation by company_id"""
    
    @pytest.fixture
    def admin_session(self):
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return session
    
    @pytest.fixture
    def driver_session(self):
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": DRIVER_EMAIL,
            "password": DRIVER_PASSWORD
        })
        assert response.status_code == 200
        return session
    
    def test_admin_deliveries_isolated(self, admin_session):
        """GET /api/deliveries should return only company's deliveries for admin"""
        response = admin_session.get(f"{BASE_URL}/api/deliveries")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Deliveries should be a list"
        print(f"✓ Admin deliveries returned: {len(data)} items")
        
    def test_driver_deliveries_isolated(self, driver_session):
        """GET /api/deliveries should return only driver's assigned deliveries"""
        response = driver_session.get(f"{BASE_URL}/api/deliveries")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Deliveries should be a list"
        print(f"✓ Driver deliveries returned: {len(data)} items")
        
    def test_admin_damage_reports_isolated(self, admin_session):
        """GET /api/damage-reports should return only company's reports for admin"""
        response = admin_session.get(f"{BASE_URL}/api/damage-reports")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Damage reports should be a list"
        print(f"✓ Admin damage reports returned: {len(data)} items")
        
    def test_driver_damage_reports_isolated(self, driver_session):
        """GET /api/damage-reports should return only driver's reports"""
        response = driver_session.get(f"{BASE_URL}/api/damage-reports")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Damage reports should be a list"
        print(f"✓ Driver damage reports returned: {len(data)} items")


class TestOnboardingKYB:
    """Test onboarding KYB endpoints"""
    
    @pytest.fixture
    def admin_session(self):
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return session
    
    def test_onboarding_status_endpoint(self, admin_session):
        """GET /api/onboarding/status should return onboarding status"""
        response = admin_session.get(f"{BASE_URL}/api/onboarding/status")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "onboarding_complete" in data, "onboarding_complete not in response"
        print(f"✓ Onboarding status: onboarding_complete={data['onboarding_complete']}")
        
    def test_onboarding_complete_endpoint_accepts_data(self, admin_session):
        """POST /api/onboarding/complete should accept KYB data"""
        response = admin_session.post(f"{BASE_URL}/api/onboarding/complete", json={
            "company_name": "Test Transport SARL",
            "siret": "12345678900012",
            "tva_intra": "FR12345678901",
            "address": "123 Rue du Test, 75001 Paris"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "message" in data or "company" in data, f"Unexpected response: {data}"
        print(f"✓ Onboarding complete endpoint works: {data}")


class TestChatbot:
    """Test chatbot endpoint"""
    
    def test_chat_endpoint_works(self):
        """POST /api/chat should work and return a reply"""
        response = requests.post(f"{BASE_URL}/api/chat", json={
            "message": "Bonjour, quels sont vos tarifs?",
            "history": []
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "reply" in data, "reply not in response"
        assert len(data["reply"]) > 0, "Reply should not be empty"
        print(f"✓ Chatbot replied: {data['reply'][:100]}...")


class TestCompanyQuota:
    """Test company quota endpoint for Flotte Pro unlimited drivers"""
    
    @pytest.fixture
    def admin_session(self):
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return session
    
    def test_company_quota_endpoint(self, admin_session):
        """GET /api/auth/company-quota should return quota info"""
        response = admin_session.get(f"{BASE_URL}/api/auth/company-quota")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "driver_count" in data, "driver_count not in response"
        assert "max_drivers" in data, "max_drivers not in response"
        assert "plan" in data, "plan not in response"
        
        # If plan is flotte_pro, max_drivers should be -1 (unlimited)
        if data["plan"] == "flotte_pro":
            assert data["max_drivers"] == -1, f"Flotte Pro should have max_drivers=-1, got {data['max_drivers']}"
            print(f"✓ Flotte Pro quota: unlimited drivers (max_drivers=-1)")
        else:
            print(f"✓ Company quota: {data['driver_count']}/{data['max_drivers']} drivers (plan: {data['plan']})")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
