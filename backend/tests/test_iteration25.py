"""
Iteration 25 Backend Tests
Tests for:
- SIRET verification endpoint
- Subscription plans endpoint
- Auth endpoints (login)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestSIRETVerification:
    """Tests for SIRET verification endpoint"""
    
    def test_verify_siret_valid_format(self):
        """Test SIRET verification with valid 14-digit format"""
        response = requests.get(f"{BASE_URL}/api/verify-siret/12345678900012")
        assert response.status_code == 200
        data = response.json()
        assert "valid" in data
        # Should return valid (either from API or fallback)
        print(f"SIRET 12345678900012 response: {data}")
    
    def test_verify_siret_invalid_length(self):
        """Test SIRET verification with invalid length (not 14 digits)"""
        response = requests.get(f"{BASE_URL}/api/verify-siret/123")
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == False
        assert "error" in data
        assert "14" in data["error"]  # Should mention 14 digits
        print(f"SIRET 123 (invalid) response: {data}")
    
    def test_verify_siret_with_spaces(self):
        """Test SIRET verification with spaces (should be cleaned)"""
        response = requests.get(f"{BASE_URL}/api/verify-siret/123 456 789 00012")
        assert response.status_code == 200
        data = response.json()
        # Should clean spaces and validate
        print(f"SIRET with spaces response: {data}")


class TestSubscriptionPlans:
    """Tests for subscription plans endpoint"""
    
    def test_get_subscription_plans(self):
        """Test getting subscription plans"""
        response = requests.get(f"{BASE_URL}/api/subscription/plans")
        assert response.status_code == 200
        data = response.json()
        
        # Verify solo plan exists with correct price
        assert "solo" in data
        assert data["solo"]["monthly_price"] == 19
        print(f"Solo plan: {data['solo']}")
        
        # Verify croissance plan
        assert "croissance" in data
        assert data["croissance"]["monthly_price"] == 189
        print(f"Croissance plan: {data['croissance']}")
        
        # Verify flotte_pro plan
        assert "flotte_pro" in data
        assert data["flotte_pro"]["monthly_price"] == 489
        print(f"Flotte Pro plan: {data['flotte_pro']}")


class TestAuth:
    """Tests for authentication endpoints"""
    
    def test_login_admin_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@transporter-pro.com", "password": "admin123"}
        )
        assert response.status_code == 200
        data = response.json()
        # Response returns user data directly (not nested under "user")
        assert "email" in data
        assert data["email"] == "admin@transporter-pro.com"
        assert data["role"] == "admin"
        assert "access_token" in data
        print(f"Admin login successful: {data['email']}")
    
    def test_login_driver_success(self):
        """Test driver login with valid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "driver@test.com", "password": "driver123"}
        )
        assert response.status_code == 200
        data = response.json()
        # Response returns user data directly (not nested under "user")
        assert "email" in data
        assert data["email"] == "driver@test.com"
        assert data["role"] == "driver"
        assert "access_token" in data
        print(f"Driver login successful: {data['email']}")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "wrong@example.com", "password": "wrongpass"}
        )
        assert response.status_code == 401
        print("Invalid credentials correctly rejected")


class TestHealthCheck:
    """Basic health check tests"""
    
    def test_api_health(self):
        """Test API is responding"""
        response = requests.get(f"{BASE_URL}/api/health")
        # Health endpoint might not exist, but we can check the base
        if response.status_code == 404:
            # Try auth/me without token - should return 401
            response = requests.get(f"{BASE_URL}/api/auth/me")
            assert response.status_code == 401
            print("API is responding (auth/me returns 401 without token)")
        else:
            assert response.status_code == 200
            print("Health check passed")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
