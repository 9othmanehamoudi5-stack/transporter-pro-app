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
- [x] Gating des abonnements (badge, locks, toasts, overlay upgrade)
- [x] Sauvegarde MongoDB (primaire) + Firestore sync (secondaire non-bloquant)

### Phase 3 - IA Anti-Litige (DONE - 10 Avril 2026)
- [x] Intégration Gemini 3 Flash Vision via emergentintegrations
- [x] Analyse automatique des photos (sévérité, description FR, confiance IA, type dommage)
- [x] Dashboard Driver : overlay résultat IA après capture photo
- [x] Dashboard Admin Litiges : stats, cartes détaillées, aperçu photo, preuve blockchain

### Phase 3b - Optimisation IA (DONE - 10 Avril 2026)
- [x] Preprocessing images : compression + conversion JPEG (max 1280px, qualité 0.7-0.8)
- [x] Messages d'erreur propres (masque INVALID_ARGUMENT → message français lisible)
- [x] Bouton "Relancer l'analyse" sur les rapports en erreur (POST /api/damage-reports/{id}/retry)
- [x] Frontend : CameraModal compresse à max 1280px avant envoi

## Backlog P1 (Prioritaire)
- [ ] Génération PDF réelle (Factur-X / e-CMR)
- [ ] Corriger règles sécurité Firebase (voir /app/memory/FIREBASE_RULES.md)

## Backlog P2 (Futur)
- [ ] Mode hors-ligne (localStorage + file sync)
- [ ] Score éco-conduite & calcul CO2 (logique réelle)

## Problèmes Connus
- Firestore writes échouent silencieusement (Permission Denied)
- Blockchain timestamping est MOCKÉ (SHA256 hash)
- Certaines photos anciennes en DB ont des images tronquées (pré-fix)

## API Endpoints
- POST /api/auth/login, /api/auth/register, /api/auth/logout
- GET /api/auth/me, POST /api/auth/refresh
- GET/POST /api/deliveries, PATCH /api/deliveries/{id}
- POST /api/deliveries/{id}/assign, /api/deliveries/{id}/gps
- GET/POST /api/invoices, PATCH /api/invoices/{id}/pay
- GET/POST /api/damage-reports
- GET /api/damage-reports/{report_id}/photo
- POST /api/damage-reports/{report_id}/retry
- GET/POST /api/eco-scores, GET /api/eco-scores/summary
- GET /api/dashboard/stats, /api/dashboard/cash-flow
- GET /api/subscription/plans, /api/subscription/current
- POST /api/subscription/update
- GET/POST /api/notifications, GET /api/notifications/unread-count
- POST /api/notifications/mark-read
- GET /api/admin/drivers, POST /api/admin/drivers, DELETE /api/admin/drivers/{id}
