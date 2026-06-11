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
    "solo":        3,   # Plan SOLO — jusqu'à 3 chauffeurs
    "croissance": 15,   # Plan CROISSANCE — jusqu'à 15 chauffeurs
    "flotte_pro": -1,   # Plan FLOTTE PRO — illimité
}

def get_max_drivers(plan: str) -> int:
    """Return the max driver count for a given plan. Unknown plans fall back to Solo (3)."""
    return PLAN_DRIVER_LIMITS.get(plan, PLAN_DRIVER_LIMITS["solo"])
RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
FRONTEND_BASE_URL = os.environ.get(
    "FRONTEND_BASE_URL",
    "https://delivery-cash-flow.preview.emergentagent.com"
)
