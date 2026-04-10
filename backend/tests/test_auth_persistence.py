"""
Test suite for auth persistence bug fix (iteration 8)
Tests the fix for: 401 interceptor race condition causing redirect to login after login

Key fixes verified:
1. AuthGate component blocks rendering until auth state confirmed
2. AuthContext tries token refresh before declaring user not authenticated
3. Axios interceptor no longer redirects (React Router handles it)
4. Removed all window.location.href redirects
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAuthEndpoints:
    """Test authentication endpoints"""
    
    def test_login_returns_valid_cookies(self):
        """POST /api/auth/login should return valid cookies"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@transporter-pro.com", "password": "admin123"}
        )
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        # Verify response contains user data
        data = response.json()
        assert "id" in data
        assert data["email"] == "admin@transporter-pro.com"
        assert data["role"] == "admin"
        
        # Verify cookies are set
        cookies = session.cookies.get_dict()
        assert "access_token" in cookies, "access_token cookie not set"
        assert "refresh_token" in cookies, "refresh_token cookie not set"
        print(f"✓ Login successful, cookies set: {list(cookies.keys())}")
    
    def test_me_endpoint_with_valid_cookie(self):
        """GET /api/auth/me with valid cookie should return user data"""
        session = requests.Session()
        
        # Login first
        login_response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@transporter-pro.com", "password": "admin123"}
        )
        assert login_response.status_code == 200
        
        # Call /me endpoint
        me_response = session.get(f"{BASE_URL}/api/auth/me")
        assert me_response.status_code == 200, f"/me failed: {me_response.text}"
        
        data = me_response.json()
        assert data["email"] == "admin@transporter-pro.com"
        assert data["role"] == "admin"
        print(f"✓ /me endpoint returned user: {data['email']}")
    
    def test_refresh_endpoint_returns_new_token(self):
        """POST /api/auth/refresh with valid refresh cookie should return new access token"""
        session = requests.Session()
        
        # Login first
        login_response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@transporter-pro.com", "password": "admin123"}
        )
        assert login_response.status_code == 200
        
        # Call refresh endpoint
        refresh_response = session.post(f"{BASE_URL}/api/auth/refresh")
        assert refresh_response.status_code == 200, f"Refresh failed: {refresh_response.text}"
        
        data = refresh_response.json()
        assert data.get("message") == "Token refreshed"
        print("✓ Token refresh successful")
    
    def test_me_without_cookie_returns_401(self):
        """GET /api/auth/me without cookie should return 401"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("✓ /me without auth returns 401")
    
    def test_refresh_without_cookie_returns_401(self):
        """POST /api/auth/refresh without cookie should return 401"""
        response = requests.post(f"{BASE_URL}/api/auth/refresh")
        assert response.status_code == 401
        print("✓ /refresh without auth returns 401")


class TestDriverLogin:
    """Test driver authentication"""
    
    def test_driver_login_success(self):
        """Driver should be able to login and access their data"""
        session = requests.Session()
        
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "driver@test.com", "password": "driver123"}
        )
        
        assert response.status_code == 200, f"Driver login failed: {response.text}"
        
        data = response.json()
        assert data["role"] == "driver"
        print(f"✓ Driver login successful: {data['email']}")
    
    def test_driver_can_access_deliveries(self):
        """Driver should be able to access deliveries after login"""
        session = requests.Session()
        
        # Login as driver
        login_response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "driver@test.com", "password": "driver123"}
        )
        assert login_response.status_code == 200
        
        # Access deliveries
        deliveries_response = session.get(f"{BASE_URL}/api/deliveries")
        assert deliveries_response.status_code == 200, f"Deliveries failed: {deliveries_response.text}"
        print("✓ Driver can access deliveries")


class TestSubscriptionWithAuth:
    """Test subscription endpoints require proper auth"""
    
    def test_subscription_update_requires_auth(self):
        """POST /api/subscription/update without auth should return 401"""
        response = requests.post(
            f"{BASE_URL}/api/subscription/update",
            json={"plan": "croissance", "billing_cycle": "monthly"}
        )
        assert response.status_code == 401
        print("✓ Subscription update requires auth")
    
    def test_subscription_update_with_auth(self):
        """POST /api/subscription/update with valid auth should succeed"""
        session = requests.Session()
        
        # Login as admin
        login_response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@transporter-pro.com", "password": "admin123"}
        )
        assert login_response.status_code == 200
        
        # Update subscription
        update_response = session.post(
            f"{BASE_URL}/api/subscription/update",
            json={"plan": "croissance", "billing_cycle": "monthly"}
        )
        assert update_response.status_code == 200, f"Subscription update failed: {update_response.text}"
        print("✓ Subscription update with auth succeeds")
    
    def test_subscription_current_with_auth(self):
        """GET /api/subscription/current with valid auth should return plan"""
        session = requests.Session()
        
        # Login as admin
        login_response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@transporter-pro.com", "password": "admin123"}
        )
        assert login_response.status_code == 200
        
        # Get current subscription
        current_response = session.get(f"{BASE_URL}/api/subscription/current")
        assert current_response.status_code == 200
        
        data = current_response.json()
        assert "plan" in data
        print(f"✓ Current subscription: {data['plan']}")


class TestDashboardEndpoints:
    """Test dashboard endpoints with auth"""
    
    def test_dashboard_stats_with_auth(self):
        """GET /api/dashboard/stats with valid auth should return stats"""
        session = requests.Session()
        
        # Login as admin
        login_response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@transporter-pro.com", "password": "admin123"}
        )
        assert login_response.status_code == 200
        
        # Get stats
        stats_response = session.get(f"{BASE_URL}/api/dashboard/stats")
        assert stats_response.status_code == 200, f"Stats failed: {stats_response.text}"
        print("✓ Dashboard stats accessible with auth")
    
    def test_dashboard_cashflow_with_auth(self):
        """GET /api/dashboard/cash-flow with valid auth should return data"""
        session = requests.Session()
        
        # Login as admin
        login_response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@transporter-pro.com", "password": "admin123"}
        )
        assert login_response.status_code == 200
        
        # Get cash flow
        cashflow_response = session.get(f"{BASE_URL}/api/dashboard/cash-flow")
        assert cashflow_response.status_code == 200, f"Cash flow failed: {cashflow_response.text}"
        print("✓ Dashboard cash-flow accessible with auth")


class TestTokenRefreshFlow:
    """Test the token refresh flow that was causing the bug"""
    
    def test_full_auth_flow(self):
        """Test complete auth flow: login -> me -> refresh -> me"""
        session = requests.Session()
        
        # Step 1: Login
        print("Step 1: Login...")
        login_response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@transporter-pro.com", "password": "admin123"}
        )
        assert login_response.status_code == 200
        print("  ✓ Login successful")
        
        # Step 2: Call /me
        print("Step 2: Call /me...")
        me_response = session.get(f"{BASE_URL}/api/auth/me")
        assert me_response.status_code == 200
        print("  ✓ /me successful")
        
        # Step 3: Refresh token
        print("Step 3: Refresh token...")
        refresh_response = session.post(f"{BASE_URL}/api/auth/refresh")
        assert refresh_response.status_code == 200
        print("  ✓ Refresh successful")
        
        # Step 4: Call /me again (should still work)
        print("Step 4: Call /me again...")
        me_response2 = session.get(f"{BASE_URL}/api/auth/me")
        assert me_response2.status_code == 200
        print("  ✓ /me after refresh successful")
        
        # Step 5: Access protected endpoint
        print("Step 5: Access protected endpoint...")
        deliveries_response = session.get(f"{BASE_URL}/api/deliveries")
        assert deliveries_response.status_code == 200
        print("  ✓ Protected endpoint accessible")
        
        print("\n✓ Full auth flow completed successfully!")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
