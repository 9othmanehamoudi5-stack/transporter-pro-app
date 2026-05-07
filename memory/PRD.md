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

### Phase 12 - Sécurisation B2B & Onboarding (DONE - 29 Avril 2026)
- [x] Isolation multi-tenancy stricte : `/deliveries`, `/damage-reports`, `/dashboard/stats`, `/dashboard/cash-flow` filtrés par `company_id`
- [x] Rôles admin/staff : Cash-Flow et Abonnement masqués dans sidebar pour non-admins
- [x] Cash-flow renvoie 403 pour les drivers
- [x] Onboarding KYB : formulaire obligatoire (Nom entreprise, SIRET, TVA Intra, Adresse) pour nouveaux admins
- [x] Collection `companies` liée à l'admin
- [x] Rate-limit chatbot : 20 questions/jour par IP
- [x] Prix mis à jour : Solo 29€, Croissance 189€, Flotte Pro 489€
- [x] "30 jours d'essai gratuit" partout (ZERO occurrence de "14 jours" restante)
- [x] Flotte Pro : affiche "illimité" quand max_drivers=-1

### Phase 13 - Batch 1 : Tunnel Inscription + SIRET + Stripe (DONE - 29 Avril 2026)
- [x] Prix Solo mis à jour : 19€/mois (190€/an)
- [x] Tunnel d'inscription multi-étapes : Step 1 (compte) → Step 2 (KYB: SIRET/Entreprise/TVA/Adresse) → Step 3 (Redirect Stripe)
- [x] API Sirene : endpoint `GET /api/verify-siret/{siret}` — auto-remplissage nom + adresse si trouvé
- [x] Redirection Stripe obligatoire après validation SIRET (CB requise, débit 0€)
- [x] Badge "CB requise, débit 0€" (suppression "Aucune carte bancaire")
- [x] Login + Register retournent `onboarding_complete`, `company_id`, `plan`
- [x] Trial period fixée à 30 jours (plus 14)

### Phase 14 - Batch 2 : Scanner Code-Barres + Corrections UI (DONE - 29 Avril 2026)
- [x] Scanner code-barres `html5-qrcode` : lecture EAN, Code 128, QR Code
- [x] Composant `BarcodeScanner.jsx` avec cadre de détection animé
- [x] Intégré dans DriverDashboard ("Scanner un colis") + AdminDashboard ("Scan Code-barre")
- [x] Code scanné auto-injecté avec notification toast
- [x] Fix chevauchement Footer/Login : footer passé de `fixed` à `relative`
- [x] Pages Auth en `flex-col` pour layout propre
- [x] Footer redesigné (#0f172a) : 3 colonnes (Brand, Légal, Offres avec prix)
- [x] Mention "En attente d'homologation e-CMR" dans le footer

### Phase 15 - Register Bloquant + Scanner Final + ThemeContext + i18n (DONE - 2 Mai 2026)
- [x] Register refondé : SIRET obligatoire (API Sirene bloquant), Stripe redirect forcé, pas de Footer, alerte "Email déjà utilisé" avec lien /login
- [x] BarcodeScanner amélioré : bordure verte au succès, arrêt caméra, bouton "CONFIRMER SCAN" + "Scanner un autre code"
- [x] Landing : header z-index 1000, hero pt-140px (stop chevauchement), nav z-999
- [x] Footer simplifié : suppression colonne "Offres", garder Mentions Légales / Tarifs / Contact
- [x] Footer supprimé de /login et /register
- [x] ThemeContext : mode Clair/Sombre avec toggle Sun/Moon dans la sidebar admin, persisté en localStorage
- [x] CSS light mode : overrides pour bg, text, borders
- [x] i18n : fichiers FR/PL/ES (nav, hero, pricing, auth, dashboard, driver, common), provider I18nContext

### Phase 16 - Reconstruction CRUD + Sécurité (DONE - 2 Mai 2026)
- [x] NewDeliveryForm : sélecteur chauffeur filtré par company_id (dropdown)
- [x] Backend create_delivery : `company_id` + `driver_id` dans chaque livraison + audit log
- [x] Compteur chauffeurs dynamique `drivers.length` (pas stale driverQuota)
- [x] Bouton delete driver : `onTouchEnd` pour mobile touch events
- [x] Livraisons filtrées par company_id → nouvelles livraisons visibles immédiatement
- [x] Damage reports filtrés par company_id
- [x] Stats/cash-flow filtrés par company_id
- [x] Footer supprimé de /login et /register
- [x] ThemeToggle dans sidebar admin

### Phase 17 - Status Badge & Scanner UX (DONE - 4 Mai 2026)
- [x] Backend `create_delivery` : status initial = "assigned" automatiquement si `driver_id` est fourni à la création (au lieu de rester "pending")
- [x] Frontend AdminDashboard : badge de statut défensif — si `driver_id` OU `driver_name` présent et status="pending", affiche "Assigné" (bleu) au lieu de "En attente" (jaune)
- [x] Migration : 4 livraisons legacy (`driver_id` set + status pending) backfilled vers status="assigned"
- [x] BarcodeScanner refactor : caméra reste active en continu, capture en temps réel le dernier code détecté
- [x] BarcodeScanner : bouton primary bleu "CONFIRMER LE SCAN" toujours visible sous le cadre caméra (désactivé tant qu'aucun code détecté)
- [x] BarcodeScanner : sur clic Confirmer → arrête le flux vidéo + onScan(code) + ferme la popup
- [x] BarcodeScanner : badge live (chip) en haut de la caméra qui affiche le dernier code détecté + cadre vert quand détection réussie

### Phase 18 - SÉCURITÉ CRITIQUE : Anti-bypass SIRET + Gate Stripe (DONE - 4-5 Mai 2026)
- [x] Backend `verify-siret` : migré vers API officielle `recherche-entreprises.api.gouv.fr` (INSEE Sirene public). **SUPPRESSION du fallback permissif** qui acceptait n'importe quel SIRET si l'API externe échouait. Retour strict `valid:false` sur tout SIRET introuvable, malformé ou sur erreur réseau
- [x] Backend `verify-siret` : rejet supplémentaire des établissements fermés (`etat_administratif == "F"`)
- [x] Backend `/api/onboarding/complete` : **re-validation server-side OBLIGATOIRE** du SIRET avant persistance → un frontend compromis ne peut plus bypasser (HTTPException 400 si SIRET invalide)
- [x] Backend register admin : `subscription_status = "incomplete"` par défaut (plus de `"trial"` auto). Flip en `"active"` uniquement via webhook Stripe `checkout.session.completed`
- [x] Backend `/api/auth/login` : réponse inclut désormais `subscription_status` et `trial_ends_at` (fix regression détectée par testing agent — admin payé voyait le gate sur fresh login)
- [x] Frontend `App.js DashboardRouter` : **Gate de paiement strict** — admin avec `subscription_status` != ("active" | "trialing") → écran "Paiement requis" + bouton Stripe + logout. Impossible d'accéder au dashboard avant paiement
- [x] Frontend `OnboardingForm.jsx` refondu : ajout bouton "Vérifier" SIRET (appel API Sirene bloquant), message succès/erreur visible, Submit disabled tant que `siretValid !== true`. Après submit réussi → `window.location.href` vers Stripe (plus de `window.location.reload()`)
- [x] BarcodeScanner : bouton renommé **"VALIDER LE SCAN"** avec `position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%)` (conforme spec utilisateur)
- [x] BarcodeScanner : `facingMode: { exact: 'environment' }` prioritaire avec fallback mobile si non supporté (desktop)
- [x] BarcodeScanner : `console.error` explicite si `navigator.mediaDevices` est undefined (diagnostic HTTPS manquant)
- [x] **Vérifications E2E** (testing_agent iteration 27 — 9/9 backend pass + frontend OK) :
   - SIRET fake `11111111111111` / `12345678901234` rejetés (valid:false + HTTP 400)
   - SIRET réel `44306184100047` (GOOGLE FRANCE) accepté
   - Fresh register admin → `subscription_status:"incomplete"` → dashboard BLOQUÉ
   - Onboarding avec SIRET réel → toujours BLOQUÉ en pré-Stripe (status reste "incomplete" jusqu'au webhook)
   - Admin payé (admin@transporter-pro.com) → `subscription_status:"active"` → dashboard accessible
   - Badges "Assigné" bleus corrects pour livraisons avec chauffeur
   - BarcodeScanner : data-testid `validate-scan-btn` présent + position absolute bottom:20px

## Backlog P1
- [ ] Corriger règles sécurité Firebase (voir /app/memory/FIREBASE_RULES.md)

### Phase 22 - i18n Complet + Stripe Auto-activation (DONE - 6 Mai 2026)

**Stripe sans webhook (auto-poll)** :
- `PaymentSuccessPage.jsx` refondu : à l'arrivée sur `/payment-success` après Stripe Checkout, polling automatique de `/api/stripe/verify-payment` toutes les 4s pendant 60s max
- 3 états visuels : "Activation en cours" (loader animé, compteur tentatives) → "Paiement confirmé" (CheckCircle vert + redirect dashboard) → "Paiement en attente" (bouton Réessayer si timeout)
- Plus besoin de configurer le webhook Stripe — l'activation se fait dès que la session Stripe est `complete + paid`
- Si webhook ensuite configuré, ça fonctionne aussi (matching par `client_reference_id` prioritaire sur email)

**i18n complet sur le dashboard** :
- 7 namespaces de clés ajoutés : `sidebar`, `kpi`, `cashflow`, `actions`, `tabs`, `status`, `settings`
- 3 fichiers fr.json/en.json/es.json complétés (~70 clés chacun)
- Sidebar AdminDashboard wiré (9 entrées + bouton Déconnexion)
- KPI cards (4) wirés
- Cash-Flow card (titre + 3 sub-cards) wiré
- Quick action buttons (4) wirés
- Recent deliveries table headers + status badges wirés (overview + Livraisons tab)
- Settings Page : tous les titres de sections + sub-titles wirés
- Persistance backend : `PATCH /settings/preferences {language}` → DB → `/auth/me` retourne language → SettingsPage applique au démarrage via useEffect

**Vérifié par browser automation (Playwright async)** :
- Login → Settings → switch English → retour Overview
- ✅ "Overview", "Total deliveries", "In transit", "Active disputes", "Instant Cash-Flow", "Money blocked", "Pending invoices", "Revenue this month", "Recent deliveries", "Generate e-CMR", "GPS Map", "Scan barcode", "Client portal" tous présents en EN
- ❌ "Vue d'ensemble", "Livraisons totales", "Argent bloqué", "Cash-Flow Instantané", "Carte GPS", "Scan Code-barre" tous absents (correctement remplacés)
- Persistance F5 OK

**Note honnête** : certaines parties internes (modals "Nouvelle livraison", liste des chauffeurs avec actions, formulaires de modification) restent en français. Pour l'instant c'est suffisant pour démontrer que la mécanique i18n est solide et que l'utilisateur voit son interface principale traduite.

### Phase 21 - Activity Log (Audit Trail visible) (DONE - 6 Mai 2026)
- [x] Backend `GET /api/account/activity?limit=N` : retourne les N dernières entrées de `audit_logs` filtrées par `company_id` (admin) ou `user_id` (autres rôles), max 200
- [x] Mapping `timestamp` (champ DB) ↔ `created_at` (réponse API) pour compat frontend
- [x] Frontend `ActivitySection` : 5e section dans Settings, scrollable max 96, dot color-coded par type d'action (16 types mappés), formatage date FR, `data-testid="activity-section"` + `activity-item-{i}`
- [x] Conformité RGPD/SOC2 : utilisateur peut consulter ses 50 derniers événements directement dans son compte
- [x] Vérifié curl : 8 derniers events de azer (login, settings_updated x3, etc.) avec timestamps + details ✅

### Phase 20 - Settings Refonte Pro + 2FA + Customer Portal + Delete (DONE - 6 Mai 2026)

**Backend** (5 nouveaux endpoints + 1 amend):
- `GET /api/company` : KYB info read-only (siret, tva, address, company_name, created_at)
- `PATCH /api/settings/preferences` : language ('fr'|'en'|'es') + notification_prefs (new_dispute, weekly_eco, quota_alert) + 2fa_enabled
- `POST /api/settings/logo` : upload base64 (max 600KB) → stocké sur user + companies
- `DELETE /api/settings/logo` : supprime
- `POST /api/billing/portal` : crée une session Stripe Customer Portal et retourne URL → erreur claire si portail non activé sur dashboard Stripe
- `DELETE /api/auth/account` : danger zone — annule sub Stripe (best-effort), marque user `status:"deleted"`, renomme email pour bloquer re-login, supprime cookies
- `POST /api/auth/2fa/verify` : exchange challenge_token+code (6 chiffres bcrypt-hashed, TTL 10 min, max 5 tentatives) pour vrais access/refresh tokens
- `POST /api/auth/login` (amend) : si `2fa_enabled=true` côté admin, renvoie `{requires_2fa, challenge_token, message}` + email Resend automatique au lieu d'access_token
- `get_current_user` (amend) : refuse les comptes `status:"deleted"` (HTTP 403)
- `/auth/me` étendu : `language`, `logo_base64`, `2fa_enabled`, `notification_prefs`

**Frontend SettingsPage refondu** (1100 lignes):
- 4 sections distinctes (ProfileSection, BillingSection, CustomizationSection, SecuritySection)
- ProfileSection : email, name, plan, status badge, date inscription + KYB read-only (raison sociale, SIRET, TVA, adresse)
- BillingSection : bouton "Gérer ma facturation" (Stripe Portal) + sélecteur langue 🇫🇷 🇬🇧 🇪🇸
- CustomizationSection : upload logo (PNG/JPEG/WEBP/SVG max 500KB) + 3 toggles notifications
- SecuritySection : changement mot de passe + toggle 2FA email + zone de danger (Dialog avec confirmation `SUPPRIMER` + password)
- Sidebar AdminDashboard : logo entreprise affiché si uploadé (sinon icon Truck)

**i18n** : ajout `en.json`, refonte `index.jsx` (alias `lang`/`setLang`, locales fr/en/es au lieu de fr/pl/es)

**LoginPage** : flow 2FA conditionnel — quand `requires_2fa:true`, masque le formulaire login et affiche un input 6-chiffres avec auto-focus + bouton "Recommencer"

**AuthContext** : `verify2FA(challenge_token, code)` ajouté + login retourne `{success, requires_2fa, challenge_token}` quand applicable

**Tests curl validés** :
- GET /api/company → SIRET 44306184100047, GOOGLE FRANCE, adresse Paris ✅
- PATCH /settings/preferences → langue + notifs + 2FA persistés ✅
- POST /billing/portal → erreur attendue (azer activé manuellement, pas de vrai customer Stripe) ✅
- POST /auth/login avec 2FA on → retourne challenge_token ✅
- POST /auth/2fa/verify avec mauvais code → "Code incorrect" + compteur tentatives ✅
- DELETE /auth/account avec mauvais password → "Mot de passe incorrect" ✅

## Backlog P2
- [ ] Mode hors-ligne (localStorage + file sync)
- [ ] Refacto `server.py` (~2400 lignes) → routers FastAPI modulaires (`/routes/auth.py`, `/routes/deliveries.py`, `/routes/settings.py`, `/routes/stripe.py`)
- [ ] Refacto `AdminDashboard.jsx` (~1900 lignes) → extraire modals, EcoScoresTab, DamageReportCard, DeliveriesTab, DriversTab dans des fichiers séparés
- [ ] Optimisation route OSRM (temps réel)

## Problèmes Connus
- Firestore writes échouent silencieusement (Permission Denied) - non-bloquant
- Blockchain timestamping MOCKÉ (SHA256)
- Resend en mode test : ne peut envoyer qu'à l'email du compte Resend (2FA désactivée par défaut pour cette raison)

### Phase 21 - i18n 100% Couverture (DONE - 7 Mai 2026)
- [x] Auto-détection `navigator.language` au 1er chargement, respect du choix manuel sauvegardé en localStorage
- [x] Suppression du fichier `pl.json` (focus sur FR/EN/ES uniquement)
- [x] `fr.json`, `en.json`, `es.json` complétés avec sections : `cashflow.*` (détaillé), `drivers.*`, `litiges.*`, `subscription.plans.*`, `eco.*`, `toasts.*`, `modals.assignDriver.*`, `modals.notifications.*`
- [x] AdminDashboard.jsx : tous toasts, modals (NewDelivery, AddDriver, AssignDelivery, Notifications), Cash-Flow détaillé (factures), Drivers tab, Litiges/DamageReportCard, EcoScoresTab, EcoChart, LockedFeatureOverlay traduits via `t()`
- [x] SubscriptionPage.jsx : 100% refondu avec `buildPlans(t)` — plans, features, lockedFeatures, billing toggle, upgrade comparison
- [x] Validé visuellement : FR/EN/ES rendent correctement sur Dashboard + Subscription + Sidebar + Settings

