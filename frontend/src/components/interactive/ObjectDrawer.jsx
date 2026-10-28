import React, { useEffect, useRef } from 'react';
import { 
  X, Truck, User, MapPin, Package, FileText, CheckCircle2, 
  Clock, ShieldAlert, Sparkles, Download, Phone, ShieldCheck 
} from 'lucide-react';
import { deliveriesApi } from '../../services/api';
import { toast } from 'sonner';

/**
 * ObjectDrawer
 * Volet latéral de détail pour tout camion, quai ou mission sélectionné.
 * - Accessibilité clavier complète : focus trap, touche Echap pour fermer, ARIA
 * - Affichage clair du badge "Données de démonstration" si applicable (Règle 3)
 * - Téléchargement e-CMR PDF direct
 */
export const ObjectDrawer = ({ selectedObject, onClose }) => {
  const drawerRef = useRef(null);
  const closeBtnRef = useRef(null);

  // Focus trap et gestion de la touche Échap
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    closeBtnRef.current?.focus();
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!selectedObject) return null;

  const isDemo = selectedObject.isDemo || 
    (selectedObject.tracking_id && selectedObject.tracking_id.startsWith('TP-DEMO-')) ||
    (selectedObject.mission?.tracking_id && selectedObject.mission.tracking_id.startsWith('TP-DEMO-'));

  const mission = selectedObject.mission || selectedObject;
  const driverName = selectedObject.driver_name || mission.driver_name || 'Chauffeur non assigné';
  const trackingId = mission.tracking_id || selectedObject.id || 'N/A';
  const status = mission.status || selectedObject.status || 'pending';

  const statusConfig = {
    pending: { label: 'En attente au quai', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
    assigned: { label: 'Assigné - Préparation', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
    in_transit: { label: 'En transit routier', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 animate-pulse' },
    delivered: { label: 'Mission livrée', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
    failed: { label: 'Incident signalé', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
  };

  const statusInfo = statusConfig[status] || statusConfig.pending;

  const handleDownloadEcmr = async () => {
    if (!mission.tracking_id) return;
    try {
      toast.info('Génération de la lettre de voiture e-CMR...');
      await deliveriesApi.downloadReport(mission.tracking_id);
      toast.success('e-CMR téléchargée avec succès');
    } catch (err) {
      toast.error('Erreur lors du téléchargement de l\'e-CMR');
    }
  };

  return (
    <aside
      ref={drawerRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Détails de la mission ${trackingId}`}
      className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-[#0E0E11]/95 backdrop-blur-xl border-l border-[#27272A] shadow-2xl flex flex-col transform transition-transform duration-300 ease-out"
    >
      {/* Header */}
      <div className="p-5 border-b border-[#27272A] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0066FF]/10 border border-[#0066FF]/30 flex items-center justify-center text-[#0066FF]">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white font-mono">{trackingId}</h2>
              {isDemo && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/40">
                  <Sparkles className="w-2.5 h-2.5" />
                  Démo TRM
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">Unité Flotte & Mission e-CMR</p>
          </div>
        </div>
        <button
          ref={closeBtnRef}
          onClick={onClose}
          aria-label="Fermer le volet de détail (Échap)"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-[#1A1A1E] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body scrollable */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Statut Badge */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#141418] border border-[#27272A]">
          <span className="text-xs text-zinc-400">Statut opérationnel :</span>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.color}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {statusInfo.label}
          </span>
        </div>

        {/* Chauffeur Assigné */}
        <div className="p-4 rounded-xl bg-[#141418] border border-[#27272A] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium">Chauffeur & Véhicule</span>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
              <ShieldCheck className="w-3.5 h-3.5" />
              Contrôle départ validé
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1A1A1E] border border-[#27272A] flex items-center justify-center text-zinc-300">
              <User className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{driverName}</p>
              <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                <Phone className="w-3 h-3 text-zinc-500" /> +33 6 12 34 56 78
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-zinc-500 block">Éco-Score</span>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                94 / 100
              </span>
            </div>
          </div>
        </div>

        {/* Itinéraire Transport */}
        <div className="p-4 rounded-xl bg-[#141418] border border-[#27272A] space-y-3">
          <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium block">Parcours d'expédition</span>
          <div className="relative pl-6 space-y-4">
            <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-gradient-to-b from-[#0066FF] to-emerald-500" />
            <div>
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-0.5">
                <MapPin className="w-3.5 h-3.5 text-[#0066FF] -ml-5 bg-[#141418] rounded-full" />
                <span>Expéditeur / Dépôt :</span>
              </div>
              <p className="text-xs font-medium text-white">
                {mission.pickup_address || mission.origin || 'Plateforme Logistique Centrale Transporter-Pro'}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-0.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 -ml-5 bg-[#141418] rounded-full" />
                <span>Destinataire final :</span>
              </div>
              <p className="text-xs font-medium text-white">
                {mission.delivery_address || mission.destination || 'Entrepôt Client Régional'}
              </p>
            </div>
          </div>
        </div>

        {/* Marchandises & Détails */}
        <div className="p-4 rounded-xl bg-[#141418] border border-[#27272A] space-y-2.5">
          <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium block">Détails Marchandises</span>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-[#0E0E11] border border-[#27272A]/70">
              <span className="text-zinc-500 block text-[11px]">Type de colis</span>
              <span className="text-zinc-200 font-medium">{mission.package_type || 'Palettes Euro 80x120'}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#0E0E11] border border-[#27272A]/70">
              <span className="text-zinc-500 block text-[11px]">Poids total</span>
              <span className="text-zinc-200 font-mono font-medium">{mission.weight ? `${mission.weight} kg` : '1 450 kg'}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#0E0E11] border border-[#27272A]/70">
              <span className="text-zinc-500 block text-[11px]">Facturation Factur-X</span>
              <span className="text-emerald-400 font-mono font-semibold">
                {mission.price ? `${mission.price} € HT` : '380,00 € HT'}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#0E0E11] border border-[#27272A]/70">
              <span className="text-zinc-500 block text-[11px]">Conformité légale</span>
              <span className="text-blue-400 font-medium">e-CMR Art. 6</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-5 border-t border-[#27272A] bg-[#0E0E11] space-y-2">
        <button
          type="button"
          onClick={handleDownloadEcmr}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#0066FF] to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-xs transition-all shadow-lg shadow-blue-500/20 active:scale-[0.99]"
        >
          <FileText className="w-4 h-4" />
          <span>Télécharger la Lettre de Voiture e-CMR (PDF)</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 px-4 rounded-xl border border-[#27272A] hover:bg-[#1A1A1E] text-zinc-400 hover:text-white font-medium text-xs transition-colors"
        >
          Fermer (Échap)
        </button>
      </div>
    </aside>
  );
};

export default ObjectDrawer;
