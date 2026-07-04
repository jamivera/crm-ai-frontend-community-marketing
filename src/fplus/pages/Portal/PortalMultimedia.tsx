import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, CheckCircle2, RotateCcw, MessageSquare, Layers, Hash, Play, Megaphone } from 'lucide-react';
import { usePortalContext } from './PortalContext';
import { useFplusStore } from '../../store';
import { CONTENT_TYPE_LABELS, PLATFORM_LABELS, getTypeVisual } from '../../constants';
import { PlatformIcon } from '../../components/ui/PlatformIcon';
import { NewPieceModal } from '../../components/modals/NewPieceModal';
import type { ContentState } from '../../types';

interface Props {
  canCreate?: boolean;
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

const PORTAL_VISIBLE: ContentState[] = [
  'enviado_cliente','en_revision_cliente','cambios_solicitados',
  'aprobado_cliente','aprobado_final','publicado',
];

export default function PortalMultimedia({ canCreate = false }: Props) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { clientId, clientNombre } = usePortalContext();
  const contentPieces  = useFplusStore(s => s.contentPieces);
  const portalComments = useFplusStore(s => s.portalComments);
  const briefs         = useFplusStore(s => s.briefs);
  const approveContent  = useFplusStore(s => s.approveContent);
  const requestChanges  = useFplusStore(s => s.requestChanges);
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
      if (cp.client_id !== clientId || !cp.fecha_publicacion) return false;
      if (!canCreate) return PORTAL_VISIBLE.includes(cp.estado);
      return true;
    })
    .sort((a, b) =>
      new Date(a.fecha_publicacion!).getTime() - new Date(b.fecha_publicacion!).getTime()
    );

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
    const d = new Date(cp.fecha_publicacion!);
    const { week, year } = getISOWeek(d);
    const key = `${year}-${String(week).padStart(2, '0')}`;
    if (!weekMap.has(key)) weekMap.set(key, []);
    weekMap.get(key)!.push(cp);
  });

  const handleDetail = (cpId: string) => {
    if (canCreate) {
      const base = location.pathname.replace(/\/multimedia$/, '');
      navigate(`${base}/approvals/${cpId}`);
    } else {
      navigate(`../approvals/${cpId}`);
    }
  };

  const handleApprove = (e: React.MouseEvent, cpId: string) => {
    e.stopPropagation();
    approveContent(cpId, clientNombre);
  };

  const handleChanges = (e: React.MouseEvent, cpId: string) => {
    e.stopPropagation();
    requestChanges(cpId, 'Se solicitan cambios.', clientNombre);
  };

  return (
    <div className="px-4 pt-5 pb-8">
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

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {wPieces.map(cp => {
                  const chip       = getStateChip(cp.estado);
                  const visual     = getTypeVisual(cp.tipo);
                  const comments   = portalComments[cp.id] ?? [];
                  const isPending  = cp.estado === 'enviado_cliente' || cp.estado === 'en_revision_cliente';
                  const hashtags   = cp.hashtags ?? brief?.hashtags_habituales ?? [];
                  const mainFile   = cp.archivos.find(f => f.es_version_activa) ?? cp.archivos[0];
                  const pubDate    = new Date(cp.fecha_publicacion!);

                  return (
                    <div
                      key={cp.id}
                      className={`flex flex-col bg-white rounded-xl overflow-hidden border hover:shadow-md transition-all ${
                        isPending ? 'ring-2 ring-amber-300 ring-offset-1 border-amber-200' : 'border-slate-100'
                      }`}
                    >
                      {/* Preview */}
                      <button
                        onClick={() => handleDetail(cp.id)}
                        className="relative block"
                      >
                        {mainFile?.tipo === 'imagen' && mainFile.url ? (
                          <img
                            src={mainFile.url}
                            alt={cp.nombre}
                            className="w-full h-24 object-cover"
                          />
                        ) : mainFile?.tipo === 'video' && mainFile.url ? (
                          <div className="relative w-full h-24 bg-slate-900">
                            <video
                              src={mainFile.url}
                              className="w-full h-full object-cover opacity-70"
                              muted
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-8 h-8 bg-white/80 rounded-full flex items-center justify-center">
                                <Play className="w-4 h-4 text-slate-700 ml-0.5" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className={`h-24 bg-gradient-to-br ${visual.gradient} flex items-center justify-center`}>
                            <span className="text-3xl">{visual.emoji}</span>
                          </div>
                        )}

                        {/* State chip overlay */}
                        <div className="absolute top-1.5 left-1.5">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${chip.cls}`}>
                            {chip.label}
                          </span>
                        </div>

                        {/* File count */}
                        {cp.archivos.length > 1 && (
                          <div className="absolute top-1.5 right-1.5 bg-black/50 text-white text-[8px] px-1.5 py-0.5 rounded-full">
                            {cp.archivos.length} arch.
                          </div>
                        )}
                      </button>

                      {/* Info */}
                      <div className="p-2.5 flex-1 flex flex-col gap-1.5">
                        {/* Type + platform */}
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">{CONTENT_TYPE_LABELS[cp.tipo]}</span>
                          {cp.plataforma && (
                            <>
                              <span className="text-slate-200 text-[9px]">·</span>
                              <PlatformIcon platform={cp.plataforma} size={9} />
                              <span className="text-[9px] text-slate-400">{PLATFORM_LABELS[cp.plataforma]}</span>
                            </>
                          )}
                        </div>

                        {/* Name */}
                        <p className="text-xs font-semibold text-slate-800 leading-snug line-clamp-2">
                          {cp.nombre}
                        </p>

                        {/* Date */}
                        <p className="text-[9px] text-slate-400">
                          {pubDate.getDate()} {MONTHS_ES[pubDate.getMonth()]} {pubDate.getFullYear()}
                        </p>

                        {/* Copy snippet */}
                        {cp.copy_activo && (
                          <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed bg-slate-50 rounded-lg px-2 py-1.5">
                            {cp.copy_activo}
                          </p>
                        )}

                        {/* Hashtag count */}
                        {hashtags.length > 0 && (
                          <div className="flex items-center gap-1 text-[9px] text-blue-500">
                            <Hash className="w-2.5 h-2.5" />
                            <span>{hashtags.length} hashtags</span>
                          </div>
                        )}

                        {/* Comment count */}
                        {comments.length > 0 && (
                          <div className="flex items-center gap-1 text-[9px] text-slate-400">
                            <MessageSquare className="w-2.5 h-2.5" />
                            <span>{comments.length} {comments.length === 1 ? 'comentario' : 'comentarios'}</span>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="mt-auto pt-1.5 flex gap-1.5">
                          {isPending ? (
                            <>
                              <button
                                onClick={e => handleApprove(e, cp.id)}
                                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-emerald-500 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-600 transition-colors"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                Aprobar
                              </button>
                              <button
                                onClick={e => handleChanges(e, cp.id)}
                                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-orange-50 text-orange-600 border border-orange-200 text-[10px] font-bold rounded-lg hover:bg-orange-100 transition-colors"
                              >
                                <RotateCcw className="w-3 h-3" />
                                Cambios
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleDetail(cp.id)}
                              className="w-full py-1.5 border border-slate-200 text-slate-500 text-[10px] font-medium rounded-lg hover:bg-slate-50 transition-colors"
                            >
                              Ver detalle →
                            </button>
                          )}
                        </div>
                        {canCreate && (
                          <button
                            onClick={e => togglePauta(e, cp.id, cp.seleccionado_pauta)}
                            className={`mt-1.5 w-full flex items-center justify-center gap-1 py-1.5 text-[10px] font-bold rounded-lg border transition-colors ${
                              cp.seleccionado_pauta
                                ? 'bg-violet-600 text-white border-violet-600'
                                : 'bg-white text-violet-600 border-violet-200 hover:bg-violet-50'
                            }`}
                          >
                            <Megaphone className="w-3 h-3" />
                            {cp.seleccionado_pauta ? 'Seleccionado para pauta ✓' : 'Seleccionar para pauta'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Add card */}
                {canCreate && (
                  <button
                    onClick={() => setShowCreate(true)}
                    className="flex flex-col items-center justify-center min-h-[200px] border-2 border-dashed border-slate-200 rounded-xl text-slate-300 hover:border-blue-300 hover:text-blue-400 hover:bg-blue-50/30 transition-all"
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
