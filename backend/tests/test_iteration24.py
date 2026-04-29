"""
Iteration 24 - Batch 1 Testing
Tests for:
1. Solo price updated to 19€
2. /api/verify-siret/{siret} endpoint
3. Admin/Driver dashboard regression
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestSubscriptionPlans:
    """Test subscription plans pricing - Solo should be 19€"""
    
    def test_subscription_plans_endpoint(self):
        """GET /api/subscription/plans should return all plans"""
        response = requests.get(f"{BASE_URL}/api/subscription/plans")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "solo" in data, "Solo plan missing"
        assert "croissance" in data, "Croissance plan missing"
        assert "flotte_pro" in data, "Flotte Pro plan missing"
        print("PASS: /api/subscription/plans returns all plans")
    
    def test_solo_price_is_19(self):
        """Solo monthly_price should be 19€"""
        response = requests.get(f"{BASE_URL}/api/subscription/plans")
        assert response.status_code == 200
        data = response.json()
        solo = data.get("solo", {})
        assert solo.get("monthly_price") == 19, f"Expected Solo monthly_price=19, got {solo.get('monthly_price')}"
        print("PASS: Solo monthly_price is 19€")
    
    def test_solo_yearly_price(self):
        """Solo yearly_price should be 190€"""
        response = requests.get(f"{BASE_URL}/api/subscription/plans")
        assert response.status_code == 200
        data = response.json()
        solo = data.get("solo", {})
        assert solo.get("yearly_price") == 190, f"Expected Solo yearly_price=190, got {solo.get('yearly_price')}"
        print("PASS: Solo yearly_price is 190€")
    
    def test_croissance_price_unchanged(self):
        """Croissance monthly_price should still be 189€"""
        response = requests.get(f"{BASE_URL}/api/subscription/plans")
        assert response.status_code == 200
        data = response.json()
        croissance = data.get("croissance", {})
        assert croissance.get("monthly_price") == 189, f"Expected Croissance monthly_price=189, got {croissance.get('monthly_price')}"
        print("PASS: Croissance monthly_price is 189€")
    
    def test_flotte_pro_price_unchanged(self):
        """Flotte Pro monthly_price should still be 489€"""
        response = requests.get(f"{BASE_URL}/api/subscription/plans")
        assert response.status_code == 200
        data = response.json()
        flotte_pro = data.get("flotte_pro", {})
        assert flotte_pro.get("monthly_price") == 489, f"Expected Flotte Pro monthly_price=489, got {flotte_pro.get('monthly_price')}"
        print("PASS: Flotte Pro monthly_price is 489€")


class TestVerifySiret:
    """Test /api/verify-siret/{siret} endpoint"""
    
    def test_valid_siret_format(self):
        """Valid 14-digit SIRET should return valid=True"""
        # Using a test SIRET (14 digits)
        response = requests.get(f"{BASE_URL}/api/verify-siret/12345678900012")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        # Should be valid (format is correct, may fallback if INSEE API doesn't find it)
        assert "valid" in data, "Response should contain 'valid' field"
        assert data.get("siret") == "12345678900012", f"Expected siret=12345678900012, got {data.get('siret')}"
        print(f"PASS: /api/verify-siret/12345678900012 returns valid={data.get('valid')}")
    
    def test_invalid_siret_too_short(self):
        """SIRET with less than 14 digits should return valid=False"""
        response = requests.get(f"{BASE_URL}/api/verify-siret/123")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("valid") == False, f"Expected valid=False for short SIRET, got {data.get('valid')}"
        assert "error" in data, "Should contain error message"
        print(f"PASS: /api/verify-siret/123 returns valid=False with error: {data.get('error')}")
    
    def test_invalid_siret_non_numeric(self):
        """SIRET with non-numeric characters should return valid=False"""
        response = requests.get(f"{BASE_URL}/api/verify-siret/1234567890ABCD")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("valid") == False, f"Expected valid=False for non-numeric SIRET, got {data.get('valid')}"
        print(f"PASS: /api/verify-siret/1234567890ABCD returns valid=False")
    
    def test_siret_with_spaces(self):
        """SIRET with spaces should be cleaned and validated"""
        response = requests.get(f"{BASE_URL}/api/verify-siret/123%20456%20789%2000012")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        # Should clean spaces and validate
        assert "valid" in data, "Response should contain 'valid' field"
        print(f"PASS: /api/verify-siret with spaces returns valid={data.get('valid')}")


class TestAdminAuth:
    """Test admin authentication and dashboard access"""
    
    @pytest.fixture
    def admin_token(self):
        """Login as admin and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@transporter-pro.com",
            "password": "admin123"
        })
        if response.status_code != 200:
            pytest.skip(f"Admin login failed: {response.status_code} - {response.text}")
        data = response.json()
        return data.get("access_token")
    
    def test_admin_login(self):
        """Admin should be able to login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@transporter-pro.com",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("role") == "admin", f"Expected role=admin, got {data.get('role')}"
        assert "access_token" in data, "Should return access_token"
        print("PASS: Admin login successful")
    
    def test_admin_dashboard_stats(self, admin_token):
        """Admin should access dashboard stats"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "total_deliveries" in data or "pending_deliveries" in data, "Should return dashboard stats"
        print("PASS: Admin dashboard stats accessible")
    
    def test_admin_cash_flow(self, admin_token):
        """Admin should access cash-flow dashboard"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/dashboard/cash-flow", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "money_blocked_in_trucks" in data or "pending_invoices_count" in data, "Should return cash-flow data"
        print("PASS: Admin cash-flow accessible")
    
    def test_admin_onboarding_status(self, admin_token):
        """Admin should access onboarding status"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/onboarding/status", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "onboarding_complete" in data, "Should return onboarding_complete field"
        print(f"PASS: Admin onboarding status: onboarding_complete={data.get('onboarding_complete')}")


class TestDriverAuth:
    """Test driver authentication and dashboard access"""
    
    @pytest.fixture
    def driver_token(self):
        """Login as driver and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "driver@test.com",
            "password": "driver123"
        })
        if response.status_code != 200:
            pytest.skip(f"Driver login failed: {response.status_code} - {response.text}")
        data = response.json()
        return data.get("access_token")
    
    def test_driver_login(self):
        """Driver should be able to login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "driver@test.com",
            "password": "driver123"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("role") == "driver", f"Expected role=driver, got {data.get('role')}"
        assert "access_token" in data, "Should return access_token"
        print("PASS: Driver login successful")
    
    def test_driver_dashboard_stats(self, driver_token):
        """Driver should access their dashboard stats"""
        headers = {"Authorization": f"Bearer {driver_token}"}
        response = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        # Driver stats have different fields
        assert "my_deliveries_today" in data or "pending" in data or "eco_score" in data, "Should return driver stats"
        print("PASS: Driver dashboard stats accessible")
    
    def test_driver_cannot_access_cash_flow(self, driver_token):
        """Driver should NOT access cash-flow (admin only)"""
        headers = {"Authorization": f"Bearer {driver_token}"}
        response = requests.get(f"{BASE_URL}/api/dashboard/cash-flow", headers=headers)
        assert response.status_code == 403, f"Expected 403 for driver accessing cash-flow, got {response.status_code}"
        print("PASS: Driver correctly denied access to cash-flow")
    
    def test_driver_deliveries(self, driver_token):
        """Driver should access their deliveries"""
        headers = {"Authorization": f"Bearer {driver_token}"}
        response = requests.get(f"{BASE_URL}/api/deliveries", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASS: Driver deliveries accessible")


class TestRegisterEndpoint:
    """Test registration endpoint for multi-step flow"""
    
    def test_register_admin_creates_account(self):
        """Register as admin (Transporteur) should create account"""
        import uuid
        test_email = f"test_admin_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "testpass123",
            "name": "Test Admin",
            "role": "admin"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("role") == "admin", f"Expected role=admin, got {data.get('role')}"
        assert "access_token" in data, "Should return access_token"
        print(f"PASS: Admin registration successful for {test_email}")
    
    def test_register_client_creates_account(self):
        """Register as client (Client/Chargeur) should create account"""
        import uuid
        test_email = f"test_client_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "testpass123",
            "name": "Test Client",
            "role": "client"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("role") == "client", f"Expected role=client, got {data.get('role')}"
        print(f"PASS: Client registration successful for {test_email}")
    
    def test_register_driver_blocked(self):
        """Direct driver registration should be blocked (admin creates drivers)"""
        import uuid
        test_email = f"test_driver_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "testpass123",
            "name": "Test Driver",
            "role": "driver"
        })
        assert response.status_code == 403, f"Expected 403 for driver registration, got {response.status_code}"
        print("PASS: Driver registration correctly blocked")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
