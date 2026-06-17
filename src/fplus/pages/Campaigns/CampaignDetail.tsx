import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Target, Calendar, DollarSign, TrendingUp,
  Users, FileImage, ChevronRight, BarChart2
} from 'lucide-react';
import { mockCampaigns, mockContent, mockPublications } from '../../mock';
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

type Tab = 'resumen' | 'contenido' | 'publicaciones';

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('resumen');

  const campaign = mockCampaigns.find(c => c.id === id);

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

  const pieces = mockContent.filter(cp => cp.campaign_id === campaign.id);
  const publications = mockPublications.filter(p => p.campaign_id === campaign.id);
  const progress = campaign.piezas_totales > 0
    ? Math.round((campaign.piezas_publicadas / campaign.piezas_totales) * 100)
    : 0;

  const TABS: { key: Tab; label: string }[] = [
    { key: 'resumen', label: 'Resumen' },
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

      {/* Metrics placeholder notice */}
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500">
        <BarChart2 className="w-4 h-4 text-slate-400 shrink-0" />
        <span>Las métricas detalladas estarán disponibles cuando se conecte <strong>PublicationMetric</strong> en Sprint 4.</span>
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
