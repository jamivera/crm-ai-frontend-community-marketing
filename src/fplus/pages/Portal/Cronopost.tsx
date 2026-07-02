import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Layers, Sparkles } from 'lucide-react';
import { usePortalContext } from './PortalContext';
import { useFplusStore } from '../../store';
import { CONTENT_TYPE_LABELS, getTypeVisual } from '../../constants';
import { PlatformIcon } from '../../components/ui/PlatformIcon';
import { NewPieceModal } from '../../components/modals/NewPieceModal';
import { PlanCronopostModal } from '../../components/modals/PlanCronopostModal';
import type { ContentState } from '../../types';

interface Props {
  canCreate?: boolean;
}

type FilterTab = 'todo' | 'aprobar' | 'cambios' | 'aprobado' | 'publicado';

const MONTHS_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];



function getStateChip(estado: ContentState): { label: string; cls: string } {
  switch (estado) {
    case 'enviado_cliente':
    case 'en_revision_cliente':
      return { label: 'Por aprobar', cls: 'bg-amber-100 text-amber-700' };
    case 'cambios_solicitados':
      return { label: 'Con cambios', cls: 'bg-orange-100 text-orange-700' };
    case 'aprobado_cliente':
    case 'aprobado_final':
      return { label: 'Aprobado', cls: 'bg-emerald-100 text-emerald-700' };
    case 'publicado':
      return { label: 'Publicado', cls: 'bg-blue-100 text-blue-700' };
    case 'en_produccion':
      return { label: 'Producción', cls: 'bg-violet-100 text-violet-700' };
    default:
      return { label: 'Borrador', cls: 'bg-slate-100 text-slate-500' };
  }
}

const FILTER_MAP: Record<FilterTab, ContentState[]> = {
  todo:      ['enviado_cliente','en_revision_cliente','cambios_solicitados','aprobado_cliente','aprobado_final','publicado','en_produccion','borrador'],
  aprobar:   ['enviado_cliente','en_revision_cliente'],
  cambios:   ['cambios_solicitados'],
  aprobado:  ['aprobado_cliente','aprobado_final'],
  publicado: ['publicado'],
};

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'todo',      label: 'Todo' },
  { key: 'aprobar',   label: 'Por aprobar' },
  { key: 'cambios',   label: 'Con cambios' },
  { key: 'aprobado',  label: 'Aprobado' },
  { key: 'publicado', label: 'Publicado' },
];

// Returns ISO week number (Mon-based) and year
function getISOWeek(date: Date): { week: number; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { week, year: d.getUTCFullYear() };
}

function getWeekRange(year: number, week: number): { start: Date; end: Date } {
  // ISO week: week 1 = first Thursday of the year
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const startOfWeek1 = new Date(jan4);
  startOfWeek1.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() + 6) % 7));
  const start = new Date(startOfWeek1);
  start.setUTCDate(startOfWeek1.getUTCDate() + (week - 1) * 7);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return { start, end };
}

function weekLabel(year: number, week: number, weekIndex: number): string {
  const { start, end } = getWeekRange(year, week);
  const startStr = `${start.getUTCDate()} ${MONTHS_ES[start.getUTCMonth()]}`;
  const endStr   = `${end.getUTCDate()} ${MONTHS_ES[end.getUTCMonth()]}`;
  return `Semana ${weekIndex + 1} · ${startStr}–${endStr}`;
}

export default function Cronopost({ canCreate = false }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { clientId, clientNombre } = usePortalContext();
  const contentPieces = useFplusStore(s => s.contentPieces);
  const client = useFplusStore(s => s.clients.find(c => c.id === clientId));
  const contentComments = useFplusStore(s => s.contentComments);
  const portalComments = useFplusStore(s => s.portalComments);

  const commentCount = (pieceId: string) =>
    contentComments.filter(c => c.content_piece_id === pieceId).length +
    (portalComments[pieceId]?.length ?? 0);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('todo');
  const [showCreate, setShowCreate] = useState(false);
  const [showPlanner, setShowPlanner] = useState(false);

  const allPieces = contentPieces
    .filter(cp => cp.client_id === clientId && cp.fecha_publicacion)
    .sort((a, b) =>
      new Date(a.fecha_publicacion!).getTime() - new Date(b.fecha_publicacion!).getTime()
    );

  const filtered = allPieces.filter(cp => FILTER_MAP[activeFilter].includes(cp.estado));

  const counts: Record<FilterTab, number> = {
    todo:      allPieces.length,
    aprobar:   allPieces.filter(cp => FILTER_MAP.aprobar.includes(cp.estado)).length,
    cambios:   allPieces.filter(cp => FILTER_MAP.cambios.includes(cp.estado)).length,
    aprobado:  allPieces.filter(cp => FILTER_MAP.aprobado.includes(cp.estado)).length,
    publicado: allPieces.filter(cp => FILTER_MAP.publicado.includes(cp.estado)).length,
  };

  // Group by ISO week key "YYYY-WW"
  const weekMap = new Map<string, typeof filtered>();
  filtered.forEach(cp => {
    const d = new Date(cp.fecha_publicacion!);
    const { week, year } = getISOWeek(d);
    const key = `${year}-${String(week).padStart(2, '0')}`;
    if (!weekMap.has(key)) weekMap.set(key, []);
    weekMap.get(key)!.push(cp);
  });

  const handlePieceClick = (cpId: string) => {
    if (canCreate) {
      const base = location.pathname.replace(/\/cronopost$/, '');
      navigate(`${base}/approvals/${cpId}`);
    } else {
      navigate(`../approvals/${cpId}`);
    }
  };

  return (
    <div className="px-4 pt-5 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Cronopost</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {allPieces.length} {allPieces.length === 1 ? 'pieza planificada' : 'piezas planificadas'}
          </p>
        </div>
        {canCreate && (
          <div className="flex gap-2">
            {client?.distribucion_piezas && (
              <button
                onClick={() => setShowPlanner(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 text-white text-xs font-semibold rounded-xl hover:bg-violet-700 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Planificar mes
              </button>
            )}
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Nueva pieza
            </button>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none mb-5">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeFilter === tab.key ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span className={`ml-1.5 ${activeFilter === tab.key ? 'text-blue-200' : 'text-slate-400'}`}>
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Empty */}
      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <Layers className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No hay piezas en esta categoría.</p>
          {canCreate && (
            <button
              onClick={() => setShowCreate(true)}
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-blue-600 font-medium hover:underline"
            >
              <Plus className="w-3.5 h-3.5" /> Crear primera pieza
            </button>
          )}
        </div>
      )}

      {/* Weekly sections */}
      <div className="space-y-8">
        {Array.from(weekMap.entries()).map(([weekKey, pieces], weekIndex) => {
          const [yearStr, weekStr] = weekKey.split('-');
          const year = parseInt(yearStr);
          const week = parseInt(weekStr);

          return (
            <div key={weekKey}>
              {/* Week label */}
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  {weekLabel(year, week, weekIndex)}
                </h3>
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-[10px] text-slate-400">{pieces.length} {pieces.length === 1 ? 'pieza' : 'piezas'}</span>
              </div>

              {/* Piece cards grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {pieces.map(cp => {
                  const chip = getStateChip(cp.estado);
                  const visual = getTypeVisual(cp.tipo);
                  const pubDate = new Date(cp.fecha_publicacion!);
                  const isPending = cp.estado === 'enviado_cliente' || cp.estado === 'en_revision_cliente';

                  return (
                    <button
                      key={cp.id}
                      onClick={() => handlePieceClick(cp.id)}
                      className={`flex flex-col bg-white border rounded-xl overflow-hidden text-left hover:shadow-md active:scale-[0.98] transition-all ${
                        isPending ? 'ring-2 ring-amber-300 ring-offset-1' : 'border-slate-100'
                      }`}
                    >
                      {/* Preview area */}
                      <div className={`h-20 bg-gradient-to-br ${visual.gradient} flex items-center justify-center relative border-b`}>
                        <span className="text-3xl">{visual.emoji}</span>
                        {cp.archivos.length > 0 && (
                          <div className="absolute top-1.5 right-1.5 bg-black/40 text-white text-[8px] px-1.5 py-0.5 rounded-full">
                            {cp.archivos.length === 1 ? '1 arch.' : `${cp.archivos.length} arch.`}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-2.5 flex-1 flex flex-col gap-1.5">
                        {/* Type badge */}
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">{CONTENT_TYPE_LABELS[cp.tipo]}</span>
                          {cp.origen === 'extraordinaria' && (
                            <span className="text-[8px] font-bold bg-violet-100 text-violet-700 px-1 py-px rounded-full">⚡</span>
                          )}
                          {cp.plataforma && (
                            <>
                              <span className="text-slate-200">·</span>
                              <PlatformIcon platform={cp.plataforma} size={9} />
                            </>
                          )}
                        </div>

                        {/* Name */}
                        <p className="text-xs font-semibold text-slate-800 leading-snug line-clamp-2">
                          {cp.nombre}
                        </p>

                        {/* Copy preview */}
                        {cp.copy_activo && (
                          <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                            {cp.copy_activo}
                          </p>
                        )}

                        {/* Hashtags + comentarios + aprobación */}
                        <div className="flex items-center gap-2 text-[9px] text-slate-400">
                          {(cp.hashtags?.length ?? 0) > 0 && <span># {cp.hashtags!.length}</span>}
                          {commentCount(cp.id) > 0 && <span>💬 {commentCount(cp.id)}</span>}
                          {(cp.estado === 'aprobado_cliente' || cp.estado === 'aprobado_final' || cp.estado === 'publicado') && (
                            <span className="text-emerald-500 font-semibold">✓ Aprobado</span>
                          )}
                        </div>

                        {/* Date + state */}
                        <div className="mt-auto pt-1 flex items-center justify-between gap-1">
                          <span className="text-[9px] text-slate-400">
                            {pubDate.getDate()} {MONTHS_ES[pubDate.getMonth()]} {pubDate.getFullYear()}
                          </span>
                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${chip.cls}`}>
                            {chip.label}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}

                {/* Add card (agency only) */}
                {canCreate && (
                  <button
                    onClick={() => setShowCreate(true)}
                    className="flex flex-col items-center justify-center h-full min-h-[140px] border-2 border-dashed border-slate-200 rounded-xl text-slate-300 hover:border-blue-300 hover:text-blue-400 hover:bg-blue-50/30 transition-all"
                  >
                    <Plus className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-medium">Agregar</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showPlanner && client && (
        <PlanCronopostModal client={client} onClose={() => setShowPlanner(false)} />
      )}

      {showCreate && (
        <NewPieceModal
          clientId={clientId}
          clientNombre={clientNombre}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}
