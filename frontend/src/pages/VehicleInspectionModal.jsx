import React, { useState, useRef } from 'react';
import {
  CheckCircle, AlertTriangle, X, Camera, Upload, Fuel,
  Gauge, FileText, ChevronRight, RefreshCw, ClipboardCheck
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { vehicleInspectionsApi } from '../services/api';
import { toast } from 'sonner';

// ─── Checklist items ──────────────────────────────────────────────────────────
const DEFAULT_CHECKLIST = [
  { id: 'tires',        label: '🛞 Pneus & roues',               status: 'not_checked' },
  { id: 'lights',       label: '💡 Feux & clignotants',           status: 'not_checked' },
  { id: 'mirrors',      label: '🔍 Rétroviseurs & pare-brise',    status: 'not_checked' },
  { id: 'documents',    label: '📄 Documents de bord',            status: 'not_checked' },
  { id: 'safety_kit',   label: '🦺 Gilet / Triangle / Extincteur',status: 'not_checked' },
  { id: 'cargo_area',   label: '📦 Caisse & sangles de chargement',status: 'not_checked' },
  { id: 'oil_water',    label: '🛢️ Niveaux huile & eau',          status: 'not_checked' },
];

const FUEL_LEVELS = [
  { value: '25',  label: '1/4', icon: '▂' },
  { value: '50',  label: '1/2', icon: '▄' },
  { value: '75',  label: '3/4', icon: '▆' },
  { value: '100', label: 'Plein', icon: '█' },
];

// ─── Component ─────────────────────────────────────────────────────────────────
export const VehicleInspectionModal = ({ vehiclePlate, onClose, onDone }) => {
  const [step, setStep] = useState(1); // 1=checklist, 2=anomaly, 3=summary
  const [checklist, setChecklist] = useState(DEFAULT_CHECKLIST);
  const [fuelLevel, setFuelLevel] = useState('');
  const [odometer, setOdometer] = useState('');
  const [anomalyDesc, setAnomalyDesc] = useState('');
  const [anomalyPhoto, setAnomalyPhoto] = useState(null);
  const [anomalyPhotoPreview, setAnomalyPhotoPreview] = useState(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const hasAnomaly = checklist.some(i => i.status === 'anomaly');
  const allChecked = checklist.every(i => i.status !== 'not_checked');

  // ── Checklist item toggle ──────────────────────────────────────────────────
  const toggleItem = (id) => {
    setChecklist(prev => prev.map(item => {
      if (item.id !== id) return item;
      const next = item.status === 'not_checked' ? 'ok'
                 : item.status === 'ok'          ? 'anomaly'
                 :                                  'not_checked';
      return { ...item, status: next };
    }));
  };

  // ── Photo handling ─────────────────────────────────────────────────────────
  const processImage = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAnomalyPhotoPreview(ev.target.result);
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const maxDim = 1024;
        let w = img.width, h = img.height;
        if (Math.max(w, h) > maxDim) {
          const r = maxDim / Math.max(w, h);
          w = Math.round(w * r); h = Math.round(h * r);
        }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        setAnomalyPhoto(canvas.toDataURL('image/jpeg', 0.75).split(',')[1]);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await vehicleInspectionsApi.create({
        vehicle_plate: vehiclePlate || 'Non renseigné',
        odometer_start: odometer ? parseFloat(odometer) : null,
        fuel_level: fuelLevel || null,
        checklist,
        anomaly_description: anomalyDesc || null,
        anomaly_photo_base64: anomalyPhoto || null,
        notes: notes || null,
      });
      toast.success('✅ Contrôle de départ enregistré !');
      onDone?.();
    } catch (err) {
      toast.error(`Erreur: ${err.response?.data?.detail || err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // ── UI helpers ─────────────────────────────────────────────────────────────
  const itemColor = (status) => {
    if (status === 'ok')      return 'bg-green-500/15 border-green-500/40 text-green-300';
    if (status === 'anomaly') return 'bg-red-500/15 border-red-500/40 text-red-300';
    return 'bg-[#1A1A1E] border-[#27272A] text-zinc-300';
  };

  const itemIcon = (status) => {
    if (status === 'ok')      return <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />;
    if (status === 'anomaly') return <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />;
    return <div className="w-5 h-5 rounded-full border-2 border-zinc-600 flex-shrink-0" />;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-[#0A0A0B] border border-[#27272A] rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#27272A] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0066FF]/15 rounded-xl flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-[#0066FF]" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Contrôle de départ</p>
              <p className="text-xs text-zinc-400">{vehiclePlate || 'Véhicule'} · Étape {step}/3</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 bg-[#1A1A1E] hover:bg-[#27272A] rounded-full flex items-center justify-center text-zinc-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex gap-1 px-5 py-3 flex-shrink-0">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? 'bg-[#0066FF]' : 'bg-[#27272A]'}`} />
          ))}
        </div>

        {/* ── STEP 1 : Checklist ────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-3">

            {/* Infos véhicule */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Kilométrage départ</label>
                <div className="flex items-center gap-2 bg-[#1A1A1E] border border-[#27272A] rounded-xl px-3 py-2">
                  <Gauge className="w-4 h-4 text-zinc-500" />
                  <input
                    type="number"
                    placeholder="ex. 154 200"
                    value={odometer}
                    onChange={e => setOdometer(e.target.value)}
                    className="bg-transparent text-sm text-white placeholder-zinc-600 outline-none w-full"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Niveau carburant</label>
                <div className="grid grid-cols-4 gap-1">
                  {FUEL_LEVELS.map(f => (
                    <button
                      key={f.value}
                      onClick={() => setFuelLevel(prev => prev === f.value ? '' : f.value)}
                      className={`py-2 rounded-lg text-xs font-mono transition-colors border ${
                        fuelLevel === f.value
                          ? 'bg-[#0066FF]/20 border-[#0066FF] text-[#0066FF]'
                          : 'bg-[#1A1A1E] border-[#27272A] text-zinc-400'
                      }`}
                    >
                      {f.icon}<br />{f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Checklist */}
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider pt-2">
              Points de contrôle — Appuyez pour changer l'état
            </p>
            <div className="space-y-2">
              {checklist.map(item => (
                <button
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all active:scale-[0.98] ${itemColor(item.status)}`}
                >
                  {itemIcon(item.status)}
                  <span className="text-sm flex-1">{item.label}</span>
                  <span className="text-xs opacity-60">
                    {item.status === 'ok' ? 'OK' : item.status === 'anomaly' ? 'Anomalie' : 'Non vérifié'}
                  </span>
                </button>
              ))}
            </div>

            {/* Tip */}
            <p className="text-xs text-zinc-500 text-center pt-1">
              Tap 1× → ✅ OK · Tap 2× → ⚠️ Anomalie · Tap 3× → ⬜ Non vérifié
            </p>
          </div>
        )}

        {/* ── STEP 2 : Anomalie (si détectée) ou notes ─────────────────────── */}
        {step === 2 && (
          <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4">
            <canvas ref={canvasRef} className="hidden" />

            {hasAnomaly ? (
              <>
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-300">
                    Anomalie détectée — Décrivez-la et prenez une photo si possible
                  </p>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Description de l'anomalie *</label>
                  <textarea
                    value={anomalyDesc}
                    onChange={e => setAnomalyDesc(e.target.value)}
                    placeholder="Ex: Pneu AV gauche usé, rayure sur aile droite..."
                    rows={3}
                    className="w-full bg-[#1A1A1E] border border-[#27272A] rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-[#0066FF]/50 resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 mb-2 block">Photo de l'anomalie (optionnel)</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={e => processImage(e.target.files?.[0])}
                  />
                  {anomalyPhotoPreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-[#27272A]">
                      <img src={anomalyPhotoPreview} alt="Anomalie" className="w-full max-h-48 object-contain bg-black" />
                      <button
                        onClick={() => { setAnomalyPhoto(null); setAnomalyPhotoPreview(null); }}
                        className="absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => { if (fileInputRef.current) { fileInputRef.current.setAttribute('capture', 'environment'); fileInputRef.current.click(); } }}
                        className="flex flex-col items-center gap-2 py-4 bg-[#1A1A1E] border border-[#27272A] rounded-xl text-sm text-zinc-300"
                      >
                        <Camera className="w-6 h-6 text-zinc-400" />
                        Prendre photo
                      </button>
                      <button
                        onClick={() => { if (fileInputRef.current) { fileInputRef.current.removeAttribute('capture'); fileInputRef.current.click(); } }}
                        className="flex flex-col items-center gap-2 py-4 bg-[#1A1A1E] border border-[#27272A] rounded-xl text-sm text-zinc-300"
                      >
                        <Upload className="w-6 h-6 text-zinc-400" />
                        Depuis galerie
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <p className="text-sm text-green-300">Aucune anomalie détectée — tout est en ordre !</p>
              </div>
            )}

            {/* Notes libres */}
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Notes complémentaires (optionnel)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Remarques, informations utiles pour le dispatcher..."
                rows={2}
                className="w-full bg-[#1A1A1E] border border-[#27272A] rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-[#0066FF]/50 resize-none"
              />
            </div>
          </div>
        )}

        {/* ── STEP 3 : Récap & validation ───────────────────────────────────── */}
        {step === 3 && (
          <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4">
            <div className="text-center py-4">
              <div className={`w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center ${
                hasAnomaly ? 'bg-red-500/15' : 'bg-green-500/15'
              }`}>
                {hasAnomaly
                  ? <AlertTriangle className="w-8 h-8 text-red-400" />
                  : <CheckCircle className="w-8 h-8 text-green-400" />
                }
              </div>
              <p className="font-bold text-white">
                {hasAnomaly ? '⚠️ Anomalie à signaler' : '✅ Véhicule en bon état'}
              </p>
              <p className="text-sm text-zinc-400 mt-1">
                Confirmez pour enregistrer le contrôle de départ
              </p>
            </div>

            {/* Résumé */}
            <div className="bg-[#1A1A1E] rounded-xl divide-y divide-[#27272A] text-sm">
              <div className="flex justify-between px-4 py-3">
                <span className="text-zinc-400">Véhicule</span>
                <span className="font-mono font-semibold">{vehiclePlate || '—'}</span>
              </div>
              {odometer && (
                <div className="flex justify-between px-4 py-3">
                  <span className="text-zinc-400">Kilométrage</span>
                  <span className="font-mono">{Number(odometer).toLocaleString('fr-FR')} km</span>
                </div>
              )}
              {fuelLevel && (
                <div className="flex justify-between px-4 py-3">
                  <span className="text-zinc-400">Carburant</span>
                  <span>{fuelLevel}%</span>
                </div>
              )}
              <div className="flex justify-between px-4 py-3">
                <span className="text-zinc-400">Points contrôlés</span>
                <span>{checklist.filter(i => i.status !== 'not_checked').length}/{checklist.length}</span>
              </div>
              <div className="flex justify-between px-4 py-3">
                <span className="text-zinc-400">Statut</span>
                <span className={hasAnomaly ? 'text-red-400 font-semibold' : 'text-green-400 font-semibold'}>
                  {hasAnomaly ? 'Anomalie' : 'OK'}
                </span>
              </div>
              {anomalyDesc && (
                <div className="px-4 py-3">
                  <span className="text-zinc-400 block mb-1">Anomalie</span>
                  <span className="text-red-300 text-xs">{anomalyDesc}</span>
                </div>
              )}
            </div>

            <p className="text-xs text-zinc-500 text-center">
              Ce contrôle sera horodaté et conservé dans votre dossier. En cas d'anomalie, votre responsable sera notifié.
            </p>
          </div>
        )}

        {/* Footer buttons */}
        <div className="px-5 py-4 border-t border-[#27272A] flex gap-3 flex-shrink-0">
          {step > 1 && (
            <Button
              onClick={() => setStep(s => s - 1)}
              variant="outline"
              className="flex-1 h-12 border-[#27272A] text-zinc-300 rounded-xl"
              disabled={submitting}
            >
              Retour
            </Button>
          )}

          {step < 3 && (
            <Button
              onClick={() => setStep(s => s + 1)}
              className="flex-1 h-12 bg-[#0066FF] hover:bg-[#0052CC] rounded-xl font-semibold"
            >
              {step === 1 ? (
                <>Suivant <ChevronRight className="w-4 h-4 ml-1" /></>
              ) : (
                <>Vérifier le récap <ChevronRight className="w-4 h-4 ml-1" /></>
              )}
            </Button>
          )}

          {step === 3 && (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className={`flex-1 h-12 rounded-xl font-semibold ${
                hasAnomaly
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {submitting ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Enregistrement...</>
              ) : (
                <><ClipboardCheck className="w-4 h-4 mr-2" />Valider le contrôle</>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleInspectionModal;
