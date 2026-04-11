"""
Test Dual Auth Strategy - Cookies + localStorage tokens
Tests the fix for 'Session expirée' / 'No refresh token' error on mobile.

Key features tested:
1. Login returns access_token and refresh_token in JSON body
2. GET /api/auth/me works with Authorization: Bearer header (no cookies needed)
3. POST /api/auth/refresh accepts refresh_token in JSON body (no cookie needed)
4. POST /api/auth/refresh returns new access_token in body
5. All protected endpoints work with Authorization header
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestDualAuthLogin:
    """Test login returns tokens in response body"""
    
    def test_admin_login_returns_tokens_in_body(self):
        """Login should return access_token and refresh_token in JSON body"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@transporter-pro.com",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        # Verify tokens are in response body
        assert "access_token" in data, "access_token missing from login response body"
        assert "refresh_token" in data, "refresh_token missing from login response body"
        assert len(data["access_token"]) > 50, "access_token seems too short"
        assert len(data["refresh_token"]) > 50, "refresh_token seems too short"
        
        # Verify user data is also returned
        assert data["email"] == "admin@transporter-pro.com"
        assert data["role"] == "admin"
        print(f"✓ Admin login returns tokens in body: access_token={data['access_token'][:20]}...")
    
    def test_driver_login_returns_tokens_in_body(self):
        """Driver login should also return tokens in body"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "driver@test.com",
            "password": "driver123"
        })
        assert response.status_code == 200, f"Driver login failed: {response.text}"
        
        data = response.json()
        assert "access_token" in data, "access_token missing from driver login"
        assert "refresh_token" in data, "refresh_token missing from driver login"
        assert data["role"] == "driver"
        print(f"✓ Driver login returns tokens in body")


class TestAuthMeWithBearerToken:
    """Test /api/auth/me works with Authorization header (no cookies)"""
    
    def test_auth_me_with_bearer_token_no_cookies(self):
        """GET /api/auth/me should work with just Authorization header"""
        # First login to get token
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@transporter-pro.com",
            "password": "admin123"
        })
        assert login_response.status_code == 200
        access_token = login_response.json()["access_token"]
        
        # Now call /me with ONLY Authorization header (no cookies)
        session = requests.Session()
        session.cookies.clear()  # Ensure no cookies
        
        response = session.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        assert response.status_code == 200, f"/me failed with Bearer token: {response.text}"
        data = response.json()
        assert data["email"] == "admin@transporter-pro.com"
        assert data["role"] == "admin"
        print(f"✓ /api/auth/me works with Bearer token (no cookies)")
    
    def test_auth_me_without_token_returns_401(self):
        """GET /api/auth/me without any auth should return 401"""
        session = requests.Session()
        session.cookies.clear()
        
        response = session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✓ /api/auth/me returns 401 without auth")


class TestRefreshTokenInBody:
    """Test refresh endpoint accepts token in body (not just cookie)"""
    
    def test_refresh_accepts_token_in_body(self):
        """POST /api/auth/refresh should accept refresh_token in JSON body"""
        # Login to get refresh token
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@transporter-pro.com",
            "password": "admin123"
        })
        assert login_response.status_code == 200
        refresh_token = login_response.json()["refresh_token"]
        
        # Call refresh with token in body (no cookies)
        session = requests.Session()
        session.cookies.clear()
        
        response = session.post(
            f"{BASE_URL}/api/auth/refresh",
            json={"refresh_token": refresh_token}
        )
        
        assert response.status_code == 200, f"Refresh failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "New access_token missing from refresh response"
        print(f"✓ /api/auth/refresh accepts token in body and returns new access_token")
    
    def test_refresh_returns_new_access_token(self):
        """Refresh should return a new access_token that works"""
        # Login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@transporter-pro.com",
            "password": "admin123"
        })
        refresh_token = login_response.json()["refresh_token"]
        
        # Refresh
        session = requests.Session()
        session.cookies.clear()
        refresh_response = session.post(
            f"{BASE_URL}/api/auth/refresh",
            json={"refresh_token": refresh_token}
        )
        new_access_token = refresh_response.json()["access_token"]
        
        # Use new token to call /me
        me_response = session.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {new_access_token}"}
        )
        
        assert me_response.status_code == 200, f"/me failed with refreshed token: {me_response.text}"
        print(f"✓ Refreshed access_token works for /api/auth/me")
    
    def test_refresh_without_token_returns_401(self):
        """Refresh without any token should return 401"""
        session = requests.Session()
        session.cookies.clear()
        
        response = session.post(f"{BASE_URL}/api/auth/refresh", json={})
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✓ /api/auth/refresh returns 401 without token")


class TestProtectedEndpointsWithBearerToken:
    """Test all protected endpoints work with Authorization header"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token for tests"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@transporter-pro.com",
            "password": "admin123"
        })
        self.admin_token = login_response.json()["access_token"]
        
        # Get driver token
        driver_login = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "driver@test.com",
            "password": "driver123"
        })
        self.driver_token = driver_login.json()["access_token"]
    
    def test_subscription_update_with_bearer_token(self):
        """POST /api/subscription/update should work with Bearer token"""
        session = requests.Session()
        session.cookies.clear()
        
        response = session.post(
            f"{BASE_URL}/api/subscription/update",
            json={"plan": "croissance", "billing_cycle": "monthly"},
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        assert response.status_code == 200, f"Subscription update failed: {response.text}"
        data = response.json()
        assert data["plan"] == "croissance"
        print(f"✓ POST /api/subscription/update works with Bearer token")
    
    def test_subscription_current_with_bearer_token(self):
        """GET /api/subscription/current should work with Bearer token"""
        session = requests.Session()
        session.cookies.clear()
        
        response = session.get(
            f"{BASE_URL}/api/subscription/current",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        assert response.status_code == 200, f"Get subscription failed: {response.text}"
        print(f"✓ GET /api/subscription/current works with Bearer token")
    
    def test_deliveries_create_with_bearer_token(self):
        """POST /api/deliveries should work with Bearer token"""
        session = requests.Session()
        session.cookies.clear()
        
        response = session.post(
            f"{BASE_URL}/api/deliveries",
            json={
                "recipient_name": "TEST_DualAuth_Recipient",
                "recipient_address": "123 Test Street",
                "recipient_phone": "0612345678",
                "package_description": "Test package for dual auth",
                "weight_kg": 2.5
            },
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        assert response.status_code == 200, f"Create delivery failed: {response.text}"
        data = response.json()
        assert "tracking_id" in data
        print(f"✓ POST /api/deliveries works with Bearer token: {data['tracking_id']}")
    
    def test_deliveries_list_with_bearer_token(self):
        """GET /api/deliveries should work with Bearer token"""
        session = requests.Session()
        session.cookies.clear()
        
        response = session.get(
            f"{BASE_URL}/api/deliveries",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        assert response.status_code == 200, f"Get deliveries failed: {response.text}"
        assert isinstance(response.json(), list)
        print(f"✓ GET /api/deliveries works with Bearer token")
    
    def test_dashboard_stats_with_bearer_token(self):
        """GET /api/dashboard/stats should work with Bearer token"""
        session = requests.Session()
        session.cookies.clear()
        
        response = session.get(
            f"{BASE_URL}/api/dashboard/stats",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        assert response.status_code == 200, f"Get stats failed: {response.text}"
        print(f"✓ GET /api/dashboard/stats works with Bearer token")
    
    def test_dashboard_cashflow_with_bearer_token(self):
        """GET /api/dashboard/cash-flow should work with Bearer token"""
        session = requests.Session()
        session.cookies.clear()
        
        response = session.get(
            f"{BASE_URL}/api/dashboard/cash-flow",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        assert response.status_code == 200, f"Get cash-flow failed: {response.text}"
        print(f"✓ GET /api/dashboard/cash-flow works with Bearer token")
    
    def test_admin_drivers_with_bearer_token(self):
        """GET /api/admin/drivers should work with Bearer token"""
        session = requests.Session()
        session.cookies.clear()
        
        response = session.get(
            f"{BASE_URL}/api/admin/drivers",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        assert response.status_code == 200, f"Get drivers failed: {response.text}"
        print(f"✓ GET /api/admin/drivers works with Bearer token")
    
    def test_invoices_with_bearer_token(self):
        """GET /api/invoices should work with Bearer token"""
        session = requests.Session()
        session.cookies.clear()
        
        response = session.get(
            f"{BASE_URL}/api/invoices",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        assert response.status_code == 200, f"Get invoices failed: {response.text}"
        print(f"✓ GET /api/invoices works with Bearer token")
    
    def test_notifications_with_bearer_token(self):
        """GET /api/notifications should work with Bearer token"""
        session = requests.Session()
        session.cookies.clear()
        
        response = session.get(
            f"{BASE_URL}/api/notifications",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        assert response.status_code == 200, f"Get notifications failed: {response.text}"
        print(f"✓ GET /api/notifications works with Bearer token")
    
    def test_driver_deliveries_with_bearer_token(self):
        """Driver GET /api/deliveries should work with Bearer token"""
        session = requests.Session()
        session.cookies.clear()
        
        response = session.get(
            f"{BASE_URL}/api/deliveries",
            headers={"Authorization": f"Bearer {self.driver_token}"}
        )
        
        assert response.status_code == 200, f"Driver get deliveries failed: {response.text}"
        print(f"✓ Driver GET /api/deliveries works with Bearer token")
    
    def test_driver_stats_with_bearer_token(self):
        """Driver GET /api/dashboard/stats should work with Bearer token"""
        session = requests.Session()
        session.cookies.clear()
        
        response = session.get(
            f"{BASE_URL}/api/dashboard/stats",
            headers={"Authorization": f"Bearer {self.driver_token}"}
        )
        
        assert response.status_code == 200, f"Driver get stats failed: {response.text}"
        print(f"✓ Driver GET /api/dashboard/stats works with Bearer token")


class TestSubscriptionPlanChanges:
    """Test subscription plan changes work without 'Session expirée' error"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@transporter-pro.com",
            "password": "admin123"
        })
        self.admin_token = login_response.json()["access_token"]
    
    def test_change_to_solo_plan(self):
        """Change to Solo plan should work"""
        session = requests.Session()
        session.cookies.clear()
        
        response = session.post(
            f"{BASE_URL}/api/subscription/update",
            json={"plan": "solo", "billing_cycle": "monthly"},
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        assert response.status_code == 200, f"Solo plan change failed: {response.text}"
        assert response.json()["plan"] == "solo"
        print(f"✓ Changed to Solo plan successfully")
    
    def test_change_to_croissance_plan(self):
        """Change to Croissance plan should work"""
        session = requests.Session()
        session.cookies.clear()
        
        response = session.post(
            f"{BASE_URL}/api/subscription/update",
            json={"plan": "croissance", "billing_cycle": "monthly"},
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        assert response.status_code == 200, f"Croissance plan change failed: {response.text}"
        assert response.json()["plan"] == "croissance"
        print(f"✓ Changed to Croissance plan successfully")
    
    def test_change_to_flotte_pro_plan(self):
        """Change to Flotte Pro plan should work"""
        session = requests.Session()
        session.cookies.clear()
        
        response = session.post(
            f"{BASE_URL}/api/subscription/update",
            json={"plan": "flotte_pro", "billing_cycle": "yearly"},
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        assert response.status_code == 200, f"Flotte Pro plan change failed: {response.text}"
        assert response.json()["plan"] == "flotte_pro"
        print(f"✓ Changed to Flotte Pro plan successfully")


class TestLogoutClearsTokens:
    """Test logout endpoint works"""
    
    def test_logout_returns_success(self):
        """POST /api/auth/logout should return success"""
        # Login first
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@transporter-pro.com",
            "password": "admin123"
        })
        token = login_response.json()["access_token"]
        
        # Logout
        response = requests.post(
            f"{BASE_URL}/api/auth/logout",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200, f"Logout failed: {response.text}"
        print(f"✓ Logout returns success")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
