"""
Test suite for AI Analysis Fixes (Iteration 4):
1. Image preprocessing - resize to max 1280px, convert to JPEG
2. Clean error messages - no raw INVALID_ARGUMENT, show French message
3. Retry endpoint - POST /api/damage-reports/{report_id}/retry
"""
import pytest
import requests
import os
import base64
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://delivery-cash-flow.preview.emergentagent.com')

# Test image - a simple gradient PNG (real visual features)
TEST_IMAGE_BASE64 = (
    "iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAOklEQVQYV2NkIBIwEqmOgXCF"
    "DAwM/xkYGP4zMDAwMjIyMjAyMjIwMDIyMDAwMjAwMDIwMDAwMDAwMDAwAAALmwH5Hs8YCQAA"
    "AABJRU5ErkJggg=="
)

# A more realistic test image - cardboard box texture (base64 encoded JPEG)
CARDBOARD_BOX_IMAGE = (
    "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoM"
    "CwsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsN"
    "FBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAAR"
    "CAAKAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABwgJ/8QAIhAAAgEDBAMBAQAA"
    "AAAAAAAAAQIDBAURBgcSIQAIEzFB/8QAFQEBAQAAAAAAAAAAAAAAAAAABgf/xAAeEQABAwQD"
    "AAAAAAAAAAAAAAABAAIDBAURITFBYf/aAAwDAQACEQMRAD8AuXc7dLbO4Nw7Zt1nt9FBb7hU"
    "U0MFPTRRRJI8jKqqqgAAk9ADrWdO2+4d47Y3Ot9z2+4VdJXUkqTQzwSvHJG6kMrKykEEEAg"
    "jrWtO5O4d47n3Ot9z3C4VdXXVcqTTzzyvJJI7EMzMxJJJJJ61rTuTuHeO59zrfc9wuFXV11"
    "XKk088krySSuxDMzMSSSSSetagAAAH//2Q=="
)

# Truncated/invalid image to test error handling
TRUNCATED_IMAGE = "iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAA"  # Incomplete base64


class TestImagePreprocessing:
    """Test image preprocessing - resize to max 1280px, convert to JPEG"""
    
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
        
        # Get deliveries
        deliveries_response = self.session.get(f"{BASE_URL}/api/deliveries")
        assert deliveries_response.status_code == 200
        self.deliveries = deliveries_response.json()
        print(f"✓ Found {len(self.deliveries)} deliveries")
        
        yield
        self.session.post(f"{BASE_URL}/api/auth/logout")
    
    def test_png_image_processed_successfully(self):
        """Test PNG image is preprocessed and analyzed without errors"""
        if len(self.deliveries) == 0:
            pytest.skip("No deliveries assigned to driver")
        
        delivery_id = self.deliveries[0]["tracking_id"]
        
        payload = {
            "delivery_id": delivery_id,
            "photo_base64": TEST_IMAGE_BASE64,  # PNG image
            "description": "Test PNG preprocessing"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/damage-reports",
            json=payload,
            timeout=60
        )
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify AI analysis was performed
        assert "ai_analysis" in data
        ai = data["ai_analysis"]
        
        # Check that no raw error messages are present
        description = ai.get("description", "")
        assert "INVALID_ARGUMENT" not in description, f"Raw error in description: {description}"
        assert "Error" not in description or "Erreur" in description, f"English error in description: {description}"
        
        print(f"✓ PNG image processed successfully")
        print(f"  - Severity: {ai.get('damage_severity')}")
        print(f"  - Confidence: {ai.get('confidence')}%")
        print(f"  - Description: {description[:100]}...")
    
    def test_jpeg_image_processed_successfully(self):
        """Test JPEG image is preprocessed and analyzed without errors"""
        if len(self.deliveries) == 0:
            pytest.skip("No deliveries assigned to driver")
        
        delivery_id = self.deliveries[0]["tracking_id"]
        
        payload = {
            "delivery_id": delivery_id,
            "photo_base64": CARDBOARD_BOX_IMAGE,  # JPEG image
            "description": "Test JPEG preprocessing"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/damage-reports",
            json=payload,
            timeout=60
        )
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "ai_analysis" in data
        ai = data["ai_analysis"]
        
        # Check that no raw error messages are present
        description = ai.get("description", "")
        assert "INVALID_ARGUMENT" not in description, f"Raw error in description: {description}"
        
        print(f"✓ JPEG image processed successfully")
        print(f"  - Severity: {ai.get('damage_severity')}")
        print(f"  - Confidence: {ai.get('confidence')}%")


class TestCleanErrorMessages:
    """Test clean error messages - no raw INVALID_ARGUMENT, show French message"""
    
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
        assert login_response.status_code == 200
        self.driver_data = login_response.json()
        
        # Get deliveries
        deliveries_response = self.session.get(f"{BASE_URL}/api/deliveries")
        assert deliveries_response.status_code == 200
        self.deliveries = deliveries_response.json()
        
        yield
        self.session.post(f"{BASE_URL}/api/auth/logout")
    
    def test_truncated_image_returns_clean_error(self):
        """Test truncated/invalid image returns clean French error message"""
        if len(self.deliveries) == 0:
            pytest.skip("No deliveries assigned to driver")
        
        delivery_id = self.deliveries[0]["tracking_id"]
        
        payload = {
            "delivery_id": delivery_id,
            "photo_base64": TRUNCATED_IMAGE,  # Invalid/truncated image
            "description": "Test error handling"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/damage-reports",
            json=payload,
            timeout=60
        )
        
        # Should still return 200 with error in ai_analysis
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "ai_analysis" in data
        ai = data["ai_analysis"]
        description = ai.get("description", "")
        
        # Verify NO raw technical errors
        assert "INVALID_ARGUMENT" not in description, f"Raw INVALID_ARGUMENT in description: {description}"
        assert "400 Bad Request" not in description, f"Raw HTTP error in description: {description}"
        assert "Exception" not in description, f"Raw exception in description: {description}"
        
        # If error occurred, should show clean French message
        if ai.get("damage_severity") == "unknown" or ai.get("confidence") == 0:
            expected_msg = "Analyse automatique impossible - Image non reconnue ou format incompatible"
            assert expected_msg in description, f"Expected clean French error message, got: {description}"
            print(f"✓ Truncated image returns clean French error: {description}")
        else:
            print(f"✓ Image was processed (may have been valid enough): {description[:100]}")
    
    def test_existing_error_reports_have_clean_messages(self):
        """Test existing damage reports with errors show clean messages"""
        # Login as admin to see all reports
        admin_session = requests.Session()
        admin_session.headers.update({"Content-Type": "application/json"})
        
        login_response = admin_session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@transporter-pro.com", "password": "admin123"}
        )
        assert login_response.status_code == 200
        
        # Get all damage reports
        response = admin_session.get(f"{BASE_URL}/api/damage-reports")
        assert response.status_code == 200
        reports = response.json()
        
        error_reports = []
        for report in reports:
            ai = report.get("ai_analysis", {})
            description = ai.get("description", "")
            
            # Check for raw technical errors
            if "INVALID_ARGUMENT" in description:
                error_reports.append({
                    "report_id": report.get("report_id"),
                    "description": description
                })
        
        if error_reports:
            print(f"⚠ Found {len(error_reports)} reports with raw INVALID_ARGUMENT errors:")
            for r in error_reports:
                print(f"  - {r['report_id']}: {r['description'][:100]}...")
            pytest.fail(f"Found {len(error_reports)} reports with raw technical errors")
        else:
            print(f"✓ All {len(reports)} reports have clean error messages (no raw INVALID_ARGUMENT)")
        
        admin_session.post(f"{BASE_URL}/api/auth/logout")


class TestRetryEndpoint:
    """Test POST /api/damage-reports/{report_id}/retry endpoint"""
    
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
        assert login_response.status_code == 200
        self.admin_data = login_response.json()
        print(f"✓ Logged in as admin: {self.admin_data['email']}")
        
        yield
        self.session.post(f"{BASE_URL}/api/auth/logout")
    
    def test_retry_endpoint_exists(self):
        """Test retry endpoint exists and returns proper error for invalid report"""
        response = self.session.post(
            f"{BASE_URL}/api/damage-reports/INVALID-REPORT-ID/retry"
        )
        
        # Should return 404 for non-existent report
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"
        print("✓ Retry endpoint exists and returns 404 for invalid report")
    
    def test_retry_report_with_photo(self):
        """Test retry endpoint re-runs AI analysis on report with photo"""
        # Get all damage reports
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
        
        report_id = report_with_photo["report_id"]
        print(f"Testing retry on report: {report_id}")
        
        # Call retry endpoint
        retry_response = self.session.post(
            f"{BASE_URL}/api/damage-reports/{report_id}/retry",
            timeout=60
        )
        
        assert retry_response.status_code == 200, f"Retry failed: {retry_response.text}"
        data = retry_response.json()
        
        # Verify response structure
        assert "report_id" in data, "Response should have report_id"
        assert data["report_id"] == report_id, "Report ID should match"
        assert "ai_analysis" in data, "Response should have ai_analysis"
        
        ai = data["ai_analysis"]
        assert "is_damaged" in ai
        assert "damage_severity" in ai
        assert "confidence" in ai
        assert "description" in ai
        
        # Verify no raw errors in new analysis
        description = ai.get("description", "")
        assert "INVALID_ARGUMENT" not in description, f"Raw error in retry result: {description}"
        
        print(f"✓ Retry successful for report {report_id}")
        print(f"  - New severity: {ai.get('damage_severity')}")
        print(f"  - New confidence: {ai.get('confidence')}%")
        print(f"  - New description: {description[:100]}...")
    
    def test_retry_report_without_photo_fails(self):
        """Test retry endpoint fails gracefully for report without photo"""
        # Get all damage reports
        response = self.session.get(f"{BASE_URL}/api/damage-reports")
        assert response.status_code == 200
        reports = response.json()
        
        # Find a report without photo (has_photo=False or short photo)
        report_without_photo = None
        for report in reports:
            if not report.get("has_photo"):
                report_without_photo = report
                break
        
        if not report_without_photo:
            print("✓ All reports have photos - skipping no-photo test")
            return
        
        report_id = report_without_photo["report_id"]
        print(f"Testing retry on report without photo: {report_id}")
        
        # Call retry endpoint
        retry_response = self.session.post(
            f"{BASE_URL}/api/damage-reports/{report_id}/retry",
            timeout=60
        )
        
        # Should return 400 for report without photo
        assert retry_response.status_code == 400, f"Expected 400, got {retry_response.status_code}: {retry_response.text}"
        
        error_data = retry_response.json()
        assert "detail" in error_data
        print(f"✓ Retry correctly fails for report without photo: {error_data['detail']}")


class TestSpecificErrorReports:
    """Test specific error reports mentioned in the task"""
    
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
        assert login_response.status_code == 200
        
        yield
        self.session.post(f"{BASE_URL}/api/auth/logout")
    
    def test_check_known_error_reports(self):
        """Check specific reports mentioned: DMG-478F9AEC, DMG-5A913EE5"""
        known_error_reports = ["DMG-478F9AEC", "DMG-5A913EE5"]
        known_success_reports = ["DMG-67554CB2", "DMG-B9CDE098"]
        
        # Get all damage reports
        response = self.session.get(f"{BASE_URL}/api/damage-reports")
        assert response.status_code == 200
        reports = response.json()
        
        reports_by_id = {r["report_id"]: r for r in reports}
        
        # Check error reports
        for report_id in known_error_reports:
            if report_id in reports_by_id:
                report = reports_by_id[report_id]
                ai = report.get("ai_analysis", {})
                description = ai.get("description", "")
                
                # Should NOT contain raw INVALID_ARGUMENT
                assert "INVALID_ARGUMENT" not in description, \
                    f"Report {report_id} still has raw error: {description}"
                
                # If it's an error report, should show clean French message
                if ai.get("damage_severity") == "unknown" or ai.get("confidence") == 0:
                    expected_msg = "Analyse automatique impossible"
                    assert expected_msg in description, \
                        f"Report {report_id} should show clean French error, got: {description}"
                    print(f"✓ Error report {report_id} shows clean French message")
                else:
                    print(f"✓ Report {report_id} has valid analysis")
            else:
                print(f"⚠ Report {report_id} not found in database")
        
        # Check success reports
        for report_id in known_success_reports:
            if report_id in reports_by_id:
                report = reports_by_id[report_id]
                ai = report.get("ai_analysis", {})
                
                # Should have valid analysis
                assert ai.get("confidence", 0) > 0, f"Report {report_id} should have confidence > 0"
                print(f"✓ Success report {report_id} has valid analysis (confidence: {ai.get('confidence')}%)")
            else:
                print(f"⚠ Report {report_id} not found in database")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
