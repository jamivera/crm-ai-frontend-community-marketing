import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Plus, Eye, Share2, FileImage, Megaphone,
  TrendingUp, BarChart3, BookOpen, AlertTriangle,
} from 'lucide-react';
import { HealthLight } from '../../components/ui/HealthLight';
import { ContentStateChip, LeadStateChip } from '../../components/ui/StateChip';
import { PlatformIcon } from '../../components/ui/PlatformIcon';
import { EmptyState } from '../../components/ui/EmptyState';
import { useFplusStore } from '../../store';

type Tab = 'resumen' | 'contenido' | 'campanas' | 'leads' | 'brief';

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('resumen');

  const clients = useFplusStore(s => s.clients);
  const contentPieces = useFplusStore(s => s.contentPieces);
  const campaigns = useFplusStore(s => s.campaigns);
  const leads = useFplusStore(s => s.leads);
  const brief = useFplusStore(s => s.getBrief(id!));

  const client = clients.find(c => c.id === id);
  if (!client) {
    return (
      <div className="p-6">
        <button onClick={() => navigate('/fplus/clients')} className="flex items-center gap-2 text-sm text-blue-600 hover:underline mb-4">
          <ArrowLeft className="w-4 h-4" /> Volver a clientes
        </button>
        <EmptyState title="Cliente no encontrado" description="El cliente que buscas no existe o fue eliminado." />
      </div>
    );
  }

  const clientContent = contentPieces.filter(c => c.client_id === id);
  const clientCampaigns = campaigns.filter(c => c.client_id === id);
  const clientLeads = leads.filter(l => l.client_id === id);

  const TABS: { id: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'resumen', label: 'Resumen', icon: BarChart3 },
    { id: 'contenido', label: 'Contenido', icon: FileImage, count: clientContent.length },
    { id: 'campanas', label: 'Campañas', icon: Megaphone, count: clientCampaigns.length },
    { id: 'leads', label: 'Leads', icon: TrendingUp, count: clientLeads.length },
    { id: 'brief', label: 'Brief Maestro', icon: BookOpen },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back */}
      <div className="px-6 pt-6 pb-0">
        <button onClick={() => navigate('/fplus/clients')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Clientes
        </button>
      </div>

      {/* Client header */}
      <div className="px-6 py-4 bg-white border-b border-slate-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 text-lg font-bold flex-shrink-0">
            {client.nombre.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900">{client.nombre}</h1>
              <HealthLight status={client.semaforo} showLabel />
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-sm text-slate-500">{client.industria}</span>
              {client.instagram_handle && (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <PlatformIcon platform="instagram" />@{client.instagram_handle}
                </span>
              )}
              <span className="text-sm text-slate-500">AM: {client.account_manager_nombre}</span>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => navigate(`/fplus/content`)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" /> Nueva pieza
            </button>
            <button
              onClick={() => navigate(`/fplus/portal/${id}`)}
              className="flex items-center gap-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm px-3 py-2 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" /> Ver como cliente
            </button>
            <button
              onClick={() => {
                const url = `${window.location.origin}/fplus/portal/${id}`;
                navigator.clipboard.writeText(url);
              }}
              className="flex items-center gap-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm px-3 py-2 rounded-lg transition-colors"
            >
              <Share2 className="w-4 h-4" /> Compartir portal
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 bg-white border-b border-slate-200">
        <div className="flex gap-0 -mb-px overflow-x-auto">
          {TABS.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  active
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
                {t.count !== undefined && (
                  <span className={`text-xs rounded-full px-1.5 py-0.5 ${active ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="p-6">
        {tab === 'resumen' && <ResumenTab client={client} content={clientContent} campaigns={clientCampaigns} leads={clientLeads} />}
        {tab === 'contenido' && <ContenidoTab pieces={clientContent} onNavigate={navigate} />}
        {tab === 'campanas' && <CampanasTab campaigns={clientCampaigns} onNavigate={navigate} />}
        {tab === 'leads' && <LeadsTab leads={clientLeads} />}
        {tab === 'brief' && <BriefTab clientId={id!} hasBrief={!!brief} onNavigate={navigate} />}
      </div>
    </div>
  );
}

function ResumenTab({ client, content, campaigns, leads }: any) {
  const navigate = useNavigate();
  const atrasadas = content.filter((c: any) => c.fecha_limite && new Date(c.fecha_limite) < new Date());
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Piezas activas', value: client.piezas_activas },
          { label: 'Atrasadas', value: client.piezas_atrasadas, danger: client.piezas_atrasadas > 0 },
          { label: 'Leads del mes', value: client.leads_mes },
          { label: 'Revenue del mes', value: `$${client.revenue_mes.toLocaleString()}` },
        ].map(kpi => (
          <div key={kpi.label} className={`rounded-xl border p-4 ${kpi.danger ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
            <div className="text-xs text-slate-500 mb-1">{kpi.label}</div>
            <div className={`text-2xl font-bold ${kpi.danger ? 'text-red-700' : 'text-slate-900'}`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Alert */}
      {client.semaforo === 'rojo' && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-red-800">Este cliente tiene problemas activos</div>
            <div className="text-sm text-red-600 mt-0.5">
              {atrasadas.length > 0 && `${atrasadas.length} pieza${atrasadas.length > 1 ? 's' : ''} atrasada${atrasadas.length > 1 ? 's' : ''}. `}
              Revisa el contenido bloqueado.
            </div>
          </div>
        </div>
      )}

      {/* Recent content */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800">Piezas activas</h3>
          <button onClick={() => {}} className="text-xs text-blue-600 hover:underline">Ver todas</button>
        </div>
        {content.length === 0 ? (
          <EmptyState title="Sin piezas activas" description="Crea la primera pieza para este cliente." icon={<FileImage />} />
        ) : (
          <div className="divide-y divide-slate-100">
            {content.slice(0, 4).map((piece: any) => (
              <div key={piece.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0">
                  <FileImage className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">{piece.nombre}</div>
                  <div className="text-xs text-slate-400">{piece.tipo}</div>
                </div>
                <ContentStateChip state={piece.estado} size="sm" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ContenidoTab({ pieces, onNavigate }: any) {
  if (pieces.length === 0) {
    return <EmptyState title="Sin piezas de contenido" description="Aún no hay piezas creadas para este cliente." icon={<FileImage />} action={
      <button className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg">+ Nueva pieza</button>
    } />;
  }
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="divide-y divide-slate-100">
        {pieces.map((piece: any) => (
          <button
            key={piece.id}
            onClick={() => onNavigate(`/fplus/content/${piece.id}`)}
            className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0">
              <FileImage className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-900 truncate">{piece.nombre}</div>
              <div className="text-xs text-slate-400">{piece.tipo} · {piece.campaign_nombre ?? 'Sin campaña'}</div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <ContentStateChip state={piece.estado} size="sm" />
              {piece.fecha_limite && (
                <span className={`text-[10px] ${new Date(piece.fecha_limite) < new Date() ? 'text-red-600 font-semibold' : 'text-slate-400'}`}>
                  {new Date(piece.fecha_limite) < new Date() ? '⚠ Vencida' : new Date(piece.fecha_limite).toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function CampanasTab({ campaigns, onNavigate }: any) {
  if (campaigns.length === 0) {
    return <EmptyState title="Sin campañas" description="Aún no hay campañas para este cliente." icon={<Megaphone />} />;
  }
  const estadoColors: Record<string, string> = {
    planificada: 'bg-slate-100 text-slate-600',
    activa: 'bg-green-100 text-green-700',
    pausada: 'bg-amber-100 text-amber-700',
    completada: 'bg-blue-100 text-blue-700',
    cancelada: 'bg-red-100 text-red-600',
  };
  return (
    <div className="space-y-3">
      {campaigns.map((c: any) => (
        <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-slate-900">{c.nombre}</div>
              <div className="text-xs text-slate-400 mt-0.5">{c.codigo_interno} · {c.tipo} · {c.objetivo}</div>
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${estadoColors[c.estado]}`}>
              {c.estado.charAt(0).toUpperCase() + c.estado.slice(1)}
            </span>
          </div>
          <div className="flex gap-6 mt-4">
            <div><div className="text-xs text-slate-400">Piezas</div><div className="text-sm font-medium">{c.piezas_publicadas}/{c.piezas_totales}</div></div>
            <div><div className="text-xs text-slate-400">Leads</div><div className="text-sm font-medium">{c.leads}</div></div>
            {c.cpl && <div><div className="text-xs text-slate-400">CPL</div><div className="text-sm font-medium">${c.cpl}</div></div>}
            {c.roas && <div><div className="text-xs text-slate-400">ROAS</div><div className="text-sm font-medium text-emerald-700">{c.roas}x</div></div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function LeadsTab({ leads }: any) {
  if (leads.length === 0) {
    return <EmptyState title="Sin leads" description="Aún no hay leads registrados para este cliente." icon={<TrendingUp />} />;
  }
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="divide-y divide-slate-100">
        {leads.map((lead: any) => (
          <div key={lead.id} className="flex items-center gap-4 px-5 py-3.5">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-900">{lead.nombre}</div>
              <div className="text-xs text-slate-400">{lead.fuente} · {lead.calidad === 'alta' ? '⭐ Alta' : lead.calidad === 'media' ? '· Media' : '· Baja'}</div>
            </div>
            <LeadStateChip state={lead.estado} size="sm" />
          </div>
        ))}
      </div>
    </div>
  );
}

function BriefTab({ clientId, hasBrief, onNavigate }: any) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
      <BookOpen className={`w-10 h-10 mx-auto mb-3 ${hasBrief ? 'text-blue-400' : 'text-slate-300'}`} />
      <h3 className="text-sm font-semibold text-slate-700 mb-2">Brief Maestro</h3>
      <p className="text-sm text-slate-500 mb-2">
        {hasBrief
          ? 'Este cliente tiene un Brief Maestro configurado.'
          : 'El brief maestro define la identidad, voz y lineamientos de contenido para este cliente.'}
      </p>
      {hasBrief && (
        <p className="text-xs text-emerald-600 font-medium mb-4">✓ Brief completado</p>
      )}
      <button
        onClick={() => onNavigate(`/fplus/clients/${clientId}/brief`)}
        className="bg-blue-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
      >
        {hasBrief ? 'Editar Brief Maestro' : 'Crear Brief Maestro'}
      </button>
    </div>
  );
}
