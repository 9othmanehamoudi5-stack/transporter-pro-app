import React, { useEffect, useRef } from 'react';
import { X, Truck, Package, User, MapPin, Eye, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

/**
 * AccessibleListView
 * Alternative textuelle accessible pour les utilisateurs naviguant au clavier ou avec un lecteur d'écran.
 * Permet d'explorer et sélectionner chaque camion et mission de la flotte sans souris ni 3D.
 */
export const AccessibleListView = ({ isOpen, onClose, deliveries = [], drivers = [], onSelect }) => {
  const dialogRef = useRef(null);
  const firstItemRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    setTimeout(() => firstItemRef.current?.focus(), 50);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="accessible-list-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
    >
      <div
        ref={dialogRef}
        className="w-full max-w-3xl max-h-[85vh] bg-[#0E0E11] border border-[#27272A] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-[#27272A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0066FF]/10 border border-[#0066FF]/30 flex items-center justify-center text-[#0066FF]">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 id="accessible-list-title" className="text-base font-bold text-white">
                Liste textuelle accessible de la flotte
              </h2>
              <p className="text-xs text-zinc-400">
                Alternative accessible à la vue 3D — {deliveries.length} missions répertoriées
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer la liste accessible (Échap)"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-[#1A1A1E]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Table */}
        <div className="flex-1 overflow-y-auto p-4">
          {deliveries.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-sm">
              Aucune livraison enregistrée pour le moment.
            </div>
          ) : (
            <table className="w-full text-left text-xs" role="table">
              <thead className="text-[11px] uppercase tracking-wider text-zinc-500 border-b border-[#27272A]">
                <tr>
                  <th scope="col" className="pb-3 pl-2">Réf. Tracking</th>
                  <th scope="col" className="pb-3">Chauffeur</th>
                  <th scope="col" className="pb-3">Statut</th>
                  <th scope="col" className="pb-3">Destination</th>
                  <th scope="col" className="pb-3 text-right pr-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1E]">
                {deliveries.map((item, idx) => {
                  const isDemo = item.tracking_id && item.tracking_id.startsWith('TP-DEMO-');
                  return (
                    <tr key={item.tracking_id || item.id || idx} className="hover:bg-[#141418] transition-colors">
                      <td className="py-3 pl-2 font-mono font-medium text-white flex items-center gap-1.5">
                        {item.tracking_id || 'TRP-N/A'}
                        {isDemo && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            Démo
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-zinc-300">
                        {item.driver_name || 'Non assigné'}
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] ${
                          item.status === 'delivered' ? 'text-emerald-400 bg-emerald-500/10' :
                          item.status === 'in_transit' ? 'text-cyan-400 bg-cyan-500/10' :
                          'text-amber-400 bg-amber-500/10'
                        }`}>
                          {item.status === 'delivered' ? 'Livré' :
                           item.status === 'in_transit' ? 'En transit' : 'Au quai'}
                        </span>
                      </td>
                      <td className="py-3 text-zinc-400 max-w-[180px] truncate">
                        {item.delivery_address || item.destination || 'Entrepôt Client'}
                      </td>
                      <td className="py-3 text-right pr-2">
                        <button
                          ref={idx === 0 ? firstItemRef : null}
                          type="button"
                          onClick={() => {
                            onSelect(item);
                            onClose();
                          }}
                          aria-label={`Inspecter la mission ${item.tracking_id}`}
                          className="px-2.5 py-1 rounded-lg bg-[#0066FF]/10 hover:bg-[#0066FF] text-[#0066FF] hover:text-white font-medium transition-all"
                        >
                          Inspecter
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#27272A] bg-[#0A0A0B] flex items-center justify-between text-xs text-zinc-500">
          <span>Astuce : Utilisez la touche <kbd className="px-1.5 py-0.5 rounded bg-[#1A1A1E] text-zinc-300 border border-[#27272A]">Tab</kbd> pour naviguer entre les lignes.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#27272A] hover:bg-[#141418] text-zinc-300 font-medium"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessibleListView;
