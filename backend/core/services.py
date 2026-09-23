"""Domain helpers: blockchain proof, AI vision (Gemini), notification creation."""
import hashlib
import logging
import uuid
from datetime import datetime, timezone

from .db import db, EMERGENT_LLM_KEY

logger = logging.getLogger(__name__)


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


def preprocess_image_base64(image_base64: str) -> str:
    """Compress and convert image to JPEG before sending to Gemini"""
    import base64 as b64module
    from io import BytesIO
    from PIL import Image

    try:
        if "," in image_base64[:100]:
            image_base64 = image_base64.split(",", 1)[1]
        raw = b64module.b64decode(image_base64)
        img = Image.open(BytesIO(raw))
        if img.mode in ("RGBA", "P", "LA"):
            img = img.convert("RGB")
        max_dim = 1280
        if max(img.size) > max_dim:
            ratio = max_dim / max(img.size)
            new_size = (int(img.size[0] * ratio), int(img.size[1] * ratio))
            img = img.resize(new_size, Image.LANCZOS)
        buffer = BytesIO()
        img.save(buffer, format="JPEG", quality=80)
        return b64module.b64encode(buffer.getvalue()).decode()
    except Exception as e:
        logger.warning(f"Image preprocessing failed: {e}")
        if "," in image_base64[:100]:
            return image_base64.split(",", 1)[1]
        return image_base64


async def analyze_package_damage(image_base64: str) -> dict:
    """Analyze package image for damage using Gemini 3 Flash Vision"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

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
            if response_text.startswith("```"):
                lines = response_text.split("\n")
                lines = [line for line in lines if not line.strip().startswith("```")]
                response_text = "\n".join(lines)
            if response_text.startswith("json"):
                response_text = response_text[4:].strip()
            result = json.loads(response_text)
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
