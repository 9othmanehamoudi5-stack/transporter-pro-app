# Transporter-Pro - PRD (Product Requirements Document)

## Problème Original
Application SaaS logistique "Transporter-Pro" pour éliminer la friction administrative et maximiser la profitabilité des PME de transport. Fonctionnalités clés : dashboard cash-flow instantané (Factur-X), IA anti-litige (analyse photo via Gemini 3 Flash Vision), module économie réelle (éco-conduite, CO2), mode offline-sync, portail client white-label.

## Personas
- **Admin** : Gérant de PME transport, gère les livraisons, chauffeurs, facturation
- **Chauffeur** : Interface mobile "One-Hand", démarrage livraison, photo, signature
- **Client** : Suivi de colis via portail public

## Architecture Technique
- **Frontend** : React + Tailwind CSS + shadcn/ui
- **Backend** : FastAPI + MongoDB (Motor)
- **Intégrations** : Firebase Firestore (sync missions/subscriptions), Gemini 3 Flash Vision (IA anti-litige)
- **Auth** : JWT (Custom) avec bcrypt

## Fonctionnalités Implémentées

### Phase 1 - MVP (DONE)
- [x] Setup React + FastAPI + MongoDB
- [x] Auth multi-rôle (Admin, Driver, Client) avec JWT
- [x] Dashboard Admin (stats, cash-flow, livraisons, litiges, éco-scores)
- [x] Dashboard Driver (livraisons, photo, signature, éco-score)
- [x] Portail Client (suivi public)
- [x] Firebase Firestore intégration (sync missions)
- [x] Popup d'assignation chauffeur avec dropdown

### Phase 2 - Monétisation (DONE - 10 Avril 2026)
- [x] Page Abonnement (3 plans : Solo/Duo 49€, Croissance 199€, Flotte Pro 499€)
- [x] Gating des abonnements :
  - Badge plan dans la sidebar (Solo gris, Croissance bleu, Pro orange)
  - Verrouillage Cash-Flow et Éco-scores pour Solo
  - Boutons d'actions rapides verrouillés selon le plan (e-CMR, GPS, Scan, Portail Client)
  - Messages toast de restriction
  - Overlay "Fonctionnalité verrouillée" avec CTA upgrade
- [x] Sauvegarde MongoDB (primaire) + Firestore sync (secondaire non-bloquant)

## Backlog P1 (Prioritaire)
- [ ] Gemini 3 Flash Vision IA anti-litige (analyse photo dans dashboard Driver)
- [ ] Génération PDF réelle (Factur-X / e-CMR)
- [ ] Corriger règles sécurité Firebase (Permission Denied sur writes)

## Backlog P2 (Futur)
- [ ] Mode hors-ligne (localStorage + file sync)
- [ ] Score éco-conduite & calcul CO2 (logique réelle)

## Problèmes Connus
- Firestore writes échouent silencieusement (Permission Denied) - Règles Firebase à mettre à jour par l'utilisateur (voir /app/memory/FIREBASE_RULES.md)
- Blockchain timestamping est MOCKÉ (SHA256 hash)

## Data Models
- `users`: {email, password_hash, role, name, status, phone, vehicle_plate}
- `deliveries`: {tracking_id, status, driver_id, recipient_name, recipient_address, ...}
- `invoices`: {invoice_id, delivery_id, amount, status, facturx_generated}
- `subscriptions`: {admin_id, plan, billing_cycle, price, status, features}
- `eco_scores`: {driver_id, score, distance_km, co2_kg, fuel_liters}
- `damage_reports`: {report_id, delivery_id, ai_analysis, blockchain_proof}
- `notifications`: {user_id, type, title, message, read}

## API Endpoints
- POST /api/auth/login, /api/auth/register, /api/auth/logout
- GET /api/auth/me, POST /api/auth/refresh
- GET/POST /api/deliveries, PATCH /api/deliveries/{id}
- POST /api/deliveries/{id}/assign, /api/deliveries/{id}/gps
- GET/POST /api/invoices, PATCH /api/invoices/{id}/pay
- GET/POST /api/damage-reports
- GET/POST /api/eco-scores, GET /api/eco-scores/summary
- GET /api/dashboard/stats, /api/dashboard/cash-flow
- GET /api/subscription/plans, /api/subscription/current
- POST /api/subscription/update
- GET/POST /api/notifications, GET /api/notifications/unread-count
- POST /api/notifications/mark-read
- GET /api/admin/drivers, POST /api/admin/drivers, DELETE /api/admin/drivers/{id}
