import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Sparkles } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePortalContext } from './PortalContext';
import { useFplusStore } from '../../store';
import { CONTENT_TYPE_LABELS, getTypeVisual } from '../../constants';
import { NewPieceModal } from '../../components/modals/NewPieceModal';
import { PlanCronopostModal } from '../../components/modals/PlanCronopostModal';
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

// States visible to the client portal (subset)
const PORTAL_VISIBLE: ContentState[] = [
  'enviado_cliente', 'en_revision_cliente', 'cambios_solicitados',
  'aprobado_cliente', 'aprobado_final', 'publicado',
];


function getPieceCardColor(estado: ContentState): string {
  if (estado === 'publicado') return 'bg-emerald-50 border-emerald-100';
  if (estado === 'aprobado_cliente' || estado === 'aprobado_final') return 'bg-blue-50 border-blue-100';
  if (estado === 'cambios_solicitados') return 'bg-orange-50 border-orange-100';
  if (estado === 'enviado_cliente' || estado === 'en_revision_cliente') return 'bg-amber-50 border-amber-100';
  return 'bg-slate-50 border-slate-100';
}

function getPieceStateLabel(estado: ContentState): string {
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
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [createDate, setCreateDate] = useState<string | null>(null);
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);
  const [showPlanner, setShowPlanner] = useState(false);

  // Eventos inteligentes del mes (feriados, fechas comerciales, sectoriales)
  const monthEvents = getMonthEvents(year, month, client?.industria ?? '', clientId);
  const eventByDay = new Map<number, string>();
  monthEvents.forEach(ev => eventByDay.set(new Date(ev.fecha + 'T12:00:00').getDate(), ev.nombre));

  // Drag & drop (solo agencia): arrastrar una pieza a otro día actualiza
  // fecha_publicacion conservando la hora — se refleja en las 3 vistas.
  const handleDropOnDay = (e: React.DragEvent, day: number) => {
    e.preventDefault();
    setDragOverDay(null);
    const pieceId = e.dataTransfer.getData('text/piece-id');
    if (!pieceId) return;
    const piece = allPieces.find(p => p.id === pieceId);
    if (!piece?.fecha_publicacion) return;
    const time = piece.fecha_publicacion.slice(10) || 'T12:00:00';
    const newDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}${time}`;
    updateContent(pieceId, { fecha_publicacion: newDate });
  };

  // In portal mode: only show client-visible states. In agency mode: show all.
  const pieces = allPieces.filter(p => {
    if (p.client_id !== clientId) return false;
    if (!p.fecha_publicacion) return false;
    if (!canCreate) return PORTAL_VISIBLE.includes(p.estado); // portal = filtered
    return true; // agency = all states
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
    // Navigate relative to current location
    if (canCreate) {
      // Agency: go to approvals tab within workspace
      const base = location.pathname.replace(/\/calendar$/, '');
      navigate(`${base}/approvals/${piece.id}`);
    } else {
      navigate(`../approvals/${piece.id}`);
    }
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
    <div className="px-4 pt-5 pb-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Calendario</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {totalThisMonth.length} {totalThisMonth.length === 1 ? 'pieza' : 'piezas'} este mes
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
              onClick={() => openCreate(today.getDate())}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Nueva pieza
            </button>
          </div>
        )}
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
                    isSelected ? 'bg-blue-600' : isToday ? 'bg-blue-50' : 'hover:bg-slate-50'
                  }`}
                >
                  {eventName && (
                    <span className="absolute top-0.5 left-0.5 text-[8px]" title={eventName}>🎉</span>
                  )}
                  <span className={`text-xs font-medium leading-none text-center mb-1 ${
                    isSelected ? 'text-white' : isToday ? 'text-blue-600 font-bold' : 'text-slate-700'
                  }`}>
                    {day}
                  </span>
                  {dayPieces.slice(0, 2).map(piece => {
                    const v = getTypeVisual(piece.tipo);
                    const file = piece.archivos.find(a => a.url && a.tipo === 'imagen');
                    return (
                      <span
                        key={piece.id}
                        title={`${piece.nombre} · ${CONTENT_TYPE_LABELS[piece.tipo]} · ${getPieceStateLabel(piece.estado)}`}
                        className={`flex items-center gap-1 rounded-md px-1 py-0.5 mb-0.5 text-left overflow-hidden ${
                          isSelected ? 'bg-white/20' : `bg-gradient-to-r ${v.gradient} border-l-2 ${v.border}`
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
                        <span className={`text-[7px] shrink-0 ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>
                          {getPieceStateLabel(piece.estado)}
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
                {canCreate && (
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
              <button
                onClick={() => openCreate(selectedDay)}
                className="flex items-center gap-1 text-xs text-blue-600 font-medium hover:underline"
              >
                <Plus className="w-3 h-3" /> Agregar
              </button>
            )}
          </div>
          {selectedPieces.map(piece => (
            <button
              key={piece.id}
              onClick={() => handlePieceClick(piece)}
              draggable={canCreate}
              onDragStart={canCreate ? e => e.dataTransfer.setData('text/piece-id', piece.id) : undefined}
              className={`w-full flex items-center gap-3 p-3 border rounded-xl text-left active:scale-[0.98] transition-transform ${getPieceCardColor(piece.estado)} ${canCreate ? 'cursor-grab active:cursor-grabbing' : ''}`}
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
                {getPieceStateLabel(piece.estado)}
              </span>
            </button>
          ))}
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
                        {getPieceStateLabel(piece.estado)}
                      </span>
                    </button>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Planner modal */}
      {showPlanner && client && (
        <PlanCronopostModal client={client} onClose={() => setShowPlanner(false)} />
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
