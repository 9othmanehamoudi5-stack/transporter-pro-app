import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import api from '../services/api';

const POLL_INTERVAL_MS = 4000;
const MAX_ATTEMPTS = 15; // ~60 seconds

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const { user, checkAuth } = useAuth();
  const [status, setStatus] = useState('checking'); // checking | activated | already_active | not_found | error
  const [attempts, setAttempts] = useState(0);
  const stoppedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let timer = null;

    const tick = async () => {
      if (cancelled || stoppedRef.current) return;
      try {
        const { data } = await api.post('/stripe/verify-payment');
        if (data.activated) {
          setStatus('activated');
          await checkAuth?.();
          toast.success('Abonnement activé — bienvenue !');
          stoppedRef.current = true;
          setTimeout(() => navigate('/dashboard', { replace: true }), 2000);
          return;
        }
        if (data.already_active) {
          setStatus('already_active');
          await checkAuth?.();
          stoppedRef.current = true;
          setTimeout(() => navigate('/dashboard', { replace: true }), 1500);
          return;
        }
        // Not found yet — keep polling
        setAttempts((a) => a + 1);
      } catch (e) {
        // network or stripe error — surface but keep retrying a bit
        setAttempts((a) => a + 1);
      }
    };

    // First call immediate
    tick();
    timer = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (attempts >= MAX_ATTEMPTS && status === 'checking') {
      setStatus('not_found');
      stoppedRef.current = true;
    }
  }, [attempts, status]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        {(status === 'checking') && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 bg-[#0066FF]/10 rounded-full flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-[#0066FF] animate-spin" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
              Activation en cours…
            </h1>
            <p className="text-zinc-400 mb-2">
              Nous confirmons votre paiement avec Stripe en ce moment. Cela prend généralement quelques secondes.
            </p>
            <p className="text-xs text-zinc-500 mb-8">Tentative {attempts}/{MAX_ATTEMPTS}</p>
          </>
        )}

        {(status === 'activated' || status === 'already_active') && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 bg-green-500/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
              Paiement confirmé !
            </h1>
            <p className="text-zinc-400 mb-2">
              Félicitations{user?.name ? `, ${user.name}` : ''} ! Votre abonnement Transporter-Pro est actif.
            </p>
            <p className="text-sm text-zinc-500 mb-8">
              Votre période d'essai de 30 jours commence maintenant. Redirection automatique…
            </p>
            <Button onClick={() => navigate('/dashboard')} className="bg-[#0066FF] hover:bg-[#0052CC] px-8 py-3" data-testid="go-to-dashboard-btn">
              Accéder au Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </>
        )}

        {(status === 'not_found') && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 bg-amber-500/10 rounded-full flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-amber-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">Paiement en attente</h1>
            <p className="text-zinc-400 mb-2">
              Nous n'avons pas encore reçu confirmation de votre paiement. Cela peut prendre 1 à 2 minutes selon votre banque.
            </p>
            <p className="text-sm text-zinc-500 mb-8">
              Réessayez dans un instant. Si le problème persiste, contactez le support.
            </p>
            <Button onClick={() => { stoppedRef.current = false; setAttempts(0); setStatus('checking'); }} className="bg-[#0066FF] hover:bg-[#0052CC] px-8 py-3 mr-2">
              Réessayer
            </Button>
            <Button onClick={() => navigate('/dashboard')} variant="outline" className="border-[#27272A] text-white">
              Aller au tableau de bord
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
