"""
Test suite for Eco-scores Pro Mode features
Tests: driver names in summary, daily-avg endpoint, recalculate endpoint
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://delivery-cash-flow.preview.emergentagent.com')

class TestEcoScoresProMode:
    """Eco-scores Pro Mode feature tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin and get token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@transporter-pro.com", "password": "admin123"}
        )
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        self.token = response.json().get("access_token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_eco_scores_summary_returns_driver_names(self):
        """Test that /api/eco-scores/summary returns driver_name field"""
        response = requests.get(
            f"{BASE_URL}/api/eco-scores/summary",
            headers=self.headers
        )
        assert response.status_code == 200, f"Summary endpoint failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        if len(data) > 0:
            # Check that driver_name field exists
            first_driver = data[0]
            assert "driver_name" in first_driver, "driver_name field missing in summary"
            assert first_driver["driver_name"] is not None, "driver_name should not be None"
            # Verify it's a name, not an ObjectId
            assert not first_driver["driver_name"].startswith("69"), "driver_name should be a name, not an ID"
            print(f"Driver name found: {first_driver['driver_name']}")
            
            # Check other expected fields
            assert "avg_score" in first_driver, "avg_score field missing"
            assert "total_distance" in first_driver, "total_distance field missing"
            assert "total_co2" in first_driver, "total_co2 field missing"
            assert "total_fuel" in first_driver, "total_fuel field missing"
    
    def test_eco_scores_daily_avg_returns_30_days(self):
        """Test that /api/eco-scores/daily-avg returns 30 days of data"""
        response = requests.get(
            f"{BASE_URL}/api/eco-scores/daily-avg",
            headers=self.headers
        )
        assert response.status_code == 200, f"Daily-avg endpoint failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        # Should have data for multiple days
        assert len(data) >= 1, "Should have at least 1 day of data"
        print(f"Daily avg data points: {len(data)}")
        
        if len(data) > 0:
            first_day = data[0]
            # Check expected fields
            assert "date" in first_day, "date field missing"
            assert "avg_score" in first_day, "avg_score field missing"
            assert "drivers_count" in first_day, "drivers_count field missing"
            
            # Verify date format (YYYY-MM-DD)
            assert len(first_day["date"]) == 10, "Date should be in YYYY-MM-DD format"
            assert "-" in first_day["date"], "Date should contain hyphens"
    
    def test_eco_scores_recalculate_returns_drivers(self):
        """Test that POST /api/eco-scores/recalculate returns recalculated drivers"""
        response = requests.post(
            f"{BASE_URL}/api/eco-scores/recalculate",
            headers=self.headers
        )
        assert response.status_code == 200, f"Recalculate endpoint failed: {response.text}"
        
        data = response.json()
        assert "recalculated" in data, "recalculated count missing"
        assert "drivers" in data, "drivers list missing"
        
        # Should have recalculated at least 1 driver
        assert data["recalculated"] >= 1, "Should have recalculated at least 1 driver"
        print(f"Recalculated {data['recalculated']} drivers")
        
        if len(data["drivers"]) > 0:
            first_driver = data["drivers"][0]
            assert "driver_id" in first_driver, "driver_id field missing"
            assert "name" in first_driver, "name field missing"
            assert "score" in first_driver, "score field missing"
            
            # Verify name is not an ID
            assert not first_driver["name"].startswith("69"), "name should be a name, not an ID"
            print(f"First driver: {first_driver['name']} with score {first_driver['score']}")


class TestAuthEndpoints:
    """Authentication endpoint tests"""
    
    def test_admin_login_success(self):
        """Test admin login with correct credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@transporter-pro.com", "password": "admin123"}
        )
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        
        data = response.json()
        assert "access_token" in data, "access_token missing"
        assert "refresh_token" in data, "refresh_token missing"
        assert data["role"] == "admin", "Role should be admin"
        assert data["email"] == "admin@transporter-pro.com", "Email mismatch"
    
    def test_driver_login_success(self):
        """Test driver login with correct credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "driver@test.com", "password": "driver123"}
        )
        assert response.status_code == 200, f"Driver login failed: {response.text}"
        
        data = response.json()
        assert "access_token" in data, "access_token missing"
        assert data["role"] == "driver", "Role should be driver"
        assert data["name"] == "Jean Dupont", "Driver name should be Jean Dupont"
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "wrong@example.com", "password": "wrongpass"}
        )
        assert response.status_code == 401, "Should return 401 for invalid credentials"


class TestDashboardEndpoints:
    """Dashboard endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin and get token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@transporter-pro.com", "password": "admin123"}
        )
        self.token = response.json().get("access_token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_dashboard_stats(self):
        """Test /api/dashboard/stats endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/dashboard/stats",
            headers=self.headers
        )
        assert response.status_code == 200, f"Stats endpoint failed: {response.text}"
        
        data = response.json()
        assert "total_deliveries" in data, "total_deliveries missing"
        assert "avg_eco_score" in data, "avg_eco_score missing"
    
    def test_dashboard_cashflow(self):
        """Test /api/dashboard/cash-flow endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/dashboard/cash-flow",
            headers=self.headers
        )
        assert response.status_code == 200, f"Cash-flow endpoint failed: {response.text}"
        
        data = response.json()
        assert "money_blocked_in_trucks" in data, "money_blocked_in_trucks missing"
        assert "pending_invoices_count" in data, "pending_invoices_count missing"


class TestSubscriptionEndpoints:
    """Subscription endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin and get token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@transporter-pro.com", "password": "admin123"}
        )
        self.token = response.json().get("access_token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_subscription_current(self):
        """Test /api/subscription/current endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/subscription/current",
            headers=self.headers
        )
        assert response.status_code == 200, f"Subscription current failed: {response.text}"
        
        data = response.json()
        assert "plan" in data, "plan field missing"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
