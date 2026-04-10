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
      ecoScore: false
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
      apiAccess: false
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
      apiAccess: true
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
  ecoScore: 'Score Éco-conduite disponible dans le pack Croissance'
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
  const [subscription, setSubscription] = useState({
    plan: 'solo',
    loading: true,
    error: null
  });

  // Load subscription from MongoDB backend (primary source of truth)
  useEffect(() => {
    if (!user?.id || user?.role !== 'admin') {
      setSubscription({ plan: 'solo', loading: false, error: null });
      return;
    }

    const loadPlan = async () => {
      try {
        const res = await subscriptionApi.getCurrent();
        const plan = res.data?.plan || 'solo';
        setSubscription({ plan, loading: false, error: null });
      } catch (err) {
        console.warn('Failed to load subscription from backend:', err.message);
        setSubscription({ plan: 'solo', loading: false, error: null });
      }
    };

    loadPlan();
  }, [user?.id, user?.role]);

  // Update plan: MongoDB primary + Firestore sync (non-blocking)
  const updatePlan = useCallback(async (newPlan, billingCycle = 'monthly') => {
    if (!user?.id) {
      return { success: false, error: 'Non connecté' };
    }

    try {
      // Save to MongoDB backend (primary)
      await subscriptionApi.update({ plan: newPlan, billing_cycle: billingCycle });

      // Update local state immediately
      setSubscription(prev => ({ ...prev, plan: newPlan }));

      // Sync to Firestore (non-blocking)
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
    const planFeatures = PLAN_FEATURES[subscription.plan]?.features || {};
    return planFeatures[featureName] === true;
  }, [subscription.plan]);

  const getRestrictionMessage = useCallback((featureName) => {
    return RESTRICTION_MESSAGES[featureName] || 'Fonctionnalité non disponible dans votre plan';
  }, []);

  const getPlanInfo = useCallback(() => {
    return PLAN_FEATURES[subscription.plan] || PLAN_FEATURES.solo;
  }, [subscription.plan]);

  const canAccessPage = useCallback((pageName) => {
    const pageRequirements = {
      'cashflow': 'cashFlowDashboard',
      'eco': 'ecoScore',
      'livemap': 'gpsMap',
      'litiges': 'basicDeliveries',
      'drivers': 'basicDeliveries',
      'deliveries': 'basicDeliveries',
      'subscription': 'basicDeliveries'
    };
    const requiredFeature = pageRequirements[pageName];
    if (!requiredFeature) return true;
    return hasFeature(requiredFeature);
  }, [hasFeature]);

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
