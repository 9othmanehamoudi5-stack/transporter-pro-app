import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Truck, Leaf, ArrowRight, Eye, MapPin, Camera, FileText, Zap, Check, ChevronRight } from 'lucide-react';
import Footer from '../components/Footer';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  React.useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">
      {/* ─── NAV ─── */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/[0.06] bg-black/70 backdrop-blur-2xl">
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
            <a href="#pricing" className="hover:text-white transition-colors">Tarifs</a>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="text-sm text-zinc-400 hover:text-white transition-colors px-4 py-2" data-testid="nav-login-btn">Connexion</button>
            <button onClick={() => navigate('/register')} className="text-sm font-semibold bg-[#0066FF] hover:bg-[#0052CC] px-5 py-2.5 rounded-lg transition-all hover:shadow-lg hover:shadow-blue-500/25" data-testid="nav-cta-btn">Essai gratuit</button>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden" data-testid="hero-section">
        <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#0066FF]/[0.06] rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute top-40 right-0 w-[300px] h-[300px] bg-blue-600/[0.03] rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.08] bg-white/[0.03] text-xs text-zinc-400 mb-8 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0066FF] animate-pulse" />
            14 jours d'essai gratuit — Aucune carte bancaire requise
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold leading-[1.08] tracking-tight mb-7" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }} data-testid="hero-h1">
            <span className="bg-gradient-to-b from-white via-white to-zinc-400 bg-clip-text text-transparent">Chaque minute, votre</span>
            <br />
            <span className="bg-gradient-to-b from-white via-white to-zinc-400 bg-clip-text text-transparent">trésorerie fuit. </span>
            <span className="bg-gradient-to-r from-[#0066FF] to-[#00AAFF] bg-clip-text text-transparent">Reprenez le contrôle.</span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed" data-testid="hero-subtitle">
            Marre des litiges injustifiés, des marchandises dégradées en silence et des e-CMR papier qui se perdent ?{' '}
            <span className="text-zinc-200">Transporter-Pro protège vos marges</span> grâce à une IA visionnaire qui responsabilise vos chauffeurs en temps réel.{' '}
            <span className="text-[#0066FF] font-medium">14 jours d'essai gratuit, 0€ aujourd'hui.</span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
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
              <p className="text-zinc-400 leading-relaxed mb-6">
                Une photo floue, une case non cochée sur votre e-CMR, et c'est{' '}
                <span className="text-red-400 font-semibold">2 000€ d'amende pour votre pomme</span>.
                Les litiges liés aux lettres de voiture représentent jusqu'à 8% du chiffre d'affaires des PME du transport.
              </p>
              <div className="bg-white/[0.02] border border-[#0066FF]/20 rounded-xl p-5">
                <p className="text-sm text-zinc-300 flex items-start gap-3">
                  <Shield className="w-5 h-5 text-[#0066FF] flex-shrink-0 mt-0.5" />
                  <span><strong className="text-white">Notre solution :</strong> L'IA Gemini Vision valide l'état du colis AVANT le départ. Preuve numérique infalsifiable, horodatée et géolocalisée.</span>
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-2xl overflow-hidden border border-white/[0.06]">
                <img src="https://images.unsplash.com/photo-1662568804208-5872bd7d9477?w=600&q=80" alt="Chauffeur en livraison" className="w-full h-72 object-cover" loading="lazy" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-[#121214] border border-white/[0.08] rounded-xl p-3 shadow-xl shadow-black/50">
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
            {/* Large card */}
            <div className="md:col-span-2 group bg-white/[0.02] border border-white/[0.06] hover:border-blue-500/20 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-0.5" data-testid="feature-ia">
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-xl bg-[#0066FF]/10 flex items-center justify-center flex-shrink-0">
                  <Camera className="w-6 h-6 text-[#0066FF]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>IA Anti-Litige</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">Analyse photo instantanée par Gemini Vision. L'IA détecte les dommages, évalue la sévérité et génère un rapport probant en 3 secondes. Bloquez les réclamations abusives avant qu'elles ne vous coûtent un centime.</p>
                </div>
              </div>
              <div className="mt-5 rounded-xl overflow-hidden border border-white/[0.04] h-40">
                <img src="https://images.unsplash.com/photo-1608721294710-7c298262c329?w=800&q=80" alt="Analyse colis" className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" loading="lazy" />
              </div>
            </div>

            {/* Small card */}
            <div className="group bg-white/[0.02] border border-white/[0.06] hover:border-emerald-500/20 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-0.5" data-testid="feature-tracking">
              <div className="w-10 h-10 rounded-xl bg-emerald-400/10 flex items-center justify-center mb-4">
                <MapPin className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-base font-bold mb-2" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Tracking & e-CMR Live</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">Vos clients savent tout, vos chauffeurs sont assistés, vos amendes disparaissent. GPS temps réel + génération e-CMR automatique.</p>
            </div>

            {/* Small card */}
            <div className="group bg-white/[0.02] border border-white/[0.06] hover:border-amber-500/20 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-0.5" data-testid="feature-eco">
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center mb-4">
                <Leaf className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="text-base font-bold mb-2" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Éco-Score Chauffeur</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">Transformez la conduite en fierté. Le classement gamifié économise jusqu'à <strong className="text-amber-400">15% de carburant</strong> par mois.</p>
            </div>

            {/* Medium card */}
            <div className="md:col-span-2 group bg-white/[0.02] border border-white/[0.06] hover:border-purple-500/20 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-0.5" data-testid="feature-ecmr">
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-xl bg-purple-400/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Génération e-CMR & Factur-X</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">Fini le papier. Générez vos lettres de voiture numériques en un clic. Conformité réglementaire totale, archivage automatique, signature électronique du destinataire.</p>
                </div>
              </div>
            </div>
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
    monthly: 49,
    yearly: 39,
    features: ['e-CMR illimitées', 'Support email', 'Dashboard basique', '3 chauffeurs max'],
    popular: false,
  },
  {
    id: 'croissance',
    name: 'CROISSANCE',
    tagline: 'Le standard pour les PME en expansion.',
    trucks: "Jusqu'à 15 camions",
    monthly: 149,
    yearly: 119,
    features: ['Tout de Solo +', 'IA Anti-litige (Gemini)', 'Cash-Flow Dashboard', 'Tracking GPS Live', 'Support prioritaire', '15 chauffeurs max'],
    popular: true,
  },
  {
    id: 'flotte_pro',
    name: 'FLOTTE PRO',
    tagline: 'La puissance brute pour les empires logistiques.',
    trucks: 'Camions illimités',
    monthly: 499,
    yearly: 399,
    features: ['Tout de Croissance +', 'Éco-Score complet', 'API Access', 'Support 24/7 dédié', 'Chauffeurs illimités', 'White-label'],
    popular: false,
  },
];

const PricingSection = ({ onNavigate }) => {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="py-24 px-6 border-t border-white/[0.06]" data-testid="pricing-section">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs uppercase tracking-[0.2em] text-[#0066FF] text-center mb-3">Tarifs transparents</p>
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
          Un plan pour chaque ambition.
        </h2>
        <p className="text-zinc-400 text-center max-w-lg mx-auto mb-10 text-sm">Essai gratuit de 14 jours inclus sur tous les plans. Annulable en un clic.</p>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-3 mb-12" data-testid="pricing-toggle">
          <span className={`text-sm ${!annual ? 'text-white' : 'text-zinc-500'}`}>Mensuel</span>
          <button
            onClick={() => setAnnual(!annual)}
            className={`relative w-14 h-7 rounded-full transition-colors ${annual ? 'bg-[#0066FF]' : 'bg-zinc-700'}`}
            data-testid="toggle-billing"
          >
            <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white transition-transform ${annual ? 'translate-x-7' : 'translate-x-0.5'}`} />
          </button>
          <span className={`text-sm ${annual ? 'text-white' : 'text-zinc-500'}`}>
            Annuel <span className="text-[#0066FF] text-xs font-semibold ml-1">-20% + 2 mois offerts</span>
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
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#0066FF] rounded-full text-xs font-bold uppercase tracking-wider" data-testid="popular-badge">
                  Le choix des leaders
                </div>
              )}

              <h3 className="text-lg font-bold mt-2" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{plan.name}</h3>
              <p className="text-xs text-zinc-500 mb-4">{plan.trucks}</p>

              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold font-mono">{annual ? plan.yearly : plan.monthly}</span>
                <span className="text-zinc-400 text-sm">€/mois</span>
              </div>
              {annual && (
                <p className="text-xs text-zinc-500 mb-4 line-through">{plan.monthly}€/mois</p>
              )}
              {!annual && <div className="mb-4" />}

              <p className="text-sm text-zinc-400 mb-5">{plan.tagline}</p>

              <button
                onClick={() => onNavigate('/register')}
                className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                  plan.popular
                    ? 'bg-[#0066FF] hover:bg-[#0052CC] text-white hover:shadow-lg hover:shadow-blue-500/20'
                    : 'bg-white/[0.05] hover:bg-white/[0.08] text-white border border-white/[0.08]'
                }`}
                data-testid={`plan-cta-${plan.id}`}
              >
                Démarrer l'essai gratuit
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
