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

# Centralized driver quotas per plan.
# - `None` (or -1) = unlimited.
# - Legacy plan names ("solo", "croissance", "flotte_pro") are kept so that
#   users on the old plans still resolve to the correct quota.
PLAN_DRIVER_LIMITS = {
    "starter": 3,
    "pme": 15,
    "flotte": None,
    "solo": 3,
    "croissance": 15,
    "flotte_pro": None,
}

def get_max_drivers(plan: str) -> int:
    """Return the max driver count for a given plan. Unknown plans fall back to Starter (3).
    Unlimited plans (value=None) are returned as -1 to keep the historical contract
    used by callers (`if max_drivers != -1: ...`)."""
    value = PLAN_DRIVER_LIMITS.get(plan, 3)
    return -1 if value is None else value
RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
FRONTEND_BASE_URL = os.environ.get(
    "FRONTEND_BASE_URL",
    "https://delivery-cash-flow.preview.emergentagent.com"
)
