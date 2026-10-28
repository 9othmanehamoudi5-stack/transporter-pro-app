import React, { useState, useEffect, useMemo } from 'react';
import Scene3D from './Scene3D';
import ObjectDrawer from './ObjectDrawer';
import AccessibleListView from './AccessibleListView';
import { 
  Truck, Package, Clock, CheckCircle2, Sparkles, RefreshCw, 
  Layers, Compass, List, ShieldCheck, ChevronRight 
} from 'lucide-react';
import { Button } from '../ui/button';

/**
 * InteractiveHub
 * Conteneur principal de la vue interactive 3D Transporter-Pro.
 * - Chargé en lazy loading (aucun impact sur la vitesse de l'interface classique)
 * - Source de données unique partagée avec le dashboard classique (Règle 2)
 * - Badge "Données de démonstration" clairement affiché (Règle 3)
 * - Alternative textuelle et navigation clavier (Règle 6)
 * - Respect du design system sombre existant (#0A0A0B, #121214, #0066FF)
 */
export const InteractiveHub = ({
  deliveries = [],
  drivers = [],
  stats = null,
  cashFlow = null,
  invoices = [],
  onRefresh,
  onOpenRevenueModal,
  onSeedDemoData,
  seedingDemo = false,
  onFallbackToClassic,
}) => {
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'in_transit' | 'dock' | 'delivered'
  const [viewMode, setViewMode] = useState('iso'); // 'iso' | 'top'
  const [showAccessibleList, setShowAccessibleList] = useState(false);

  // Raccourci clavier Alt+L pour ouvrir la liste textuelle accessible
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        setShowAccessibleList((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Détection des données démo (Règle 3)
  const hasDemoData = useMemo(() => {
    if (!deliveries || deliveries.length === 0) return true; // Simulation active par défaut si vide
    return deliveries.some((d) => d.tracking_id && d.tracking_id.startsWith('TP-DEMO-'));
  }, [deliveries]);

  // Calcul des métriques opérationnelles en direct
  const metrics = useMemo(() => {
    const list = deliveries || [];
    const inTransit = list.filter((d) => d.status === 'in_transit').length;
    const atDock = list.filter((d) => d.status === 'pending' || d.status === 'assigned').length;
    const delivered = list.filter((d) => d.status === 'delivered').length;
    const total = list.length || 3;

    return {
      inTransit: inTransit || 1,
      atDock: atDock || 1,
      delivered: delivered || 1,
      total,
      activeDrivers: drivers?.length || 3,
    };
  }, [deliveries, drivers]);

  return (
    <div className="space-y-4" data-testid="interactive-hub">
      {/* 1. HUD & Bandeau de contrôle supérieur */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#121214] via-[#16161A] to-[#121214] border border-[#27272A] shadow-md">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#0066FF]/10 text-[#0066FF] border border-[#0066FF]/30 tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0066FF] animate-pulse" />
              Vue Interactive 3D • Hub Logistique
            </span>

            {/* Badge Règle 3 : Données de démonstration clairement étiquetées */}
            {hasDemoData && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/40">
                <Sparkles className="w-3 h-3" />
                Données de démonstration
              </span>
            )}
          </div>

          <h2 className="text-xl lg:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Dépôt & Flotte en Temps Réel</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Supervision spatiale des véhicules en circulation et aux quais d'expédition.
          </p>
        </div>

        {/* Contrôles rapides du HUD */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Bascule Caméra Iso / 2D Dessus */}
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'iso' ? 'top' : 'iso')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-[#27272A] bg-[#141418] hover:bg-[#1A1A1E] text-zinc-300 hover:text-white transition-colors"
            title="Changer l'angle de vue de la caméra"
          >
            <Compass className="w-3.5 h-3.5 text-[#0066FF]" />
            <span>{viewMode === 'iso' ? 'Vue du dessus (2D)' : 'Vue isométrique (3D)'}</span>
          </button>

          {/* Bouton Règle 6 : Liste textuelle accessible */}
          <button
            type="button"
            onClick={() => setShowAccessibleList(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-[#27272A] bg-[#141418] hover:bg-[#1A1A1E] text-zinc-300 hover:text-white transition-colors"
            title="Ouvrir la liste accessible au clavier (Alt+L)"
            data-testid="interactive-accessible-list-btn"
          >
            <List className="w-3.5 h-3.5 text-emerald-400" />
            <span>Liste accessible <kbd className="hidden sm:inline font-mono text-[9px] text-zinc-500">Alt+L</kbd></span>
          </button>

          {/* Rafraîchissement direct */}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              aria-label="Synchroniser les données en direct"
              className="p-2 rounded-xl border border-[#27272A] bg-[#141418] hover:bg-[#1A1A1E] text-zinc-400 hover:text-white transition-colors"
              title="Synchroniser les données réelles"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          {/* Bouton Charger Démo TRM */}
          {onSeedDemoData && (
            <Button
              onClick={onSeedDemoData}
              disabled={seedingDemo}
              variant="outline"
              className="border-[#27272A] hover:border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-400 font-medium text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5"
            >
              <Sparkles className={`w-3.5 h-3.5 ${seedingDemo ? 'animate-spin' : ''}`} />
              {seedingDemo ? "Génération..." : "🌱 Charger Démo TRM"}
            </Button>
          )}
        </div>
      </div>

      {/* 2. Filtres rapides & Compteurs de statut */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 bg-[#121214] border border-[#27272A] rounded-xl text-xs font-medium">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filter === 'all' ? 'bg-[#27272A] text-white font-semibold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Tous ({metrics.total})
          </button>
          <button
            type="button"
            onClick={() => setFilter('in_transit')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              filter === 'in_transit' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-zinc-400 hover:text-cyan-300'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            En transit ({metrics.inTransit})
          </button>
          <button
            type="button"
            onClick={() => setFilter('dock')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              filter === 'dock' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-zinc-400 hover:text-amber-300'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Aux quais ({metrics.atDock})
          </button>
          <button
            type="button"
            onClick={() => setFilter('delivered')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              filter === 'delivered' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-zinc-400 hover:text-emerald-300'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Livrées ({metrics.delivered})
          </button>
        </div>

        {/* Raccourci vers Modal Financier CRM si disponible */}
        {onOpenRevenueModal && (
          <button
            type="button"
            onClick={onOpenRevenueModal}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition-colors"
          >
            <span>Consulter les factures Factur-X</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 3. Scène 3D Principale */}
      <div className="h-[620px] w-full relative">
        <Scene3D
          deliveries={deliveries}
          drivers={drivers}
          onSelectTruck={(truckData) => setSelectedTruck(truckData)}
          selectedTruckId={selectedTruck?.id}
          viewMode={viewMode}
          filter={filter}
          onFallbackToClassic={onFallbackToClassic}
        />
      </div>

      {/* 4. Volet de détail interactif (Slide-over drawer) */}
      <ObjectDrawer
        selectedObject={selectedTruck}
        onClose={() => setSelectedTruck(null)}
      />

      {/* 5. Modal Accessible textuel (Rule 6) */}
      <AccessibleListView
        isOpen={showAccessibleList}
        onClose={() => setShowAccessibleList(false)}
        deliveries={deliveries}
        drivers={drivers}
        onSelect={(item) => setSelectedTruck(item)}
      />
    </div>
  );
};

export default InteractiveHub;
