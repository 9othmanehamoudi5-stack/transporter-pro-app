import React from 'react';
import { CheckCircle, X, Zap, Crown, TrendingUp, Map, Bell } from 'lucide-react';

/**
 * Interactive3DUpsellModal
 * Modale premium affichée lorsqu'un utilisateur Starter/Croissance sans add-on
 * clique sur le bouton "Vue 3D LIVE". Propose l'activation de l'add-on (+49€/mois)
 * ou un upgrade vers Flotte Pro.
 *
 * Props :
 *   isOpen   {boolean}  – contrôle l'affichage
 *   onClose  {function} – callback pour fermer la modale
 *   userPlan {string}   – plan actuel de l'utilisateur (solo, croissance, etc.)
 */
const Interactive3DUpsellModal = ({ isOpen, onClose, userPlan }) => {
  if (!isOpen) return null;

  const STRIPE_ADDON_3D_MONTHLY = 'https://buy.stripe.com/test_ADDON_3D_A_CREER'; // À remplacer après création Stripe
  const STRIPE_FLOTTE_PRO_MONTHLY = 'https://buy.stripe.com/test_dRmbJ37Vx6QVcP69g4enS04';

  const benefits = [
    {
      icon: <Map className="w-5 h-5 text-orange-400" />,
      title: 'Dépôt logistique 3D interactif',
      desc: 'Visualisez vos camions, quais de chargement et missions dans un environnement 3D animé.'
    },
    {
      icon: <Zap className="w-5 h-5 text-yellow-400" />,
      title: 'Données live connectées',
      desc: 'Chaque camion 3D reflète l\'état réel de votre flotte : en transit, au quai, disponible.'
    },
    {
      icon: <Bell className="w-5 h-5 text-blue-400" />,
      title: 'Badges télématiques holographiques',
      desc: 'N° de mission, chauffeur assigné et destination affichés directement au-dessus du véhicule.'
    },
    {
      icon: <TrendingUp className="w-5 h-5 text-emerald-400" />,
      title: 'Clic sur camion → fiche mission',
      desc: 'Accédez instantanément aux détails d\'une livraison en cliquant sur le camion correspondant.'
    }
  ];

  const planLabel = {
    solo: 'Starter',
    starter: 'Starter',
    croissance: 'PME Croissance',
    pme: 'PME Croissance'
  }[userPlan] || 'votre plan';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#111114] border border-[#2a2a2e] rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Badge premium en haut à droite */}
        <div className="absolute top-4 right-12 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold px-3 py-1 rounded-full">
          Incluse en Flotte Pro
        </div>

        {/* Bouton fermer */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header gradient */}
        <div className="bg-gradient-to-br from-[#1a1a24] via-[#161620] to-[#0f0f14] px-6 pt-8 pb-6 border-b border-[#2a2a2e]">
          {/* Badge fonctionnalité premium */}
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <Crown className="w-3.5 h-3.5" />
            FONCTIONNALITÉ PREMIUM
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">
            Supervisez votre flotte en temps réel en 3D
          </h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Visualisez vos camions, quais et missions dans un environnement 3D interactif 
            connecté à vos données live — une tour de contrôle à portée de clic.
          </p>

          {/* Plan actuel */}
          <div className="mt-4 inline-flex items-center gap-2 text-xs text-zinc-500 bg-zinc-800/50 px-3 py-1.5 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-zinc-500"></span>
            Votre plan actuel : <span className="text-zinc-300 font-medium ml-1">{planLabel}</span>
          </div>
        </div>

        {/* Corps — liste des bénéfices */}
        <div className="px-6 py-5 space-y-4">
          {benefits.map((b, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#1e1e28] flex items-center justify-center">
                {b.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{b.title}</p>
                <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer — CTAs */}
        <div className="px-6 pb-6 space-y-3">
          {/* CTA principal : activer l'add-on */}
          <button
            onClick={() => window.open(STRIPE_ADDON_3D_MONTHLY, '_blank')}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-orange-500/20 text-sm"
          >
            <Zap className="w-4 h-4" />
            Activer l'option Vue 3D — +49 €/mois
          </button>

          {/* CTA secondaire : upgrade Flotte Pro */}
          <button
            onClick={() => window.open(STRIPE_FLOTTE_PRO_MONTHLY, '_blank')}
            className="w-full flex items-center justify-center gap-2 border border-[#3a3a44] hover:border-orange-500/50 text-zinc-300 hover:text-white font-medium py-3 rounded-xl transition-all text-sm"
          >
            <Crown className="w-4 h-4 text-yellow-400" />
            Passer à Flotte Pro
            <span className="text-xs text-emerald-400 ml-1">(Vue 3D offerte)</span>
          </button>

          {/* Lien secondaire */}
          <p className="text-center text-xs text-zinc-600 pt-1">
            <button onClick={onClose} className="hover:text-zinc-400 transition-colors underline underline-offset-2">
              Voir les tarifs complets
            </button>
            {' '}·{' '}
            <button onClick={onClose} className="hover:text-zinc-400 transition-colors">
              Continuer avec la vue classique
            </button>
          </p>
        </div>

        {/* Vignette décorative */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-orange-500/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl" />
        </div>
      </div>
    </div>
  );
};

export default Interactive3DUpsellModal;
