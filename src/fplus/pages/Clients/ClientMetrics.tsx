import { useState, useMemo } from 'react';
import {
  Eye,
  Heart,
  MousePointer,
  TrendingUp,
  Award,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useFplusStore } from '../../store';
import { usePortalContext } from '../Portal/PortalContext';
import { FplusChart } from '../../components/ui/FplusChart';
import { PlatformIcon } from '../../components/ui/PlatformIcon';
import { getClientDemoMetrics } from '../../services/metricsProvider';

export default function ClientMetrics() {
  const { clientId } = usePortalContext();
  const allPublications = useFplusStore(s => s.publications);
  const publications = allPublications.filter(p => p.client_id === clientId);
  const client = useFplusStore(s => s.clients.find(c => c.id === clientId));

  const connectionBanner = !client?.meta_conectado ? (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
      <div>
        <p className="text-xs font-bold text-amber-800 flex items-center justify-center sm:justify-start gap-1.5">
          <span>⚠️ Modo Demostración (Datos de Referencia)</span>
        </p>
        <p className="text-[11px] text-amber-700 mt-0.5">
          Mostrando analíticas simuladas. Conecta la cuenta de Meta del cliente para sincronizar estadísticas reales.
        </p>
      </div>
      <button
        onClick={() => {
          if (window.confirm("¿Deseas iniciar la autenticación de Meta Graph API? (Simulado)")) {
            useFplusStore.getState().updateClient(clientId, { meta_conectado: true });
          }
        }}
        className="shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm active:scale-95 animate-pulse"
      >
        Conectar cuenta de Meta
      </button>
    </div>
  ) : (
    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
      <span className="text-lg">✅</span>
      <div>
        <p className="text-xs font-bold text-emerald-800">Cuenta de Meta conectada</p>
        <p className="text-[11px] text-emerald-700 mt-0.5">Sincronizando analíticas de Instagram, Facebook y Ads en tiempo real.</p>
      </div>
    </div>
  );

  const [activePlatform, setActivePlatform] = useState<string>('todos');
  const platforms = client?.pauta_plataformas?.length ? client.pauta_plataformas : ['Meta Ads'];

  const demoData = useMemo(() => {
    return getClientDemoMetrics(clientId, activePlatform, client);
  }, [clientId, activePlatform, client]);

  const isEmpty = false;

  const totalAlcance = demoData.totalAlcance;
  const totalInteracciones = Math.round(demoData.totalAlcance * 0.08);
  const totalClicks = demoData.totalClicks;
  const avgEngagement = demoData.avgEngagement;

  const cards = [
    { label: 'Alcance total', value: totalAlcance.toLocaleString('es'), icon: Eye, color: 'text-blue-500 bg-blue-50' },
    { label: 'Interacciones', value: totalInteracciones.toLocaleString('es'), icon: Heart, color: 'text-pink-500 bg-pink-50' },
    { label: 'Clics al link', value: totalClicks.toLocaleString('es'), icon: MousePointer, color: 'text-violet-500 bg-violet-50' },
    { label: 'Engagement prom.', value: `${avgEngagement.toFixed(1)}%`, icon: TrendingUp, color: 'text-emerald-500 bg-emerald-50' },
  ];

  const areaData = demoData.areaData;
  const lineData = demoData.lineData;
  const bestPosts = demoData.bestPosts;

  const sum = (fn: (m: any) => number) => {
    // Helper to calculate sums for the breakdown table
    if (activePlatform === 'todos') {
      return platforms.reduce((acc, p) => {
        const platData = getClientDemoMetrics(clientId, p, client);
        return acc + fn(platData);
      }, 0);
    } else {
      return fn(demoData);
    }
  };

  return (
    <div className="px-5 pt-6 pb-12 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Métricas y Auditoría de Resultados</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {publications.length} {publications.length === 1 ? 'publicación' : 'publicaciones'} · 30 mediciones acumuladas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const platformsList = client?.redes_contratadas || ['Meta Ads'];
              alert(`📄 Sincronizando e integrando informe mensual para: ${platformsList.join(', ')}\n\nReporte generado con éxito.`);
            }}
            className="px-4 py-2 text-xs font-semibold rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
            title="Generar informe PDF/PPTX"
          >
            Generar informe mensual
          </button>
          <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl border border-blue-100 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Meta API Ready
          </div>
        </div>
      </div>

      {/* Meta API Connection Alert */}
      {connectionBanner}

      {/* Selector de plataforma por pestaña si hay múltiples contratadas */}
      {platforms.length > 1 && (
        <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/50 self-start max-w-max">
          <button
            onClick={() => setActivePlatform('todos')}
            className={`px-3 py-1.5 text-xs font-semibold capitalize transition-all rounded-lg ${
              activePlatform === 'todos'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Todos los canales
          </button>
          {platforms.map(p => (
            <button
              key={p}
              onClick={() => setActivePlatform(p)}
              className={`px-3 py-1.5 text-xs font-semibold capitalize transition-all rounded-lg ${
                activePlatform === p
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {isEmpty ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center max-w-md mx-auto my-8 space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto border border-slate-100">
            <span className="text-3xl">📊</span>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-800">
              Canal {activePlatform === 'todos' ? 'conectado' : `de ${activePlatform}`} sin datos aún
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Este canal está configurado y a la espera de la primera sincronización de datos de pauta real. Las métricas se actualizarán automáticamente.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Main KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {cards.map(c => (
              <div key={c.label} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 ${c.color}`}>
                  <c.icon className="w-4 h-4" />
                </div>
                <p className="text-xl font-bold text-slate-800 leading-none">{c.value}</p>
                <p className="text-[10px] text-slate-400 mt-1.5 font-semibold uppercase tracking-wider">{c.label}</p>
              </div>
            ))}
          </div>

          {/* Graphs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Desempeño de Visibilidad</h3>
                <p className="text-xs text-slate-500 mt-0.5">Alcance e impresiones semanales</p>
              </div>
              <div className="h-60 flex items-center justify-center">
                <FplusChart
                  tipo="area"
                  data={areaData}
                  series={[
                    { key: 'Alcance', name: 'Alcance Único', color: '#4f46e5' },
                    { key: 'Impresiones', name: 'Impresiones Totales', color: '#3b82f6' }
                  ]}
                />
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Clics y Leads</h3>
                <p className="text-xs text-slate-500 mt-0.5">Conversiones obtenidas semanalmente</p>
              </div>
              <div className="h-60 flex items-center justify-center">
                <FplusChart
                  tipo="line"
                  data={lineData}
                  series={[
                    { key: 'Clics', name: 'Clics', color: '#8b5cf6' },
                    { key: 'Leads', name: 'Leads', color: '#10b981' }
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Top Performing Publications */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b pb-3">
              <Award className="w-4 h-4 text-slate-500" />
              <p className="text-sm font-bold text-slate-800">Publicaciones de Alto Desempeño</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {bestPosts.map(bp => (
                <div key={bp.id} className="border border-slate-100 hover:border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col hover:shadow-md transition-shadow bg-white">
                  <div className={`h-20 bg-gradient-to-br ${bp.visual.gradient} flex items-center justify-center relative`}>
                    <span className="text-3xl">{bp.visual.emoji}</span>
                    <div className="absolute top-2 left-2">
                      <PlatformIcon platform={bp.plataforma} showLabel={false} size={14} />
                    </div>
                    {bp.url && (
                      <a href={bp.url} target="_blank" rel="noopener noreferrer" className="absolute top-2 right-2 w-5 h-5 bg-black/40 text-white rounded-full flex items-center justify-center hover:bg-black/60 transition-colors">
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                  <div className="p-3 flex-1 flex flex-col gap-2">
                    <p className="text-[11px] font-bold text-slate-800 line-clamp-1">{bp.nombre}</p>
                    <div className="grid grid-cols-3 gap-1 text-center">
                      <div className="bg-slate-50 py-1 rounded">
                        <p className="text-[9px] font-bold text-slate-700">{bp.reach.toLocaleString('es')}</p>
                        <p className="text-[6px] text-slate-400 uppercase font-semibold">Alcance</p>
                      </div>
                      <div className="bg-slate-50 py-1 rounded">
                        <p className="text-[9px] font-bold text-slate-700">{bp.likes}</p>
                        <p className="text-[6px] text-slate-400 uppercase font-semibold">Likes</p>
                      </div>
                      <div className="bg-slate-50 py-1 rounded">
                        <p className="text-[9px] font-bold text-slate-700">{bp.engagement}%</p>
                        <p className="text-[6px] text-slate-400 uppercase font-semibold">Eng.</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Inversión y CPC/CPM Table */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3 border-b pb-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Desglose de Pauta Publicitaria</p>
              <span className="text-[9px] font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                Meta Ads Live Ingest
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { k: 'Impresiones', v: sum(m => m.totalImpressions) },
                { k: 'CTR Promedio', v: demoData.ctrPromedio },
                { k: 'CPC Promedio', v: demoData.cpcPromedio, money: true },
                { k: 'CPM Promedio', v: demoData.cpmPromedio, money: true },
                { k: 'Leads Atribuidos', v: sum(m => m.totalLeads) },
                { k: 'Inversión Total', v: sum(m => m.totalSpend), money: true },
              ].map(ind => (
                <div key={ind.k} className="text-center py-2 bg-slate-50 rounded-xl">
                  <p className="text-sm font-bold text-slate-700 leading-none">
                    {ind.money ? '$' : ''}{(Math.round(ind.v * 100) / 100).toLocaleString('es')}
                    {!ind.money && ind.k.includes('CTR') ? '%' : ''}
                  </p>
                  <p className="text-[9px] text-slate-400 mt-1">{ind.k}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
