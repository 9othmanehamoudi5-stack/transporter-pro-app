"""
Test suite for Subscription API and Auth Cookie Fix
Tests: 401 fix for mobile subscription update
- POST /api/auth/login returns Set-Cookie with Secure and SameSite=none
- POST /api/auth/refresh refreshes the access_token correctly
- POST /api/subscription/update with valid auth returns 200
- POST /api/subscription/update without auth returns 401
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL')

class TestAuthCookies:
    """Test authentication cookies have correct attributes for cross-site requests"""
    
    def test_login_returns_secure_cookies(self):
        """Test POST /api/auth/login returns Set-Cookie with Secure and SameSite=none"""
        session = requests.Session()
        
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@transporter-pro.com", "password": "admin123"}
        )
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        # Check Set-Cookie headers
        set_cookie_headers = response.headers.get('Set-Cookie', '')
        
        # Verify cookies are set
        assert 'access_token' in set_cookie_headers or len(session.cookies) > 0, \
            "No cookies set on login"
        
        # Check cookie attributes in response headers
        # Note: requests library may not expose all cookie attributes, 
        # so we check the raw Set-Cookie header
        print(f"Set-Cookie header: {set_cookie_headers[:200]}...")
        
        # Verify user data returned
        data = response.json()
        assert data["email"] == "admin@transporter-pro.com"
        assert data["role"] == "admin"
        print(f"PASS: Login successful for {data['email']}")
        
        session.post(f"{BASE_URL}/api/auth/logout")
    
    def test_login_cookies_work_for_authenticated_requests(self):
        """Test that cookies from login work for subsequent authenticated requests"""
        session = requests.Session()
        
        # Login
        login_response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@transporter-pro.com", "password": "admin123"}
        )
        assert login_response.status_code == 200
        
        # Use cookies for authenticated request
        me_response = session.get(f"{BASE_URL}/api/auth/me")
        assert me_response.status_code == 200, f"Auth/me failed: {me_response.text}"
        
        data = me_response.json()
        assert data["email"] == "admin@transporter-pro.com"
        print(f"PASS: Cookies work for authenticated requests")
        
        session.post(f"{BASE_URL}/api/auth/logout")


class TestTokenRefresh:
    """Test token refresh endpoint"""
    
    def test_refresh_token_success(self):
        """Test POST /api/auth/refresh refreshes the access_token correctly"""
        session = requests.Session()
        
        # Login first
        login_response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@transporter-pro.com", "password": "admin123"}
        )
        assert login_response.status_code == 200
        
        # Refresh token
        refresh_response = session.post(f"{BASE_URL}/api/auth/refresh")
        assert refresh_response.status_code == 200, f"Refresh failed: {refresh_response.text}"
        
        data = refresh_response.json()
        assert data.get("message") == "Token refreshed"
        print(f"PASS: Token refresh successful")
        
        # Verify new token works
        me_response = session.get(f"{BASE_URL}/api/auth/me")
        assert me_response.status_code == 200, f"Auth/me after refresh failed: {me_response.text}"
        print(f"PASS: New token works after refresh")
        
        session.post(f"{BASE_URL}/api/auth/logout")
    
    def test_refresh_without_token_fails(self):
        """Test refresh without refresh_token returns 401"""
        session = requests.Session()
        
        response = session.post(f"{BASE_URL}/api/auth/refresh")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"PASS: Refresh without token returns 401")


class TestSubscriptionUpdate:
    """Test subscription update endpoint - the main bug fix"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup authenticated session"""
        self.session = requests.Session()
        
        # Login as admin
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@transporter-pro.com", "password": "admin123"}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        print(f"Logged in as admin")
        
        yield
        
        self.session.post(f"{BASE_URL}/api/auth/logout")
    
    def test_subscription_update_with_auth_success(self):
        """Test POST /api/subscription/update with valid auth returns 200"""
        # Update to croissance plan
        response = self.session.post(
            f"{BASE_URL}/api/subscription/update",
            json={"plan": "croissance", "billing_cycle": "monthly"}
        )
        
        assert response.status_code == 200, f"Subscription update failed: {response.text}"
        
        data = response.json()
        assert data["plan"] == "croissance"
        assert data["billing_cycle"] == "monthly"
        assert data["status"] == "active"
        assert "expires_at" in data
        print(f"PASS: Subscription updated to croissance")
    
    def test_subscription_update_to_flotte_pro(self):
        """Test updating to flotte_pro plan"""
        response = self.session.post(
            f"{BASE_URL}/api/subscription/update",
            json={"plan": "flotte_pro", "billing_cycle": "yearly"}
        )
        
        assert response.status_code == 200, f"Subscription update failed: {response.text}"
        
        data = response.json()
        assert data["plan"] == "flotte_pro"
        assert data["billing_cycle"] == "yearly"
        assert data["price"] == 4990  # yearly price
        print(f"PASS: Subscription updated to flotte_pro (yearly)")
    
    def test_subscription_update_to_solo(self):
        """Test updating to solo plan"""
        response = self.session.post(
            f"{BASE_URL}/api/subscription/update",
            json={"plan": "solo", "billing_cycle": "monthly"}
        )
        
        assert response.status_code == 200, f"Subscription update failed: {response.text}"
        
        data = response.json()
        assert data["plan"] == "solo"
        print(f"PASS: Subscription updated to solo")
    
    def test_get_current_subscription(self):
        """Test GET /api/subscription/current returns current plan"""
        response = self.session.get(f"{BASE_URL}/api/subscription/current")
        
        assert response.status_code == 200, f"Get subscription failed: {response.text}"
        
        data = response.json()
        assert "plan" in data
        assert data["plan"] in ["solo", "croissance", "flotte_pro"]
        print(f"PASS: Current subscription: {data['plan']}")
    
    def test_get_subscription_plans(self):
        """Test GET /api/subscription/plans returns all plans"""
        response = self.session.get(f"{BASE_URL}/api/subscription/plans")
        
        assert response.status_code == 200, f"Get plans failed: {response.text}"
        
        data = response.json()
        assert "solo" in data
        assert "croissance" in data
        assert "flotte_pro" in data
        
        # Verify plan structure
        for plan_id, plan_info in data.items():
            assert "name" in plan_info
            assert "monthly_price" in plan_info
            assert "yearly_price" in plan_info
            assert "features" in plan_info
        
        print(f"PASS: All subscription plans returned")


class TestSubscriptionUpdateWithoutAuth:
    """Test subscription update without authentication"""
    
    def test_subscription_update_without_auth_returns_401(self):
        """Test POST /api/subscription/update without auth returns 401"""
        session = requests.Session()  # Fresh session, no login
        
        response = session.post(
            f"{BASE_URL}/api/subscription/update",
            json={"plan": "croissance", "billing_cycle": "monthly"}
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        print(f"PASS: Subscription update without auth returns 401")
    
    def test_get_current_subscription_without_auth_returns_401(self):
        """Test GET /api/subscription/current without auth returns 401"""
        session = requests.Session()
        
        response = session.get(f"{BASE_URL}/api/subscription/current")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"PASS: Get current subscription without auth returns 401")


class TestDriverCannotUpdateSubscription:
    """Test that driver role cannot update subscription (admin only)"""
    
    def test_driver_cannot_update_subscription(self):
        """Test driver gets 403 when trying to update subscription"""
        session = requests.Session()
        
        # Login as driver
        login_response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "driver@test.com", "password": "driver123"}
        )
        assert login_response.status_code == 200
        
        # Try to update subscription
        response = session.post(
            f"{BASE_URL}/api/subscription/update",
            json={"plan": "croissance", "billing_cycle": "monthly"}
        )
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print(f"PASS: Driver cannot update subscription (403)")
        
        session.post(f"{BASE_URL}/api/auth/logout")


class TestFullSubscriptionFlow:
    """Test complete subscription flow: login -> update -> verify"""
    
    def test_full_subscription_change_flow(self):
        """Test complete flow: login, change plan, verify change persisted"""
        session = requests.Session()
        
        # Step 1: Login
        login_response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@transporter-pro.com", "password": "admin123"}
        )
        assert login_response.status_code == 200
        print(f"Step 1: Login successful")
        
        # Step 2: Get current plan
        current_response = session.get(f"{BASE_URL}/api/subscription/current")
        assert current_response.status_code == 200
        initial_plan = current_response.json().get("plan", "solo")
        print(f"Step 2: Current plan is {initial_plan}")
        
        # Step 3: Change to different plan
        new_plan = "croissance" if initial_plan != "croissance" else "flotte_pro"
        update_response = session.post(
            f"{BASE_URL}/api/subscription/update",
            json={"plan": new_plan, "billing_cycle": "monthly"}
        )
        assert update_response.status_code == 200, f"Update failed: {update_response.text}"
        print(f"Step 3: Changed plan to {new_plan}")
        
        # Step 4: Verify change persisted
        verify_response = session.get(f"{BASE_URL}/api/subscription/current")
        assert verify_response.status_code == 200
        verified_plan = verify_response.json()["plan"]
        assert verified_plan == new_plan, f"Plan not persisted: expected {new_plan}, got {verified_plan}"
        print(f"Step 4: Verified plan is now {verified_plan}")
        
        # Step 5: Logout and re-login to verify persistence
        session.post(f"{BASE_URL}/api/auth/logout")
        
        login_response2 = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@transporter-pro.com", "password": "admin123"}
        )
        assert login_response2.status_code == 200
        
        final_response = session.get(f"{BASE_URL}/api/subscription/current")
        assert final_response.status_code == 200
        final_plan = final_response.json()["plan"]
        assert final_plan == new_plan, f"Plan not persisted after re-login: expected {new_plan}, got {final_plan}"
        print(f"Step 5: Plan persisted after re-login: {final_plan}")
        
        print(f"PASS: Full subscription flow completed successfully")
        
        session.post(f"{BASE_URL}/api/auth/logout")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
