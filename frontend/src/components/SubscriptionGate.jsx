import React, { useState } from 'react';
import { toast } from 'sonner';
import api from '../services/api';

const STRIPE_CHECKOUT_URL = 'https://buy.stripe.com/test_3cIeVebks9bqggLacO7IY07';

const SubscriptionGate = ({ user }) => {
  const [verifying, setVerifying] = useState(false);

  const stripeUrl = (() => {
    const params = new URLSearchParams();
    if (user?.email) params.set('prefilled_email', user.email);
    if (user?.id) params.set('client_reference_id', user.id);
    return `${STRIPE_CHECKOUT_URL}?${params.toString()}`;
  })();

  const handleVerifyPayment = async () => {
    setVerifying(true);
    try {
      const { data } = await api.post('/stripe/verify-payment');
      if (data.activated || data.already_active) {
        toast.success('Paiement confirmé — accès au tableau de bord…');
        // Hard reload so DashboardRouter re-evaluates with the fresh subscription_status from /auth/me
        setTimeout(() => window.location.reload(), 600);
      } else {
        toast.error(
          data.message || "Aucun paiement détecté pour le moment. Réessayez dans quelques secondes."
        );
        setVerifying(false);
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Erreur de vérification Stripe. Réessayez.');
      setVerifying(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-6">
      <div
        className="max-w-md w-full bg-[#121214] border border-[#27272A] rounded-2xl p-8 text-center"
        data-testid="subscription-required-gate"
      >
        <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <svg className="w-7 h-7 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 15v2m0 0v2m0-2h2m-2 0h-2m9-7a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Paiement requis</h2>
        <p className="text-sm text-zinc-400 mb-6">
          Vous devez finaliser votre souscription Stripe avant d'accéder au tableau de bord.
          L'essai de 30 jours est activé immédiatement après enregistrement de votre carte (débit 0€).
        </p>

        <a
          href={stripeUrl}
          className="block w-full h-12 leading-[48px] bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold rounded-xl transition-colors"
          data-testid="subscription-gate-stripe-btn"
        >
          Activer mon essai →
        </a>

        <button
          type="button"
          onClick={handleVerifyPayment}
          disabled={verifying}
          className="mt-3 w-full h-11 bg-transparent border border-[#27272A] hover:border-[#0066FF] hover:text-[#0066FF] text-zinc-300 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="subscription-gate-verify-btn"
        >
          {verifying ? 'Vérification en cours…' : "J'ai déjà payé — vérifier mon paiement"}
        </button>

        <p className="mt-4 text-[11px] text-zinc-600 leading-relaxed">
          Le bouton ci-dessus interroge Stripe directement et activera votre compte si un paiement est détecté.
        </p>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-5 text-xs text-zinc-500 hover:text-zinc-300"
          data-testid="subscription-gate-logout"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
};

export default SubscriptionGate;
