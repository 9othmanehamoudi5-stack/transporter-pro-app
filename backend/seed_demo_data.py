#!/usr/bin/env python3
"""CLI utility to seed realistic French TRM data directly into MongoDB.
Usage:
    python backend/seed_demo_data.py
    python backend/seed_demo_data.py --email admin@transporter-pro.com
"""
import asyncio
import sys
import argparse
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from core.db import db
from routes.demo import seed_demo_data


async def main():
    parser = argparse.ArgumentParser(description="Seed realistic French TRM demo data.")
    parser.add_argument("--email", type=str, default="admin@transporter-pro.com", help="Email of admin user to seed data for")
    args = parser.parse_args()

    print(f"[*] Searching for admin user with email: {args.email}...")
    user = await db.users.find_one({"email": args.email.lower()})

    if not user:
        # Fallback to any admin
        user = await db.users.find_one({"role": "admin"})

    if not user:
        print("[!] Error: No admin user found in database. Create an admin first or check credentials.")
        return

    admin_dict = {
        "_id": user["_id"],
        "id": str(user.get("_id") or user.get("id")),
        "email": user["email"],
        "role": "admin",
        "company_id": user.get("company_id") or str(user["_id"]),
        "company_name": user.get("company_name", "Transports Express Dubois & Fils")
    }

    print(f"[+] Found admin: {admin_dict['email']} (Company: {admin_dict['company_id']})")
    print("[*] Injecting realistic French TRM data (Drivers, Deliveries, Invoices, Disputes, Inspections)...")

    result = await seed_demo_data(user=admin_dict)
    print("\n[SUCCESS] " + result["message"])
    print(f" - Chauffeurs créés : {result['summary']['drivers']}")
    print(f" - Livraisons créées : {result['summary']['deliveries']}")
    print(f" - Factures Factur-X : {result['summary']['invoices']}")
    print(f" - Contrôles de départ : {result['summary']['inspections']}")
    print(f" - Litiges IA : {result['summary']['damage_reports']}")
    print(f"\nMot de passe par défaut des chauffeurs démo : {result['summary']['drivers_credentials']['password']}")
    for acc in result['summary']['drivers_credentials']['accounts']:
        print(f"   -> {acc}")


if __name__ == "__main__":
    asyncio.run(main())
