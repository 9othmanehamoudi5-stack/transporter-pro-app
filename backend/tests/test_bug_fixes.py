"""
Test suite for Transporter-Pro bug fixes:
1. Delivery creation - should succeed or show detailed error (not generic 'Erreur lors de la création')
2. Subscription plan change - should succeed or show detailed error (not 'Session expirée')
3. Promise.allSettled - dashboard should load even if some APIs fail
4. Error messages should show details (error.message) instead of generic text
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAuthEndpoints:
    """Authentication endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_admin_login_success(self):
        """Admin login should return user data and set cookies"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@transporter-pro.com",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "id" in data
        assert data["email"] == "admin@transporter-pro.com"
        assert data["role"] == "admin"
        # Check cookies are set
        assert "access_token" in response.cookies or len(self.session.cookies) > 0
        print("Admin login - PASS")
    
    def test_driver_login_success(self):
        """Driver login should return user data"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "driver@test.com",
            "password": "driver123"
        })
        assert response.status_code == 200, f"Driver login failed: {response.text}"
        data = response.json()
        assert data["email"] == "driver@test.com"
        assert data["role"] == "driver"
        print("Driver login - PASS")
    
    def test_auth_me_with_valid_cookie(self):
        """GET /api/auth/me with valid cookie should return user data"""
        # First login
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@transporter-pro.com",
            "password": "admin123"
        })
        assert login_resp.status_code == 200
        
        # Then check /me
        me_resp = self.session.get(f"{BASE_URL}/api/auth/me")
        assert me_resp.status_code == 200, f"/me failed: {me_resp.text}"
        data = me_resp.json()
        assert data["email"] == "admin@transporter-pro.com"
        print("Auth /me - PASS")
    
    def test_auth_refresh_works(self):
        """POST /api/auth/refresh should refresh token"""
        # First login
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@transporter-pro.com",
            "password": "admin123"
        })
        assert login_resp.status_code == 200
        
        # Then refresh
        refresh_resp = self.session.post(f"{BASE_URL}/api/auth/refresh")
        assert refresh_resp.status_code == 200, f"Refresh failed: {refresh_resp.text}"
        print("Auth refresh - PASS")


class TestDeliveryCreation:
    """Test delivery creation - Bug fix #1"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login as admin
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@transporter-pro.com",
            "password": "admin123"
        })
        assert login_resp.status_code == 200, "Admin login failed for delivery tests"
    
    def test_create_delivery_with_valid_data(self):
        """Creating delivery with valid data should succeed"""
        response = self.session.post(f"{BASE_URL}/api/deliveries", json={
            "recipient_name": "TEST_BugFix_Recipient",
            "recipient_address": "123 Bug Fix Street, Paris",
            "recipient_phone": "0612345678",
            "package_description": "Bug fix test package",
            "weight_kg": 2.5
        })
        assert response.status_code in [200, 201], f"Delivery creation failed: {response.text}"
        data = response.json()
        assert "tracking_id" in data
        assert data["recipient_name"] == "TEST_BugFix_Recipient"
        print(f"Delivery created: {data['tracking_id']} - PASS")
    
    def test_create_delivery_missing_field_returns_detailed_error(self):
        """Creating delivery with missing field should return detailed error, not generic"""
        response = self.session.post(f"{BASE_URL}/api/deliveries", json={
            "recipient_name": "Test",
            # Missing recipient_address, recipient_phone, etc.
        })
        # Should return 422 with detailed validation error
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"
        data = response.json()
        # Check that error has detail field with specific info
        assert "detail" in data
        # Detail should contain field-specific error info
        detail = data["detail"]
        if isinstance(detail, list):
            # Pydantic validation errors
            assert len(detail) > 0
            assert any("loc" in err or "msg" in err for err in detail)
            print(f"Detailed validation error returned: {detail} - PASS")
        else:
            print(f"Error detail: {detail} - PASS")
    
    def test_create_delivery_without_auth_returns_401(self):
        """Creating delivery without auth should return 401"""
        new_session = requests.Session()
        response = new_session.post(f"{BASE_URL}/api/deliveries", json={
            "recipient_name": "Test",
            "recipient_address": "123 Test St",
            "recipient_phone": "0612345678",
            "package_description": "Test",
            "weight_kg": 1.0
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("Delivery without auth returns 401 - PASS")


class TestSubscriptionUpdate:
    """Test subscription plan change - Bug fix #2"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login as admin
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@transporter-pro.com",
            "password": "admin123"
        })
        assert login_resp.status_code == 200, "Admin login failed for subscription tests"
    
    def test_update_subscription_to_croissance(self):
        """Changing plan to 'croissance' should succeed"""
        response = self.session.post(f"{BASE_URL}/api/subscription/update", json={
            "plan": "croissance",
            "billing_cycle": "monthly"
        })
        assert response.status_code == 200, f"Subscription update failed: {response.text}"
        data = response.json()
        assert data["plan"] == "croissance"
        print("Subscription update to croissance - PASS")
    
    def test_update_subscription_to_flotte_pro(self):
        """Changing plan to 'flotte_pro' should succeed"""
        response = self.session.post(f"{BASE_URL}/api/subscription/update", json={
            "plan": "flotte_pro",
            "billing_cycle": "yearly"
        })
        assert response.status_code == 200, f"Subscription update failed: {response.text}"
        data = response.json()
        assert data["plan"] == "flotte_pro"
        print("Subscription update to flotte_pro - PASS")
    
    def test_update_subscription_to_solo(self):
        """Changing plan to 'solo' should succeed"""
        response = self.session.post(f"{BASE_URL}/api/subscription/update", json={
            "plan": "solo",
            "billing_cycle": "monthly"
        })
        assert response.status_code == 200, f"Subscription update failed: {response.text}"
        data = response.json()
        assert data["plan"] == "solo"
        print("Subscription update to solo - PASS")
    
    def test_update_subscription_invalid_plan_returns_detailed_error(self):
        """Invalid plan should return detailed error, not generic"""
        response = self.session.post(f"{BASE_URL}/api/subscription/update", json={
            "plan": "invalid_plan",
            "billing_cycle": "monthly"
        })
        # 400 or 422 are both acceptable for validation errors
        assert response.status_code in [400, 422], f"Expected 400/422, got {response.status_code}"
        data = response.json()
        assert "detail" in data
        # Should say "Plan invalide" or similar specific message
        print(f"Invalid plan error: {data['detail']} - PASS")
    
    def test_update_subscription_without_auth_returns_401(self):
        """Subscription update without auth should return 401, not 'Session expirée'"""
        new_session = requests.Session()
        response = new_session.post(f"{BASE_URL}/api/subscription/update", json={
            "plan": "croissance",
            "billing_cycle": "monthly"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        # The error should be a proper 401, not a redirect or generic error
        print("Subscription without auth returns 401 - PASS")
    
    def test_get_current_subscription(self):
        """GET /api/subscription/current should return current plan"""
        response = self.session.get(f"{BASE_URL}/api/subscription/current")
        assert response.status_code == 200, f"Get subscription failed: {response.text}"
        data = response.json()
        assert "plan" in data
        print(f"Current subscription: {data['plan']} - PASS")


class TestDashboardAPIs:
    """Test dashboard APIs - Bug fix #3 (Promise.allSettled)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login as admin
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@transporter-pro.com",
            "password": "admin123"
        })
        assert login_resp.status_code == 200, "Admin login failed for dashboard tests"
    
    def test_dashboard_stats(self):
        """GET /api/dashboard/stats should return stats"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/stats")
        assert response.status_code == 200, f"Dashboard stats failed: {response.text}"
        data = response.json()
        # Should have expected fields
        assert "total_deliveries" in data or "pending" in data
        print("Dashboard stats - PASS")
    
    def test_dashboard_cashflow(self):
        """GET /api/dashboard/cash-flow should return cash flow data"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/cash-flow")
        assert response.status_code == 200, f"Cash flow failed: {response.text}"
        data = response.json()
        assert "money_blocked_in_trucks" in data or "pending_invoices_count" in data
        print("Dashboard cash-flow - PASS")
    
    def test_deliveries_list(self):
        """GET /api/deliveries should return deliveries list"""
        response = self.session.get(f"{BASE_URL}/api/deliveries")
        assert response.status_code == 200, f"Deliveries list failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"Deliveries list ({len(data)} items) - PASS")
    
    def test_invoices_list(self):
        """GET /api/invoices should return invoices list"""
        response = self.session.get(f"{BASE_URL}/api/invoices")
        assert response.status_code == 200, f"Invoices list failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"Invoices list ({len(data)} items) - PASS")
    
    def test_admin_drivers_list(self):
        """GET /api/admin/drivers should return drivers list"""
        response = self.session.get(f"{BASE_URL}/api/admin/drivers")
        assert response.status_code == 200, f"Drivers list failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"Drivers list ({len(data)} items) - PASS")
    
    def test_damage_reports_list(self):
        """GET /api/damage-reports should return damage reports"""
        response = self.session.get(f"{BASE_URL}/api/damage-reports")
        assert response.status_code == 200, f"Damage reports failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"Damage reports ({len(data)} items) - PASS")
    
    def test_eco_scores_summary(self):
        """GET /api/eco-scores/summary should return eco scores"""
        response = self.session.get(f"{BASE_URL}/api/eco-scores/summary")
        assert response.status_code == 200, f"Eco scores failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"Eco scores summary ({len(data)} items) - PASS")
    
    def test_notifications_list(self):
        """GET /api/notifications should return notifications"""
        response = self.session.get(f"{BASE_URL}/api/notifications")
        assert response.status_code == 200, f"Notifications failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"Notifications ({len(data)} items) - PASS")
    
    def test_notifications_unread_count(self):
        """GET /api/notifications/unread-count should return count"""
        response = self.session.get(f"{BASE_URL}/api/notifications/unread-count")
        assert response.status_code == 200, f"Unread count failed: {response.text}"
        data = response.json()
        assert "count" in data
        print(f"Unread notifications: {data['count']} - PASS")


class TestDriverEndpoints:
    """Test driver-specific endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login as driver
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "driver@test.com",
            "password": "driver123"
        })
        assert login_resp.status_code == 200, "Driver login failed"
    
    def test_driver_can_get_deliveries(self):
        """Driver should be able to get their deliveries"""
        response = self.session.get(f"{BASE_URL}/api/deliveries")
        assert response.status_code == 200, f"Driver deliveries failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"Driver deliveries ({len(data)} items) - PASS")
    
    def test_driver_can_get_eco_scores(self):
        """Driver should be able to get eco scores"""
        response = self.session.get(f"{BASE_URL}/api/eco-scores")
        assert response.status_code == 200, f"Driver eco scores failed: {response.text}"
        print("Driver eco scores - PASS")
    
    def test_driver_can_get_stats(self):
        """Driver should be able to get dashboard stats"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/stats")
        assert response.status_code == 200, f"Driver stats failed: {response.text}"
        print("Driver stats - PASS")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
