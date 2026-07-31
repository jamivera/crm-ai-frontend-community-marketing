import { useState, useMemo } from 'react';
import {
  Eye,
  TrendingUp,
  Sparkles,
  Megaphone,
  Award,
  ArrowRight,
  Percent,
  Coins,
  DollarSign,
  FileText
} from 'lucide-react';
import { useFplusStore } from '../../store';
import { usePortalContext } from '../Portal/PortalContext';
import { FplusChart } from '../../components/ui/FplusChart';
import { getUnifiedPlatformMetrics } from '../../services/metricsAdapter';
import { ReportSelectionModal } from '../../components/modals/ReportSelectionModal';

export default function ClientMetrics() {
  const { clientId } = usePortalContext();
  const client = useFplusStore(s => s.clients.find(c => c.id === clientId));
  const campaigns = useFplusStore(s => s.campaigns);

  // Available platforms configured for client
  const activePlatforms = useMemo(() => {
    return client?.pauta_plataformas || [];
  }, [client]);

  const [activePlatform, setActivePlatform] = useState<'Meta Ads' | 'Google Ads' | 'LinkedIn Ads' | 'TikTok Ads' | 'todos'>('todos');
  const [showReportModal, setShowReportModal] = useState(false);

  // Consume the adapter dynamically (architecturally decoupled for API readiness)
  const unifiedMetrics = useMemo(() => {
    return getUnifiedPlatformMetrics(clientId, activePlatform, client, campaigns);
  }, [clientId, activePlatform, client, campaigns]);

  // Dynamic API Connection text based on selection (Point 4)
  const apiText = useMemo(() => {
    if (activePlatform === 'todos') return 'Contra APIs';
    if (activePlatform === 'Meta Ads') return 'Contra API Meta';
    return `Contra API ${activePlatform}`;
  }, [activePlatform]);

  // Check if there are campaigns or budget configuration to prevent false "Canal sin campañas" alerts
  const hasData = useMemo(() => {
    if (activePlatform === 'todos') {
      return activePlatforms.length > 0;
    }
    const hasCamps = campaigns.some(c => c.client_id === clientId && c.plataforma === activePlatform && c.estado === 'activa');
    const hasBudget = (client?.distribucion_pauta_overrides?.[activePlatform] ?? 0) > 0;
    return hasCamps || hasBudget;
  }, [activePlatform, activePlatforms, campaigns, clientId, client]);

  // Map icon classes for standard renderers
  const getIcon = (key: string) => {
    switch (key) {
      case 'spend': return Megaphone;
      case 'leads': return TrendingUp;
      case 'cpl': return Sparkles;
      case 'reach': return Eye;
      case 'impressions': return Eye;
      case 'video_views': return Award;
      case 'clicks': return ArrowRight;
      case 'freq': return Percent;
      case 'cpm': return Coins;
      case 'ctr': return Percent;
      case 'cpc': return Coins;
      case 'roas': return DollarSign;
      default: return Sparkles;
    }
  };

  const getIconColor = (key: string) => {
    switch (key) {
      case 'spend': return 'text-violet-600 bg-violet-50';
      case 'leads': return 'text-blue-600 bg-blue-50';
      case 'cpl': return 'text-emerald-600 bg-emerald-50';
      case 'reach': return 'text-pink-600 bg-pink-50';
      case 'ctr': return 'text-amber-600 bg-amber-50';
      case 'cpc': return 'text-indigo-600 bg-indigo-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  return (
    <div className="px-8 pt-10 pb-20 max-w-6xl mx-auto space-y-12">
      
      {/* 1. Header Area with dynamic API Status (Point 4) and report generation trigger */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Métricas y Auditoría de Resultados</h1>
          <p className="text-sm text-slate-500 mt-2">
            Panel de control operativo y monitor de campañas para gestores de la agencia.
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start">
          <button
            onClick={() => setShowReportModal(true)}
            className="px-4 py-2.5 text-xs font-semibold rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
            title="Generar informe PDF"
          >
            <FileText className="w-3.5 h-3.5" />
            Generar informe mensual
          </button>
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2.5 rounded-2xl border border-emerald-100/60 text-xs font-bold shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            {apiText}
          </div>
        </div>
      </div>

      {/* 2. Platform Selector (Point 2 - Ver todas is consolidated) */}
      {activePlatforms.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2.5 bg-slate-100/80 p-2 rounded-2xl border border-slate-200/50 max-w-max">
          <button
            onClick={() => setActivePlatform('todos')}
            className={`px-5 py-2.5 text-xs font-extrabold transition-all rounded-xl cursor-pointer ${
              activePlatform === 'todos'
                ? 'bg-white text-blue-600 shadow-md border border-slate-200/10'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Ver todas
          </button>
          {activePlatforms.map(p => (
            <button
              key={p}
              onClick={() => setActivePlatform(p as any)}
              className={`px-5 py-2.5 text-xs font-extrabold transition-all rounded-xl cursor-pointer ${
                activePlatform === p
                  ? 'bg-white text-blue-600 shadow-md border border-slate-200/10'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200/60 rounded-3xl p-6 text-center text-amber-800 text-sm font-semibold shadow-sm">
          No hay plataformas configuradas con pauta activa en este momento.
        </div>
      )}

      {/* 3. Metrics Render or empty check (Point 5 - Spacing/UX/UI updates) */}
      {hasData ? (
        <div className="space-y-12">
          
          {/* Grid of Dynamic KPIs */}
          <div className="space-y-6">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
              {activePlatform === 'todos' ? 'Métricas Consolidadas Generales' : `Métricas de ${activePlatform}`}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {unifiedMetrics.kpiCards.map(card => {
                const Icon = getIcon(card.key);
                const colorClass = getIconColor(card.key);
                return (
                  <div key={card.key} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{card.label}</p>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colorClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-3xl font-black text-slate-850 leading-none mt-5 tracking-tight">{card.value}</p>
                    <p className="text-[11px] text-slate-400 mt-2.5 leading-snug font-medium">{card.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Evolution / Charts Block */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4 hover:shadow-md transition-shadow">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Evolución de Rendimiento</h3>
                <p className="text-xs text-slate-500 mt-1">Impacto acumulado por semanas</p>
              </div>
              <div className="h-64 flex items-center justify-center">
                <FplusChart
                  tipo="area"
                  data={unifiedMetrics.evolutionChartData}
                  series={unifiedMetrics.evolutionChartSeries.slice(0, 1)}
                />
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4 hover:shadow-md transition-shadow">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Conversiones y Conversión semanal</h3>
                <p className="text-xs text-slate-500 mt-1">Evolución del embudo semanal</p>
              </div>
              <div className="h-64 flex items-center justify-center">
                <FplusChart
                  tipo="line"
                  data={unifiedMetrics.evolutionChartData}
                  series={unifiedMetrics.evolutionChartSeries.slice(1, 2).length ? unifiedMetrics.evolutionChartSeries.slice(1, 2) : unifiedMetrics.evolutionChartSeries}
                />
              </div>
            </div>
          </div>

          {/* 5. Campaign performance grid */}
          {unifiedMetrics.campaigns.length > 0 && (
            <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm space-y-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                <div className="flex items-center gap-2.5">
                  <Megaphone className="w-4 h-4 text-slate-400" />
                  <h3 className="text-sm font-bold text-slate-800">Campañas Sincronizadas y Activas</h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {unifiedMetrics.campaigns.map(c => (
                  <div key={c.id} className="border border-slate-100 hover:border-slate-200/80 rounded-2xl p-5 transition-colors space-y-4 bg-slate-50/20">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-bold text-slate-800">{c.name}</p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Objetivo: <span className="font-semibold text-slate-500">{c.objective}</span>
                        </p>
                      </div>
                      <span className="text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100/50 px-2.5 py-0.5 rounded-full capitalize">
                        {c.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center pt-2">
                      <div className="bg-white border border-slate-100 py-2.5 rounded-xl">
                        <p className="text-sm font-bold text-slate-700">{c.leads ?? 0}</p>
                        <p className="text-[8px] text-slate-400 uppercase mt-0.5 font-bold">Leads</p>
                      </div>
                      <div className="bg-white border border-slate-100 py-2.5 rounded-xl">
                        <p className="text-sm font-bold text-slate-700">${c.cpl?.toFixed(2) ?? '0.00'}</p>
                        <p className="text-[8px] text-slate-400 uppercase mt-0.5 font-bold">CPL</p>
                      </div>
                      <div className="bg-white border border-slate-100 py-2.5 rounded-xl">
                        <p className="text-sm font-bold text-slate-700">{c.roas ?? 3.5}x</p>
                        <p className="text-[8px] text-slate-400 uppercase mt-0.5 font-bold">ROAS</p>
                      </div>
                      <div className="bg-white border border-slate-100 py-2.5 rounded-xl">
                        <p className="text-sm font-bold text-slate-700">${c.spend.toLocaleString('es')}</p>
                        <p className="text-[8px] text-slate-400 uppercase mt-0.5 font-bold">Inversión</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. Extensible API-ready tables (Only displays if actual data exists, e.g. from campaign rows) */}
          {unifiedMetrics.extraData?.gridRows && unifiedMetrics.extraData.gridRows.length > 0 && (
            <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm space-y-6 hover:shadow-md transition-shadow">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-sm font-bold text-slate-800">
                  Planificación Operativa / Palabras clave en {activePlatform}
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">Estructuras reales leídas de la planificación de anuncios.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[10px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase tracking-wider">
                      <th className="p-3">Estructura Nivel 1</th>
                      <th className="p-3">Estructura Nivel 2</th>
                      <th className="p-3">Estructura Nivel 3</th>
                      {activePlatform === 'Google Ads' ? (
                        <th className="p-3">Concordancia</th>
                      ) : (
                        <th className="p-3">Segmentación</th>
                      )}
                      <th className="p-3 text-right">Presupuesto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {unifiedMetrics.extraData.gridRows.map((r: any) => (
                      <tr key={r.id} className="text-slate-600 hover:bg-slate-50/50">
                        <td className="p-3 font-semibold text-slate-800">{r.campaign_name}</td>
                        <td className="p-3">{r.adset_name}</td>
                        <td className="p-3">{r.ad_name}</td>
                        {activePlatform === 'Google Ads' ? (
                          <td className="p-3 capitalize">{r.concordancia || 'Exacta'}</td>
                        ) : (
                          <td className="p-3">{r.segmentation}</td>
                        )}
                        <td className="p-3 text-right font-bold text-slate-900">${r.budget} USD</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-md mx-auto space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto border border-slate-100">
            <span className="text-3xl">📊</span>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-800">Canal sin campañas activas</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              No disponemos de información histórica o activa registrada para esta plataforma en este momento. Las métricas aparecerán cuando se lance la primera campaña.
            </p>
          </div>
        </div>
      )}

      {/* Report Selection Modal */}
      {showReportModal && (
        <ReportSelectionModal
          clientId={clientId}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}
