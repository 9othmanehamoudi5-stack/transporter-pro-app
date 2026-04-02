#!/usr/bin/env python3
"""
Focused Backend API Testing for Transporter-Pro SaaS
Tests specific features mentioned in the testing request:
- Admin driver management (create, list, delete)
- Subscription plans and updates  
- Notifications system
- Complete workflow integration
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class TransporterProFocusedTester:
    def __init__(self, base_url="https://delivery-cash-flow.preview.emergentagent.com"):
        self.base_url = base_url
        
        # Separate sessions for different users
        self.admin_session = requests.Session()
        self.driver_session = requests.Session()
        self.admin_session.headers.update({'Content-Type': 'application/json'})
        self.driver_session.headers.update({'Content-Type': 'application/json'})
        
        # Authentication tokens
        self.admin_token = None
        self.driver_token = None
        
        # Test data
        self.test_driver_id = None
        self.test_delivery_id = None
        self.test_invoice_id = None
        
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
                    session_type: str = "admin", expected_status: int = 200) -> tuple[bool, Dict]:
        """Make HTTP request with error handling"""
        url = f"{self.base_url}/api{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        # Choose the appropriate session
        session = self.admin_session if session_type == "admin" else self.driver_session
            
        try:
            if method == 'GET':
                response = session.get(url, headers=headers)
            elif method == 'POST':
                response = session.post(url, json=data, headers=headers)
            elif method == 'PATCH':
                response = session.patch(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = session.delete(url, headers=headers)
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

    def test_auth_login(self, email: str, password: str, role: str) -> Optional[str]:
        """Test login and return token"""
        session = self.admin_session if role == "Admin" else self.driver_session
        
        try:
            response = session.post(
                f"{self.base_url}/api/auth/login",
                json={"email": email, "password": password}
            )
            
            if response.status_code == 200:
                data = response.json()
                # Extract token from cookies
                token = session.cookies.get('access_token')
                self.log_test(f"Login {role}", True, 
                             f"User: {data.get('name')}, Role: {data.get('role')}")
                return token
            else:
                self.log_test(f"Login {role}", False, 
                             f"Status: {response.status_code}, Response: {response.text}")
                return None
                
        except Exception as e:
            self.log_test(f"Login {role}", False, f"Error: {str(e)}")
            return None

    # ==================== ADMIN DRIVER MANAGEMENT TESTS ====================
    
    def test_admin_create_driver(self) -> bool:
        """Test POST /api/admin/drivers"""
        driver_data = {
            "email": f"test_driver_{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "testpass123",
            "name": "Test Driver Created",
            "phone": "0612345678",
            "vehicle_plate": "AB-123-CD"
        }
        
        success, response = self.make_request(
            'POST', '/admin/drivers', driver_data, expected_status=200
        )
        
        if success and 'id' in response:
            self.test_driver_id = response['id']
            self.log_test("Admin: Create Driver (/api/admin/drivers POST)", True, 
                         f"Driver ID: {self.test_driver_id}, Name: {response.get('name')}")
            return True
        else:
            self.log_test("Admin: Create Driver (/api/admin/drivers POST)", False, f"Response: {response}")
            return False

    def test_admin_list_drivers(self) -> bool:
        """Test GET /api/admin/drivers with stats"""
        success, response = self.make_request(
            'GET', '/admin/drivers'
        )
        
        if success and isinstance(response, list):
            driver_count = len(response)
            has_stats = any('total_deliveries' in driver and 'eco_score' in driver 
                           for driver in response)
            sample_driver = response[0] if response else {}
            
            self.log_test("Admin: List Drivers with Stats (/api/admin/drivers GET)", True, 
                         f"Found {driver_count} drivers, stats included: {has_stats}")
            if sample_driver:
                print(f"    Sample driver stats: deliveries={sample_driver.get('total_deliveries')}, "
                      f"eco_score={sample_driver.get('eco_score')}")
            return True
        else:
            self.log_test("Admin: List Drivers with Stats (/api/admin/drivers GET)", False, f"Response: {response}")
            return False

    def test_admin_delete_driver(self) -> bool:
        """Test DELETE /api/admin/drivers/{id} (deactivation)"""
        if not self.test_driver_id:
            self.log_test("Admin: Delete/Deactivate Driver", False, "No driver ID available")
            return False
            
        success, response = self.make_request(
            'DELETE', f'/admin/drivers/{self.test_driver_id}'
        )
        
        self.log_test("Admin: Delete/Deactivate Driver", success, 
                     f"Response: {response.get('message', response)}")
        return success

    # ==================== SUBSCRIPTION TESTS ====================
    
    def test_subscription_get_plans(self) -> bool:
        """Test GET /api/subscription/plans"""
        success, response = self.make_request('GET', '/subscription/plans')
        
        if success and isinstance(response, dict):
            expected_plans = ['solo', 'croissance', 'flotte_pro']
            has_all_plans = all(plan in response for plan in expected_plans)
            
            # Check plan structure
            plan_details = {}
            for plan_id in expected_plans:
                if plan_id in response:
                    plan = response[plan_id]
                    plan_details[plan_id] = {
                        'monthly': plan.get('monthly_price'),
                        'yearly': plan.get('yearly_price'),
                        'features': len(plan.get('features', []))
                    }
            
            self.log_test("Subscription: Get Plans (/api/subscription/plans)", has_all_plans,
                         f"Plans: {list(response.keys())}")
            for plan_id, details in plan_details.items():
                print(f"    {plan_id}: {details['monthly']}€/month, {details['yearly']}€/year, "
                      f"{details['features']} features")
            return has_all_plans
        else:
            self.log_test("Subscription: Get Plans (/api/subscription/plans)", False, f"Response: {response}")
            return False

    def test_subscription_get_current(self) -> bool:
        """Test GET /api/subscription/current"""
        success, response = self.make_request(
            'GET', '/subscription/current'
        )
        
        if success and 'plan' in response:
            self.log_test("Subscription: Get Current (/api/subscription/current)", True,
                         f"Plan: {response.get('plan')}, Status: {response.get('status')}, "
                         f"Billing: {response.get('billing_cycle')}")
            return True
        else:
            self.log_test("Subscription: Get Current (/api/subscription/current)", False, f"Response: {response}")
            return False

    def test_subscription_update_plan(self) -> bool:
        """Test POST /api/subscription/update"""
        update_data = {
            "plan": "croissance",
            "billing_cycle": "yearly"
        }
        
        success, response = self.make_request(
            'POST', '/subscription/update', update_data
        )
        
        if success and response.get('plan') == 'croissance':
            self.log_test("Subscription: Update Plan (/api/subscription/update)", True,
                         f"Updated to: {response.get('plan')} ({response.get('billing_cycle')}), "
                         f"Price: {response.get('price')}€")
            return True
        else:
            self.log_test("Subscription: Update Plan (/api/subscription/update)", False, f"Response: {response}")
            return False

    # ==================== NOTIFICATION TESTS ====================
    
    def test_notifications_get_all(self) -> bool:
        """Test GET /api/notifications"""
        success, response = self.make_request(
            'GET', '/notifications'
        )
        
        if success and isinstance(response, list):
            notification_types = [n.get('type') for n in response]
            self.log_test("Notifications: Get All (/api/notifications)", True,
                         f"Found {len(response)} notifications, types: {set(notification_types)}")
            return True
        else:
            self.log_test("Notifications: Get All (/api/notifications)", False, f"Response: {response}")
            return False

    def test_notifications_unread_count(self) -> bool:
        """Test GET /api/notifications/unread-count"""
        success, response = self.make_request(
            'GET', '/notifications/unread-count'
        )
        
        if success and 'count' in response:
            self.log_test("Notifications: Unread Count (/api/notifications/unread-count)", True,
                         f"Unread count: {response['count']}")
            return True
        else:
            self.log_test("Notifications: Unread Count (/api/notifications/unread-count)", False, f"Response: {response}")
            return False

    # ==================== WORKFLOW INTEGRATION TESTS ====================
    
    def test_complete_delivery_workflow(self) -> bool:
        """Test complete workflow: Admin creates → Assigns driver → Driver validates → Invoice created"""
        print("\n🔄 Testing Complete Delivery Workflow...")
        
        # Step 1: Admin creates delivery
        delivery_data = {
            "recipient_name": "Test Workflow Recipient",
            "recipient_address": "123 Workflow Street, Paris 75001",
            "recipient_phone": "0123456789",
            "package_description": "Workflow Test Package",
            "weight_kg": 3.5
        }
        
        success, response = self.make_request(
            'POST', '/deliveries', delivery_data, expected_status=200
        )
        
        if not success or 'tracking_id' not in response:
            self.log_test("Workflow Step 1: Admin Creates Delivery", False, f"Response: {response}")
            return False
            
        self.test_delivery_id = response['tracking_id']
        self.log_test("Workflow Step 1: Admin Creates Delivery", True, 
                     f"Created delivery: {self.test_delivery_id}")
        
        # Step 2: Get available drivers for assignment
        success, drivers = self.make_request('GET', '/admin/drivers')
        if not success or not drivers:
            self.log_test("Workflow Step 2: Get Available Drivers", False, "No drivers available")
            return False
            
        # Find an active driver
        active_driver = next((d for d in drivers if d.get('status') == 'active'), None)
        if not active_driver:
            self.log_test("Workflow Step 2: Find Active Driver", False, "No active drivers found")
            return False
            
        driver_id = active_driver['id']
        self.log_test("Workflow Step 2: Find Active Driver", True, 
                     f"Found driver: {active_driver.get('name')} ({driver_id})")
        
        # Step 3: Admin assigns driver (using form data as per API spec)
        assign_url = f"{self.base_url}/api/deliveries/{self.test_delivery_id}/assign"
        
        try:
            # Use form data as specified in the API
            response = self.admin_session.post(assign_url, 
                                       data={'driver_id': driver_id},
                                       headers={'Content-Type': 'application/x-www-form-urlencoded'})
            success = response.status_code == 200
            if success:
                response_data = response.json()
                self.log_test("Workflow Step 3: Admin Assigns Driver", True, 
                             f"Assigned {response_data.get('driver_name')} to delivery")
            else:
                self.log_test("Workflow Step 3: Admin Assigns Driver", False, 
                             f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Workflow Step 3: Admin Assigns Driver", False, f"Error: {e}")
            return False
        
        # Step 4: Check that driver received notification
        if self.driver_token:
            success, notifications = self.make_request('GET', '/notifications', session_type="driver")
            if success:
                mission_notifications = [n for n in notifications if n.get('type') == 'new_mission']
                self.log_test("Workflow Step 4: Driver Receives Notification", 
                             len(mission_notifications) > 0,
                             f"Found {len(mission_notifications)} mission notifications")
            else:
                self.log_test("Workflow Step 4: Driver Receives Notification", False, 
                             "Could not check driver notifications")
        
        # Step 5: Driver validates/completes delivery
        if self.driver_token:
            completion_data = {
                "status": "delivered",
                "delivery_notes": "Package delivered successfully via workflow test"
            }
            
            success, response = self.make_request(
                'PATCH', f'/deliveries/{self.test_delivery_id}', 
                completion_data, session_type="driver"
            )
            
            if success:
                self.log_test("Workflow Step 5: Driver Validates Delivery", True,
                             f"Delivery {self.test_delivery_id} marked as delivered")
            else:
                self.log_test("Workflow Step 5: Driver Validates Delivery", False, 
                             f"Response: {response}")
                return False
        else:
            self.log_test("Workflow Step 5: Driver Validates Delivery", False, 
                         "No driver token available")
            return False
        
        # Step 6: Check admin receives notification
        success, admin_notifications = self.make_request('GET', '/notifications')
        if success:
            completion_notifications = [n for n in admin_notifications 
                                      if n.get('type') == 'delivery_complete']
            self.log_test("Workflow Step 6: Admin Receives Completion Notification", 
                         len(completion_notifications) > 0,
                         f"Found {len(completion_notifications)} completion notifications")
        
        # Step 7: Check auto-invoice creation
        success, invoices = self.make_request('GET', '/invoices')
        if success and invoices:
            related_invoice = next((inv for inv in invoices 
                                  if inv.get('delivery_id') == self.test_delivery_id), None)
            if related_invoice:
                self.test_invoice_id = related_invoice['invoice_id']
                self.log_test("Workflow Step 7: Auto-Invoice Creation", True,
                             f"Invoice {self.test_invoice_id} created automatically, "
                             f"Amount: {related_invoice.get('amount')}€")
            else:
                self.log_test("Workflow Step 7: Auto-Invoice Creation", False, 
                             "No invoice found for completed delivery")
        else:
            self.log_test("Workflow Step 7: Auto-Invoice Creation", False, 
                         "Could not check invoices")
        
        return True

    def run_focused_tests(self):
        """Run focused test suite for specific features"""
        print("🚀 Starting Transporter-Pro Focused API Testing")
        print("Testing specific features mentioned in the request:")
        print("- Admin driver management")
        print("- Subscription system") 
        print("- Notifications")
        print("- Complete workflow integration")
        print("=" * 60)
        
        # Authentication Tests
        print("\n📋 AUTHENTICATION TESTS")
        self.admin_token = self.test_auth_login("admin@transporter-pro.com", "admin123", "Admin")
        self.driver_token = self.test_auth_login("driver@test.com", "driver123", "Driver")
        
        if not self.admin_token:
            print("❌ Cannot proceed without admin authentication")
            return False
            
        # Admin Driver Management Tests
        print("\n👥 ADMIN DRIVER MANAGEMENT TESTS")
        self.test_admin_create_driver()
        self.test_admin_list_drivers()
        self.test_admin_delete_driver()
        
        # Subscription Tests
        print("\n💳 SUBSCRIPTION TESTS")
        self.test_subscription_get_plans()
        self.test_subscription_get_current()
        self.test_subscription_update_plan()
        
        # Notification Tests
        print("\n🔔 NOTIFICATION TESTS")
        self.test_notifications_get_all()
        self.test_notifications_unread_count()
        
        # Workflow Integration Tests
        print("\n🔄 WORKFLOW INTEGRATION TESTS")
        self.test_complete_delivery_workflow()
        
        # Final Results
        print("\n" + "=" * 60)
        print(f"📊 TEST RESULTS: {self.tests_passed}/{self.tests_run} PASSED")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for failure in self.failed_tests:
                print(f"  - {failure}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"\n✨ Success Rate: {success_rate:.1f}%")
        
        return success_rate >= 70  # Consider 70%+ as passing for focused tests

def main():
    """Main test execution"""
    tester = TransporterProFocusedTester()
    success = tester.run_focused_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())