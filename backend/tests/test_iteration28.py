"""
Iteration 28 — Regression testing after server.py modular refactor.
Backend extracted helpers into /app/backend/core/{db,models,auth,services}.py
Validates all critical endpoints still work post-refactor.
"""
import os
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://delivery-cash-flow.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "azer@gmail.com"
ADMIN_PASSWORD = "Othmane2026!"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def auth(session):
    """Login admin azer@gmail.com — used by all authenticated tests."""
    r = session.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "access_token" in data, "Login response missing access_token"
    token = data["access_token"]
    session.headers.update({"Authorization": f"Bearer {token}"})
    return {"token": token, "data": data}


# ---------- AUTH ----------
class TestAuth:
    def test_login_returns_token_and_user(self, session, auth):
        data = auth["data"]
        assert data.get("access_token")
        # iteration 27 fix: subscription_status should be present in login response
        # not strictly required by review but check user shape
        user = data.get("user") or data
        assert user.get("email") == ADMIN_EMAIL or data.get("email") == ADMIN_EMAIL

    def test_auth_me(self, session, auth):
        r = session.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["email"] == ADMIN_EMAIL
        assert "plan" in d
        assert "subscription_status" in d
        assert "language" in d

    def test_auth_company_quota(self, session, auth):
        r = session.get(f"{BASE_URL}/api/auth/company-quota")
        assert r.status_code == 200, r.text

    def test_auth_refresh(self, session, auth):
        r = session.post(f"{BASE_URL}/api/auth/refresh")
        assert r.status_code in (200, 201), r.text


# ---------- COMPANY ----------
class TestCompany:
    def test_get_company(self, session, auth):
        r = session.get(f"{BASE_URL}/api/company")
        assert r.status_code == 200, r.text
        d = r.json()
        # must have siret company info
        assert isinstance(d, dict)


# ---------- ADMIN / DASHBOARD ----------
class TestAdminDashboard:
    def test_drivers(self, session, auth):
        r = session.get(f"{BASE_URL}/api/admin/drivers")
        assert r.status_code == 200, r.text
        assert isinstance(r.json(), list)

    def test_dashboard_stats(self, session, auth):
        r = session.get(f"{BASE_URL}/api/dashboard/stats")
        assert r.status_code == 200, r.text

    def test_audit_logs(self, session, auth):
        r = session.get(f"{BASE_URL}/api/audit-logs?limit=3")
        assert r.status_code == 200, r.text
        d = r.json()
        assert isinstance(d, list) or isinstance(d, dict)

    def test_deliveries(self, session, auth):
        r = session.get(f"{BASE_URL}/api/deliveries")
        assert r.status_code == 200, r.text
        assert isinstance(r.json(), list)

    def test_eco_scores_summary(self, session, auth):
        r = session.get(f"{BASE_URL}/api/eco-scores/summary")
        assert r.status_code == 200, r.text

    def test_damage_reports(self, session, auth):
        r = session.get(f"{BASE_URL}/api/damage-reports")
        assert r.status_code == 200, r.text

    def test_notifications(self, session, auth):
        r = session.get(f"{BASE_URL}/api/notifications")
        assert r.status_code == 200, r.text


# ---------- SIRET ----------
class TestSiret:
    def test_fake_siret(self, session, auth):
        r = session.get(f"{BASE_URL}/api/verify-siret/00000000000000")
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("valid") is False
        # message should mention introuvable
        msg = (d.get("error") or d.get("message") or "").lower()
        assert "introuvable" in msg or "not found" in msg or "invalid" in msg, f"Unexpected msg: {msg}"


# ---------- SUBSCRIPTION ----------
class TestSubscription:
    def test_subscription_plans(self, session, auth):
        r = session.get(f"{BASE_URL}/api/subscription/plans")
        assert r.status_code == 200, r.text
        d = r.json()
        assert isinstance(d, (list, dict))

    def test_stripe_payment_links(self, session, auth):
        r = session.get(f"{BASE_URL}/api/stripe/payment-links")
        assert r.status_code == 200, r.text


# ---------- SETTINGS / I18N ----------
class TestSettings:
    def test_patch_language_en_then_fr(self, session, auth):
        # Set language to en
        r = session.patch(f"{BASE_URL}/api/settings/preferences", json={"language": "en"})
        assert r.status_code == 200, f"PATCH lang=en failed: {r.text}"
        # verify via /auth/me
        r2 = session.get(f"{BASE_URL}/api/auth/me")
        assert r2.status_code == 200
        assert r2.json().get("language") == "en", f"Expected en, got {r2.json().get('language')}"
        # restore to fr
        r3 = session.patch(f"{BASE_URL}/api/settings/preferences", json={"language": "fr"})
        assert r3.status_code == 200, r3.text
        r4 = session.get(f"{BASE_URL}/api/auth/me")
        assert r4.json().get("language") == "fr"


# ---------- PASSWORD ----------
class TestPassword:
    def test_forgot_password_anti_enumeration(self, session):
        # No auth needed
        s = requests.Session()
        r = s.post(f"{BASE_URL}/api/auth/forgot-password", json={"email": "nonexistent@test.com"})
        # should return 200 generic regardless
        assert r.status_code == 200, f"Expected 200 anti-enum, got {r.status_code} {r.text}"

    def test_change_password_success(self, session, auth):
        # change to a temp password, then change back
        TMP = "TempPwd2026!Xyz"
        r = session.post(
            f"{BASE_URL}/api/auth/change-password",
            json={"current_password": ADMIN_PASSWORD, "new_password": TMP},
        )
        assert r.status_code == 200, f"change-password forward failed: {r.text}"
        # change back
        r2 = session.post(
            f"{BASE_URL}/api/auth/change-password",
            json={"current_password": TMP, "new_password": ADMIN_PASSWORD},
        )
        assert r2.status_code == 200, f"change-password rollback failed: {r2.text}"


# ---------- LOGOUT (last) ----------
class TestLogoutLast:
    def test_logout(self, session, auth):
        r = session.post(f"{BASE_URL}/api/auth/logout")
        assert r.status_code in (200, 204), r.text
