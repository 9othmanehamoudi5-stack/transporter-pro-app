"""
Test suite for Damage Reports API with Gemini Vision AI integration
Tests: POST /api/damage-reports, GET /api/damage-reports, GET /api/damage-reports/{id}/photo
"""
import pytest
import requests
import os
import base64
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://delivery-cash-flow.preview.emergentagent.com')

# Test image - a simple red/blue gradient PNG (real visual features, not blank)
# This is a 10x10 PNG with gradient colors
TEST_IMAGE_BASE64 = (
    "iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAOklEQVQYV2NkIBIwEqmOgXCF"
    "DAwM/xkYGP4zMDAwMjIyMjAyMjIwMDIyMDAwMjAwMDIwMDAwMDAwMDAwAAALmwH5Hs8YCQAA"
    "AABJRU5ErkJggg=="
)

# A more realistic test image - cardboard box texture (base64 encoded)
CARDBOARD_BOX_IMAGE = (
    "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoM"
    "CwsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsN"
    "FBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAAR"
    "CAAKAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABwgJ/8QAIhAAAgEDBAMBAQAA"
    "AAAAAAAAAQIDBAURBgcSIQAIEzFB/8QAFQEBAQAAAAAAAAAAAAAAAAAABgf/xAAeEQABAwQD"
    "AAAAAAAAAAAAAAABAAIDBAURITFBYf/aAAwDAQACEQMRAD8AuXc7dLbO4Nw7Zt1nt9FBb7hU"
    "U0MFPTRRRJI8jKqqqgAAk9ADrWdO2+4d47Y3Ot9z2+4VdJXUkqTQzwSvHJG6kMrKykEEEAg"
    "jrWtO5O4d47n3Ot9z3C4VdXXVcqTTzzyvJJI7EMzMxJJJJJJ61rTuTuHeO59zrfc9wuFXV11"
    "XKk088krySSuxDMzMSSSSSetagAAAH//2Q=="
)


class TestDamageReportsAPI:
    """Test suite for damage reports endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with driver authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as driver
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "driver@test.com", "password": "driver123"}
        )
        assert login_response.status_code == 200, f"Driver login failed: {login_response.text}"
        self.driver_data = login_response.json()
        print(f"✓ Logged in as driver: {self.driver_data['email']}")
        
        # Get deliveries to find a valid delivery_id
        deliveries_response = self.session.get(f"{BASE_URL}/api/deliveries")
        assert deliveries_response.status_code == 200, f"Failed to get deliveries: {deliveries_response.text}"
        self.deliveries = deliveries_response.json()
        print(f"✓ Found {len(self.deliveries)} deliveries for driver")
        
        yield
        
        # Cleanup - logout
        self.session.post(f"{BASE_URL}/api/auth/logout")
    
    def test_driver_login_success(self):
        """Test driver can login successfully"""
        assert self.driver_data["role"] == "driver"
        assert self.driver_data["email"] == "driver@test.com"
        print("✓ Driver login verified")
    
    def test_get_damage_reports_empty_or_list(self):
        """Test GET /api/damage-reports returns list"""
        response = self.session.get(f"{BASE_URL}/api/damage-reports")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ GET /api/damage-reports returned {len(data)} reports")
        
        # If reports exist, verify structure
        if len(data) > 0:
            report = data[0]
            assert "report_id" in report, "Report should have report_id"
            assert "delivery_id" in report, "Report should have delivery_id"
            assert "ai_analysis" in report, "Report should have ai_analysis"
            assert "has_photo" in report, "Report should have has_photo flag"
            print(f"✓ Report structure verified: {report['report_id']}")
    
    def test_create_damage_report_with_ai_analysis(self):
        """Test POST /api/damage-reports with real image triggers AI analysis"""
        # Skip if no deliveries assigned to driver
        if len(self.deliveries) == 0:
            pytest.skip("No deliveries assigned to driver - cannot create damage report")
        
        # Use first delivery
        delivery_id = self.deliveries[0]["tracking_id"]
        print(f"Creating damage report for delivery: {delivery_id}")
        
        # Create damage report with test image
        payload = {
            "delivery_id": delivery_id,
            "photo_base64": CARDBOARD_BOX_IMAGE,
            "description": "Test damage report from automated testing"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/damage-reports",
            json=payload,
            timeout=60  # AI analysis can take up to 30 seconds
        )
        
        assert response.status_code == 200, f"Failed to create damage report: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "report_id" in data, "Response should have report_id"
        assert data["report_id"].startswith("DMG-"), f"Report ID should start with DMG-: {data['report_id']}"
        assert "delivery_id" in data, "Response should have delivery_id"
        assert data["delivery_id"] == delivery_id, "Delivery ID should match"
        assert "ai_analysis" in data, "Response should have ai_analysis"
        assert "blockchain_proof" in data, "Response should have blockchain_proof"
        
        # Verify AI analysis structure
        ai = data["ai_analysis"]
        assert "is_damaged" in ai, "AI analysis should have is_damaged"
        assert "damage_severity" in ai, "AI analysis should have damage_severity"
        assert "confidence" in ai, "AI analysis should have confidence"
        assert "description" in ai, "AI analysis should have description"
        
        # Verify AI analysis values
        assert isinstance(ai["is_damaged"], bool), "is_damaged should be boolean"
        assert ai["damage_severity"] in ["none", "minor", "moderate", "severe", "unknown"], \
            f"Invalid severity: {ai['damage_severity']}"
        assert 0 <= ai["confidence"] <= 100, f"Confidence should be 0-100: {ai['confidence']}"
        assert isinstance(ai["description"], str), "Description should be string"
        assert len(ai["description"]) > 0, "Description should not be empty"
        
        # Verify blockchain proof (mocked)
        proof = data["blockchain_proof"]
        assert "hash" in proof, "Blockchain proof should have hash"
        assert "timestamp" in proof, "Blockchain proof should have timestamp"
        assert "verified" in proof, "Blockchain proof should have verified"
        
        print(f"✓ Created damage report: {data['report_id']}")
        print(f"  - AI Analysis: is_damaged={ai['is_damaged']}, severity={ai['damage_severity']}, confidence={ai['confidence']}%")
        print(f"  - Description: {ai['description'][:100]}...")
        print(f"  - Blockchain hash: {proof['hash'][:32]}...")
        
        # Store for photo test
        self.created_report_id = data["report_id"]
        return data
    
    def test_get_damage_report_photo(self):
        """Test GET /api/damage-reports/{report_id}/photo returns photo"""
        # First get existing reports
        response = self.session.get(f"{BASE_URL}/api/damage-reports")
        assert response.status_code == 200
        reports = response.json()
        
        # Find a report with photo
        report_with_photo = None
        for report in reports:
            if report.get("has_photo"):
                report_with_photo = report
                break
        
        if not report_with_photo:
            pytest.skip("No damage reports with photos found")
        
        # Get photo
        photo_response = self.session.get(
            f"{BASE_URL}/api/damage-reports/{report_with_photo['report_id']}/photo"
        )
        assert photo_response.status_code == 200, f"Failed to get photo: {photo_response.text}"
        
        photo_data = photo_response.json()
        assert "photo_base64" in photo_data, "Response should have photo_base64"
        assert len(photo_data["photo_base64"]) > 100, "Photo should have content"
        
        print(f"✓ Retrieved photo for report {report_with_photo['report_id']}")
        print(f"  - Photo size: {len(photo_data['photo_base64'])} chars")


class TestAdminDamageReportsView:
    """Test admin can view damage reports in Litiges tab"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with admin authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as admin
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@transporter-pro.com", "password": "admin123"}
        )
        assert login_response.status_code == 200, f"Admin login failed: {login_response.text}"
        self.admin_data = login_response.json()
        print(f"✓ Logged in as admin: {self.admin_data['email']}")
        
        yield
        
        self.session.post(f"{BASE_URL}/api/auth/logout")
    
    def test_admin_can_view_all_damage_reports(self):
        """Test admin can view all damage reports"""
        response = self.session.get(f"{BASE_URL}/api/damage-reports")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Admin can view {len(data)} damage reports")
        
        # Verify each report has required fields for Litiges tab display
        for report in data:
            assert "report_id" in report
            assert "delivery_id" in report
            assert "ai_analysis" in report
            assert "has_photo" in report
            assert "blockchain_proof" in report
            
            # Verify AI analysis for display
            ai = report.get("ai_analysis", {})
            assert "is_damaged" in ai
            assert "damage_severity" in ai
            assert "confidence" in ai
            assert "description" in ai
        
        if len(data) > 0:
            print(f"✓ Sample report structure verified")
            print(f"  - Report ID: {data[0]['report_id']}")
            print(f"  - Delivery: {data[0]['delivery_id']}")
            print(f"  - Has photo: {data[0]['has_photo']}")
    
    def test_admin_dashboard_stats_include_litiges(self):
        """Test dashboard stats include active_litiges count"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/stats")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        stats = response.json()
        assert "active_litiges" in stats, "Stats should include active_litiges"
        assert isinstance(stats["active_litiges"], int), "active_litiges should be integer"
        
        print(f"✓ Dashboard stats include litiges: {stats['active_litiges']} active")


class TestDeliveriesForDamageReports:
    """Test deliveries API for damage report creation"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        yield
    
    def test_driver_has_deliveries_assigned(self):
        """Test driver has deliveries to create damage reports for"""
        # Login as driver
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "driver@test.com", "password": "driver123"}
        )
        assert login_response.status_code == 200
        
        # Get deliveries
        response = self.session.get(f"{BASE_URL}/api/deliveries")
        assert response.status_code == 200
        
        deliveries = response.json()
        print(f"✓ Driver has {len(deliveries)} deliveries")
        
        # List tracking IDs
        for d in deliveries[:5]:
            print(f"  - {d['tracking_id']}: {d['status']}")
    
    def test_admin_can_create_and_assign_delivery(self):
        """Test admin can create delivery and assign to driver for damage report testing"""
        # Login as admin
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@transporter-pro.com", "password": "admin123"}
        )
        assert login_response.status_code == 200
        
        # Create a test delivery
        delivery_data = {
            "recipient_name": "TEST_DamageReportRecipient",
            "recipient_address": "123 Test Street, Paris",
            "recipient_phone": "0612345678",
            "package_description": "Test package for damage report",
            "weight_kg": 2.5
        }
        
        create_response = self.session.post(
            f"{BASE_URL}/api/deliveries",
            json=delivery_data
        )
        assert create_response.status_code == 200, f"Failed to create delivery: {create_response.text}"
        
        delivery = create_response.json()
        tracking_id = delivery["tracking_id"]
        print(f"✓ Created test delivery: {tracking_id}")
        
        # Get drivers to assign
        drivers_response = self.session.get(f"{BASE_URL}/api/admin/drivers")
        assert drivers_response.status_code == 200
        drivers = drivers_response.json()
        
        if len(drivers) > 0:
            driver_id = drivers[0]["id"]
            
            # Assign driver
            assign_response = self.session.post(
                f"{BASE_URL}/api/deliveries/{tracking_id}/assign",
                data=f"driver_id={driver_id}",
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            assert assign_response.status_code == 200, f"Failed to assign: {assign_response.text}"
            print(f"✓ Assigned driver {drivers[0]['name']} to delivery {tracking_id}")
        
        return tracking_id


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
