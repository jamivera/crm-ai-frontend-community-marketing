import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, LayoutGrid, List, FileImage, Clock, ChevronDown } from 'lucide-react';
import { ContentStateChip } from '../../components/ui/StateChip';
import { EmptyState } from '../../components/ui/EmptyState';
import { useFplusStore, STATE_TRANSITIONS, ACTION_LABELS } from '../../store';
import { NewContentModal } from '../../components/modals/NewContentModal';
import { KANBAN_COLUMNS, CONTENT_STATE_LABELS } from '../../constants';
import type { ContentPiece, ContentState } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

type ViewMode = 'kanban' | 'list';

// Active user — in a real app this comes from auth context
const CURRENT_USER = 'Juan Pérez';

function timeAgo(ts: string) {
  try { return formatDistanceToNow(new Date(ts), { addSuffix: true, locale: es }); } catch { return ts; }
}

export default function ContentList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [view, setView] = useState<ViewMode>('kanban');
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState(searchParams.get('client') ?? 'all');
  // P1-A: "Mis piezas" filter
  const [mioFilter, setMioFilter] = useState(searchParams.get('mio') === '1');
  // P1-D: pre-filter by estado from URL (also supports pseudo-value 'atrasado')
  const initialEstado = searchParams.get('estado') ?? 'all';
  const [estadoFilter, setEstadoFilter] = useState<ContentState | 'all' | 'atrasado'>(
    initialEstado as ContentState | 'all' | 'atrasado'
  );

  const contentPieces = useFplusStore(s => s.contentPieces);
  const updateContentState = useFplusStore(s => s.updateContentState);
  const [showNewContent, setShowNewContent] = useState(false);

  // Sync URL param changes (e.g. navigating from dashboard with different params)
  useEffect(() => {
    const c = searchParams.get('client');
    const e = searchParams.get('estado');
    const m = searchParams.get('mio');
    if (c) setClientFilter(c);
    if (e) setEstadoFilter(e as ContentState | 'all' | 'atrasado');
    if (m === '1') setMioFilter(true);
  }, [searchParams]);

  const clients = [...new Set(contentPieces.map(c => c.client_nombre))];

  const filtered = contentPieces.filter(c => {
    const matchSearch = c.nombre.toLowerCase().includes(search.toLowerCase()) ||
      c.client_nombre.toLowerCase().includes(search.toLowerCase());
    const matchClient = clientFilter === 'all' || c.client_nombre === clientFilter ||
      c.client_id === clientFilter;
    const matchMio = !mioFilter || c.account_manager_nombre === CURRENT_USER ||
      c.designer_nombre === CURRENT_USER || c.content_manager_nombre === CURRENT_USER;
    const matchEstado = estadoFilter === 'all'
      ? true
      : estadoFilter === 'atrasado'
        ? (!!c.fecha_limite && new Date(c.fecha_limite) < new Date() && c.estado !== 'publicado' && c.estado !== 'archivado')
        : c.estado === estadoFilter;
    return matchSearch && matchClient && matchMio && matchEstado;
  });

  const activeFilters = (clientFilter !== 'all' ? 1 : 0) + (mioFilter ? 1 : 0) + (estadoFilter !== 'all' ? 1 : 0);

  function clearFilters() {
    setClientFilter('all');
    setMioFilter(false);
    setEstadoFilter('all');
    setSearch('');
  }

  return (
    <div className="p-6 space-y-5 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Contenido</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {filtered.length} {filtered.length === 1 ? 'pieza' : 'piezas'}
            {activeFilters > 0 && <span className="ml-1 text-blue-600">· {activeFilters} filtro{activeFilters > 1 ? 's' : ''} activo{activeFilters > 1 ? 's' : ''}</span>}
          </p>
        </div>
        <button
          onClick={() => setShowNewContent(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Nueva pieza
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar pieza..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        {/* P1-A: Mis piezas toggle */}
        <button
          onClick={() => setMioFilter(p => !p)}
          className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border transition-colors flex-shrink-0 ${
            mioFilter
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
          }`}
        >
          Mis piezas
        </button>

        {/* Client filter */}
        <select
          value={clientFilter}
          onChange={e => setClientFilter(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todos los clientes</option>
          {clients.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Estado filter */}
        <select
          value={estadoFilter}
          onChange={e => setEstadoFilter(e.target.value as ContentState | 'all' | 'atrasado')}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todos los estados</option>
          <option value="atrasado">⚠ Atrasadas</option>
          {(Object.entries(CONTENT_STATE_LABELS) as [ContentState, string][]).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>

        {/* Clear filters */}
        {activeFilters > 0 && (
          <button onClick={clearFilters} className="text-xs text-slate-400 hover:text-slate-700 underline flex-shrink-0">
            Limpiar filtros
          </button>
        )}

        {/* View toggle */}
        <div className="ml-auto flex gap-1 bg-slate-100 rounded-lg p-1 flex-shrink-0">
          <button
            onClick={() => setView('kanban')}
            className={`p-1.5 rounded-md transition-colors ${view === 'kanban' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
            title="Vista kanban"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
            title="Vista lista"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<FileImage />}
          title="No hay piezas"
          description={activeFilters > 0 ? 'Prueba cambiando los filtros activos.' : 'Crea la primera pieza de contenido.'}
        />
      ) : view === 'kanban' ? (
        <KanbanView
          pieces={filtered}
          onNavigate={id => navigate(`/fplus/content/${id}`)}
          onTransition={updateContentState}
        />
      ) : (
        <ListView pieces={filtered} onNavigate={id => navigate(`/fplus/content/${id}`)} />
      )}
      {showNewContent && <NewContentModal onClose={() => setShowNewContent(false)} />}
    </div>
  );
}

// ─── P1-B: Kanban with quick actions ─────────────────────────────────────────

function KanbanView({
  pieces,
  onNavigate,
  onTransition,
}: {
  pieces: ContentPiece[];
  onNavigate: (id: string) => void;
  onTransition: (id: string, state: ContentState, actor?: string) => void;
}) {
  const grouped: Record<ContentState, ContentPiece[]> = KANBAN_COLUMNS.reduce((acc, col) => {
    acc[col] = pieces.filter(p => p.estado === col);
    return acc;
  }, {} as Record<ContentState, ContentPiece[]>);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {KANBAN_COLUMNS.map(col => {
        const colPieces = grouped[col];
        return (
          <div key={col} className="flex-shrink-0 w-64">
            <div className="flex items-center gap-2 mb-3">
              <ContentStateChip state={col} size="sm" />
              <span className="text-xs text-slate-400 font-medium">({colPieces.length})</span>
            </div>
            <div className="space-y-2">
              {colPieces.map(piece => (
                <KanbanCard
                  key={piece.id}
                  piece={piece}
                  onClick={() => onNavigate(piece.id)}
                  onTransition={onTransition}
                />
              ))}
              {colPieces.length === 0 && (
                <div className="rounded-xl border-2 border-dashed border-slate-200 p-4 text-center text-xs text-slate-300">
                  Sin piezas
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KanbanCard({
  piece,
  onClick,
  onTransition,
}: {
  piece: ContentPiece;
  onClick: () => void;
  onTransition: (id: string, state: ContentState, actor?: string) => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const isOverdue = piece.fecha_limite && new Date(piece.fecha_limite) < new Date();
  const isBlocked = piece.estado === 'bloqueado';
  const nextStates = STATE_TRANSITIONS[piece.estado] ?? [];
  const labels = ACTION_LABELS[piece.estado] ?? {};

  return (
    <div
      className={`bg-white rounded-xl border shadow-sm transition-shadow hover:shadow-md ${
        isBlocked ? 'border-red-200' : 'border-slate-200'
      }`}
    >
      {/* Card body — click to navigate */}
      <button onClick={onClick} className="w-full text-left p-3.5 block">
        <div className="w-full h-20 bg-slate-100 rounded-lg mb-3 flex items-center justify-center text-slate-300">
          <FileImage className="w-6 h-6" />
        </div>
        <div className="text-xs font-semibold text-slate-800 truncate mb-1">{piece.nombre}</div>
        <div className="flex items-center gap-1.5 flex-wrap mb-2">
          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{piece.client_nombre}</span>
          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full capitalize">{piece.tipo}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-[10px] font-semibold">
            {piece.account_manager_nombre.charAt(0)}
          </div>
          {piece.fecha_limite && (
            <div className={`flex items-center gap-1 text-[10px] font-medium ${isOverdue ? 'text-red-600' : 'text-slate-400'}`}>
              <Clock className="w-3 h-3" />
              {isOverdue ? 'Vencida' : new Date(piece.fecha_limite).toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })}
            </div>
          )}
        </div>
      </button>

      {/* P1-B: Quick actions — only when transitions exist */}
      {nextStates.length > 0 && (
        <div className="border-t border-slate-100">
          <button
            onClick={e => { e.stopPropagation(); setShowActions(p => !p); }}
            className="w-full flex items-center justify-between px-3.5 py-2 text-[11px] font-medium text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors rounded-b-xl"
          >
            Acciones rápidas
            <ChevronDown className={`w-3 h-3 transition-transform ${showActions ? 'rotate-180' : ''}`} />
          </button>
          {showActions && (
            <div className="px-3.5 pb-3 flex flex-wrap gap-1.5">
              {nextStates.map(state => {
                const label = labels[state] ?? CONTENT_STATE_LABELS[state];
                const isDanger = state === 'bloqueado';
                return (
                  <button
                    key={state}
                    onClick={e => {
                      e.stopPropagation();
                      onTransition(piece.id, state, CURRENT_USER);
                      setShowActions(false);
                    }}
                    className={`text-[10px] font-medium px-2 py-1 rounded-md transition-colors ${
                      isDanger
                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ListView({ pieces, onNavigate }: { pieces: ContentPiece[]; onNavigate: (id: string) => void }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Pieza</th>
            <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 hidden md:table-cell">Cliente</th>
            <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Estado</th>
            <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 hidden lg:table-cell">AM</th>
            <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 hidden lg:table-cell">Vence</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {pieces.map(piece => {
            const isOverdue = piece.fecha_limite && new Date(piece.fecha_limite) < new Date();
            return (
              <tr
                key={piece.id}
                onClick={() => onNavigate(piece.id)}
                className="hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0">
                      <FileImage className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-900">{piece.nombre}</div>
                      <div className="text-xs text-slate-400 capitalize">{piece.tipo}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 hidden md:table-cell">
                  <span className="text-sm text-slate-600">{piece.client_nombre}</span>
                </td>
                <td className="px-4 py-3.5">
                  <ContentStateChip state={piece.estado} size="sm" />
                </td>
                <td className="px-4 py-3.5 hidden lg:table-cell">
                  <span className="text-sm text-slate-600">{piece.account_manager_nombre}</span>
                </td>
                <td className="px-4 py-3.5 hidden lg:table-cell">
                  {piece.fecha_limite ? (
                    <span className={`text-xs font-medium ${isOverdue ? 'text-red-600' : 'text-slate-500'}`}>
                      {isOverdue ? '⚠ ' : ''}{new Date(piece.fecha_limite).toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-300">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
