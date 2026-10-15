"""Demo data seeder for Transporter-Pro.
Injects hyper-realistic French road freight (TRM) operations data:
- 3 Drivers with actual French plates and vehicles (Volvo, Renault, Mercedes)
- 6 Deliveries (Rungis, Denain, Aulnay, Lauwin-Planque, Lisses, Paris, Lieusaint, etc.)
- 5 Factur-X Invoices (over 5,000 € paid + pending)
- 1 AI-analyzed Damage Dispute (Gemini vision shield)
- 3 Pre-departure Vehicle Inspections (2 OK, 1 light anomaly)
- 3 Driver Eco-Scores
"""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request

from core.db import db
from core.auth import get_current_user, require_role, hash_password, log_action
from core.services import create_blockchain_hash

router = APIRouter(prefix="/api/demo")

# Realistic sample signature for completed deliveries (clean base64 / SVG placeholder)
SAMPLE_SIGNATURE = (
    "data:image/svg+xml;utf8,"
    "<svg xmlns='http://www.w3.org/2000/svg' width='300' height='120' viewBox='0 0 300 120'>"
    "<path d='M30,70 Q70,20 120,65 T200,50 T270,75' fill='none' stroke='%230066FF' stroke-width='3' stroke-linecap='round'/>"
    "<text x='40' y='105' font-family='sans-serif' font-size='11' fill='%2371717A'>Signé électroniquement (e-CMR certifié)</text>"
    "</svg>"
)

# Sample base64 placeholder for damage photo (small 1x1 png encoded safely)
SAMPLE_DAMAGE_PHOTO = (
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
)


@router.post("/seed")
async def seed_demo_data(user: dict = Depends(require_role("admin"))):
    """Seed comprehensive, realistic French TRM data for the logged-in admin's company."""
    company_id = user.get("company_id") or user["id"]
    admin_id = user["id"]
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # 1. Update company profile if empty/default
    await db.users.update_one(
        {"_id": user["_id"] if "_id" in user else {"$exists": True}, "id": admin_id},
        {"$set": {
            "company_name": user.get("company_name") or "Transports Express Dubois & Fils",
            "siret": user.get("siret") or "849 321 094 00018",
            "address": user.get("address") or "Zone Logistique Sogaris, 94150 Rungis",
        }}
    )

    # 2. SEED DRIVERS (3 realistic TRM profiles)
    drivers_data = [
        {
            "name": "Karim Benali",
            "email": f"karim.benali.{company_id[:5]}@transporter-demo.fr".lower(),
            "phone": "06 45 89 12 30",
            "vehicle_plate": "FR-482-TX",
            "vehicle_model": "Volvo FH 500 Globetrotter",
            "eco_score": 91
        },
        {
            "name": "Sylvain Moreau",
            "email": f"sylvain.moreau.{company_id[:5]}@transporter-demo.fr".lower(),
            "phone": "06 72 34 91 18",
            "vehicle_plate": "EZ-914-LK",
            "vehicle_model": "Renault Trucks T480",
            "eco_score": 84
        },
        {
            "name": "Alexandre Martin",
            "email": f"alexandre.martin.{company_id[:5]}@transporter-demo.fr".lower(),
            "phone": "07 88 12 45 67",
            "vehicle_plate": "GJ-350-BP",
            "vehicle_model": "Mercedes-Benz Actros 1845",
            "eco_score": 95
        }
    ]

    driver_ids = []
    driver_map = {}

    for d in drivers_data:
        existing = await db.users.find_one({"email": d["email"]})
        if existing:
            d_id = str(existing.get("_id") or existing.get("id"))
            await db.users.update_one(
                {"_id": existing["_id"]},
                {"$set": {
                    "name": d["name"],
                    "phone": d["phone"],
                    "vehicle_plate": d["vehicle_plate"],
                    "vehicle_model": d["vehicle_model"],
                    "status": "active",
                    "company_id": company_id
                }}
            )
        else:
            doc = {
                "id": str(uuid.uuid4()),
                "email": d["email"],
                "password_hash": hash_password("Chauffeur2026!"),
                "name": d["name"],
                "role": "driver",
                "phone": d["phone"],
                "vehicle_plate": d["vehicle_plate"],
                "vehicle_model": d["vehicle_model"],
                "company_id": company_id,
                "created_by": admin_id,
                "created_at": now - timedelta(days=45),
                "status": "active"
            }
            res = await db.users.insert_one(doc)
            d_id = str(res.inserted_id)

        driver_ids.append(d_id)
        driver_map[d["name"]] = {"id": d_id, "plate": d["vehicle_plate"]}

        # Seed Eco-score for each driver
        await db.eco_scores.delete_many({"driver_id": d_id})
        await db.eco_scores.insert_one({
            "driver_id": d_id,
            "driver_name": d["name"],
            "company_id": company_id,
            "score": d["eco_score"],
            "distance_km": 310.0 if d["name"] == "Karim Benali" else 245.0 if d["name"] == "Sylvain Moreau" else 420.0,
            "co2_kg": 85.0 if d["name"] == "Karim Benali" else 68.0 if d["name"] == "Sylvain Moreau" else 110.0,
            "fuel_liters": 78.0,
            "harsh_braking_count": 0 if d["eco_score"] > 90 else 1,
            "harsh_acceleration_count": 1 if d["eco_score"] > 90 else 2,
            "updated_at": now
        })

    # 3. SEED DELIVERIES (6 real French logistics journeys)
    karim = driver_map["Karim Benali"]
    sylvain = driver_map["Sylvain Moreau"]
    alex = driver_map["Alexandre Martin"]

    deliveries_seed = [
        {
            "tracking_id": f"TP-DEMO-01",
            "pickup_name": "Plateforme Logistique Sogaris",
            "pickup_address": "Zone Sogaris Bât A3, 94150 Rungis",
            "recipient_name": "Carrefour Supply Chain France",
            "recipient_address": "Parc d'Activités des Portes du Nord, 59220 Denain",
            "recipient_phone": "03 27 21 45 00",
            "package_description": "24 Palettes Europe - Épicerie & produits secs",
            "weight_kg": 8400.0,
            "status": "delivered",
            "driver_id": karim["id"],
            "driver_name": "Karim Benali",
            "created_at": now - timedelta(hours=6),
            "delivered_at": now - timedelta(hours=1, minutes=15),
            "signature_data": SAMPLE_SIGNATURE,
            "distance_km": 218.0,
            "co2_kg": 185.0,
            "gps_location": {"lat": 50.3289, "lng": 3.3951}
        },
        {
            "tracking_id": f"TP-DEMO-02",
            "pickup_name": "Centre Hub Chronopost Nord",
            "pickup_address": "Avenue de l'Europe, 93600 Aulnay-sous-Bois",
            "recipient_name": "Amazon Logistique Hub LIL1",
            "recipient_address": "1 Rue de la Plaine, 59553 Lauwin-Planque",
            "recipient_phone": "03 27 08 90 00",
            "package_description": "18 Palettes Box - Flux express e-commerce",
            "weight_kg": 3200.0,
            "status": "in_transit",
            "driver_id": sylvain["id"],
            "driver_name": "Sylvain Moreau",
            "created_at": now - timedelta(hours=3),
            "delivered_at": None,
            "signature_data": None,
            "distance_km": 165.0,
            "co2_kg": 72.0,
            "gps_location": {"lat": 49.7891, "lng": 2.8942}  # On A1 near Roye
        },
        {
            "tracking_id": f"TP-DEMO-03",
            "pickup_name": "Plateforme Rexel Distribution",
            "pickup_address": "Rue des Haies, 91090 Lisses",
            "recipient_name": "Eiffage Construction Grand Paris",
            "recipient_address": "Chantier Tour Bruneseau, 75013 Paris",
            "recipient_phone": "01 44 23 88 10",
            "package_description": "Tourets de câbles cuivre & armoires TGBT",
            "weight_kg": 4100.0,
            "status": "in_transit",
            "driver_id": karim["id"],
            "driver_name": "Karim Benali",
            "created_at": now - timedelta(hours=2),
            "delivered_at": None,
            "signature_data": None,
            "distance_km": 34.0,
            "co2_kg": 28.0,
            "gps_location": {"lat": 48.7842, "lng": 2.3912}  # A6 heading north
        },
        {
            "tracking_id": f"TP-DEMO-04",
            "pickup_name": "Hub GXO Logistics",
            "pickup_address": "Parc Gustave Eiffel, 77127 Lieusaint",
            "recipient_name": "Leroy Merlin Plateforme Régionale",
            "recipient_address": "Route de Pontoise, 95100 Argenteuil",
            "recipient_phone": "01 34 23 55 00",
            "package_description": "12 Palettes - Outillage & quincaillerie lourde",
            "weight_kg": 2900.0,
            "status": "delivered",
            "driver_id": alex["id"],
            "driver_name": "Alexandre Martin",
            "created_at": now - timedelta(days=1, hours=4),
            "delivered_at": now - timedelta(days=1, hours=1),
            "signature_data": SAMPLE_SIGNATURE,
            "distance_km": 68.0,
            "co2_kg": 42.0,
            "gps_location": {"lat": 48.9482, "lng": 2.2471}
        },
        {
            "tracking_id": f"TP-DEMO-05",
            "pickup_name": "Entrepôt Geodis Logistique",
            "pickup_address": "Rue de l'Aviation, 69800 Saint-Priest",
            "recipient_name": "Centrale d'Achat Auchan",
            "recipient_address": "Avenue de Paris, 71100 Chalon-sur-Saône",
            "recipient_phone": "03 85 42 70 00",
            "package_description": "30 Palettes - Boissons & conserves",
            "weight_kg": 14500.0,
            "status": "assigned",
            "driver_id": alex["id"],
            "driver_name": "Alexandre Martin",
            "created_at": now - timedelta(minutes=45),
            "delivered_at": None,
            "signature_data": None,
            "distance_km": 132.0,
            "co2_kg": 115.0,
            "gps_location": None
        },
        {
            "tracking_id": f"TP-DEMO-06",
            "pickup_name": "Distribution Pharmaceutique Sanofi",
            "pickup_address": "Avenue de France, 94250 Gentilly",
            "recipient_name": "Pharmacie Centrale CHU Amiens-Picardie",
            "recipient_address": "Rond-point Prof. Cabrol, 80000 Amiens",
            "recipient_phone": "03 22 08 80 00",
            "package_description": "8 Colis Frigo (+2°C/+8°C) - Sérums & vaccins",
            "weight_kg": 140.0,
            "status": "pending",
            "driver_id": None,
            "driver_name": None,
            "created_at": now - timedelta(minutes=15),
            "delivered_at": None,
            "signature_data": None,
            "distance_km": 145.0,
            "co2_kg": 18.0,
            "gps_location": None
        }
    ]

    # Clean existing demo deliveries first
    await db.deliveries.delete_many({"company_id": company_id, "tracking_id": {"$regex": "^TP-DEMO-"}})

    for d in deliveries_seed:
        d["company_id"] = company_id
        d["client_id"] = admin_id
        d["updated_at"] = now
        d["blockchain_proof"] = create_blockchain_hash({
            "tracking_id": d["tracking_id"],
            "recipient": d["recipient_name"],
            "status": d["status"]
        })
        await db.deliveries.insert_one(d)

    # 4. SEED FACTUR-X INVOICES (Real cash flow numbers)
    invoices_seed = [
        {
            "invoice_id": "INV-2026-0041",
            "delivery_id": "TP-DEMO-01",
            "company_id": company_id,
            "client_id": admin_id,
            "client_name": "Carrefour Supply Chain France",
            "amount": 1850.00,
            "status": "paid",
            "created_at": now - timedelta(days=2),
            "due_date": now + timedelta(days=28),
            "paid_at": now - timedelta(hours=1),
            "facturx_generated": True,
            "blockchain_proof": create_blockchain_hash({"invoice": "INV-2026-0041", "amount": 1850.00})
        },
        {
            "invoice_id": "INV-2026-0042",
            "delivery_id": "TP-DEMO-04",
            "company_id": company_id,
            "client_id": admin_id,
            "client_name": "Leroy Merlin Plateforme",
            "amount": 980.00,
            "status": "paid",
            "created_at": now - timedelta(days=4),
            "due_date": now + timedelta(days=26),
            "paid_at": now - timedelta(days=1),
            "facturx_generated": True,
            "blockchain_proof": create_blockchain_hash({"invoice": "INV-2026-0042", "amount": 980.00})
        },
        {
            "invoice_id": "INV-2026-0043",
            "delivery_id": "TP-DEMO-HIST-01",
            "company_id": company_id,
            "client_id": admin_id,
            "client_name": "Eiffage Construction Grand Paris",
            "amount": 2450.00,
            "status": "paid",
            "created_at": now - timedelta(days=8),
            "due_date": now + timedelta(days=22),
            "paid_at": now - timedelta(days=5),
            "facturx_generated": True,
            "blockchain_proof": create_blockchain_hash({"invoice": "INV-2026-0043", "amount": 2450.00})
        },
        {
            "invoice_id": "INV-2026-0044",
            "delivery_id": "TP-DEMO-02",
            "company_id": company_id,
            "client_id": admin_id,
            "client_name": "Amazon Logistique Hub LIL1",
            "amount": 1200.00,
            "status": "ready_to_send",
            "created_at": now - timedelta(hours=3),
            "due_date": now + timedelta(days=30),
            "paid_at": None,
            "facturx_generated": True,
            "blockchain_proof": create_blockchain_hash({"invoice": "INV-2026-0044", "amount": 1200.00})
        },
        {
            "invoice_id": "INV-2026-0045",
            "delivery_id": "TP-DEMO-03",
            "company_id": company_id,
            "client_id": admin_id,
            "client_name": "Rexel Distribution IDF",
            "amount": 750.00,
            "status": "ready_to_send",
            "created_at": now - timedelta(hours=2),
            "due_date": now + timedelta(days=30),
            "paid_at": None,
            "facturx_generated": True,
            "blockchain_proof": create_blockchain_hash({"invoice": "INV-2026-0045", "amount": 750.00})
        }
    ]

    await db.invoices.delete_many({"company_id": company_id, "invoice_id": {"$regex": "^INV-2026-004"}})
    for inv in invoices_seed:
        await db.invoices.insert_one(inv)

    # 5. SEED AI DAMAGE REPORT (Gemini Vision Shield)
    await db.damage_reports.delete_many({"company_id": company_id, "delivery_id": "TP-DEMO-03"})
    damage_report_doc = {
        "report_id": f"REP-DEMO-{uuid.uuid4().hex[:6].upper()}",
        "delivery_id": "TP-DEMO-03",
        "company_id": company_id,
        "driver_id": karim["id"],
        "photo_base64": SAMPLE_DAMAGE_PHOTO,
        "description": "Choc constaté lors du déchargement au quai B3. Filmage étirable déchiré.",
        "ai_analysis": {
            "is_damaged": True,
            "damage_severity": "moderate",
            "confidence": 92,
            "damage_type": "Perforation carton & affaissement de palette",
            "description": "L'analyse IA détecte un impact sur la face latérale droite. Emballage d'origine perforé sur ~15cm. Réserves légales émises automatiquement au transporteur et intégrées à l'e-CMR."
        },
        "created_at": now - timedelta(hours=1, minutes=45),
        "blockchain_proof": create_blockchain_hash({"delivery": "TP-DEMO-03", "damage": True})
    }
    await db.damage_reports.insert_one(damage_report_doc)

    # 6. SEED VEHICLE PRE-DEPARTURE INSPECTIONS (Contrôles de départ)
    await db.vehicle_inspections.delete_many({"company_id": company_id, "vehicle_plate": {"$in": ["FR-482-TX", "EZ-914-LK", "GJ-350-BP"]}})

    default_checklist_ok = [
        {"id": "tires", "label": "🛞 Pneus & roues", "status": "ok"},
        {"id": "lights", "label": "💡 Feux & clignotants", "status": "ok"},
        {"id": "mirrors", "label": "🔍 Rétroviseurs & pare-brise", "status": "ok"},
        {"id": "documents", "label": "📄 Documents de bord", "status": "ok"},
        {"id": "safety_kit", "label": "🦺 Gilet / Triangle / Extincteur", "status": "ok"},
        {"id": "cargo_area", "label": "📦 Caisse & sangles de chargement", "status": "ok"},
        {"id": "oil_water", "label": "🛢️ Niveaux huile & eau", "status": "ok"},
    ]

    checklist_with_anomaly = [
        {"id": "tires", "label": "🛞 Pneus & roues", "status": "anomaly"},
        {"id": "lights", "label": "💡 Feux & clignotants", "status": "ok"},
        {"id": "mirrors", "label": "🔍 Rétroviseurs & pare-brise", "status": "ok"},
        {"id": "documents", "label": "📄 Documents de bord", "status": "ok"},
        {"id": "safety_kit", "label": "🦺 Gilet / Triangle / Extincteur", "status": "ok"},
        {"id": "cargo_area", "label": "📦 Caisse & sangles de chargement", "status": "ok"},
        {"id": "oil_water", "label": "🛢️ Niveaux huile & eau", "status": "ok"},
    ]

    inspections_seed = [
        {
            "company_id": company_id,
            "driver_id": karim["id"],
            "driver_name": "Karim Benali",
            "vehicle_plate": "FR-482-TX",
            "odometer_start": 142850.0,
            "fuel_level": "75",
            "checklist": default_checklist_ok,
            "has_anomaly": False,
            "anomaly_description": None,
            "anomaly_photo_base64": None,
            "notes": "Véhicule propre, RAS avant départ autoroute A1.",
            "created_at": today_start.replace(hour=6, minute=45),
            "status": "ok"
        },
        {
            "company_id": company_id,
            "driver_id": sylvain["id"],
            "driver_name": "Sylvain Moreau",
            "vehicle_plate": "EZ-914-LK",
            "odometer_start": 89420.0,
            "fuel_level": "50",
            "checklist": checklist_with_anomaly,
            "has_anomaly": True,
            "anomaly_description": "Alerte pression pneu AVG (2.1 bars au lieu de 2.8). Gonflage effectué avant départ autoroute.",
            "anomaly_photo_base64": SAMPLE_DAMAGE_PHOTO,
            "notes": "Pression remise à 2.8 bars à la station Rungis.",
            "created_at": today_start.replace(hour=7, minute=10),
            "status": "anomaly"
        },
        {
            "company_id": company_id,
            "driver_id": alex["id"],
            "driver_name": "Alexandre Martin",
            "vehicle_plate": "GJ-350-BP",
            "odometer_start": 215100.0,
            "fuel_level": "100",
            "checklist": default_checklist_ok,
            "has_anomaly": False,
            "anomaly_description": None,
            "anomaly_photo_base64": None,
            "notes": "Plein fait chez AS24. Prêt pour tournée Chalon.",
            "created_at": today_start.replace(hour=7, minute=30),
            "status": "ok"
        }
    ]

    for insp in inspections_seed:
        await db.vehicle_inspections.insert_one(insp)

    await log_action(admin_id, company_id, "seed_demo_data", "system", "demo", "Génération des données démo TRM réussie")

    return {
        "status": "success",
        "message": "Données démo TRM injectées avec succès !",
        "summary": {
            "drivers": len(drivers_data),
            "deliveries": len(deliveries_seed),
            "invoices": len(invoices_seed),
            "inspections": len(inspections_seed),
            "damage_reports": 1,
            "drivers_credentials": {
                "password": "Chauffeur2026!",
                "accounts": [f"{d['name']} ({d['email']})" for d in drivers_data]
            }
        }
    }


@router.delete("/clean")
async def clean_demo_data(user: dict = Depends(require_role("admin"))):
    """Delete all demo data generated for the company."""
    company_id = user.get("company_id") or user["id"]

    del_deliveries = await db.deliveries.delete_many({"company_id": company_id, "tracking_id": {"$regex": "^TP-DEMO-"}})
    del_invoices = await db.invoices.delete_many({"company_id": company_id, "invoice_id": {"$regex": "^INV-2026-004"}})
    del_inspections = await db.vehicle_inspections.delete_many({"company_id": company_id, "vehicle_plate": {"$in": ["FR-482-TX", "EZ-914-LK", "GJ-350-BP"]}})
    del_reports = await db.damage_reports.delete_many({"company_id": company_id, "report_id": {"$regex": "^REP-DEMO-"}})
    del_drivers = await db.users.delete_many({"company_id": company_id, "email": {"$regex": "@transporter-demo\\.fr$"}})

    return {
        "status": "cleaned",
        "message": "Données de démonstration nettoyées avec succès.",
        "deleted": {
            "deliveries": del_deliveries.deleted_count,
            "invoices": del_invoices.deleted_count,
            "inspections": del_inspections.deleted_count,
            "damage_reports": del_reports.deleted_count,
            "drivers": del_drivers.deleted_count
        }
    }
