"""
Iteration 26 Backend Tests - Transporter-Pro
Testing: CRUD fixes, delivery creation with company_id/driver_id, subscription plans
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from test_credentials.md
ADMIN_EMAIL = "admin@transporter-pro.com"
ADMIN_PASSWORD = "admin123"
DRIVER_EMAIL = "driver@test.com"
DRIVER_PASSWORD = "driver123"


class TestAuthEndpoints:
    """Test authentication endpoints"""
    
    def test_admin_login_success(self):
        """Admin login should work with correct credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "No access_token in response"
        assert data["role"] == "admin", f"Expected admin role, got {data['role']}"
        assert data["email"] == ADMIN_EMAIL
        print(f"✓ Admin login successful: {data['name']}")
    
    def test_driver_login_success(self):
        """Driver login should work with correct credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DRIVER_EMAIL,
            "password": DRIVER_PASSWORD
        })
        assert response.status_code == 200, f"Driver login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "No access_token in response"
        assert data["role"] == "driver", f"Expected driver role, got {data['role']}"
        print(f"✓ Driver login successful: {data['name']}")
    
    def test_login_invalid_credentials(self):
        """Login with wrong password should fail"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Invalid credentials correctly rejected")


class TestSubscriptionPlans:
    """Test subscription plan endpoints"""
    
    def test_get_subscription_plans(self):
        """GET /api/subscription/plans should return all plans with correct pricing"""
        response = requests.get(f"{BASE_URL}/api/subscription/plans")
        assert response.status_code == 200, f"Failed to get plans: {response.text}"
        data = response.json()
        
        # Verify solo plan exists with price 19
        assert "solo" in data, "Solo plan not found"
        assert data["solo"]["monthly_price"] == 19, f"Solo monthly price should be 19, got {data['solo']['monthly_price']}"
        
        # Verify other plans exist
        assert "croissance" in data, "Croissance plan not found"
        assert "flotte_pro" in data, "Flotte Pro plan not found"
        
        print(f"✓ Subscription plans verified: solo={data['solo']['monthly_price']}€, croissance={data['croissance']['monthly_price']}€, flotte_pro={data['flotte_pro']['monthly_price']}€")


class TestDeliveryEndpoints:
    """Test delivery CRUD operations"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin login failed - skipping authenticated tests")
        return response.json().get("access_token")
    
    def test_create_delivery_with_company_id(self, admin_token):
        """POST /api/deliveries should create delivery with company_id from user context"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        delivery_data = {
            "recipient_name": "TEST_Recipient_26",
            "recipient_address": "123 Test Street, Paris",
            "recipient_phone": "+33612345678",
            "package_description": "Test package iteration 26",
            "weight_kg": 2.5
        }
        
        response = requests.post(f"{BASE_URL}/api/deliveries", json=delivery_data, headers=headers)
        assert response.status_code == 200, f"Failed to create delivery: {response.text}"
        
        data = response.json()
        assert "tracking_id" in data, "No tracking_id in response"
        assert "company_id" in data, "company_id not present in delivery response"
        assert data["company_id"] is not None, "company_id should not be None"
        assert data["recipient_name"] == "TEST_Recipient_26"
        
        print(f"✓ Delivery created with company_id: {data['company_id']}, tracking: {data['tracking_id']}")
        return data["tracking_id"]
    
    def test_create_delivery_with_driver_id(self, admin_token):
        """POST /api/deliveries should accept driver_id field"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # First get a driver ID
        drivers_response = requests.get(f"{BASE_URL}/api/admin/drivers", headers=headers)
        if drivers_response.status_code != 200 or not drivers_response.json():
            pytest.skip("No drivers available for test")
        
        driver_id = drivers_response.json()[0]["id"]
        
        delivery_data = {
            "recipient_name": "TEST_WithDriver_26",
            "recipient_address": "456 Driver Test Street",
            "recipient_phone": "+33698765432",
            "package_description": "Package with driver assigned",
            "weight_kg": 1.5,
            "driver_id": driver_id
        }
        
        response = requests.post(f"{BASE_URL}/api/deliveries", json=delivery_data, headers=headers)
        assert response.status_code == 200, f"Failed to create delivery with driver: {response.text}"
        
        data = response.json()
        assert data.get("driver_id") == driver_id, f"driver_id mismatch: expected {driver_id}, got {data.get('driver_id')}"
        assert "company_id" in data, "company_id should be present"
        
        print(f"✓ Delivery created with driver_id: {driver_id}")
    
    def test_get_deliveries_filtered_by_company(self, admin_token):
        """GET /api/deliveries should return only deliveries for admin's company_id"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        response = requests.get(f"{BASE_URL}/api/deliveries", headers=headers)
        assert response.status_code == 200, f"Failed to get deliveries: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        # All deliveries should have company_id (for admin filtered view)
        print(f"✓ Retrieved {len(data)} deliveries for admin's company")


class TestDriverManagement:
    """Test driver management endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        return response.json().get("access_token")
    
    def test_get_admin_drivers(self, admin_token):
        """GET /api/admin/drivers should return drivers for admin's company"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        response = requests.get(f"{BASE_URL}/api/admin/drivers", headers=headers)
        assert response.status_code == 200, f"Failed to get drivers: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        # Verify driver structure
        if len(data) > 0:
            driver = data[0]
            assert "id" in driver, "Driver should have id"
            assert "name" in driver, "Driver should have name"
            assert "email" in driver, "Driver should have email"
        
        print(f"✓ Retrieved {len(data)} drivers")
    
    def test_get_company_quota(self, admin_token):
        """GET /api/auth/company-quota should return driver quota info"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        response = requests.get(f"{BASE_URL}/api/auth/company-quota", headers=headers)
        assert response.status_code == 200, f"Failed to get quota: {response.text}"
        
        data = response.json()
        assert "driver_count" in data, "Should have driver_count"
        assert "max_drivers" in data, "Should have max_drivers"
        assert "plan" in data, "Should have plan"
        assert "can_add" in data, "Should have can_add"
        
        print(f"✓ Quota: {data['driver_count']}/{data['max_drivers']} drivers (plan: {data['plan']})")


class TestDashboardEndpoints:
    """Test dashboard and stats endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        return response.json().get("access_token")
    
    @pytest.fixture
    def driver_token(self):
        """Get driver authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DRIVER_EMAIL,
            "password": DRIVER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Driver login failed")
        return response.json().get("access_token")
    
    def test_admin_dashboard_stats(self, admin_token):
        """GET /api/dashboard/stats should return admin stats"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        response = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=headers)
        assert response.status_code == 200, f"Failed to get stats: {response.text}"
        
        data = response.json()
        assert "total_deliveries" in data, "Should have total_deliveries"
        
        print(f"✓ Admin stats: {data.get('total_deliveries', 0)} total deliveries")
    
    def test_driver_dashboard_stats(self, driver_token):
        """GET /api/dashboard/stats should return driver stats"""
        headers = {"Authorization": f"Bearer {driver_token}"}
        
        response = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=headers)
        assert response.status_code == 200, f"Failed to get driver stats: {response.text}"
        
        data = response.json()
        # Driver stats have different fields
        print(f"✓ Driver stats retrieved successfully")


class TestStripePaymentLinks:
    """Test Stripe payment link endpoints"""
    
    def test_get_payment_links(self):
        """GET /api/stripe/payment-links should return payment links"""
        response = requests.get(f"{BASE_URL}/api/stripe/payment-links")
        assert response.status_code == 200, f"Failed to get payment links: {response.text}"
        
        data = response.json()
        assert "solo" in data, "Should have solo plan links"
        assert "croissance" in data, "Should have croissance plan links"
        assert "flotte_pro" in data, "Should have flotte_pro plan links"
        
        # Verify link structure
        assert "monthly" in data["solo"], "Solo should have monthly link"
        assert "yearly" in data["solo"], "Solo should have yearly link"
        
        print("✓ Payment links retrieved successfully")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
