"""
Iteration 18 Backend Tests - Transporter-Pro Phase 1 Mega-Build
Tests: Prix Membres Fondateurs, Audit Logs, PWA, SEO, CGU
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://delivery-cash-flow.preview.emergentagent.com').rstrip('/')

class TestSubscriptionPlans:
    """Test Prix Membres Fondateurs pricing"""
    
    def test_subscription_plans_endpoint(self):
        """GET /api/subscription/plans returns correct structure"""
        response = requests.get(f"{BASE_URL}/api/subscription/plans")
        assert response.status_code == 200
        data = response.json()
        assert "solo" in data
        assert "croissance" in data
        assert "flotte_pro" in data
        print("PASS: Subscription plans endpoint returns all 3 plans")
    
    def test_solo_monthly_price_39(self):
        """Solo plan monthly price is 39€"""
        response = requests.get(f"{BASE_URL}/api/subscription/plans")
        data = response.json()
        assert data["solo"]["monthly_price"] == 39
        print("PASS: Solo monthly price = 39€")
    
    def test_solo_yearly_price_390(self):
        """Solo plan yearly price is 390€"""
        response = requests.get(f"{BASE_URL}/api/subscription/plans")
        data = response.json()
        assert data["solo"]["yearly_price"] == 390
        print("PASS: Solo yearly price = 390€")
    
    def test_croissance_monthly_price_189(self):
        """Croissance plan monthly price is 189€"""
        response = requests.get(f"{BASE_URL}/api/subscription/plans")
        data = response.json()
        assert data["croissance"]["monthly_price"] == 189
        print("PASS: Croissance monthly price = 189€")
    
    def test_croissance_yearly_price_1890(self):
        """Croissance plan yearly price is 1890€"""
        response = requests.get(f"{BASE_URL}/api/subscription/plans")
        data = response.json()
        assert data["croissance"]["yearly_price"] == 1890
        print("PASS: Croissance yearly price = 1890€")
    
    def test_flotte_pro_monthly_price_489(self):
        """Flotte Pro plan monthly price is 489€"""
        response = requests.get(f"{BASE_URL}/api/subscription/plans")
        data = response.json()
        assert data["flotte_pro"]["monthly_price"] == 489
        print("PASS: Flotte Pro monthly price = 489€")
    
    def test_flotte_pro_yearly_price_4890(self):
        """Flotte Pro plan yearly price is 4890€"""
        response = requests.get(f"{BASE_URL}/api/subscription/plans")
        data = response.json()
        assert data["flotte_pro"]["yearly_price"] == 4890
        print("PASS: Flotte Pro yearly price = 4890€")


class TestAuditLogs:
    """Test Audit Logs functionality"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@transporter-pro.com",
            "password": "admin123"
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Admin login failed")
    
    def test_audit_logs_requires_admin(self):
        """GET /api/audit-logs requires admin role"""
        response = requests.get(f"{BASE_URL}/api/audit-logs")
        assert response.status_code == 401
        print("PASS: Audit logs endpoint requires authentication")
    
    def test_audit_logs_returns_array(self, admin_token):
        """GET /api/audit-logs returns array of logs"""
        response = requests.get(
            f"{BASE_URL}/api/audit-logs",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: Audit logs returns array with {len(data)} entries")
    
    def test_audit_log_has_login_entry(self, admin_token):
        """Audit logs contain login action"""
        response = requests.get(
            f"{BASE_URL}/api/audit-logs",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        data = response.json()
        login_logs = [log for log in data if log.get("action") == "login"]
        assert len(login_logs) > 0
        print(f"PASS: Found {len(login_logs)} login audit entries")
    
    def test_audit_log_structure(self, admin_token):
        """Audit log entries have correct structure"""
        response = requests.get(
            f"{BASE_URL}/api/audit-logs",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        data = response.json()
        if len(data) > 0:
            log = data[0]
            assert "user_id" in log
            assert "action" in log
            assert "entity_type" in log
            assert "timestamp" in log
            print("PASS: Audit log has correct structure (user_id, action, entity_type, timestamp)")
        else:
            pytest.skip("No audit logs to verify structure")


class TestPWA:
    """Test PWA manifest and service worker"""
    
    def test_manifest_accessible(self):
        """manifest.json is accessible"""
        response = requests.get(f"{BASE_URL}/manifest.json")
        assert response.status_code == 200
        print("PASS: manifest.json accessible")
    
    def test_manifest_has_name(self):
        """manifest.json has correct name"""
        response = requests.get(f"{BASE_URL}/manifest.json")
        data = response.json()
        assert data.get("name") == "Transporter-Pro"
        print("PASS: manifest.json name = Transporter-Pro")
    
    def test_manifest_has_short_name(self):
        """manifest.json has short_name"""
        response = requests.get(f"{BASE_URL}/manifest.json")
        data = response.json()
        assert data.get("short_name") == "TP-Pro"
        print("PASS: manifest.json short_name = TP-Pro")
    
    def test_manifest_has_theme_color(self):
        """manifest.json has theme_color"""
        response = requests.get(f"{BASE_URL}/manifest.json")
        data = response.json()
        assert data.get("theme_color") == "#0066FF"
        print("PASS: manifest.json theme_color = #0066FF")
    
    def test_service_worker_accessible(self):
        """service-worker.js is accessible"""
        response = requests.get(f"{BASE_URL}/service-worker.js")
        assert response.status_code == 200
        assert "CACHE_NAME" in response.text
        print("PASS: service-worker.js accessible and contains CACHE_NAME")


class TestAuthRegression:
    """Regression tests for authentication"""
    
    def test_admin_login(self):
        """Admin can login with correct credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@transporter-pro.com",
            "password": "admin123"
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("role") == "admin"
        assert "access_token" in data
        print("PASS: Admin login successful")
    
    def test_driver_login(self):
        """Driver can login with correct credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "driver@test.com",
            "password": "driver123"
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("role") == "driver"
        assert "access_token" in data
        print("PASS: Driver login successful")
    
    def test_invalid_login(self):
        """Invalid credentials return 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@test.com",
            "password": "wrongpass"
        })
        assert response.status_code == 401
        print("PASS: Invalid login returns 401")


class TestDashboardRegression:
    """Regression tests for dashboard endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@transporter-pro.com",
            "password": "admin123"
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Admin login failed")
    
    @pytest.fixture
    def driver_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "driver@test.com",
            "password": "driver123"
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Driver login failed")
    
    def test_admin_dashboard_stats(self, admin_token):
        """Admin can access dashboard stats"""
        response = requests.get(
            f"{BASE_URL}/api/dashboard/stats",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_deliveries" in data
        print("PASS: Admin dashboard stats accessible")
    
    def test_driver_dashboard_stats(self, driver_token):
        """Driver can access dashboard stats"""
        response = requests.get(
            f"{BASE_URL}/api/dashboard/stats",
            headers={"Authorization": f"Bearer {driver_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "eco_score" in data
        print("PASS: Driver dashboard stats accessible")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
