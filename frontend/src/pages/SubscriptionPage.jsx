import React, { useState } from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../i18n/index';
import { subscriptionApi } from '../services/api';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { 
  Check, Crown, Truck, Zap, Shield, Clock, 
  ChevronRight, Sparkles, Building2, Lock
} from 'lucide-react';
import { toast } from 'sonner';

const buildPlans = (t) => [
  {
    id: 'solo',
    name: t('subscription.plans.solo.name', 'SOLO'),
    description: t('subscription.plans.solo.description', 'Parfait pour démarrer'),
    monthlyPrice: 19,
    yearlyPrice: 190,
    features: [
      t('subscription.plans.solo.f1', "Jusqu'à 3 camions"),
      t('subscription.plans.solo.f2', 'Livraisons illimitées'),
      t('subscription.plans.solo.f3', 'Tracking client basique'),
      t('subscription.plans.solo.f4', 'Support email'),
    ],
    lockedFeatures: [
      t('subscription.plans.solo.lf1', 'Génération PDF e-CMR'),
      t('subscription.plans.solo.lf2', 'Carte GPS temps réel'),
      t('subscription.plans.solo.lf3', 'Dashboard Cash-Flow'),
      t('subscription.plans.solo.lf4', 'Scan Code-barre'),
    ],
    icon: Truck,
    popular: false,
  },
  {
    id: 'croissance',
    name: t('subscription.plans.croissance.name', 'CROISSANCE'),
    description: t('subscription.plans.croissance.description', 'Pour les PME en expansion'),
    monthlyPrice: 189,
    yearlyPrice: 1890,
    features: [
      t('subscription.plans.croissance.f1', "Jusqu'à 15 camions"),
      t('subscription.plans.croissance.f2', 'e-CMR PDF illimitées'),
      t('subscription.plans.croissance.f3', 'Carte GPS temps réel'),
      t('subscription.plans.croissance.f4', 'IA Anti-litige'),
      t('subscription.plans.croissance.f5', 'Cash-Flow Dashboard'),
      t('subscription.plans.croissance.f6', 'Score Éco-conduite'),
      t('subscription.plans.croissance.f7', 'Support prioritaire'),
    ],
    lockedFeatures: [
      t('subscription.plans.croissance.lf1', 'Scan Code-barre'),
      t('subscription.plans.croissance.lf2', 'Portail Client avancé'),
      t('subscription.plans.croissance.lf3', 'API Access'),
    ],
    icon: Zap,
    popular: true,
  },
  {
    id: 'flotte_pro',
    name: t('subscription.plans.flotte_pro.name', 'FLOTTE PRO'),
    description: t('subscription.plans.flotte_pro.description', 'Solution entreprise complète'),
    monthlyPrice: 489,
    yearlyPrice: 4890,
    features: [
      t('subscription.plans.flotte_pro.f1', 'Camions illimités'),
      t('subscription.plans.flotte_pro.f2', 'Toutes fonctionnalités'),
      t('subscription.plans.flotte_pro.f3', 'Scan Code-barre'),
      t('subscription.plans.flotte_pro.f4', 'Portail Client avancé'),
      t('subscription.plans.flotte_pro.f5', 'API Access complet'),
      t('subscription.plans.flotte_pro.f6', 'Carte Temps Réel'),
      t('subscription.plans.flotte_pro.f7', 'Support 24/7'),
      t('subscription.plans.flotte_pro.f8', 'Manager dédié'),
    ],
    lockedFeatures: [],
    icon: Building2,
    popular: false,
  },
];

export const SubscriptionPage = () => {
  const { t } = useI18n();
  const [isYearly, setIsYearly] = useState(false);
  const [updating, setUpdating] = useState(false);
  const { plan: currentPlan, loading } = useSubscription();
  const { user } = useAuth();
  const PLANS = buildPlans(t);

  const handleSelectPlan = async (planId) => {
    if (!user) {
      toast.error(t('toasts.loginRequired', 'Veuillez vous connecter pour changer de plan'));
      return;
    }

    if (currentPlan === planId) {
      toast.info(t('toasts.alreadyOnPlan', 'Vous êtes déjà sur ce plan'));
      return;
    }

    setUpdating(true);
    try {
      // Redirect to Stripe Checkout — plan is only persisted after webhook confirms payment
      const res = await subscriptionApi.createCheckout(planId, isYearly ? 'yearly' : 'monthly');
      const url = res?.data?.url;
      if (!url) throw new Error('Checkout URL missing');
      toast.success(t('toasts.redirectingStripe', 'Redirection vers le paiement sécurisé Stripe…'));
      window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(`${t('toasts.error', 'Erreur')} : ${error.response?.data?.detail || error.message}`);
      setUpdating(false);
    }
  };

  const savings = (monthly, yearly) => {
    const yearlySavings = (monthly * 12) - yearly;
    return Math.round((yearlySavings / (monthly * 12)) * 100);
  };

  const getPlanBadgeColor = (planId) => {
    switch(planId) {
      case 'solo': return 'bg-zinc-600';
      case 'croissance': return 'bg-[#0066FF]';
      case 'flotte_pro': return 'bg-gradient-to-r from-yellow-500 to-orange-500';
      default: return 'bg-zinc-600';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">{t('subscription.title', 'Mon Abonnement')}</h2>
        <p className="text-zinc-400">{t('subscription.subtitle', 'Choisissez le plan qui correspond à votre flotte')}</p>
      </div>

      {/* Current Status */}
      {currentPlan && (
        <div className="bg-[#0066FF]/10 border border-[#0066FF]/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown className="w-6 h-6 text-[#0066FF]" />
              <div>
                <p className="font-semibold">
                  {t('subscription.currentPlan', 'Plan actuel')} : {PLANS.find(p => p.id === currentPlan)?.name || currentPlan}
                </p>
                <p className="text-sm text-zinc-400">
                  {t('subscription.billingCycle', 'Facturation')} {isYearly ? t('subscription.billingYearly', 'annuelle') : t('subscription.billingMonthly', 'mensuelle')}
                </p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm text-white ${getPlanBadgeColor(currentPlan)}`}>
              {t('subscription.active', 'Actif')}
            </span>
          </div>
        </div>
      )}

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4">
        <span className={`font-medium ${!isYearly ? 'text-white' : 'text-zinc-400'}`}>
          {t('subscription.monthly', 'Mensuel')}
        </span>
        <Switch
          checked={isYearly}
          onCheckedChange={setIsYearly}
          className="data-[state=checked]:bg-[#0066FF]"
          data-testid="billing-toggle"
        />
        <span className={`font-medium ${isYearly ? 'text-white' : 'text-zinc-400'}`}>
          {t('subscription.yearly', 'Annuel')}
        </span>
        <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-sm font-medium">
          {t('subscription.saveYear', '-20% (2 mois offerts)')}
        </span>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const isCurrentPlan = currentPlan === plan.id;
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
                    {t('subscription.popular', 'POPULAIRE')}
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
                  {isYearly ? t('subscription.perYear', '/an') : t('subscription.perMonth', '/mois')}
                </p>
                {isYearly && (
                  <p className="text-xs text-green-400 mt-1">
                    {t('subscription.save', 'Économisez {percent}%').replace('{percent}', savings(plan.monthlyPrice, plan.yearlyPrice))}
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-4">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Locked Features */}
              {plan.lockedFeatures && plan.lockedFeatures.length > 0 && (
                <ul className="space-y-2 mb-6 pt-3 border-t border-[#27272A]">
                  {plan.lockedFeatures.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-sm text-zinc-500">
                      <Lock className="w-4 h-4 flex-shrink-0" />
                      <span className="line-through">{feature}</span>
                    </li>
                  ))}
                </ul>
              )}

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
                    {t('subscription.currentPlanBtn', 'Plan actuel')}
                  </>
                ) : (
                  <>
                    {t('subscription.selectPlan', 'Choisir ce plan')}
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
        <h3 className="text-lg font-semibold mb-4">{t('subscription.whyUpgrade', 'Pourquoi passer au plan supérieur ?')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-[#1A1A1E] rounded-lg">
            <Shield className="w-8 h-8 text-[#0066FF] mb-3" />
            <h4 className="font-semibold mb-1">{t('subscription.upgrade1Title', 'IA Anti-litige')}</h4>
            <p className="text-sm text-zinc-400">{t('subscription.upgrade1Desc', "Protégez-vous des fausses réclamations avec l'analyse photo automatique")}</p>
          </div>
          <div className="p-4 bg-[#1A1A1E] rounded-lg">
            <Zap className="w-8 h-8 text-yellow-400 mb-3" />
            <h4 className="font-semibold mb-1">{t('subscription.upgrade2Title', 'Cash-Flow Instantané')}</h4>
            <p className="text-sm text-zinc-400">{t('subscription.upgrade2Desc', "Facturez à la seconde et suivez l'argent bloqué en temps réel")}</p>
          </div>
          <div className="p-4 bg-[#1A1A1E] rounded-lg">
            <Clock className="w-8 h-8 text-green-400 mb-3" />
            <h4 className="font-semibold mb-1">{t('subscription.upgrade3Title', 'Support Prioritaire')}</h4>
            <p className="text-sm text-zinc-400">{t('subscription.upgrade3Desc', 'Assistance dédiée pour résoudre vos problèmes rapidement')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
