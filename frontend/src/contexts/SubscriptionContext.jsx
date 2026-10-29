import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './AuthContext';
import { subscriptionApi } from '../services/api';

const SubscriptionContext = createContext(null);

const PLAN_FEATURES = {
  solo: {
    name: 'SOLO / DUO',
    badge: 'Solo',
    color: 'bg-zinc-600',
    features: {
      basicDeliveries: true,
      assignDrivers: true,
      tracking: true,
      pdfGeneration: false,
      gpsMap: false,
      scanBarcode: false,
      cashFlowDashboard: false,
      clientPortal: false,
      apiAccess: false,
      ecoScore: false,
      interactive3D: false
    }
  },
  starter: {
    name: 'STARTER',
    badge: 'Starter',
    color: 'bg-zinc-600',
    features: {
      basicDeliveries: true,
      assignDrivers: true,
      tracking: true,
      pdfGeneration: false,
      gpsMap: false,
      scanBarcode: false,
      cashFlowDashboard: false,
      clientPortal: false,
      apiAccess: false,
      ecoScore: false,
      interactive3D: false
    }
  },
  croissance: {
    name: 'CROISSANCE',
    badge: 'Croissance',
    color: 'bg-[#0066FF]',
    features: {
      basicDeliveries: true,
      assignDrivers: true,
      tracking: true,
      pdfGeneration: true,
      gpsMap: true,
      cashFlowDashboard: true,
      ecoScore: true,
      scanBarcode: false,
      clientPortal: false,
      apiAccess: false,
      interactive3D: true
    }
  },
  pme: {
    name: 'PME',
    badge: 'PME',
    color: 'bg-[#0066FF]',
    features: {
      basicDeliveries: true,
      assignDrivers: true,
      tracking: true,
      pdfGeneration: true,
      gpsMap: true,
      cashFlowDashboard: true,
      ecoScore: true,
      scanBarcode: false,
      clientPortal: false,
      apiAccess: false,
      interactive3D: true
    }
  },
  flotte_pro: {
    name: 'FLOTTE PRO',
    badge: 'Pro',
    color: 'bg-gradient-to-r from-yellow-500 to-orange-500',
    features: {
      basicDeliveries: true,
      assignDrivers: true,
      tracking: true,
      pdfGeneration: true,
      gpsMap: true,
      cashFlowDashboard: true,
      ecoScore: true,
      scanBarcode: true,
      clientPortal: true,
      apiAccess: true,
      interactive3D: true
    }
  },
  flotte: {
    name: 'FLOTTE',
    badge: 'Pro',
    color: 'bg-gradient-to-r from-yellow-500 to-orange-500',
    features: {
      basicDeliveries: true,
      assignDrivers: true,
      tracking: true,
      pdfGeneration: true,
      gpsMap: true,
      cashFlowDashboard: true,
      ecoScore: true,
      scanBarcode: true,
      clientPortal: true,
      apiAccess: true,
      interactive3D: true
    }
  }
};

const RESTRICTION_MESSAGES = {
  pdfGeneration: 'Génération PDF disponible dans le pack Croissance',
  gpsMap: 'Carte GPS Live disponible dans le pack Croissance',
  scanBarcode: 'Scan Code-barre disponible dans le pack Flotte Pro',
  cashFlowDashboard: 'Dashboard Cash-Flow disponible dans le pack Croissance',
  clientPortal: 'Portail Client disponible dans le pack Flotte Pro',
  apiAccess: 'Accès API disponible dans le pack Flotte Pro',
  ecoScore: 'Score éco-conduite disponible dans le pack Croissance',
  interactive3D: 'La Vue 3D interactive est réservée aux flottes à partir de 4 camions (Pack Croissance & Flotte Pro)'
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider = ({ children }) => {
  const { user } = useAuth();
  const initialPlan = user?.plan || 'flotte_pro';
  const [subscription, setSubscription] = useState({
    plan: initialPlan,
    loading: false,
    error: null
  });

  useEffect(() => {
    if (!user?.id || user?.role !== 'admin') {
      setSubscription({ plan: user?.plan || 'flotte_pro', loading: false, error: null });
      return;
    }

    if (user?.is_demo) {
      setSubscription({ plan: 'flotte_pro', loading: false, error: null });
      return;
    }

    const loadPlan = async () => {
      try {
        const res = await subscriptionApi.getCurrent();
        const plan = res.data?.plan || user?.plan || 'flotte_pro';
        setSubscription({ plan, loading: false, error: null });
      } catch (err) {
        console.warn('Backend subscription unavailable, using active plan:', err.message);
        setSubscription({ plan: user?.plan || 'flotte_pro', loading: false, error: null });
      }
    };

    loadPlan();
  }, [user?.id, user?.role, user?.plan, user?.is_demo]);

  const updatePlan = useCallback(async (newPlan, billingCycle = 'monthly') => {
    if (!user?.id) {
      return { success: false, error: 'Non connecté' };
    }

    try {
      await subscriptionApi.update({ plan: newPlan, billing_cycle: billingCycle });
      setSubscription(prev => ({ ...prev, plan: newPlan }));

      try {
        const docRef = doc(db, 'entreprises', user.id);
        await setDoc(docRef, {
          subscriptionPlan: newPlan,
          userId: user.id,
          email: user.email,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (firestoreErr) {
        console.warn('Firestore sync failed (non-blocking):', firestoreErr.message);
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating plan:', error);
      return { success: false, error: error.response?.status === 401 ? 'Session expirée' : error.message };
    }
  }, [user?.id, user?.email]);

  const hasFeature = useCallback((featureName) => {
    if (user?.is_demo) return true;
    const planKey = subscription.plan || 'flotte_pro';
    const planFeatures = PLAN_FEATURES[planKey]?.features || PLAN_FEATURES.flotte_pro.features;
    return planFeatures[featureName] === true;
  }, [subscription.plan, user?.is_demo]);

  const getRestrictionMessage = useCallback((featureName) => {
    return RESTRICTION_MESSAGES[featureName] || 'Fonctionnalité non disponible dans votre plan';
  }, []);

  const getPlanInfo = useCallback(() => {
    const planKey = subscription.plan || 'flotte_pro';
    return PLAN_FEATURES[planKey] || PLAN_FEATURES.flotte_pro;
  }, [subscription.plan]);

  const canAccessPage = useCallback((pageName) => {
    if (user?.is_demo) return true;
    const pageRequirements = {
      'cashflow': 'cashFlowDashboard',
      'eco': 'ecoScore',
      'livemap': 'gpsMap',
      'litiges': 'basicDeliveries',
      'drivers': 'basicDeliveries',
      'deliveries': 'basicDeliveries',
      'subscription': 'basicDeliveries',
      'settings': 'basicDeliveries'
    };
    const requiredFeature = pageRequirements[pageName];
    if (!requiredFeature) return true;
    return hasFeature(requiredFeature);
  }, [hasFeature, user?.is_demo]);

  return (
    <SubscriptionContext.Provider value={{
      subscription,
      plan: subscription.plan,
      loading: subscription.loading,
      updatePlan,
      hasFeature,
      getRestrictionMessage,
      getPlanInfo,
      canAccessPage,
      PLAN_FEATURES
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export { PLAN_FEATURES, RESTRICTION_MESSAGES };
