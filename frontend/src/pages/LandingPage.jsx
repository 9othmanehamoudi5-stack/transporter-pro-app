import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Truck, Leaf, ArrowRight, Eye, MapPin, Camera, FileText, Check, ChevronRight } from 'lucide-react';
import Footer from '../components/Footer';

const IMG_TRUCK_NIGHT = 'https://images.unsplash.com/photo-1610793148376-2b2b64b1bbb6?w=800&q=80';
const IMG_WAREHOUSE = 'https://images.unsplash.com/photo-1694875522449-e852b63be76d?w=800&q=80';
const IMG_TRUCK_ROAD = 'https://images.unsplash.com/photo-1668532069532-5bf7b1708aa0?w=800&q=80';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  React.useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">
      {/* ─── URGENCY BANNER ─── */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 border-b border-amber-500/10 text-center py-2.5 text-xs text-amber-300 fixed top-0 w-full z-[60]" data-testid="urgency-banner">
        Offre Membres Fondateurs : <span className="font-bold text-amber-200">Tarif garanti jusqu'à l'homologation e-CMR</span>
      </div>

      {/* ─── NAV ─── */}
      <nav className="fixed top-[34px] w-full z-50 border-b border-white/[0.06] bg-black/70 backdrop-blur-2xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#0066FF] rounded-lg flex items-center justify-center">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Transporter-Pro</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
            <a href="#pain" className="hover:text-white transition-colors">Problème</a>
            <a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a>
            <a href="#roi" className="hover:text-white transition-colors">Calculateur ROI</a>
            <a href="#pricing" className="hover:text-white transition-colors">Tarifs</a>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="text-sm text-zinc-400 hover:text-white transition-colors px-4 py-2" data-testid="nav-login-btn">Connexion</button>
            <button onClick={() => navigate('/register')} className="text-sm font-semibold bg-[#0066FF] hover:bg-[#0052CC] px-5 py-2.5 rounded-lg transition-all hover:shadow-lg hover:shadow-blue-500/25" data-testid="nav-cta-btn">Essai gratuit</button>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative pt-[7.5rem] pb-20 px-6 overflow-hidden" data-testid="hero-section">
        {/* Glows */}
        <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#0066FF]/[0.06] rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute top-40 right-0 w-[300px] h-[300px] bg-blue-600/[0.03] rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.08] bg-white/[0.03] text-xs text-zinc-400 mb-8 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0066FF] animate-pulse" />
              14 jours d'essai gratuit — Aucune carte bancaire requise
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-bold leading-[1.08] tracking-tight mb-7" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }} data-testid="hero-h1">
              <span className="bg-gradient-to-b from-white via-white to-zinc-400 bg-clip-text text-transparent">Chaque minute, votre trésorerie fuit. </span>
              <span className="bg-gradient-to-r from-[#0066FF] to-[#00AAFF] bg-clip-text text-transparent">Reprenez le contrôle.</span>
            </h1>

            <p className="text-base text-zinc-400 max-w-xl mb-10 leading-relaxed" data-testid="hero-subtitle">
              Marre de payer pour des colis que vous n'avez pas cassés ? Marre du gasoil qui s'évapore ?{' '}
              <span className="text-zinc-200">Transporter-Pro est votre assistant de gestion interne</span> : Bouclier IA + Éco-Score + Tracking.{' '}
              <span className="text-[#0066FF] font-medium">14 jours d'essai gratuit, 0€ aujourd'hui.</span>
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-4">
              <button onClick={() => navigate('/register')} className="group flex items-center gap-2.5 bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold px-8 py-4 rounded-xl text-base transition-all hover:shadow-xl hover:shadow-blue-500/25 hover:-translate-y-0.5" data-testid="hero-cta-btn">
                Démarrer mon essai gratuit
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors border border-white/[0.08] px-6 py-3.5 rounded-xl hover:border-white/[0.15]" data-testid="hero-demo-btn">
                <Eye className="w-4 h-4" />
                Voir la démo
              </button>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative hidden lg:block">
            <div className="rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl shadow-blue-500/5">
              <img src={IMG_TRUCK_NIGHT} alt="Camion moderne de nuit" className="w-full h-[400px] object-cover" loading="eager" />
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 rounded-2xl" />
            </div>
            {/* Floating badge */}
            <div className="absolute -bottom-3 -left-3 bg-[#0A0A0B] border border-[#0066FF]/20 rounded-xl px-4 py-2.5 shadow-xl shadow-black/50 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-6 h-6 rounded-full bg-[#0066FF]/10 flex items-center justify-center"><Shield className="w-3 h-3 text-[#0066FF]" /></div>
                <span className="text-[#0066FF] font-semibold">IA Gemini Vision Active</span>
              </div>
            </div>
            <div className="absolute -top-3 -right-3 bg-[#0A0A0B] border border-green-500/20 rounded-xl px-4 py-2.5 shadow-xl shadow-black/50 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center"><Check className="w-3 h-3 text-green-400" /></div>
                <span className="text-green-400 font-semibold">3 camions en route</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── METRICS ─── */}
      <section className="border-y border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '14j', label: 'essai gratuit' },
            { value: '-40%', label: 'de litiges' },
            { value: '-15%', label: 'de carburant' },
            { value: '24/7', label: 'preuve numérique' },
          ].map((m, i) => (
            <div key={i}>
              <p className="text-2xl sm:text-3xl font-bold font-mono text-white">{m.value}</p>
              <p className="text-xs text-zinc-500 mt-1 uppercase tracking-wider">{m.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PAIN / e-CMR ─── */}
      <section id="pain" className="py-24 px-6" data-testid="pain-section">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-red-400 mb-3">Le cauchemar du transport</p>
              <h2 className="text-2xl sm:text-3xl font-bold leading-tight mb-6" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }} data-testid="pain-h2">
                Ne jouez plus la survie de votre entreprise sur une signature illisible.
              </h2>
              <p className="text-zinc-400 leading-relaxed mb-4">
                Une photo floue, une case non cochée sur votre e-CMR, et c'est{' '}
                <span className="text-red-400 font-semibold">2 000€ perdus pour votre trésorerie</span>.
              </p>
              <ul className="space-y-3 mb-6 text-sm text-zinc-400">
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                  <span><strong className="text-zinc-200">Litiges injustifiés :</strong> 8% du CA des PME transport perdu en réclamations abusives sans preuve photo.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                  <span><strong className="text-zinc-200">Gasoil qui s'évapore :</strong> Sans monitoring, le gaspillage de carburant dépasse 15% de votre budget annuel.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                  <span><strong className="text-zinc-200">Amendes réglementaires :</strong> 50€ par facture non conforme (loi 2026). Ça s'accumule vite.</span>
                </li>
              </ul>
              <div className="bg-white/[0.02] border border-[#0066FF]/20 rounded-xl p-5">
                <p className="text-sm text-zinc-300 flex items-start gap-3">
                  <Shield className="w-5 h-5 text-[#0066FF] flex-shrink-0 mt-0.5" />
                  <span><strong className="text-white">Notre solution :</strong> L'IA Gemini Vision valide l'état du colis AVANT le départ. Preuve numérique infalsifiable, horodatée et géolocalisée.</span>
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-2xl overflow-hidden border border-white/[0.06] shadow-xl shadow-black/40">
                <img src={IMG_WAREHOUSE} alt="Entrepôt logistique moderne" className="w-full h-72 object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent rounded-2xl" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-[#0A0A0B] border border-white/[0.08] rounded-xl p-3 shadow-xl shadow-black/50">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center"><Check className="w-3 h-3 text-green-400" /></div>
                  <span className="text-green-400 font-medium">Colis intact — Confiance 94%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES (Bento Grid) ─── */}
      <section id="features" className="py-24 px-6 border-t border-white/[0.06]" data-testid="features-section">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs uppercase tracking-[0.2em] text-[#0066FF] text-center mb-3">Fonctionnalités</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            Tout ce qu'il faut pour dormir tranquille.
          </h2>
          <p className="text-zinc-400 text-center max-w-lg mx-auto mb-14 text-sm">Chaque fonctionnalité a été pensée pour éliminer un risque réel du transport routier.</p>

          <div className="grid md:grid-cols-3 gap-4" data-testid="bento-grid">
            {/* IA card — large */}
            <div className="md:col-span-2 group bg-white/[0.02] border border-white/[0.06] hover:border-blue-500/20 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5" data-testid="feature-ia">
              <div className="p-6 pb-0">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-[#0066FF]/10 flex items-center justify-center flex-shrink-0">
                    <Camera className="w-5 h-5 text-[#0066FF]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>IA Anti-Litige</h3>
                    <p className="text-sm text-zinc-400 leading-relaxed mt-1">Analyse photo instantanée par Gemini Vision. L'IA détecte les dommages, évalue la sévérité et génère un rapport probant en 3 secondes.</p>
                  </div>
                </div>
              </div>
              <div className="h-44 overflow-hidden">
                <img src={IMG_TRUCK_ROAD} alt="Analyse IA en route" className="w-full h-full object-cover opacity-50 group-hover:opacity-70 group-hover:scale-105 transition-all duration-500" loading="lazy" />
              </div>
            </div>

            {/* Tracking — small */}
            <div className="group bg-white/[0.02] border border-white/[0.06] hover:border-emerald-500/20 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-0.5" data-testid="feature-tracking">
              <div className="w-10 h-10 rounded-xl bg-emerald-400/10 flex items-center justify-center mb-4">
                <MapPin className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-base font-bold mb-2" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Tracking & e-CMR Live</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">Vos clients savent tout, vos chauffeurs sont assistés, vos amendes disparaissent. GPS temps réel + génération e-CMR automatique.</p>
            </div>

            {/* Eco — small */}
            <div className="group bg-white/[0.02] border border-white/[0.06] hover:border-amber-500/20 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-0.5" data-testid="feature-eco">
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center mb-4">
                <Leaf className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="text-base font-bold mb-2" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Éco-Score Chauffeur</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">Transformez la conduite en fierté. Le classement gamifié économise jusqu'à <strong className="text-amber-400">15% de carburant</strong> par mois.</p>
            </div>

            {/* e-CMR — wide */}
            <div className="md:col-span-2 group bg-white/[0.02] border border-white/[0.06] hover:border-purple-500/20 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-0.5" data-testid="feature-ecmr">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-purple-400/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-1" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Génération e-CMR & Factur-X</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">Fini le papier. Générez vos lettres de voiture numériques en un clic. Conformité réglementaire totale, archivage automatique, signature électronique du destinataire.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── ROI CALCULATOR ─── */}
      <ROICalculator onNavigate={navigate} />

      {/* ─── AI DEMO + TRUST BADGES ─── */}
      <section className="py-20 px-6 border-t border-white/[0.06]" data-testid="trust-section">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center mb-16">
            {/* AI Demo Visual */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 relative overflow-hidden" data-testid="ai-demo">
              <p className="text-xs uppercase tracking-[0.2em] text-[#0066FF] mb-3">Démo IA Gemini Vision</p>
              <div className="relative rounded-xl overflow-hidden bg-[#0A0A0B] border border-white/[0.04]">
                <img src={IMG_WAREHOUSE} alt="Scan colis" className="w-full h-48 object-cover opacity-60" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                {/* Scan overlay */}
                <div className="absolute inset-x-0 top-0 h-full flex items-center justify-center">
                  <div className="w-32 h-32 border-2 border-[#0066FF]/60 rounded-lg relative">
                    <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#0066FF] rounded-tl-sm" />
                    <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#0066FF] rounded-tr-sm" />
                    <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#0066FF] rounded-bl-sm" />
                    <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#0066FF] rounded-br-sm" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Camera className="w-6 h-6 text-[#0066FF] opacity-60" />
                    </div>
                  </div>
                </div>
                {/* Result badge */}
                <div className="absolute bottom-3 left-3 right-3 bg-[#0A0A0B]/90 backdrop-blur-sm border border-white/[0.08] rounded-lg p-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center"><Check className="w-3 h-3 text-green-400" /></div>
                      <span className="text-green-400 font-medium">Aucun dommage détecté</span>
                    </div>
                    <span className="text-[#0066FF] font-mono font-bold">94%</span>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] text-zinc-500">
                    <span>Sévérité: <span className="text-green-400">Aucune</span></span>
                    <span>Scan: <span className="text-zinc-300">1.2s</span></span>
                    <span>Preuve: <span className="text-[#0066FF]">Horodatée</span></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Trust info */}
            <div>
              <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Chaque photo est une preuve.</h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                Au chargement, votre chauffeur prend une photo. En moins de 2 secondes, Gemini Vision analyse l'état du colis, détecte les chocs et génère un rapport horodaté. Si un client conteste, vous avez la preuve irréfutable.
              </p>
              <div className="space-y-3">
                {[
                  { label: 'Détection des dommages par IA', detail: 'Sévérité + zone impactée' },
                  { label: 'Horodatage infalsifiable', detail: 'Date, heure, géolocalisation' },
                  { label: 'Rapport PDF exportable', detail: 'Valeur probante pour assureurs' }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-[#0066FF]/10 flex items-center justify-center flex-shrink-0 mt-0.5"><Check className="w-3 h-3 text-[#0066FF]" /></div>
                    <div><span className="text-white font-medium">{item.label}</span><span className="text-zinc-500"> — {item.detail}</span></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-8 pt-8 border-t border-white/[0.06]" data-testid="trust-badges">
            {[
              { name: 'eFTI', desc: 'Electronic Freight Transport Information' },
              { name: 'GDPR', desc: 'Règlement Général sur la Protection des Données' },
              { name: 'eIDAS', desc: 'Identification électronique et services de confiance' }
            ].map((badge, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-[#0066FF]/10 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-[#0066FF]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{badge.name}</p>
                  <p className="text-[10px] text-zinc-500">{badge.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <PricingSection onNavigate={navigate} />

      {/* ─── FINAL CTA ─── */}
      <section className="py-24 px-6 border-t border-white/[0.06]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Prêt à protéger vos marges ?</h2>
          <p className="text-zinc-400 mb-8">Rejoignez les transporteurs qui ont repris le contrôle. Essai gratuit de 14 jours inclus.</p>
          <button onClick={() => navigate('/register')} className="group inline-flex items-center gap-2 bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold px-8 py-4 rounded-xl transition-all hover:shadow-xl hover:shadow-blue-500/25" data-testid="final-cta-btn">
            Démarrer mon essai gratuit
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

/* ─────────────────────── PRICING ─────────────────────── */

const plans = [
  {
    id: 'solo',
    name: 'SOLO',
    tagline: 'Pour les artisans du transport.',
    trucks: "Jusqu'à 3 camions",
    monthly: 39,
    yearlyTotal: 390,
    yearlyMonthly: 32,
    features: ['e-CMR illimitées', 'Support email', 'Dashboard basique', '3 chauffeurs max'],
    popular: false,
  },
  {
    id: 'croissance',
    name: 'CROISSANCE',
    tagline: 'Le standard pour les PME en expansion.',
    trucks: "Jusqu'à 15 camions",
    monthly: 189,
    yearlyTotal: 1890,
    yearlyMonthly: 157,
    features: ['Tout de Solo +', 'IA Anti-litige (Gemini)', 'Cash-Flow Dashboard', 'Tracking GPS Live', 'Support prioritaire', '15 chauffeurs max'],
    popular: true,
  },
  {
    id: 'flotte_pro',
    name: 'FLOTTE PRO',
    tagline: 'La puissance brute pour les empires logistiques.',
    trucks: 'Camions illimités',
    monthly: 489,
    yearlyTotal: 4890,
    yearlyMonthly: 407,
    features: ['Tout de Croissance +', 'Éco-Score complet', 'API Access', 'Support 24/7 dédié', 'Chauffeurs illimités', 'White-label'],
    popular: false,
  },
];

const PricingSection = ({ onNavigate }) => {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="py-24 px-6 border-t border-white/[0.06]" data-testid="pricing-section">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs uppercase tracking-[0.2em] text-[#0066FF] text-center mb-3">Tarifs Membres Fondateurs</p>
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
          Un plan pour chaque ambition.
        </h2>
        <p className="text-zinc-400 text-center max-w-lg mx-auto mb-2 text-sm">Essai gratuit de 14 jours inclus sur tous les plans. Annulable en un clic.</p>
        <p className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full" data-testid="founder-badge">Tarif garanti à vie pour les Membres Fondateurs</span>
        </p>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-3 mb-12" data-testid="pricing-toggle">
          <span className={`text-sm transition-colors ${!annual ? 'text-white font-medium' : 'text-zinc-500'}`}>Mensuel</span>
          <button onClick={() => setAnnual(!annual)} className={`relative w-14 h-7 rounded-full transition-colors ${annual ? 'bg-[#0066FF]' : 'bg-zinc-700'}`} data-testid="toggle-billing">
            <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${annual ? 'translate-x-7' : 'translate-x-0.5'}`} />
          </button>
          <span className={`text-sm transition-colors ${annual ? 'text-white font-medium' : 'text-zinc-500'}`}>
            Annuel <span className="text-[#0066FF] text-xs font-semibold ml-1">Économisez 17%</span>
          </span>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white/[0.02] border rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 ${
                plan.popular ? 'border-[#0066FF]/40 shadow-lg shadow-blue-500/10' : 'border-white/[0.06]'
              }`}
              data-testid={`plan-${plan.id}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#0066FF] rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap" data-testid="popular-badge">
                  Le choix des leaders
                </div>
              )}

              <h3 className="text-lg font-bold mt-2" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{plan.name}</h3>
              <p className="text-xs text-zinc-500 mb-4">{plan.trucks}</p>

              {annual ? (
                <div className="mb-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-bold font-mono" data-testid={`price-${plan.id}`}>{plan.yearlyTotal.toLocaleString('fr-FR')}</span>
                    <span className="text-zinc-400 text-sm">€ / an</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">Soit environ <span className="text-zinc-300 font-medium">{plan.yearlyMonthly}€ / mois</span></p>
                </div>
              ) : (
                <div className="mb-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-bold font-mono" data-testid={`price-${plan.id}`}>{plan.monthly}</span>
                    <span className="text-zinc-400 text-sm">€ / mois</span>
                  </div>
                </div>
              )}

              <p className="text-sm text-zinc-400 mb-5 mt-3">{plan.tagline}</p>

              <button
                onClick={() => onNavigate('/register')}
                className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                  plan.popular
                    ? 'bg-[#0066FF] hover:bg-[#0052CC] text-white hover:shadow-lg hover:shadow-blue-500/20'
                    : 'bg-white/[0.05] hover:bg-white/[0.08] text-white border border-white/[0.08]'
                }`}
                data-testid={`plan-cta-${plan.id}`}
              >
                Démarrer l'essai gratuit — 14 jours
              </button>

              <ul className="mt-6 space-y-2.5">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-zinc-400">
                    <Check className="w-4 h-4 text-[#0066FF] flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LandingPage;

/* ─────────────────────── ROI CALCULATOR ─────────────────────── */

const ROICalculator = ({ onNavigate }) => {
  const [trucks, setTrucks] = useState(5);
  const [litiges, setLitiges] = useState(3);
  const [costPerLitige, setCostPerLitige] = useState(350);

  const pertesLitiges = litiges * costPerLitige;
  const pertesCarburant = trucks * 50;
  const totalPertes = pertesLitiges + pertesCarburant;
  const economiesLitiges = Math.round(pertesLitiges * 0.8);
  const economiesCarburant = pertesCarburant;
  const totalEconomies = economiesLitiges + economiesCarburant;

  return (
    <section id="roi" className="py-24 px-6 border-t border-white/[0.06] relative overflow-hidden" data-testid="roi-section">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#0066FF]/[0.04] rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative">
        <p className="text-xs uppercase tracking-[0.2em] text-red-400 text-center mb-3">Calculateur de rentabilité</p>
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
          Combien perdez-vous chaque mois ?
        </h2>
        <p className="text-zinc-400 text-center max-w-lg mx-auto mb-12 text-sm">Ajustez les curseurs pour découvrir vos pertes réelles — et ce que Transporter-Pro vous fait économiser.</p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Sliders */}
          <div className="space-y-8" data-testid="roi-inputs">
            <SliderInput
              label="Nombre de camions"
              value={trucks}
              onChange={setTrucks}
              min={1} max={50} step={1}
              unit="camions"
              testId="slider-trucks"
            />
            <SliderInput
              label="Litiges / dommages par mois"
              value={litiges}
              onChange={setLitiges}
              min={0} max={20} step={1}
              unit="litiges"
              testId="slider-litiges"
            />
            <SliderInput
              label="Coût moyen d'un litige"
              value={costPerLitige}
              onChange={setCostPerLitige}
              min={100} max={2000} step={50}
              unit="€"
              testId="slider-cost"
            />
          </div>

          {/* Results */}
          <div className="space-y-5" data-testid="roi-results">
            {/* Losses */}
            <div className="bg-red-500/[0.04] border border-red-500/10 rounded-2xl p-5">
              <p className="text-xs uppercase tracking-wider text-red-400/70 mb-3">Vos pertes mensuelles</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Litiges ({litiges} x {costPerLitige}€)</span>
                  <span className="text-red-400 font-mono font-semibold">{pertesLitiges.toLocaleString('fr-FR')} €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Carburant gaspillé ({trucks} camions)</span>
                  <span className="text-red-400 font-mono font-semibold">{pertesCarburant.toLocaleString('fr-FR')} €</span>
                </div>
                <div className="border-t border-red-500/10 pt-2 mt-2 flex justify-between">
                  <span className="text-red-300 font-semibold">Total perdu</span>
                  <span className="text-2xl font-bold font-mono text-red-400" data-testid="total-losses">-{totalPertes.toLocaleString('fr-FR')} €</span>
                </div>
              </div>
            </div>

            {/* Savings */}
            <div className="bg-green-500/[0.04] border border-green-500/10 rounded-2xl p-5">
              <p className="text-xs uppercase tracking-wider text-green-400/70 mb-3">Économies avec Transporter-Pro</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Litiges évités (80% via IA)</span>
                  <span className="text-green-400 font-mono font-semibold">+{economiesLitiges.toLocaleString('fr-FR')} €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Économies carburant (Éco-Score)</span>
                  <span className="text-green-400 font-mono font-semibold">+{economiesCarburant.toLocaleString('fr-FR')} €</span>
                </div>
                <div className="border-t border-green-500/10 pt-2 mt-2 flex justify-between">
                  <span className="text-green-300 font-semibold">Total économisé</span>
                  <span className="text-2xl font-bold font-mono text-green-400" data-testid="total-savings">+{totalEconomies.toLocaleString('fr-FR')} €</span>
                </div>
              </div>
            </div>

            {/* ROI Ratio */}
            <div className="bg-white/[0.02] border border-[#0066FF]/20 rounded-2xl p-5 text-center">
              <p className="text-sm text-zinc-400 mb-2">
                Vous perdez actuellement <span className="text-red-400 font-bold">{totalPertes.toLocaleString('fr-FR')} €</span> / mois.
              </p>
              <p className="text-sm text-zinc-400 mb-1">
                Transporter-Pro vous en sauve <span className="text-green-400 font-bold">{totalEconomies.toLocaleString('fr-FR')} €</span>.
              </p>
              <p className="text-[#0066FF] font-semibold text-sm mt-3" data-testid="roi-conclusion">
                Votre abonnement est rentabilisé dès le premier jour.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-10">
          <button
            onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
            className="group inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold px-8 py-4 rounded-xl transition-all hover:shadow-xl hover:shadow-red-500/20"
            data-testid="roi-cta-btn"
          >
            Arrêter de perdre de l'argent
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
};

const SliderInput = ({ label, value, onChange, min, max, step, unit, testId }) => {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex justify-between items-baseline mb-3">
        <label className="text-sm text-zinc-300 font-medium">{label}</label>
        <span className="text-lg font-bold font-mono text-white" data-testid={`${testId}-value`}>{value} <span className="text-xs text-zinc-500 font-normal">{unit}</span></span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #0066FF ${pct}%, #27272A ${pct}%)`
        }}
        data-testid={testId}
      />
      <div className="flex justify-between mt-1.5 text-[10px] text-zinc-600">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
};

