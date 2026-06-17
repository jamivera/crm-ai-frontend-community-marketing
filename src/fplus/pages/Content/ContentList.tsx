import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, LayoutGrid, List, FileImage, Clock } from 'lucide-react';
import { ContentStateChip } from '../../components/ui/StateChip';
import { EmptyState } from '../../components/ui/EmptyState';
import { mockContent } from '../../mock';
import { KANBAN_COLUMNS, CONTENT_STATE_LABELS } from '../../constants';
import type { ContentPiece, ContentState } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

type ViewMode = 'kanban' | 'list';

function timeAgo(ts: string) {
  try { return formatDistanceToNow(new Date(ts), { addSuffix: true, locale: es }); } catch { return ts; }
}

export default function ContentList() {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewMode>('kanban');
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('all');

  const clients = [...new Set(mockContent.map(c => c.client_nombre))];

  const filtered = mockContent.filter(c => {
    const matchSearch = c.nombre.toLowerCase().includes(search.toLowerCase()) ||
      c.client_nombre.toLowerCase().includes(search.toLowerCase());
    const matchClient = clientFilter === 'all' || c.client_nombre === clientFilter;
    return matchSearch && matchClient;
  });

  return (
    <div className="p-6 space-y-5 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Contenido</h1>
          <p className="text-sm text-slate-500 mt-0.5">{filtered.length} piezas</p>
        </div>
        <button
          onClick={() => navigate('/fplus/content/new')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Nueva pieza
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar pieza..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        <select
          value={clientFilter}
          onChange={e => setClientFilter(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todos los clientes</option>
          {clients.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <div className="ml-auto flex gap-1 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setView('kanban')}
            className={`p-1.5 rounded-md transition-colors ${view === 'kanban' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <EmptyState icon={<FileImage />} title="No hay piezas" description="Crea la primera pieza de contenido." />
      ) : view === 'kanban' ? (
        <KanbanView pieces={filtered} onNavigate={id => navigate(`/fplus/content/${id}`)} />
      ) : (
        <ListView pieces={filtered} onNavigate={id => navigate(`/fplus/content/${id}`)} />
      )}
    </div>
  );
}

function KanbanView({ pieces, onNavigate }: { pieces: ContentPiece[]; onNavigate: (id: string) => void }) {
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
                <KanbanCard key={piece.id} piece={piece} onClick={() => onNavigate(piece.id)} />
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

function KanbanCard({ piece, onClick }: { piece: ContentPiece; onClick: () => void }) {
  const isOverdue = piece.fecha_limite && new Date(piece.fecha_limite) < new Date();
  const isBlocked = piece.estado === 'bloqueado';
  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-white rounded-xl border p-3.5 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
        isBlocked ? 'border-red-200' : 'border-slate-200'
      }`}
    >
      {/* Thumbnail placeholder */}
      <div className="w-full h-24 bg-slate-100 rounded-lg mb-3 flex items-center justify-center text-slate-300">
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
      {piece.iteraciones > 0 && (
        <div className="mt-2 text-[10px] text-slate-400">
          Ronda {piece.iteraciones}/{piece.max_iteraciones}
        </div>
      )}
    </button>
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
