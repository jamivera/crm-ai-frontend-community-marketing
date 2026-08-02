import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Plus, MessageSquare, Layers, Hash, Megaphone } from 'lucide-react';
import { usePortalContext } from './PortalContext';
import { LazyMedia } from '../../components/ui/LazyMedia';
import { useFplusStore } from '../../store';
import { CONTENT_TYPE_LABELS, PLATFORM_LABELS, getTypeVisual } from '../../constants';
import { PlatformIcon } from '../../components/ui/PlatformIcon';
import { NewPieceModal } from '../../components/modals/NewPieceModal';
import { CompletePieceModal } from '../../components/modals/CompletePieceModal';
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

type FilterType = 'todo' | 'reel' | 'carrusel' | 'historia' | 'post';

const MONTHS_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const TYPE_FILTERS: { key: FilterType; label: string }[] = [
  { key: 'todo',     label: 'Todos' },
  { key: 'reel',     label: '🎬 Reels' },
  { key: 'carrusel', label: '🖼️ Carruseles' },
  { key: 'historia', label: '📱 Historias' },
  { key: 'post',     label: '🖼️ Posts' },
];



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
      return { label: 'Producción', cls: 'bg-violet-100 text-violet-700' };
    default:
      return portal ? { label: 'En preparación', cls: 'bg-slate-100 text-slate-500' } : { label: 'Borrador', cls: 'bg-slate-100 text-slate-500' };
  }
}

// Same ISO week helpers as Cronopost
function getISOWeek(date: Date): { week: number; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { week, year: d.getUTCFullYear() };
}

function getWeekRange(year: number, week: number): { start: Date; end: Date } {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const startOfWeek1 = new Date(jan4);
  startOfWeek1.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() + 6) % 7));
  const start = new Date(startOfWeek1);
  start.setUTCDate(startOfWeek1.getUTCDate() + (week - 1) * 7);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return { start, end };
}

function weekLabel(year: number, week: number, idx: number): string {
  const { start, end } = getWeekRange(year, week);
  return `Semana ${idx + 1} · ${start.getUTCDate()} ${MONTHS_ES[start.getUTCMonth()]}–${end.getUTCDate()} ${MONTHS_ES[end.getUTCMonth()]}`;
}


export default function PortalMultimedia({ canCreate = false }: Props) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const [completePieceId, setCompletePieceId] = useState<string | null>(null);

  useEffect(() => {
    if (editId) {
      setCompletePieceId(editId);
    }
  }, [editId]);

  const { clientId, clientNombre } = usePortalContext();
  const contentPieces  = useFplusStore(s => s.contentPieces);
  const portalComments = useFplusStore(s => s.portalComments);
  const briefs         = useFplusStore(s => s.briefs);
  const updateContent   = useFplusStore(s => s.updateContent);

  // Marcar/desmarcar para pauta: la pieza queda registrada y aparecerá
  // automáticamente en el módulo Campañas (sin volver a buscarla).
  const togglePauta = (e: React.MouseEvent, cpId: string, actual?: boolean) => {
    e.stopPropagation();
    updateContent(cpId, { seleccionado_pauta: !actual });
  };
  const [activeFilter, setActiveFilter] = useState<FilterType>('todo');
  const [showCreate,   setShowCreate]   = useState(false);

  const brief = briefs[clientId];

  const pieces = contentPieces
    .filter(cp => {
      if (cp.client_id !== clientId) return false;
      // El cliente ve toda la biblioteca (misma fuente que la agencia);
      // los estados internos se muestran como "En preparación".
      if (!canCreate) return true;
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.fecha_publicacion || a.fecha_limite || a.created_at || '').getTime();
      const dateB = new Date(b.fecha_publicacion || b.fecha_limite || b.created_at || '').getTime();
      return dateA - dateB;
    });

  const filtered = pieces.filter(cp => {
    if (activeFilter === 'todo')     return true;
    if (activeFilter === 'reel')     return cp.tipo === 'reel' || cp.tipo === 'post_video';
    if (activeFilter === 'carrusel') return cp.tipo === 'carrusel';
    if (activeFilter === 'historia') return cp.tipo === 'historia' || cp.tipo === 'historia_video';
    if (activeFilter === 'post')     return cp.tipo === 'post_imagen';
    return true;
  });

  const pendingCount = pieces.filter(cp =>
    cp.estado === 'enviado_cliente' || cp.estado === 'en_revision_cliente'
  ).length;

  // Group by ISO week
  const weekMap = new Map<string, typeof filtered>();
  filtered.forEach(cp => {
    let d = new Date(cp.fecha_publicacion || cp.fecha_limite || cp.created_at || '');
    if (isNaN(d.getTime())) {
      d = new Date();
    }
    const { week, year } = getISOWeek(d);
    const key = `${year}-${String(week).padStart(2, '0')}`;
    if (!weekMap.has(key)) weekMap.set(key, []);
    weekMap.get(key)!.push(cp);
  });

  const handleDetail = (cpId: string) => {
    if (canCreate) {
      setCompletePieceId(cpId);
    } else {
      const base = location.pathname.replace(/\/(calendar|multimedia|approvals|cronopost|metrics|brand|pauta|campaigns).*$/, '');
      navigate(`${base}/approvals/${cpId}`);
    }
  };



  return (
    <div className="px-4 sm:px-8 pt-6 sm:pt-10 pb-16 sm:pb-20 max-w-6xl mx-auto space-y-8 sm:space-y-12">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Multimedia</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {pieces.length} {pieces.length === 1 ? 'pieza' : 'piezas'}
            {pendingCount > 0 && (
              <span className="ml-2 text-amber-600 font-medium">{pendingCount} pendientes de aprobación</span>
            )}
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700"
          >
            <Plus className="w-3.5 h-3.5" />
            Nueva pieza
          </button>
        )}
      </div>

      {/* Type filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none mb-5">
        {TYPE_FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeFilter === f.key ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {f.label}
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
        {Array.from(weekMap.entries()).map(([weekKey, wPieces], weekIndex) => {
          const [yearStr, weekStr] = weekKey.split('-');
          const year = parseInt(yearStr);
          const week = parseInt(weekStr);

          return (
            <div key={weekKey}>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  {weekLabel(year, week, weekIndex)}
                </h3>
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-[10px] text-slate-400">{wPieces.length} piezas</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {wPieces.map(cp => {
                  const chip       = getStateChip(cp.estado, !canCreate);
                  const visual     = getTypeVisual(cp.tipo);
                  const comments   = portalComments[cp.id] ?? [];
                  const isPending  = cp.estado === 'enviado_cliente' || cp.estado === 'en_revision_cliente';
                  const hashtags   = cp.hashtags ?? brief?.hashtags_habituales ?? [];
                  const mainFile   = cp.archivos?.find(f => f.es_version_activa) ?? cp.archivos?.[0];
                  const pubDate    = new Date(cp.fecha_publicacion || cp.fecha_limite || cp.created_at || '');

                  const hasMedia = !!mainFile?.url;
                  const isLocked = !hasMedia && !canCreate;

                  return (
                    <div
                      key={cp.id}
                      className={`flex flex-col bg-white rounded-3xl overflow-hidden border hover:shadow-md hover:scale-[1.01] transition-all p-3 ${
                        isPending ? 'ring-2 ring-amber-300 border-amber-250 bg-amber-50/10' : 'border-slate-100'
                      } ${isLocked ? 'opacity-70' : ''}`}
                    >
                      {/* Preview wrapper */}
                      <div className="relative rounded-2xl overflow-hidden shrink-0 group">
                        <button
                          onClick={() => handleDetail(cp.id)}
                          className="relative block w-full text-left cursor-pointer"
                        >
                          {hasMedia ? (
                            <LazyMedia
                              src={mainFile.url}
                              alt={cp.nombre}
                              typeHint={mainFile.tipo}
                              className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className={`w-full h-32 bg-gradient-to-br ${visual.gradient} flex flex-col items-center justify-center p-2 text-center`}>
                              <span className="text-3xl mb-1">⏳</span>
                              <span className="text-[9px] font-bold text-slate-500 bg-white/95 px-2.5 py-0.5 rounded-full border border-slate-200 uppercase tracking-wider">
                                Pendiente
                              </span>
                            </div>
                          )}

                          {/* State chip overlay */}
                          <div className="absolute top-2 left-2 z-10">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${chip.cls}`}>
                              {chip.label}
                            </span>
                          </div>

                          {/* File count overlay */}
                          {((cp.archivos?.length ?? 0) > 1) && (
                            <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[8px] px-2 py-0.5 rounded-full font-bold">
                              {cp.archivos?.length} archivos
                            </div>
                          )}
                        </button>

                        {/* Floating Pauta selection button */}
                        <button
                          type="button"
                          onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            togglePauta(e, cp.id, cp.seleccionado_pauta);
                          }}
                          className={`absolute top-2 right-2 p-1.5 rounded-full border transition-all z-20 shadow-sm ${
                            cp.seleccionado_pauta
                              ? 'bg-violet-600 text-white border-violet-500 hover:bg-violet-750'
                              : 'bg-white/95 text-slate-400 border-slate-200 hover:text-slate-700 hover:bg-white'
                          }`}
                          title={cp.seleccionado_pauta ? 'Remover de pauta publicitaria' : 'Seleccionar para pauta publicitaria'}
                        >
                          <Megaphone className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Info Area */}
                      <div className="p-3 flex-1 flex flex-col gap-2 justify-between">
                        <div className="space-y-1.5">
                          {/* Type + Platform tags */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{CONTENT_TYPE_LABELS[cp.tipo]}</span>
                            {cp.plataforma && (
                              <>
                                <span className="text-slate-200 text-[9px]">•</span>
                                <PlatformIcon platform={cp.plataforma} size={10} />
                                <span className="text-[9px] text-slate-500 font-medium">{PLATFORM_LABELS[cp.plataforma]}</span>
                              </>
                            )}
                          </div>

                          {/* Name title */}
                          <h4 className="text-xs font-bold text-slate-800 leading-snug line-clamp-2">
                            {cp.nombre}
                          </h4>
                        </div>

                        {/* Metadata row */}
                        <div className="space-y-2 pt-1.5 border-t border-slate-50">
                          <div className="flex items-center justify-between text-[9px] text-slate-400">
                            <span>
                              {pubDate.getDate()} {MONTHS_ES[pubDate.getMonth()]} {pubDate.getFullYear()}
                            </span>
                            {(() => {
                              const badge = getCompletenessBadge(cp);
                              return (
                                <span className={`inline-flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded border leading-none ${badge.cls}`}>
                                  <span className={`w-1 h-1 rounded-full ${badge.dot}`} />
                                  {badge.label}
                                </span>
                              );
                            })()}
                          </div>

                          {/* Interactive counters (comments & hashtags) */}
                          <div className="flex items-center gap-3">
                            {hashtags.length > 0 && (
                              <div className="flex items-center gap-1 text-[9px] text-blue-500 font-semibold">
                                <Hash className="w-3 h-3" />
                                <span>{hashtags.length} hashtags</span>
                              </div>
                            )}
                            {comments.length > 0 && (
                              <div className="flex items-center gap-1 text-[9px] text-slate-400 font-semibold">
                                <MessageSquare className="w-3 h-3" />
                                <span>{comments.length} {comments.length === 1 ? 'comentario' : 'comentarios'}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="pt-2">
                          <button
                            onClick={() => handleDetail(cp.id)}
                            className={`w-full py-2 text-[10px] font-extrabold rounded-xl border transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                              isLocked
                                ? 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                                : isPending
                                ? 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                          >
                            {isLocked ? 'Contenido pendiente (Ver) →' : isPending ? 'Revisar publicación' : 'Ver detalle →'}
                          </button>
                        </div>
                      </div>
                    </div>
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

      {completePieceId && (() => {
        const p = contentPieces.find(cp => cp.id === completePieceId);
        if (!p) return null;
        return (
          <CompletePieceModal
            piece={p}
            onClose={() => {
              setCompletePieceId(null);
              if (searchParams.get('edit') === completePieceId) {
                setSearchParams({});
              }
            }}
          />
        );
      })()}
    </div>
  );
}
