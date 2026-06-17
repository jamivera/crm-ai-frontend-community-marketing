import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Target, DollarSign, TrendingUp,
  Users, FileImage, ChevronRight, BarChart2, Eye, MousePointer,
} from 'lucide-react';
import { useFplusStore } from '../../store';
import { ContentStateChip } from '../../components/ui/StateChip';
import { PLATFORM_LABELS } from '../../constants';

const CAMPAIGN_STATE_COLORS: Record<string, string> = {
  planificada: 'bg-slate-100 text-slate-600',
  activa: 'bg-emerald-100 text-emerald-700',
  pausada: 'bg-amber-100 text-amber-700',
  completada: 'bg-blue-100 text-blue-700',
  cancelada: 'bg-red-100 text-red-600',
};
const CAMPAIGN_STATE_LABELS: Record<string, string> = {
  planificada: 'Planificada', activa: 'Activa', pausada: 'Pausada',
  completada: 'Completada', cancelada: 'Cancelada',
};

type Tab = 'resumen' | 'contenido' | 'publicaciones' | 'metricas';

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('resumen');

  const campaigns = useFplusStore(s => s.campaigns);
  const contentPieces = useFplusStore(s => s.contentPieces);
  const allPublications = useFplusStore(s => s.publications);
  const allMetrics = useFplusStore(s => s.metrics);

  const campaign = campaigns.find(c => c.id === id);

  if (!campaign) {
    return (
      <div className="p-6 text-center py-20 text-slate-400">
        <p>Campaña no encontrada.</p>
        <button onClick={() => navigate('/fplus/campaigns')} className="mt-3 text-blue-600 text-sm hover:underline">
          ← Volver a campañas
        </button>
      </div>
    );
  }

  const pieces = contentPieces.filter(cp => cp.campaign_id === campaign.id);
  const publications = allPublications.filter(p => p.campaign_id === campaign.id);
  const pubIds = new Set(publications.map(p => p.id));
  const campaignMetrics = allMetrics.filter(m => pubIds.has(m.publication_id));
  const progress = campaign.piezas_totales > 0
    ? Math.round((campaign.piezas_publicadas / campaign.piezas_totales) * 100)
    : 0;

  // Aggregate metrics across all publications of this campaign
  const agg = {
    reach: campaignMetrics.reduce((s, m) => s + (m.reach ?? 0), 0),
    impressions: campaignMetrics.reduce((s, m) => s + (m.impressions ?? 0), 0),
    engagements: campaignMetrics.reduce((s, m) => s + (m.engagements ?? 0), 0),
    clicks: campaignMetrics.reduce((s, m) => s + (m.clicks ?? 0), 0),
    leads: campaignMetrics.reduce((s, m) => s + (m.leads ?? 0), 0),
    spend: campaignMetrics.reduce((s, m) => s + (m.spend ?? 0), 0),
  };
  const aggCpl = agg.spend > 0 && agg.leads > 0 ? parseFloat((agg.spend / agg.leads).toFixed(2)) : null;
  const aggEngRate = agg.reach > 0 && agg.engagements > 0
    ? parseFloat(((agg.engagements / agg.reach) * 100).toFixed(2))
    : null;

  const TABS: { key: Tab; label: string }[] = [
    { key: 'resumen', label: 'Resumen' },
    { key: 'metricas', label: `Métricas${campaignMetrics.length > 0 ? ` (${campaignMetrics.length})` : ''}` },
    { key: 'contenido', label: `Contenido (${pieces.length})` },
    { key: 'publicaciones', label: `Publicaciones (${publications.length})` },
  ];

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <button onClick={() => navigate('/fplus/campaigns')} className="hover:text-slate-600 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <Link to="/fplus/campaigns" className="hover:text-slate-600 transition-colors">Campañas</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-700 font-medium">{campaign.nombre}</span>
      </div>

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs text-slate-400 font-mono mb-1">{campaign.codigo_interno}</p>
            <h1 className="text-xl font-semibold text-slate-800">{campaign.nombre}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Link to={`/fplus/clients/${campaign.client_id}`} className="text-sm text-blue-600 hover:underline">
                {campaign.client_nombre}
              </Link>
              <span className="text-slate-300">•</span>
              <span className="text-sm text-slate-500">
                {new Date(campaign.fecha_inicio).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                {' — '}
                {new Date(campaign.fecha_fin).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
          <span className={`inline-flex items-center rounded-full text-xs font-medium px-3 py-1.5 ${CAMPAIGN_STATE_COLORS[campaign.estado]}`}>
            {CAMPAIGN_STATE_LABELS[campaign.estado]}
          </span>
        </div>

        {/* Progress */}
        <div className="mt-5">
          <div className="flex justify-between text-xs text-slate-500 mb-1.5">
            <span>Progreso de publicaciones</span>
            <span className="font-medium">{campaign.piezas_publicadas}/{campaign.piezas_totales} piezas</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* KPIs */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5 border-t border-slate-100">
          <KPI icon={<Users className="w-4 h-4 text-blue-500" />} label="Leads" value={campaign.leads.toString()} />
          <KPI
            icon={<DollarSign className="w-4 h-4 text-emerald-500" />}
            label="CPL"
            value={campaign.cpl != null ? `$${campaign.cpl}` : '—'}
          />
          <KPI
            icon={<TrendingUp className="w-4 h-4 text-violet-500" />}
            label="ROAS"
            value={campaign.roas != null ? `${campaign.roas}x` : '—'}
          />
          <KPI
            icon={<DollarSign className="w-4 h-4 text-amber-500" />}
            label="Presupuesto"
            value={campaign.presupuesto_total != null ? `$${campaign.presupuesto_total.toLocaleString()}` : '—'}
          />
        </div>
      </div>


      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-6">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {tab === 'metricas' && (
        <div className="space-y-4">
          {campaignMetrics.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl py-14 text-center">
              <BarChart2 className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400">Carga métricas en las publicaciones de esta campaña para ver los agregados aquí.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <AggKPI icon={<Eye className="w-4 h-4 text-blue-500" />} label="Reach total" value={fmtK(agg.reach)} />
                <AggKPI icon={<TrendingUp className="w-4 h-4 text-violet-500" />} label="Eng. Rate" value={aggEngRate != null ? `${aggEngRate}%` : '—'} />
                <AggKPI icon={<MousePointer className="w-4 h-4 text-amber-500" />} label="Clics totales" value={fmtK(agg.clicks)} />
                <AggKPI icon={<Users className="w-4 h-4 text-emerald-500" />} label="Leads totales" value={agg.leads.toString()} />
                <AggKPI icon={<DollarSign className="w-4 h-4 text-slate-500" />} label="Spend total" value={agg.spend > 0 ? `$${agg.spend}` : '—'} />
                <AggKPI icon={<Target className="w-4 h-4 text-rose-500" />} label="CPL promedio" value={aggCpl != null ? `$${aggCpl}` : '—'} />
              </div>

              {/* Per-publication breakdown */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-700">Por publicación</h3>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Publicación</th>
                      <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Reach</th>
                      <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Eng%</th>
                      <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Clics</th>
                      <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Leads</th>
                      <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">CPL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {campaignMetrics.map(m => {
                      const pub = publications.find(p => p.id === m.publication_id);
                      return (
                        <tr
                          key={m.id}
                          className="hover:bg-slate-50 cursor-pointer"
                          onClick={() => navigate(`/fplus/publications/${m.publication_id}`)}
                        >
                          <td className="px-4 py-3 font-medium text-slate-800">{pub?.content_piece_nombre ?? '—'}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{fmtK(m.reach)}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{m.engagement_rate != null ? `${m.engagement_rate}%` : '—'}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{fmtK(m.clicks)}</td>
                          <td className="px-4 py-3 text-right font-medium text-emerald-700">{m.leads ?? '—'}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{m.cpl != null ? `$${m.cpl}` : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'resumen' && (
        <div className="grid sm:grid-cols-2 gap-4">
          <InfoCard title="Detalles">
            <InfoRow label="Tipo" value={campaign.tipo === 'organica' ? 'Orgánica' : campaign.tipo === 'pauta' ? 'Pauta' : 'Mixta'} />
            <InfoRow label="Objetivo" value={{ awareness: 'Awareness', engagement: 'Engagement', leads: 'Leads', ventas: 'Ventas', retencion: 'Retención' }[campaign.objetivo]} />
            <InfoRow label="Inicio" value={new Date(campaign.fecha_inicio).toLocaleDateString('es')} />
            <InfoRow label="Fin" value={new Date(campaign.fecha_fin).toLocaleDateString('es')} />
          </InfoCard>
          <InfoCard title="Contenido">
            <InfoRow label="Piezas totales" value={campaign.piezas_totales.toString()} />
            <InfoRow label="Publicadas" value={campaign.piezas_publicadas.toString()} />
            <InfoRow label="Pendientes" value={(campaign.piezas_totales - campaign.piezas_publicadas).toString()} />
          </InfoCard>
        </div>
      )}

      {tab === 'contenido' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {pieces.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <FileImage className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No hay piezas en esta campaña</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Pieza</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Tipo</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Diseñador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pieces.map(cp => (
                  <tr
                    key={cp.id}
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => navigate(`/fplus/content/${cp.id}`)}
                  >
                    <td className="px-4 py-3 font-medium text-slate-800">{cp.nombre}</td>
                    <td className="px-4 py-3 text-slate-500 capitalize">{cp.tipo.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3"><ContentStateChip state={cp.estado} size="sm" /></td>
                    <td className="px-4 py-3 text-slate-500">{cp.designer_nombre ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'publicaciones' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {publications.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Target className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No hay publicaciones en esta campaña</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Pieza</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Plataforma</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Fecha</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Estado</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">Leads</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {publications.map(pub => (
                  <tr key={pub.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{pub.content_piece_nombre}</td>
                    <td className="px-4 py-3 text-slate-500">{PLATFORM_LABELS[pub.plataforma]}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(pub.fecha_programada).toLocaleDateString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3">
                      <PubStateChip estado={pub.estado} />
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700">{pub.leads_atribuidos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

function KPI({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">{icon}{label}</div>
      <p className="text-lg font-bold text-slate-800">{value}</p>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-700">{value}</span>
    </div>
  );
}

function AggKPI({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">{icon}{label}</div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  );
}

function fmtK(v: number | undefined): string {
  if (v == null || v === 0) return '—';
  return v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v.toString();
}

const PUB_STATE = {
  planificada: { label: 'Planificada', cls: 'bg-blue-100 text-blue-700' },
  publicada: { label: 'Publicada', cls: 'bg-emerald-100 text-emerald-700' },
  sin_confirmar: { label: 'Sin confirmar', cls: 'bg-amber-100 text-amber-700' },
  cancelada: { label: 'Cancelada', cls: 'bg-red-100 text-red-600' },
};
function PubStateChip({ estado }: { estado: keyof typeof PUB_STATE }) {
  const s = PUB_STATE[estado];
  return <span className={`inline-flex rounded-full text-xs font-medium px-2.5 py-1 ${s.cls}`}>{s.label}</span>;
}
