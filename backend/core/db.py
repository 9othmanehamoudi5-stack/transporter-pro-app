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

# Centralized driver quotas per plan. -1 = unlimited.
# Keys MUST match the plan slugs stored in the users collection (set by the Stripe webhook).
PLAN_DRIVER_LIMITS = {
    "solo":        3,    # Plan SOLO       — jusqu'à 3 chauffeurs
    "croissance":  10,   # Plan CROISSANCE — jusqu'à 10 chauffeurs
    "flotte_pro":  -1,   # Plan FLOTTE PRO — illimité
}

def get_max_drivers(plan: str) -> int:
    """Return the max driver count for a given plan slug (as stored in MongoDB).
    If the plan slug is unrecognised (None, empty, or unexpected value coming from DB),
    we return -1 (unlimited) rather than capping at 3, so that a paid user is NEVER
    wrongly blocked. The quota check in server.py treats -1 as 'no limit'.
    """
    if not plan or plan not in PLAN_DRIVER_LIMITS:
        return -1   # fail-open: unknown plan = no cap (prevents wrongly blocking paid users)
    return PLAN_DRIVER_LIMITS[plan]

RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
FRONTEND_BASE_URL = os.environ.get(
    "FRONTEND_BASE_URL",
    "https://delivery-cash-flow.preview.emergentagent.com"
)
