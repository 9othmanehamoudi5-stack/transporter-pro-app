import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    toast.success('Félicitations ! Votre période d\'essai de 30 jours est activée.');
    const timer = setTimeout(() => {
      navigate('/dashboard', { replace: true });
    }, 5000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-green-500/10 rounded-full flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-green-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
          Paiement confirmé !
        </h1>
        <p className="text-zinc-400 mb-2">
          Félicitations{user?.name ? `, ${user.name}` : ''} ! Votre abonnement Transporter-Pro est maintenant actif.
        </p>
        <p className="text-sm text-zinc-500 mb-8">
          Votre période d'essai de 30 jours commence maintenant. Vous serez redirigé automatiquement...
        </p>
        <Button
          onClick={() => navigate('/dashboard')}
          className="bg-[#0066FF] hover:bg-[#0052CC] px-8 py-3"
          data-testid="go-to-dashboard-btn"
        >
          Accéder au Dashboard
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
