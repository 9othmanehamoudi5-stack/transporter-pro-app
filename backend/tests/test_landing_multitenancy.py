"""
Backend API tests for Landing Page, Multi-tenancy, and Fleet Quota features
Iteration 15 - Major refactoring for commercial launch
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://delivery-cash-flow.preview.emergentagent.com').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@transporter-pro.com"
ADMIN_PASSWORD = "admin123"
DRIVER_EMAIL = "driver@test.com"
DRIVER_PASSWORD = "driver123"


class TestAuthEndpoints:
    """Test authentication endpoints"""
    
    def test_login_admin_success(self):
        """Admin login should work with correct credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert data["role"] == "admin"
        assert data["email"] == ADMIN_EMAIL
        print(f"✓ Admin login successful: {data['email']}")
    
    def test_login_driver_success(self):
        """Driver login should work with correct credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DRIVER_EMAIL,
            "password": DRIVER_PASSWORD
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert data["role"] == "driver"
        print(f"✓ Driver login successful: {data['email']}")
    
    def test_login_invalid_credentials(self):
        """Login with wrong password should fail"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid credentials rejected correctly")


class TestDriverRegistrationBlocked:
    """Test that public driver registration is blocked"""
    
    def test_register_driver_returns_403(self):
        """POST /api/auth/register with role=driver should return 403"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": "newdriver@test.com",
            "password": "test123",
            "name": "New Driver",
            "role": "driver"
        })
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
        data = response.json()
        assert "chauffeurs" in data.get("detail", "").lower() or "administrateur" in data.get("detail", "").lower()
        print(f"✓ Driver registration blocked: {data.get('detail')}")
    
    def test_register_admin_allowed(self):
        """POST /api/auth/register with role=admin should be allowed (if email not taken)"""
        # Use a unique email to avoid conflicts
        import uuid
        unique_email = f"test_admin_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "test123",
            "name": "Test Admin",
            "role": "admin"
        })
        # Should be 200 (success) or 400 (email taken)
        assert response.status_code in [200, 400], f"Expected 200 or 400, got {response.status_code}: {response.text}"
        print(f"✓ Admin registration allowed (status: {response.status_code})")
    
    def test_register_client_allowed(self):
        """POST /api/auth/register with role=client should be allowed"""
        import uuid
        unique_email = f"test_client_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "test123",
            "name": "Test Client",
            "role": "client"
        })
        assert response.status_code in [200, 400], f"Expected 200 or 400, got {response.status_code}: {response.text}"
        print(f"✓ Client registration allowed (status: {response.status_code})")


class TestCompanyQuotaEndpoint:
    """Test the company quota endpoint for fleet management"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_company_quota_returns_correct_fields(self, admin_token):
        """GET /api/auth/company-quota should return driver_count, max_drivers, can_add, plan"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/auth/company-quota", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify all required fields are present
        assert "driver_count" in data, "Missing driver_count field"
        assert "max_drivers" in data, "Missing max_drivers field"
        assert "can_add" in data, "Missing can_add field"
        assert "plan" in data, "Missing plan field"
        
        # Verify data types
        assert isinstance(data["driver_count"], int)
        assert isinstance(data["max_drivers"], int)
        assert isinstance(data["can_add"], bool)
        assert isinstance(data["plan"], str)
        
        print(f"✓ Company quota: {data['driver_count']}/{data['max_drivers']} drivers, plan={data['plan']}, can_add={data['can_add']}")
    
    def test_company_quota_requires_admin(self):
        """GET /api/auth/company-quota should require admin role"""
        # Login as driver
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DRIVER_EMAIL,
            "password": DRIVER_PASSWORD
        })
        driver_token = response.json()["access_token"]
        
        headers = {"Authorization": f"Bearer {driver_token}"}
        response = requests.get(f"{BASE_URL}/api/auth/company-quota", headers=headers)
        assert response.status_code == 403, f"Expected 403 for driver, got {response.status_code}"
        print("✓ Company quota endpoint requires admin role")


class TestAuthMeEndpoint:
    """Test the /api/auth/me endpoint returns company_id and plan"""
    
    def test_auth_me_returns_company_id_and_plan(self):
        """GET /api/auth/me should return company_id and plan fields"""
        # Login as admin
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        token = response.json()["access_token"]
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify company_id and plan fields
        assert "company_id" in data, "Missing company_id field in /api/auth/me response"
        assert "plan" in data, "Missing plan field in /api/auth/me response"
        assert data["company_id"] is not None, "company_id should not be None"
        assert data["plan"] is not None, "plan should not be None"
        
        print(f"✓ /api/auth/me returns company_id={data['company_id']}, plan={data['plan']}")
    
    def test_auth_me_driver_has_company_id(self):
        """Driver's /api/auth/me should also return company_id"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DRIVER_EMAIL,
            "password": DRIVER_PASSWORD
        })
        assert response.status_code == 200
        token = response.json()["access_token"]
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        # company_id should be present (may be driver's own ID or admin's company_id)
        assert "company_id" in data, "Missing company_id field for driver"
        print(f"✓ Driver /api/auth/me returns company_id={data.get('company_id')}")


class TestAdminDriverCreation:
    """Test admin driver creation with quota enforcement"""
    
    @pytest.fixture
    def admin_session(self):
        """Get admin session with token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return {"Authorization": f"Bearer {response.json()['access_token']}"}
    
    def test_admin_can_create_driver(self, admin_session):
        """Admin should be able to create a driver via POST /api/admin/drivers"""
        import uuid
        unique_email = f"test_driver_{uuid.uuid4().hex[:8]}@test.com"
        
        response = requests.post(f"{BASE_URL}/api/admin/drivers", 
            headers=admin_session,
            json={
                "email": unique_email,
                "password": "driver123",
                "name": "Test Driver Created",
                "phone": "+33612345678",
                "vehicle_plate": "AB-123-CD"
            }
        )
        
        # Should succeed or fail due to quota
        if response.status_code == 200:
            data = response.json()
            assert data["role"] == "driver"
            assert data["email"] == unique_email
            assert "company_id" in data
            print(f"✓ Admin created driver: {data['email']}, company_id={data['company_id']}")
        elif response.status_code == 403:
            # Quota reached
            data = response.json()
            assert "limite" in data.get("detail", "").lower() or "quota" in data.get("detail", "").lower()
            print(f"✓ Driver creation blocked due to quota: {data.get('detail')}")
        else:
            pytest.fail(f"Unexpected status {response.status_code}: {response.text}")
    
    def test_get_admin_drivers_list(self, admin_session):
        """GET /api/admin/drivers should return list of drivers for company"""
        response = requests.get(f"{BASE_URL}/api/admin/drivers", headers=admin_session)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin drivers list: {len(data)} drivers")
        
        # Verify driver structure
        if len(data) > 0:
            driver = data[0]
            assert "id" in driver
            assert "email" in driver
            assert "name" in driver
            print(f"  First driver: {driver.get('name')} ({driver.get('email')})")


class TestDashboardStats:
    """Test dashboard stats endpoint"""
    
    def test_dashboard_stats_admin(self):
        """Admin should get full dashboard stats"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = response.json()["access_token"]
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        # Admin should see these fields
        assert "total_deliveries" in data
        assert "active_drivers" in data
        print(f"✓ Dashboard stats: {data['total_deliveries']} deliveries, {data['active_drivers']} drivers")
    
    def test_dashboard_stats_driver(self):
        """Driver should get their own stats"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DRIVER_EMAIL,
            "password": DRIVER_PASSWORD
        })
        token = response.json()["access_token"]
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        # Driver should see their own stats
        assert "eco_score" in data or "my_deliveries_today" in data
        print(f"✓ Driver dashboard stats: {data}")


class TestSubscriptionPlans:
    """Test subscription plans endpoint"""
    
    def test_get_subscription_plans(self):
        """GET /api/subscription/plans should return all plans"""
        response = requests.get(f"{BASE_URL}/api/subscription/plans")
        assert response.status_code == 200
        data = response.json()
        
        # Should have solo, croissance, flotte_pro
        assert "solo" in data
        assert "croissance" in data
        assert "flotte_pro" in data
        
        # Verify plan structure
        solo = data["solo"]
        assert "max_trucks" in solo
        assert solo["max_trucks"] == 3
        
        croissance = data["croissance"]
        assert croissance["max_trucks"] == 15
        
        flotte_pro = data["flotte_pro"]
        assert flotte_pro["max_trucks"] == -1  # unlimited
        
        print(f"✓ Subscription plans: solo={solo['max_trucks']}, croissance={croissance['max_trucks']}, flotte_pro=unlimited")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
