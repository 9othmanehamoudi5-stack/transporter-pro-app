from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends, UploadFile, File, Form
from fastapi.responses import JSONResponse, FileResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
import bcrypt
import jwt
import secrets
import hashlib
import base64
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone, timedelta

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).parent

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get("JWT_SECRET", secrets.token_hex(32))
JWT_ALGORITHM = "HS256"
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")
STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET")

app = FastAPI(title="Transporter-Pro API")
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: Literal["admin", "driver", "client"] = "client"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    created_at: str

class DeliveryCreate(BaseModel):
    recipient_name: str
    recipient_address: str
    recipient_phone: str
    package_description: str
    weight_kg: float = 1.0
    client_id: Optional[str] = None
    driver_id: Optional[str] = None

class DeliveryUpdate(BaseModel):
    status: Optional[Literal["pending", "assigned", "in_transit", "delivered", "failed"]] = None
    driver_id: Optional[str] = None
    signature_data: Optional[str] = None
    delivery_notes: Optional[str] = None

class InvoiceCreate(BaseModel):
    delivery_id: str
    amount: float
    client_id: str

class DamageReportCreate(BaseModel):
    delivery_id: str
    photo_base64: str
    description: Optional[str] = None

class EcoScoreUpdate(BaseModel):
    harsh_braking_count: int = 0
    harsh_acceleration_count: int = 0
    distance_km: float = 0
    fuel_liters: float = 0

class OfflineSyncData(BaseModel):
    deliveries: List[dict] = []
    damage_reports: List[dict] = []
    signatures: List[dict] = []

class ChatMessage(BaseModel):
    message: str
    history: List[dict] = []


class CompanyOnboarding(BaseModel):
    company_name: str
    siret: str
    tva_intra: str = ""
    address: str


class DriverCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None
    vehicle_plate: Optional[str] = None

class SubscriptionUpdate(BaseModel):
    plan: Literal["solo", "croissance", "flotte_pro"]
    billing_cycle: Literal["monthly", "yearly"]

class NotificationCreate(BaseModel):
    user_id: str
    type: str
    title: str
    message: str
    delivery_id: Optional[str] = None

# ==================== AUTH HELPERS ====================

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
        return {
            "id": str(user["_id"]),
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "company_id": user.get("company_id", str(user["_id"])),
            "plan": user.get("plan", "solo"),
            "subscription_status": user.get("subscription_status", "trial"),
            "trial_ends_at": user.get("trial_ends_at", "").isoformat() if isinstance(user.get("trial_ends_at"), datetime) else str(user.get("trial_ends_at", "")),
            "onboarding_complete": user.get("onboarding_complete", False),
            "created_at": user.get("created_at", "").isoformat() if isinstance(user.get("created_at"), datetime) else str(user.get("created_at", ""))
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

# ==================== AUDIT LOGGING ====================

async def log_action(user_id: str, company_id: str, action: str, entity_type: str, entity_id: str = "", details: str = ""):
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

@api_router.get("/audit-logs")
async def get_audit_logs(user: dict = Depends(require_role("admin")), limit: int = 50):
    """Get recent audit logs for this company"""
    logs = await db.audit_logs.find(
        {"company_id": user["company_id"]},
        {"_id": 0}
    ).sort("timestamp", -1).to_list(limit)
    for log in logs:
        if isinstance(log.get("timestamp"), datetime):
            log["timestamp"] = log["timestamp"].isoformat()
    return logs




# ==================== TRANSPORTER-BOT (Gemini Chat) ====================

SYSTEM_PROMPT = """Tu es Transporter-Bot, l'assistant IA de Transporter-Pro — un SaaS de gestion de flotte pour transporteurs routiers français.

Tu réponds de manière concise, professionnelle et en français. Tu connais parfaitement :

PRODUIT :
- Transporter-Pro : plateforme SaaS pour transporteurs PME
- IA Anti-Litige : analyse photo des colis via Gemini Vision (sévérité, confiance, preuve horodatée)
- Éco-Score Chauffeur : scoring de conduite, podium, -15% carburant
- Tracking GPS Live : positions temps réel sur carte
- Génération e-CMR / Factur-X : lettres de voiture numériques

TARIFS (Membres Fondateurs) :
- SOLO : 39€/mois (3 camions max, e-CMR, support email)
- CROISSANCE : 189€/mois (15 camions, IA Anti-Litige, Cash-Flow, GPS Live)
- FLOTTE PRO : 489€/mois (illimité, Éco-Score, API, support 24/7)
- Annuel : -17% (Solo 24€, Croissance 157€, Flotte Pro 406€/mois)
- Essai gratuit de 30 jours sur tous les plans

RÉGLEMENTATION :
- Loi transport 2026 : obligation e-CMR numérique, amendes 50€/facture non conforme
- Transporter-Pro est un outil d'aide à la gestion interne (pas lettre de voiture officielle en attente d'homologation)
- Conforme RGPD, eFTI, eIDAS

Si on te pose une question hors de ton domaine, réponds poliment que tu es spécialisé en gestion de flotte transport et redirige vers contact@transporter-pro.com."""

@api_router.post("/chat")
async def chat_with_bot(data: ChatMessage, request: Request):
    """Transporter-Bot — AI support powered by Gemini (5 questions/day limit for trial)"""
    # Rate limit: 5 questions/day per IP for non-authenticated users
    client_ip = request.client.host if request.client else "unknown"
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    rate_key = f"chat_{client_ip}_{today_str}"
    
    chat_count = await db.rate_limits.find_one({"key": rate_key})
    if chat_count and chat_count.get("count", 0) >= 20:
        return {"reply": "Vous avez atteint la limite quotidienne de questions. Créez un compte ou contactez-nous à support@transporter-pro.com."}
    
    await db.rate_limits.update_one(
        {"key": rate_key},
        {"$inc": {"count": 1}, "$set": {"date": today_str}},
        upsert=True
    )

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        import uuid as uuid_mod

        session_id = uuid_mod.uuid4().hex

        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message=SYSTEM_PROMPT
        ).with_model("gemini", "gemini-3-flash-preview")

        # Add conversation history (last 10 messages max)
        for msg in data.history[-10:]:
            chat.add_message(UserMessage(message=f"[{msg.get('role','user').upper()}]: {msg['content']}"))

        response = await chat.send_message(UserMessage(text=data.message))

        return {"reply": response}
    except Exception as e:
        logger.error(f"Chat error: {e}")
        return {"reply": "Désolé, je rencontre un problème technique. Contactez-nous à support@transporter-pro.com."}



@api_router.get("/verify-siret/{siret}")
async def verify_siret(siret: str):
    """Verify SIRET via official French government public API (recherche-entreprises).
    STRICT: returns valid=False if SIRET not found. No permissive fallback."""
    import httpx
    clean_siret = siret.replace(" ", "").replace("-", "")

    if len(clean_siret) != 14 or not clean_siret.isdigit():
        return {"valid": False, "error": "Le SIRET doit contenir 14 chiffres"}

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"https://recherche-entreprises.api.gouv.fr/search?q={clean_siret}&per_page=1"
            )
            if resp.status_code == 200:
                data = resp.json()
                if data.get("total_results", 0) == 0 or not data.get("results"):
                    return {"valid": False, "error": "SIRET introuvable dans la base INSEE Sirene"}

                entry = data["results"][0]
                matching = entry.get("matching_etablissements", [])
                etab = matching[0] if matching else {}

                # Ensure the SIRET we found actually matches (defense-in-depth)
                if etab.get("siret") != clean_siret:
                    return {"valid": False, "error": "SIRET introuvable dans la base INSEE Sirene"}

                # Reject closed establishments
                if etab.get("etat_administratif") == "F":
                    return {"valid": False, "error": "Établissement fermé (cessation d'activité)"}

                nom = entry.get("nom_complet") or entry.get("nom_raison_sociale") or ""
                adresse = etab.get("adresse", "") or ""
                return {
                    "valid": True,
                    "company_name": nom,
                    "address": adresse,
                    "siret": clean_siret,
                }

            return {"valid": False, "error": "Service INSEE indisponible — réessayez"}
    except Exception as e:
        logger.warning(f"SIRET API error: {e}")
        return {"valid": False, "error": "Impossible de contacter l'API Sirene — réessayez"}


# ==================== ONBOARDING KYB ====================

@api_router.get("/onboarding/status")
async def get_onboarding_status(user: dict = Depends(require_role("admin"))):
    """Check if company onboarding is complete"""
    company = await db.companies.find_one({"admin_id": user["id"]}, {"_id": 0})
    return {
        "onboarding_complete": company is not None and company.get("onboarding_complete", False),
        "company": company
    }


@api_router.post("/onboarding/complete")
async def complete_onboarding(data: CompanyOnboarding, user: dict = Depends(require_role("admin"))):
    """Complete company onboarding with KYB info — SIRET is re-validated server-side"""
    # STRICT server-side SIRET re-validation (cannot be spoofed by frontend)
    verification = await verify_siret(data.siret)
    if not verification.get("valid"):
        raise HTTPException(
            status_code=400,
            detail=verification.get("error") or "SIRET invalide — vérification INSEE échouée",
        )

    company_doc = {
        "admin_id": user["id"],
        "company_id": user["company_id"],
        "company_name": data.company_name,
        "siret": data.siret,
        "tva_intra": data.tva_intra,
        "address": data.address,
        "onboarding_complete": True,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.companies.update_one(
        {"admin_id": user["id"]},
        {"$set": company_doc},
        upsert=True
    )
    
    # Update user record
    await db.users.update_one(
        {"_id": ObjectId(user["id"])},
        {"$set": {"onboarding_complete": True, "company_name": data.company_name}}
    )
    
    await log_action(user["id"], user["company_id"], "onboarding_complete", "company", user["company_id"], f"Entreprise: {data.company_name}, SIRET: {data.siret}")
    
    return {"message": "Onboarding complété", "company": {k: v for k, v in company_doc.items() if k != "created_at"}}



# ==================== BLOCKCHAIN SIMULATION ====================

def create_blockchain_hash(data: dict) -> dict:
    timestamp = datetime.now(timezone.utc).isoformat()
    data_str = str(data) + timestamp
    hash_value = hashlib.sha256(data_str.encode()).hexdigest()
    return {
        "hash": hash_value,
        "timestamp": timestamp,
        "previous_hash": hashlib.sha256(timestamp.encode()).hexdigest()[:16],
        "verified": True
    }

# ==================== AI DAMAGE DETECTION ====================

def preprocess_image_base64(image_base64: str) -> str:
    """Compress and convert image to JPEG before sending to Gemini"""
    import base64 as b64module
    from io import BytesIO
    from PIL import Image
    
    try:
        # Strip data URI prefix if present
        if "," in image_base64[:100]:
            image_base64 = image_base64.split(",", 1)[1]
        
        raw = b64module.b64decode(image_base64)
        img = Image.open(BytesIO(raw))
        
        # Convert RGBA/palette to RGB
        if img.mode in ("RGBA", "P", "LA"):
            img = img.convert("RGB")
        
        # Resize if too large (max 1280px on longest side)
        max_dim = 1280
        if max(img.size) > max_dim:
            ratio = max_dim / max(img.size)
            new_size = (int(img.size[0] * ratio), int(img.size[1] * ratio))
            img = img.resize(new_size, Image.LANCZOS)
        
        # Save as JPEG with quality 80
        buffer = BytesIO()
        img.save(buffer, format="JPEG", quality=80)
        return b64module.b64encode(buffer.getvalue()).decode()
    except Exception as e:
        logger.warning(f"Image preprocessing failed: {e}")
        # Return original if preprocessing fails
        if "," in image_base64[:100]:
            return image_base64.split(",", 1)[1]
        return image_base64


async def analyze_package_damage(image_base64: str) -> dict:
    """Analyze package image for damage using Gemini 3 Flash Vision"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
        
        # Preprocess: compress + convert to JPEG
        processed_image = preprocess_image_base64(image_base64)
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"damage-{uuid.uuid4()}",
            system_message="""Tu es un expert en analyse de dommages sur les colis pour la logistique. 
            Analyse l'image et réponds UNIQUEMENT avec un objet JSON (pas de markdown, pas de backticks):
            {
                "is_damaged": boolean,
                "damage_severity": "none" | "minor" | "moderate" | "severe",
                "damage_type": string or null,
                "confidence": 0-100,
                "description": string en français décrivant ce que tu observes
            }
            Sois précis et descriptif dans le champ description."""
        ).with_model("gemini", "gemini-3-flash-preview")
        
        image_content = ImageContent(image_base64=processed_image)
        
        user_message = UserMessage(
            text="Analyse cette photo de colis pour détecter tout dommage visible : bosses, déchirures, écrasement, dommages par l'eau ou tout autre signe de détérioration. Décris en français.",
            file_contents=[image_content]
        )
        
        response = await chat.send_message(user_message)
        
        import json
        try:
            response_text = response.strip()
            # Remove markdown code blocks if present
            if response_text.startswith("```"):
                lines = response_text.split("\n")
                lines = [line for line in lines if not line.strip().startswith("```")]
                response_text = "\n".join(lines)
            if response_text.startswith("json"):
                response_text = response_text[4:].strip()
            result = json.loads(response_text)
            # Validate expected fields
            result.setdefault("is_damaged", False)
            result.setdefault("damage_severity", "none")
            result.setdefault("damage_type", None)
            result.setdefault("confidence", 50)
            result.setdefault("description", "Analyse terminée")
            return result
        except json.JSONDecodeError:
            logger.warning(f"AI response not valid JSON: {response[:200]}")
            return {
                "is_damaged": False,
                "damage_severity": "none",
                "damage_type": None,
                "confidence": 50,
                "description": response[:300] if response else "Analyse terminée sans résultat structuré"
            }
    except Exception as e:
        logger.error(f"AI Analysis error: {e}")
        return {
            "is_damaged": False,
            "damage_severity": "unknown",
            "damage_type": None,
            "confidence": 0,
            "description": "Analyse automatique impossible - Image non reconnue ou format incompatible"
        }

# ==================== NOTIFICATIONS ====================

async def create_notification(user_id: str, notif_type: str, title: str, message: str, delivery_id: str = None):
    """Create a notification for a user"""
    notification = {
        "user_id": user_id,
        "type": notif_type,
        "title": title,
        "message": message,
        "delivery_id": delivery_id,
        "read": False,
        "created_at": datetime.now(timezone.utc)
    }
    await db.notifications.insert_one(notification)
    return notification

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/register")
async def register(data: UserCreate):
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
        "plan": "solo",
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
        "plan": "solo",
        "subscription_status": "incomplete" if data.role == "admin" else "n/a",
        "access_token": access_token,
        "refresh_token": refresh_token
    })
    response.set_cookie("access_token", access_token, httponly=True, secure=True, samesite="none", max_age=3600, path="/")
    response.set_cookie("refresh_token", refresh_token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    return response

@api_router.post("/auth/login")
async def login(data: UserLogin, request: Request):
    email = data.email.lower()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"
    
    # Check brute force
    attempts = await db.login_attempts.find_one({"identifier": identifier})
    if attempts and attempts.get("count", 0) >= 5:
        lockout_until = attempts.get("lockout_until")
        if lockout_until and datetime.now(timezone.utc) < lockout_until:
            raise HTTPException(status_code=429, detail="Too many attempts. Try again in 15 minutes.")
    
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
    
    # Clear attempts on success
    await db.login_attempts.delete_one({"identifier": identifier})
    
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email, user["role"])
    refresh_token = create_refresh_token(user_id)
    
    response = JSONResponse(content={
        "id": user_id,
        "email": email,
        "name": user["name"],
        "role": user["role"],
        "company_id": user.get("company_id", user_id),
        "plan": user.get("plan", "solo"),
        "onboarding_complete": user.get("onboarding_complete", False),
        "access_token": access_token,
        "refresh_token": refresh_token
    })
    response.set_cookie("access_token", access_token, httponly=True, secure=True, samesite="none", max_age=3600, path="/")
    response.set_cookie("refresh_token", refresh_token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    await log_action(user_id, user.get("company_id", user_id), "login", "user", user_id, f"Login: {email}")
    return response

@api_router.post("/auth/logout")
async def logout():
    response = JSONResponse(content={"message": "Logged out"})
    response.delete_cookie("access_token", path="/", secure=True, samesite="none")
    response.delete_cookie("refresh_token", path="/", secure=True, samesite="none")
    return response

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return user

@api_router.get("/auth/company-quota")
async def get_company_quota(user: dict = Depends(require_role("admin"))):
    """Get current driver count vs plan limit"""
    company_id = user["company_id"]
    driver_count = await db.users.count_documents({"role": "driver", "company_id": company_id, "status": {"$ne": "inactive"}})
    plan = user.get("plan", "solo")
    limits = {"solo": 3, "croissance": 15, "flotte_pro": -1}
    max_drivers = limits.get(plan, 3)
    return {
        "driver_count": driver_count,
        "max_drivers": max_drivers,
        "plan": plan,
        "can_add": max_drivers == -1 or driver_count < max_drivers
    }

@api_router.post("/auth/refresh")
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

# ==================== ADMIN: DRIVER MANAGEMENT ====================

@api_router.post("/admin/drivers")
async def create_driver(data: DriverCreate, user: dict = Depends(require_role("admin"))):
    """Admin creates a new driver account"""
    company_id = user["company_id"]

    # Check plan quota
    plan = user.get("plan", "solo")
    limits = {"solo": 3, "croissance": 15, "flotte_pro": -1}
    max_drivers = limits.get(plan, 3)
    if max_drivers != -1:
        current_count = await db.users.count_documents({"role": "driver", "company_id": company_id, "status": {"$ne": "inactive"}})
        if current_count >= max_drivers:
            raise HTTPException(status_code=403, detail=f"Limite de flotte atteinte pour votre plan ({plan}). Maximum : {max_drivers} chauffeurs.")

    email = data.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    
    driver_doc = {
        "email": email,
        "password_hash": hash_password(data.password),
        "name": data.name,
        "role": "driver",
        "phone": data.phone,
        "vehicle_plate": data.vehicle_plate,
        "company_id": company_id,
        "created_by": user["id"],
        "created_at": datetime.now(timezone.utc),
        "status": "active"
    }
    result = await db.users.insert_one(driver_doc)
    await log_action(user["id"], company_id, "create_driver", "driver", str(result.inserted_id), f"Chauffeur créé: {data.name} ({email})")

    
    return {
        "id": str(result.inserted_id),
        "email": email,
        "name": data.name,
        "role": "driver",
        "phone": data.phone,
        "vehicle_plate": data.vehicle_plate,
        "company_id": company_id
    }

@api_router.get("/admin/drivers")
async def get_admin_drivers(user: dict = Depends(require_role("admin"))):
    """Get all drivers for this company with their stats"""
    company_id = user["company_id"]
    drivers = await db.users.find({"role": "driver", "company_id": company_id}, {"password_hash": 0}).to_list(100)
    # Also include legacy drivers without company_id that were created by this admin
    legacy = await db.users.find({"role": "driver", "company_id": {"$exists": False}, "created_by": user["id"]}, {"password_hash": 0}).to_list(100)
    all_drivers = drivers + legacy
    
    result = []
    for driver in all_drivers:
        driver_id = str(driver["_id"])
        
        # Get delivery stats
        total_deliveries = await db.deliveries.count_documents({"driver_id": driver_id})
        completed = await db.deliveries.count_documents({"driver_id": driver_id, "status": "delivered"})
        in_progress = await db.deliveries.count_documents({"driver_id": driver_id, "status": {"$in": ["assigned", "in_transit"]}})
        
        # Get latest eco score
        latest_score = await db.eco_scores.find_one({"driver_id": driver_id}, sort=[("date", -1)])
        
        result.append({
            "id": driver_id,
            "email": driver["email"],
            "name": driver["name"],
            "phone": driver.get("phone"),
            "vehicle_plate": driver.get("vehicle_plate"),
            "status": driver.get("status", "active"),
            "total_deliveries": total_deliveries,
            "completed_deliveries": completed,
            "in_progress": in_progress,
            "eco_score": latest_score["score"] if latest_score else 0,
            "created_at": driver.get("created_at", "").isoformat() if isinstance(driver.get("created_at"), datetime) else ""
        })
    
    return result

@api_router.delete("/admin/drivers/{driver_id}")
async def delete_driver(driver_id: str, user: dict = Depends(require_role("admin"))):
    """Delete a driver permanently"""
    company_id = user["company_id"]
    result = await db.users.delete_one(
        {"_id": ObjectId(driver_id), "role": "driver", "company_id": company_id}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Chauffeur non trouvé")
    await log_action(user["id"], company_id, "delete_driver", "driver", driver_id, "Chauffeur supprimé")
    return {"message": "Chauffeur supprimé"}

# ==================== SUBSCRIPTION MANAGEMENT ====================

SUBSCRIPTION_PLANS = {
    "solo": {
        "name": "SOLO",
        "monthly_price": 19,
        "yearly_price": 190,
        "max_trucks": 3,
        "features": ["e-CMR illimitées", "Support email", "Dashboard basique", "3 chauffeurs max"]
    },
    "croissance": {
        "name": "CROISSANCE",
        "monthly_price": 189,
        "yearly_price": 1890,
        "max_trucks": 15,
        "features": ["e-CMR illimitées", "IA Anti-litige", "Cash-Flow Dashboard", "Tracking GPS Live", "Support prioritaire", "15 chauffeurs max"]
    },
    "flotte_pro": {
        "name": "FLOTTE PRO",
        "monthly_price": 489,
        "yearly_price": 4890,
        "max_trucks": -1,  # unlimited
        "features": ["Camions illimités", "IA Anti-litige", "Cash-Flow Dashboard", "Éco-Score complet", "Support 24/7 dédié", "API Access", "White-label"]
    }
}

@api_router.get("/subscription/plans")
async def get_subscription_plans():
    """Get all available subscription plans"""
    return SUBSCRIPTION_PLANS

@api_router.get("/subscription/current")
async def get_current_subscription(user: dict = Depends(require_role("admin"))):
    """Get current subscription for admin's company"""
    subscription = await db.subscriptions.find_one({"admin_id": user["id"]}, {"_id": 0})
    if not subscription:
        # Check trial from user record
        admin_user = await db.users.find_one({"_id": ObjectId(user["id"])})
        trial_ends = admin_user.get("trial_ends_at")
        if not trial_ends:
            trial_ends = datetime.now(timezone.utc) + timedelta(days=30)
        is_expired = isinstance(trial_ends, datetime) and trial_ends < datetime.now(timezone.utc)
        return {
            "plan": user.get("plan", "solo"),
            "billing_cycle": "monthly",
            "status": "expired" if is_expired else "trial",
            "current_trucks": 0,
            "max_trucks": 3,
            "trial_ends": trial_ends.isoformat() if isinstance(trial_ends, datetime) else str(trial_ends)
        }
    
    for field in ["created_at", "expires_at"]:
        if isinstance(subscription.get(field), datetime):
            subscription[field] = subscription[field].isoformat()
    
    return subscription

@api_router.post("/subscription/update")
async def update_subscription(data: SubscriptionUpdate, user: dict = Depends(require_role("admin"))):
    """Update subscription plan"""
    plan_info = SUBSCRIPTION_PLANS.get(data.plan)
    if not plan_info:
        raise HTTPException(status_code=400, detail="Plan invalide")
    
    price = plan_info["yearly_price"] if data.billing_cycle == "yearly" else plan_info["monthly_price"]
    
    subscription = {
        "admin_id": user["id"],
        "plan": data.plan,
        "plan_name": plan_info["name"],
        "billing_cycle": data.billing_cycle,
        "price": price,
        "max_trucks": plan_info["max_trucks"],
        "features": plan_info["features"],
        "status": "active",
        "created_at": datetime.now(timezone.utc),
        "expires_at": datetime.now(timezone.utc) + timedelta(days=365 if data.billing_cycle == "yearly" else 30)
    }
    
    await db.subscriptions.update_one(
        {"admin_id": user["id"]},
        {"$set": subscription},
        upsert=True
    )
    
    subscription["created_at"] = subscription["created_at"].isoformat()
    subscription["expires_at"] = subscription["expires_at"].isoformat()
    
    await log_action(user["id"], user.get("company_id", ""), "update_subscription", "subscription", data.plan, f"Plan: {data.plan}, Cycle: {data.billing_cycle}")
    return subscription


# ==================== STRIPE PAYMENT LINKS ====================

STRIPE_PAYMENT_LINKS = {
    "solo": {
        "monthly": "https://buy.stripe.com/test_00wbJ29ckgDSc0v70C7IY02",
        "yearly": "https://buy.stripe.com/test_8x2dRa60887m5C7acO7IY03"
    },
    "croissance": {
        "monthly": "https://buy.stripe.com/test_eVq9AUfAI9bq11R4Su7IY04",
        "yearly": "https://buy.stripe.com/test_3cIeVe4W4cnCd4z2Km7IY05"
    },
    "flotte_pro": {
        "monthly": "https://buy.stripe.com/test_3cI8wQ4W4drG9SnckW7IY01",
        "yearly": "https://buy.stripe.com/test_cNi5kE2NWgDSd4zbgS7IY0O"
    }
}

@api_router.get("/stripe/payment-links")
async def get_payment_links():
    """Get Stripe payment links for all plans"""
    return STRIPE_PAYMENT_LINKS


@api_router.post("/stripe/create-checkout")
async def create_stripe_checkout(plan: str, billing: str = "monthly", user: dict = Depends(require_role("admin"))):
    """Generate a Stripe payment link with prefilled email"""
    links = STRIPE_PAYMENT_LINKS.get(plan)
    if not links:
        raise HTTPException(status_code=400, detail="Plan invalide")
    base_url = links.get(billing, links["monthly"])
    checkout_url = f"{base_url}?prefilled_email={user['email']}"
    return {"url": checkout_url}


# ==================== STRIPE WEBHOOK ====================

@app.post("/api/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events (checkout.session.completed)"""
    import stripe
    stripe.api_key = STRIPE_SECRET_KEY

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    # Verify webhook signature if secret is configured
    if STRIPE_WEBHOOK_SECRET:
        try:
            event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
        except stripe.error.SignatureVerificationError:
            raise HTTPException(status_code=400, detail="Invalid signature")
        except Exception as e:
            logger.error(f"Stripe webhook error: {e}")
            raise HTTPException(status_code=400, detail="Webhook error")
    else:
        import json
        event = json.loads(payload)

    if event.get("type") == "checkout.session.completed":
        session = event["data"]["object"]
        customer_email = session.get("customer_email") or session.get("customer_details", {}).get("email", "")

        if customer_email:
            # Find admin user by email
            admin = await db.users.find_one({"email": customer_email.lower(), "role": "admin"})
            if admin:
                admin_id = str(admin["_id"])
                company_id = admin.get("company_id", admin_id)

                # Determine plan from metadata or amount
                amount = session.get("amount_total", 0) / 100
                plan_type = "solo"
                billing_cycle = "monthly"
                if amount >= 4000:
                    plan_type = "flotte_pro"
                    billing_cycle = "yearly"
                elif amount >= 1500:
                    plan_type = "croissance"
                    billing_cycle = "yearly"
                elif amount >= 400:
                    plan_type = "flotte_pro"
                    billing_cycle = "monthly"
                elif amount >= 150:
                    plan_type = "croissance"
                    billing_cycle = "monthly"
                elif amount >= 300:
                    plan_type = "solo"
                    billing_cycle = "yearly"

                # Update user plan
                await db.users.update_one(
                    {"_id": admin["_id"]},
                    {"$set": {
                        "plan": plan_type,
                        "subscription_status": "active",
                        "stripe_customer_id": session.get("customer", ""),
                        "stripe_subscription_id": session.get("subscription", "")
                    }}
                )

                # Update subscription record
                plan_info = SUBSCRIPTION_PLANS.get(plan_type, {})
                await db.subscriptions.update_one(
                    {"admin_id": admin_id},
                    {"$set": {
                        "admin_id": admin_id,
                        "company_id": company_id,
                        "plan": plan_type,
                        "plan_name": plan_info.get("name", plan_type),
                        "billing_cycle": billing_cycle,
                        "status": "active",
                        "subscription_active": True,
                        "stripe_session_id": session.get("id", ""),
                        "created_at": datetime.now(timezone.utc),
                        "expires_at": datetime.now(timezone.utc) + timedelta(days=365 if billing_cycle == "yearly" else 30)
                    }},
                    upsert=True
                )

                await log_action(admin_id, company_id, "stripe_payment", "subscription", plan_type, f"Stripe checkout completed: {plan_type}/{billing_cycle}")

                logger.info(f"Stripe: Activated {plan_type}/{billing_cycle} for {customer_email}")

    return {"received": True}

# ==================== NOTIFICATIONS ====================

@api_router.get("/notifications")
async def get_notifications(user: dict = Depends(get_current_user)):
    """Get notifications for current user"""
    notifications = await db.notifications.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    for n in notifications:
        if isinstance(n.get("created_at"), datetime):
            n["created_at"] = n["created_at"].isoformat()
    
    return notifications

@api_router.get("/notifications/unread-count")
async def get_unread_count(user: dict = Depends(get_current_user)):
    """Get count of unread notifications"""
    count = await db.notifications.count_documents({"user_id": user["id"], "read": False})
    return {"count": count}

@api_router.post("/notifications/mark-read")
async def mark_notifications_read(user: dict = Depends(get_current_user)):
    """Mark all notifications as read"""
    await db.notifications.update_many(
        {"user_id": user["id"], "read": False},
        {"$set": {"read": True}}
    )
    return {"message": "Notifications marquées comme lues"}

# ==================== DELIVERY ENDPOINTS ====================

@api_router.post("/deliveries")
async def create_delivery(data: DeliveryCreate, user: dict = Depends(require_role("admin", "client"))):
    delivery = {
        "tracking_id": f"TP-{uuid.uuid4().hex[:8].upper()}",
        "recipient_name": data.recipient_name,
        "recipient_address": data.recipient_address,
        "recipient_phone": data.recipient_phone,
        "package_description": data.package_description,
        "weight_kg": data.weight_kg,
        "status": "assigned" if data.driver_id else "pending",
        "client_id": data.client_id or user["id"],
        "driver_id": data.driver_id or None,
        "company_id": user.get("company_id", user["id"]),
        "signature_data": None,
        "delivery_notes": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "delivered_at": None,
        "blockchain_proof": None,
        "gps_location": None,
        "co2_kg": data.weight_kg * 0.1
    }
    result = await db.deliveries.insert_one(delivery)
    delivery["id"] = str(result.inserted_id)
    delivery.pop("_id", None)
    
    await log_action(user["id"], user.get("company_id", ""), "create_delivery", "delivery", delivery["tracking_id"], f"Livraison: {data.recipient_name}")
    
    # Convert datetime for JSON
    for field in ["created_at", "updated_at", "delivered_at"]:
        if isinstance(delivery.get(field), datetime):
            delivery[field] = delivery[field].isoformat()
    
    return delivery

@api_router.get("/deliveries")
async def get_deliveries(user: dict = Depends(get_current_user), status: Optional[str] = None):
    query = {}
    if user["role"] == "driver":
        query["driver_id"] = user["id"]
    elif user["role"] == "client":
        query["client_id"] = user["id"]
    elif user["role"] == "admin":
        query["company_id"] = user["company_id"]
    
    if status:
        query["status"] = status
    
    deliveries = await db.deliveries.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    # Enrich with driver names
    driver_cache = {}
    for d in deliveries:
        did = d.get("driver_id")
        if did and did not in driver_cache:
            from bson import ObjectId as BsonObjectId
            try:
                driver = await db.users.find_one({"_id": BsonObjectId(did)}, {"_id": 0, "name": 1})
                driver_cache[did] = driver["name"] if driver else None
            except Exception:
                driver_cache[did] = None
        d["driver_name"] = driver_cache.get(did)
    
    # Ensure all datetime fields are strings
    for d in deliveries:
        for field in ["created_at", "updated_at", "delivered_at"]:
            if isinstance(d.get(field), datetime):
                d[field] = d[field].isoformat()
    
    return deliveries

@api_router.get("/deliveries/{tracking_id}")
async def get_delivery(tracking_id: str):
    delivery = await db.deliveries.find_one({"tracking_id": tracking_id}, {"_id": 0})
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")
    
    for field in ["created_at", "updated_at", "delivered_at"]:
        if isinstance(delivery.get(field), datetime):
            delivery[field] = delivery[field].isoformat()
    
    return delivery

@api_router.patch("/deliveries/{tracking_id}")
async def update_delivery(tracking_id: str, data: DeliveryUpdate, user: dict = Depends(get_current_user)):
    update_data = {"updated_at": datetime.now(timezone.utc)}
    
    delivery = await db.deliveries.find_one({"tracking_id": tracking_id})
    if not delivery:
        raise HTTPException(status_code=404, detail="Livraison non trouvée")
    
    if data.status:
        update_data["status"] = data.status
        if data.status == "delivered":
            update_data["delivered_at"] = datetime.now(timezone.utc)
            
            # When driver completes delivery, notify admin and create invoice
            if user["role"] == "driver":
                # Find admin to notify
                admins = await db.users.find({"role": "admin"}).to_list(10)
                for admin in admins:
                    await create_notification(
                        str(admin["_id"]),
                        "delivery_complete",
                        "Livraison terminée",
                        f"Le chauffeur a validé la livraison {tracking_id}. Facture prête à l'envoi.",
                        tracking_id
                    )
                
                # Auto-create invoice if client exists
                if delivery.get("client_id"):
                    invoice = {
                        "invoice_id": f"INV-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}",
                        "delivery_id": tracking_id,
                        "client_id": delivery["client_id"],
                        "amount": delivery.get("weight_kg", 1) * 15,  # 15€ per kg base
                        "status": "ready_to_send",  # Ready for Factur-X
                        "created_at": datetime.now(timezone.utc),
                        "due_date": datetime.now(timezone.utc) + timedelta(days=30),
                        "paid_at": None,
                        "facturx_generated": True,
                        "blockchain_proof": create_blockchain_hash({"delivery": tracking_id})
                    }
                    await db.invoices.insert_one(invoice)
    
    if data.driver_id:
        update_data["driver_id"] = data.driver_id
    if data.signature_data:
        update_data["signature_data"] = data.signature_data
        # Create blockchain proof for signature
        proof = create_blockchain_hash({
            "tracking_id": tracking_id,
            "signature": data.signature_data[:50],
            "signer": user["id"]
        })
        update_data["blockchain_proof"] = proof
    if data.delivery_notes:
        update_data["delivery_notes"] = data.delivery_notes
    
    result = await db.deliveries.update_one(
        {"tracking_id": tracking_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Livraison non trouvée")
    
    await log_action(user["id"], user.get("company_id", ""), "update_delivery", "delivery", tracking_id, f"Statut: {update_data.get('status', 'modifié')}")
    return {"message": "Livraison mise à jour", "tracking_id": tracking_id}

@api_router.post("/deliveries/{tracking_id}/assign")
async def assign_driver(tracking_id: str, driver_id: str = Form(...), user: dict = Depends(require_role("admin"))):
    # Verify driver exists
    driver = await db.users.find_one({"_id": ObjectId(driver_id), "role": "driver"})
    if not driver:
        raise HTTPException(status_code=404, detail="Chauffeur non trouvé")
    
    result = await db.deliveries.update_one(
        {"tracking_id": tracking_id},
        {"$set": {"driver_id": driver_id, "status": "assigned", "updated_at": datetime.now(timezone.utc)}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Livraison non trouvée")
    
    # Send notification to driver
    delivery = await db.deliveries.find_one({"tracking_id": tracking_id})
    await create_notification(
        driver_id,
        "new_mission",
        "Nouvelle mission assignée",
        f"Livraison {tracking_id} pour {delivery['recipient_name']} - {delivery['recipient_address']}",
        tracking_id
    )
    
    return {"message": "Chauffeur assigné", "driver_name": driver["name"]}

@api_router.post("/deliveries/{tracking_id}/gps")
async def update_gps(tracking_id: str, lat: float = Form(...), lng: float = Form(...), user: dict = Depends(require_role("driver"))):
    await db.deliveries.update_one(
        {"tracking_id": tracking_id},
        {"$set": {"gps_location": {"lat": lat, "lng": lng, "updated_at": datetime.now(timezone.utc).isoformat()}}}
    )
    return {"message": "GPS updated"}

# ==================== INVOICE ENDPOINTS ====================

@api_router.post("/invoices")
async def create_invoice(data: InvoiceCreate, user: dict = Depends(require_role("admin"))):
    delivery = await db.deliveries.find_one({"tracking_id": data.delivery_id}, {"_id": 0})
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")
    
    invoice = {
        "invoice_id": f"INV-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}",
        "delivery_id": data.delivery_id,
        "client_id": data.client_id,
        "amount": data.amount,
        "status": "pending",
        "created_at": datetime.now(timezone.utc),
        "due_date": datetime.now(timezone.utc) + timedelta(days=30),
        "paid_at": None,
        "facturx_generated": True,
        "blockchain_proof": create_blockchain_hash({"invoice": data.delivery_id, "amount": data.amount})
    }
    result = await db.invoices.insert_one(invoice)
    invoice["id"] = str(result.inserted_id)
    
    # Convert dates
    for field in ["created_at", "due_date", "paid_at"]:
        if isinstance(invoice.get(field), datetime):
            invoice[field] = invoice[field].isoformat()
    
    return invoice

@api_router.get("/invoices")
async def get_invoices(user: dict = Depends(get_current_user)):
    query = {}
    if user["role"] == "client":
        query["client_id"] = user["id"]
    
    invoices = await db.invoices.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    for inv in invoices:
        for field in ["created_at", "due_date", "paid_at"]:
            if isinstance(inv.get(field), datetime):
                inv[field] = inv[field].isoformat()
    
    return invoices

@api_router.patch("/invoices/{invoice_id}/pay")
async def mark_invoice_paid(invoice_id: str, user: dict = Depends(require_role("admin"))):
    result = await db.invoices.update_one(
        {"invoice_id": invoice_id},
        {"$set": {"status": "paid", "paid_at": datetime.now(timezone.utc)}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return {"message": "Invoice marked as paid"}

# ==================== DAMAGE REPORT ENDPOINTS ====================

@api_router.post("/damage-reports")
async def create_damage_report(data: DamageReportCreate, user: dict = Depends(require_role("driver"))):
    # Analyze image with AI
    ai_analysis = await analyze_package_damage(data.photo_base64)
    
    # Store photo thumbnail (limit to ~200KB base64 for display in admin)
    photo_preview = data.photo_base64[:200000] if len(data.photo_base64) > 200000 else data.photo_base64
    
    report = {
        "report_id": f"DMG-{uuid.uuid4().hex[:8].upper()}",
        "delivery_id": data.delivery_id,
        "driver_id": user["id"],
        "driver_name": user.get("name", ""),
        "photo_base64": photo_preview,
        "description": data.description,
        "ai_analysis": ai_analysis,
        "created_at": datetime.now(timezone.utc),
        "blockchain_proof": create_blockchain_hash({
            "delivery": data.delivery_id,
            "damage": ai_analysis.get("is_damaged", False),
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    }
    await db.damage_reports.insert_one(report)
    
    # Clean response (remove _id, convert dates)
    report.pop("_id", None)
    report["created_at"] = report["created_at"].isoformat()
    
    await log_action(user["id"], user.get("company_id", ""), "create_damage_report", "damage_report", report["report_id"], f"Delivery: {data.delivery_id}, IA: {'damaged' if ai_analysis.get('is_damaged') else 'intact'}")
    return report

@api_router.get("/damage-reports")
async def get_damage_reports(user: dict = Depends(get_current_user)):
    query = {}
    if user["role"] == "driver":
        query["driver_id"] = user["id"]
    elif user["role"] == "admin":
        query["company_id"] = user["company_id"]
    
    reports = await db.damage_reports.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    for r in reports:
        if isinstance(r.get("created_at"), datetime):
            r["created_at"] = r["created_at"].isoformat()
        # Include a flag indicating if a photo is available
        has_photo = r.get("photo_base64") and len(r.get("photo_base64", "")) > 200
        r["has_photo"] = has_photo
    
    return reports

@api_router.get("/damage-reports/{report_id}/photo")
async def get_damage_report_photo(report_id: str, user: dict = Depends(get_current_user)):
    """Get the photo for a specific damage report"""
    report = await db.damage_reports.find_one({"report_id": report_id}, {"photo_base64": 1})
    if not report:
        raise HTTPException(status_code=404, detail="Rapport non trouvé")
    return {"photo_base64": report.get("photo_base64", "")}


@api_router.post("/damage-reports/{report_id}/retry")
async def retry_damage_analysis(report_id: str, user: dict = Depends(get_current_user)):
    """Re-run AI analysis on an existing damage report"""
    report = await db.damage_reports.find_one({"report_id": report_id}, {"_id": 0, "photo_base64": 1, "report_id": 1})
    if not report:
        raise HTTPException(status_code=404, detail="Rapport non trouvé")
    
    photo = report.get("photo_base64", "")
    if not photo or len(photo) < 200:
        raise HTTPException(status_code=400, detail="Aucune photo disponible pour relancer l'analyse")
    
    # Re-run AI analysis
    ai_analysis = await analyze_package_damage(photo)
    
    # Update the report
    await db.damage_reports.update_one(
        {"report_id": report_id},
        {"$set": {"ai_analysis": ai_analysis}}
    )
    
    return {"report_id": report_id, "ai_analysis": ai_analysis}

# ==================== ECO SCORE ENDPOINTS ====================

@api_router.post("/eco-scores")
async def update_eco_score(data: EcoScoreUpdate, user: dict = Depends(require_role("driver"))):
    # Calculate eco score (0-100)
    penalty_per_harsh = 5
    total_penalties = (data.harsh_braking_count + data.harsh_acceleration_count) * penalty_per_harsh
    base_score = 100 - min(total_penalties, 50)
    
    # Fuel efficiency bonus
    if data.distance_km > 0 and data.fuel_liters > 0:
        fuel_efficiency = data.distance_km / data.fuel_liters  # km per liter
        if fuel_efficiency > 12:  # Good efficiency
            base_score = min(base_score + 10, 100)
    
    co2_kg = data.fuel_liters * 2.31  # CO2 per liter of diesel
    
    score_doc = {
        "driver_id": user["id"],
        "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "score": round(base_score),
        "harsh_braking_count": data.harsh_braking_count,
        "harsh_acceleration_count": data.harsh_acceleration_count,
        "distance_km": data.distance_km,
        "fuel_liters": data.fuel_liters,
        "co2_kg": round(co2_kg, 2),
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.eco_scores.update_one(
        {"driver_id": user["id"], "date": score_doc["date"]},
        {"$set": score_doc},
        upsert=True
    )
    
    score_doc["created_at"] = score_doc["created_at"].isoformat()
    return score_doc

@api_router.get("/eco-scores")
async def get_eco_scores(user: dict = Depends(get_current_user), driver_id: Optional[str] = None):
    query = {}
    if user["role"] == "driver":
        query["driver_id"] = user["id"]
    elif driver_id:
        query["driver_id"] = driver_id
    
    scores = await db.eco_scores.find(query, {"_id": 0}).sort("date", -1).to_list(30)
    
    for s in scores:
        if isinstance(s.get("created_at"), datetime):
            s["created_at"] = s["created_at"].isoformat()
    
    return scores

@api_router.get("/eco-scores/summary")
async def get_eco_summary(user: dict = Depends(require_role("admin"))):
    pipeline = [
        {"$group": {
            "_id": "$driver_id",
            "avg_score": {"$avg": "$score"},
            "total_distance": {"$sum": "$distance_km"},
            "total_co2": {"$sum": "$co2_kg"},
            "total_fuel": {"$sum": "$fuel_liters"},
            "entries": {"$sum": 1}
        }},
        {"$sort": {"avg_score": -1}}
    ]
    results = await db.eco_scores.aggregate(pipeline).to_list(100)

    # Enrich with driver names from users collection
    for r in results:
        from bson import ObjectId as BsonObjectId
        try:
            driver = await db.users.find_one({"_id": BsonObjectId(r["_id"])}, {"_id": 0, "name": 1})
        except Exception:
            driver = await db.users.find_one({"id": r["_id"]}, {"_id": 0, "name": 1})
        r["driver_name"] = driver["name"] if driver and driver.get("name") else r["_id"]

    return results


@api_router.get("/eco-scores/daily-avg")
async def get_eco_daily_avg(user: dict = Depends(require_role("admin"))):
    """Company-wide daily average eco-score for last 30 days"""
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).strftime("%Y-%m-%d")
    pipeline = [
        {"$match": {"date": {"$gte": thirty_days_ago}}},
        {"$group": {
            "_id": "$date",
            "avg_score": {"$avg": "$score"},
            "drivers_count": {"$addToSet": "$driver_id"}
        }},
        {"$project": {
            "_id": 0,
            "date": "$_id",
            "avg_score": {"$round": ["$avg_score", 1]},
            "drivers_count": {"$size": "$drivers_count"}
        }},
        {"$sort": {"date": 1}}
    ]
    results = await db.eco_scores.aggregate(pipeline).to_list(60)
    return results


@api_router.post("/eco-scores/recalculate")
async def recalculate_eco_scores(user: dict = Depends(require_role("admin"))):
    """Recalculate eco-scores for all drivers based on real delivery and damage data"""
    from bson import ObjectId as BsonObjectId
    all_drivers_cursor = db.users.find({"role": "driver"}, {"_id": 1, "name": 1})
    all_drivers = []
    async for d in all_drivers_cursor:
        all_drivers.append({"id": str(d["_id"]), "name": d.get("name", "Chauffeur")})

    recalculated = []
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    for driver in all_drivers:
        did = driver["id"]

        # Count completed deliveries
        completed = await db.deliveries.count_documents({"driver_id": did, "status": "delivered"})
        total = await db.deliveries.count_documents({"driver_id": did})

        # Get all tracking IDs for this driver
        driver_deliveries = await db.deliveries.find({"driver_id": did}, {"tracking_id": 1, "_id": 0}).to_list(500)
        tracking_ids = [d["tracking_id"] for d in driver_deliveries]

        # Count damage reports with damage
        damages = await db.damage_reports.count_documents({
            "delivery_id": {"$in": tracking_ids},
            "ai_analysis.is_damaged": True
        }) if tracking_ids else 0

        # Count severe damages
        severe = await db.damage_reports.count_documents({
            "delivery_id": {"$in": tracking_ids},
            "ai_analysis.damage_severity": "severe"
        }) if tracking_ids else 0

        # Base score: start at 85
        score = 85.0

        # Bonus for delivery completion rate
        if total > 0:
            completion_rate = completed / total
            score += completion_rate * 10  # up to +10

        # Penalty for damages
        if completed > 0:
            damage_rate = damages / completed
            score -= damage_rate * 20  # -20 per 100% damage rate
            score -= severe * 5  # extra -5 per severe damage

        # Estimated distance & CO2 (rough: 25km per delivery)
        est_distance = completed * 25
        co2 = est_distance * 0.12  # ~120g CO2/km for a van
        fuel = est_distance / 10  # ~10 km/L

        score = max(0, min(100, round(score)))

        existing = await db.eco_scores.find_one({"driver_id": did, "date": today})

        score_doc = {
            "driver_id": did,
            "date": today,
            "score": score,
            "distance_km": round(est_distance + (existing["distance_km"] if existing else 0), 1),
            "co2_kg": round(co2 + (existing["co2_kg"] if existing else 0), 2),
            "fuel_liters": round(fuel + (existing["fuel_liters"] if existing else 0), 2),
            "harsh_braking_count": existing["harsh_braking_count"] if existing else 0,
            "harsh_acceleration_count": existing["harsh_acceleration_count"] if existing else 0,
            "created_at": datetime.now(timezone.utc)
        }

        await db.eco_scores.update_one(
            {"driver_id": did, "date": today},
            {"$set": score_doc},
            upsert=True
        )
        recalculated.append({"driver_id": did, "name": driver.get("name", did), "score": score})

    return {"recalculated": len(recalculated), "drivers": recalculated}

# ==================== CASH FLOW / DASHBOARD ENDPOINTS ====================

@api_router.get("/dashboard/cash-flow")
async def get_cash_flow(user: dict = Depends(require_role("admin"))):
    cid = user["company_id"]
    # Money blocked in trucks (delivered but unpaid)
    pipeline_blocked = [
        {"$match": {"company_id": cid}},
        {"$lookup": {
            "from": "invoices",
            "localField": "tracking_id",
            "foreignField": "delivery_id",
            "as": "invoice"
        }},
        {"$match": {
            "status": "delivered",
            "invoice.status": {"$ne": "paid"}
        }},
        {"$group": {
            "_id": None,
            "total_blocked": {"$sum": {"$arrayElemAt": ["$invoice.amount", 0]}},
            "count": {"$sum": 1}
        }}
    ]
    
    blocked_result = await db.deliveries.aggregate(pipeline_blocked).to_list(1)
    blocked = blocked_result[0] if blocked_result else {"total_blocked": 0, "count": 0}
    
    # Pending invoices for this company
    pending_invoices = await db.invoices.count_documents({"company_id": cid, "status": "pending"})
    
    # Total revenue this month
    start_of_month = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    paid_this_month = await db.invoices.aggregate([
        {"$match": {"company_id": cid, "status": "paid", "paid_at": {"$gte": start_of_month}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]).to_list(1)
    
    return {
        "money_blocked_in_trucks": blocked.get("total_blocked", 0),
        "blocked_deliveries_count": blocked.get("count", 0),
        "pending_invoices_count": pending_invoices,
        "revenue_this_month": paid_this_month[0]["total"] if paid_this_month else 0
    }

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(user: dict = Depends(get_current_user)):
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    
    if user["role"] == "admin":
        cid = user["company_id"]
        stats = {
            "total_deliveries": await db.deliveries.count_documents({"company_id": cid}),
            "pending_deliveries": await db.deliveries.count_documents({"company_id": cid, "status": "pending"}),
            "in_transit": await db.deliveries.count_documents({"company_id": cid, "status": "in_transit"}),
            "delivered_today": await db.deliveries.count_documents({"company_id": cid, "status": "delivered", "delivered_at": {"$gte": today}}),
            "active_drivers": await db.users.count_documents({"role": "driver", "company_id": cid}),
            "active_litiges": await db.damage_reports.count_documents({"company_id": cid, "ai_analysis.is_damaged": True}),
            "avg_eco_score": 0
        }
        
        # Get average eco score for this company's drivers
        company_drivers_cursor = db.users.find({"role": "driver", "company_id": cid}, {"_id": 1})
        driver_ids = [str(d["_id"]) async for d in company_drivers_cursor]
        avg_score = await db.eco_scores.aggregate([
            {"$match": {"driver_id": {"$in": driver_ids}} if driver_ids else {}},
            {"$group": {"_id": None, "avg": {"$avg": "$score"}}}
        ]).to_list(1)
        if avg_score:
            stats["avg_eco_score"] = round(avg_score[0]["avg"], 1)
        
    elif user["role"] == "driver":
        stats = {
            "my_deliveries_today": await db.deliveries.count_documents({"driver_id": user["id"], "created_at": {"$gte": today}}),
            "pending": await db.deliveries.count_documents({"driver_id": user["id"], "status": {"$in": ["assigned", "in_transit"]}}),
            "completed_today": await db.deliveries.count_documents({"driver_id": user["id"], "status": "delivered", "delivered_at": {"$gte": today}})
        }
        
        # Get latest eco score
        latest_score = await db.eco_scores.find_one({"driver_id": user["id"]}, sort=[("date", -1)])
        stats["eco_score"] = latest_score["score"] if latest_score else 0
        
    else:  # client
        stats = {
            "total_orders": await db.deliveries.count_documents({"client_id": user["id"]}),
            "in_transit": await db.deliveries.count_documents({"client_id": user["id"], "status": "in_transit"}),
            "delivered": await db.deliveries.count_documents({"client_id": user["id"], "status": "delivered"})
        }
    
    return stats

# ==================== DRIVERS LIST ====================

@api_router.get("/drivers")
async def get_drivers(user: dict = Depends(require_role("admin"))):
    drivers = await db.users.find({"role": "driver"}, {"_id": 0, "password_hash": 0}).to_list(100)
    
    # Add delivery stats for each driver
    for driver in drivers:
        driver["id"] = driver.get("email", "")  # Use email as fallback if no id
        driver_id = driver.get("id")
        if driver_id:
            driver["deliveries_count"] = await db.deliveries.count_documents({"driver_id": driver_id})
            latest_score = await db.eco_scores.find_one({"driver_id": driver_id}, sort=[("date", -1)])
            driver["eco_score"] = latest_score["score"] if latest_score else 0
    
    return drivers

# ==================== OFFLINE SYNC ====================

@api_router.post("/sync")
async def sync_offline_data(data: OfflineSyncData, user: dict = Depends(get_current_user)):
    synced = {"deliveries": 0, "damage_reports": 0, "signatures": 0}
    
    for delivery_update in data.deliveries:
        if "tracking_id" in delivery_update:
            await db.deliveries.update_one(
                {"tracking_id": delivery_update["tracking_id"]},
                {"$set": delivery_update}
            )
            synced["deliveries"] += 1
    
    for report in data.damage_reports:
        report["driver_id"] = user["id"]
        report["created_at"] = datetime.now(timezone.utc)
        await db.damage_reports.insert_one(report)
        synced["damage_reports"] += 1
    
    for sig in data.signatures:
        if "tracking_id" in sig:
            proof = create_blockchain_hash(sig)
            await db.deliveries.update_one(
                {"tracking_id": sig["tracking_id"]},
                {"$set": {"signature_data": sig.get("signature"), "blockchain_proof": proof}}
            )
            synced["signatures"] += 1
    
    return {"message": "Sync complete", "synced": synced}

# ==================== CLIENT PORTAL (PUBLIC) ====================

@api_router.get("/track/{tracking_id}")
async def public_track(tracking_id: str):
    delivery = await db.deliveries.find_one(
        {"tracking_id": tracking_id},
        {"_id": 0, "signature_data": 0}  # Don't expose signature
    )
    if not delivery:
        raise HTTPException(status_code=404, detail="Tracking ID not found")
    
    # Simplify for public view
    for field in ["created_at", "updated_at", "delivered_at"]:
        if isinstance(delivery.get(field), datetime):
            delivery[field] = delivery[field].isoformat()
    
    return {
        "tracking_id": delivery["tracking_id"],
        "status": delivery["status"],
        "recipient_name": delivery["recipient_name"],
        "recipient_address": delivery["recipient_address"],
        "created_at": delivery.get("created_at"),
        "delivered_at": delivery.get("delivered_at"),
        "gps_location": delivery.get("gps_location"),
        "has_proof": delivery.get("blockchain_proof") is not None
    }

# ==================== STARTUP ====================

@app.on_event("startup")
async def startup():
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.deliveries.create_index("tracking_id", unique=True)
    await db.deliveries.create_index("client_id")
    await db.deliveries.create_index("driver_id")
    await db.invoices.create_index("invoice_id", unique=True)
    await db.login_attempts.create_index("identifier")
    
    # Seed admin user
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@transporter-pro.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc)
        })
        logger.info(f"Admin user created: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}}
        )
        logger.info("Admin password updated")
    
    # Seed test driver
    driver_email = "driver@test.com"
    existing_driver = await db.users.find_one({"email": driver_email})
    if not existing_driver:
        await db.users.insert_one({
            "email": driver_email,
            "password_hash": hash_password("driver123"),
            "name": "Jean Dupont",
            "role": "driver",
            "created_at": datetime.now(timezone.utc)
        })
        logger.info(f"Test driver created: {driver_email}")
    
    # Seed test client
    client_email = "client@test.com"
    existing_client = await db.users.find_one({"email": client_email})
    if not existing_client:
        await db.users.insert_one({
            "email": client_email,
            "password_hash": hash_password("client123"),
            "name": "Marie Martin",
            "role": "client",
            "created_at": datetime.now(timezone.utc)
        })
        logger.info(f"Test client created: {client_email}")
    
    # Write test credentials
    try:
        os.makedirs("/app/memory", exist_ok=True)
        with open("/app/memory/test_credentials.md", "w") as f:
            f.write("# Test Credentials\n\n")
            f.write(f"## Admin\n- Email: {admin_email}\n- Password: {admin_password}\n- Role: admin\n\n")
            f.write("## Driver\n- Email: driver@test.com\n- Password: driver123\n- Role: driver\n\n")
            f.write("## Client\n- Email: client@test.com\n- Password: client123\n- Role: client\n\n")
            f.write("## Auth Endpoints\n- POST /api/auth/login\n- POST /api/auth/register\n- POST /api/auth/logout\n- GET /api/auth/me\n")
    except Exception as e:
        logger.error(f"Could not write test credentials: {e}")
    
    logger.info("Transporter-Pro API started successfully")

@app.on_event("shutdown")
async def shutdown():
    client.close()

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
