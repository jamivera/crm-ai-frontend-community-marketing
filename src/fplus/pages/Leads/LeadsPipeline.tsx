import React, { useState } from 'react';
import { X, Phone, Mail, DollarSign, Clock, ChevronRight, List, LayoutGrid, Search } from 'lucide-react';
import { mockLeads, mockClients } from '../../mock';
import { LEAD_STATE_LABELS, LEAD_STATE_COLORS } from '../../constants';
import { LeadStateChip } from '../../components/ui/StateChip';
import type { Lead, LeadState } from '../../types';

const PIPELINE_COLUMNS: LeadState[] = ['nuevo', 'contactado', 'calificado', 'oportunidad', 'ganado'];
const CLOSED_STATES: LeadState[] = ['perdido', 'invalido'];

const QUALITY_COLORS: Record<Lead['calidad'], string> = {
  alta: 'bg-emerald-100 text-emerald-700',
  media: 'bg-amber-100 text-amber-700',
  baja: 'bg-slate-100 text-slate-500',
};

type ViewMode = 'kanban' | 'lista';

export default function LeadsPipeline() {
  const [leads, setLeads] = useState(mockLeads);
  const [view, setView] = useState<ViewMode>('kanban');
  const [search, setSearch] = useState('');
  const [filterCliente, setFilterCliente] = useState('todos');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<LeadState | null>(null);

  const visibleLeads = leads.filter(l => {
    const matchSearch = l.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (l.empresa ?? '').toLowerCase().includes(search.toLowerCase()) ||
      l.client_nombre.toLowerCase().includes(search.toLowerCase());
    const matchCliente = filterCliente === 'todos' || l.client_id === filterCliente;
    return matchSearch && matchCliente;
  });

  const kanbanLeads = visibleLeads.filter(l => !CLOSED_STATES.includes(l.estado));
  const closedLeads = visibleLeads.filter(l => CLOSED_STATES.includes(l.estado));

  function moveLeadTo(leadId: string, newState: LeadState) {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, estado: newState, dias_en_estado: 0 } : l));
    if (selectedLead?.id === leadId) {
      setSelectedLead(prev => prev ? { ...prev, estado: newState } : null);
    }
  }

  function handleDrop(e: React.DragEvent, col: LeadState) {
    e.preventDefault();
    if (dragging) moveLeadTo(dragging, col);
    setDragging(null);
    setDragOver(null);
  }

  const totalPotential = kanbanLeads.reduce((s, l) => s + (l.ingreso_potencial ?? 0), 0);
  const ganados = leads.filter(l => l.estado === 'ganado');

  return (
    <div className="p-6 space-y-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Leads & Pipeline</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {kanbanLeads.length} activos · ${totalPotential.toLocaleString()} potencial
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => setView('kanban')}
              className={`p-1.5 rounded-md transition-colors ${view === 'kanban' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
              title="Kanban"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('lista')}
              className={`p-1.5 rounded-md transition-colors ${view === 'lista' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
              title="Lista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
        <KPI label="En pipeline" value={kanbanLeads.length.toString()} sub="leads activos" />
        <KPI label="Potencial" value={`$${totalPotential.toLocaleString()}`} sub="ingresos posibles" />
        <KPI label="Ganados" value={ganados.length.toString()} sub="este mes" />
        <KPI label="Cerrados" value={closedLeads.length.toString()} sub="perdidos/inválidos" />
      </div>

      {/* Filters */}
      <div className="flex gap-3 shrink-0 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar lead, empresa..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterCliente}
          onChange={e => setFilterCliente(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="todos">Todos los clientes</option>
          {mockClients.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </div>

      {/* Kanban view */}
      {view === 'kanban' && (
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-3 h-full min-w-max">
            {PIPELINE_COLUMNS.map(col => {
              const colLeads = kanbanLeads.filter(l => l.estado === col);
              const colPotential = colLeads.reduce((s, l) => s + (l.ingreso_potencial ?? 0), 0);
              const isOver = dragOver === col;

              return (
                <div
                  key={col}
                  className={`flex flex-col w-64 bg-slate-50 rounded-xl border transition-colors ${
                    isOver ? 'border-blue-400 bg-blue-50/50' : 'border-slate-200'
                  }`}
                  onDragOver={e => { e.preventDefault(); setDragOver(col); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={e => handleDrop(e, col)}
                >
                  {/* Column header */}
                  <div className="px-3 py-3 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${LEAD_STATE_COLORS[col]}`}>
                        {LEAD_STATE_LABELS[col]}
                      </span>
                      <span className="text-xs font-medium text-slate-500 bg-white border border-slate-200 rounded-full px-1.5 py-0.5">
                        {colLeads.length}
                      </span>
                    </div>
                    {colPotential > 0 && (
                      <p className="text-xs text-slate-400 mt-1">${colPotential.toLocaleString()} potencial</p>
                    )}
                  </div>

                  {/* Cards */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {colLeads.map(lead => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        onClick={() => setSelectedLead(lead)}
                        onDragStart={() => setDragging(lead.id)}
                        onDragEnd={() => { setDragging(null); setDragOver(null); }}
                      />
                    ))}
                    {colLeads.length === 0 && (
                      <div className="py-6 text-center text-xs text-slate-300">Sin leads</div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Closed (collapsed column) */}
            {closedLeads.length > 0 && (
              <div className="flex flex-col w-64 bg-slate-50 rounded-xl border border-slate-200 opacity-60">
                <div className="px-3 py-3 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400">Cerrados</span>
                    <span className="text-xs font-medium text-slate-400 bg-white border border-slate-200 rounded-full px-1.5 py-0.5">
                      {closedLeads.length}
                    </span>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {closedLeads.map(lead => (
                    <LeadCard key={lead.id} lead={lead} onClick={() => setSelectedLead(lead)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* List view */}
      {view === 'lista' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex-1">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Lead</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Fuente</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Calidad</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">Potencial</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">Días</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleLeads.map(lead => (
                <tr
                  key={lead.id}
                  className="hover:bg-slate-50 cursor-pointer"
                  onClick={() => setSelectedLead(lead)}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{lead.nombre}</p>
                    {lead.empresa && <p className="text-xs text-slate-400">{lead.empresa}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{lead.client_nombre}</td>
                  <td className="px-4 py-3 text-slate-500 capitalize">{lead.fuente}</td>
                  <td className="px-4 py-3"><LeadStateChip state={lead.estado} size="sm" /></td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${QUALITY_COLORS[lead.calidad]}`}>
                      {lead.calidad}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-700">
                    {lead.ingreso_potencial != null ? `$${lead.ingreso_potencial.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500">
                    {lead.dias_en_estado}d
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visibleLeads.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-sm">No se encontraron leads.</div>
          )}
        </div>
      )}

      {/* Lead Drawer */}
      {selectedLead && (
        <LeadDrawer
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onMove={(newState) => moveLeadTo(selectedLead.id, newState)}
        />
      )}
    </div>
  );
}

function LeadCard({
  lead,
  onClick,
  onDragStart,
  onDragEnd,
}: {
  lead: Lead;
  onClick: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}) {
  return (
    <div
      draggable={!!onDragStart}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className="bg-white border border-slate-200 rounded-lg p-3 cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all select-none"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">{lead.nombre}</p>
          {lead.empresa && <p className="text-xs text-slate-400 truncate">{lead.empresa}</p>}
        </div>
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${QUALITY_COLORS[lead.calidad]}`}>
          {lead.calidad}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
        <span className="capitalize">{lead.fuente}</span>
        {lead.ingreso_potencial && (
          <span className="font-medium text-slate-600">${lead.ingreso_potencial.toLocaleString()}</span>
        )}
      </div>
      <p className="text-xs text-slate-400 mt-1">{lead.client_nombre}</p>
    </div>
  );
}

function LeadDrawer({
  lead,
  onClose,
  onMove,
}: {
  lead: Lead;
  onClose: () => void;
  onMove: (state: LeadState) => void;
}) {
  const allStates: LeadState[] = ['nuevo', 'contactado', 'calificado', 'oportunidad', 'ganado', 'perdido', 'invalido'];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100 shrink-0">
          <h2 className="font-semibold text-slate-800">Detalle del Lead</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Identity */}
          <div>
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold mb-3">
              {lead.nombre.charAt(0).toUpperCase()}
            </div>
            <h3 className="font-semibold text-slate-800">{lead.nombre}</h3>
            {lead.empresa && <p className="text-sm text-slate-500">{lead.empresa}</p>}
            <p className="text-xs text-slate-400 mt-0.5">{lead.client_nombre}</p>
          </div>

          {/* State + Quality */}
          <div className="flex gap-2 flex-wrap">
            <LeadStateChip state={lead.estado} />
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${QUALITY_COLORS[lead.calidad]}`}>
              Calidad {lead.calidad}
            </span>
          </div>

          {/* Contact */}
          <div className="space-y-2">
            {lead.email && (
              <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                <Mail className="w-4 h-4 shrink-0" />
                {lead.email}
              </a>
            )}
            {lead.telefono && (
              <a href={`tel:${lead.telefono}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                <Phone className="w-4 h-4 shrink-0" />
                {lead.telefono}
              </a>
            )}
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <DollarSign className="w-3 h-3" />
                Potencial
              </div>
              <p className="text-base font-bold text-slate-800">
                {lead.ingreso_potencial != null ? `$${lead.ingreso_potencial.toLocaleString()}` : '—'}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <Clock className="w-3 h-3" />
                En estado
              </div>
              <p className="text-base font-bold text-slate-800">{lead.dias_en_estado}d</p>
            </div>
          </div>

          {/* Meta */}
          <div className="text-sm space-y-2 pt-2 border-t border-slate-100">
            <Row label="Fuente" value={lead.fuente} />
            <Row label="AM" value={lead.account_manager_nombre} />
            <Row label="Creado" value={new Date(lead.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })} />
          </div>

          {/* Move to */}
          <div className="pt-3 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-500 mb-2">Mover a etapa</p>
            <div className="flex flex-wrap gap-1.5">
              {allStates.filter(s => s !== lead.estado).map(s => (
                <button
                  key={s}
                  onClick={() => onMove(s)}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 border border-slate-200 rounded-full hover:border-blue-400 hover:text-blue-600 transition-colors"
                >
                  {LEAD_STATE_LABELS[s]}
                  <ChevronRight className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPI({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-xl font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-400">{label}</span>
      <span className="font-medium text-slate-700 capitalize">{value}</span>
    </div>
  );
}
