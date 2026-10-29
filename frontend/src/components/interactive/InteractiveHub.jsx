import React, { useState, useMemo } from 'react';
import Scene3D from './Scene3D';
import ObjectDrawer from './ObjectDrawer';
import AccessibleListView from './AccessibleListView';
import { 
  Truck, Package, Clock, CheckCircle2, Sparkles, RefreshCw, 
  Plus, Minus, RotateCw, Home, Search, Users, ShieldCheck, 
  MapPin, ChevronRight, ChevronLeft, Maximize2, Minimize2, FileText, Phone, Building2 
} from 'lucide-react';
import { Button } from '../ui/button';
import { deliveriesApi } from '../../services/api';
import { toast } from 'sonner';

/**
 * InteractiveHub 3.0 — The Architectural Logistics Twin
 * Reproduction fidèle de l'expérience visuelle maquette 3D / Diorama (style Novalis SA) :
 * - Scène 3D lumineuse centrale avec socle, bureaux, entrepôt, verdure et camions
 * - Cartes flottantes glassmorphism (gauche : statut plateforme + chauffeurs, droite : KPIs & équipes)
 * - Barre inférieure de suivi de mission et de progression e-CMR
 * - Commandes de caméra en bas à droite (+, -, rotation, reset)
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
  onSelectTab,
  isFullscreen = false,
  onToggleFullscreen,
}) => {
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [filter, setFilter] = useState('all');
  const [showAccessibleList, setShowAccessibleList] = useState(false);
  const [cameraAction, setCameraAction] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Détection des données de démonstration
  const hasDemoData = useMemo(() => {
    if (!deliveries || deliveries.length === 0) return true;
    return deliveries.some((d) => d.tracking_id && d.tracking_id.startsWith('TP-DEMO-'));
  }, [deliveries]);

  // Données des chauffeurs avec statuts enrichis
  const activeDriversList = useMemo(() => {
    if (drivers && drivers.length > 0) {
      return drivers.map((d, i) => ({
        id: d.id || `drv-${i}`,
        name: d.name || 'Chauffeur',
        vehicle: `Camion TR-0${(i % 5) + 1}`,
        status: i === 0 ? 'En livraison' : i === 1 ? 'Au quai' : i === 2 ? 'En pause' : 'Disponible',
        statusColor: i === 0 ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                     i === 1 ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                     i === 2 ? 'bg-purple-500/10 text-purple-600 border-purple-500/20' :
                     'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      }));
    }
    return [
      { id: 'd1', name: 'Alexandre Mercier', vehicle: 'Camion TR-01', status: 'En livraison (Lyon)', statusColor: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
      { id: 'd2', name: 'Bastien Jordan', vehicle: 'Camion TR-02', status: 'Au quai 02', statusColor: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
      { id: 'd3', name: 'Sophie Laurent', vehicle: 'Fourgon VL-03', status: 'En pause', statusColor: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
      { id: 'd4', name: 'Marc Fontana', vehicle: 'Camion TR-04', status: 'Télématique active', statusColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
    ];
  }, [drivers]);

  // Mission en vedette pour la barre de progression inférieure
  const activeMission = useMemo(() => {
    if (selectedTruck) return selectedTruck;
    if (deliveries && deliveries.length > 0) return deliveries[0];
    return {
      tracking_id: 'TRP-2026-08',
      driver_name: 'Alexandre Mercier',
      destination: 'Hub Régional Lyon St-Exupéry',
      progress: 68,
      status: 'in_transit',
    };
  }, [selectedTruck, deliveries]);

  const handleDownloadEcmr = async () => {
    if (!activeMission.tracking_id) return;
    try {
      toast.info('Génération de la lettre de voiture e-CMR...');
      await deliveriesApi.downloadReport(activeMission.tracking_id);
      toast.success('e-CMR téléchargée avec succès');
    } catch {
      toast.error("Erreur lors de l'export e-CMR");
    }
  };

  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-[#ECE8E1] p-3 lg:p-4 select-none shadow-2xl border border-[#DFDAD0]" data-testid="interactive-diorama-hub">
      {/* 1. BARRE SUPÉRIEURE FLOTTANTE (Style Novalis Header) */}
      <div className="relative z-20 mb-3 flex flex-col md:flex-row md:items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-white/85 backdrop-blur-xl border border-white/60 shadow-lg text-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0066FF] flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-500/20">
            TP
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-zinc-900 tracking-tight">Transporter-Pro Hub</span>
              <span className="text-xs text-zinc-400">• Siège & Plateforme Centrale</span>
              {hasDemoData && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 border border-amber-500/30">
                  <Sparkles className="w-2.5 h-2.5" />
                  Mode Démo
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-500">Supervision spatiale 3D interactive de la flotte routière</p>
          </div>
        </div>

        {/* Filtres & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center p-1 bg-zinc-100 rounded-xl text-xs font-medium border border-zinc-200/80">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg transition-colors ${filter === 'all' ? 'bg-white shadow text-zinc-900 font-semibold' : 'text-zinc-600 hover:text-zinc-900'}`}
            >
              Tous
            </button>
            <button
              onClick={() => setFilter('in_transit')}
              className={`px-3 py-1 rounded-lg transition-colors ${filter === 'in_transit' ? 'bg-white shadow text-blue-600 font-semibold' : 'text-zinc-600 hover:text-blue-600'}`}
            >
              En transit
            </button>
            <button
              onClick={() => setFilter('dock')}
              className={`px-3 py-1 rounded-lg transition-colors ${filter === 'dock' ? 'bg-white shadow text-amber-600 font-semibold' : 'text-zinc-600 hover:text-amber-600'}`}
            >
              Aux quais
            </button>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Supervision Active</span>
          </div>

          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 text-xs font-semibold shadow-sm transition-all"
              title={isFullscreen ? "Restaurer le menu latéral" : "Agrandir en plein écran (rétracter le menu)"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4 text-[#0066FF]" /> : <Maximize2 className="w-4 h-4 text-[#0066FF]" />}
              <span className="hidden sm:inline">{isFullscreen ? "Réduire" : "Grand Écran"}</span>
            </button>
          )}

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 rounded-xl bg-white hover:bg-zinc-50 text-zinc-600 border border-zinc-200/80 shadow-sm transition-colors"
              title="Synchroniser les flux"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          {onSeedDemoData && (
            <Button
              onClick={onSeedDemoData}
              disabled={seedingDemo}
              variant="outline"
              className="bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-500/30 text-xs px-3 py-1.5 rounded-xl font-medium shadow-sm"
            >
              <Sparkles className={`w-3.5 h-3.5 mr-1 ${seedingDemo ? 'animate-spin' : ''}`} />
              {seedingDemo ? "Génération..." : "Charger Démo TRM"}
            </Button>
          )}
        </div>
      </div>

      {/* 2. ZONE CENTRALE : SCÈNE 3D + PANNEAUX FLOTTANTS GAUCHE & DROITE */}
      <div className="relative w-full h-[680px] rounded-2xl overflow-hidden">
        {/* Scène 3D en fond de l'espace */}
        <Scene3D
          deliveries={deliveries}
          drivers={drivers}
          onSelectTruck={(truck) => setSelectedTruck(truck)}
          selectedTruckId={selectedTruck?.id}
          filter={filter}
          onFallbackToClassic={onFallbackToClassic}
          cameraControlAction={cameraAction}
          onCameraControlHandled={() => setCameraAction(null)}
        />

                {/* PANNEAU FLOTTANT GAUCHE : IDENTITÉ & CHAUFFEURS (Rétractable) */}
        {leftPanelCollapsed ? (
          <button
            onClick={() => setLeftPanelCollapsed(false)}
            className="absolute top-4 left-4 z-10 px-3.5 py-2.5 rounded-2xl bg-white/95 backdrop-blur-xl border border-white/80 shadow-2xl text-zinc-800 text-xs font-bold flex items-center gap-2 hover:bg-white transition-all"
            title="Ouvrir le volet flotte"
          >
            <div className="w-6 h-6 rounded-lg bg-[#0066FF] flex items-center justify-center text-white text-[11px] font-black">TP</div>
            <span>Flotte ({activeDriversList.length})</span>
            <ChevronRight className="w-4 h-4 text-zinc-400" />
          </button>
        ) : (
          <div className="absolute top-4 left-4 z-10 w-72 lg:w-80 max-h-[580px] flex flex-col rounded-3xl bg-white/90 backdrop-blur-xl border border-white/70 shadow-2xl text-zinc-800 p-4 overflow-hidden transition-all">
            {/* Header Entreprise avec bouton rétracter */}
            <div className="pb-3 border-b border-zinc-100 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0066FF] to-blue-700 flex items-center justify-center text-white font-black text-base shadow-md shrink-0">
                  TP
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-blue-600 block">Siège • Dépôt A1</span>
                  <h3 className="font-bold text-sm text-zinc-900 truncate">Transporter-Pro SA</h3>
                  <p className="text-[11px] text-zinc-500 truncate">Av. des Transports 12, Hub Nord</p>
                </div>
              </div>
              <button
                onClick={() => setLeftPanelCollapsed(true)}
                className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors shrink-0"
                title="Rétracter ce volet"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

          {/* Statut ouverture & Jauges rapides */}
          <div className="py-3 border-b border-zinc-100 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-emerald-700 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Dépôt Ouvert
              </span>
              <span className="text-zinc-500 text-[11px]">4 quais actifs • 3 en pause</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="p-2 rounded-xl bg-zinc-50 border border-zinc-100">
                <span className="text-[10px] text-zinc-500 block">Chauffeurs actifs</span>
                <span className="font-bold text-zinc-900 text-sm">8 <span className="text-[11px] text-zinc-400 font-normal">/ 10</span></span>
                <div className="w-full bg-zinc-200 h-1 rounded-full mt-1.5 overflow-hidden">
                  <div className="bg-[#0066FF] h-full rounded-full" style={{ width: '80%' }} />
                </div>
              </div>
              <div className="p-2 rounded-xl bg-zinc-50 border border-zinc-100">
                <span className="text-[10px] text-zinc-500 block">Quais occupés</span>
                <span className="font-bold text-zinc-900 text-sm">3 <span className="text-[11px] text-zinc-400 font-normal">/ 4</span></span>
                <div className="w-full bg-zinc-200 h-1 rounded-full mt-1.5 overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '75%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Liste des Chauffeurs & Collaborateurs en direct */}
          <div className="pt-3 flex-1 overflow-y-auto space-y-2 pr-1">
            <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 block px-1">
              Chauffeurs de la flotte
            </span>

            {activeDriversList.map((drv) => (
              <div
                key={drv.id}
                onClick={() => setSelectedTruck(drv)}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-100/80 cursor-pointer transition-colors border border-transparent hover:border-zinc-200/80"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-700 font-bold text-xs shrink-0">
                    {drv.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-900 truncate">{drv.name}</p>
                    <p className="text-[10px] text-zinc-500 truncate">{drv.vehicle}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${drv.statusColor} shrink-0`}>
                  {drv.status}
                </span>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* PANNEAU FLOTTANT DROIT : SUPERVISION DU JOUR & KPIS (Style Novalis) */}
        <div className="absolute top-4 right-4 z-10 w-72 lg:w-80 flex flex-col gap-3">
          {/* Carte KPIs du Jour */}
          <div className="p-4 rounded-3xl bg-white/90 backdrop-blur-xl border border-white/70 shadow-2xl text-zinc-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <span className="font-bold text-xs text-zinc-900">Aujourd'hui sur la flotte</span>
              <span className="text-[11px] text-zinc-400">Samedi 29 oct.</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-zinc-600">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Chauffeurs mobilisés</span>
                </div>
                <span className="font-bold text-zinc-900">8 / 10</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-zinc-600">
                  <Package className="w-4 h-4 text-amber-600" />
                  <span>Expéditions livrées</span>
                </div>
                <span className="font-bold text-zinc-900">{deliveries?.filter(d => d.status === 'delivered').length || 5}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-zinc-600">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>Factur-X en attente</span>
                </div>
                <span className="font-bold text-emerald-700 font-mono">48 500 €</span>
              </div>
            </div>
          </div>

          {/* Raccourci Liste textuelle accessible (Règle 6) */}
          <button
            onClick={() => setShowAccessibleList(true)}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/90 backdrop-blur-xl border border-white/70 shadow-xl hover:bg-white text-xs font-semibold text-zinc-800 transition-all hover:scale-[1.01]"
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Voir tableau complet flotte</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-[10px] text-zinc-500 font-mono">Alt+L</kbd>
          </button>
        </div>

        {/* 3. BARRE INFÉRIEURE FLOTTANTE : SUIVI DE MISSION & TIMELINE e-CMR (Style Novalis) */}
        <div className="absolute bottom-4 left-4 right-28 z-10 p-3.5 rounded-2xl bg-white/90 backdrop-blur-xl border border-white/70 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-zinc-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600 shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-zinc-900 font-mono">{activeMission.tracking_id || 'TRP-2026-08'}</span>
                <span className="text-[11px] text-zinc-500 truncate">• {activeMission.driver_name || 'Alexandre M.'}</span>
              </div>
              <p className="text-[11px] text-zinc-500 truncate">
                Destination : {activeMission.delivery_address || activeMission.destination || 'Plateforme Logistique Régionale Lyon'}
              </p>
            </div>
          </div>

          {/* Stepper horizontal de suivi d'étape */}
          <div className="hidden lg:flex items-center gap-2 text-[11px] font-medium text-zinc-500">
            <span className="text-blue-600 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Quai 02
            </span>
            <span className="w-6 h-0.5 bg-blue-500" />
            <span className="text-blue-600 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Départ validé
            </span>
            <span className="w-6 h-0.5 bg-blue-500" />
            <span className="text-zinc-700 font-semibold flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-blue-600" /> Transit A6
            </span>
            <span className="w-6 h-0.5 bg-zinc-200" />
            <span className="text-zinc-400">Arrivée</span>
          </div>

          {/* Action e-CMR */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownloadEcmr}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all active:scale-[0.98]"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>e-CMR PDF</span>
            </button>
          </div>
        </div>

        {/* 4. CONTRÔLES DE CAMÉRA FLOTTANTS EN BAS À DROITE (+, -, ↺, ⌂) */}
        <div className="absolute bottom-4 right-4 z-10 flex items-center p-1 rounded-2xl bg-white/90 backdrop-blur-xl border border-white/70 shadow-2xl text-zinc-700">
          <button
            onClick={() => setCameraAction('zoomIn')}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
            title="Zoom avant (+)"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCameraAction('zoomOut')}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
            title="Zoom arrière (-)"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCameraAction('rotate')}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
            title="Pivoter 45°"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCameraAction('reset')}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
            title="Réinitialiser vue isométrique"
          >
            <Home className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Volet latéral de détail du camion sélectionné */}
      <ObjectDrawer
        selectedObject={selectedTruck}
        onClose={() => setSelectedTruck(null)}
      />

      {/* Modal textuelle accessible (Règle 6) */}
      <AccessibleListView
        isOpen={showAccessibleList}
        onClose={() => setShowAccessibleList(false)}
        deliveries={deliveries}
        drivers={drivers}
        onSelect={(t) => setSelectedTruck(t)}
      />
    </div>
  );
};

export default InteractiveHub;
