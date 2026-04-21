"""
Test Stripe Integration - Payment Links and Webhook
Tests for iteration 22: Stripe payment links and webhook processing
"""
import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://delivery-cash-flow.preview.emergentagent.com').rstrip('/')


class TestStripePaymentLinks:
    """Test Stripe payment links endpoint"""
    
    def test_get_payment_links_returns_all_plans(self):
        """GET /api/stripe/payment-links should return all 6 links (3 plans x 2 billing cycles)"""
        response = requests.get(f"{BASE_URL}/api/stripe/payment-links")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Verify all 3 plans exist
        assert "solo" in data, "Missing 'solo' plan"
        assert "croissance" in data, "Missing 'croissance' plan"
        assert "flotte_pro" in data, "Missing 'flotte_pro' plan"
        
        # Verify each plan has monthly and yearly links
        for plan in ["solo", "croissance", "flotte_pro"]:
            assert "monthly" in data[plan], f"Missing 'monthly' link for {plan}"
            assert "yearly" in data[plan], f"Missing 'yearly' link for {plan}"
            
            # Verify links are Stripe URLs
            assert data[plan]["monthly"].startswith("https://buy.stripe.com/"), f"Invalid monthly link for {plan}"
            assert data[plan]["yearly"].startswith("https://buy.stripe.com/"), f"Invalid yearly link for {plan}"
        
        print(f"✅ All 6 payment links returned correctly")
    
    def test_payment_links_structure(self):
        """Verify payment links have correct structure"""
        response = requests.get(f"{BASE_URL}/api/stripe/payment-links")
        data = response.json()
        
        expected_structure = {
            "solo": {"monthly": str, "yearly": str},
            "croissance": {"monthly": str, "yearly": str},
            "flotte_pro": {"monthly": str, "yearly": str}
        }
        
        for plan, cycles in expected_structure.items():
            assert plan in data, f"Missing plan: {plan}"
            for cycle, expected_type in cycles.items():
                assert cycle in data[plan], f"Missing {cycle} for {plan}"
                assert isinstance(data[plan][cycle], expected_type), f"Invalid type for {plan}.{cycle}"
        
        print("✅ Payment links structure is correct")


class TestStripeWebhook:
    """Test Stripe webhook endpoint"""
    
    def test_webhook_accepts_events(self):
        """POST /api/webhook/stripe should accept events and return {received: true}"""
        response = requests.post(
            f"{BASE_URL}/api/webhook/stripe",
            json={"type": "test_event", "data": {"object": {}}},
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("received") == True, f"Expected received: true, got {data}"
        
        print("✅ Webhook accepts events correctly")
    
    def test_webhook_checkout_session_completed_solo_monthly(self):
        """Test webhook processes checkout.session.completed for Solo monthly (39€)"""
        # Create a test admin first
        test_email = "test_stripe_solo@test.com"
        
        # Register test admin
        register_response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": test_email,
                "password": "testpass123",
                "name": "Test Stripe Solo",
                "role": "admin"
            }
        )
        
        # Send webhook event
        webhook_payload = {
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "id": "cs_test_solo_monthly",
                    "customer_email": test_email,
                    "customer_details": {"email": test_email},
                    "amount_total": 3900,  # 39€ in cents
                    "customer": "cus_test_solo",
                    "subscription": "sub_test_solo"
                }
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/webhook/stripe",
            json=webhook_payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        assert response.json().get("received") == True
        
        print("✅ Webhook processed Solo monthly checkout correctly")
    
    def test_webhook_checkout_session_completed_croissance_monthly(self):
        """Test webhook processes checkout.session.completed for Croissance monthly (189€)"""
        test_email = "test_stripe_croissance@test.com"
        
        # Register test admin
        requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": test_email,
                "password": "testpass123",
                "name": "Test Stripe Croissance",
                "role": "admin"
            }
        )
        
        webhook_payload = {
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "id": "cs_test_croissance_monthly",
                    "customer_email": test_email,
                    "customer_details": {"email": test_email},
                    "amount_total": 18900,  # 189€ in cents
                    "customer": "cus_test_croissance",
                    "subscription": "sub_test_croissance"
                }
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/webhook/stripe",
            json=webhook_payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        assert response.json().get("received") == True
        
        print("✅ Webhook processed Croissance monthly checkout correctly")
    
    def test_webhook_checkout_session_completed_flotte_pro_monthly(self):
        """Test webhook processes checkout.session.completed for Flotte Pro monthly (489€)"""
        test_email = "test_stripe_flotte@test.com"
        
        # Register test admin
        requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": test_email,
                "password": "testpass123",
                "name": "Test Stripe Flotte",
                "role": "admin"
            }
        )
        
        webhook_payload = {
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "id": "cs_test_flotte_monthly",
                    "customer_email": test_email,
                    "customer_details": {"email": test_email},
                    "amount_total": 48900,  # 489€ in cents
                    "customer": "cus_test_flotte",
                    "subscription": "sub_test_flotte"
                }
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/webhook/stripe",
            json=webhook_payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        assert response.json().get("received") == True
        
        print("✅ Webhook processed Flotte Pro monthly checkout correctly")
    
    def test_webhook_ignores_other_events(self):
        """Test webhook ignores non-checkout events"""
        response = requests.post(
            f"{BASE_URL}/api/webhook/stripe",
            json={
                "type": "customer.created",
                "data": {"object": {"id": "cus_test"}}
            },
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        assert response.json().get("received") == True
        
        print("✅ Webhook ignores non-checkout events correctly")


class TestStripeCreateCheckout:
    """Test Stripe create checkout endpoint (requires auth)"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "admin@transporter-pro.com",
                "password": "admin123"
            }
        )
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Admin login failed")
    
    def test_create_checkout_requires_auth(self):
        """POST /api/stripe/create-checkout requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/stripe/create-checkout",
            params={"plan": "solo", "billing": "monthly"}
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ Create checkout requires authentication")
    
    def test_create_checkout_returns_url(self, admin_token):
        """POST /api/stripe/create-checkout returns checkout URL with prefilled email"""
        response = requests.post(
            f"{BASE_URL}/api/stripe/create-checkout",
            params={"plan": "solo", "billing": "monthly"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "url" in data, "Missing 'url' in response"
        assert "prefilled_email" in data["url"], "URL should contain prefilled_email"
        assert "admin@transporter-pro.com" in data["url"], "URL should contain admin email"
        
        print(f"✅ Create checkout returns URL with prefilled email: {data['url'][:80]}...")
    
    def test_create_checkout_invalid_plan(self, admin_token):
        """POST /api/stripe/create-checkout with invalid plan returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/stripe/create-checkout",
            params={"plan": "invalid_plan", "billing": "monthly"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✅ Create checkout rejects invalid plan")


class TestAuthRegression:
    """Regression tests for authentication"""
    
    def test_admin_login(self):
        """Admin login should work"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "admin@transporter-pro.com",
                "password": "admin123"
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("role") == "admin"
        assert "access_token" in data
        
        print("✅ Admin login works correctly")
    
    def test_driver_login(self):
        """Driver login should work"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "driver@test.com",
                "password": "driver123"
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("role") == "driver"
        assert "access_token" in data
        
        print("✅ Driver login works correctly")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
