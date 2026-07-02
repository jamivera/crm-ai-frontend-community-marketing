import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePortalContext } from './PortalContext';
import { useFplusStore } from '../../store';
import { CONTENT_TYPE_LABELS } from '../../constants';
import { NewPieceModal } from '../../components/modals/NewPieceModal';
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

function getPieceDot(estado: ContentState): string {
  if (estado === 'publicado') return 'bg-emerald-500';
  if (estado === 'aprobado_cliente' || estado === 'aprobado_final') return 'bg-blue-400';
  if (estado === 'cambios_solicitados') return 'bg-orange-400';
  if (estado === 'enviado_cliente' || estado === 'en_revision_cliente') return 'bg-amber-400';
  if (estado === 'en_produccion') return 'bg-violet-400';
  return 'bg-slate-300';
}

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
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [createDate, setCreateDate] = useState<string | null>(null);

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

  const LEGEND = [
    { dot: 'bg-slate-300',    label: 'Borrador' },
    { dot: 'bg-violet-400',   label: 'Producción' },
    { dot: 'bg-amber-400',    label: 'Por aprobar' },
    { dot: 'bg-orange-400',   label: 'Con cambios' },
    { dot: 'bg-blue-400',     label: 'Aprobado' },
    { dot: 'bg-emerald-500',  label: 'Publicado' },
  ];

  const visibleLegend = canCreate ? LEGEND : LEGEND.slice(2);

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
          <button
            onClick={() => openCreate(today.getDate())}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Nueva pieza
          </button>
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

        {/* Days */}
        <div className="grid grid-cols-7 p-2 gap-0.5">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`e${i}`} className="aspect-square" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayPieces = piecesByDay.get(day) ?? [];
            const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
            const isSelected = selectedDay === day;

            return (
              <div key={day} className="aspect-square relative group">
                <button
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={`w-full h-full flex flex-col items-center justify-start pt-1 rounded-xl transition-all active:scale-95 ${
                    isSelected ? 'bg-blue-600' : isToday ? 'bg-blue-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <span className={`text-xs font-medium leading-none ${
                    isSelected ? 'text-white' : isToday ? 'text-blue-600 font-bold' : 'text-slate-700'
                  }`}>
                    {day}
                  </span>
                  {dayPieces.length > 0 && (
                    <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                      {dayPieces.slice(0, 3).map((piece, idx) => (
                        <span
                          key={idx}
                          className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/70' : getPieceDot(piece.estado)}`}
                        />
                      ))}
                      {dayPieces.length > 3 && (
                        <span className={`text-[8px] leading-none ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>
                          +{dayPieces.length - 3}
                        </span>
                      )}
                    </div>
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
              className={`w-full flex items-center gap-3 p-3 border rounded-xl text-left active:scale-[0.98] transition-transform ${getPieceCardColor(piece.estado)}`}
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
                      className={`w-full flex items-center gap-3 p-3 border rounded-xl text-left active:scale-[0.98] transition-transform ${getPieceCardColor(piece.estado)}`}
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
