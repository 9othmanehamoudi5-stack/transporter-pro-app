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

### Phase 6 - Workflow Photo Simplifié (DONE - 11 Avril 2026)
- [x] Suppression complète de getUserMedia (plus de bugs "Caméra indisponible")
- [x] `<input type="file" capture="environment">` pour caméra native iPhone/Android
- [x] `<input type="file">` séparé pour galerie (sans capture)
- [x] Preview immédiate de la photo avec cadre bleu + tracking ID overlay
- [x] Bouton "Confirmer la photo" (bleu) → lance analyse IA Gemini → retour au rapport
- [x] Bouton "Changer de photo" pour reprendre
- [x] Compression/redimensionnement (max 1280px, JPEG 70%) avant envoi

### Phase 7 - Éco-scores Pro Mode (DONE - 11 Avril 2026)
- [x] Noms chauffeurs dans le tableau (lookup users collection via ObjectId)
- [x] Podium Top 3 de la semaine avec médailles or/argent/bronze
- [x] Graphique AreaChart recharts — évolution score moyen 30 jours
- [x] Calcul réel basé sur livraisons complétées, taux de dommages (Gemini), distance
- [x] Endpoint `/api/eco-scores/recalculate` pour recalculer à la demande
- [x] Endpoint `/api/eco-scores/daily-avg` pour historique 30j
- [x] Cards KPI : Score moyen entreprise, CO2 total, Distance totale
- [x] Bouton Exporter rapport

### Phase 8 - Landing Page & Architecture Multi-Tenancy (DONE - 12 Avril 2026)
- [x] Landing Page psychologique (route /) : fond OLED #000, H1 gradient, badge "14 jours essai gratuit"
- [x] Section "Douleur e-CMR" : H2 signature illisible, image camion, encart solution IA Gemini
- [x] Bento Grid Fonctionnalités : IA Anti-Litige (large), Tracking (small), Éco-Score (small), e-CMR (wide)
- [x] Grille tarifaire avec toggle Mensuel/Annuel (-20% + 2 mois offerts)
- [x] Plans corrigés : Solo 49€/mois ou 470€/an, Croissance 199€/mois ou 1 900€/an (badge "Le choix des leaders"), Flotte Pro 499€/mois ou 4 790€/an
- [x] Toggle Annuel affiche prix total/an + "Soit environ X€/mois"
- [x] Texte "pour votre pomme" remplacé par "perdus pour votre trésorerie"
- [x] Images haute qualité dark mode (camion nuit Unsplash, entrepôt logistique)
- [x] Hero split 2 colonnes avec image camion + badges flottants (IA Gemini, 3 camions en route)
- [x] CTA "Démarrer mon essai gratuit" + "Voir la démo"
- [x] Routage : si authentifié, `/` redirige vers `/dashboard`
- [x] Footer fixe (CGU, Confidentialité RGPD, Contact) sur `/` et `/login`
- [x] Pages légales `/cgu`, `/confidentialite`, `/contact` avec design dark
- [x] Multi-tenancy : `company_id` sur users, filtrage des requêtes drivers
- [x] Quotas flotte : Solo=3, Croissance=15, Flotte Pro=illimité
- [x] Barre de quota "Gestion de Flotte" avec progress bar et plan affiché
- [x] Inscription chauffeur publique BLOQUÉE (403) — création par admin uniquement
- [x] Register : choix "Transporteur" (admin) ou "Client" uniquement
- [x] Trial Logic : champ `trial_ends_at` + `subscription_status` dans /auth/me
- [x] Endpoint `/api/auth/company-quota` pour vérification quota

### Phase 9 - Méga-Build Phase 1 (DONE - 20 Avril 2026)
- [x] Prix Membres Fondateurs : Solo 39€, Croissance 189€, Flotte Pro 489€
- [x] Badge "Tarif privilégié avant homologation complète" (ambre)
- [x] Copywriting PAS : Litiges injustifiés (8% CA), Gasoil (15% budget), Amendes 50€/facture loi 2026
- [x] PWA : manifest.json + service-worker.js (installable, cache-first statique, network-first API)
- [x] Audit Logs : `log_action()` sur login, create_driver, update_delivery, damage_report, subscription
- [x] Endpoint `GET /api/audit-logs` (admin, filtré par company_id)
- [x] SEO : meta description, og:title, twitter:card, keywords transport
- [x] Apple PWA : apple-mobile-web-app-capable, apple-touch-icon
- [x] CGU §9 : Disclaimer e-CMR homologation (outil d'aide, pas lettre officielle)
- [x] CGU §10 : Audit et traçabilité (conservation 5 ans)

### Phase 10 - Calculateur ROI & Éléments de Réassurance (DONE - 21 Avril 2026)
- [x] Calculateur ROI interactif : 3 sliders (camions, litiges, coût moyen)
- [x] Pertes en rouge (litiges + carburant gaspillé) vs Économies en vert (80% IA + Éco-Score)
- [x] Phrase dynamique "Votre abonnement est rentabilisé dès le premier jour"
- [x] CTA "Arrêter de perdre de l'argent" → scroll vers tarifs
- [x] Bandeau : "Tarif Membres Fondateurs garanti jusqu'à l'homologation e-CMR"
- [x] Démo Vision IA : visuel simulé scan Gemini avec cadre détection + badge résultat
- [x] Badges de confiance : eFTI, GDPR, eIDAS
- [x] Chatbot Crisp remplacé par Transporter-Bot (IA Gemini) — chat interne, connaissance tarifs/loi 2026/éco-score
- [x] Endpoint `/api/chat` (Gemini 3 Flash, system prompt complet, public)
- [x] Toggle pricing "-17%" annuel, badge "Tarif garanti à vie pour les Membres Fondateurs"
- [x] Firebase Security Rules P1 mis à jour (FIREBASE_RULES.md) — cloisonnement companyId

### Phase 11 - Intégration Stripe (DONE - 21 Avril 2026)
- [x] Stripe Payment Links intégrés aux 6 boutons (3 plans x mensuel/annuel)
- [x] `?prefilled_email=` ajouté pour identifier l'utilisateur
- [x] Webhook `POST /api/webhook/stripe` : traite `checkout.session.completed`, met à jour plan + subscription_status
- [x] Page `/payment-success` avec toast "Période d'essai de 30 jours activée" + redirect auto vers dashboard
- [x] Endpoint `GET /api/stripe/payment-links` pour accès programmatique
- [x] Clés Stripe test dans `.env` (backend + frontend)

## Backlog P1
- [ ] Corriger règles sécurité Firebase (voir /app/memory/FIREBASE_RULES.md)

## Backlog P2
- [ ] Mode hors-ligne (localStorage + file sync)

## Problèmes Connus
- Firestore writes échouent silencieusement (Permission Denied) - non-bloquant
- Blockchain timestamping MOCKÉ (SHA256)
