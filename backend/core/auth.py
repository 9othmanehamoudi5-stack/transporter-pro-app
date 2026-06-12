"""Authentication helpers: hashing, JWT, current user, role guards, audit logging."""
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException, Request, Depends
from bson import ObjectId
import bcrypt
import jwt

from .db import db, JWT_SECRET, JWT_ALGORITHM


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=60),
        "type": "access"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        if user.get("status") == "deleted":
            raise HTTPException(status_code=403, detail="Account deleted")
        return {
            "id": str(user["_id"]),
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "company_id": user.get("company_id", str(user["_id"])),
            "plan": user.get("plan") or "solo",  # lit le VRAI plan depuis MongoDB — jamais de default trompeur
            "subscription_status": user.get("subscription_status", "trial"),
            "trial_ends_at": user.get("trial_ends_at", "").isoformat() if isinstance(user.get("trial_ends_at"), datetime) else str(user.get("trial_ends_at", "")),
            "onboarding_complete": user.get("onboarding_complete", False),
            "created_at": user.get("created_at", "").isoformat() if isinstance(user.get("created_at"), datetime) else str(user.get("created_at", "")),
            "language": user.get("language", "fr"),
            "logo_base64": user.get("logo_base64", ""),
            "2fa_enabled": user.get("2fa_enabled", False),
            "notification_prefs": user.get("notification_prefs", {
                "new_dispute": True,
                "weekly_eco": True,
                "quota_alert": True,
            }),
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def require_role(*roles):
    async def role_checker(user: dict = Depends(get_current_user)):
        if user["role"] not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return role_checker


async def log_action(
    user_id: str,
    company_id: str,
    action: str,
    entity_type: str,
    entity_id: str = "",
    details: str = "",
):
    """Log every significant action for traceability"""
    await db.audit_logs.insert_one({
        "user_id": user_id,
        "company_id": company_id,
        "action": action,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "details": details,
        "timestamp": datetime.now(timezone.utc),
        "ip": ""
    })
