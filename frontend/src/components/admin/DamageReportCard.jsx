import React, { useState } from 'react';
import { useI18n } from '../../i18n/index';
import { damageReportsApi } from '../../services/api';
import { Button } from '../ui/button';
import { Shield, AlertTriangle, CheckCircle, Camera, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const SEVERITY_KEYS = {
  none: { labelKey: 'litiges.severityNone', color: 'text-green-400 bg-green-400/10', barColor: 'bg-green-400' },
  minor: { labelKey: 'litiges.severityMinor', color: 'text-yellow-400 bg-yellow-400/10', barColor: 'bg-yellow-400' },
  moderate: { labelKey: 'litiges.severityModerate', color: 'text-orange-400 bg-orange-400/10', barColor: 'bg-orange-400' },
  severe: { labelKey: 'litiges.severeLevel', color: 'text-red-400 bg-red-400/10', barColor: 'bg-red-400' },
  unknown: { labelKey: 'litiges.severityUnknown', color: 'text-zinc-400 bg-zinc-400/10', barColor: 'bg-zinc-400' }
};

export const DamageReportCard = ({ report, onRetrySuccess }) => {
  const { t } = useI18n();
  const [photoUrl, setPhotoUrl] = useState(null);
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const analysis = report.ai_analysis || {};
  const severityCfg = SEVERITY_KEYS[analysis.damage_severity] || SEVERITY_KEYS.unknown;
  const severityLabel = t(severityCfg.labelKey, 'Inconnue');
  const confidence = analysis.confidence || 0;
  const hasError = !!(
    analysis.damage_severity === 'unknown' ||
    confidence === 0 ||
    (analysis.description && (
      analysis.description.includes('Analyse automatique impossible') ||
      analysis.description.includes('Erreur') ||
      analysis.description.includes('Error') ||
      analysis.description.includes('Failed') ||
      analysis.description.includes('INVALID_ARGUMENT') ||
      analysis.description.includes('unavailable')
    ))
  );

  const loadPhoto = async () => {
    if (photoUrl || !report.has_photo) return;
    setLoadingPhoto(true);
    try {
      const res = await damageReportsApi.getPhoto(report.report_id);
      if (res.data?.photo_base64) {
        setPhotoUrl(`data:image/jpeg;base64,${res.data.photo_base64}`);
      }
    } catch (e) {
      console.warn('Failed to load photo');
    }
    setLoadingPhoto(false);
  };

  const handleRetry = async () => {
    setRetrying(true);
    try {
      const res = await damageReportsApi.retry(report.report_id);
      if (res.data?.ai_analysis) {
        toast.success(t('toasts.analysisRetried', 'Analyse relancée avec succès'));
        if (onRetrySuccess) onRetrySuccess();
      }
    } catch (e) {
      toast.error(t('toasts.retryFailed', 'Échec de la relance'));
    }
    setRetrying(false);
  };

  const displayDescription = hasError
    ? t('litiges.errorMsg', 'Analyse automatique impossible - Image non reconnue ou format incompatible')
    : analysis.description;

  return (
    <div 
      className={`bg-[#121214] border rounded-xl overflow-hidden ${
        analysis.is_damaged ? 'border-red-500/30' : 'border-[#27272A]'
      }`}
      data-testid={`damage-report-${report.report_id}`}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-mono text-sm text-zinc-500">{report.report_id}</p>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${severityCfg.color}`}>
                {severityLabel}
              </span>
            </div>
            <p className="font-semibold mt-1">{t('litiges.deliveryLabel', 'Livraison')} : {report.delivery_id}</p>
            {report.driver_name && <p className="text-sm text-zinc-400">{t('litiges.driverLabel', 'Chauffeur')} : {report.driver_name}</p>}
          </div>
          {analysis.is_damaged ? (
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-red-500/10 text-red-400 border border-red-500/20">
              <AlertTriangle className="w-4 h-4" />
              {t('litiges.damageDetected', 'Dommage détecté')}
            </span>
          ) : (
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-green-500/10 text-green-400 border border-green-500/20">
              <CheckCircle className="w-4 h-4" />
              {t('litiges.packageOk', 'Colis intact')}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="p-4 bg-[#1A1A1E] rounded-lg">
            <p className="text-xs text-zinc-400 mb-2">{t('litiges.severity', 'Sévérité')}</p>
            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${severityCfg.color}`}>
              {severityLabel}
            </span>
            {analysis.damage_type && (
              <p className="text-xs text-zinc-500 mt-2">{t('litiges.type', 'Type')} : {analysis.damage_type}</p>
            )}
          </div>

          <div className="p-4 bg-[#1A1A1E] rounded-lg">
            <p className="text-xs text-zinc-400 mb-2">{t('litiges.aiConfidence', 'Confiance IA')}</p>
            <p className="text-2xl font-bold font-mono mb-2">{confidence}%</p>
            <div className="w-full h-2 bg-[#27272A] rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${severityCfg.barColor}`}
                style={{ width: `${confidence}%` }}
              />
            </div>
          </div>

          <div className="p-4 bg-[#1A1A1E] rounded-lg">
            <p className="text-xs text-zinc-400 mb-2">{t('litiges.blockchainProof', 'Preuve horodatée')}</p>
            <p className="font-mono text-xs text-green-400 truncate mb-1">
              {report.blockchain_proof?.hash?.substring(0, 24)}...
            </p>
            <p className="text-xs text-zinc-500">
              {report.created_at ? new Date(report.created_at).toLocaleString('fr-FR') : ''}
            </p>
          </div>
        </div>

        {displayDescription && !hasError && (
          <div className="p-4 bg-[#0066FF]/5 border border-[#0066FF]/20 rounded-lg mb-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-[#0066FF] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-[#0066FF] font-medium mb-1">{t('litiges.geminiVision', 'Analyse Gemini Vision')}</p>
                <p className="text-sm text-zinc-300">{displayDescription}</p>
              </div>
            </div>
          </div>
        )}
        
        {hasError && (
          <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-lg mb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-yellow-400 font-medium mb-1">{t('litiges.errorAnalysis', 'Analyse en erreur')}</p>
                  <p className="text-sm text-zinc-400">{displayDescription}</p>
                </div>
              </div>
              {report.has_photo && (
                <Button
                  size="sm"
                  onClick={handleRetry}
                  disabled={retrying}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white flex-shrink-0"
                  data-testid={`retry-analysis-${report.report_id}`}
                >
                  {retrying ? (
                    <><RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> {t('litiges.retrying', 'Analyse...')}</>
                  ) : (
                    <><RefreshCw className="w-3.5 h-3.5 mr-1.5" /> {t('litiges.retry', 'Relancer')}</>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        {report.has_photo && (
          <div>
            {!photoUrl ? (
              <Button 
                onClick={loadPhoto} 
                variant="outline" 
                className="border-[#27272A] text-zinc-400"
                disabled={loadingPhoto}
                data-testid={`load-photo-${report.report_id}`}
              >
                {loadingPhoto ? (
                  <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> {t('litiges.loadingPhoto', 'Chargement...')}</>
                ) : (
                  <><Camera className="w-4 h-4 mr-2" /> {t('litiges.viewPhoto', 'Voir la photo')}</>
                )}
              </Button>
            ) : (
              <div className="mt-2">
                <img 
                  src={photoUrl} 
                  alt={t('litiges.photoAlt', 'Photo du colis')}
                  className="max-h-64 rounded-lg border border-[#27272A] object-contain"
                  data-testid={`photo-preview-${report.report_id}`}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DamageReportCard;
