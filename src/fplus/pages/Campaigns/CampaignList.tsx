import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Target, TrendingUp, Users, DollarSign } from 'lucide-react';
import { useFplusStore } from '../../store';
import { NewCampaignModal } from '../../components/modals/NewCampaignModal';
import type { Campaign } from '../../types';

const CAMPAIGN_STATE_LABELS: Record<Campaign['estado'], string> = {
  planificada: 'Planificada',
  activa: 'Activa',
  pausada: 'Pausada',
  completada: 'Completada',
  cancelada: 'Cancelada',
};

const CAMPAIGN_STATE_COLORS: Record<Campaign['estado'], string> = {
  planificada: 'bg-slate-100 text-slate-600',
  activa: 'bg-emerald-100 text-emerald-700',
  pausada: 'bg-amber-100 text-amber-700',
  completada: 'bg-blue-100 text-blue-700',
  cancelada: 'bg-red-100 text-red-600',
};

const OBJETIVO_LABELS: Record<Campaign['objetivo'], string> = {
  awareness: 'Awareness',
  engagement: 'Engagement',
  leads: 'Leads',
  ventas: 'Ventas',
  retencion: 'Retención',
};

const TIPO_LABELS: Record<Campaign['tipo'], string> = {
  organica: 'Orgánica',
  pauta: 'Pauta',
  mixta: 'Mixta',
};

function CampaignStateChip({ estado }: { estado: Campaign['estado'] }) {
  return (
    <span className={`inline-flex items-center rounded-full text-xs font-medium px-2.5 py-1 ${CAMPAIGN_STATE_COLORS[estado]}`}>
      {CAMPAIGN_STATE_LABELS[estado]}
    </span>
  );
}

export default function CampaignList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState<Campaign['estado'] | 'todos'>('todos');
  const [filterCliente, setFilterCliente] = useState('todos');

  const campaigns = useFplusStore(s => s.campaigns);
  const clients = useFplusStore(s => s.clients);
  const [showNewCampaign, setShowNewCampaign] = useState(false);

  const filtered = campaigns.filter(c => {
    const matchSearch = c.nombre.toLowerCase().includes(search.toLowerCase()) ||
      c.client_nombre.toLowerCase().includes(search.toLowerCase()) ||
      c.codigo_interno.toLowerCase().includes(search.toLowerCase());
    const matchEstado = filterEstado === 'todos' || c.estado === filterEstado;
    const matchCliente = filterCliente === 'todos' || c.client_id === filterCliente;
    return matchSearch && matchEstado && matchCliente;
  });

  const counts = {
    todos: campaigns.length,
    activa: campaigns.filter(c => c.estado === 'activa').length,
    planificada: campaigns.filter(c => c.estado === 'planificada').length,
    pausada: campaigns.filter(c => c.estado === 'pausada').length,
    completada: campaigns.filter(c => c.estado === 'completada').length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Campañas</h1>
          <p className="text-sm text-slate-500 mt-0.5">{campaigns.length} campañas en total</p>
        </div>
        <button
          onClick={() => setShowNewCampaign(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva campaña
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, cliente o código..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterCliente}
          onChange={e => setFilterCliente(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="todos">Todos los clientes</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </div>

      {/* State tabs */}
      <div className="flex gap-1 flex-wrap">
        {(['todos', 'activa', 'planificada', 'pausada', 'completada'] as const).map(est => (
          <button
            key={est}
            onClick={() => setFilterEstado(est)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              filterEstado === est
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {est === 'todos' ? 'Todas' : CAMPAIGN_STATE_LABELS[est]}{' '}
            <span className="opacity-70">({counts[est] ?? 0})</span>
          </button>
        ))}
      </div>

      {/* Campaign cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Target className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No se encontraron campañas</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(campaign => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onClick={() => navigate(`/fplus/campaigns/${campaign.id}`)}
            />
          ))}
        </div>
      )}
      {showNewCampaign && <NewCampaignModal onClose={() => setShowNewCampaign(false)} />}
    </div>
  );
}

function CampaignCard({ campaign, onClick }: { campaign: Campaign; onClick: () => void }) {
  const progress = campaign.piezas_totales > 0
    ? Math.round((campaign.piezas_publicadas / campaign.piezas_totales) * 100)
    : 0;

  return (
    <div
      onClick={onClick}
      className="bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
    >
      {/* Top */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-400 font-mono mb-1">{campaign.codigo_interno}</p>
          <h3 className="font-semibold text-slate-800 text-sm leading-snug truncate">{campaign.nombre}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{campaign.client_nombre}</p>
        </div>
        <CampaignStateChip estado={campaign.estado} />
      </div>

      {/* Meta */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
          {TIPO_LABELS[campaign.tipo]}
        </span>
        <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
          {OBJETIVO_LABELS[campaign.objetivo]}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>Piezas publicadas</span>
          <span>{campaign.piezas_publicadas}/{campaign.piezas_totales}</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
        <MetricMini icon={<Users className="w-3 h-3" />} label="Leads" value={campaign.leads.toString()} />
        {campaign.cpl != null ? (
          <MetricMini icon={<DollarSign className="w-3 h-3" />} label="CPL" value={`$${campaign.cpl}`} />
        ) : (
          <MetricMini icon={<DollarSign className="w-3 h-3" />} label="CPL" value="—" />
        )}
        {campaign.roas != null ? (
          <MetricMini icon={<TrendingUp className="w-3 h-3" />} label="ROAS" value={`${campaign.roas}x`} />
        ) : (
          <MetricMini icon={<TrendingUp className="w-3 h-3" />} label="ROAS" value="—" />
        )}
      </div>

      {/* Dates */}
      <p className="text-xs text-slate-400 mt-3">
        {new Date(campaign.fecha_inicio).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
        {' — '}
        {new Date(campaign.fecha_fin).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
      </p>
    </div>
  );
}

function MetricMini({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-1 text-slate-400 mb-0.5">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <span className="text-sm font-semibold text-slate-700">{value}</span>
    </div>
  );
}
