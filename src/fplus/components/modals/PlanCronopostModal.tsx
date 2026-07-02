import { useMemo, useState } from 'react';
import { X, Sparkles, CalendarDays, Trash2, RefreshCw, Info, PartyPopper, Plus } from 'lucide-react';
import { useFplusStore } from '../../store';
import { generatePlan, type ProposedPiece } from '../../utils/cronoplanner';
import { CONTENT_TYPE_LABELS, PLATFORM_LABELS } from '../../constants';
import { PlatformIcon } from '../ui/PlatformIcon';
import type { Client, ContentPiece, ContentType, MarketingObjective, Platform } from '../../types';

interface Props {
  client: Client;
  onClose: () => void;
}

const OBJETIVOS: { value: MarketingObjective; label: string; emoji: string }[] = [
  { value: 'alcance',     label: 'Alcance',     emoji: '📣' },
  { value: 'conversion',  label: 'Conversión',  emoji: '🎯' },
  { value: 'comunidad',   label: 'Comunidad',   emoji: '🤝' },
  { value: 'lanzamiento', label: 'Lanzamiento', emoji: '🚀' },
];

const MONTHS_LONG = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const TYPE_EMOJI: Record<string, string> = {
  reel: '🎬', carrusel: '🖼️', historia: '📱', historia_video: '📱',
  post_imagen: '🖼️', post_video: '🎥', tiktok: '🎵',
};

const EDITABLE_TYPES: ContentType[] = ['reel', 'carrusel', 'historia', 'post_imagen', 'post_video', 'tiktok'];

export function PlanCronopostModal({ client, onClose }: Props) {
  const createManyContent = useFplusStore(s => s.createManyContent);

  const now = new Date();
  const defaultMonth = now.getMonth() === 11 ? 0 : now.getMonth() + 1;
  const defaultYear = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();

  const [year, setYear] = useState(defaultYear);
  const [month, setMonth] = useState(defaultMonth);
  const [objetivo, setObjetivo] = useState<MarketingObjective>(client.objetivo_marketing ?? 'alcance');
  const [seed, setSeed] = useState(0); // fuerza regeneración
  const [pieces, setPieces] = useState<ProposedPiece[] | null>(null);

  const plan = useMemo(
    () => generatePlan({ client, year, month, objetivo }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [client, year, month, objetivo, seed],
  );
  const current = pieces ?? plan.pieces;

  const totalContrato = client.piezas_mensuales ?? 0;
  const redes = client.redes_contratadas ?? ['instagram'];

  // Agrupar por semana del mes para la vista previa
  const weeks = useMemo(() => {
    const map = new Map<number, ProposedPiece[]>();
    current.forEach(p => {
      const day = parseInt(p.fecha.slice(8));
      const w = Math.floor((day - 1) / 7);
      if (!map.has(w)) map.set(w, []);
      map.get(w)!.push(p);
    });
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [current]);

  const updatePiece = (tempId: string, data: Partial<ProposedPiece>) => {
    setPieces((pieces ?? plan.pieces).map(p => (p.tempId === tempId ? { ...p, ...data } : p)));
  };

  const removePiece = (tempId: string) => {
    setPieces((pieces ?? plan.pieces).filter(p => p.tempId !== tempId));
  };

  const addPiece = (extraordinaria = false, fecha?: string) => {
    const base = pieces ?? plan.pieces;
    const nueva: ProposedPiece = {
      tempId: `prop-extra-${Date.now()}`,
      tipo: 'post_imagen',
      fecha: fecha ?? `${year}-${String(month + 1).padStart(2, '0')}-15`,
      hora: '12:00',
      plataforma: redes[0] ?? 'instagram',
      razon_estrategica: extraordinaria
        ? 'Publicación extraordinaria agregada manualmente.'
        : 'Pieza agregada manualmente por el estratega.',
      evento: undefined,
    };
    if (extraordinaria) (nueva as ProposedPiece & { extraordinaria?: boolean }).extraordinaria = true;
    setPieces([...base, nueva].sort((a, b) => a.fecha.localeCompare(b.fecha)));
  };

  const regenerate = () => {
    setPieces(null);
    setSeed(s => s + 1);
  };

  const apply = () => {
    const nowIso = new Date().toISOString();
    const newPieces: ContentPiece[] = current.map((p, i) => {
      const isExtra = (p as ProposedPiece & { extraordinaria?: boolean }).extraordinaria === true;
      return {
        id: `cp-plan-${Date.now()}-${i}`,
        client_id: client.id,
        client_nombre: client.nombre,
        nombre: `${CONTENT_TYPE_LABELS[p.tipo]} ${MONTHS_LONG[month]} — ${p.fecha.slice(8)}/${month + 1}`,
        tipo: p.tipo,
        incluye_cta: false,
        estado: 'borrador',
        account_manager_id: client.account_manager_id,
        account_manager_nombre: client.account_manager_name,
        fecha_publicacion: `${p.fecha}T${p.hora}:00`,
        plataforma: p.plataforma,
        iteraciones: 0,
        max_iteraciones: 3,
        archivos: [],
        hashtags: [],
        origen: isExtra ? 'extraordinaria' : 'planificada',
        razon_estrategica: p.razon_estrategica,
        created_at: nowIso,
        updated_at: nowIso,
      };
    });
    createManyContent(newPieces);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-blue-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Planificación Inteligente del Cronopost</h2>
              <p className="text-[11px] text-slate-400">El sistema propone, tú decides — {client.nombre} · {totalContrato} piezas contratadas</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/60 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Controls */}
        <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <select
            value={`${year}-${month}`}
            onChange={e => {
              const [y, m] = e.target.value.split('-').map(Number);
              setYear(y); setMonth(m); setPieces(null);
            }}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white"
          >
            {Array.from({ length: 6 }, (_, i) => {
              const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
              return (
                <option key={i} value={`${d.getFullYear()}-${d.getMonth()}`}>
                  {MONTHS_LONG[d.getMonth()]} {d.getFullYear()}
                </option>
              );
            })}
          </select>

          <div className="flex gap-1.5">
            {OBJETIVOS.map(o => (
              <button
                key={o.value}
                onClick={() => { setObjetivo(o.value); setPieces(null); }}
                className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                  objetivo === o.value
                    ? 'border-violet-400 bg-violet-50 text-violet-700 font-semibold'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                {o.emoji} {o.label}
              </button>
            ))}
          </div>

          <button
            onClick={regenerate}
            className="ml-auto flex items-center gap-1.5 text-xs text-violet-600 font-medium hover:underline"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Regenerar
          </button>
        </div>

        {/* Alertas de eventos */}
        {plan.events.length > 0 && (
          <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-100 space-y-1">
            {plan.events.map(ev => (
              <div key={ev.id} className="flex items-center gap-2 text-xs text-amber-800">
                <PartyPopper className="w-3.5 h-3.5 flex-shrink-0" />
                <span>
                  <strong>{new Date(ev.fecha + 'T12:00:00').getDate()} {MONTHS_LONG[month].slice(0,3)}</strong> — {ev.nombre}:
                  {' '}oportunidad para una publicación especial.
                </span>
                <button
                  onClick={() => addPiece(true, ev.fecha)}
                  className="ml-auto flex items-center gap-1 text-[10px] font-semibold bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded-full flex-shrink-0"
                >
                  <Plus className="w-3 h-3" /> Agregar extra
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Propuesta por semanas */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {weeks.map(([w, wpieces]) => (
            <div key={w}>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Semana {w + 1}</h3>
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-[10px] text-slate-400">{wpieces.length} piezas</span>
              </div>
              <div className="space-y-1.5">
                {wpieces.map(p => {
                  const isExtra = (p as ProposedPiece & { extraordinaria?: boolean }).extraordinaria === true;
                  return (
                    <div
                      key={p.tempId}
                      className={`flex items-start gap-3 p-2.5 rounded-xl border ${
                        p.evento ? 'border-amber-200 bg-amber-50/50' : isExtra ? 'border-violet-200 bg-violet-50/50' : 'border-slate-100 bg-slate-50/50'
                      }`}
                    >
                      <span className="text-xl mt-0.5">{TYPE_EMOJI[p.tipo] ?? '📄'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="date"
                            value={p.fecha}
                            onChange={e => updatePiece(p.tempId, { fecha: e.target.value })}
                            className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white"
                          />
                          <input
                            type="time"
                            value={p.hora}
                            onChange={e => updatePiece(p.tempId, { hora: e.target.value })}
                            className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white"
                          />
                          <select
                            value={p.tipo}
                            onChange={e => updatePiece(p.tempId, { tipo: e.target.value as ContentType })}
                            className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white"
                          >
                            {EDITABLE_TYPES.map(t => (
                              <option key={t} value={t}>{CONTENT_TYPE_LABELS[t]}</option>
                            ))}
                          </select>
                          <select
                            value={p.plataforma}
                            onChange={e => updatePiece(p.tempId, { plataforma: e.target.value as Platform })}
                            className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white"
                          >
                            {redes.map(r => (
                              <option key={r} value={r}>{PLATFORM_LABELS[r]}</option>
                            ))}
                          </select>
                          {isExtra && (
                            <span className="text-[9px] font-bold bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full">⚡ EXTRA</span>
                          )}
                          {p.evento && (
                            <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">🎉 {p.evento.nombre}</span>
                          )}
                        </div>
                        <p className="flex items-start gap-1 text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                          <Info className="w-3 h-3 flex-shrink-0 mt-px" />
                          {p.razon_estrategica}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <PlatformIcon platform={p.plataforma} size="sm" />
                        <button
                          onClick={() => removePiece(p.tempId)}
                          className="p-1 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <button
            onClick={() => addPiece(false)}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-xs text-slate-400 hover:border-blue-300 hover:text-blue-500 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Agregar pieza manual
          </button>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 flex items-center gap-3 bg-slate-50">
          <div className="text-[11px] text-slate-500">
            <strong className="text-slate-700">{current.length}</strong> piezas propuestas
            {totalContrato > 0 && (
              <span className={current.filter(p => !(p as ProposedPiece & { extraordinaria?: boolean }).extraordinaria).length === totalContrato ? ' text-emerald-600' : ' text-amber-600'}>
                {' '}· contrato: {totalContrato}
              </span>
            )}
            {plan.emptyDays.length > 0 && (
              <span className="text-slate-400"> · {plan.emptyDays.length} días sin publicación (estrategia)</span>
            )}
          </div>
          <div className="ml-auto flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-xl"
            >
              Descartar
            </button>
            <button
              onClick={apply}
              disabled={current.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Aplicar propuesta ({current.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
