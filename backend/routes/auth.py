"""Auth endpoints — extracted from server.py (structure only, no logic changes)."""
from __future__ import annotations
import jwt
import re
import bcrypt
import uuid
import os
from datetime import datetime, timedelta, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import JSONResponse

from core.db import db, JWT_SECRET, JWT_ALGORITHM, FRONTEND_BASE_URL, get_max_drivers
from core.auth import (
    hash_password, verify_password,
    create_access_token, create_refresh_token,
    get_current_user, require_role, log_action,
)
from core.models import (
    UserCreate, UserLogin,
    ForgotPasswordRequest, ResetPasswordRequest, ChangePasswordRequest,
    TwoFactorVerify, DeleteAccountRequest,
)
# server-defined helpers (populated by the time this module is imported at server.py bottom)
from server import _send_password_reset_email, _send_2fa_email, logger, limiter

router = APIRouter(prefix="/api")


@router.post("/auth/register")
async def register(request: Request, data: UserCreate):
    # Block public driver registration — drivers must be created by admin
    if data.role == "driver":
        raise HTTPException(status_code=403, detail="Les comptes chauffeurs sont créés par l'administrateur de l'entreprise.")

    email = data.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_doc = {
        "email": email,
        "password_hash": hash_password(data.password),
        "name": data.name,
        "role": data.role,
        "plan": "starter",
        "created_at": datetime.now(timezone.utc)
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    # For admin, company_id = their own user id
    # SECURITY: subscription_status starts as "incomplete" — user MUST complete Stripe checkout
    # before accessing the dashboard. The Stripe webhook flips this to "active" on successful payment.
    if data.role == "admin":
        trial_ends = datetime.now(timezone.utc) + timedelta(days=30)
        await db.users.update_one({"_id": result.inserted_id}, {"$set": {
            "company_id": user_id,
            "trial_ends_at": trial_ends,
            "subscription_status": "incomplete"
        }})
    
    access_token = create_access_token(user_id, email, data.role)
    refresh_token = create_refresh_token(user_id)
    
    response = JSONResponse(content={
        "id": user_id,
        "email": email,
        "name": data.name,
        "role": data.role,
        "onboarding_complete": False,
        "company_id": user_id if data.role == "admin" else "",
        "plan": "starter",
        "subscription_status": "incomplete" if data.role == "admin" else "n/a",
        "access_token": access_token,
        "refresh_token": refresh_token
    })
    response.set_cookie("access_token", access_token, httponly=True, secure=True, samesite="none", max_age=3600, path="/")
    response.set_cookie("refresh_token", refresh_token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    return response



@router.post("/auth/login")
async def login(request: Request, data: UserLogin):
    email = data.email.lower()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"
    
    # Check brute force
    attempts = await db.login_attempts.find_one({"identifier": identifier})
    if attempts and attempts.get("count", 0) >= 5:
        lockout_until = attempts.get("lockout_until")
        if isinstance(lockout_until, datetime):
            if lockout_until.tzinfo is None:
                lockout_until = lockout_until.replace(tzinfo=timezone.utc)
            if datetime.now(timezone.utc) < lockout_until:
                raise HTTPException(status_code=429, detail="Trop de tentatives — réessayez dans 15 minutes.")
    
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(data.password, user["password_hash"]):
        # Increment failed attempts
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {
                "$inc": {"count": 1},
                "$set": {"lockout_until": datetime.now(timezone.utc) + timedelta(minutes=15)}
            },
            upsert=True
        )
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Hard block deleted accounts
    if user.get("status") == "deleted":
        raise HTTPException(status_code=403, detail="Ce compte a été supprimé et ne peut plus se connecter.")

    # Clear attempts on success
    await db.login_attempts.delete_one({"identifier": identifier})

    user_id = str(user["_id"])

    # ==================== 2FA GATE ====================
    # If user has 2fa_enabled, issue a short-lived challenge token instead of access_token
    if user.get("2fa_enabled") is True and user.get("role") == "admin":
        code = "".join(secrets.choice("0123456789") for _ in range(6))
        challenge_token = secrets.token_urlsafe(32)
        await db.two_factor_challenges.insert_one({
            "token": challenge_token,
            "user_id": user_id,
            "email": email,
            "code_hash": hash_password(code),
            "expires_at": datetime.now(timezone.utc) + timedelta(minutes=10),
            "attempts": 0,
            "used": False,
            "created_at": datetime.now(timezone.utc),
        })
        # Send code via Resend
        await _send_2fa_email(email, user.get("name", ""), code)
        return JSONResponse(content={
            "requires_2fa": True,
            "challenge_token": challenge_token,
            "message": "Un code à 6 chiffres a été envoyé à votre email.",
        })
    # ==================== END 2FA GATE ====================

    access_token = create_access_token(user_id, email, user["role"])
    refresh_token = create_refresh_token(user_id)
    
    response = JSONResponse(content={
        "id": user_id,
        "email": email,
        "name": user["name"],
        "role": user["role"],
        "company_id": user.get("company_id", user_id),
        "plan": user.get("plan", "starter"),
        "onboarding_complete": user.get("onboarding_complete", False),
        "subscription_status": user.get("subscription_status", "incomplete" if user["role"] == "admin" else "n/a"),
        "trial_ends_at": user.get("trial_ends_at", "").isoformat() if isinstance(user.get("trial_ends_at"), datetime) else str(user.get("trial_ends_at", "")),
        "access_token": access_token,
        "refresh_token": refresh_token
    })
    response.set_cookie("access_token", access_token, httponly=True, secure=True, samesite="none", max_age=3600, path="/")
    response.set_cookie("refresh_token", refresh_token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    await log_action(user_id, user.get("company_id", user_id), "login", "user", user_id, f"Login: {email}")
    return response



@router.post("/auth/logout")
async def logout():
    response = JSONResponse(content={"message": "Logged out"})
    response.delete_cookie("access_token", path="/", secure=True, samesite="none")
    response.delete_cookie("refresh_token", path="/", secure=True, samesite="none")
    return response



@router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return user




@router.post("/auth/forgot-password")
async def forgot_password(data: ForgotPasswordRequest):
    """Generate a single-use password reset token and email it to the user.
    Anti-enumeration: always returns the same generic success message regardless of email existence."""
    email = data.email.lower().strip()
    user = await db.users.find_one({"email": email})

    generic_response = {
        "message": "Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé.",
    }

    if not user:
        logger.info(f"Forgot-password: unknown email {email} (silently OK)")
        return generic_response

    # Invalidate previous unused tokens for this user (one active token at a time)
    await db.password_resets.update_many(
        {"user_id": str(user["_id"]), "used": False},
        {"$set": {"used": True, "invalidated_at": datetime.now(timezone.utc)}},
    )

    token = secrets.token_urlsafe(48)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    await db.password_resets.insert_one({
        "user_id": str(user["_id"]),
        "email": email,
        "token": token,
        "expires_at": expires_at,
        "used": False,
        "created_at": datetime.now(timezone.utc),
    })

    reset_url = f"{FRONTEND_BASE_URL}/reset-password?token={token}"
    sent = await _send_password_reset_email(email, user.get("name", ""), reset_url)
    if not sent:
        # Dev / Resend test-mode convenience: surface the link in logs so the operator
        # can still use it. Production will use a verified domain (no fallback needed).
        logger.warning(f"[DEV-FALLBACK] Reset link for {email}: {reset_url}")

    await log_action(
        str(user["_id"]),
        user.get("company_id", str(user["_id"])),
        "password_reset_requested",
        "user",
        str(user["_id"]),
        f"Reset email {'sent' if sent else 'FAILED'} to {email}",
    )

    return generic_response




@router.post("/auth/reset-password")
async def reset_password(data: ResetPasswordRequest):
    """Consume a password reset token and set the new password."""
    record = await db.password_resets.find_one({"token": data.token, "used": False})
    if not record:
        raise HTTPException(status_code=400, detail="Lien invalide ou déjà utilisé")

    expires_at = record.get("expires_at")
    if isinstance(expires_at, datetime):
        # Make tz-aware comparison safe
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Lien expiré — demandez un nouveau lien")

    user = await db.users.find_one({"_id": ObjectId(record["user_id"])})
    if not user:
        raise HTTPException(status_code=404, detail="Compte introuvable")

    new_hash = hash_password(data.new_password)
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"password_hash": new_hash, "password_updated_at": datetime.now(timezone.utc)}},
    )
    await db.password_resets.update_one(
        {"_id": record["_id"]},
        {"$set": {"used": True, "used_at": datetime.now(timezone.utc)}},
    )
    # Clear any login-attempt lockout
    await db.login_attempts.delete_many({"identifier": {"$regex": f"{user['email']}$"}})

    await log_action(
        str(user["_id"]),
        user.get("company_id", str(user["_id"])),
        "password_reset_completed",
        "user",
        str(user["_id"]),
        "Password reset via email link",
    )

    return {"message": "Mot de passe modifié — vous pouvez vous connecter."}




@router.post("/auth/change-password")
async def change_password(data: ChangePasswordRequest, user: dict = Depends(get_current_user)):
    """Authenticated password change (settings page). Requires current password."""
    user_doc = await db.users.find_one({"_id": ObjectId(user["id"])})
    if not user_doc:
        raise HTTPException(status_code=404, detail="Compte introuvable")
    if not verify_password(data.current_password, user_doc["password_hash"]):
        raise HTTPException(status_code=400, detail="Mot de passe actuel incorrect")

    if data.current_password == data.new_password:
        raise HTTPException(status_code=400, detail="Le nouveau mot de passe doit être différent")

    await db.users.update_one(
        {"_id": user_doc["_id"]},
        {"$set": {
            "password_hash": hash_password(data.new_password),
            "password_updated_at": datetime.now(timezone.utc),
        }},
    )
    await log_action(
        user["id"],
        user.get("company_id", user["id"]),
        "password_changed",
        "user",
        user["id"],
        "Password changed via settings",
    )
    return {"message": "Mot de passe modifié avec succès"}




@router.post("/auth/2fa/verify")
async def verify_2fa(data: TwoFactorVerify):
    """Exchange a valid 2FA challenge_token+code for real access/refresh tokens."""
    challenge = await db.two_factor_challenges.find_one({"token": data.challenge_token, "used": False})
    if not challenge:
        raise HTTPException(status_code=400, detail="Session 2FA invalide ou expirée")

    expires_at = challenge.get("expires_at")
    if isinstance(expires_at, datetime):
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Code expiré — reconnectez-vous")

    if challenge.get("attempts", 0) >= 5:
        raise HTTPException(status_code=429, detail="Trop de tentatives. Reconnectez-vous.")

    if not verify_password(data.code, challenge["code_hash"]):
        await db.two_factor_challenges.update_one(
            {"_id": challenge["_id"]},
            {"$inc": {"attempts": 1}},
        )
        raise HTTPException(status_code=400, detail="Code incorrect")

    user = await db.users.find_one({"_id": ObjectId(challenge["user_id"])})
    if not user or user.get("status") == "deleted":
        raise HTTPException(status_code=403, detail="Compte indisponible")

    await db.two_factor_challenges.update_one(
        {"_id": challenge["_id"]},
        {"$set": {"used": True, "used_at": datetime.now(timezone.utc)}},
    )

    user_id = str(user["_id"])
    access_token = create_access_token(user_id, user["email"], user["role"])
    refresh_token = create_refresh_token(user_id)
    response = JSONResponse(content={
        "id": user_id,
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "company_id": user.get("company_id", user_id),
        "plan": user.get("plan", "starter"),
        "onboarding_complete": user.get("onboarding_complete", False),
        "subscription_status": user.get("subscription_status", "incomplete"),
        "access_token": access_token,
        "refresh_token": refresh_token,
    })
    response.set_cookie("access_token", access_token, httponly=True, secure=True, samesite="none", max_age=3600, path="/")
    response.set_cookie("refresh_token", refresh_token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    await log_action(user_id, user.get("company_id", user_id), "2fa_verified", "user", user_id, "Login 2FA OK")
    return response




@router.delete("/auth/account")
async def delete_my_account(data: DeleteAccountRequest, user: dict = Depends(require_role("admin"))):
    """Danger zone: cancel Stripe subscription + mark user deleted + force logout."""
    user_doc = await db.users.find_one({"_id": ObjectId(user["id"])})
    if not user_doc or not verify_password(data.password, user_doc["password_hash"]):
        raise HTTPException(status_code=400, detail="Mot de passe incorrect")

    # Best-effort: cancel Stripe subscription immediately
    sub_id = user_doc.get("stripe_subscription_id", "")
    if sub_id and not sub_id.startswith("sub_test_"):
        try:
            import stripe
            stripe.api_key = STRIPE_SECRET_KEY
            await asyncio.to_thread(stripe.Subscription.delete, sub_id)
            logger.info(f"Stripe subscription {sub_id} cancelled for deleted user {user['id']}")
        except Exception as e:
            logger.warning(f"Stripe cancel failed for {sub_id}: {e}")

    # Mark user deleted (anonymize email so the slot can be re-registered if you want; but keep a tombstone)
    await db.users.update_one(
        {"_id": user_doc["_id"]},
        {"$set": {
            "status": "deleted",
            "deleted_at": datetime.now(timezone.utc),
            "subscription_status": "cancelled",
            "email_deleted_suffix": datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S"),
        }},
    )
    # Rename email to prevent any future login with this address
    await db.users.update_one(
        {"_id": user_doc["_id"]},
        [{"$set": {"email": {"$concat": ["$email", ".deleted.", "$email_deleted_suffix"]}}}],
    )

    # Clear any active sessions
    await db.login_attempts.delete_many({"identifier": {"$regex": f"{user_doc['email']}$"}})

    await log_action(user["id"], user.get("company_id", user["id"]), "account_deleted", "user", user["id"], f"Self-service account deletion; sub={sub_id}")

    response = JSONResponse(content={"message": "Compte supprimé. Vous allez être déconnecté."})
    response.delete_cookie("access_token", path="/", secure=True, samesite="none")
    response.delete_cookie("refresh_token", path="/", secure=True, samesite="none")
    return response




@router.get("/auth/company-quota")
async def get_company_quota(user: dict = Depends(require_role("admin"))):
    """Get current driver count vs plan limit.
    Strict rules: starter=3, pme=15, flotte=unlimited(-1). Legacy plan names (solo/croissance/flotte_pro) still resolve.
    Reads `plan` directly from DB (via get_current_user) so it always reflects the
    latest webhook-confirmed state."""
    company_id = user["company_id"]
    driver_count = await db.users.count_documents({"role": "driver", "company_id": company_id, "status": {"$ne": "inactive"}})
    plan = user.get("plan", "starter")
    max_drivers = get_max_drivers(plan)
    return {
        "driver_count": driver_count,
        "max_drivers": max_drivers,
        "plan": plan,
        "can_add": max_drivers == -1 or driver_count < max_drivers
    }



@router.post("/auth/refresh")
async def refresh_token(request: Request):
    # Try cookie first, then body, then Authorization header
    token = request.cookies.get("refresh_token")
    if not token:
        try:
            body = await request.json()
            token = body.get("refresh_token")
        except Exception:
            pass
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        user_id = str(user["_id"])
        access_token = create_access_token(user_id, user["email"], user["role"])
        
        response = JSONResponse(content={"message": "Token refreshed", "access_token": access_token})
        response.set_cookie("access_token", access_token, httponly=True, secure=True, samesite="none", max_age=3600, path="/")
        return response
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")


