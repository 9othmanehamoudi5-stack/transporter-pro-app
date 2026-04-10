# Transporter-Pro - PRD (Product Requirements Document)

## Problème Original
Application SaaS logistique "Transporter-Pro" pour éliminer la friction administrative et maximiser la profitabilité des PME de transport.

## Architecture Technique
- **Frontend** : React + Tailwind CSS + shadcn/ui
- **Backend** : FastAPI + MongoDB (Motor)
- **Intégrations** : Firebase Firestore, Gemini 3 Flash Vision, jsPDF (Factur-X)
- **Auth** : JWT (Custom) avec bcrypt

## Fonctionnalités Implémentées

### Phase 1 - MVP (DONE)
- [x] Auth multi-rôle (Admin, Driver, Client) avec JWT
- [x] Dashboard Admin (stats, cash-flow, livraisons, litiges, éco-scores, chauffeurs)
- [x] Dashboard Driver (livraisons, photo, signature, éco-score)
- [x] Portail Client (suivi public)
- [x] Firebase Firestore intégration (sync missions)

### Phase 2 - Monétisation (DONE)
- [x] Page Abonnement (Solo/Duo 49€, Croissance 199€, Flotte Pro 499€)
- [x] Gating complet (badge, locks sidebar, toasts, overlay upgrade)

### Phase 3 - IA Anti-Litige (DONE)
- [x] Gemini 3 Flash Vision (sévérité, description FR, confiance IA)
- [x] Preprocessing images (max 1280px, JPEG)
- [x] Messages d'erreur propres + bouton "Relancer"
- [x] Overlay résultat IA côté Driver

### Phase 4 - Génération PDF Factur-X (DONE - 10 Avril 2026)
- [x] jsPDF + jspdf-autotable installés
- [x] PDF professionnel : logo TP, n° facture, montant HT/TVA/TTC, statut, tampon "PAYÉ"
- [x] Bouton "Générer e-CMR PDF" (factures non payées en lot)
- [x] Bouton "PDF" individuel par facture dans le tableau
- [x] Quick action "Générer e-CMR" dans Vue d'ensemble
- [x] Gating respecté (verrouillé pour plan Solo)

## Backlog P1 (Prioritaire)
- [ ] Corriger règles sécurité Firebase (voir /app/memory/FIREBASE_RULES.md)

## Backlog P2 (Futur)
- [ ] Mode hors-ligne (localStorage + file sync)
- [ ] Score éco-conduite & calcul CO2 (logique réelle)

## Problèmes Connus
- Firestore writes échouent silencieusement (Permission Denied)
- Blockchain timestamping est MOCKÉ (SHA256 hash)
