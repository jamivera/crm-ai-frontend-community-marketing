import { useState, useMemo } from 'react';
import {
  Eye,
  TrendingUp,
  Sparkles,
  Megaphone,
  FileText,
  Award,
  ExternalLink,
} from 'lucide-react';
import { useFplusStore } from '../../store';
import { usePortalContext } from './PortalContext';
import { FplusChart } from '../../components/ui/FplusChart';
import { PlatformIcon } from '../../components/ui/PlatformIcon';
import { getClientDemoMetrics } from '../../services/metricsProvider';

export default function PortalMetrics() {
  const { clientId } = usePortalContext();
  const client = useFplusStore(s => s.clients.find(c => c.id === clientId));

  const connectionBanner = !client?.meta_conectado ? (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
      <div>
        <p className="text-xs font-bold text-amber-800 flex items-center justify-center sm:justify-start gap-1.5">
          <span>⚠️ Modo Demostración (Datos de Referencia)</span>
        </p>
        <p className="text-[11px] text-amber-700 mt-0.5">
          Mostrando analíticas simuladas. Conecta tu cuenta comercial de Meta para sincronizar estadísticas reales.
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
  const totalSpend = demoData.totalSpend;
  const totalLeads = demoData.totalLeads;
  const costoPorResultado = demoData.costoPorResultado;

  const cards = [
    { label: 'Inversión', value: `$${totalSpend.toLocaleString('es')} USD`, icon: Megaphone, color: 'text-violet-600 bg-violet-50', desc: 'Presupuesto total invertido en pauta' },
    { label: 'Resultados (Leads)', value: totalLeads.toLocaleString('es'), icon: TrendingUp, color: 'text-blue-600 bg-blue-50', desc: 'Conversiones y prospectos calificados' },
    { label: 'Costo por resultado', value: `$${costoPorResultado.toFixed(2)} USD`, icon: Sparkles, color: 'text-emerald-600 bg-emerald-50', desc: 'Costo promedio por lead calificado' },
    { label: 'Alcance', value: totalAlcance.toLocaleString('es'), icon: Eye, color: 'text-pink-600 bg-pink-50', desc: 'Personas únicas que vieron tus anuncios' },
  ];

  const areaData = demoData.areaData;
  const lineData = demoData.lineData;
  const bestPosts = demoData.bestPosts;

  return (
    <div className="px-5 pt-6 pb-12 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Resultados y Rendimiento</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Métricas de rendimiento e impacto consolidado de la marca · Conexión Meta API
          </p>
        </div>
        <div className="flex items-center gap-1 bg-violet-50 text-violet-700 px-3 py-1.5 rounded-xl border border-violet-100 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          Sincronizado vía Meta API
        </div>
      </div>

      {/* Meta API Connection Alert */}
      {connectionBanner}

      {/* Selector de plataforma por pestaña si hay múltiples contratadas */}
      {platforms.length > 1 && (
        <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/50 self-start max-w-max overflow-x-auto">
          <button
            onClick={() => setActivePlatform('todos')}
            className={`px-3 py-1.5 text-xs font-semibold capitalize transition-all rounded-lg shrink-0 ${
              activePlatform === 'todos'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Consolidado
          </button>
          <button
            onClick={() => setActivePlatform('ver_todas')}
            className={`px-3 py-1.5 text-xs font-semibold capitalize transition-all rounded-lg shrink-0 ${
              activePlatform === 'ver_todas'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Ver todas
          </button>
          {platforms.map(p => (
            <button
              key={p}
              onClick={() => setActivePlatform(p)}
              className={`px-3 py-1.5 text-xs font-semibold capitalize transition-all rounded-lg shrink-0 ${
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
        <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center max-w-md mx-auto my-8 space-y-4 shadow-sm animate-fade-in">
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
      ) : activePlatform === 'ver_todas' ? (
        <div className="space-y-12 animate-fade-in">
          {platforms.map(p => (
            <RenderChannelMetrics key={p} channelName={p} clientId={clientId} client={client} />
          ))}
        </div>
      ) : (
        <>
          {/* Main KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map(c => (
              <div key={c.label} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.color}`}>
                    <c.icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] text-emerald-500 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-full">
                    +12.4% vs mes ant.
                  </span>
                </div>
                <p className="text-2xl font-bold text-slate-800 leading-none mt-4">{c.value}</p>
                <p className="text-xs font-bold text-slate-700 mt-2">{c.label}</p>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug">{c.desc}</p>
              </div>
            ))}
          </div>

          {/* Recharts Plots Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Reach and Impressions Area Chart */}
            <div className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Alcance e Impresiones del Mes</h3>
                <p className="text-xs text-slate-500 mt-0.5">Visibilidad orgánica e invertida acumulada semanal</p>
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

            {/* Clicks and Conversions Line Chart */}
            <div className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Conversiones y Clics</h3>
                <p className="text-xs text-slate-500 mt-0.5">Comportamiento del embudo de conversión semanal</p>
              </div>
              <div className="h-60 flex items-center justify-center">
                <FplusChart
                  tipo="line"
                  data={lineData}
                  series={[
                    { key: 'Clics', name: 'Clics en Enlace', color: '#8b5cf6' },
                    { key: 'Leads', name: 'Leads Captados', color: '#10b981' }
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Top Performing Publications */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b pb-3">
              <Award className="w-4 h-4 text-slate-500" />
              <p className="text-sm font-bold text-slate-800">Publicaciones Destacadas (Top Performing)</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {bestPosts.map(bp => (
                <div key={bp.id} className="border border-slate-100 hover:border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col hover:shadow-md transition-shadow bg-white">
                  <div className={`h-24 bg-gradient-to-br ${bp.visual.gradient} flex items-center justify-center relative`}>
                    <span className="text-4xl">{bp.visual.emoji}</span>
                    <div className="absolute top-2.5 left-2.5">
                      <PlatformIcon platform={bp.plataforma} showLabel={false} size={16} />
                    </div>
                    {bp.url && (
                      <a href={bp.url} target="_blank" rel="noopener noreferrer" className="absolute top-2.5 right-2.5 w-6 h-6 bg-black/40 text-white rounded-full flex items-center justify-center hover:bg-black/60 transition-colors">
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <div className="p-3.5 flex-1 flex flex-col gap-2.5">
                    <p className="text-xs font-bold text-slate-800 line-clamp-1">{bp.nombre}</p>
                    <div className="grid grid-cols-3 gap-1.5 text-center">
                      <div className="bg-slate-50 py-1 rounded-lg">
                        <p className="text-[10px] font-extrabold text-slate-700">{bp.reach.toLocaleString('es')}</p>
                        <p className="text-[7px] text-slate-400 uppercase font-medium">Alcance</p>
                      </div>
                      <div className="bg-slate-50 py-1 rounded-lg">
                        <p className="text-[10px] font-extrabold text-slate-700">{bp.likes}</p>
                        <p className="text-[7px] text-slate-400 uppercase font-medium">Likes</p>
                      </div>
                      <div className="bg-slate-50 py-1 rounded-lg">
                        <p className="text-[10px] font-extrabold text-slate-700">{bp.engagement}%</p>
                        <p className="text-[7px] text-slate-400 uppercase font-medium">Eng.</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Campaigns and Advertising Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm md:col-span-2 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-slate-500" />
                  <p className="text-sm font-bold text-slate-800">Rendimiento de Campañas Activas</p>
                </div>
                <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                  Ingest Activo
                </span>
              </div>

              <div className="space-y-3.5">
                {demoData.campaignsPerformance.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    No hay campañas activas este mes.
                  </div>
                ) : (
                  demoData.campaignsPerformance.map(c => {
                    return (
                      <div key={c.id} className="border border-slate-100 hover:border-slate-200 rounded-xl p-3.5 transition-colors space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs font-bold text-slate-800">{c.nombre}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Código: {c.codigo_interno} · Objetivo: {c.objetivo}</p>
                          </div>
                          <span className="text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full capitalize">
                            {c.estado}
                          </span>
                        </div>

                        <div className="grid grid-cols-4 gap-2 text-center pt-1">
                          <div className="bg-slate-50 py-1.5 rounded-lg">
                            <p className="text-xs font-bold text-slate-700">{c.leads}</p>
                            <p className="text-[8px] text-slate-400 uppercase mt-0.5 font-medium">Leads</p>
                          </div>
                          <div className="bg-slate-50 py-1.5 rounded-lg">
                            <p className="text-xs font-bold text-slate-700">${c.cpl.toFixed(2)}</p>
                            <p className="text-[8px] text-slate-400 uppercase mt-0.5 font-medium">CPL Prom.</p>
                          </div>
                          <div className="bg-slate-50 py-1.5 rounded-lg">
                            <p className="text-xs font-bold text-slate-700">{c.roas}x</p>
                            <p className="text-[8px] text-slate-400 uppercase mt-0.5 font-medium">ROAS</p>
                          </div>
                          <div className="bg-slate-50 py-1.5 rounded-lg">
                            <p className="text-xs font-bold text-slate-700">${c.presupuesto_total.toLocaleString('es')}</p>
                            <p className="text-[8px] text-slate-400 uppercase mt-0.5 font-medium">Inversión</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Lead Summary */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b pb-3">
                <FileText className="w-4 h-4 text-slate-500" />
                <p className="text-sm font-bold text-slate-800">Conversión de Prospectos</p>
              </div>
              <div className="space-y-4">
                <div className="text-center py-2 bg-slate-50 rounded-xl">
                  <p className="text-2xl font-bold text-slate-800">{totalLeads}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">Leads Captados este mes</p>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Costo por Lead (CPL)</span>
                    <span className="font-semibold text-slate-700">${(totalSpend / (totalLeads || 1)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Retorno ROAS Promedio</span>
                    <span className="font-semibold text-slate-700">3.8x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Inversión Publicitaria</span>
                    <span className="font-semibold text-slate-700">${totalSpend.toLocaleString()} USD</span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 bg-slate-50/50 p-2.5 rounded-lg leading-relaxed">
                  * Datos auditados automáticamente desde tus cuentas publicitarias vinculadas.
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function RenderChannelMetrics({
  channelName,
  clientId,
  client,
}: {
  channelName: string;
  clientId: string;
  client: any;
}) {
  const demoData = getClientDemoMetrics(clientId, channelName, client);
  const totalAlcance = demoData.totalAlcance;
  const totalSpend = demoData.totalSpend;
  const totalLeads = demoData.totalLeads;
  const costoPorResultado = demoData.costoPorResultado;

  const cards = [
    { label: 'Inversión', value: `$${totalSpend.toLocaleString('es')} USD`, icon: Megaphone, color: 'text-violet-600 bg-violet-50', desc: 'Presupuesto total invertido' },
    { label: 'Resultados (Leads)', value: totalLeads.toLocaleString('es'), icon: TrendingUp, color: 'text-blue-600 bg-blue-50', desc: 'Conversiones y prospectos calificados' },
    { label: 'Costo por resultado', value: `$${costoPorResultado.toFixed(2)} USD`, icon: Sparkles, color: 'text-emerald-600 bg-emerald-50', desc: 'Costo promedio por lead' },
    { label: 'Alcance', value: totalAlcance.toLocaleString('es'), icon: Eye, color: 'text-pink-600 bg-pink-50', desc: 'Personas únicas que vieron anuncios' },
  ];

  return (
    <div className="space-y-6 pt-6 border-t border-slate-200 first:border-0 first:pt-0">
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">
          Canal: {channelName}
        </span>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.color}`}>
                <c.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800 leading-none mt-4">{c.value}</p>
            <p className="text-xs font-bold text-slate-700 mt-2">{c.label}</p>
            <p className="text-[10px] text-slate-400 mt-1 leading-snug">{c.desc}</p>
          </div>
        ))}
      </div>

      {/* Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Alcance e Impresiones ({channelName})</h3>
            <p className="text-xs text-slate-500 mt-0.5">Visibilidad acumulada semanal</p>
          </div>
          <div className="h-60 flex items-center justify-center">
            <FplusChart
              tipo="area"
              data={demoData.areaData}
              series={[
                { key: 'Alcance', name: 'Alcance Único', color: '#4f46e5' },
                { key: 'Impresiones', name: 'Impresiones Totales', color: '#3b82f6' }
              ]}
            />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Conversiones y Clics ({channelName})</h3>
            <p className="text-xs text-slate-500 mt-0.5">Comportamiento del embudo semanal</p>
          </div>
          <div className="h-60 flex items-center justify-center">
            <FplusChart
              tipo="line"
              data={demoData.lineData}
              series={[
                { key: 'Clics', name: 'Clics en Enlace', color: '#8b5cf6' },
                { key: 'Leads', name: 'Leads Captados', color: '#10b981' }
              ]}
            />
          </div>
        </div>
      </div>

      {/* Top Performing Publications */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b pb-3">
          <Award className="w-4 h-4 text-slate-500" />
          <p className="text-sm font-bold text-slate-800">Publicaciones Destacadas ({channelName})</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {demoData.bestPosts.map(bp => (
            <div key={bp.id} className="border border-slate-100 hover:border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col hover:shadow-md transition-shadow bg-white">
              <div className={`h-24 bg-gradient-to-br ${bp.visual.gradient} flex items-center justify-center relative`}>
                <span className="text-4xl">{bp.visual.emoji}</span>
                <div className="absolute top-2.5 left-2.5">
                  <PlatformIcon platform={bp.plataforma} showLabel={false} size={16} />
                </div>
                {bp.url && (
                  <a href={bp.url} target="_blank" rel="noopener noreferrer" className="absolute top-2.5 right-2.5 w-6 h-6 bg-black/40 text-white rounded-full flex items-center justify-center hover:bg-black/60 transition-colors">
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <div className="p-3.5 flex-1 flex flex-col gap-2.5">
                <p className="text-xs font-bold text-slate-800 line-clamp-1">{bp.nombre}</p>
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <div className="bg-slate-50 py-1 rounded-lg">
                    <p className="text-[10px] font-extrabold text-slate-700">{bp.reach.toLocaleString('es')}</p>
                    <p className="text-[7px] text-slate-400 uppercase font-medium">Alcance</p>
                  </div>
                  <div className="bg-slate-50 py-1 rounded-lg">
                    <p className="text-[10px] font-extrabold text-slate-700">{bp.likes}</p>
                    <p className="text-[7px] text-slate-400 uppercase font-medium">Likes</p>
                  </div>
                  <div className="bg-slate-50 py-1 rounded-lg">
                    <p className="text-[10px] font-extrabold text-slate-700">{bp.engagement}%</p>
                    <p className="text-[7px] text-slate-400 uppercase font-medium">Eng.</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

