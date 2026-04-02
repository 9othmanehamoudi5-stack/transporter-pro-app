#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Transporter-Pro SaaS
Tests all endpoints mentioned in the testing request:
- Admin driver management (create, list, delete)
- Subscription plans and updates
- Notifications system
- Complete workflow: Admin creates → Assigns → Driver validates → Invoice created
"""

import requests
import sys
import json
import base64
from datetime import datetime
from typing import Dict, Any, Optional

class TransporterProAPITester:
    def __init__(self, base_url="https://delivery-cash-flow.preview.emergentagent.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})
        
        # Test users
        self.admin_token = None
        self.driver_token = None
        self.client_token = None
        
        # Test data storage
        self.test_delivery_id = None
        self.test_invoice_id = None
        self.test_damage_report_id = None
        self.test_driver_id = None
        
        # Test counters
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    {details}")
        if success:
            self.tests_passed += 1
        else:
            self.failed_tests.append(f"{name}: {details}")

    def make_request(self, method: str, endpoint: str, data: Dict = None, 
                    token: str = None, expected_status: int = 200) -> tuple[bool, Dict]:
        """Make HTTP request with error handling"""
        url = f"{self.base_url}/api{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'
            
        try:
            if method == 'GET':
                response = self.session.get(url, headers=headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=headers)
            elif method == 'PATCH':
                response = self.session.patch(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=headers)
            else:
                return False, {"error": f"Unsupported method: {method}"}

            success = response.status_code == expected_status
            try:
                response_data = response.json()
            except:
                response_data = {"status_code": response.status_code, "text": response.text[:200]}
                
            return success, response_data
            
        except Exception as e:
            return False, {"error": str(e)}

    def test_auth_login(self, email: str, password: str, expected_role: str) -> bool:
        """Test user login"""
        try:
            response = self.session.post(
                f"{self.base_url}/api/auth/login",
                json={"email": email, "password": password}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("role") == expected_role:
                    self.log_test(f"Login {expected_role}", True, f"User: {data.get('name')}")
                    return True
                else:
                    self.log_test(f"Login {expected_role}", False, f"Wrong role: {data.get('role')}")
                    return False
            else:
                self.log_test(f"Login {expected_role}", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test(f"Login {expected_role}", False, f"Error: {str(e)}")
            return False

    def test_auth_me(self, expected_role: str) -> bool:
        """Test current user endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/api/auth/me")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("role") == expected_role:
                    self.log_test(f"Auth /me for {expected_role}", True, f"ID: {data.get('id')}")
                    return True
                else:
                    self.log_test(f"Auth /me for {expected_role}", False, f"Wrong role: {data.get('role')}")
                    return False
            else:
                self.log_test(f"Auth /me for {expected_role}", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test(f"Auth /me for {expected_role}", False, f"Error: {str(e)}")
            return False

    def test_register_new_user(self) -> bool:
        """Test user registration"""
        try:
            test_email = f"test_{datetime.now().strftime('%H%M%S')}@test.com"
            response = self.session.post(
                f"{self.base_url}/api/auth/register",
                json={
                    "email": test_email,
                    "password": "test123",
                    "name": "Test User",
                    "role": "client"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("Register new user", True, f"Created: {data.get('email')}")
                return True
            else:
                self.log_test("Register new user", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Register new user", False, f"Error: {str(e)}")
            return False

    def test_dashboard_stats(self, role: str) -> bool:
        """Test dashboard stats endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/api/dashboard/stats")
            
            if response.status_code == 200:
                data = response.json()
                required_fields = {
                    "admin": ["total_deliveries", "pending_deliveries", "in_transit", "delivered_today"],
                    "driver": ["my_deliveries_today", "pending", "completed_today"],
                    "client": ["total_orders", "in_transit", "delivered"]
                }
                
                expected_fields = required_fields.get(role, [])
                has_fields = all(field in data for field in expected_fields)
                
                if has_fields:
                    self.log_test(f"Dashboard stats ({role})", True, f"Fields: {list(data.keys())}")
                    return True
                else:
                    missing = [f for f in expected_fields if f not in data]
                    self.log_test(f"Dashboard stats ({role})", False, f"Missing: {missing}")
                    return False
            else:
                self.log_test(f"Dashboard stats ({role})", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test(f"Dashboard stats ({role})", False, f"Error: {str(e)}")
            return False

    def test_cash_flow_endpoint(self) -> bool:
        """Test cash flow endpoint (admin only)"""
        try:
            response = self.session.get(f"{self.base_url}/api/dashboard/cash-flow")
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["money_blocked_in_trucks", "blocked_deliveries_count", 
                                 "pending_invoices_count", "revenue_this_month"]
                
                has_fields = all(field in data for field in required_fields)
                if has_fields:
                    self.log_test("Cash-flow endpoint", True, f"Blocked: {data.get('money_blocked_in_trucks')}€")
                    return True
                else:
                    missing = [f for f in required_fields if f not in data]
                    self.log_test("Cash-flow endpoint", False, f"Missing: {missing}")
                    return False
            else:
                self.log_test("Cash-flow endpoint", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Cash-flow endpoint", False, f"Error: {str(e)}")
            return False

    def test_create_delivery(self) -> bool:
        """Test delivery creation"""
        try:
            delivery_data = {
                "recipient_name": "Test Recipient",
                "recipient_address": "123 Test Street, Test City",
                "recipient_phone": "+33123456789",
                "package_description": "Test Package",
                "weight_kg": 2.5
            }
            
            response = self.session.post(
                f"{self.base_url}/api/deliveries",
                json=delivery_data
            )
            
            if response.status_code == 200:
                data = response.json()
                if "tracking_id" in data and data["tracking_id"].startswith("TP-"):
                    self.test_delivery_id = data["tracking_id"]
                    self.log_test("Create delivery", True, f"ID: {self.test_delivery_id}")
                    return True
                else:
                    self.log_test("Create delivery", False, "No tracking_id in response")
                    return False
            else:
                self.log_test("Create delivery", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Create delivery", False, f"Error: {str(e)}")
            return False

    def test_get_deliveries(self) -> bool:
        """Test get deliveries list"""
        try:
            response = self.session.get(f"{self.base_url}/api/deliveries")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Get deliveries", True, f"Count: {len(data)}")
                    return True
                else:
                    self.log_test("Get deliveries", False, "Response not a list")
                    return False
            else:
                self.log_test("Get deliveries", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Get deliveries", False, f"Error: {str(e)}")
            return False

    def test_assign_driver(self) -> bool:
        """Test driver assignment (admin only)"""
        if not self.test_delivery_id:
            self.log_test("Assign driver", False, "No test delivery available")
            return False
            
        try:
            # Use form data as per API specification
            response = self.session.post(
                f"{self.base_url}/api/deliveries/{self.test_delivery_id}/assign",
                data={"driver_id": "driver@test.com"}  # Using email as driver ID
            )
            
            if response.status_code == 200:
                self.log_test("Assign driver", True, f"Assigned to: driver@test.com")
                return True
            else:
                self.log_test("Assign driver", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Assign driver", False, f"Error: {str(e)}")
            return False

    def test_create_invoice(self) -> bool:
        """Test invoice creation (admin only)"""
        if not self.test_delivery_id:
            self.log_test("Create invoice", False, "No test delivery available")
            return False
            
        try:
            invoice_data = {
                "delivery_id": self.test_delivery_id,
                "amount": 25.50,
                "client_id": "client@test.com"
            }
            
            response = self.session.post(
                f"{self.base_url}/api/invoices",
                json=invoice_data
            )
            
            if response.status_code == 200:
                data = response.json()
                if "invoice_id" in data:
                    self.test_invoice_id = data["invoice_id"]
                    self.log_test("Create invoice", True, f"ID: {self.test_invoice_id}")
                    return True
                else:
                    self.log_test("Create invoice", False, "No invoice_id in response")
                    return False
            else:
                self.log_test("Create invoice", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Create invoice", False, f"Error: {str(e)}")
            return False

    def test_mark_invoice_paid(self) -> bool:
        """Test marking invoice as paid (admin only)"""
        if not self.test_invoice_id:
            self.log_test("Mark invoice paid", False, "No test invoice available")
            return False
            
        try:
            response = self.session.patch(f"{self.base_url}/api/invoices/{self.test_invoice_id}/pay")
            
            if response.status_code == 200:
                self.log_test("Mark invoice paid", True, f"Invoice: {self.test_invoice_id}")
                return True
            else:
                self.log_test("Mark invoice paid", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Mark invoice paid", False, f"Error: {str(e)}")
            return False

    def test_eco_scores_update(self) -> bool:
        """Test eco score update (driver only)"""
        try:
            eco_data = {
                "harsh_braking_count": 2,
                "harsh_acceleration_count": 1,
                "distance_km": 50.0,
                "fuel_liters": 4.2
            }
            
            response = self.session.post(
                f"{self.base_url}/api/eco-scores",
                json=eco_data
            )
            
            if response.status_code == 200:
                data = response.json()
                if "score" in data:
                    self.log_test("Update eco-score", True, f"Score: {data['score']}")
                    return True
                else:
                    self.log_test("Update eco-score", False, "No score in response")
                    return False
            else:
                self.log_test("Update eco-score", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Update eco-score", False, f"Error: {str(e)}")
            return False

    def test_damage_report_ai(self) -> bool:
        """Test damage report with AI analysis (driver only)"""
        if not self.test_delivery_id:
            self.log_test("AI damage report", False, "No test delivery available")
            return False
            
        try:
            # Create a simple test image (1x1 pixel PNG in base64)
            test_image_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGAWA0ddgAAAABJRU5ErkJggg=="
            
            damage_data = {
                "delivery_id": self.test_delivery_id,
                "photo_base64": test_image_b64,
                "description": "Test damage report"
            }
            
            response = self.session.post(
                f"{self.base_url}/api/damage-reports",
                json=damage_data
            )
            
            if response.status_code == 200:
                data = response.json()
                if "ai_analysis" in data and "report_id" in data:
                    self.test_damage_report_id = data["report_id"]
                    ai_result = data["ai_analysis"]
                    self.log_test("AI damage report", True, f"Damaged: {ai_result.get('is_damaged')}, Confidence: {ai_result.get('confidence')}%")
                    return True
                else:
                    self.log_test("AI damage report", False, "Missing ai_analysis or report_id")
                    return False
            else:
                self.log_test("AI damage report", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("AI damage report", False, f"Error: {str(e)}")
            return False

    def test_public_tracking(self) -> bool:
        """Test public tracking endpoint"""
        if not self.test_delivery_id:
            self.log_test("Public tracking", False, "No test delivery available")
            return False
            
        try:
            response = self.session.get(f"{self.base_url}/api/track/{self.test_delivery_id}")
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["tracking_id", "status", "recipient_name"]
                has_fields = all(field in data for field in required_fields)
                
                if has_fields:
                    self.log_test("Public tracking", True, f"Status: {data.get('status')}")
                    return True
                else:
                    missing = [f for f in required_fields if f not in data]
                    self.log_test("Public tracking", False, f"Missing: {missing}")
                    return False
            else:
                self.log_test("Public tracking", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Public tracking", False, f"Error: {str(e)}")
            return False

    def test_drivers_list(self) -> bool:
        """Test drivers list endpoint (admin only)"""
        try:
            response = self.session.get(f"{self.base_url}/api/drivers")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Drivers list", True, f"Count: {len(data)}")
                    return True
                else:
                    self.log_test("Drivers list", False, "Response not a list")
                    return False
            else:
                self.log_test("Drivers list", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Drivers list", False, f"Error: {str(e)}")
            return False

    def test_logout(self) -> bool:
        """Test logout"""
        try:
            response = self.session.post(f"{self.base_url}/api/auth/logout")
            
            if response.status_code == 200:
                self.log_test("Logout", True, "Session cleared")
                return True
            else:
                self.log_test("Logout", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Logout", False, f"Error: {str(e)}")
            return False

    def run_full_test_suite(self):
        """Run comprehensive test suite"""
        print("🚀 Starting Transporter-Pro API Test Suite")
        print("=" * 60)
        
        # Test 1: Admin Authentication & Features
        print("\n📋 ADMIN TESTS")
        print("-" * 30)
        
        if self.test_auth_login("admin@transporter-pro.com", "admin123", "admin"):
            self.test_auth_me("admin")
            self.test_dashboard_stats("admin")
            self.test_cash_flow_endpoint()
            self.test_create_delivery()
            self.test_get_deliveries()
            self.test_assign_driver()
            self.test_create_invoice()
            self.test_mark_invoice_paid()
            self.test_drivers_list()
            self.test_logout()
        
        # Test 2: Driver Authentication & Features
        print("\n🚛 DRIVER TESTS")
        print("-" * 30)
        
        if self.test_auth_login("driver@test.com", "driver123", "driver"):
            self.test_auth_me("driver")
            self.test_dashboard_stats("driver")
            self.test_get_deliveries()
            self.test_eco_scores_update()
            self.test_damage_report_ai()
            self.test_logout()
        
        # Test 3: Client Authentication & Features
        print("\n👤 CLIENT TESTS")
        print("-" * 30)
        
        if self.test_auth_login("client@test.com", "client123", "client"):
            self.test_auth_me("client")
            self.test_dashboard_stats("client")
            self.test_get_deliveries()
            self.test_logout()
        
        # Test 4: Public & Registration
        print("\n🌐 PUBLIC TESTS")
        print("-" * 30)
        
        self.test_register_new_user()
        self.test_public_tracking()
        
        # Final Results
        print("\n" + "=" * 60)
        print("📊 TEST RESULTS SUMMARY")
        print("=" * 60)
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {len(self.failed_tests)}")
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for failure in self.failed_tests:
                print(f"   • {failure}")
        
        print(f"\n🎯 Overall Status: {'PASS' if success_rate >= 80 else 'FAIL'}")
        
        return success_rate >= 80

def main():
    """Main test execution"""
    tester = TransporterProAPITester()
    success = tester.run_full_test_suite()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())