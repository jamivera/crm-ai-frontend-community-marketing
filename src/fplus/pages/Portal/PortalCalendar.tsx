import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockPublications } from '../../mock';
import { PLATFORM_LABELS } from '../../constants';
import { PlatformIcon } from '../../components/ui/PlatformIcon';
import type { Publication } from '../../types';

const PORTAL_CLIENT_ID = '1';
const DAYS_ES = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const PUB_DOT: Record<Publication['estado'], string> = {
  planificada: 'bg-blue-400',
  publicada: 'bg-emerald-500',
  sin_confirmar: 'bg-amber-400',
  cancelada: 'bg-slate-300',
};

const PUB_CARD_COLORS: Record<Publication['estado'], string> = {
  planificada: 'bg-blue-50 border-blue-100',
  publicada: 'bg-emerald-50 border-emerald-100',
  sin_confirmar: 'bg-amber-50 border-amber-100',
  cancelada: 'bg-slate-50 border-slate-100',
};
const PUB_STATE_LABELS: Record<Publication['estado'], string> = {
  planificada: 'Programada',
  publicada: 'Publicada',
  sin_confirmar: 'Sin confirmar',
  cancelada: 'Cancelada',
};

export default function PortalCalendar() {
  const navigate = useNavigate();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const publications = mockPublications.filter(p => p.client_id === PORTAL_CLIENT_ID);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const pubsByDay = new Map<number, Publication[]>();
  publications.forEach(pub => {
    const d = new Date(pub.fecha_programada);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!pubsByDay.has(day)) pubsByDay.set(day, []);
      pubsByDay.get(day)!.push(pub);
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

  const selectedPubs = selectedDay != null ? (pubsByDay.get(selectedDay) ?? []) : [];

  const totalThisMonth = publications.filter(p => {
    const d = new Date(p.fecha_programada);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  return (
    <div className="px-4 pt-5 pb-6 space-y-4">
      <div>
        <h1 className="text-lg font-bold text-slate-800">Calendario</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          {totalThisMonth.length} publicaciones este mes
        </p>
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

        {/* Day names */}
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
            const pubs = pubsByDay.get(day) ?? [];
            const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
            const isSelected = selectedDay === day;

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={`aspect-square flex flex-col items-center justify-start pt-1 rounded-xl transition-all active:scale-95 ${
                  isSelected ? 'bg-blue-600' : isToday ? 'bg-blue-50' : 'hover:bg-slate-50'
                }`}
              >
                <span className={`text-xs font-medium leading-none ${
                  isSelected ? 'text-white' : isToday ? 'text-blue-600 font-bold' : 'text-slate-700'
                }`}>
                  {day}
                </span>
                {pubs.length > 0 && (
                  <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                    {pubs.slice(0, 3).map((pub, idx) => (
                      <span
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/70' : PUB_DOT[pub.estado]}`}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-3 flex-wrap">
        {Object.entries(PUB_STATE_LABELS).map(([k, label]) => (
          <div key={k} className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className={`w-2 h-2 rounded-full ${PUB_DOT[k as Publication['estado']]}`} />
            {label}
          </div>
        ))}
      </div>

      {/* Day detail */}
      {selectedDay != null && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-700">
            {selectedDay} de {MONTHS_ES[month]}
            {selectedPubs.length === 0 && (
              <span className="font-normal text-slate-400"> — sin publicaciones</span>
            )}
          </p>
          {selectedPubs.map(pub => (
            <div
              key={pub.id}
              className={`flex items-center gap-3 p-3 border rounded-xl ${PUB_CARD_COLORS[pub.estado]}`}
            >
              <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center shrink-0">
                <PlatformIcon platform={pub.plataforma} size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{pub.content_piece_nombre}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {PLATFORM_LABELS[pub.plataforma]} ·{' '}
                  {new Date(pub.fecha_programada).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/60 ${
                pub.estado === 'publicada' ? 'text-emerald-700' :
                pub.estado === 'planificada' ? 'text-blue-700' :
                pub.estado === 'sin_confirmar' ? 'text-amber-700' : 'text-slate-500'
              }`}>
                {PUB_STATE_LABELS[pub.estado]}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Upcoming list if no day selected */}
      {selectedDay == null && (
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-3">Próximas publicaciones</p>
          {totalThisMonth.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No hay publicaciones este mes.</p>
          ) : (
            <div className="space-y-2">
              {totalThisMonth
                .sort((a, b) => new Date(a.fecha_programada).getTime() - new Date(b.fecha_programada).getTime())
                .map(pub => {
                  const d = new Date(pub.fecha_programada);
                  return (
                    <div key={pub.id} className={`flex items-center gap-3 p-3 border rounded-xl ${PUB_CARD_COLORS[pub.estado]}`}>
                      <div className="text-center shrink-0 w-9">
                        <p className="text-lg font-bold text-slate-700 leading-none">{d.getDate()}</p>
                        <p className="text-[10px] text-slate-400 uppercase">{MONTHS_ES[d.getMonth()].slice(0, 3)}</p>
                      </div>
                      <div className="w-px h-8 bg-slate-200 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{pub.content_piece_nombre}</p>
                        <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                          <PlatformIcon platform={pub.plataforma} size={10} />
                          <span>{PLATFORM_LABELS[pub.plataforma]}</span>
                        </div>
                      </div>
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
