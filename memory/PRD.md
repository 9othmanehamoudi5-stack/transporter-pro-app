# Transporter-Pro - PRD

## Problème Original
Application SaaS logistique "Transporter-Pro" pour PME de transport.

## Architecture Technique
- **Frontend** : React + Tailwind CSS + shadcn/ui + Leaflet
- **Backend** : FastAPI + MongoDB (Motor)
- **Intégrations** : Firebase Firestore, Gemini 3 Flash Vision, jsPDF, Leaflet/OpenStreetMap
- **Auth** : JWT (Custom) avec bcrypt

## Fonctionnalités Implémentées

### Phase 1 - MVP (DONE)
- [x] Auth multi-rôle (Admin, Driver, Client) + JWT
- [x] Dashboards Admin/Driver/Client
- [x] Firebase Firestore (sync missions)

### Phase 2 - Monétisation (DONE)
- [x] 3 plans (Solo 49€, Croissance 199€, Flotte Pro 499€)
- [x] Gating complet (badge, locks, toasts, overlay)

### Phase 3 - IA Anti-Litige (DONE)
- [x] Gemini 3 Flash Vision (sévérité, description FR, confiance)
- [x] Preprocessing images + messages d'erreur propres + bouton Relancer

### Phase 4 - Génération PDF (DONE)
- [x] jsPDF : logo TP, facture complète, tampon PAYÉ, bouton individuel/lot

### Phase 5 - Suivi Live GPS (DONE - 10 Avril 2026)
- [x] Leaflet + OpenStreetMap CartoDB dark tiles (gratuit, pas de clé API)
- [x] Driver : envoi GPS auto toutes les 60s via Firestore quand livraison en cours
- [x] Admin : onglet "Carte Live" avec marqueurs camion animés, popups, sidebar chauffeurs
- [x] Stats : En ligne / Hors ligne / Positions connues
- [x] Empty state : "Aucune position active"
- [x] CSS dark filter : carte noire et bleue aux couleurs Transporter-Pro
- [x] Gating : Solo verrouillé, Croissance+ débloqué
- [x] Quick action "Carte GPS" navigue vers Carte Live

## Backlog P1
- [ ] Corriger règles sécurité Firebase (voir /app/memory/FIREBASE_RULES.md)

## Backlog P2
- [ ] Mode hors-ligne (localStorage + file sync)
- [ ] Score éco-conduite & calcul CO2 réel

## Problèmes Connus
- Firestore writes échouent silencieusement (Permission Denied) - non-bloquant
- Blockchain timestamping MOCKÉ (SHA256)
