"""Delivery endpoints — extracted from server.py (structure only)."""
from __future__ import annotations
import uuid
from datetime import datetime, timedelta, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Request, Form
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from core.db import db
from core.auth import get_current_user, require_role, log_action
from core.services import create_blockchain_hash
from core.models import DeliveryCreate, DeliveryUpdate
from server import DeliveryPhotoUpload, logger

router = APIRouter(prefix="/api")


@router.post("/deliveries")
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



@router.get("/deliveries")
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
    
    # Sort: optimized (sequence_order ASC) first, then newest. Falls back to created_at when no order.
    deliveries = await db.deliveries.find(query, {"_id": 0}).sort([("sequence_order", 1), ("created_at", -1)]).to_list(100)
    
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



@router.get("/deliveries/route-preview")
async def get_route_preview(user: dict = Depends(require_role("admin"))):
    """Return current optimized sequence + OSRM polyline geometry for Live Map overlay."""
    import httpx
    from core.routing import geocode_address, OSRM

    cid = user["company_id"]
    deliveries = await db.deliveries.find(
        {"company_id": cid, "status": {"$in": ["pending", "assigned", "in_transit"]}},
        {"_id": 0}
    ).sort([("sequence_order", 1), ("created_at", -1)]).to_list(50)

    stops = []
    for d in deliveries:
        coord = await geocode_address(d.get("recipient_address", ""))
        if coord:
            stops.append({
                "tracking_id": d["tracking_id"],
                "recipient_name": d.get("recipient_name", ""),
                "address": d.get("recipient_address", ""),
                "lng": coord[0], "lat": coord[1],
                "order": d.get("sequence_order"),
            })

    geometry = []
    if len(stops) >= 2:
        coords_str = ";".join(f"{s['lng']},{s['lat']}" for s in stops)
        try:
            async with httpx.AsyncClient(timeout=15.0) as c:
                r = await c.get(f"{OSRM}/route/v1/driving/{coords_str}?overview=full&geometries=geojson")
                if r.status_code == 200:
                    data = r.json()
                    if data.get("code") == "Ok" and data.get("routes"):
                        # GeoJSON coords are [lng, lat] → Leaflet wants [lat, lng]
                        geometry = [[c[1], c[0]] for c in data["routes"][0]["geometry"]["coordinates"]]
        except Exception as e:
            logger.warning(f"OSRM route geometry failed: {e}")

    return {"stops": stops, "geometry": geometry}




@router.post("/deliveries/optimize")
async def optimize_deliveries_route(user: dict = Depends(require_role("admin"))):
    """Optimize today's pending/assigned deliveries using OSRM TSP."""
    from core.routing import optimize_route

    cid = user["company_id"]
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    deliveries = await db.deliveries.find({
        "company_id": cid,
        "status": {"$in": ["pending", "assigned"]},
        "created_at": {"$gte": today_start},
    }, {"_id": 0}).to_list(100)

    if not deliveries:
        # Fallback: any pending/assigned (not just today) so demo flows still work
        deliveries = await db.deliveries.find({
            "company_id": cid,
            "status": {"$in": ["pending", "assigned"]},
        }, {"_id": 0}).to_list(100)

    if len(deliveries) < 2:
        raise HTTPException(status_code=400, detail="Au moins 2 livraisons actives requises pour optimiser une tournée")

    result = await optimize_route(deliveries)
    if not result.get("sequence"):
        raise HTTPException(status_code=502, detail=result.get("error") or "Optimisation impossible (adresses non géocodables)")

    # Persist sequence_order in DB
    for item in result["sequence"]:
        await db.deliveries.update_one(
            {"tracking_id": item["tracking_id"], "company_id": cid},
            {"$set": {"sequence_order": item["order"], "optimized_at": datetime.now(timezone.utc)}},
        )

    await log_action(user["id"], cid, "optimize_route", "delivery", "", f"{len(result['sequence'])} stops · {result['saved_km']} km saved")

    return {
        "optimized_count": len(result["sequence"]),
        "skipped": result.get("skipped", 0),
        "distance_original_km": result["distance_original_km"],
        "distance_optimized_km": result["distance_optimized_km"],
        "saved_km": result["saved_km"],
    }




@router.get("/deliveries/{tracking_id}")
async def get_delivery(tracking_id: str):
    delivery = await db.deliveries.find_one({"tracking_id": tracking_id}, {"_id": 0})
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")
    
    for field in ["created_at", "updated_at", "delivered_at"]:
        if isinstance(delivery.get(field), datetime):
            delivery[field] = delivery[field].isoformat()
    
    return delivery




@router.get("/deliveries/{tracking_id}/pdf")
async def download_delivery_pdf(tracking_id: str, user: dict = Depends(get_current_user)):
    """Generate and return an Operational Delivery Report PDF for the given tracking_id.
    Available once the delivery is in_transit or delivered. Multi-tenant filtered by company_id."""
    from fastapi.responses import Response
    from core.pdf_report import generate_delivery_report_pdf

    delivery = await db.deliveries.find_one({"tracking_id": tracking_id})
    if not delivery:
        raise HTTPException(status_code=404, detail="Livraison introuvable")

    # Multi-tenant: only the owning company (or its drivers) can download
    cid = user.get("company_id", "")
    if delivery.get("company_id") and delivery.get("company_id") != cid:
        raise HTTPException(status_code=403, detail="Accès refusé")

    # Resolve company + logo (admin's record holds both)
    admin_id = cid or delivery.get("admin_id") or user["id"]
    company_doc = await db.companies.find_one({"admin_id": admin_id}) or {}
    admin_doc = await db.users.find_one({"_id": ObjectId(admin_id)}) or {}
    logo_b64 = admin_doc.get("logo_base64") or company_doc.get("logo_base64") or ""

    # Resolve driver name
    driver_name = ""
    if delivery.get("driver_id"):
        try:
            drv = await db.users.find_one({"_id": ObjectId(delivery["driver_id"])})
            driver_name = (drv or {}).get("name", "")
        except Exception:
            driver_name = ""

    pdf_bytes = generate_delivery_report_pdf(
        delivery=delivery,
        company={
            "company_name": company_doc.get("company_name") or admin_doc.get("company_name", ""),
            "siret": company_doc.get("siret", ""),
            "tva_intra": company_doc.get("tva_intra", ""),
            "address": company_doc.get("address", ""),
        },
        logo_b64=logo_b64,
        driver_name=driver_name,
    )

    await log_action(user["id"], cid, "download_delivery_pdf", "delivery", tracking_id, "PDF rapport opérationnel téléchargé")

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="rapport-{tracking_id}.pdf"',
        },
    )



@router.patch("/deliveries/{tracking_id}")
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



@router.post("/deliveries/{tracking_id}/assign")
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



@router.post("/deliveries/{tracking_id}/gps")
async def update_gps(tracking_id: str, lat: float = Form(...), lng: float = Form(...), user: dict = Depends(require_role("driver"))):
    await db.deliveries.update_one(
        {"tracking_id": tracking_id},
        {"$set": {"gps_location": {"lat": lat, "lng": lng, "updated_at": datetime.now(timezone.utc).isoformat()}}}
    )
    return {"message": "GPS updated"}




@router.post("/deliveries/{tracking_id}/photos")
async def upload_delivery_photo(tracking_id: str, data: DeliveryPhotoUpload, user: dict = Depends(get_current_user)):
    """Append a proof-of-delivery photo (base64) to a delivery.
    Used both by the online flow and the offline sync when the driver's device
    comes back online. Photos are capped at ~500KB base64 to keep the document
    small; larger uploads are truncated. Multi-tenant: driver must be assigned
    OR admin must own the company."""
    delivery = await db.deliveries.find_one({"tracking_id": tracking_id})
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")

    # Access control: driver must be assigned, admin must own the company
    if user["role"] == "driver" and delivery.get("driver_id") != user["id"]:
        raise HTTPException(status_code=403, detail="Not your delivery")
    if user["role"] == "admin" and delivery.get("company_id") != user.get("company_id"):
        raise HTTPException(status_code=403, detail="Not your company's delivery")

    photo = data.photo_base64 or ""
    if not photo:
        raise HTTPException(status_code=400, detail="photo_base64 required")
    if len(photo) > 500_000:
        photo = photo[:500_000]

    photo_entry = {
        "photo_base64": photo,
        "uploaded_by": user["id"],
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await db.deliveries.update_one(
        {"tracking_id": tracking_id},
        {"$push": {"photos": photo_entry}},
    )
    photos_count = len(delivery.get("photos", [])) + (1 if result.modified_count else 0)
    await log_action(user["id"], user.get("company_id", ""), "upload_delivery_photo", "delivery", tracking_id, f"total_photos={photos_count}")
    return {"success": True, "tracking_id": tracking_id, "photos_count": photos_count}



