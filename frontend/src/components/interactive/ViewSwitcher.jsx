import React, { useState } from 'react';
import { LayoutDashboard, Box, Sparkles, Info, ShieldCheck, Lock } from 'lucide-react';
import { settingsApi } from '../../services/api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';

/**
 * ViewSwitcher
 * Sélecteur Vue Classique / Vue Interactive (3D)
 * Strictement affiché dans la Vue d'ensemble
 * - Analyse flotte :
 *   • 1 à 5 chauffeurs : Tableau classique recommandé (missions maîtrisées)
 *   • 6 à 15 chauffeurs : Supervision spatiale recommandée pour le dispatcheur
 *   • 16+ chauffeurs : Incluse nativement (Flotte Pro)
 */
export const ViewSwitcher = ({ 
  currentView = 'classic', 
  onViewChange, 
  disabled = false, 
  className = '',
  driversCount = 6,
  userPlan = 'croissance',
  isDemo = true
}) => {
  const [syncing, setSyncing] = useState(false);
  const [showTierInfo, setShowTierInfo] = useState(false);

  // Condition d'accès selon la taille de flotte et l'offre
  // 1-3 camions : Option non requise / tableau suffit
  // 4-15 camions : Option payante dispatcheur (ou démo active)
  // 16+ camions : Incluse nativement
  const isTierEligible = isDemo || driversCount >= 4 || userPlan === 'croissance' || userPlan === 'flotte_pro';

  const handleSelect = async (view) => {
    if (view === currentView || disabled || syncing) return;

    if (view === 'interactive' && !isTierEligible) {
      setShowTierInfo(true);
      return;
    }

    // Détection petits écrans pour informer l'utilisateur
    if (view === 'interactive' && typeof window !== 'undefined' && window.innerWidth < 768) {
      toast.info('Affichage 3D adapté pour mobile. La vue classique reste recommandée sur petit écran.', {
        duration: 3500
      });
    }

    onViewChange(view);

    // Sauvegarde persistante côté serveur si disponible
    setSyncing(true);
    try {
      await settingsApi.updatePreferences({ preferred_view: view });
    } catch (err) {
      // Ignorer l'erreur réseau en mode démo / hors ligne
    } finally {
      setSyncing(false);
    }
  };

  return (
    <>
      <div
        role="group"
        aria-label="Mode d'affichage du tableau de bord"
        className={`inline-flex items-center p-1 bg-[#121214] border border-[#27272A] rounded-xl shadow-inner ${className}`}
      >
        {/* Option Vue Classique */}
        <button
          type="button"
          role="tab"
          aria-selected={currentView === 'classic'}
          aria-label="Activer la vue classique avec tableaux et listes"
          onClick={() => handleSelect('classic')}
          disabled={disabled}
          data-testid="view-switcher-classic"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF] ${
            currentView === 'classic'
              ? 'bg-[#27272A] text-white shadow-sm font-semibold'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1A1A1E]'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Classique</span>
        </button>

        {/* Option Vue Interactive 3D */}
        <button
          type="button"
          role="tab"
          aria-selected={currentView === 'interactive'}
          aria-label="Activer la vue interactive 3D du dépôt et de la flotte"
          onClick={() => handleSelect('interactive')}
          disabled={disabled}
          data-testid="view-switcher-interactive"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF] ${
            currentView === 'interactive'
              ? 'bg-gradient-to-r from-[#0066FF] to-blue-600 text-white shadow-md shadow-blue-500/25 font-semibold'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1A1A1E]'
          }`}
        >
          <Box className={`w-3.5 h-3.5 ${currentView === 'interactive' ? 'animate-pulse' : ''}`} />
          <span>Vue 3D</span>
          <span className="hidden sm:inline-flex items-center text-[9px] px-1.5 py-0.2 rounded bg-white/20 font-bold uppercase tracking-wider">
            Live
          </span>
        </button>

        {/* Bouton Info Utilité Flotte */}
        <button
          type="button"
          onClick={() => setShowTierInfo(true)}
          title="Guide d'utilité selon la taille de votre flotte"
          className="p-1.5 ml-0.5 text-zinc-500 hover:text-zinc-300 rounded-lg hover:bg-[#1A1A1E] transition-colors"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Modal Analyse Utilité Flotte & Offre 3D */}
      <Dialog open={showTierInfo} onOpenChange={setShowTierInfo}>
        <DialogContent className="bg-[#121214] border border-[#27272A] text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Box className="w-5 h-5 text-[#0066FF]" />
              Supervision Spatiale 3D : Guide Flotte
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Pertinence et modèle tarifaire selon le nombre de camions actifs
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            {/* Tier 1: 1 à 5 camions */}
            <div className="p-3 rounded-xl bg-[#1A1A1E] border border-[#27272A]">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-zinc-200">1 à 5 Chauffeurs (Solo)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                  Utilité Faible • Tableau Recommandé
                </span>
              </div>
              <p className="text-zinc-400">
                Le dirigeant connaît chaque mission au cas par cas. La vue classique en tableau est plus rapide et plus dense.
              </p>
            </div>

            {/* Tier 2: 6 à 15 camions */}
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-blue-300">6 à 15 Chauffeurs (Croissance)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/40 font-semibold">
                  Utilité Forte • Dispatcheur
                </span>
              </div>
              <p className="text-zinc-300">
                Vue d'ensemble indispensable : repérage instantané des retards, des camions aux quais et des factures prêtes. Option activable dès 4 camions.
              </p>
            </div>

            {/* Tier 3: 16+ camions */}
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-emerald-300">16+ Chauffeurs (Flotte Pro)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-semibold">
                  Incluse d'office
                </span>
              </div>
              <p className="text-zinc-300">
                Supervision temps réel multi-dépôts avec télématique continue, alertes de surcharge et contrôle visuel du BFR.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Mode actuel : <strong>Démonstration active ({driversCount} camions)</strong>. La vue 3D interactive est 100% accessible.
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ViewSwitcher;
