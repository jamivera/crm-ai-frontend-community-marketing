import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileImage, AlertOctagon, TrendingUp, DollarSign,
  Clock, ArrowRight, User,
} from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { HealthLight } from '../../components/ui/HealthLight';
import { PlatformIcon } from '../../components/ui/PlatformIcon';
import { ContentStateChip } from '../../components/ui/StateChip';
import {
  mockDashboardStats, mockClients, mockTeam,
  mockActivity, mockContent,
} from '../../mock';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

function timeAgo(ts: string) {
  try {
    return formatDistanceToNow(new Date(ts), { addSuffix: true, locale: es });
  } catch {
    return ts;
  }
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const stats = mockDashboardStats;
  const atrasadas = mockContent.filter(c =>
    c.fecha_limite && new Date(c.fecha_limite) < new Date() && c.estado !== 'publicado' && c.estado !== 'archivado'
  );
  const bloqueadas = mockContent.filter(c => c.estado === 'bloqueado');
  const sinConfirmar = 1; // from mock publications

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Resumen de operaciones — {new Date().toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <button
          onClick={() => navigate('/fplus/content')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Nueva pieza
        </button>
      </div>

      {/* Alertas prioritarias */}
      {(bloqueadas.length > 0 || atrasadas.length > 0 || sinConfirmar > 0) && (
        <div className="flex flex-wrap gap-3">
          {bloqueadas.length > 0 && (
            <button
              onClick={() => navigate('/fplus/content')}
              className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-red-100 transition-colors"
            >
              <AlertOctagon className="w-4 h-4" />
              {bloqueadas.length} pieza{bloqueadas.length > 1 ? 's' : ''} bloqueada{bloqueadas.length > 1 ? 's' : ''}
            </button>
          )}
          {atrasadas.length > 0 && (
            <button
              onClick={() => navigate('/fplus/content')}
              className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-amber-100 transition-colors"
            >
              <Clock className="w-4 h-4" />
              {atrasadas.length} pieza{atrasadas.length > 1 ? 's' : ''} atrasada{atrasadas.length > 1 ? 's' : ''}
            </button>
          )}
          {sinConfirmar > 0 && (
            <button
              onClick={() => navigate('/fplus/publications')}
              className="flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-orange-100 transition-colors"
            >
              <AlertOctagon className="w-4 h-4" />
              {sinConfirmar} publicación sin confirmar
            </button>
          )}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Piezas activas"
          value={stats.piezas_activas}
          delta={stats.piezas_activas_delta}
          icon={<FileImage className="w-4 h-4" />}
        />
        <StatCard
          label="Piezas bloqueadas"
          value={stats.piezas_bloqueadas}
          icon={<AlertOctagon className="w-4 h-4" />}
          variant={stats.piezas_bloqueadas > 0 ? 'danger' : 'default'}
        />
        <StatCard
          label="Leads hoy"
          value={stats.leads_hoy}
          delta={stats.leads_hoy_delta}
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <StatCard
          label="Revenue del mes"
          value={formatCurrency(stats.revenue_mes)}
          delta={stats.revenue_mes_delta}
          icon={<DollarSign className="w-4 h-4" />}
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Semáforo de clientes — 2/3 */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800">Semáforo de clientes</h2>
            <button
              onClick={() => navigate('/fplus/clients')}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
            >
              Ver todos <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {mockClients.map(client => (
              <button
                key={client.id}
                onClick={() => navigate(`/fplus/clients/${client.id}`)}
                className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors text-left"
              >
                <HealthLight status={client.semaforo} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900">{client.nombre}</div>
                  <div className="text-xs text-slate-500">
                    AM: {client.account_manager_nombre}
                    {client.piezas_atrasadas > 0 && (
                      <span className="ml-2 text-amber-600 font-medium">· {client.piezas_atrasadas} atrasada{client.piezas_atrasadas > 1 ? 's' : ''}</span>
                    )}
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  <div className="text-xs text-slate-600 font-medium">{client.piezas_activas} piezas</div>
                  {client.proxima_publicacion && client.proxima_publicacion_plataforma && (
                    <div className="text-xs text-slate-400 flex items-center justify-end gap-1 mt-0.5">
                      <PlatformIcon platform={client.proxima_publicacion_plataforma} />
                      {new Date(client.proxima_publicacion).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Actividad reciente — 1/3 */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800">Actividad reciente</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {mockActivity.map(event => (
              <div key={event.id} className="px-5 py-3">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-semibold flex-shrink-0">
                    {event.actor_nombre.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-700 leading-snug">
                      <span className="font-medium">{event.actor_nombre}</span>{' '}
                      {event.accion}{' '}
                      <span className="font-medium">"{event.objeto}"</span>
                      {event.cliente && <span className="text-slate-400"> · {event.cliente}</span>}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{timeAgo(event.timestamp)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Carga del equipo */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800">Carga del equipo</h2>
            <button onClick={() => navigate('/fplus/settings/team')} className="text-xs text-blue-600 hover:underline">Ver equipo</button>
          </div>
          <div className="divide-y divide-slate-100">
            {mockTeam.map(member => {
              const pct = Math.min(100, (member.piezas_activas / 15) * 100);
              const overloaded = member.piezas_activas >= 12;
              return (
                <div key={member.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-semibold flex-shrink-0">
                    {member.nombre.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-slate-800 truncate">{member.nombre}</span>
                      <span className={`text-xs font-semibold ml-2 flex-shrink-0 ${overloaded ? 'text-red-600' : 'text-slate-500'}`}>
                        {member.piezas_activas} piezas {overloaded && '⚠'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${overloaded ? 'bg-red-500' : 'bg-blue-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Piezas activas recientes */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800">Piezas activas recientes</h2>
            <button onClick={() => navigate('/fplus/content')} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              Ver todas <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {mockContent.slice(0, 5).map(piece => {
              const isOverdue = piece.fecha_limite && new Date(piece.fecha_limite) < new Date();
              return (
                <button
                  key={piece.id}
                  onClick={() => navigate(`/fplus/content/${piece.id}`)}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-400">
                    <FileImage className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-slate-800 truncate">{piece.nombre}</div>
                    <div className="text-[11px] text-slate-400">{piece.client_nombre}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <ContentStateChip state={piece.estado} size="sm" />
                    {piece.fecha_limite && (
                      <span className={`text-[10px] ${isOverdue ? 'text-red-600 font-semibold' : 'text-slate-400'}`}>
                        {isOverdue ? '⚠ Vencida' : timeAgo(piece.fecha_limite)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
