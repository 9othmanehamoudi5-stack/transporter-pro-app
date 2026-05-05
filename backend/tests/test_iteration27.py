"""
Iteration 27 - Critical bypass fix verification.
- verify-siret must reject fake SIRET, accept real Google France SIRET
- onboarding/complete must 400 on invalid SIRET, 200 on valid
- register admin must return subscription_status='incomplete'
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://delivery-cash-flow.preview.emergentagent.com").rstrip("/")

FAKE_SIRET = "11111111111111"
FAKE_SIRET_2 = "12345678901234"
REAL_SIRET = "44306184100047"  # Google France


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --- SIRET validation endpoint ---
class TestVerifySiret:
    def test_fake_siret_rejected(self, client):
        r = client.get(f"{BASE_URL}/api/verify-siret/{FAKE_SIRET}", timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("valid") is False, f"Fake SIRET must be rejected, got {data}"

    def test_fake_siret_2_rejected(self, client):
        r = client.get(f"{BASE_URL}/api/verify-siret/{FAKE_SIRET_2}", timeout=30)
        assert r.status_code == 200
        assert r.json().get("valid") is False

    def test_real_siret_accepted(self, client):
        r = client.get(f"{BASE_URL}/api/verify-siret/{REAL_SIRET}", timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("valid") is True, f"Real SIRET must be accepted, got {data}"
        assert data.get("company_name"), "company_name must be present"
        assert data.get("address"), "address must be present"


# --- Register and onboarding behaviour ---
class TestRegisterAdminSubscriptionStatus:
    @pytest.fixture(scope="class")
    def new_admin(self, client):
        email = f"TEST_bypass_{uuid.uuid4().hex[:8]}@test.com"
        payload = {
            "email": email,
            "password": "test1234",
            "name": "Test Bypass",
            "role": "admin",
        }
        r = client.post(f"{BASE_URL}/api/auth/register", json=payload, timeout=30)
        assert r.status_code in (200, 201), r.text
        data = r.json()
        return {"email": email, "password": "test1234", "resp": data}

    def test_register_returns_incomplete_status(self, new_admin):
        resp = new_admin["resp"]
        user = resp.get("user") or resp
        assert user.get("subscription_status") == "incomplete", (
            f"Expected subscription_status='incomplete', got {user.get('subscription_status')}"
        )

    def test_auth_me_reflects_incomplete(self, client, new_admin):
        token = new_admin["resp"].get("access_token") or new_admin["resp"].get("token")
        assert token, "No access_token returned from register"
        r = client.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
            timeout=30,
        )
        assert r.status_code == 200, r.text
        me = r.json()
        assert me.get("subscription_status") == "incomplete"

    def test_onboarding_with_fake_siret_rejected(self, client, new_admin):
        token = new_admin["resp"].get("access_token") or new_admin["resp"].get("token")
        r = client.post(
            f"{BASE_URL}/api/onboarding/complete",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "company_name": "FakeCo",
                "siret": FAKE_SIRET,
                "tva_intra": "",
                "address": "1 rue fake",
            },
            timeout=30,
        )
        assert r.status_code == 400, f"Expected 400 for fake SIRET, got {r.status_code}: {r.text}"

    def test_onboarding_with_valid_siret_accepted(self, client, new_admin):
        token = new_admin["resp"].get("access_token") or new_admin["resp"].get("token")
        r = client.post(
            f"{BASE_URL}/api/onboarding/complete",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "company_name": "GOOGLE FRANCE",
                "siret": REAL_SIRET,
                "tva_intra": "",
                "address": "8 Rue de Londres, 75009 Paris",
            },
            timeout=30,
        )
        assert r.status_code == 200, f"Expected 200 for valid SIRET, got {r.status_code}: {r.text}"

    def test_after_onboarding_status_still_incomplete(self, client, new_admin):
        """Onboarding must not activate subscription. Only Stripe webhook does."""
        token = new_admin["resp"].get("access_token") or new_admin["resp"].get("token")
        r = client.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
            timeout=30,
        )
        me = r.json()
        assert me.get("subscription_status") == "incomplete", (
            f"After onboarding, status must still be 'incomplete' until Stripe webhook. Got {me.get('subscription_status')}"
        )
        assert me.get("onboarding_complete") is True


# --- Admin paid account dashboard access ---
class TestExistingPaidAdmin:
    def test_existing_admin_can_login_and_has_active(self, client):
        r = client.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@transporter-pro.com", "password": "admin123"},
            timeout=30,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        token = data.get("access_token") or data.get("token")
        me = client.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
            timeout=30,
        ).json()
        # Per context: existing admin has subscription_status='active'
        assert me.get("subscription_status") in ("active", "trialing"), (
            f"Seeded admin should be active/trialing, got {me.get('subscription_status')}"
        )
