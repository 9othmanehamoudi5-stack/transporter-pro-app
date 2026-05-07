import React from 'react';
import { useI18n } from '../../i18n/index';
import { ecoScoresApi } from '../../services/api';
import { Button } from '../ui/button';
import { Leaf, RefreshCw, FileText, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

// ==================== ECO CHART (Recharts) ====================
const EcoChart = ({ data }) => {
  const { t } = useI18n();
  const [ChartComponents, setChartComponents] = React.useState(null);

  React.useEffect(() => {
    import('recharts').then(mod => {
      setChartComponents({
        ResponsiveContainer: mod.ResponsiveContainer,
        XAxis: mod.XAxis,
        YAxis: mod.YAxis,
        Tooltip: mod.Tooltip,
        CartesianGrid: mod.CartesianGrid,
        Area: mod.Area,
        AreaChart: mod.AreaChart
      });
    });
  }, []);

  if (!ChartComponents || !data || data.length === 0) {
    return (
      <div className="bg-[#121214] border border-[#27272A] rounded-xl p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#0066FF]" />
          {t('eco.scoreEvolution', 'Évolution du score (30 jours)')}
        </h3>
        <div className="h-48 flex items-center justify-center text-zinc-500 text-sm">
          {!ChartComponents ? t('eco.loadingChart', 'Chargement du graphique...') : t('eco.noData30d', 'Aucune donnée sur les 30 derniers jours')}
        </div>
      </div>
    );
  }

  const { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } = ChartComponents;

  const chartData = data.map(d => ({
    date: d.date.slice(5),
    score: d.avg_score,
    chauffeurs: d.drivers_count
  }));

  return (
    <div className="bg-[#121214] border border-[#27272A] rounded-xl p-6" data-testid="eco-chart">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-[#0066FF]" />
        {t('eco.scoreEvolution30d', 'Évolution du score moyen (30 jours)')}
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
            <XAxis dataKey="date" tick={{ fill: '#71717A', fontSize: 12 }} axisLine={{ stroke: '#27272A' }} />
            <YAxis domain={[0, 100]} tick={{ fill: '#71717A', fontSize: 12 }} axisLine={{ stroke: '#27272A' }} />
            <Tooltip
              contentStyle={{ background: '#1A1A1E', border: '1px solid #27272A', borderRadius: '8px', color: '#fff' }}
              labelStyle={{ color: '#A1A1AA' }}
              formatter={(value, name) => [Math.round(value), name === 'score' ? 'Score' : 'Chauffeurs']}
            />
            <Area type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={2} fill="url(#scoreGradient)" dot={{ fill: '#22c55e', r: 3 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ==================== ECO SCORES TAB ====================
export const EcoScoresTab = ({ stats, ecoSummary, ecoDailyAvg, fetchData }) => {
  const { t } = useI18n();
  const [recalculating, setRecalculating] = React.useState(false);

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      await ecoScoresApi.recalculate();
      toast.success(t('toasts.scoresRecalculated', 'Scores recalculés avec succès !'));
      fetchData();
    } catch {
      toast.error(t('toasts.recalculationFailed', 'Erreur lors du recalcul'));
    }
    setRecalculating(false);
  };

  const top3 = ecoSummary.slice(0, 3);
  const medals = ['gold', 'silver', 'bronze'];
  const medalColors = {
    gold: 'from-yellow-500/20 to-yellow-600/5 border-yellow-500/30',
    silver: 'from-zinc-400/20 to-zinc-500/5 border-zinc-400/30',
    bronze: 'from-orange-600/20 to-orange-700/5 border-orange-600/30'
  };
  const medalIcons = ['1er', '2e', '3e'];

  return (
    <div className="space-y-6" data-testid="eco-scores-tab">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Leaf className="w-6 h-6 text-green-400" />
            {t('eco.title', 'Éco-conduite')}
          </h2>
          <p className="text-sm text-zinc-400 mt-1">{t('eco.subtitle', 'Scores calculés à partir des livraisons et rapports IA')}</p>
        </div>
        <Button
          onClick={handleRecalculate}
          disabled={recalculating}
          variant="outline"
          className="border-[#27272A] text-zinc-300"
          data-testid="recalculate-btn"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${recalculating ? 'animate-spin' : ''}`} />
          {recalculating ? t('eco.recalculating', 'Recalcul...') : t('eco.recalculate', 'Recalculer')}
        </Button>
      </div>

      {top3.length > 0 && (
        <div data-testid="eco-podium">
          <h3 className="text-lg font-semibold mb-4">{t('eco.top3Week', 'Top 3 de la semaine')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {top3.map((driver, i) => (
              <div
                key={driver._id}
                className={`bg-gradient-to-br ${medalColors[medals[i]]} border rounded-2xl p-5 text-center transition-transform hover:scale-[1.02]`}
                data-testid={`podium-${i + 1}`}
              >
                <div className="text-3xl mb-2">
                  {i === 0 ? <span className="inline-block w-10 h-10 leading-10 rounded-full bg-yellow-500/20 text-yellow-400 font-black text-lg">{medalIcons[i]}</span> : 
                   i === 1 ? <span className="inline-block w-10 h-10 leading-10 rounded-full bg-zinc-400/20 text-zinc-300 font-black text-lg">{medalIcons[i]}</span> :
                   <span className="inline-block w-10 h-10 leading-10 rounded-full bg-orange-500/20 text-orange-400 font-black text-lg">{medalIcons[i]}</span>}
                </div>
                <p className="font-bold text-lg text-white truncate">{driver.driver_name}</p>
                <p className={`text-3xl font-mono font-black mt-1 ${
                  driver.avg_score >= 80 ? 'text-green-400' : 
                  driver.avg_score >= 60 ? 'text-yellow-400' : 'text-red-400'
                }`}>{Math.round(driver.avg_score)}</p>
                <p className="text-xs text-zinc-400 mt-1">{t('eco.points', 'points / 100')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#121214] border border-[#27272A] rounded-xl p-6 text-center">
          <p className="text-sm text-zinc-400 mb-2">{t('eco.avgScoreCompany', 'Score moyen entreprise')}</p>
          <p className="text-5xl font-bold font-mono text-green-400" data-testid="avg-eco-score">{stats?.avg_eco_score || 0}</p>
          <p className="text-xs text-zinc-500 mt-2">{t('eco.outOf100', 'sur 100')}</p>
        </div>
        <div className="bg-[#121214] border border-[#27272A] rounded-xl p-6 text-center">
          <p className="text-sm text-zinc-400 mb-2">{t('eco.totalCo2', 'CO2 total')}</p>
          <p className="text-3xl font-bold font-mono text-blue-400" data-testid="total-co2">
            {Math.round(ecoSummary.reduce((a, e) => a + (e.total_co2 || 0), 0))}
          </p>
          <p className="text-xs text-zinc-500 mt-2">{t('eco.kgEmitted', 'kg émis')}</p>
        </div>
        <div className="bg-[#121214] border border-[#27272A] rounded-xl p-6 text-center">
          <p className="text-sm text-zinc-400 mb-2">{t('eco.totalDistance', 'Distance totale')}</p>
          <p className="text-3xl font-bold font-mono text-purple-400" data-testid="total-distance">
            {Math.round(ecoSummary.reduce((a, e) => a + (e.total_distance || 0), 0))}
          </p>
          <p className="text-xs text-zinc-500 mt-2">{t('eco.kmTraveled', 'km parcourus')}</p>
        </div>
      </div>

      <EcoChart data={ecoDailyAvg} />

      <div className="bg-[#121214] border border-[#27272A] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#27272A] flex items-center justify-between">
          <h3 className="font-semibold">{t('eco.summaryByDriver', 'Résumé par chauffeur')}</h3>
          <Button
            variant="outline"
            className="border-[#27272A] text-xs"
            onClick={() => {
              const content = `RAPPORT ÉCO-CONDUITE - TRANSPORTER-PRO\n${'='.repeat(40)}\nDate: ${new Date().toLocaleDateString('fr-FR')}\nScore moyen: ${stats?.avg_eco_score || 0}/100\nChauffeurs: ${ecoSummary.length}\n\n${ecoSummary.map(e => `${e.driver_name}: Score ${Math.round(e.avg_score)} | ${Math.round(e.total_distance)}km | CO2: ${Math.round(e.total_co2)}kg`).join('\n')}\n\nRéduction assurance estimée: -${(stats?.avg_eco_score || 0) >= 80 ? '15' : (stats?.avg_eco_score || 0) >= 60 ? '10' : '5'}%`;
              const blob = new Blob([content], { type: 'text/plain' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = `rapport-eco-${new Date().toISOString().split('T')[0]}.txt`;
              a.click();
              toast.success(t('toasts.reportDownloaded', 'Rapport téléchargé'));
            }}
            data-testid="eco-report-btn"
          >
            <FileText className="w-3 h-3 mr-1" />
            {t('eco.exportReport', 'Exporter')}
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="eco-driver-table">
            <thead className="bg-[#1A1A1E] text-xs text-zinc-400 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">{t('eco.rankNum', '#')}</th>
                <th className="px-4 py-3 text-left">{t('eco.driverCol', 'Chauffeur')}</th>
                <th className="px-4 py-3 text-left">{t('eco.avgScoreCol', 'Score moyen')}</th>
                <th className="px-4 py-3 text-left">{t('eco.distanceKm', 'Distance (km)')}</th>
                <th className="px-4 py-3 text-left">{t('eco.co2Kg', 'CO2 (kg)')}</th>
                <th className="px-4 py-3 text-left">{t('eco.fuelL', 'Carburant (L)')}</th>
              </tr>
            </thead>
            <tbody>
              {ecoSummary.map((eco, i) => (
                <tr key={eco._id} className="hover:bg-[#1A1A1E]/50 border-t border-[#27272A]/50">
                  <td className="px-4 py-3 text-zinc-500 font-mono text-sm">{i + 1}</td>
                  <td className="px-4 py-3 font-medium" data-testid={`driver-name-${i}`}>{eco.driver_name}</td>
                  <td className="px-4 py-3">
                    <span className={`font-mono font-semibold ${
                      eco.avg_score >= 80 ? 'text-green-400' : 
                      eco.avg_score >= 60 ? 'text-yellow-400' : 'text-red-400'
                    }`}>{Math.round(eco.avg_score)}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-zinc-300">{Math.round(eco.total_distance)}</td>
                  <td className="px-4 py-3 font-mono text-zinc-300">{Math.round(eco.total_co2)}</td>
                  <td className="px-4 py-3 font-mono text-zinc-300">{Math.round(eco.total_fuel)}</td>
                </tr>
              ))}
              {ecoSummary.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-zinc-500">{t('eco.noEcoData', 'Aucune donnée éco-score. Cliquez "Recalculer" pour générer les scores.')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EcoScoresTab;
