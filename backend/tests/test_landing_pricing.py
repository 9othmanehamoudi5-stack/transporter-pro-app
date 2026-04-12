"""
Test suite for Landing Page Pricing and Trial Logic - Iteration 16
Tests: Subscription plans API, auth/me with trial fields, admin/driver dashboard regression
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestSubscriptionPlans:
    """Test subscription plans endpoint with updated prices"""
    
    def test_get_subscription_plans(self):
        """GET /api/subscription/plans returns all plans with correct prices"""
        response = requests.get(f"{BASE_URL}/api/subscription/plans")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        plans = response.json()
        
        # Verify all 3 plans exist
        assert "solo" in plans, "Solo plan missing"
        assert "croissance" in plans, "Croissance plan missing"
        assert "flotte_pro" in plans, "Flotte Pro plan missing"
        
        # Verify Solo plan prices (49€ monthly, 39€ yearly)
        solo = plans["solo"]
        assert solo["monthly_price"] == 49, f"Solo monthly should be 49, got {solo['monthly_price']}"
        assert solo["yearly_price"] == 39, f"Solo yearly should be 39, got {solo['yearly_price']}"
        assert solo["max_trucks"] == 3, f"Solo max_trucks should be 3, got {solo['max_trucks']}"
        
        # Verify Croissance plan prices (149€ monthly, 119€ yearly)
        croissance = plans["croissance"]
        assert croissance["monthly_price"] == 149, f"Croissance monthly should be 149, got {croissance['monthly_price']}"
        assert croissance["yearly_price"] == 119, f"Croissance yearly should be 119, got {croissance['yearly_price']}"
        assert croissance["max_trucks"] == 15, f"Croissance max_trucks should be 15, got {croissance['max_trucks']}"
        
        # Verify Flotte Pro plan prices (499€ monthly, 399€ yearly)
        flotte_pro = plans["flotte_pro"]
        assert flotte_pro["monthly_price"] == 499, f"Flotte Pro monthly should be 499, got {flotte_pro['monthly_price']}"
        assert flotte_pro["yearly_price"] == 399, f"Flotte Pro yearly should be 399, got {flotte_pro['yearly_price']}"
        assert flotte_pro["max_trucks"] == -1, f"Flotte Pro max_trucks should be -1 (unlimited), got {flotte_pro['max_trucks']}"
        
        print("✓ All subscription plans have correct prices")


class TestAuthWithTrialFields:
    """Test auth/me endpoint returns subscription_status and trial_ends_at"""
    
    @pytest.fixture
    def admin_session(self):
        """Login as admin and return session with cookies"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@transporter-pro.com",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        return session
    
    @pytest.fixture
    def driver_session(self):
        """Login as driver and return session with cookies"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "driver@test.com",
            "password": "driver123"
        })
        assert response.status_code == 200, f"Driver login failed: {response.text}"
        return session
    
    def test_auth_me_returns_subscription_status(self, admin_session):
        """GET /api/auth/me returns subscription_status field"""
        response = admin_session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "subscription_status" in data, "subscription_status field missing from /api/auth/me"
        print(f"✓ subscription_status: {data['subscription_status']}")
    
    def test_auth_me_returns_trial_ends_at(self, admin_session):
        """GET /api/auth/me returns trial_ends_at field"""
        response = admin_session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "trial_ends_at" in data, "trial_ends_at field missing from /api/auth/me"
        print(f"✓ trial_ends_at: {data['trial_ends_at']}")
    
    def test_auth_me_returns_company_id_and_plan(self, admin_session):
        """GET /api/auth/me returns company_id and plan fields"""
        response = admin_session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "company_id" in data, "company_id field missing"
        assert "plan" in data, "plan field missing"
        print(f"✓ company_id: {data['company_id']}, plan: {data['plan']}")


class TestAdminDashboardRegression:
    """Regression tests for admin dashboard functionality"""
    
    @pytest.fixture
    def admin_session(self):
        """Login as admin and return session with cookies"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@transporter-pro.com",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        return session
    
    def test_admin_login(self, admin_session):
        """Admin can login successfully"""
        response = admin_session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "admin"
        print(f"✓ Admin login successful: {data['email']}")
    
    def test_company_quota_endpoint(self, admin_session):
        """GET /api/auth/company-quota returns quota info"""
        response = admin_session.get(f"{BASE_URL}/api/auth/company-quota")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "driver_count" in data, "driver_count missing"
        assert "max_drivers" in data, "max_drivers missing"
        assert "plan" in data, "plan missing"
        assert "can_add" in data, "can_add missing"
        print(f"✓ Company quota: {data['driver_count']}/{data['max_drivers']} drivers, plan: {data['plan']}")
    
    def test_admin_drivers_list(self, admin_session):
        """GET /api/admin/drivers returns driver list"""
        response = admin_session.get(f"{BASE_URL}/api/admin/drivers")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        drivers = response.json()
        assert isinstance(drivers, list), "Expected list of drivers"
        print(f"✓ Admin drivers list: {len(drivers)} drivers")
    
    def test_dashboard_stats(self, admin_session):
        """GET /api/dashboard/stats returns admin stats"""
        response = admin_session.get(f"{BASE_URL}/api/dashboard/stats")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        stats = response.json()
        assert "total_deliveries" in stats, "total_deliveries missing"
        assert "active_drivers" in stats, "active_drivers missing"
        print(f"✓ Dashboard stats: {stats['total_deliveries']} deliveries, {stats['active_drivers']} drivers")


class TestDriverDashboardRegression:
    """Regression tests for driver dashboard functionality"""
    
    @pytest.fixture
    def driver_session(self):
        """Login as driver and return session with cookies"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "driver@test.com",
            "password": "driver123"
        })
        assert response.status_code == 200, f"Driver login failed: {response.text}"
        return session
    
    def test_driver_login(self, driver_session):
        """Driver can login successfully"""
        response = driver_session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "driver"
        print(f"✓ Driver login successful: {data['email']}")
    
    def test_driver_dashboard_stats(self, driver_session):
        """GET /api/dashboard/stats returns driver stats"""
        response = driver_session.get(f"{BASE_URL}/api/dashboard/stats")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        stats = response.json()
        assert "eco_score" in stats, "eco_score missing from driver stats"
        print(f"✓ Driver stats: eco_score={stats['eco_score']}")
    
    def test_driver_deliveries(self, driver_session):
        """GET /api/deliveries returns driver's deliveries"""
        response = driver_session.get(f"{BASE_URL}/api/deliveries")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        deliveries = response.json()
        assert isinstance(deliveries, list), "Expected list of deliveries"
        print(f"✓ Driver deliveries: {len(deliveries)} deliveries")
    
    def test_driver_eco_scores(self, driver_session):
        """GET /api/eco-scores returns driver's eco scores"""
        response = driver_session.get(f"{BASE_URL}/api/eco-scores")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        scores = response.json()
        assert isinstance(scores, list), "Expected list of eco scores"
        print(f"✓ Driver eco scores: {len(scores)} entries")


class TestDriverRegistrationBlocked:
    """Test that driver registration is blocked (drivers created by admin only)"""
    
    def test_driver_registration_returns_403(self):
        """POST /api/auth/register with role=driver returns 403"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": "test_blocked_driver@test.com",
            "password": "test123",
            "name": "Test Blocked Driver",
            "role": "driver"
        })
        assert response.status_code == 403, f"Expected 403 for driver registration, got {response.status_code}"
        print("✓ Driver registration correctly blocked with 403")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
