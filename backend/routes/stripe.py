"""Stripe endpoints — extracted from server.py (structure only)."""
from __future__ import annotations
import os
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request

from core.db import db, STRIPE_SECRET_KEY, FRONTEND_BASE_URL
from core.auth import get_current_user, require_role, log_action
from server import (
    STRIPE_PAYMENT_LINKS, SUBSCRIPTION_PLANS,
    _activate_admin_subscription, _detect_plan_from_amount,
    logger, limiter,
)
import stripe

router = APIRouter(prefix="/api")


@router.get("/stripe/payment-links")
async def get_payment_links():
    """Get Stripe payment links for all plans"""
    return STRIPE_PAYMENT_LINKS




@router.post("/stripe/create-checkout")
@limiter.limit("5/minute")
async def create_stripe_checkout(request: Request, plan: str, billing: str = "monthly", user: dict = Depends(require_role("admin"))):
    """Redirect the admin to the raw Stripe Payment Link (in-app version: no free trial).
    The Payment Link URL is used as-is, only enriched with `prefilled_email` +
    `client_reference_id` query params so the webhook can map the Stripe session
    back to our user."""
    if billing not in ("monthly", "yearly"):
        billing = "monthly"

    plan_links = STRIPE_PAYMENT_LINKS.get(plan)
    if not plan_links:
        raise HTTPException(status_code=400, detail=f"Plan invalide : {plan}")

    # In-app checkout uses the *_no_trial variant. Fallback to the with-trial link
    # only if the no-trial variant isn't configured for that plan.
    base_url = plan_links.get(f"{billing}_no_trial") or plan_links.get(billing)
    if not base_url:
        raise HTTPException(status_code=400, detail=f"Cycle invalide pour {plan} : {billing}")

    checkout_url = f"{base_url}?prefilled_email={user['email']}&client_reference_id={user['id']}"
    await log_action(user["id"], user["company_id"], "stripe_checkout_started", "subscription", plan, f"billing={billing}")
    return {"url": checkout_url, "plan": plan, "billing": billing}




@router.post("/stripe/verify-payment")
async def stripe_verify_payment(user: dict = Depends(require_role("admin"))):
    """Fallback when the webhook didn't fire (or isn't configured).
    Asks Stripe directly whether the current admin has a paid checkout session,
    and if so, activates their subscription. Idempotent.
    """
    import stripe
    stripe.api_key = STRIPE_SECRET_KEY

    if not STRIPE_SECRET_KEY:
        raise HTTPException(status_code=500, detail="Stripe non configuré")

    admin = await db.users.find_one({"_id": ObjectId(user["id"]), "role": "admin"})
    if not admin:
        raise HTTPException(status_code=404, detail="Admin introuvable")

    # Already active? short-circuit
    if admin.get("subscription_status") in ("active", "trialing"):
        return {"activated": False, "already_active": True, "subscription_status": admin.get("subscription_status")}

    matched_session = None
    try:
        # 1) Try matching by client_reference_id (our user id)
        sessions = stripe.checkout.Session.list(limit=20)
        for s in sessions.data:
            if (
                s.get("client_reference_id") == user["id"]
                and s.get("payment_status") in ("paid", "no_payment_required")
                and s.get("status") == "complete"
            ):
                matched_session = s
                break

        # 2) Fallback: by email
        if not matched_session:
            email = admin.get("email", "").lower()
            for s in sessions.data:
                s_email = (s.get("customer_email") or "").lower()
                if not s_email:
                    details = s.get("customer_details") or {}
                    s_email = (details.get("email") or "").lower()
                if (
                    s_email == email
                    and s.get("payment_status") in ("paid", "no_payment_required")
                    and s.get("status") == "complete"
                ):
                    matched_session = s
                    break
    except stripe.error.AuthenticationError as e:
        logger.error(f"Stripe verify-payment AUTH error: {e}")
        raise HTTPException(
            status_code=503,
            detail="Service Stripe momentanément indisponible. Notre équipe a été notifiée — réessayez dans quelques minutes ou contactez le support.",
        )
    except Exception as e:
        logger.error(f"Stripe verify-payment error: {e}")
        raise HTTPException(status_code=502, detail=f"Erreur Stripe: {e}")

    if not matched_session:
        return {
            "activated": False,
            "already_active": False,
            "message": "Aucun paiement Stripe trouvé pour ce compte. Si vous venez de payer, attendez 1 minute et réessayez.",
        }

    result = await _activate_admin_subscription(admin, matched_session, source="verify_payment_fallback")
    return {
        "activated": True,
        "already_active": False,
        "plan": result["plan"],
        "billing_cycle": result["billing_cycle"],
        "subscription_status": "active",
    }



