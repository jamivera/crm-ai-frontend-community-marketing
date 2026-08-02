import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePortalContext } from './PortalContext';
import { useFplusStore } from '../../store';
import { CONTENT_TYPE_LABELS, getTypeVisual } from '../../constants';
import { NewPieceModal } from '../../components/modals/NewPieceModal';
import { PlanCronopostModal } from '../../components/modals/PlanCronopostModal';
import { CompletePieceModal } from '../../components/modals/CompletePieceModal';
import { getMonthEvents } from '../../utils/cronoplanner';
import type { ContentPiece, ContentState } from '../../types';

interface Props {
  canCreate?: boolean;
}

const DAYS_ES = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];



function getPieceCardColor(estado: ContentState): string {
  if (estado === 'publicado') return 'bg-emerald-50 border-emerald-100';
  if (estado === 'aprobado_cliente' || estado === 'aprobado_final') return 'bg-blue-50 border-blue-100';
  if (estado === 'cambios_solicitados') return 'bg-orange-50 border-orange-100';
  if (estado === 'enviado_cliente' || estado === 'en_revision_cliente') return 'bg-amber-50 border-amber-100';
  return 'bg-slate-50 border-slate-100';
}

function getPieceStateLabel(estado: ContentState, portal = false): string {
  if (portal && ['borrador', 'en_produccion', 'revision_interna', 'cambios_internos', 'listo_para_cliente'].includes(estado)) {
    return 'En preparación';
  }
  const map: Partial<Record<ContentState, string>> = {
    borrador: 'Borrador',
    en_produccion: 'En producción',
    enviado_cliente: 'Por aprobar',
    en_revision_cliente: 'En revisión',
    cambios_solicitados: 'Con cambios',
    aprobado_cliente: 'Aprobado',
    aprobado_final: 'Aprobado',
    publicado: 'Publicado',
  };
  return map[estado] ?? estado;
}

function getTypeEmoji(tipo: string): string {
  const map: Record<string, string> = {
    reel: '🎬', carrusel: '🖼️', historia: '📱', historia_video: '📱',
    post_imagen: '🖼️', post_video: '🎥', tiktok: '🎵',
  };
  return map[tipo] ?? '📄';
}

// ISO week starts on Monday — adjust firstDay so Monday = 0
function getFirstDayMon(year: number, month: number): number {
  const d = new Date(year, month, 1).getDay(); // 0=Sun
  return (d + 6) % 7; // Mon=0 … Sun=6
}

export default function PortalCalendar({ canCreate = false }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { clientId, clientNombre } = usePortalContext();
  const allPieces = useFplusStore(s => s.contentPieces);
  const client = useFplusStore(s => s.clients.find(c => c.id === clientId));
  const updateContent = useFplusStore(s => s.updateContent);
  const allCampaigns = useFplusStore(s => s.campaigns);
  const campaigns = useMemo(() => allCampaigns.filter(c => c.client_id === clientId), [allCampaigns, clientId]);
  
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('todas');
  const [formatFilter, setFormatFilter] = useState<'todos' | 'reel' | 'post' | 'historia'>('todos');

  // Ajustar campaña por defecto para la agencia (sin "todas")
  useState(() => {
    if (canCreate && campaigns.length > 0) {
      setSelectedCampaignId(campaigns[0].id);
    }
  });

  const handleClearPlanning = () => {
    const confirmClear = window.confirm('¿Estás seguro de que deseas archivar toda la planificación mensual no publicada de esta marca? Esta acción no se puede deshacer.');
    if (!confirmClear) return;
    useFplusStore.getState().clearMonthPlanning(clientId, year, month);
  };

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [createDate, setCreateDate] = useState<string | null>(null);
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);
  const [showPlanner, setShowPlanner] = useState(false);
  const [completingPiece, setCompletingPiece] = useState<ContentPiece | null>(null);

  const esIncompleta = (piece: ContentPiece) =>
    piece.origen === 'planificada' && ((piece.archivos?.length ?? 0) === 0 || !piece.copy_activo);

  const isDateInPast = (dayVal: number) => {
    const todayZero = new Date();
    todayZero.setHours(0, 0, 0, 0);
    const dayDate = new Date(year, month, dayVal, 0, 0, 0, 0);
    return dayDate < todayZero;
  };

  // Eventos inteligentes del mes (feriados, fechas comerciales, sectoriales)
  const monthEvents = getMonthEvents(year, month, client?.industria ?? '', clientId);
  const eventByDay = new Map<number, string>();
  monthEvents.forEach(ev => {
    const d = new Date(ev.fecha + 'T12:00:00');
    if (!isNaN(d.getTime())) {
      eventByDay.set(d.getDate(), ev.nombre);
    }
  });

  // Drag & drop (solo agencia): arrastrar una pieza a otro día actualiza
  // fecha_publicacion conservando la hora — se refleja en las 3 vistas.
  const handleDropOnDay = (e: React.DragEvent, day: number) => {
    e.preventDefault();
    setDragOverDay(null);
    if (isDateInPast(day)) {
      alert("No se pueden programar publicaciones en fechas pasadas.");
      return;
    }
    const pieceId = e.dataTransfer.getData('text/piece-id');
    if (!pieceId) return;
    const piece = allPieces.find(p => p.id === pieceId);
    if (!piece?.fecha_publicacion) return;
    const time = piece.fecha_publicacion.slice(10) || 'T12:00:00';
    const newDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}${time}`;
    updateContent(pieceId, { fecha_publicacion: newDate });
  };

  const matchesFormat = (cpType: string, filter: typeof formatFilter) => {
    if (filter === 'todos') return true;
    const lower = cpType.toLowerCase();
    if (filter === 'reel') return lower === 'reel' || lower === 'tiktok';
    if (filter === 'post') return lower === 'post_imagen' || lower === 'post_video' || lower === 'carrusel';
    if (filter === 'historia') return lower === 'historia' || lower === 'historia_video';
    return true;
  };

  const hasPiecesInMonth = useMemo(() => {
    return allPieces.some(cp => {
      if (cp.client_id !== clientId) return false;
      if (!cp.fecha_publicacion) return false;
      if (cp.estado === 'archivado') return false;
      const d = new Date(cp.fecha_publicacion);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [allPieces, clientId, year, month]);

  // In portal mode: only show client-visible states. In agency mode: show all.
  const pieces = allPieces.filter(p => {
    if (p.client_id !== clientId) return false;
    if (!p.fecha_publicacion) return false;
    if (p.estado === 'archivado') return false;
    if (canCreate) {
      if (selectedCampaignId !== 'todas' && p.campaign_id !== selectedCampaignId) return false;
    } else {
      if (!matchesFormat(p.tipo, formatFilter)) return false;
    }
    return true;
  });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = getFirstDayMon(year, month);

  const piecesByDay = new Map<number, ContentPiece[]>();
  pieces.forEach(piece => {
    const d = new Date(piece.fecha_publicacion!);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!piecesByDay.has(day)) piecesByDay.set(day, []);
      piecesByDay.get(day)!.push(piece);
    }
  });

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  };

  const selectedPieces = selectedDay != null ? (piecesByDay.get(selectedDay) ?? []) : [];

  const totalThisMonth = Array.from(piecesByDay.values()).flat();

  const handlePieceClick = (piece: ContentPiece) => {
    // Pieza planificada sin contenido: pasar de planificación a producción
    // con contexto claro, en lugar de abrir la ficha vacía.
    if (canCreate && esIncompleta(piece)) {
      setCompletingPiece(piece);
      return;
    }
    // Permitir ver el detalle incluso si no tiene archivos cargados aún (Lógica de Onboarding de Cliente)
    // Navigate absolute from root client context
    const base = location.pathname.replace(/\/(calendar|multimedia|approvals|cronopost|metrics|brand|pauta|campaigns).*$/, '');
    navigate(`${base}/approvals/${piece.id}`);
  };

  const openCreate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setCreateDate(dateStr);
  };

  // Leyenda por tipo de contenido — colores compartidos con Cronopost y Multimedia
  const LEGEND = [
    { dot: 'bg-blue-500',    label: 'Reel / Video' },
    { dot: 'bg-violet-500',  label: 'Carrusel' },
    { dot: 'bg-emerald-500', label: 'Historia' },
    { dot: 'bg-orange-500',  label: 'Post' },
  ];

  const visibleLegend = LEGEND;

  return (
    <div className="px-4 sm:px-8 pt-6 sm:pt-10 pb-16 sm:pb-20 max-w-6xl mx-auto space-y-8 sm:space-y-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Calendario</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {totalThisMonth.length} {totalThisMonth.length === 1 ? 'pieza' : 'piezas'} este mes
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!canCreate ? (
            /* Filtro de formato para el Cliente (Todos | Reels | Posts | Historias) */
            <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/50">
              {(['todos', 'reel', 'post', 'historia'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFormatFilter(f)}
                  className={`px-3 py-1 text-xs font-semibold capitalize transition-all rounded-lg ${
                    formatFilter === f
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {f === 'todos' ? 'Todos' : f === 'reel' ? 'Reels' : f === 'post' ? 'Posts' : 'Historias'}
                </button>
              ))}
            </div>
          ) : (
            /* Selector de campaña para la Agencia (sin "Todas las campañas") */
            campaigns.length > 0 && (
              <select
                value={selectedCampaignId}
                onChange={e => setSelectedCampaignId(e.target.value)}
                className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {campaigns.map(c => (
                  <option key={c.id} value={c.id}>🎯 {c.nombre}</option>
                ))}
              </select>
            )
          )}

          {canCreate && (
            <>
              <button
                onClick={handleClearPlanning}
                disabled={!hasPiecesInMonth}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 border border-red-200 text-xs font-semibold rounded-xl hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors active:scale-95"
                title="Eliminar toda la planificación no publicada de este mes"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar toda la planificación
              </button>
              {client?.distribucion_piezas && (
                <button
                  onClick={() => setShowPlanner(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 text-white text-xs font-semibold rounded-xl hover:bg-violet-700 transition-colors active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Planificar mes
                </button>
              )}
              <button
                onClick={() => openCreate(today.getDate())}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                Nueva pieza
              </button>
            </>
          )}
        </div>
      </div>

      {/* Calendar card */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        {/* Month nav */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <button onClick={prevMonth} className="p-1.5 hover:bg-slate-100 rounded-lg active:scale-95 transition-all">
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>
          <h2 className="text-sm font-semibold text-slate-800">
            {MONTHS_ES[month]} {year}
          </h2>
          <button onClick={nextMonth} className="p-1.5 hover:bg-slate-100 rounded-lg active:scale-95 transition-all">
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        {/* Day names — starts Monday */}
        <div className="grid grid-cols-7 border-b border-slate-100">
          {DAYS_ES.map(d => (
            <div key={d} className="py-2 text-center text-[11px] font-medium text-slate-400">{d}</div>
          ))}
        </div>

        {/* Days — mini tarjetas por pieza en lugar de puntos */}
        <div className="grid grid-cols-7 p-2 gap-0.5">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`e${i}`} className="min-h-[72px]" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayPieces = piecesByDay.get(day) ?? [];
            const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
            const isSelected = selectedDay === day;
            const inPast = isDateInPast(day);

            const eventName = eventByDay.get(day);
            const isDragOver = dragOverDay === day;
            const emptyTooltip = dayPieces.length === 0 && canCreate ? 'Agregar contenido' : undefined;

            return (
              <div
                key={day}
                className="min-h-[72px] relative group"
                onDragOver={canCreate ? e => { e.preventDefault(); setDragOverDay(day); } : undefined}
                onDragLeave={canCreate ? () => setDragOverDay(d => (d === day ? null : d)) : undefined}
                onDrop={canCreate ? e => handleDropOnDay(e, day) : undefined}
              >
                <button
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  title={eventName ?? emptyTooltip}
                  className={`w-full h-full min-h-[72px] flex flex-col items-stretch justify-start pt-1 px-0.5 pb-0.5 rounded-xl transition-all ${
                    isDragOver ? 'bg-violet-100 ring-2 ring-violet-400' :
                    isSelected ? 'bg-blue-600' : isToday ? 'bg-blue-50' : inPast ? 'bg-slate-50 opacity-60' : 'hover:bg-slate-50'
                  }`}
                >
                  {eventName && (
                    <span className="absolute top-0.5 left-0.5 text-[8px]" title={eventName}>🎉</span>
                  )}
                  <span className={`text-xs font-medium leading-none text-center mb-1 ${
                    isSelected ? 'text-white' : isToday ? 'text-blue-600 font-bold' : inPast ? 'text-slate-400' : 'text-slate-700'
                  }`}>
                    {day}
                  </span>
                  {dayPieces.slice(0, 2).map(piece => {
                    const v = getTypeVisual(piece.tipo);
                    const file = piece.archivos?.find(a => a.url && a.tipo === 'imagen');

                    // Mapear los 6 estados operativos con mensajes detallados y emojis claros (Lógica de Producto V1)
                    const getPieceDetailedStatus = (cp: ContentPiece) => {
                      const hasMedia = cp.archivos && cp.archivos.length > 0 && cp.archivos[0]?.url;
                      const hasCopy = !!cp.copy_activo?.trim();
                      const fileReady = cp.archivos?.[0]?.estado_procesamiento === 'ready';
                      const fileProcessing = cp.archivos?.[0]?.estado_procesamiento === 'processing';
                      const filePending = cp.archivos?.[0]?.estado_procesamiento === 'pending';

                      // 1. Contenido pendiente
                      if (!hasMedia) {
                        return { emoji: '🟡', label: 'Contenido pendiente de multimedia' };
                      }
                      // 2. Procesando / Pendiente de listo
                      if (filePending || fileProcessing) {
                        return { emoji: '🟠', label: `Procesando multimedia (${filePending ? 'Cola' : 'Comprimiendo'})` };
                      }
                      // 3. Contenido listo pero sin copy
                      if (fileReady && !hasCopy) {
                        return { emoji: '🔵', label: 'Multimedia lista, copy pendiente' };
                      }
                      // 4. Requiere cambios
                      if (cp.estado === 'cambios_solicitados' || cp.estado === 'cambios_internos') {
                        return { emoji: '🔴', label: 'Requiere cambios / Correcciones solicitadas' };
                      }
                      // 5. En revisión (Enviado a revisión / En revisión interna)
                      if (cp.estado === 'enviado_cliente' || cp.estado === 'en_revision_cliente') {
                        return { emoji: '🟣', label: 'En revisión por el cliente' };
                      }
                      // 6. Aprobado / Programado
                      if (cp.estado === 'aprobado_cliente' || cp.estado === 'aprobado_final' || cp.estado === 'publicado') {
                        return { emoji: '🟢', label: 'Aprobado y programado para publicación' };
                      }
                      // Fallback
                      return { emoji: '🔵', label: 'Multimedia cargada' };
                    };

                    const status = getPieceDetailedStatus(piece);

                    return (
                      <span
                        key={piece.id}
                        onClick={e => { e.stopPropagation(); handlePieceClick(piece); }}
                        title={`${piece.nombre} · ${CONTENT_TYPE_LABELS[piece.tipo]} · ${status.emoji} ${status.label}`}
                        className={`flex items-center gap-1 rounded-md px-1 py-0.5 mb-0.5 text-left overflow-hidden ${
                          isSelected ? 'bg-white/20' :
                          canCreate && esIncompleta(piece)
                            ? 'bg-white border border-dashed border-amber-400 opacity-80'
                            : `bg-gradient-to-r ${v.gradient} border-l-2 ${v.border}`
                        }`}
                      >
                        {file ? (
                          <img src={file.url} alt="" className="w-4 h-4 rounded object-cover shrink-0" />
                        ) : (
                          <span className="text-[9px] shrink-0">{v.emoji}</span>
                        )}
                        <span className={`text-[8px] leading-tight truncate flex-1 ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                          {CONTENT_TYPE_LABELS[piece.tipo]}
                        </span>
                        <span className="text-[8px] shrink-0">
                          {status.emoji}
                        </span>
                      </span>
                    );
                  })}
                  {dayPieces.length > 2 && (
                    <span className={`text-[8px] leading-none text-center ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>
                      +{dayPieces.length - 2} más
                    </span>
                  )}
                </button>

                {/* + button on hover (agency only) */}
                {canCreate && !inPast && (
                  <button
                    onClick={e => { e.stopPropagation(); openCreate(day); }}
                    className="absolute top-0.5 right-0.5 w-4 h-4 bg-blue-600 text-white rounded-full items-center justify-center hidden group-hover:flex z-10 shadow-sm"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-3 flex-wrap">
        {visibleLegend.map(({ dot, label }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className={`w-2 h-2 rounded-full ${dot}`} />
            {label}
          </div>
        ))}
      </div>

      {/* Day detail */}
      {selectedDay != null && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">
              {selectedDay} de {MONTHS_ES[month]}
              {selectedPieces.length === 0 && (
                <span className="font-normal text-slate-400"> — sin piezas</span>
              )}
            </p>
            {canCreate && (
              isDateInPast(selectedDay) ? (
                <span className="text-xs text-slate-400 italic">Día finalizado (cerrado para cargas)</span>
              ) : (
                <button
                  onClick={() => openCreate(selectedDay)}
                  className="flex items-center gap-1 text-xs text-blue-600 font-medium hover:underline"
                >
                  <Plus className="w-3 h-3" /> Agregar
                </button>
              )
            )}
          </div>
          {selectedPieces.map(piece => {
            const incompleta = canCreate && piece.origen === 'planificada' && ((piece.archivos?.length ?? 0) === 0 || !piece.copy_activo);
            return (
            <button
              key={piece.id}
              onClick={() => handlePieceClick(piece)}
              draggable={canCreate}
              onDragStart={canCreate ? e => e.dataTransfer.setData('text/piece-id', piece.id) : undefined}
              className={`w-full flex items-center gap-3 p-3 border rounded-xl text-left active:scale-[0.98] transition-transform ${incompleta ? 'bg-amber-50 border-amber-200' : getPieceCardColor(piece.estado)} ${canCreate ? 'cursor-grab active:cursor-grabbing' : ''}`}
            >
              <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center shrink-0 text-xl">
                {getTypeEmoji(piece.tipo)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{piece.nombre}</p>
                <p className="text-xs text-slate-500 mt-0.5 capitalize">
                  {CONTENT_TYPE_LABELS[piece.tipo]}
                </p>
              </div>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/60 shrink-0 ${
                piece.estado === 'publicado' ? 'text-emerald-700' :
                piece.estado === 'aprobado_cliente' || piece.estado === 'aprobado_final' ? 'text-blue-700' :
                piece.estado === 'cambios_solicitados' ? 'text-orange-700' :
                piece.estado === 'enviado_cliente' || piece.estado === 'en_revision_cliente' ? 'text-amber-700' :
                'text-slate-500'
              }`}>
                {incompleta ? '🟡 Pendiente de completar' : getPieceStateLabel(piece.estado, !canCreate)}
              </span>
              {incompleta && (
                <span
                  onClick={e => { e.stopPropagation(); setCompletingPiece(piece); }}
                  className="text-[10px] font-bold bg-violet-600 text-white px-2 py-1 rounded-lg shrink-0 hover:bg-violet-700"
                >
                  Completar contenido
                </span>
              )}
            </button>
            );
          })}
        </div>
      )}

      {/* All pieces this month (when no day selected) */}
      {selectedDay == null && (
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-3">
            {totalThisMonth.length > 0 ? 'Piezas este mes' : 'Sin piezas este mes'}
          </p>
          {totalThisMonth.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <p className="text-sm">No hay piezas programadas para {MONTHS_ES[month].toLowerCase()}.</p>
              {canCreate && (
                <button
                  onClick={() => openCreate(today.getDate())}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs text-blue-600 font-medium hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Crear primera pieza
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {totalThisMonth
                .sort((a, b) => new Date(a.fecha_publicacion!).getTime() - new Date(b.fecha_publicacion!).getTime())
                .map(piece => {
                  const d = new Date(piece.fecha_publicacion!);
                  return (
                    <button
                      key={piece.id}
                      onClick={() => handlePieceClick(piece)}
                      draggable={canCreate}
                      onDragStart={canCreate ? e => e.dataTransfer.setData('text/piece-id', piece.id) : undefined}
                      className={`w-full flex items-center gap-3 p-3 border rounded-xl text-left active:scale-[0.98] transition-transform ${getPieceCardColor(piece.estado)} ${canCreate ? 'cursor-grab active:cursor-grabbing' : ''}`}
                    >
                      <div className="text-center shrink-0 w-9">
                        <p className="text-lg font-bold text-slate-700 leading-none">{d.getDate()}</p>
                        <p className="text-[10px] text-slate-400 uppercase">{MONTHS_ES[d.getMonth()].slice(0, 3)}</p>
                      </div>
                      <div className="w-px h-8 bg-slate-200 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{piece.nombre}</p>
                        <p className="text-xs text-slate-400 mt-0.5 capitalize">
                          {getTypeEmoji(piece.tipo)} {CONTENT_TYPE_LABELS[piece.tipo]}
                        </p>
                      </div>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/60 shrink-0 ${
                        piece.estado === 'publicado' ? 'text-emerald-700' :
                        piece.estado === 'aprobado_cliente' || piece.estado === 'aprobado_final' ? 'text-blue-700' :
                        piece.estado === 'cambios_solicitados' ? 'text-orange-700' :
                        piece.estado === 'enviado_cliente' || piece.estado === 'en_revision_cliente' ? 'text-amber-700' :
                        'text-slate-500'
                      }`}>
                        {getPieceStateLabel(piece.estado, !canCreate)}
                      </span>
                    </button>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Flujo Completar contenido: de planificación a producción */}
      {completingPiece && (
        <CompletePieceModal
          piece={completingPiece}
          onClose={() => setCompletingPiece(null)}
        />
      )}

      {/* Planner modal */}
      {showPlanner && client && (
        <PlanCronopostModal
          client={client}
          initialYear={year}
          initialMonth={month}
          onApplied={(y, m) => { setYear(y); setMonth(m); setSelectedDay(null); }}
          onClose={() => setShowPlanner(false)}
        />
      )}

      {/* Create modal */}
      {createDate && (
        <NewPieceModal
          clientId={clientId}
          clientNombre={clientNombre}
          defaultDate={createDate}
          onClose={() => setCreateDate(null)}
        />
      )}
    </div>
  );
}
