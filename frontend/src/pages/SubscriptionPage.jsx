import React, { useState, useEffect } from 'react';
import { subscriptionApi } from '../services/api';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { 
  Check, Crown, Truck, Zap, Shield, Clock, 
  ChevronRight, Sparkles, Building2
} from 'lucide-react';
import { toast } from 'sonner';

const PLANS = [
  {
    id: 'solo',
    name: 'SOLO / DUO',
    description: 'Parfait pour démarrer',
    monthlyPrice: 49,
    yearlyPrice: 490,
    features: [
      'Jusqu\'à 3 camions',
      'e-CMR illimitées',
      'Tracking client',
      'Support email'
    ],
    icon: Truck,
    popular: false
  },
  {
    id: 'croissance',
    name: 'CROISSANCE',
    description: 'Pour les PME en expansion',
    monthlyPrice: 199,
    yearlyPrice: 1990,
    features: [
      'Jusqu\'à 15 camions',
      'e-CMR illimitées',
      'IA Anti-litige',
      'Cash-Flow Dashboard',
      'Support prioritaire'
    ],
    icon: Zap,
    popular: true
  },
  {
    id: 'flotte_pro',
    name: 'FLOTTE PRO',
    description: 'Solution entreprise complète',
    monthlyPrice: 499,
    yearlyPrice: 4990,
    features: [
      'Camions illimités',
      'IA Anti-litige avancée',
      'Cash-Flow Dashboard',
      'Score Éco-conduite',
      'Support 24/7',
      'API Access',
      'Manager dédié'
    ],
    icon: Building2,
    popular: false
  }
];

export const SubscriptionPage = () => {
  const [isYearly, setIsYearly] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchCurrentPlan();
  }, []);

  const fetchCurrentPlan = async () => {
    try {
      const response = await subscriptionApi.getCurrent();
      setCurrentPlan(response.data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
    setLoading(false);
  };

  const handleSelectPlan = async (planId) => {
    if (currentPlan?.plan === planId && 
        currentPlan?.billing_cycle === (isYearly ? 'yearly' : 'monthly')) {
      toast.info('Vous êtes déjà sur ce plan');
      return;
    }

    setUpdating(true);
    try {
      await subscriptionApi.update({
        plan: planId,
        billing_cycle: isYearly ? 'yearly' : 'monthly'
      });
      toast.success('Abonnement mis à jour !');
      fetchCurrentPlan();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
    setUpdating(false);
  };

  const savings = (monthly, yearly) => {
    const yearlySavings = (monthly * 12) - yearly;
    return Math.round((yearlySavings / (monthly * 12)) * 100);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Mon Abonnement</h2>
        <p className="text-zinc-400">Choisissez le plan qui correspond à votre flotte</p>
      </div>

      {/* Current Status */}
      {currentPlan && (
        <div className="bg-[#0066FF]/10 border border-[#0066FF]/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown className="w-6 h-6 text-[#0066FF]" />
              <div>
                <p className="font-semibold">Plan actuel : {PLANS.find(p => p.id === currentPlan.plan)?.name || currentPlan.plan}</p>
                <p className="text-sm text-zinc-400">
                  {currentPlan.status === 'trial' 
                    ? `Essai gratuit - expire le ${new Date(currentPlan.trial_ends).toLocaleDateString('fr-FR')}`
                    : `Facturation ${currentPlan.billing_cycle === 'yearly' ? 'annuelle' : 'mensuelle'}`
                  }
                </p>
              </div>
            </div>
            {currentPlan.status !== 'trial' && (
              <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-sm">
                Actif
              </span>
            )}
          </div>
        </div>
      )}

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4">
        <span className={`font-medium ${!isYearly ? 'text-white' : 'text-zinc-400'}`}>
          Mensuel
        </span>
        <Switch
          checked={isYearly}
          onCheckedChange={setIsYearly}
          className="data-[state=checked]:bg-[#0066FF]"
          data-testid="billing-toggle"
        />
        <span className={`font-medium ${isYearly ? 'text-white' : 'text-zinc-400'}`}>
          Annuel
        </span>
        <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-sm font-medium">
          -20% (2 mois offerts)
        </span>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const isCurrentPlan = currentPlan?.plan === plan.id;
          const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
          const Icon = plan.icon;

          return (
            <div 
              key={plan.id}
              className={`relative bg-[#121214] border rounded-2xl p-6 transition-all ${
                plan.popular 
                  ? 'border-[#0066FF] ring-1 ring-[#0066FF]' 
                  : 'border-[#27272A] hover:border-zinc-600'
              }`}
              data-testid={`plan-${plan.id}`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 bg-[#0066FF] text-white text-xs font-semibold rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    POPULAIRE
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6">
                <div className={`w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center ${
                  plan.popular ? 'bg-[#0066FF]' : 'bg-[#1A1A1E]'
                }`}>
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <p className="text-sm text-zinc-400">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold">{price}</span>
                  <span className="text-zinc-400">€</span>
                </div>
                <p className="text-sm text-zinc-400">
                  {isYearly ? '/an' : '/mois'}
                </p>
                {isYearly && (
                  <p className="text-xs text-green-400 mt-1">
                    Économisez {savings(plan.monthlyPrice, plan.yearlyPrice)}%
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Button
                onClick={() => handleSelectPlan(plan.id)}
                disabled={updating || loading}
                className={`w-full h-12 font-semibold ${
                  isCurrentPlan
                    ? 'bg-green-600 hover:bg-green-700'
                    : plan.popular
                      ? 'bg-[#0066FF] hover:bg-[#0052CC]'
                      : 'bg-[#1A1A1E] hover:bg-[#27272A] border border-[#27272A]'
                }`}
                data-testid={`select-plan-${plan.id}`}
              >
                {isCurrentPlan ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Plan actuel
                  </>
                ) : (
                  <>
                    Choisir ce plan
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Features Comparison */}
      <div className="bg-[#121214] border border-[#27272A] rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Pourquoi passer au plan supérieur ?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-[#1A1A1E] rounded-lg">
            <Shield className="w-8 h-8 text-[#0066FF] mb-3" />
            <h4 className="font-semibold mb-1">IA Anti-litige</h4>
            <p className="text-sm text-zinc-400">Protégez-vous des fausses réclamations avec l'analyse photo automatique</p>
          </div>
          <div className="p-4 bg-[#1A1A1E] rounded-lg">
            <Zap className="w-8 h-8 text-yellow-400 mb-3" />
            <h4 className="font-semibold mb-1">Cash-Flow Instantané</h4>
            <p className="text-sm text-zinc-400">Facturez à la seconde et suivez l'argent bloqué en temps réel</p>
          </div>
          <div className="p-4 bg-[#1A1A1E] rounded-lg">
            <Clock className="w-8 h-8 text-green-400 mb-3" />
            <h4 className="font-semibold mb-1">Support Prioritaire</h4>
            <p className="text-sm text-zinc-400">Assistance dédiée pour résoudre vos problèmes rapidement</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
