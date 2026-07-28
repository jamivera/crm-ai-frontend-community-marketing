import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Layers } from 'lucide-react';
import { usePortalContext } from './PortalContext';
import { LazyMedia } from '../../components/ui/LazyMedia';
import { useFplusStore } from '../../store';
import { CONTENT_TYPE_LABELS, getTypeVisual, getPriority } from '../../constants';
import { PlatformIcon } from '../../components/ui/PlatformIcon';
import { NewPieceModal } from '../../components/modals/NewPieceModal';
import type { ContentState } from '../../types';

interface Props {
  canCreate?: boolean;
}

function getCompletenessBadge(cp: any): { label: string; cls: string; dot: string } {
  const hasCopy = !!cp.copy_activo;
  const hasMedia = cp.archivos && cp.archivos.length > 0;
  const hasHashtags = cp.hashtags && cp.hashtags.length > 0;
  
  if (hasCopy && hasMedia && hasHashtags) {
    return { label: 'Completo', cls: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-500' };
  }
  if (hasCopy && hasMedia && !hasHashtags) {
    return { label: 'Hashtags pend.', cls: 'bg-yellow-50 text-yellow-700 border-yellow-100', dot: 'bg-yellow-500' };
  }
  if (hasCopy && !hasMedia) {
    return { label: 'Multimedia pend.', cls: 'bg-amber-50 text-amber-700 border-amber-100', dot: 'bg-amber-500' };
  }
  if (!hasCopy && hasMedia) {
    return { label: 'Copy pend.', cls: 'bg-orange-50 text-orange-700 border-orange-100', dot: 'bg-orange-500' };
  }
  return { label: 'Incompleto', cls: 'bg-red-50 text-red-700 border-red-100', dot: 'bg-red-500' };
}

type FilterTab = 'todo' | 'aprobar' | 'cambios' | 'aprobado' | 'publicado';

const MONTHS_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];



function getStateChip(estado: ContentState, portal = false): { label: string; cls: string } {
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
      return portal
        ? { label: 'En preparación', cls: 'bg-slate-100 text-slate-500' }
        : { label: 'Producción', cls: 'bg-violet-100 text-violet-700' };
    default:
      // El cliente no ve estados internos de producción
      return portal
        ? { label: 'En preparación', cls: 'bg-slate-100 text-slate-500' }
        : { label: 'Borrador', cls: 'bg-slate-100 text-slate-500' };
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
  const contentComments = useFplusStore(s => s.contentComments);
  const portalComments = useFplusStore(s => s.portalComments);

  const commentCount = (pieceId: string) =>
    contentComments.filter(c => c.content_piece_id === pieceId).length +
    (portalComments[pieceId]?.length ?? 0);

  const updateContent = useFplusStore(s => s.updateContent);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Estados locales para filtros y modos operativos
  const [reorganizeMode, setReorganizeMode] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('todo');
  const [showCreate, setShowCreate] = useState(false);

  // Tablero editorial: reordenamiento por desplazamiento cronológico (Chronological Shift).
  // Arrastrar una tarjeta de la fecha S (Source) a la fecha T (Target) reordena la secuencia
  // de publicaciones deslizando las piezas intermedias un día.
  const handleReorderChronological = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    
    // Obtener las piezas del cliente actual ordenadas cronológicamente por fecha de publicación
    const clientPieces = [...contentPieces]
      .filter(p => p.client_id === clientId && p.fecha_publicacion && p.estado !== 'archivado')
      .sort((a, b) => a.fecha_publicacion!.localeCompare(b.fecha_publicacion!));

    const sourcePiece = clientPieces.find(p => p.id === sourceId);
    const targetPiece = clientPieces.find(p => p.id === targetId);
    if (!sourcePiece || !targetPiece) return;

    // Lineamiento 4: Una publicación programada o publicada no se puede reorganizar
    if (sourcePiece.estado === 'aprobado_final' || sourcePiece.estado === 'publicado' ||
        targetPiece.estado === 'aprobado_final' || targetPiece.estado === 'publicado') {
      window.alert('⚠️ Las publicaciones programadas o publicadas no se pueden reorganizar manualmente.');
      return;
    }

    const sourceIdx = clientPieces.findIndex(p => p.id === sourceId);
    const targetIdx = clientPieces.findIndex(p => p.id === targetId);
    if (sourceIdx === -1 || targetIdx === -1) return;

    // Guardar las fechas originales asociadas a los índices correspondientes
    const originalDates = clientPieces.map(p => p.fecha_publicacion!);

    // Reordenar la lista en memoria
    const reorderedPieces = [...clientPieces];
    const [movedPiece] = reorderedPieces.splice(sourceIdx, 1);
    reorderedPieces.splice(targetIdx, 0, movedPiece);

    // Asignar las fechas originales a la nueva secuencia ordenada de piezas
    reorderedPieces.forEach((piece, idx) => {
      if (piece.fecha_publicacion !== originalDates[idx]) {
        updateContent(piece.id, { fecha_publicacion: originalDates[idx] });
      }
    });
  };

  const allPieces = contentPieces
    .filter(cp => {
      const matchClient = cp.client_id === clientId;
      const matchDate = !!cp.fecha_publicacion;
      const matchArchive = cp.estado !== 'archivado';
      if (!matchClient || !matchDate || !matchArchive) return false;
      
      const todayZero = new Date();
      todayZero.setHours(0, 0, 0, 0);
      const pieceDate = new Date(cp.fecha_publicacion!);
      return pieceDate >= todayZero;
    })
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
      navigate(`${base}/multimedia?edit=${cpId}`);
    } else {
      navigate(`../approvals/${cpId}`);
    }
  };

  return (
    <div className="px-4 pt-5 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Cronopost</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {allPieces.length} {allPieces.length === 1 ? 'pieza planificada' : 'piezas planificadas'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canCreate && (
            <>
              {/* Reorganize Mode Toggle Button */}
              <button
                onClick={() => setReorganizeMode(!reorganizeMode)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-colors border ${
                  reorganizeMode
                    ? 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
                title="Permite arrastrar tarjetas para reordenar la secuencia cronológica"
              >
                🔧 {reorganizeMode ? 'Modo Reorganizar Activo' : 'Reorganizar Cronopost'}
              </button>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Nueva pieza
              </button>
            </>
          )}
        </div>
      </div>

      {/* Banner de Modo Reorganizar */}
      {canCreate && reorganizeMode && (
        <div className="mb-4 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
          ⚠️ <strong>Modo Reorganizar Activo:</strong> Arrastra y suelta las tarjetas para desplazar cronológicamente las fechas del calendario. Las piezas ya programadas (aprobadas final) o publicadas no se pueden mover.
        </div>
      )}

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

              {/* Piece cards: en el portal móvil cada semana se desliza en horizontal
                  (tipo carrusel) para ver más publicaciones sin perder contexto;
                  en pantallas amplias vuelve a la cuadrícula editorial. */}
              <div className={canCreate
                ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3'
                : 'flex sm:grid sm:grid-cols-3 lg:grid-cols-4 gap-3 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0'
              }>
                {pieces.map(cp => {
                  const chip = getStateChip(cp.estado, !canCreate);
                  const visual = getTypeVisual(cp.tipo);
                  const pubDate = new Date(cp.fecha_publicacion!);
                  const isPending = cp.estado === 'enviado_cliente' || cp.estado === 'en_revision_cliente';
                  const needsWork = isPending || cp.estado === 'cambios_solicitados' || cp.estado === 'en_produccion' || cp.estado === 'borrador';
                  const prio = needsWork ? getPriority(cp.fecha_publicacion) : null;
                  // Pieza planificada por IA que aún no tiene contenido real
                  const pendienteCompletar = cp.origen === 'planificada' && ((cp.archivos?.length ?? 0) === 0 || !cp.copy_activo);

                  const canDrag = canCreate && reorganizeMode && cp.estado !== 'aprobado_final' && cp.estado !== 'publicado';

                  return (
                    <button
                      key={cp.id}
                      onClick={() => handlePieceClick(cp.id)}
                      draggable={canDrag}
                      onDragStart={canDrag ? e => e.dataTransfer.setData('text/piece-id', cp.id) : undefined}
                      onDragOver={canDrag ? e => { e.preventDefault(); setDragOverId(cp.id); } : undefined}
                      onDragLeave={canDrag ? () => setDragOverId(d => (d === cp.id ? null : d)) : undefined}
                      onDrop={canDrag ? e => {
                        e.preventDefault();
                        setDragOverId(null);
                        handleReorderChronological(e.dataTransfer.getData('text/piece-id'), cp.id);
                      } : undefined}
                      className={`flex flex-col bg-white border rounded-xl overflow-hidden text-left hover:shadow-md active:scale-[0.98] transition-all ${
                        canCreate ? '' : 'min-w-[46vw] sm:min-w-0 snap-start '
                      }${
                        dragOverId === cp.id ? 'ring-2 ring-violet-400 ring-offset-1 scale-[1.02]' :
                        isPending ? 'ring-2 ring-amber-300 ring-offset-1' : 'border-slate-100'
                      } ${canDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
                    >
                      {/* Preview area */}
                      <div className="h-20 relative border-b overflow-hidden bg-slate-900 flex items-center justify-center">
                        {((cp.archivos?.length ?? 0) > 0 && cp.archivos?.[0]?.url) ? (
                          <LazyMedia
                            src={cp.archivos[0].url}
                            alt={cp.nombre}
                            typeHint={cp.archivos[0].tipo}
                            className="w-full h-full"
                          />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br ${visual.gradient} flex items-center justify-center`}>
                            <span className="text-3xl">{visual.emoji}</span>
                          </div>
                        )}
                        {((cp.archivos?.length ?? 0) > 0) && (
                          <div className="absolute top-1.5 right-1.5 bg-black/60 text-white text-[8px] px-1.5 py-0.5 rounded-full">
                            {cp.archivos?.length === 1 ? '1 arch.' : `${cp.archivos?.length} arch.`}
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
                          {prio && (
                            <span className={`text-[8px] font-bold px-1 py-px rounded-full ${prio.cls}`} title={`Prioridad ${prio.label}`}>
                              {prio.emoji} {prio.label}
                            </span>
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

                        {(() => {
                          const badge = getCompletenessBadge(cp);
                          return (
                            <div className="flex gap-1.5 flex-wrap">
                              <span className={`inline-flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded border ${badge.cls}`}>
                                <span className={`w-1 h-1 rounded-full ${badge.dot}`} />
                                {badge.label}
                              </span>
                              {canCreate && pendienteCompletar && (
                                <span className="text-[8px] font-semibold text-violet-600 bg-violet-50 border border-violet-100 rounded px-1 py-0.5 leading-none">
                                  🤖 IA
                                </span>
                              )}
                            </div>
                          );
                        })()}

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
              </div>
            </div>
          );
        })}
      </div>



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
