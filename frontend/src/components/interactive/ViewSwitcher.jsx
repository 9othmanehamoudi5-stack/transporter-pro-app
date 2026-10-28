import React, { useState } from 'react';
import { LayoutDashboard, Box, Sparkles } from 'lucide-react';
import { settingsApi } from '../../services/api';
import { toast } from 'sonner';

/**
 * ViewSwitcher
 * Sélecteur Vue Classique / Vue Interactive (3D)
 * - Rendu accessible (navigation clavier, rôles ARIA)
 * - Persistance serveur (PATCH /api/settings/preferences) + mise à jour optimiste
 * - Détection grand écran / mobile pour confort utilisateur
 */
export const ViewSwitcher = ({ currentView = 'classic', onViewChange, disabled = false, className = '' }) => {
  const [syncing, setSyncing] = useState(false);

  const handleSelect = async (view) => {
    if (view === currentView || disabled || syncing) return;

    // Détection petits écrans pour informer l'utilisateur
    if (view === 'interactive' && typeof window !== 'undefined' && window.innerWidth < 768) {
      toast.info('Affichage 3D adapté pour mobile. La vue classique reste recommandée sur petit écran.', {
        duration: 3500
      });
    }

    // Mise à jour optimiste immédiate (aucun lag perçu)
    onViewChange(view);

    // Sauvegarde persistante côté serveur (MongoDB via backend)
    setSyncing(true);
    try {
      await settingsApi.updatePreferences({ preferred_view: view });
    } catch (err) {
      console.warn('Impossible de persister la préférence de vue côté serveur:', err);
      // On ne rollback pas pour ne pas frustrer l'utilisateur, la session reste sur son choix
    } finally {
      setSyncing(false);
    }
  };

  return (
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
    </div>
  );
};

export default ViewSwitcher;
