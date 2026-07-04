import { BarChart3, Eye, Heart, MousePointer, TrendingUp } from 'lucide-react';
import { useFplusStore } from '../../store';
import { usePortalContext } from '../Portal/PortalContext';
import { PLATFORM_LABELS } from '../../constants';

// Métricas del cliente — lee las PublicationMetric existentes (fuente única).
// Se poblará automáticamente conforme se registren publicaciones y métricas.

export default function ClientMetrics() {
  const { clientId } = usePortalContext();
  const allPublications = useFplusStore(s => s.publications);
  const metrics = useFplusStore(s => s.metrics);
  const publications = allPublications.filter(p => p.client_id === clientId);

  const pubIds = new Set(publications.map(p => p.id));
  const clientMetrics = metrics.filter(m => pubIds.has(m.publication_id));

  const sum = (fn: (m: typeof clientMetrics[number]) => number) =>
    clientMetrics.reduce((a, m) => a + (fn(m) || 0), 0);

  const totalAlcance = sum(m => m.reach ?? 0);
  const totalInteracciones = sum(m => (m.likes ?? 0) + (m.comments ?? 0) + (m.shares ?? 0) + (m.saves ?? 0));
  const totalClicks = sum(m => m.clicks ?? 0);
  const avgEngagement = clientMetrics.length
    ? clientMetrics.reduce((a, m) => a + (m.engagement_rate ?? 0), 0) / clientMetrics.length
    : 0;

  const cards = [
    { label: 'Alcance total', value: totalAlcance.toLocaleString('es'), icon: Eye, color: 'text-blue-500 bg-blue-50' },
    { label: 'Interacciones', value: totalInteracciones.toLocaleString('es'), icon: Heart, color: 'text-pink-500 bg-pink-50' },
    { label: 'Clicks al link', value: totalClicks.toLocaleString('es'), icon: MousePointer, color: 'text-violet-500 bg-violet-50' },
    { label: 'Engagement prom.', value: `${avgEngagement.toFixed(1)}%`, icon: TrendingUp, color: 'text-emerald-500 bg-emerald-50' },
  ];

  return (
    <div className="px-4 pt-5 pb-8 max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-lg font-bold text-slate-800">Métricas</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          {publications.length} {publications.length === 1 ? 'publicación registrada' : 'publicaciones registradas'} · {clientMetrics.length} mediciones
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map(c => (
          <div key={c.label} className="bg-white border border-slate-100 rounded-2xl p-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${c.color}`}>
              <c.icon className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold text-slate-800 leading-none">{c.value}</p>
            <p className="text-[10px] text-slate-400 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Indicadores de pauta — estructura lista para la API de Meta/Google/TikTok/LinkedIn.
          Cada campaña ya sabe qué contenido, objetivo y cliente le corresponde. */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Indicadores de pauta</p>
          <span className="text-[9px] font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
            Se activan al conectar API Meta
          </span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {[
            { k: 'Impresiones', v: sum(m => m.impressions ?? 0) },
            { k: 'CTR', v: null },
            { k: 'CPC', v: clientMetrics.length ? clientMetrics.reduce((a, m) => a + (m.cpc ?? 0), 0) / clientMetrics.length : null, money: true },
            { k: 'CPM', v: clientMetrics.length ? clientMetrics.reduce((a, m) => a + (m.cpm ?? 0), 0) / clientMetrics.length : null, money: true },
            { k: 'Leads', v: sum(m => m.leads ?? 0) },
            { k: 'ROAS', v: null },
            { k: 'Mensajes', v: null },
            { k: 'Conversaciones', v: null },
            { k: 'Seguidores', v: null },
            { k: 'Video views', v: sum(m => m.video_views ?? 0) },
            { k: 'Inversión', v: sum(m => m.spend ?? 0), money: true },
            { k: 'Costo/resultado', v: null },
          ].map(ind => (
            <div key={ind.k} className="text-center py-2 bg-slate-50 rounded-xl">
              <p className={`text-sm font-bold leading-none ${ind.v ? 'text-slate-700' : 'text-slate-300'}`}>
                {ind.v
                  ? `${ind.money ? '$' : ''}${(Math.round(ind.v * 100) / 100).toLocaleString('es')}`
                  : '—'}
              </p>
              <p className="text-[9px] text-slate-400 mt-1">{ind.k}</p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-400 mt-3">
          Flujo conectado: Brief → Plan → Calendario → Contenido → Multimedia → Campañas → API Meta → Métricas.
          Cada resultado llegará ya vinculado a su campaña, contenido y objetivo.
        </p>
      </div>

      {clientMetrics.length === 0 ? (
        <div className="text-center py-14 text-slate-400">
          <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Aún no hay métricas registradas.</p>
          <p className="text-xs mt-1">Se mostrarán aquí al registrar publicaciones y sus resultados.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-2.5">Publicación</th>
                <th className="px-4 py-2.5">Alcance</th>
                <th className="px-4 py-2.5">Interacciones</th>
                <th className="px-4 py-2.5">Eng.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {clientMetrics.map(m => {
                const pub = publications.find(p => p.id === m.publication_id);
                return (
                  <tr key={m.id}>
                    <td className="px-4 py-2.5">
                      <p className="text-xs font-medium text-slate-700 truncate max-w-[200px]">
                        {pub ? `${PLATFORM_LABELS[pub.plataforma]} · ${new Date(pub.fecha_programada).toLocaleDateString('es')}` : m.publication_id}
                      </p>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-600">{(m.reach ?? 0).toLocaleString('es')}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-600">
                      {((m.likes ?? 0) + (m.comments ?? 0) + (m.shares ?? 0) + (m.saves ?? 0)).toLocaleString('es')}
                    </td>
                    <td className="px-4 py-2.5 text-xs font-semibold text-emerald-600">{(m.engagement_rate ?? 0).toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
