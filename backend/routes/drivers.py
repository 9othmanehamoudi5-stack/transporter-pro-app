"""Driver management endpoints — extracted from server.py (structure only)."""
from __future__ import annotations
import re
import uuid
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Request

from core.db import db, get_max_drivers
from core.auth import hash_password, get_current_user, require_role, log_action
from core.models import DriverCreate
from server import DriverUpdatePayload, limiter, logger

router = APIRouter(prefix="/api")


@router.post("/admin/drivers")
@limiter.limit("20/minute")
async def create_driver(data: DriverCreate, request: Request, user: dict = Depends(require_role("admin"))):
    """Admin creates a new driver account"""
    company_id = user["company_id"]

    # Check plan quota (strict: starter=3, pme=15, flotte=unlimited; legacy names still resolve)
    plan = user.get("plan", "starter")
    max_drivers = get_max_drivers(plan)
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



@router.get("/admin/drivers")
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



@router.delete("/admin/drivers/{driver_id}")
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




@router.put("/admin/drivers/{driver_id}")
async def update_driver(driver_id: str, payload: DriverUpdatePayload, user: dict = Depends(require_role("admin"))):
    """Update driver info (name, phone, vehicle_plate). Email/password not editable here."""
    import re as _re
    company_id = user["company_id"]
    updates = {}
    if payload.name is not None:
        clean = payload.name.strip()
        if not _re.fullmatch(r"[A-Za-zÀ-ÿ\s\-]+", clean):
            raise HTTPException(status_code=400, detail="Nom invalide (lettres, espaces, tirets uniquement)")
        updates["name"] = clean
    if payload.phone is not None:
        clean = _re.sub(r"\D", "", payload.phone)
        updates["phone"] = clean
    if payload.vehicle_plate is not None:
        clean = payload.vehicle_plate.upper().strip()
        if clean and not _re.fullmatch(r"[A-Z0-9\-]+", clean):
            raise HTTPException(status_code=400, detail="Immatriculation invalide (lettres, chiffres, tirets uniquement)")
        updates["vehicle_plate"] = clean
    if not updates:
        raise HTTPException(status_code=400, detail="Aucune modification fournie")

    result = await db.users.update_one(
        {"_id": ObjectId(driver_id), "role": "driver", "company_id": company_id},
        {"$set": {**updates, "updated_at": datetime.now(timezone.utc)}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Chauffeur non trouvé")

    await log_action(user["id"], company_id, "update_driver", "driver", driver_id, f"Champs: {','.join(updates.keys())}")
    driver = await db.users.find_one({"_id": ObjectId(driver_id)}, {"_id": 0, "password_hash": 0})
    return {"message": "Chauffeur mis à jour", "driver": driver}


