"""Vehicle pre-departure inspection endpoints."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from core.db import db
from core.auth import get_current_user, require_role, log_action

router = APIRouter(prefix="/api")


# ── Pydantic models ──────────────────────────────────────────────────────────

class ChecklistItem(BaseModel):
    id: str
    label: str
    status: str   # "ok" | "anomaly" | "not_checked"


class VehicleInspectionCreate(BaseModel):
    vehicle_plate: str
    odometer_start: Optional[float] = None   # km au compteur
    fuel_level: Optional[str] = None          # "25" | "50" | "75" | "100"
    checklist: List[ChecklistItem] = []
    anomaly_description: Optional[str] = None
    anomaly_photo_base64: Optional[str] = None  # base64 JPEG (pas de data-URL)
    notes: Optional[str] = None


# ── Helper ────────────────────────────────────────────────────────────────────

def _has_anomaly(checklist: List[ChecklistItem]) -> bool:
    return any(item.status == "anomaly" for item in checklist)


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/vehicle-inspections")
async def create_inspection(
    data: VehicleInspectionCreate,
    user: dict = Depends(get_current_user),
):
    """Chauffeur soumet le contrôle de départ du véhicule."""
    company_id = user.get("company_id")
    driver_id = user["id"]
    driver_name = user.get("name", "Inconnu")

    has_anomaly = _has_anomaly(data.checklist) or bool(data.anomaly_description)

    doc = {
        "company_id": company_id,
        "driver_id": driver_id,
        "driver_name": driver_name,
        "vehicle_plate": data.vehicle_plate.upper().strip(),
        "odometer_start": data.odometer_start,
        "fuel_level": data.fuel_level,
        "checklist": [item.dict() for item in data.checklist],
        "has_anomaly": has_anomaly,
        "anomaly_description": data.anomaly_description,
        "anomaly_photo_base64": data.anomaly_photo_base64,
        "notes": data.notes,
        "created_at": datetime.now(timezone.utc),
        "status": "anomaly" if has_anomaly else "ok",
    }

    result = await db.vehicle_inspections.insert_one(doc)
    inspection_id = str(result.inserted_id)

    await log_action(
        driver_id, company_id,
        "vehicle_inspection_created", "vehicle_inspection", inspection_id,
        f"Contrôle de départ: {data.vehicle_plate} — {'⚠️ Anomalie' if has_anomaly else '✅ OK'}",
    )

    # Notification admin si anomalie
    if has_anomaly and company_id:
        await db.notifications.insert_one({
            "company_id": company_id,
            "type": "vehicle_anomaly",
            "title": "⚠️ Anomalie véhicule signalée",
            "message": f"{driver_name} a signalé une anomalie sur {data.vehicle_plate}: {data.anomaly_description or 'voir détails'}",
            "inspection_id": inspection_id,
            "driver_id": driver_id,
            "read": False,
            "created_at": datetime.now(timezone.utc),
        })

    return {
        "inspection_id": inspection_id,
        "status": doc["status"],
        "has_anomaly": has_anomaly,
        "message": "Contrôle enregistré avec succès",
    }


@router.get("/vehicle-inspections")
async def list_inspections(
    user: dict = Depends(get_current_user),
    limit: int = 50,
    driver_id: Optional[str] = None,
):
    """
    Admin → toutes les inspections de l'entreprise.
    Chauffeur → uniquement les siennes.
    """
    company_id = user.get("company_id")
    role = user.get("role", "driver")

    query: dict = {"company_id": company_id}

    if role == "driver":
        query["driver_id"] = user["id"]
    elif driver_id:
        query["driver_id"] = driver_id

    cursor = db.vehicle_inspections.find(query).sort("created_at", -1).limit(limit)
    items = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        # Ne pas renvoyer la photo en base64 dans la liste (trop lourd)
        doc.pop("anomaly_photo_base64", None)
        items.append(doc)

    return items


@router.get("/vehicle-inspections/{inspection_id}")
async def get_inspection(
    inspection_id: str,
    user: dict = Depends(get_current_user),
):
    """Détail complet d'une inspection (avec photo si présente)."""
    try:
        oid = ObjectId(inspection_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID invalide")

    doc = await db.vehicle_inspections.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Inspection introuvable")

    company_id = user.get("company_id")
    role = user.get("role", "driver")

    if role == "driver" and doc.get("driver_id") != user["id"]:
        raise HTTPException(status_code=403, detail="Accès refusé")
    if role != "driver" and doc.get("company_id") != company_id:
        raise HTTPException(status_code=403, detail="Accès refusé")

    doc["id"] = str(doc.pop("_id"))
    return doc


@router.get("/vehicle-inspections/today/summary")
async def today_inspection_summary(
    user: dict = Depends(require_role("admin")),
):
    """Résumé des contrôles du jour pour le dashboard admin."""
    company_id = user.get("company_id")
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    pipeline = [
        {"$match": {"company_id": company_id, "created_at": {"$gte": today_start}}},
        {"$group": {
            "_id": None,
            "total": {"$sum": 1},
            "with_anomaly": {"$sum": {"$cond": ["$has_anomaly", 1, 0]}},
            "ok": {"$sum": {"$cond": [{"$eq": ["$status", "ok"]}, 1, 0]}},
        }},
    ]
    result = await db.vehicle_inspections.aggregate(pipeline).to_list(1)
    if result:
        r = result[0]
        return {
            "total": r["total"],
            "ok": r["ok"],
            "with_anomaly": r["with_anomaly"],
            "date": today_start.isoformat(),
        }
    return {"total": 0, "ok": 0, "with_anomaly": 0, "date": today_start.isoformat()}
