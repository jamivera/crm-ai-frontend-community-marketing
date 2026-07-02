import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFplusStore } from '../../store';
import { PLATFORM_LABELS } from '../../constants';
import { PlatformIcon } from '../../components/ui/PlatformIcon';
import type { Publication } from '../../types';

type ViewMode = 'mes' | 'semana';

const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const PUB_STATE_COLORS: Record<Publication['estado'], string> = {
  planificada: 'bg-blue-500',
  publicada: 'bg-emerald-500',
  sin_confirmar: 'bg-amber-400',
  cancelada: 'bg-slate-300',
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarView() {
  const navigate = useNavigate();
  const today = new Date();
  const [viewMode, setViewMode] = useState<ViewMode>('mes');
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
    setSelectedDay(null);
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const publications = useFplusStore(s => s.publications);
  const contentPieces = useFplusStore(s => s.contentPieces);

  // Map day → publications
  const pubsByDay = new Map<number, Publication[]>();
  publications.forEach(pub => {
    const d = new Date(pub.fecha_programada);
    if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
      const day = d.getDate();
      if (!pubsByDay.has(day)) pubsByDay.set(day, []);
      pubsByDay.get(day)!.push(pub);
    }
  });

  // Selected day publications
  const selectedPubs = selectedDay != null ? (pubsByDay.get(selectedDay) ?? []) : [];

  const isToday = (day: number) =>
    today.getFullYear() === currentYear &&
    today.getMonth() === currentMonth &&
    today.getDate() === day;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Calendario</h1>
          <p className="text-sm text-slate-500 mt-0.5">Publicaciones programadas</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 gap-0.5">
            {(['mes', 'semana'] as const).map(v => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
                  viewMode === v ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 flex-wrap">
        {Object.entries({ planificada: 'Planificada', publicada: 'Publicada', sin_confirmar: 'Sin confirmar', cancelada: 'Cancelada' }).map(([k, label]) => (
          <div key={k} className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className={`w-2.5 h-2.5 rounded-full ${PUB_STATE_COLORS[k as Publication['estado']]}`} />
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {/* Nav */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <button onClick={prevMonth} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>
          <h2 className="font-semibold text-slate-800">
            {MONTHS_ES[currentMonth]} {currentYear}
          </h2>
          <button onClick={nextMonth} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-slate-100">
          {DAYS_ES.map(d => (
            <div key={d} className="py-2 text-center text-xs font-medium text-slate-400">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {/* Empty cells before first day */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[80px] border-b border-r border-slate-100 bg-slate-50/50" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const pubs = pubsByDay.get(day) ?? [];
            const isSelected = selectedDay === day;
            const isTodayCell = isToday(day);

            return (
              <div
                key={day}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={`min-h-[80px] border-b border-r border-slate-100 p-1.5 cursor-pointer transition-colors ${
                  isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-end mb-1">
                  <span className={`w-6 h-6 flex items-center justify-center text-xs font-medium rounded-full ${
                    isTodayCell
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600'
                  }`}>
                    {day}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {pubs.slice(0, 3).map(pub => (
                    <div
                      key={pub.id}
                      className={`flex items-center gap-1 px-1 py-0.5 rounded text-white text-[10px] leading-none truncate ${PUB_STATE_COLORS[pub.estado]}`}
                      title={pub.content_piece_nombre}
                    >
                      <span className="shrink-0">
                        <PlatformIcon platform={pub.plataforma} size={8} />
                      </span>
                      <span className="truncate">{pub.content_piece_nombre}</span>
                    </div>
                  ))}
                  {pubs.length > 3 && (
                    <div className="text-[10px] text-slate-400 text-center">+{pubs.length - 3} más</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day detail panel */}
      {selectedDay != null && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="font-semibold text-slate-800 mb-4">
            {selectedDay} de {MONTHS_ES[currentMonth]}
            <span className="ml-2 text-sm font-normal text-slate-400">({selectedPubs.length} publicaciones)</span>
          </h3>
          {selectedPubs.length === 0 ? (
            <div className="flex items-center gap-3 py-4 text-sm text-slate-400">
              <Calendar className="w-5 h-5 opacity-40" />
              No hay publicaciones programadas para este día.
            </div>
          ) : (
            <div className="space-y-3">
              {selectedPubs.map(pub => {
                const piece = contentPieces.find(cp => cp.id === pub.content_piece_id);
                const hora = new Date(pub.fecha_programada).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
                return (
                  <div
                    key={pub.id}
                    className="flex items-center gap-4 p-3 border border-slate-100 rounded-lg hover:border-blue-200 cursor-pointer transition-colors"
                    onClick={() => piece && navigate(`/fplus/content/${piece.id}`)}
                  >
                    <div className={`w-2 h-10 rounded-full shrink-0 ${PUB_STATE_COLORS[pub.estado]}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{pub.content_piece_nombre}</p>
                      <p className="text-xs text-slate-500">{pub.client_nombre}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 text-xs text-slate-500 justify-end mb-0.5">
                        <PlatformIcon platform={pub.plataforma} size={12} />
                        <span>{PLATFORM_LABELS[pub.plataforma]}</span>
                      </div>
                      <p className="text-xs font-medium text-slate-700">{hora}</p>
                    </div>
                    <PubStateDot estado={pub.estado} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const PUB_STATE_DOT_LABELS: Record<Publication['estado'], string> = {
  planificada: 'Planificada',
  publicada: 'Publicada',
  sin_confirmar: 'Sin confirmar',
  cancelada: 'Cancelada',
};
function PubStateDot({ estado }: { estado: Publication['estado'] }) {
  const colors: Record<Publication['estado'], string> = {
    planificada: 'bg-blue-100 text-blue-700',
    publicada: 'bg-emerald-100 text-emerald-700',
    sin_confirmar: 'bg-amber-100 text-amber-700',
    cancelada: 'bg-slate-100 text-slate-500',
  };
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${colors[estado]}`}>
      {PUB_STATE_DOT_LABELS[estado]}
    </span>
  );
}
