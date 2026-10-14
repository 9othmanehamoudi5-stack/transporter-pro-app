import React, { useState, useEffect } from 'react';
import { vehicleInspectionsApi } from '../../services/api';
import {
  CheckCircle, AlertTriangle, RefreshCw, ChevronDown,
  ChevronUp, ClipboardCheck, Truck, Clock, User
} from 'lucide-react';
import { toast } from 'sonner';

const fuelLabel = (v) => {
  if (!v) return '—';
  return { '25': '1/4 ▂', '50': '1/2 ▄', '75': '3/4 ▆', '100': 'Plein █' }[v] || `${v}%`;
};

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
};

const StatusBadge = ({ hasAnomaly }) =>
  hasAnomaly ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/15 text-red-300 border border-red-500/30">
      <AlertTriangle className="w-3 h-3" /> Anomalie
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500/15 text-green-300 border border-green-500/30">
      <CheckCircle className="w-3 h-3" /> OK
    </span>
  );

const ChecklistMini = ({ checklist }) => {
  if (!checklist?.length) return null;
  return (
    <div className="grid grid-cols-2 gap-1 mt-3">
      {checklist.map(item => (
        <div
          key={item.id}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs ${
            item.status === 'ok'      ? 'bg-green-500/10 text-green-300'
          : item.status === 'anomaly' ? 'bg-red-500/10 text-red-300'
          :                             'bg-zinc-800 text-zinc-500'
          }`}
        >
          {item.status === 'ok'      ? <CheckCircle className="w-3 h-3 flex-shrink-0" />
         : item.status === 'anomaly' ? <AlertTriangle className="w-3 h-3 flex-shrink-0" />
         :                             <div className="w-3 h-3 rounded-full border border-zinc-600 flex-shrink-0" />}
          <span className="truncate">{item.label}</span>
        </div>
      ))}
    </div>
  );
};

const InspectionCard = ({ inspection }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`bg-[#121214] border rounded-xl overflow-hidden transition-colors ${
      inspection.has_anomaly ? 'border-red-500/30' : 'border-[#27272A]'
    }`}>
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
            inspection.has_anomaly ? 'bg-red-500/15' : 'bg-green-500/15'
          }`}>
            <Truck className={`w-5 h-5 ${inspection.has_anomaly ? 'text-red-400' : 'text-green-400'}`} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-white text-sm">{inspection.vehicle_plate || '—'}</span>
              <StatusBadge hasAnomaly={inspection.has_anomaly} />
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-zinc-500">
              <span className="flex items-center gap-1"><User className="w-3 h-3" />{inspection.driver_name}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(inspection.created_at)}</span>
            </div>
          </div>
        </div>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-zinc-400 flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-zinc-400 flex-shrink-0" />
        }
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-[#27272A] p-4 space-y-3 bg-[#0E0E10]">
          {/* Infos de base */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {inspection.odometer_start && (
              <div>
                <p className="text-zinc-500 text-xs mb-0.5">Kilométrage</p>
                <p className="font-mono font-semibold">{inspection.odometer_start.toLocaleString('fr-FR')} km</p>
              </div>
            )}
            {inspection.fuel_level && (
              <div>
                <p className="text-zinc-500 text-xs mb-0.5">Carburant</p>
                <p className="font-mono font-semibold">{fuelLabel(inspection.fuel_level)}</p>
              </div>
            )}
          </div>

          {/* Checklist */}
          <div>
            <p className="text-xs text-zinc-500 mb-1">Points de contrôle</p>
            <ChecklistMini checklist={inspection.checklist} />
          </div>

          {/* Anomalie */}
          {inspection.has_anomaly && inspection.anomaly_description && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
              <p className="text-xs text-red-400 font-semibold mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Description de l'anomalie
              </p>
              <p className="text-sm text-red-200">{inspection.anomaly_description}</p>
            </div>
          )}

          {/* Notes */}
          {inspection.notes && (
            <div>
              <p className="text-xs text-zinc-500 mb-0.5">Notes chauffeur</p>
              <p className="text-sm text-zinc-300 italic">"{inspection.notes}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Tab Component ────────────────────────────────────────────────────────
export const InspectionsTab = () => {
  const [inspections, setInspections] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'anomaly' | 'ok'

  const fetchData = async () => {
    setLoading(true);
    try {
      const [listRes, summaryRes] = await Promise.allSettled([
        vehicleInspectionsApi.getAll(),
        vehicleInspectionsApi.getTodaySummary(),
      ]);
      if (listRes.status === 'fulfilled') setInspections(listRes.value.data || []);
      if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value.data);
    } catch (err) {
      toast.error('Erreur chargement des contrôles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = inspections.filter(i => {
    if (filter === 'anomaly') return i.has_anomaly;
    if (filter === 'ok') return !i.has_anomaly;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-[#0066FF]" />
            Contrôles de départ
          </h2>
          <p className="text-sm text-zinc-400 mt-1">Vérifications pré-mission de la flotte</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3 py-2 bg-[#1A1A1E] border border-[#27272A] rounded-xl text-sm text-zinc-300 hover:text-white transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Today summary cards */}
      {summary && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#121214] border border-[#27272A] rounded-xl p-4 text-center">
            <p className="text-3xl font-bold font-mono text-[#0066FF]">{summary.total}</p>
            <p className="text-xs text-zinc-400 mt-1">Contrôles aujourd'hui</p>
          </div>
          <div className="bg-[#121214] border border-green-500/20 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold font-mono text-green-400">{summary.ok}</p>
            <p className="text-xs text-zinc-400 mt-1">Sans anomalie</p>
          </div>
          <div className="bg-[#121214] border border-red-500/20 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold font-mono text-red-400">{summary.with_anomaly}</p>
            <p className="text-xs text-zinc-400 mt-1">Avec anomalie</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        {[
          { id: 'all',     label: 'Tous' },
          { id: 'anomaly', label: '⚠️ Anomalies' },
          { id: 'ok',      label: '✅ OK' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors border ${
              filter === f.id
                ? 'bg-[#0066FF] border-[#0066FF] text-white'
                : 'bg-[#1A1A1E] border-[#27272A] text-zinc-400 hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-zinc-500 self-center">{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-zinc-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#121214] border border-[#27272A] rounded-2xl p-12 text-center">
          <ClipboardCheck className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
          <p className="text-zinc-400">
            {filter === 'anomaly' ? 'Aucune anomalie signalée 🎉' : 'Aucun contrôle enregistré'}
          </p>
          <p className="text-xs text-zinc-600 mt-1">
            Les chauffeurs peuvent effectuer leur contrôle depuis l'app mobile
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(inspection => (
            <InspectionCard key={inspection.id} inspection={inspection} />
          ))}
        </div>
      )}
    </div>
  );
};

export default InspectionsTab;
