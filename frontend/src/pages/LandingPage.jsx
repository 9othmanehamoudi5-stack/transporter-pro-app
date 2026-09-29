import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Shield, Truck, Leaf, ArrowRight, Eye, MapPin, Camera, FileText, Check, 
  ChevronRight, Zap, Clock, AlertTriangle, ChevronDown, Award, TrendingUp,
  CreditCard, Sparkles, Building2, Users, FileCheck, Smartphone, CheckCircle2, X,
  HelpCircle, ChevronUp, Lock
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased selection:bg-blue-100">
      
      {/* 1. BANDEAU DE CONFORMITÉ & OFFRE */}
      <div className="bg-slate-900 text-white text-xs py-2.5 px-4 text-center fixed top-0 w-full z-[1000] border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
          <span className="bg-blue-500/20 text-blue-300 font-semibold px-2 py-0.5 rounded text-[11px] border border-blue-400/30">
            Loi 2026-2027
          </span>
          <span>Préparez votre entreprise à la transition e-CMR & Facturation : <strong className="text-white">30 jours d'essai gratuit sans engagement</strong></span>
        </div>
      </div>

      {/* 2. NAVIGATION ÉPURÉE (Style Stripe / Pennylane) */}
      <nav className="fixed top-[37px] w-full z-[999] bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-18 py-3.5 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 bg-[#1E40AF] rounded-xl flex items-center justify-center shadow-md shadow-blue-900/10">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 font-mono">
                Transporter<span className="text-[#2563EB]">-Pro</span>
              </span>
              <p className="text-[10px] text-slate-500 font-medium leading-none">Logiciel Transport & Facturation</p>
            </div>
          </div>

          {/* Liens centraux */}
          <div className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#comparatif" className="hover:text-[#2563EB] transition-colors">Pourquoi nous ?</a>
            <a href="#modules" className="hover:text-[#2563EB] transition-colors">Fonctionnalités</a>
            <a href="#roi" className="hover:text-[#2563EB] transition-colors">Calculateur d'économies</a>
            <a href="#tarifs" className="hover:text-[#2563EB] transition-colors">Tarifs</a>
            <a href="#faq" className="hover:text-[#2563EB] transition-colors">Questions fréquentes</a>
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/login')} 
              className="text-sm font-semibold text-slate-700 hover:text-slate-900 px-4 py-2 transition-colors" 
              data-testid="nav-login-btn"
            >
              Connexion
            </button>
            <button 
              onClick={() => navigate('/register')} 
              className="text-sm font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-5 py-2.5 rounded-xl transition-all shadow-sm shadow-blue-600/20 flex items-center gap-2" 
              data-testid="nav-cta-btn"
            >
              Essai gratuit
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* 3. HERO SECTION CLAIRE & PROFESSIONNELLE */}
      <section className="pt-[140px] pb-20 px-6 bg-gradient-to-b from-white to-[#F8FAFC] border-b border-slate-200">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Texte Hero */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-[#1E40AF] mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              La solution de gestion conçue pour les transporteurs routiers en France
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold text-slate-900 leading-[1.12] tracking-tight mb-6" data-testid="hero-h1">
              Gérez vos transports, éditez vos e-CMR et{' '}
              <span className="text-[#2563EB]">
                sécurisez vos paiements.
              </span>
            </h1>

            <p className="text-lg text-slate-600 max-w-2xl mb-8 leading-relaxed">
              Fini les classeurs Excel, les litiges sans preuve et les factures payées à 60 jours. <strong>Transporter-Pro</strong> réunit votre facturation, vos lettres de voiture numériques et le suivi de vos chauffeurs dans un logiciel simple et intuitif.
            </p>

            {/* Boutons d'action */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-8">
              <button 
                onClick={() => navigate('/register')} 
                className="flex items-center justify-center gap-2.5 bg-[#059669] hover:bg-[#047857] text-white font-bold px-8 py-4 rounded-xl text-base transition-all shadow-md shadow-emerald-700/15 hover:-translate-y-0.5" 
                data-testid="hero-cta-btn"
              >
                Démarrer mon essai gratuit 30 jours
                <ArrowRight className="w-5 h-5" />
              </button>
              
              <button 
                onClick={() => document.getElementById('roi')?.scrollIntoView({ behavior: 'smooth' })} 
                className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 px-6 py-4 rounded-xl transition-all shadow-sm" 
                data-testid="hero-demo-btn"
              >
                <TrendingUp className="w-4 h-4 text-[#2563EB]" />
                Simuler mes économies
              </button>
            </div>

            {/* Badges de confiance */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#059669]" /> Aucune carte bancaire requise</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#059669]" /> Prêt en 2 minutes</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#059669]" /> Données hébergées en France (RGPD)</span>
            </div>
          </div>

          {/* Interface Mockup Dashboard (Style Pro Blanc/Gris) */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-slate-300/80 bg-white p-5 shadow-xl shadow-slate-200/70">
              
              {/* Header fenêtre */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-300" />
                  <div className="w-3 h-3 rounded-full bg-slate-300" />
                  <div className="w-3 h-3 rounded-full bg-slate-300" />
                  <span className="text-xs text-slate-500 font-medium ml-2">app.transporter-pro.com</span>
                </div>
                <span className="text-[11px] bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold border border-emerald-200">
                  ● En direct
                </span>
              </div>

              {/* 3 Cartes de Trésorerie */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">À Encaisser</p>
                  <p className="text-base font-bold text-[#1E40AF] font-mono mt-0.5">14 250 €</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">6 factures</p>
                </div>
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3">
                  <p className="text-[10px] text-emerald-800 uppercase font-bold tracking-wider">Encaissé</p>
                  <p className="text-base font-bold text-[#059669] font-mono mt-0.5">32 800 €</p>
                  <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">↑ +18% ce mois</p>
                </div>
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
                  <p className="text-[10px] text-rose-700 uppercase font-bold tracking-wider">En Retard</p>
                  <p className="text-base font-bold text-rose-600 font-mono mt-0.5">2 100 €</p>
                  <p className="text-[10px] text-rose-600 font-semibold mt-0.5">1 relance auto</p>
                </div>
              </div>

              {/* Ordres en direct */}
              <div className="border border-slate-200 rounded-xl p-3 bg-white mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800">Ordres de transport du jour</span>
                  <span className="text-[10px] text-slate-500 font-medium">Temps réel</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs py-2 border-b border-slate-100">
                    <div>
                      <p className="font-bold text-slate-900">Paris → Lyon (Semi 24t)</p>
                      <p className="text-[11px] text-slate-500">Chauffeur : Karim M. • Camion #04</p>
                    </div>
                    <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200">
                      GPS En route
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs py-2">
                    <div>
                      <p className="font-bold text-slate-900">Lille → Reims</p>
                      <p className="text-[11px] text-slate-500">Factur-X envoyée • 1 450 €</p>
                    </div>
                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
                      e-CMR Signée ✓
                    </span>
                  </div>
                </div>
              </div>

              {/* Bloc Sécurité IA */}
              <div className="bg-slate-900 text-white rounded-xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <div className="text-xs">
                  <p className="font-bold">Bouclier IA Anti-Litige</p>
                  <p className="text-slate-300 text-[11px]">Photo au chargement horodatée : litiges infondés bloqués.</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 4. CHIFFRES CLÉS */}
      <section className="py-12 px-6 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-3xl sm:text-4xl font-black font-mono text-[#059669]">30 jours</p>
            <p className="text-xs uppercase tracking-wider text-slate-500 mt-1 font-bold">Essai sans engagement</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-black font-mono text-slate-900">&lt; 30 sec</p>
            <p className="text-xs uppercase tracking-wider text-slate-500 mt-1 font-bold">Pour créer une facture</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-black font-mono text-[#2563EB]">-80%</p>
            <p className="text-xs uppercase tracking-wider text-slate-500 mt-1 font-bold">De litiges contestés</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-black font-mono text-slate-900">100%</p>
            <p className="text-xs uppercase tracking-wider text-slate-500 mt-1 font-bold">Conforme e-CMR légale</p>
          </div>
        </div>
      </section>

      {/* 5. TABLEAU COMPARATIF VS ANCIENS LOGICIELS */}
      <section id="comparatif" className="py-20 px-6 bg-[#F8FAFC]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs uppercase tracking-[0.2em] text-[#2563EB] font-bold">Comparatif</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 mb-3">
              Pourquoi choisir Transporter-Pro ?
            </h2>
            <p className="text-slate-600 text-sm max-w-xl mx-auto">
              Comparez notre solution tout-en-un aux anciens logiciels de transport traditionnels.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-md">
            <div className="grid grid-cols-12 bg-slate-100 p-4 text-xs font-bold text-slate-700 border-b border-slate-200 uppercase tracking-wider">
              <div className="col-span-5 sm:col-span-4">Fonctionnalité</div>
              <div className="col-span-3 sm:col-span-4 text-center text-slate-500">Anciens logiciels (Akanea, etc.)</div>
              <div className="col-span-4 sm:col-span-4 text-center text-[#2563EB] font-extrabold">Transporter-Pro</div>
            </div>

            <div className="divide-y divide-slate-100 text-sm">
              <div className="grid grid-cols-12 p-4 items-center">
                <div className="col-span-5 sm:col-span-4 font-bold text-slate-800">Transparence des prix</div>
                <div className="col-span-3 sm:col-span-4 text-center text-slate-500 text-xs">Opaque (devis, engagement 3 ans)</div>
                <div className="col-span-4 sm:col-span-4 text-center text-emerald-800 font-bold text-xs bg-emerald-50 py-1.5 rounded-lg border border-emerald-200">Clair dès 79€/mois (Sans engagement)</div>
              </div>

              <div className="grid grid-cols-12 p-4 items-center">
                <div className="col-span-5 sm:col-span-4 font-bold text-slate-800">Prise en main</div>
                <div className="col-span-3 sm:col-span-4 text-center text-slate-500 text-xs">Formations lourdes et payantes</div>
                <div className="col-span-4 sm:col-span-4 text-center text-emerald-800 font-bold text-xs bg-emerald-50 py-1.5 rounded-lg border border-emerald-200">Immédiate en 2 minutes</div>
              </div>

              <div className="grid grid-cols-12 p-4 items-center">
                <div className="col-span-5 sm:col-span-4 font-bold text-slate-800">Preuve photo Anti-Litige</div>
                <div className="col-span-3 sm:col-span-4 text-center text-rose-600 text-xs font-semibold flex items-center justify-center gap-1"><X className="w-3.5 h-3.5" /> Aucune</div>
                <div className="col-span-4 sm:col-span-4 text-center text-emerald-800 font-bold text-xs bg-emerald-50 py-1.5 rounded-lg border border-emerald-200 flex items-center justify-center gap-1"><Check className="w-3.5 h-3.5 text-emerald-600" /> Analyse IA Gemini intégrée</div>
              </div>

              <div className="grid grid-cols-12 p-4 items-center">
                <div className="col-span-5 sm:col-span-4 font-bold text-slate-800">Facturation & TVA Intra</div>
                <div className="col-span-3 sm:col-span-4 text-center text-slate-500 text-xs">Modules complexes et payants</div>
                <div className="col-span-4 sm:col-span-4 text-center text-emerald-800 font-bold text-xs bg-emerald-50 py-1.5 rounded-lg border border-emerald-200">Factur-X automatique incluse</div>
              </div>

              <div className="grid grid-cols-12 p-4 items-center">
                <div className="col-span-5 sm:col-span-4 font-bold text-slate-800">Suivi GPS Chauffeurs</div>
                <div className="col-span-3 sm:col-span-4 text-center text-slate-500 text-xs">Boîtiers GPS coûteux à installer</div>
                <div className="col-span-4 sm:col-span-4 text-center text-emerald-800 font-bold text-xs bg-emerald-50 py-1.5 rounded-lg border border-emerald-200">Directement via smartphone</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. LES 4 MODULES CLÉS (Style Cartes Blanches) */}
      <section id="modules" className="py-20 px-6 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs uppercase tracking-[0.2em] text-[#2563EB] font-bold">Tout-en-un</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 mb-3">
              4 outils puissants dans une seule interface
            </h2>
            <p className="text-slate-600 text-sm max-w-xl mx-auto">
              Centralisez vos opérations et débarrassez-vous de la paperasse inutile.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Module 1 */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-8 hover:border-blue-400 transition-all shadow-sm hover:shadow-md">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#1E40AF] flex items-center justify-center mb-6">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Facturation Électronique & Relances Automatiques</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Éditez vos factures en moins de 30 secondes avec calcul automatique de la TVA intracommunautaire. Relancez les clients en retard automatiquement.
              </p>
              <ul className="space-y-2 text-xs font-semibold text-slate-700">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#059669]" /> Remplissage automatique SIRET via l'INSEE</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#059669]" /> Suivi des impayés et des encaissements en temps réel</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#059669]" /> Export comptable en 1 clic</li>
              </ul>
            </div>

            {/* Module 2 */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-8 hover:border-emerald-400 transition-all shadow-sm hover:shadow-md">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-[#059669] flex items-center justify-center mb-6">
                <FileCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">e-CMR & Lettres de Voiture Numériques</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Vos chauffeurs font signer le destinataire directement sur leur smartphone. Le document PDF certifié est archivé et accessible instantanément.
              </p>
              <ul className="space-y-2 text-xs font-semibold text-slate-700">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#059669]" /> Signature tactile sur écran smartphone</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#059669]" /> Génération immédiate de la lettre de voiture PDF</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#059669]" /> 100% conforme à la réglementation transport</li>
              </ul>
            </div>

            {/* Module 3 */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-8 hover:border-blue-400 transition-all shadow-sm hover:shadow-md">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-6">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Bouclier IA Anti-Litige Photos</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Une photo prise par le chauffeur au départ certifie l'état de la marchandise. En cas de contestation à la livraison, vous avez la preuve juridique que le colis est parti intact.
              </p>
              <ul className="space-y-2 text-xs font-semibold text-slate-700">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#059669]" /> Analyse des colis par vision artificielle en 3 secondes</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#059669]" /> Preuve horodatée et géolocalisée irréfutable</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#059669]" /> Fin des pénalités injustifiées imposées par les clients</li>
              </ul>
            </div>

            {/* Module 4 */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-8 hover:border-amber-400 transition-all shadow-sm hover:shadow-md">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-6">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Suivi GPS & Portail Client sans Inscription</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Envoyez un lien public à vos clients pour qu'ils suivent l'arrivée de leur chauffeur en direct. Vos lignes téléphoniques restent libres.
              </p>
              <ul className="space-y-2 text-xs font-semibold text-slate-700">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#059669]" /> Lien de tracking sécurisé sans mot de passe</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#059669]" /> Éco-score chauffeur pour économiser le carburant</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#059669]" /> Optimisation des tournées de livraison</li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* 7. CALCULATEUR DE ROI */}
      <section id="roi" className="py-20 px-6 bg-[#F8FAFC] border-t border-slate-200">
        <ROICalculator onNavigate={navigate} />
      </section>

      {/* 8. GRILLE TARIFAIRE TRANSPARENTE */}
      <section id="tarifs" className="py-20 px-6 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs uppercase tracking-[0.2em] text-[#059669] font-bold">Sans engagement</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 mb-3">
              Des forfaits simples et adaptés à votre flotte
            </h2>
            <p className="text-slate-600 text-sm max-w-lg mx-auto">
              Chaque plan comprend 30 jours d'essai gratuit. Résiliation libre en 1 clic.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-stretch">
            
            {/* Starter */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col justify-between hover:shadow-lg transition-all">
              <div>
                <div className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold mb-4">
                  STARTER
                </div>
                <h3 className="text-xl font-bold text-slate-900">Artisans & 1 à 3 Camions</h3>
                <p className="text-xs text-slate-500 mt-1">L'essentiel pour démarrer sereinement.</p>
                <div className="my-6">
                  <span className="text-4xl font-extrabold font-mono text-slate-900">79 €</span>
                  <span className="text-slate-500 text-xs font-medium"> / mois</span>
                  <p className="text-[11px] text-[#059669] font-bold mt-1">ou 759 €/an (~63 €/mois)</p>
                </div>
                <ul className="space-y-3 text-xs font-semibold text-slate-700 mb-8">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#059669]" /> Jusqu'à 3 chauffeurs</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#059669]" /> Facturation Factur-X illimitée</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#059669]" /> e-CMR avec signature tactile</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#059669]" /> Suivi des statuts des missions</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#059669]" /> Support client français 7j/7</li>
                </ul>
              </div>
              <button 
                onClick={() => navigate('/register')} 
                className="w-full py-3.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-sm transition-all"
              >
                Démarrer l'essai gratuit
              </button>
            </div>

            {/* PME (Recommandé) */}
            <div className="bg-white border-2 border-[#2563EB] rounded-2xl p-8 flex flex-col justify-between relative shadow-xl shadow-blue-500/10 scale-105">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#2563EB] text-white text-[11px] uppercase tracking-wider font-extrabold px-4 py-1 rounded-full shadow-md">
                Le choix recommandé
              </div>
              <div>
                <div className="inline-block px-3 py-1 rounded-full bg-blue-50 text-[#1E40AF] text-xs font-bold mb-4">
                  PME CROISSANCE
                </div>
                <h3 className="text-xl font-bold text-slate-900">Flottes de 4 à 15 Camions</h3>
                <p className="text-xs text-slate-500 mt-1">La suite complète avec l'IA Anti-Litige.</p>
                <div className="my-6">
                  <span className="text-4xl font-extrabold font-mono text-slate-900">249 €</span>
                  <span className="text-slate-500 text-xs font-medium"> / mois</span>
                  <p className="text-[11px] text-[#059669] font-bold mt-1">ou 2 390 €/an (~199 €/mois)</p>
                </div>
                <ul className="space-y-3 text-xs font-semibold text-slate-800 mb-8">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#059669]" /> <strong>Jusqu'à 15 chauffeurs</strong></li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#059669]" /> <strong>Bouclier IA Gemini Anti-Litige</strong></li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#059669]" /> <strong>GPS Live & Optimisation tournées</strong></li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#059669]" /> Éco-Score carburant (-15%)</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#059669]" /> Portail de suivi client autonome</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#059669]" /> Support prioritaire par téléphone</li>
                </ul>
              </div>
              <button 
                onClick={() => navigate('/register')} 
                className="w-full py-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm transition-all shadow-md shadow-blue-600/20"
              >
                Démarrer l'essai 30 jours
              </button>
            </div>

            {/* Flotte Pro */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col justify-between hover:shadow-lg transition-all">
              <div>
                <div className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold mb-4">
                  FLOTTE PRO
                </div>
                <h3 className="text-xl font-bold text-slate-900">Grandes Flottes (+15 camions)</h3>
                <p className="text-xs text-slate-500 mt-1">Toutes les fonctionnalités sans aucune limite.</p>
                <div className="my-6">
                  <span className="text-4xl font-extrabold font-mono text-slate-900">690 €</span>
                  <span className="text-slate-500 text-xs font-medium"> / mois</span>
                  <p className="text-[11px] text-[#059669] font-bold mt-1">ou 6 624 €/an (~552 €/mois)</p>
                </div>
                <ul className="space-y-3 text-xs font-semibold text-slate-700 mb-8">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#059669]" /> <strong>Chauffeurs & camions illimités</strong></li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#059669]" /> Toutes les fonctionnalités PME incluses</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#059669]" /> Accès API dédié</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#059669]" /> Accompagnement & onboarding sur mesure</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#059669]" /> Chargé de compte dédié</li>
                </ul>
              </div>
              <button 
                onClick={() => navigate('/register')} 
                className="w-full py-3.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-sm transition-all"
              >
                Démarrer l'essai gratuit
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* 9. FAQ DIRECTE */}
      <section id="faq" className="py-20 px-6 bg-[#F8FAFC] border-t border-slate-200">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs uppercase tracking-[0.2em] text-[#2563EB] font-bold">Réponses claires</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 mb-3">
              Questions Fréquentes
            </h2>
            <p className="text-slate-600 text-sm">
              Tout ce que vous devez savoir avant de commencer.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "Quel est le prix de Transporter-Pro pour une entreprise de transport ?",
                a: "Le tarif démarre à 79 € par mois pour le forfait STARTER (jusqu'à 3 camions). Le forfait PME est à 249 € par mois (jusqu'à 15 camions) et le forfait FLOTTE est à 690 € par mois (camions illimités). Tous les forfaits incluent 30 jours d'essai gratuit sans engagement."
              },
              {
                q: "Comment fonctionne la protection IA sur les photos de colis ?",
                a: "Le chauffeur prend une photo du colis au chargement. L'IA analyse instantanément l'état de la marchandise et génère un horodatage avec géolocalisation. En cas de réclamation du destinataire à l'arrivée, vous disposez immédiatement de la preuve que le colis a été pris en charge intact."
              },
              {
                q: "Est-ce difficile de remplacer mes anciens fichiers ou logiciels ?",
                a: "Non, Transporter-Pro a été pensé pour être utilisé en 2 minutes sans formation. La recherche automatique des entreprises via l'INSEE remplit automatiquement les coordonnées de vos clients et partenaires."
              },
              {
                q: "Le logiciel est-il conforme à la réglementation française et européenne ?",
                a: "Oui, Transporter-Pro édite des factures conformes Factur-X et génère des lettres de voiture électroniques (e-CMR) reconnues légalement avec signature numérique du destinataire."
              }
            ].map((faq, idx) => (
              <div 
                key={idx} 
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"
              >
                <button 
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full text-left p-5 flex items-center justify-between font-bold text-sm text-slate-800 hover:text-[#2563EB] transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${activeFaq === idx ? 'rotate-180 text-[#2563EB]' : ''}`} />
                </button>
                {activeFaq === idx && (
                  <div className="p-5 pt-0 text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. BANDEAU D'APPEL À L'ACTION FINAL */}
      <section className="py-20 px-6 bg-slate-900 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Reprenez le contrôle de vos transports et de votre trésorerie.
          </h2>
          <p className="text-slate-400 text-sm mb-8 max-w-xl mx-auto">
            Testez gratuitement pendant 30 jours. Aucune carte bancaire requise à l'inscription.
          </p>
          <button 
            onClick={() => navigate('/register')} 
            className="inline-flex items-center gap-2.5 bg-[#059669] hover:bg-[#047857] text-white font-bold px-9 py-4 rounded-xl text-base transition-all shadow-lg shadow-emerald-900/30"
          >
            Démarrer mon essai gratuit — 30 jours
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* 11. FOOTER */}
      <Footer />

    </div>
  );
};

/* --- CALCULATEUR DE RENTABILITÉ (Style Clair & Professionnel) --- */
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
        <span className="text-xs uppercase tracking-[0.2em] text-[#059669] font-bold">Simulateur de rentabilité</span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 mb-3">
          Combien d'argent perdez-vous chaque mois ?
        </h2>
        <p className="text-slate-600 text-sm max-w-lg mx-auto">
          Ajustez les curseurs pour calculer les économies réalisées avec Transporter-Pro sur vos litiges et votre carburant.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <SliderInput
            label="Nombre de camions dans votre flotte"
            value={trucks}
            onChange={setTrucks}
            min={1} max={30} step={1}
            unit="camions"
            testId="slider-trucks"
          />
          <SliderInput
            label="Nombre de litiges / réclamations par mois"
            value={litiges}
            onChange={setLitiges}
            min={0} max={15} step={1}
            unit="litiges"
            testId="slider-litiges"
          />
          <SliderInput
            label="Coût moyen d'un litige / colis endommagé"
            value={costPerLitige}
            onChange={setCostPerLitige}
            min={100} max={1500} step={50}
            unit="€"
            testId="slider-cost"
          />
        </div>

        <div className="space-y-4">
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5">
            <p className="text-xs font-bold uppercase text-rose-700 tracking-wider mb-2">Pertes estimées sans Transporter-Pro</p>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-600">Litiges impayés + carburant gaspillé</span>
              <span className="text-2xl font-extrabold font-mono text-rose-600">-{totalPertes.toLocaleString('fr-FR')} € / mois</span>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
            <p className="text-xs font-bold uppercase text-emerald-800 tracking-wider mb-2">Économies garanties avec Transporter-Pro</p>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-600">Pertes évitées via l'IA & l'Éco-Score</span>
              <span className="text-2xl font-extrabold font-mono text-[#059669]">+{totalEconomies.toLocaleString('fr-FR')} € / mois</span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
            <p className="text-xs text-[#1E40AF] font-semibold mb-3">
              Votre investissement logiciel est rentabilisé dès la première semaine.
            </p>
            <button 
              onClick={() => onNavigate('/register')}
              className="w-full py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm"
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
        <label className="text-xs text-slate-700 font-bold">{label}</label>
        <span className="text-base font-bold font-mono text-slate-900" data-testid={`${testId}-value`}>
          {value} <span className="text-xs text-slate-500 font-normal">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-200 accent-[#2563EB]"
        data-testid={testId}
      />
      <div className="flex justify-between mt-1 text-[10px] text-slate-500">
        <span>{min} {unit}</span>
        <span>{max} {unit}</span>
      </div>
    </div>
  );
};

export default LandingPage;
