"""Database client and shared environment configuration."""
from dotenv import load_dotenv
load_dotenv()

import os
import secrets
from motor.motor_asyncio import AsyncIOMotorClient

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Configuration / secrets
JWT_SECRET = os.environ.get("JWT_SECRET", secrets.token_hex(32))
JWT_ALGORITHM = "HS256"
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")
STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET")

# Stripe Price IDs (loaded from env so the user can paste keys without code changes).
# These must match Price IDs from the user's Stripe Dashboard → Products.
STRIPE_PRICE_IDS = {
    "solo": {
        "monthly": os.environ.get("STRIPE_PRICE_SOLO") or os.environ.get("STRIPE_PRICE_SOLO_MONTHLY"),
        "yearly": os.environ.get("STRIPE_PRICE_SOLO_YEARLY"),
    },
    "croissance": {
        "monthly": os.environ.get("STRIPE_PRICE_CROISSANCE") or os.environ.get("STRIPE_PRICE_CROISSANCE_MONTHLY"),
        "yearly": os.environ.get("STRIPE_PRICE_CROISSANCE_YEARLY"),
    },
    "flotte_pro": {
        "monthly": os.environ.get("STRIPE_PRICE_FLOTTE") or os.environ.get("STRIPE_PRICE_FLOTTE_MONTHLY") or os.environ.get("STRIPE_PRICE_FLOTTE_PRO"),
        "yearly": os.environ.get("STRIPE_PRICE_FLOTTE_YEARLY") or os.environ.get("STRIPE_PRICE_FLOTTE_PRO_YEARLY"),
    },
}

# Centralized driver quotas per plan. -1 = unlimited.
PLAN_DRIVER_LIMITS = {
    "solo": 3,
    "croissance": 15,
    "flotte_pro": -1,
}

def get_max_drivers(plan: str) -> int:
    """Return the max driver count for a given plan. Unknown plans fall back to Solo (3)."""
    return PLAN_DRIVER_LIMITS.get(plan, 3)
RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
FRONTEND_BASE_URL = os.environ.get(
    "FRONTEND_BASE_URL",
    "https://delivery-cash-flow.preview.emergentagent.com"
)
