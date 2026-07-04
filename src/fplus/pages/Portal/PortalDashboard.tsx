import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle, CheckCircle2, Clock, RotateCcw,
  ImageIcon, ArrowRight, MessageSquare, Calendar,
  TrendingUp, LayoutGrid,
} from 'lucide-react';
import { usePortalContext } from './PortalContext';
import { useFplusStore } from '../../store';
import { PLATFORM_LABELS, CONTENT_TYPE_LABELS } from '../../constants';
import { PlatformIcon } from '../../components/ui/PlatformIcon';

function getTypeEmoji(tipo: string): string {
  const m: Record<string, string> = {
    reel: '🎬', carrusel: '🖼️', historia: '📱', historia_video: '📱',
    post_imagen: '🖼️', post_video: '🎥', tiktok: '🎵',
  };
  return m[tipo] ?? '📄';
}

export default function PortalDashboard() {
  const navigate = useNavigate();
  const { clientId, clientNombre } = usePortalContext();
  const contentPieces = useFplusStore(s => s.contentPieces);
  const portalComments = useFplusStore(s => s.portalComments);
  const client = useFplusStore(s => s.clients.find(c => c.id === clientId));
  const stateHistory = useFplusStore(s => s.stateHistory);

  const pieces = contentPieces.filter(cp => cp.client_id === clientId);

  // ── KPI counts ────────────────────────────────────────────────────────────
  const planificadas = pieces.length;
  const aprobadas = pieces.filter(cp =>
    cp.estado === 'aprobado_cliente' || cp.estado === 'aprobado_final'
  ).length;
  const publicadas = pieces.filter(cp => cp.estado === 'publicado').length;
  const pendientes = pieces.filter(cp =>
    cp.estado === 'enviado_cliente' || cp.estado === 'en_revision_cliente'
  ).length;
  const cambios = pieces.filter(cp => cp.estado === 'cambios_solicitados').length;

  const totalComments = pieces.reduce((acc, cp) => {
    return acc + (portalComments[cp.id]?.length ?? 0);
  }, 0);

  // ── Próximas publicaciones (ordenadas por fecha) ──────────────────────────
  const proximas = pieces
    .filter(cp => cp.fecha_publicacion && new Date(cp.fecha_publicacion) >= new Date())
    .sort((a, b) =>
      new Date(a.fecha_publicacion!).getTime() - new Date(b.fecha_publicacion!).getTime()
    )
    .slice(0, 4);

  // ── Métricas básicas (% aprobación, % publicación) ───────────────────────
  const pctAprobacion = planificadas > 0 ? Math.round((aprobadas + publicadas) / planificadas * 100) : 0;
  const pctPublicacion = planificadas > 0 ? Math.round(publicadas / planificadas * 100) : 0;

  const hora = new Date().getHours();
  const greeting = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';

  const MONTHS_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

  return (
    <div className="px-4 pt-5 pb-8 space-y-5">
      {/* Saludo */}
      <div>
        <p className="text-xs text-slate-400">{greeting}</p>
        <h1 className="text-xl font-bold text-slate-800">{clientNombre}</h1>
        <p className="text-xs text-slate-400 mt-0.5 capitalize">
          {new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Estado ejecutivo de la cuenta */}
      {client && (
        <div className="bg-gradient-to-r from-[#0f1e3c] to-[#1a2f56] rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-[10px] text-blue-300 uppercase tracking-wide">Plan contratado</p>
              <p className="text-lg font-bold capitalize">
                {client.plan_contratado === 'platinum' ? '💎 Platinum' :
                 client.plan_contratado === 'oro' ? '🥇 Oro' :
                 client.plan_contratado === 'plata' ? '🥈 Plata' :
                 client.plan_contratado ?? 'Personalizado'}
                {client.piezas_mensuales ? ` · ${client.piezas_mensuales} piezas/mes` : ''}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-blue-300 uppercase tracking-wide">Contrato</p>
              {client.fecha_fin_contrato ? (
                <p className="text-sm font-semibold">
                  {new Date(client.fecha_fin_contrato).getTime() > Date.now() ? 'Activo' : 'Por renovar'}
                  <span className="text-blue-300 font-normal text-xs">
                    {' · renueva '}{new Date(client.fecha_fin_contrato).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </p>
              ) : (
                <p className="text-sm font-semibold">Activo</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CTA urgente — pendientes de aprobación */}
      {pendientes > 0 && (
        <button
          onClick={() => navigate('approvals')}
          className="w-full flex items-center gap-3 p-4 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200 active:scale-[0.98] transition-transform text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">
              {pendientes} {pendientes === 1 ? 'pieza espera' : 'piezas esperan'} tu aprobación
            </p>
            <p className="text-xs text-blue-100 mt-0.5">Toca para revisar ahora</p>
          </div>
          <ArrowRight className="w-4 h-4 text-blue-200 shrink-0" />
        </button>
      )}

      {/* 6 KPIs en grid */}
      <div className="grid grid-cols-3 gap-2">
        <KpiCard
          icon={<LayoutGrid className="w-4 h-4" />}
          label="Planificadas"
          value={planificadas}
          bg="bg-slate-50" text="text-slate-700" border="border-slate-200"
          onClick={() => navigate('cronopost')}
        />
        <KpiCard
          icon={<CheckCircle2 className="w-4 h-4" />}
          label="Aprobadas"
          value={aprobadas}
          bg="bg-emerald-50" text="text-emerald-700" border="border-emerald-200"
          onClick={() => navigate('cronopost')}
        />
        <KpiCard
          icon={<ImageIcon className="w-4 h-4" />}
          label="Publicadas"
          value={publicadas}
          bg="bg-blue-50" text="text-blue-700" border="border-blue-200"
          onClick={() => navigate('multimedia')}
        />
        <KpiCard
          icon={<Clock className="w-4 h-4" />}
          label="Pendientes"
          value={pendientes}
          bg="bg-amber-50" text="text-amber-700" border="border-amber-200"
          onClick={() => navigate('approvals')}
        />
        <KpiCard
          icon={<RotateCcw className="w-4 h-4" />}
          label="Cambios"
          value={cambios}
          bg="bg-orange-50" text="text-orange-700" border="border-orange-200"
          onClick={() => navigate('approvals')}
        />
        <KpiCard
          icon={<MessageSquare className="w-4 h-4" />}
          label="Comentarios"
          value={totalComments}
          bg="bg-violet-50" text="text-violet-700" border="border-violet-200"
          onClick={() => navigate('cronopost')}
        />
      </div>

      {/* Métricas básicas */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-700">Avance del mes</h2>
        </div>
        <MetricBar label="Aprobación" pct={pctAprobacion} color="bg-emerald-500" />
        <MetricBar label="Publicación" pct={pctPublicacion} color="bg-blue-500" />
      </div>

      {/* Próximas publicaciones */}
      {proximas.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-700">Próximas publicaciones</h2>
            </div>
            <button
              onClick={() => navigate('calendar')}
              className="text-xs text-blue-600 font-medium"
            >
              Ver calendario →
            </button>
          </div>
          <div className="space-y-2">
            {proximas.map(cp => {
              const d = new Date(cp.fecha_publicacion!);
              return (
                <button
                  key={cp.id}
                  onClick={() => navigate(`approvals/${cp.id}`)}
                  className="w-full flex items-center gap-3 bg-white border border-slate-100 rounded-xl p-3 text-left active:bg-slate-50 transition-colors"
                >
                  <div className="text-center shrink-0 w-10">
                    <p className="text-base font-bold text-slate-700 leading-none">{d.getDate()}</p>
                    <p className="text-[10px] text-slate-400 uppercase">{MONTHS_ES[d.getMonth()]}</p>
                  </div>
                  <div className="w-px h-8 bg-slate-100 shrink-0" />
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 text-sm">
                    {getTypeEmoji(cp.tipo)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{cp.nombre}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {cp.plataforma && <PlatformIcon platform={cp.plataforma} size={10} />}
                      <p className="text-xs text-slate-400 capitalize">
                        {cp.plataforma ? PLATFORM_LABELS[cp.plataforma] : ''} · {CONTENT_TYPE_LABELS[cp.tipo]}
                      </p>
                    </div>
                  </div>
                  <StateChip estado={cp.estado} />
                </button>
              );
            })}
          </div>
        </section>
      )}

      {planificadas === 0 && (
        <div className="text-center py-10 text-slate-400">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No hay piezas planificadas aún.</p>
        </div>
      )}

      {/* Actividad reciente — historial de estados de las piezas del cliente */}
      {(() => {
        const pieceIds = new Set(pieces.map(p => p.id));
        const actividad = stateHistory
          .filter(h => pieceIds.has(h.content_piece_id))
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 5);
        if (actividad.length === 0) return null;
        return (
          <section>
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Actividad reciente</h2>
            <div className="bg-white border border-slate-100 rounded-2xl divide-y divide-slate-50">
              {actividad.map(h => {
                const pieza = pieces.find(p => p.id === h.content_piece_id);
                return (
                  <div key={h.id} className="flex items-center gap-3 px-4 py-2.5">
                    <Clock className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-600 truncate">
                        <span className="font-semibold">{pieza?.nombre ?? 'Pieza'}</span>
                        {' '}pasó a <StateChip estado={h.estado_nuevo} />
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {new Date(h.timestamp).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })()}
    </div>
  );
}

function KpiCard({ icon, label, value, bg, text, border, onClick }: {
  icon: React.ReactNode; label: string; value: number;
  bg: string; text: string; border: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center active:scale-95 transition-transform ${bg} ${text} ${border}`}
    >
      {icon}
      <span className="text-2xl font-bold leading-none">{value}</span>
      <span className="text-[10px] leading-none font-medium">{label}</span>
    </button>
  );
}

function MetricBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-500 mb-1">
        <span>{label}</span>
        <span className="font-semibold text-slate-700">{pct}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function StateChip({ estado }: { estado: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    publicado:          { label: 'Publicado',  cls: 'bg-blue-100 text-blue-700' },
    aprobado_final:     { label: 'Aprobado',   cls: 'bg-emerald-100 text-emerald-700' },
    aprobado_cliente:   { label: 'Aprobado',   cls: 'bg-emerald-100 text-emerald-700' },
    enviado_cliente:    { label: 'Por aprobar', cls: 'bg-amber-100 text-amber-700' },
    en_revision_cliente:{ label: 'En revisión', cls: 'bg-amber-100 text-amber-700' },
    cambios_solicitados:{ label: 'Con cambios', cls: 'bg-orange-100 text-orange-700' },
    en_produccion:      { label: 'Producción', cls: 'bg-slate-100 text-slate-600' },
    borrador:           { label: 'Borrador',   cls: 'bg-slate-100 text-slate-400' },
  };
  const s = map[estado] ?? { label: estado, cls: 'bg-slate-100 text-slate-500' };
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${s.cls}`}>
      {s.label}
    </span>
  );
}
