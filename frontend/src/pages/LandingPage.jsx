import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Shield, Truck, Leaf, ArrowRight, Eye, MapPin, Camera, FileText, Check, 
  ChevronRight, Zap, Clock, AlertTriangle, ChevronDown, Award, TrendingUp,
  CreditCard, Sparkles, Building2, Users, FileCheck, Smartphone, CheckCircle2, X
} from 'lucide-react';
import Footer from '../components/Footer';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeFaq, setActiveFaq] = useState(null);

  React.useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white selection:bg-[#0066FF]/30 font-sans">
      
      {/* 1. TOP BANNER REGLEMENTAIRE */}
      <div className="bg-gradient-to-r from-[#0066FF]/10 via-[#0066FF]/20 to-[#0066FF]/10 border-b border-[#0066FF]/20 text-center py-2 px-4 text-xs text-blue-300 fixed top-0 w-full z-[1000] backdrop-blur-md" data-testid="urgency-banner">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
          Conforme Loi Facturation Électronique & e-CMR 2026 : <strong className="text-white">Essai 30 jours gratuit sans engagement</strong>
        </span>
      </div>

      {/* 2. NAVIGATION GLOBALE */}
      <nav className="fixed top-[33px] w-full z-[999] border-b border-white/[0.06] bg-[#0A0A0B]/85 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[#0066FF] to-[#0040B0] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white font-mono">
              Transporter<span className="text-[#0066FF]">-Pro</span>
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-8 text-sm text-zinc-400 font-medium">
            <a href="#comparatif" className="hover:text-white transition-colors">Pourquoi nous ?</a>
            <a href="#solutions" className="hover:text-white transition-colors">Solutions TMS</a>
            <a href="#roi" className="hover:text-white transition-colors">Calculateur ROI</a>
            <a href="#tarifs" className="hover:text-white transition-colors">Tarifs transparents</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/login')} 
              className="text-sm text-zinc-300 hover:text-white transition-colors px-4 py-2 font-medium" 
              data-testid="nav-login-btn"
            >
              Connexion
            </button>
            <button 
              onClick={() => navigate('/register')} 
              className="text-sm font-semibold bg-[#0066FF] hover:bg-[#0052CC] text-white px-5 py-2.5 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/25 flex items-center gap-1.5" 
              data-testid="nav-cta-btn"
            >
              Essai gratuit
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* 3. HERO SECTION ULTRA-PERCUTANTE */}
      <section className="relative pt-[140px] pb-20 px-6 overflow-hidden" data-testid="hero-section">
        {/* Glows d'ambiance */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-[#0066FF]/10 rounded-full blur-[160px] pointer-events-none" />
        <div className="absolute top-60 right-10 w-[350px] h-[350px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center relative">
          
          {/* Colonne gauche (Texte + CTA) */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/5 text-xs text-blue-400 mb-6 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              Le TMS nouvelle génération pour Artisans & PME du Transport
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-black leading-[1.08] tracking-tight mb-6" data-testid="hero-h1">
              Gérez, facturez et protégez vos transports{' '}
              <span className="bg-gradient-to-r from-[#0066FF] via-[#38BDF8] to-[#10B981] bg-clip-text text-transparent">
                en toute simplicité.
              </span>
            </h1>

            <p className="text-lg text-zinc-300 max-w-2xl mb-8 leading-relaxed font-normal" data-testid="hero-subtitle">
              Oubliez les logiciels lourds et opaques d'ancienne génération. Transporter-Pro réunit en un seul outil : <strong className="text-white">e-CMR légale</strong>, <strong className="text-white">facturation en 30 sec</strong>, <strong className="text-white">IA anti-litige photos</strong> et <strong className="text-white">suivi GPS en direct</strong>.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-8">
              <button 
                onClick={() => navigate('/register')} 
                className="group flex items-center justify-center gap-2.5 bg-[#10B981] hover:bg-[#059669] text-white font-bold px-8 py-4 rounded-xl text-base transition-all hover:shadow-xl hover:shadow-emerald-500/25 hover:-translate-y-0.5" 
                data-testid="hero-cta-btn"
              >
                Démarrer l'essai gratuit (30 jours)
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button 
                onClick={() => document.getElementById('roi')?.scrollIntoView({ behavior: 'smooth' })} 
                className="flex items-center justify-center gap-2 text-sm text-zinc-300 hover:text-white transition-colors border border-white/[0.12] bg-white/[0.02] px-6 py-4 rounded-xl hover:border-white/25" 
                data-testid="hero-demo-btn"
              >
                <TrendingUp className="w-4 h-4 text-blue-400" />
                Calculer mes économies
              </button>
            </div>

            {/* Réassurances */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-zinc-400 font-medium">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#10B981]" /> Sans carte bancaire</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#10B981]" /> Prêt en 2 minutes chrono</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#10B981]" /> Conforme Loi Finances 2026</span>
            </div>
          </div>

          {/* Colonne droite (Mockup Dashboard Interactif 3D) */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl border border-[#27272A] bg-[#121214] p-5 shadow-2xl shadow-blue-500/10 backdrop-blur-xl">
              
              {/* Header fenêtre macOS style */}
              <div className="flex items-center justify-between border-b border-[#27272A] pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  <span className="text-xs text-zinc-400 font-mono ml-2">cockpit.transporter-pro.com</span>
                </div>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-semibold border border-emerald-500/20">
                  Temps réel
                </span>
              </div>

              {/* 3 KPIs de Trésorerie */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-[#0A0A0B] border border-[#27272A] rounded-xl p-3">
                  <p className="text-[10px] text-zinc-400 uppercase font-semibold">À Encaisser</p>
                  <p className="text-base font-bold text-[#0066FF] font-mono mt-0.5">14 250 €</p>
                  <p className="text-[9px] text-zinc-500">6 factures</p>
                </div>
                <div className="bg-[#0A0A0B] border border-[#27272A] rounded-xl p-3">
                  <p className="text-[10px] text-zinc-400 uppercase font-semibold">Encaissé</p>
                  <p className="text-base font-bold text-[#10B981] font-mono mt-0.5">32 800 €</p>
                  <p className="text-[9px] text-emerald-400 font-medium">↑ +18% ce mois</p>
                </div>
                <div className="bg-[#0A0A0B] border border-red-500/20 rounded-xl p-3">
                  <p className="text-[10px] text-red-400 uppercase font-semibold">En Retard</p>
                  <p className="text-base font-bold text-red-400 font-mono mt-0.5">2 100 €</p>
                  <p className="text-[9px] text-red-400/80">1 client relancé</p>
                </div>
              </div>

              {/* Liste d'ordres & livraisons */}
              <div className="bg-[#0A0A0B] border border-[#27272A] rounded-xl p-3 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-zinc-300">Ordres de transport récents</span>
                  <span className="text-[10px] text-zinc-500">Aujourd'hui</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs py-1.5 border-b border-white/[0.04]">
                    <div>
                      <p className="font-medium text-white">Paris → Lyon (24t)</p>
                      <p className="text-[10px] text-zinc-500">Chauffeur : Karim M. • Camion #04</p>
                    </div>
                    <span className="text-[10px] font-semibold bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full">
                      En route (GPS)
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs py-1.5 border-b border-white/[0.04]">
                    <div>
                      <p className="font-medium text-white">Lille → Bruxelles</p>
                      <p className="text-[10px] text-zinc-500">Factur-X #2026-089 générée</p>
                    </div>
                    <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">
                      e-CMR Signée ✓
                    </span>
                  </div>
                </div>
              </div>

              {/* Badge Flottant IA Protection */}
              <div className="bg-gradient-to-r from-[#0066FF]/10 to-[#10B981]/10 border border-[#0066FF]/30 rounded-xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#0066FF] flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-white">Bouclier IA Anti-Litige</p>
                  <p className="text-zinc-400 text-[11px]">Photo certifiée au départ : 0 réclamation abusive.</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 4. BANDEAU DE CHIFFRES CLÉS */}
      <section className="border-y border-white/[0.06] bg-[#121214]/50 py-10 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-3xl sm:text-4xl font-black font-mono text-[#10B981]">30 jours</p>
            <p className="text-xs uppercase tracking-wider text-zinc-400 mt-1 font-semibold">Essai gratuit sans CB</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-black font-mono text-white">&lt; 30 sec</p>
            <p className="text-xs uppercase tracking-wider text-zinc-400 mt-1 font-semibold">Pour éditer une facture</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-black font-mono text-[#0066FF]">-80%</p>
            <p className="text-xs uppercase tracking-wider text-zinc-400 mt-1 font-semibold">De litiges grâce à l'IA</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-black font-mono text-white">100%</p>
            <p className="text-xs uppercase tracking-wider text-zinc-400 mt-1 font-semibold">Conforme e-CMR & Loi 2026</p>
          </div>
        </div>
      </section>

      {/* 5. TABLEAU COMPARATIF : TRANSPORTER-PRO VS ANCIENS TMS (AKANEA, DASHDOC...) */}
      <section id="comparatif" className="py-24 px-6 relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs uppercase tracking-[0.2em] text-[#0066FF] font-bold">Comparatif direct</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-2 mb-4">
              Pourquoi les transporteurs quittent les anciens TMS ?
            </h2>
            <p className="text-zinc-400 text-sm max-w-xl mx-auto">
              Les solutions traditionnelles (comme Akanea ou les ERP lourds) ont été pensées dans les années 2000. Voici la différence avec Transporter-Pro.
            </p>
          </div>

          <div className="rounded-2xl border border-[#27272A] bg-[#121214] overflow-hidden shadow-2xl">
            <div className="grid grid-cols-12 bg-[#1A1A1E] p-4 text-xs font-bold text-zinc-300 border-b border-[#27272A] uppercase tracking-wider">
              <div className="col-span-5 sm:col-span-4">Critère</div>
              <div className="col-span-3 sm:col-span-4 text-center text-zinc-400">TMS Traditionnels (Akanea, etc.)</div>
              <div className="col-span-4 sm:col-span-4 text-center text-[#10B981] font-bold">Transporter-Pro</div>
            </div>

            <div className="divide-y divide-[#27272A]/60 text-sm">
              <div className="grid grid-cols-12 p-4 items-center hover:bg-white/[0.01]">
                <div className="col-span-5 sm:col-span-4 font-medium text-white">Tarifs & Prix</div>
                <div className="col-span-3 sm:col-span-4 text-center text-zinc-400 text-xs">Opaque (sur devis, engagement 3 ans)</div>
                <div className="col-span-4 sm:col-span-4 text-center text-emerald-400 font-semibold text-xs bg-emerald-500/5 py-1 rounded-lg">Transparent dès 79€/m (Sans engagement)</div>
              </div>

              <div className="grid grid-cols-12 p-4 items-center hover:bg-white/[0.01]">
                <div className="col-span-5 sm:col-span-4 font-medium text-white">Mise en place</div>
                <div className="col-span-3 sm:col-span-4 text-center text-zinc-400 text-xs">3 à 6 semaines de formation payante</div>
                <div className="col-span-4 sm:col-span-4 text-center text-emerald-400 font-semibold text-xs bg-emerald-500/5 py-1 rounded-lg">Prêt en 2 minutes chrono</div>
              </div>

              <div className="grid grid-cols-12 p-4 items-center hover:bg-white/[0.01]">
                <div className="col-span-5 sm:col-span-4 font-medium text-white">IA Anti-Litige Photos</div>
                <div className="col-span-3 sm:col-span-4 text-center text-red-400 text-xs flex items-center justify-center gap-1"><X className="w-3.5 h-3.5" /> Aucune</div>
                <div className="col-span-4 sm:col-span-4 text-center text-emerald-400 font-semibold text-xs bg-emerald-500/5 py-1 rounded-lg flex items-center justify-center gap-1"><Check className="w-3.5 h-3.5" /> Gemini Vision intégrée</div>
              </div>

              <div className="grid grid-cols-12 p-4 items-center hover:bg-white/[0.01]">
                <div className="col-span-5 sm:col-span-4 font-medium text-white">Facturation & TVA Intra</div>
                <div className="col-span-3 sm:col-span-4 text-center text-zinc-400 text-xs">Complexe, modules payants séparés</div>
                <div className="col-span-4 sm:col-span-4 text-center text-emerald-400 font-semibold text-xs bg-emerald-500/5 py-1 rounded-lg">Automatisée en Factur-X & multi-pays</div>
              </div>

              <div className="grid grid-cols-12 p-4 items-center hover:bg-white/[0.01]">
                <div className="col-span-5 sm:col-span-4 font-medium text-white">Suivi GPS Chauffeurs & Clients</div>
                <div className="col-span-3 sm:col-span-4 text-center text-zinc-400 text-xs">Boîtiers matériels coûteux</div>
                <div className="col-span-4 sm:col-span-4 text-center text-emerald-400 font-semibold text-xs bg-emerald-500/5 py-1 rounded-lg">Directement via smartphone</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. LES 4 PILIERS DE TRANSPORTER-PRO (SOLUTIONS TMS) */}
      <section id="solutions" className="py-24 px-6 border-t border-white/[0.06] bg-[#0A0A0B]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs uppercase tracking-[0.2em] text-[#0066FF] font-bold">Tout-en-un</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-2 mb-4">
              4 modules intégrés pour piloter votre transport
            </h2>
            <p className="text-zinc-400 text-sm max-w-xl mx-auto">
              Plus besoin de payer 4 abonnements différents. Transporter-Pro centralise tout dans une interface fluide.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Module 1 : Facturation & Trésorerie */}
            <div className="bg-[#121214] border border-[#27272A] hover:border-[#0066FF]/40 rounded-2xl p-8 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-[#0066FF] mb-6">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Facturation Électronique & Relances</h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                Générez des factures conformes Factur-X en 3 clics avec calcul automatique de TVA intra. Relancez automatiquement les factures impayées à J+7, J+15 et J+30.
              </p>
              <ul className="space-y-2.5 text-xs text-zinc-300 font-medium">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> Auto-complétion SIRET via INSEE Sirene</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> Tableau de bord de trésorerie en temps réel</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> Export comptable en 1 clic</li>
              </ul>
            </div>

            {/* Module 2 : e-CMR & Ordres de transport */}
            <div className="bg-[#121214] border border-[#27272A] hover:border-emerald-500/40 rounded-2xl p-8 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-[#10B981] mb-6">
                <FileCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">e-CMR & Lettres de Voiture Numériques</h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                Supprimez le papier. Vos chauffeurs créent, signent et partagent la e-CMR directement depuis leur téléphone. Signature électronique horodatée et archivage sécurisé.
              </p>
              <ul className="space-y-2.5 text-xs text-zinc-300 font-medium">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> Signature tactile sur écran smartphone</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> Téléchargement immédiat en PDF certifié</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> 100% conforme à la réglementation européenne</li>
              </ul>
            </div>

            {/* Module 3 : IA Anti-Litige Gemini Vision */}
            <div className="bg-[#121214] border border-[#27272A] hover:border-purple-500/40 rounded-2xl p-8 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Bouclier IA Anti-Litige Photos</h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                Le chauffeur prend une photo du colis au départ. L'intelligence artificielle Gemini analyse les anomalies, horodate la preuve et dégage votre responsabilité en cas de casse à l'arrivée.
              </p>
              <ul className="space-y-2.5 text-xs text-zinc-300 font-medium">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> Analyse de sévérité des dommages en 3 secondes</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> Rapport de preuve infalsifiable pour les assureurs</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> Réduction de 80% des pertes financières liées aux litiges</li>
              </ul>
            </div>

            {/* Module 4 : GPS Live & Portail Client */}
            <div className="bg-[#121214] border border-[#27272A] hover:border-amber-500/40 rounded-2xl p-8 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-6">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Suivi GPS & Portail Client Autonome</h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                Partagez un lien de tracking en direct à vos clients sans création de compte. Ils suivent leur livraison sur la carte en temps réel et arrêtent de vous saturer d'appels.
              </p>
              <ul className="space-y-2.5 text-xs text-zinc-300 font-medium">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> Lien public de tracking sécurisé sans mot de passe</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> Optimisation des tournées pour économiser 15% de carburant</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> Éco-score de conduite pour vos chauffeurs</li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* 7. CALCULATEUR DE ROI INTERACTIF */}
      <section id="roi" className="py-24 px-6 border-t border-white/[0.06] bg-[#121214]/30">
        <ROICalculator onNavigate={navigate} />
      </section>

      {/* 8. GRILLE TARIFAIRE TRANSPARENTE */}
      <section id="tarifs" className="py-24 px-6 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs uppercase tracking-[0.2em] text-[#10B981] font-bold">Aucun frais caché</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-2 mb-4">
              Des tarifs clairs et sans engagement
            </h2>
            <p className="text-zinc-400 text-sm max-w-lg mx-auto">
              Tous nos forfaits incluent 30 jours d'essai gratuit. Changez ou résiliez en 1 clic.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-stretch">
            
            {/* Plan Starter */}
            <div className="bg-[#121214] border border-[#27272A] rounded-2xl p-8 flex flex-col justify-between hover:border-zinc-500/50 transition-all">
              <div>
                <div className="inline-block px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 text-xs font-semibold mb-4">
                  STARTER
                </div>
                <h3 className="text-xl font-bold text-white">Artisans & 1-3 Camions</h3>
                <p className="text-xs text-zinc-400 mt-2">Pour démarrer proprement sans prise de tête.</p>
                <div className="my-6">
                  <span className="text-4xl font-black font-mono text-white">79 €</span>
                  <span className="text-zinc-400 text-xs"> / mois</span>
                  <p className="text-[11px] text-emerald-400 mt-1">ou 759 €/an (~63 €/mois)</p>
                </div>
                <ul className="space-y-3 text-xs text-zinc-300 font-medium mb-8">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> Jusqu'à 3 chauffeurs / camions</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> Facturation Factur-X illimitée</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> e-CMR électronique avec signature</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> Suivi des statuts de livraison</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> Support réactif par email 7j/7</li>
                </ul>
              </div>
              <button 
                onClick={() => navigate('/register')} 
                className="w-full py-3.5 rounded-xl border border-white/20 hover:bg-white/10 text-white font-semibold text-sm transition-all"
              >
                Démarrer l'essai gratuit
              </button>
            </div>

            {/* Plan PME (Recommandé) */}
            <div className="bg-[#121214] border-2 border-[#0066FF] rounded-2xl p-8 flex flex-col justify-between relative shadow-2xl shadow-blue-500/10 scale-105">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#0066FF] text-white text-[11px] uppercase tracking-wider font-bold px-4 py-1 rounded-full shadow-md">
                Le choix des PME
              </div>
              <div>
                <div className="inline-block px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold mb-4">
                  PME CROISSANCE
                </div>
                <h3 className="text-xl font-bold text-white">Flottes 4 à 15 Camions</h3>
                <p className="text-xs text-zinc-400 mt-2">La solution complète avec IA Anti-Litige.</p>
                <div className="my-6">
                  <span className="text-4xl font-black font-mono text-white">249 €</span>
                  <span className="text-zinc-400 text-xs"> / mois</span>
                  <p className="text-[11px] text-emerald-400 mt-1">ou 2 390 €/an (~199 €/mois)</p>
                </div>
                <ul className="space-y-3 text-xs text-zinc-200 font-medium mb-8">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> <strong>Jusqu'à 15 chauffeurs</strong></li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> <strong>Bouclier IA Gemini Anti-Litige</strong></li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> <strong>GPS Live + Optimisation Tournées</strong></li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> Éco-Score Chauffeurs (-15% carburant)</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> Portail de suivi client autonome</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> Support prioritaire téléphonique</li>
                </ul>
              </div>
              <button 
                onClick={() => navigate('/register')} 
                className="w-full py-4 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold text-sm transition-all shadow-lg shadow-blue-500/25"
              >
                Démarrer l'essai gratuit — 30 jours
              </button>
            </div>

            {/* Plan Flotte */}
            <div className="bg-[#121214] border border-[#27272A] rounded-2xl p-8 flex flex-col justify-between hover:border-zinc-500/50 transition-all">
              <div>
                <div className="inline-block px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 text-xs font-semibold mb-4">
                  FLOTTE PRO
                </div>
                <h3 className="text-xl font-bold text-white">Grandes Flottes (15+)</h3>
                <p className="text-xs text-zinc-400 mt-2">Puissance maximale sans aucune limite.</p>
                <div className="my-6">
                  <span className="text-4xl font-black font-mono text-white">690 €</span>
                  <span className="text-zinc-400 text-xs"> / mois</span>
                  <p className="text-[11px] text-emerald-400 mt-1">ou 6 624 €/an (~552 €/mois)</p>
                </div>
                <ul className="space-y-3 text-xs text-zinc-300 font-medium mb-8">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> <strong>Chauffeurs & camions illimités</strong></li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> Toutes les fonctionnalités PME</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> Accès API dédié pour votre ERP</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> Accompagnement & onboarding personnalisé</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> Account Manager dédié</li>
                </ul>
              </div>
              <button 
                onClick={() => navigate('/register')} 
                className="w-full py-3.5 rounded-xl border border-white/20 hover:bg-white/10 text-white font-semibold text-sm transition-all"
              >
                Démarrer l'essai gratuit
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* 9. FAQ DIRECTE & SEO IA */}
      <section id="faq" className="py-24 px-6 border-t border-white/[0.06] bg-[#121214]/40">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs uppercase tracking-[0.2em] text-[#0066FF] font-bold">Réponses claires</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-2 mb-4">
              Questions Fréquentes
            </h2>
            <p className="text-zinc-400 text-sm">
              Tout ce que vous devez savoir avant de tester Transporter-Pro.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Quel est le prix de Transporter-Pro pour une entreprise de transport ?",
                a: "Le prix de Transporter-Pro débute à 79 € par mois pour le forfait STARTER (jusqu'à 3 camions). Le forfait PME est à 249 € par mois (jusqu'à 15 camions) et le forfait FLOTTE est à 690 € par mois (camions illimités). Tous les plans incluent un essai gratuit de 30 jours sans engagement."
              },
              {
                q: "Comment fonctionne l'IA Anti-Litige sur les photos de colis ?",
                a: "Le chauffeur prend une photo du colis lors du chargement. L'IA Gemini Vision analyse instantanément l'état de la marchandise, certifie l'intégrité du colis avec un horodatage et géolocalisation. En cas de réclamation du destinataire à l'arrivée, vous disposez d'un rapport de preuve juridique immédiat."
              },
              {
                q: "Est-ce difficile de remplacer mon ancien logiciel ou mes fichiers Excel ?",
                a: "Non, Transporter-Pro est conçu pour être pris en main en moins de 2 minutes sans aucune formation préalable. L'auto-complétion des entreprises via l'API INSEE Sirene permet de créer vos clients et factures instantanément."
              },
              {
                q: "Le logiciel est-il conforme à la loi sur la facturation électronique 2026 ?",
                a: "Oui, Transporter-Pro génère des factures au format hybride Factur-X conformes aux exigences de l'administration fiscale française et gère automatiquement la TVA intracommunautaire pour vos transports en Europe."
              }
            ].map((faq, idx) => (
              <div 
                key={idx} 
                className="bg-[#121214] border border-[#27272A] rounded-xl overflow-hidden transition-colors"
              >
                <button 
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full text-left p-5 flex items-center justify-between font-semibold text-sm text-white hover:text-blue-400 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${activeFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                {activeFaq === idx && (
                  <div className="p-5 pt-0 text-xs sm:text-sm text-zinc-400 leading-relaxed border-t border-[#27272A]/50">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. CTA FINAL BANNER */}
      <section className="py-20 px-6 border-t border-white/[0.06] bg-gradient-to-b from-[#0A0A0B] to-[#0066FF]/10 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            Rejoignez la nouvelle génération de transporteurs routiers.
          </h2>
          <p className="text-zinc-400 text-sm mb-8">
            Testez gratuitement pendant 30 jours. Aucune carte bancaire requise. Vos premiers ordres de transport créés en 2 minutes.
          </p>
          <button 
            onClick={() => navigate('/register')} 
            className="inline-flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white font-bold px-9 py-4 rounded-xl text-base transition-all hover:shadow-2xl hover:shadow-emerald-500/30"
          >
            Commencer mon essai gratuit maintenant
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* 11. FOOTER */}
      <Footer />

    </div>
  );
};

/* --- CALCULATEUR DE RENTABILITE (ROI) --- */
const ROICalculator = ({ onNavigate }) => {
  const [trucks, setTrucks] = useState(5);
  const [litiges, setLitiges] = useState(3);
  const [costPerLitige, setCostPerLitige] = useState(450);

  const pertesLitiges = litiges * costPerLitige;
  const pertesCarburant = trucks * 60;
  const totalPertes = pertesLitiges + pertesCarburant;
  const economiesLitiges = Math.round(pertesLitiges * 0.8);
  const economiesCarburant = pertesCarburant;
  const totalEconomies = economiesLitiges + economiesCarburant;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <span className="text-xs uppercase tracking-[0.2em] text-emerald-400 font-bold">Simulateur d'économies</span>
        <h2 className="text-3xl sm:text-4xl font-black text-white mt-2 mb-3">
          Combien d'argent perdez-vous chaque mois ?
        </h2>
        <p className="text-zinc-400 text-sm max-w-lg mx-auto">
          Ajustez les curseurs pour calculer ce que Transporter-Pro vous fait économiser sur le carburant et les litiges.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6 bg-[#121214] border border-[#27272A] rounded-2xl p-6">
          <SliderInput
            label="Nombre de camions dans votre flotte"
            value={trucks}
            onChange={setTrucks}
            min={1} max={30} step={1}
            unit="camions"
            testId="slider-trucks"
          />
          <SliderInput
            label="Litiges ou réclamations par mois"
            value={litiges}
            onChange={setLitiges}
            min={0} max={15} step={1}
            unit="litiges"
            testId="slider-litiges"
          />
          <SliderInput
            label="Coût moyen d'un litige / colis cassé"
            value={costPerLitige}
            onChange={setCostPerLitige}
            min={100} max={1500} step={50}
            unit="€"
            testId="slider-cost"
          />
        </div>

        <div className="space-y-4">
          <div className="bg-red-500/[0.05] border border-red-500/20 rounded-2xl p-5">
            <p className="text-xs font-bold uppercase text-red-400 tracking-wider mb-2">Pertes estimées sans Transporter-Pro</p>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-zinc-400">Litiges + carburant gaspillé</span>
              <span className="text-2xl font-black font-mono text-red-400">-{totalPertes.toLocaleString('fr-FR')} € / mois</span>
            </div>
          </div>

          <div className="bg-emerald-500/[0.05] border border-emerald-500/20 rounded-2xl p-5">
            <p className="text-xs font-bold uppercase text-emerald-400 tracking-wider mb-2">Gains garantis avec Transporter-Pro</p>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-zinc-400">Pertes évitées via IA & Éco-Score</span>
              <span className="text-2xl font-black font-mono text-[#10B981]">+{totalEconomies.toLocaleString('fr-FR')} € / mois</span>
            </div>
          </div>

          <div className="bg-[#0066FF]/10 border border-[#0066FF]/30 rounded-2xl p-4 text-center">
            <p className="text-xs text-blue-200 font-medium mb-3">
              Votre investissement logiciel est rentabilisé dès la première semaine.
            </p>
            <button 
              onClick={() => onNavigate('/register')}
              className="w-full py-3 bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
            >
              Récupérer mes économies maintenant →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SliderInput = ({ label, value, onChange, min, max, step, unit, testId }) => {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex justify-between items-baseline mb-2">
        <label className="text-xs text-zinc-300 font-semibold">{label}</label>
        <span className="text-base font-bold font-mono text-white" data-testid={`${testId}-value`}>
          {value} <span className="text-xs text-zinc-500 font-normal">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-[#27272A] accent-[#0066FF]"
        data-testid={testId}
      />
      <div className="flex justify-between mt-1 text-[10px] text-zinc-500">
        <span>{min} {unit}</span>
        <span>{max} {unit}</span>
      </div>
    </div>
  );
};

export default LandingPage;
