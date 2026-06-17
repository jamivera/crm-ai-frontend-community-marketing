import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Clock, Send, ImageIcon, ArrowRight } from 'lucide-react';
import { usePortalContext } from './PortalContext';
import { useFplusStore } from '../../store';
import { CONTENT_STATE_LABELS, PLATFORM_LABELS } from '../../constants';
import { PlatformIcon } from '../../components/ui/PlatformIcon';
import type { ContentState } from '../../types';

type PortalBucket = 'pending' | 'changes' | 'approved' | 'published';

function classifyState(state: ContentState): PortalBucket | null {
  if (state === 'enviado_cliente' || state === 'en_revision_cliente') return 'pending';
  if (state === 'cambios_solicitados') return 'changes';
  if (state === 'aprobado_final' || state === 'aprobado_cliente') return 'approved';
  if (state === 'publicado') return 'published';
  return null;
}

export default function PortalDashboard() {
  const navigate = useNavigate();
  const { clientId, clientNombre } = usePortalContext();
  const contentPieces = useFplusStore(s => s.contentPieces);
  const publications = useFplusStore(s => s.publications);

  const pieces = contentPieces.filter(cp => cp.client_id === clientId);
  const clientPubs = publications.filter(p => p.client_id === clientId);

  const pending = pieces.filter(cp => classifyState(cp.estado) === 'pending');
  const changes = pieces.filter(cp => classifyState(cp.estado) === 'changes');
  const approved = pieces.filter(cp => classifyState(cp.estado) === 'approved');
  const published = pieces.filter(cp => classifyState(cp.estado) === 'published');

  const upcomingPubs = clientPubs
    .filter(p => p.estado === 'planificada' && new Date(p.fecha_programada) > new Date())
    .sort((a, b) => new Date(a.fecha_programada).getTime() - new Date(b.fecha_programada).getTime())
    .slice(0, 3);

  const hora = new Date().getHours();
  const greeting = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div className="px-4 pt-5 pb-4 space-y-5">
      <div>
        <p className="text-xs text-slate-400">{greeting}</p>
        <h1 className="text-xl font-bold text-slate-800">{clientNombre} 👋</h1>
      </div>

      {pending.length > 0 && (
        <button
          onClick={() => navigate('approvals')}
          className="w-full flex items-center gap-3 p-4 bg-blue-600 text-white rounded-2xl shadow-md shadow-blue-200 active:scale-[0.98] transition-transform text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">
              {pending.length} {pending.length === 1 ? 'pieza esperando' : 'piezas esperando'} tu aprobación
            </p>
            <p className="text-xs text-blue-100 mt-0.5">Toca para revisar ahora</p>
          </div>
          <ArrowRight className="w-4 h-4 shrink-0 text-blue-200" />
        </button>
      )}

      <div className="grid grid-cols-4 gap-2">
        <StatChip icon={<Clock className="w-4 h-4" />} label="Pendiente" count={pending.length} colorClass="bg-amber-50 text-amber-700 border-amber-200" onClick={() => navigate('approvals')} />
        <StatChip icon={<Send className="w-4 h-4" />} label="Cambios" count={changes.length} colorClass="bg-orange-50 text-orange-700 border-orange-200" onClick={() => navigate('cronopost')} />
        <StatChip icon={<CheckCircle2 className="w-4 h-4" />} label="Aprobado" count={approved.length} colorClass="bg-emerald-50 text-emerald-700 border-emerald-200" onClick={() => navigate('cronopost')} />
        <StatChip icon={<ImageIcon className="w-4 h-4" />} label="Publicado" count={published.length} colorClass="bg-blue-50 text-blue-700 border-blue-200" onClick={() => navigate('multimedia')} />
      </div>

      {upcomingPubs.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700">Próximas publicaciones</h2>
            <button onClick={() => navigate('calendar')} className="text-xs text-blue-600 hover:underline">Ver calendario</button>
          </div>
          <div className="space-y-2">
            {upcomingPubs.map(pub => {
              const d = new Date(pub.fecha_programada);
              return (
                <div key={pub.id} className="flex items-center gap-3 bg-white border border-slate-100 rounded-xl p-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <PlatformIcon platform={pub.plataforma} size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{pub.content_piece_nombre}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{PLATFORM_LABELS[pub.plataforma]}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium text-slate-700 capitalize">
                      {d.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                    <p className="text-xs text-slate-400">
                      {d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {approved.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700">Últimas aprobadas</h2>
            <button onClick={() => navigate('cronopost')} className="text-xs text-blue-600 hover:underline">Ver todas</button>
          </div>
          <div className="space-y-2">
            {approved.slice(0, 2).map(cp => (
              <div
                key={cp.id}
                onClick={() => navigate(`approvals/${cp.id}`)}
                className="flex items-center gap-3 bg-white border border-slate-100 rounded-xl p-3 cursor-pointer active:bg-slate-50"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{cp.nombre}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{cp.tipo.replace(/_/g, ' ')}</p>
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full shrink-0">
                  {CONTENT_STATE_LABELS[cp.estado]}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {pending.length === 0 && changes.length === 0 && approved.length === 0 && (
        <div className="text-center py-10 text-slate-400">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Todo al día por aquí 🎉</p>
        </div>
      )}
    </div>
  );
}

function StatChip({ icon, label, count, colorClass, onClick }: {
  icon: React.ReactNode; label: string; count: number;
  colorClass: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center active:scale-95 transition-transform ${colorClass}`}
    >
      {icon}
      <span className="text-lg font-bold leading-none">{count}</span>
      <span className="text-[10px] leading-none">{label}</span>
    </button>
  );
}
