import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Truck, Leaf, ArrowRight, ChevronRight } from 'lucide-react';
import Footer from '../components/Footer';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  React.useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500/30">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/[0.06] bg-black/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#0066FF] rounded-lg flex items-center justify-center">
              <Truck className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
              Transporter-Pro
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-zinc-400 hover:text-white transition-colors px-4 py-2"
              data-testid="nav-login-btn"
            >
              Connexion
            </button>
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-semibold bg-[#0066FF] hover:bg-[#0052CC] px-5 py-2.5 rounded-lg transition-all hover:shadow-lg hover:shadow-blue-500/20"
              data-testid="nav-cta-btn"
            >
              Commencer
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden" data-testid="hero-section">
        {/* Subtle glow */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#0066FF]/[0.04] rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-xs text-zinc-400 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0066FF] animate-pulse" />
            Plateforme SaaS pour transporteurs PME
          </div>

          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight mb-6"
            style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
            data-testid="hero-h1"
          >
            <span className="bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
              Chaque minute, votre{' '}
            </span>
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
              trésorerie fuit.{' '}
            </span>
            <span className="bg-gradient-to-r from-[#0066FF] to-[#00AAFF] bg-clip-text text-transparent">
              Reprenez le contrôle.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed" data-testid="hero-subtitle">
            Marre des litiges injustifiés, des marchandises dégradées en silence
            et des amendes qui tombent sans preuve ?{' '}
            <span className="text-zinc-300">
              Transporter-Pro protège vos marges
            </span>{' '}
            grâce à une IA visionnaire qui responsabilise vos chauffeurs en temps réel.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="group flex items-center gap-2 bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold px-8 py-4 rounded-xl text-base transition-all hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-0.5"
              data-testid="hero-cta-btn"
            >
              Commencer maintenant
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => document.getElementById('solutions')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
            >
              Découvrir les solutions
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Metrics band */}
      <section className="border-y border-white/[0.06] bg-white/[0.01]">
        <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '15min', label: 'pour démarrer' },
            { value: '-40%', label: 'de litiges non justifiés' },
            { value: '12%', label: "d'économie carburant" },
            { value: '24/7', label: 'preuve numérique' },
          ].map((m, i) => (
            <div key={i}>
              <p className="text-2xl sm:text-3xl font-bold font-mono text-white">{m.value}</p>
              <p className="text-xs text-zinc-500 mt-1 uppercase tracking-wider">{m.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pain & Solution */}
      <section id="solutions" className="py-24 px-6" data-testid="solutions-section">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs uppercase tracking-[0.2em] text-[#0066FF] text-center mb-3">Pourquoi Transporter-Pro</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-16" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            Trois douleurs. Trois solutions.
          </h2>

          <div className="grid md:grid-cols-3 gap-5">
            <SolutionCard
              icon={<Shield className="w-5 h-5" />}
              pain="Stop aux factures de litiges surprises"
              solution="L'IA Gemini valide l'état du colis au départ et à l'arrivée. Preuve horodatée, irréfutable."
              accent="blue"
              testId="card-litiges"
            />
            <SolutionCard
              icon={<Truck className="w-5 h-5" />}
              pain="Finies les nuits blanches"
              solution="Tracking Live + preuve numérique. Vous savez où sont vos camions et l'état des marchandises en temps réel."
              accent="emerald"
              testId="card-tracking"
            />
            <SolutionCard
              icon={<Leaf className="w-5 h-5" />}
              pain="Motiver plutôt que surveiller"
              solution="Le système d'Éco-score gamifie la conduite responsable. Résultat : moins de carburant, moins de sinistres."
              accent="amber"
              testId="card-eco"
            />
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-6 border-t border-white/[0.06]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            Prêt à protéger vos marges ?
          </h2>
          <p className="text-zinc-400 mb-8">
            Rejoignez les transporteurs qui ont repris le contrôle de leur trésorerie.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="group inline-flex items-center gap-2 bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold px-8 py-4 rounded-xl transition-all hover:shadow-xl hover:shadow-blue-500/20"
            data-testid="final-cta-btn"
          >
            Créer mon compte gratuitement
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

const SolutionCard = ({ icon, pain, solution, accent, testId }) => {
  const colors = {
    blue: { border: 'hover:border-blue-500/20', icon: 'text-[#0066FF] bg-[#0066FF]/10', glow: 'group-hover:shadow-blue-500/5' },
    emerald: { border: 'hover:border-emerald-500/20', icon: 'text-emerald-400 bg-emerald-400/10', glow: 'group-hover:shadow-emerald-500/5' },
    amber: { border: 'hover:border-amber-500/20', icon: 'text-amber-400 bg-amber-400/10', glow: 'group-hover:shadow-amber-500/5' },
  };
  const c = colors[accent];

  return (
    <div
      className={`group relative bg-white/[0.02] border border-white/[0.06] ${c.border} rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 ${c.glow} hover:shadow-xl`}
      data-testid={testId}
    >
      <div className={`w-10 h-10 rounded-xl ${c.icon} flex items-center justify-center mb-5`}>
        {icon}
      </div>
      <h3 className="text-base font-bold mb-2" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
        {pain}
      </h3>
      <p className="text-sm text-zinc-400 leading-relaxed">{solution}</p>
    </div>
  );
};

export default LandingPage;
