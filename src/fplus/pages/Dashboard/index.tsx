import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileImage, AlertOctagon, TrendingUp,
  Clock, ArrowRight, CheckCircle, Bell, Send, X, ChevronRight,
} from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { HealthLight } from '../../components/ui/HealthLight';
import { PlatformIcon } from '../../components/ui/PlatformIcon';
import { ContentStateChip } from '../../components/ui/StateChip';
import { useFplusStore } from '../../store';
import { useAuth } from '@/contexts/AuthContext';
import { useFplusRole } from '../../hooks/useFplusRole';
import {
  mockTeam,
  mockActivity,
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

export default function Dashboard() {
  const navigate = useNavigate();
  const { user: evoUser } = useAuth();
  const agencyName = (evoUser?.custom_attributes?.fplus_agency_name as string) || 'Mi Agencia';

  const contentPieces = useFplusStore(s => s.contentPieces);
  const publications = useFplusStore(s => s.publications);
  const campaigns = useFplusStore(s => s.campaigns) || [];
  const clients = useFplusStore(s => s.clients);

  const [activeModal, setActiveModal] = React.useState<'approvals' | 'campaigns' | 'progress' | 'reminders' | null>(null);
  const [clientFilter, setClientFilter] = React.useState<'todos' | 'criticos' | 'estables'>('todos');
  const [showAllClients, setShowAllClients] = React.useState(false);

  // Mapeamos los clientes para inicializar o simular recordatorios
  const clientStates = React.useMemo(() => {
    return clients.map(c => ({
      ...c,
      recordatorio_automatico: c.recordatorio_automatico !== false,
      intervalo_recordatorio: c.intervalo_recordatorio ?? 8,
      ultimo_recordatorio_enviado: c.ultimo_recordatorio_enviado ?? new Date(Date.now() - 3.5 * 3600000).toISOString()
    }));
  }, [clients]);

  // Lista filtrada del semáforo
  const filteredClientsList = React.useMemo(() => {
    let list = clientStates;
    if (clientFilter === 'criticos') {
      list = clientStates.filter(c => c.semaforo === 'rojo' || c.semaforo === 'amarillo');
    } else if (clientFilter === 'estables') {
      list = clientStates.filter(c => c.semaforo === 'verde');
    }
    return list;
  }, [clientStates, clientFilter]);

  const displayedClients = showAllClients ? filteredClientsList : filteredClientsList.slice(0, 4);

  // Nuevas Métricas Operacionales SaaS
  const pendientesAprobacion = contentPieces.filter(cp => cp.estado === 'enviado_cliente' || cp.estado === 'en_revision_cliente').length;
  const campañasActivas = campaigns.filter(c => c.estado === 'activa').length;
  
  const totalValidas = contentPieces.filter(cp => ['aprobado_cliente', 'aprobado_final', 'publicado'].includes(cp.estado)).length;
  const avanceGeneral = contentPieces.length > 0 ? Math.round((totalValidas / contentPieces.length) * 100) : 0;

  const recordatoriosActivosCount = clientStates.filter(c => c.recordatorio_automatico).length;

  // Carga de Trabajo de Equipo Dinámica por Responsabilidad
  const teammateWorkload = React.useMemo(() => {
    return mockTeam.map(member => {
      const assignedPieces = contentPieces.filter(cp => 
        (member.rol === 'account_manager' && cp.account_manager_id === member.id) ||
        (member.rol === 'designer' && cp.designer_id === member.id) ||
        (member.rol === 'content_manager' && cp.content_manager_id === member.id)
      );

      const pendingPieces = assignedPieces.filter(cp => cp.estado !== 'publicado' && cp.estado !== 'archivado');

      const clientCounts: Record<string, { name: string; count: number }> = {};
      pendingPieces.forEach(cp => {
        if (!clientCounts[cp.client_id]) {
          clientCounts[cp.client_id] = { name: cp.client_nombre, count: 0 };
        }
        clientCounts[cp.client_id].count++;
      });

      const summary = Object.values(clientCounts)
        .map(c => `${c.count} de ${c.name}`)
        .join(', ');

      return {
        ...member,
        totalPending: pendingPieces.length,
        summary: summary || 'Sin tareas pendientes'
      };
    });
  }, [contentPieces]);

  const { fplusRole } = useFplusRole();

  // Filtrar piezas asignadas al colaborador activo para "Mi Bandeja" (Tareas urgentes)
  const myPieces = React.useMemo(() => {
    // Default a 'u3' (Carlos Ramos, designer) en el demo para mostrar datos ricos
    const currentUserId = evoUser?.id || 'u3';
    return contentPieces.filter(cp =>
      (cp.account_manager_id === currentUserId ||
       cp.designer_id === currentUserId ||
       cp.content_manager_id === currentUserId) &&
      cp.estado !== 'publicado' &&
      cp.estado !== 'archivado'
    ).slice(0, 5);
  }, [contentPieces, evoUser?.id]);

  const atrasadas = contentPieces.filter(c =>
    c.fecha_limite && new Date(c.fecha_limite) < new Date() && c.estado !== 'publicado' && c.estado !== 'archivado'
  );
  const bloqueadas = contentPieces.filter(c => c.estado === 'bloqueado');
  const sinConfirmar = publications.filter(p => p.estado === 'sin_confirmar').length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Bienvenido, {agencyName}</h1>
          <p className="text-sm text-slate-500 mt-0.5">Resumen de operaciones — {new Date().toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        {(fplusRole === 'agency_admin' || fplusRole === 'super_admin') && (
          <button
            onClick={() => navigate('/fplus/clients')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer"
          >
            + Registrar Cliente
          </button>
        )}
      </div>

      {/* Alertas prioritarias */}
      {(bloqueadas.length > 0 || atrasadas.length > 0 || sinConfirmar > 0) && (
        <div className="flex flex-wrap gap-3">
          {bloqueadas.length > 0 && (
            <button
              onClick={() => navigate('/fplus/content?estado=bloqueado')}
              className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-red-100 transition-colors"
            >
              <AlertOctagon className="w-4 h-4" />
              {bloqueadas.length} pieza{bloqueadas.length > 1 ? 's' : ''} bloqueada{bloqueadas.length > 1 ? 's' : ''}
            </button>
          )}
          {atrasadas.length > 0 && (
            <button
              onClick={() => navigate('/fplus/content?estado=atrasado')}
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
          label="Piezas por aprobar"
          value={pendientesAprobacion}
          icon={<Clock className="w-4 h-4" />}
          variant={pendientesAprobacion > 0 ? 'warning' : 'default'}
          onClick={() => setActiveModal('approvals')}
        />
        <StatCard
          label="Campañas activas"
          value={campañasActivas}
          icon={<TrendingUp className="w-4 h-4" />}
          onClick={() => setActiveModal('campaigns')}
        />
        <StatCard
          label="Avance del mes"
          value={`${avanceGeneral}%`}
          icon={<CheckCircle className="w-4 h-4" />}
          onClick={() => setActiveModal('progress')}
        />
        <StatCard
          label="Seguimiento automático"
          value={`${recordatoriosActivosCount} activos`}
          icon={<Bell className="w-4 h-4" />}
          onClick={() => setActiveModal('reminders')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Semáforo de clientes — 2/3 */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between px-5 py-4 border-b border-slate-100 gap-3">
              <h2 className="text-sm font-semibold text-slate-800">Semáforo de clientes</h2>
              
              {/* Filtros de semáforo */}
              <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 text-[10px]">
                <button
                  onClick={() => setClientFilter('todos')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                    clientFilter === 'todos' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setClientFilter('criticos')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                    clientFilter === 'criticos' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Críticos
                </button>
                <button
                  onClick={() => setClientFilter('estables')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                    clientFilter === 'estables' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Estables
                </button>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {displayedClients.length === 0 ? (
                <div className="py-12 text-center text-slate-450 text-xs">
                  No hay clientes que coincidan con el filtro.
                </div>
              ) : (
                displayedClients.map(client => (
                  <button
                    key={client.id}
                    onClick={() => navigate(`/fplus/clients/${client.id}`)}
                    className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors text-left"
                  >
                    <HealthLight status={client.semaforo} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-800">{client.nombre}</div>
                      <div className="text-xs text-slate-500">
                        AM: {client.account_manager_name}
                        {client.piezas_atrasadas > 0 && (
                          <span className="ml-2 text-amber-600 font-medium">· {client.piezas_atrasadas} atrasada{client.piezas_atrasadas > 1 ? 's' : ''}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <div className="text-xs text-slate-650 font-medium">{client.piezas_activas} piezas</div>
                      {client.proxima_publicacion && client.proxima_publicacion_plataforma && (
                        <div className="text-xs text-slate-400 flex items-center justify-end gap-1 mt-0.5">
                          <PlatformIcon platform={client.proxima_publicacion_plataforma} />
                          {new Date(client.proxima_publicacion).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                  </button>
                ))
              )}
            </div>
          </div>
          
          {filteredClientsList.length > 4 && (
            <button
              onClick={() => setShowAllClients(prev => !prev)}
              className="w-full py-3 text-center text-xs font-semibold text-blue-600 hover:text-blue-750 bg-slate-50 hover:bg-slate-100 transition-colors border-t border-slate-100 cursor-pointer"
            >
              {showAllClients ? 'Mostrar menos' : `Ver todos los clientes (${filteredClientsList.length})`}
            </button>
          )}
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
            <h2 className="text-sm font-semibold text-slate-800">Responsabilidad y Carga de Equipo</h2>
            <button onClick={() => navigate('/fplus/settings/team')} className="text-xs text-blue-600 hover:underline">Ver equipo</button>
          </div>
          <div className="divide-y divide-slate-100">
            {teammateWorkload.map(member => {
              const pct = Math.min(100, (member.totalPending / 15) * 100);
              const overloaded = member.totalPending >= 10;
              return (
                <div key={member.id} className="px-5 py-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-150 flex items-center justify-center text-slate-600 text-xs font-bold flex-shrink-0">
                    {member.nombre.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <span className="text-xs font-semibold text-slate-800 truncate block">{member.nombre}</span>
                        <span className="text-[10px] text-slate-450 block truncate max-w-[280px]">{member.summary}</span>
                      </div>
                      <span className={`text-xs font-bold ml-2 flex-shrink-0 ${overloaded ? 'text-red-600' : 'text-slate-500'}`}>
                        {member.totalPending} piezas {overloaded && '⚠️'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
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

        {/* Mi Bandeja de Trabajo */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Mi Bandeja de Trabajo</h2>
              <p className="text-[10px] text-slate-400 mt-0.5">Tareas asignadas pendientes de entrega</p>
            </div>
            <span className="text-[10px] bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full font-bold">
              {myPieces.length} pendientes
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {myPieces.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                🎉 ¡Al día! No tienes tareas asignadas pendientes.
              </div>
            ) : (
              myPieces.map(piece => {
                const isOverdue = piece.fecha_limite && new Date(piece.fecha_limite) < new Date();
                return (
                  <button
                    key={piece.id}
                    onClick={() => navigate(`/fplus/content/${piece.id}`)}
                    className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 text-slate-400">
                      <FileImage className="w-4 h-4 text-slate-550" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-850 truncate">{piece.nombre}</div>
                      <div className="text-[10px] text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                        <span className="font-semibold text-slate-600">{piece.client_nombre}</span>
                        <span>·</span>
                        <span className="text-blue-650 font-semibold">{(() => {
                          switch (piece.estado) {
                            case 'borrador': return '📝 Borrador';
                            case 'en_produccion': return '🎨 En Producción';
                            case 'revision_interna':
                            case 'cambios_internos': return '👁️ Rev. Interna';
                            case 'listo_para_cliente': return '🚀 Listo para Cliente';
                            case 'enviado_cliente':
                            case 'en_revision_cliente': return '⏳ Aprobación Cliente';
                            case 'cambios_solicitados': return '⚠️ Corrección Cliente';
                            case 'aprobado_cliente':
                            case 'aprobado_final': return '🚀 Programar';
                            default: return '⚙️ En proceso';
                          }
                        })()}</span>
                        <span>·</span>
                        <span className="text-[9px] text-slate-450 shrink-0">
                          AM: {piece.account_manager_nombre.split(' ')[0]} · Dis: {piece.designer_nombre ? piece.designer_nombre.split(' ')[0] : 'Sin asignar'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <ContentStateChip state={piece.estado} size="sm" />
                      {piece.fecha_limite && (
                        <span className={`text-[9px] ${isOverdue ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                          {isOverdue ? '⚠️ Vencida' : timeAgo(piece.fecha_limite)}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Modals rendering */}
      {activeModal === 'approvals' && (
        <PendingApprovalsModal
          clients={clientStates}
          contentPieces={contentPieces}
          onClose={() => setActiveModal(null)}
          onNavigate={navigate}
          onSendManualReminder={(id) => {
            const client = clients.find(c => c.id === id);
            if (client) {
              useFplusStore.getState().updateClient(id, { ultimo_recordatorio_enviado: new Date().toISOString() });
              window.alert(`✉️ Recordatorio de aprobación manual enviado por WhatsApp y Correo al cliente: ${client.nombre}`);
            }
          }}
          onToggleAutoReminder={(id, val) => {
            useFplusStore.getState().updateClient(id, { recordatorio_automatico: val });
          }}
          onSetReminderInterval={(id, hours) => {
            useFplusStore.getState().updateClient(id, { intervalo_recordatorio: hours });
          }}
        />
      )}

      {activeModal === 'campaigns' && (
        <ActiveCampaignsModal
          clients={clientStates}
          campaigns={campaigns}
          onClose={() => setActiveModal(null)}
          onNavigate={navigate}
        />
      )}

      {activeModal === 'progress' && (
        <MonthlyProgressModal
          clients={clientStates}
          contentPieces={contentPieces}
          onClose={() => setActiveModal(null)}
          onNavigate={navigate}
        />
      )}

      {activeModal === 'reminders' && (
        <SentRemindersModal
          clients={clientStates}
          onClose={() => setActiveModal(null)}
          onNavigate={navigate}
          onToggleAutoReminder={(id, val) => {
            useFplusStore.getState().updateClient(id, { recordatorio_automatico: val });
          }}
        />
      )}
    </div>
  );
}

// ─── Auxiliary Modal Components ────────────────────────────────────────────────

interface ModalProps {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function ModalLayout({ onClose, title, children }: ModalProps) {
  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm animate-fade-in cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col cursor-default animate-scale-in"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer">
            <X className="w-4 h-4 text-slate-550" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-slate-700 text-sm">
          {children}
        </div>
        <div className="flex justify-end border-t border-slate-100 px-6 py-3 bg-slate-50 flex-shrink-0 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-750 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

// 1. PendingApprovalsModal
function PendingApprovalsModal({
  clients,
  contentPieces,
  onClose,
  onNavigate,
  onSendManualReminder,
  onToggleAutoReminder,
  onSetReminderInterval
}: {
  clients: any[];
  contentPieces: any[];
  onClose: () => void;
  onNavigate: (path: string) => void;
  onSendManualReminder: (id: string) => void;
  onToggleAutoReminder: (id: string, val: boolean) => void;
  onSetReminderInterval: (id: string, hours: number) => void;
}) {
  return (
    <ModalLayout title="Piezas por Aprobar por Clientes" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-xs text-slate-500">
          Revisa qué clientes tienen pautas o contenidos en revisión. Envía recordatorios inmediatos o configura el seguimiento programado.
        </p>

        <div className="divide-y divide-slate-105">
          {clients.map(client => {
            const pendingList = contentPieces.filter(cp => cp.client_id === client.id && (cp.estado === 'enviado_cliente' || cp.estado === 'en_revision_cliente'));
            const isAllApproved = pendingList.length === 0;

            return (
              <div key={client.id} className="py-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <button
                      onClick={() => {
                        onNavigate(`/fplus/clients/${client.id}/approvals`);
                        onClose();
                      }}
                      className="text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors flex items-center gap-0.5 cursor-pointer text-left"
                    >
                      {client.nombre} <ChevronRight className="w-3 h-3 text-slate-400" />
                    </button>
                    <p className="text-xs text-slate-400">
                      AM responsable: {client.account_manager_name}
                    </p>
                  </div>
                  {isAllApproved ? (
                    <span className="text-xs bg-emerald-50 text-emerald-605 px-2 py-0.5 rounded-full font-bold">
                      ✅ Todo Aprobado
                    </span>
                  ) : (
                    <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-bold">
                      ⏳ {pendingList.length} pendientes
                    </span>
                  )}
                </div>

                {!isAllApproved && (
                  <div className="bg-slate-50 rounded-xl p-3 flex flex-col gap-2 border border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>Último recordatorio: {timeAgo(client.ultimo_recordatorio_enviado)}</span>
                      <button
                        onClick={() => onSendManualReminder(client.id)}
                        className="text-[11px] bg-blue-600 hover:bg-blue-705 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Send className="w-3 h-3" /> Reenviar aviso
                      </button>
                    </div>

                    <div className="border-t border-slate-200/50 pt-2 flex items-center justify-between text-xs">
                      <label className="flex items-center gap-2 font-medium text-slate-700">
                        <input
                          type="checkbox"
                          checked={client.recordatorio_automatico}
                          onChange={(e) => onToggleAutoReminder(client.id, e.target.checked)}
                          className="rounded border-slate-300 text-blue-650 focus:ring-blue-500"
                        />
                        Recordatorio Automático
                      </label>

                      {client.recordatorio_automatico && (
                        <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 gap-1">
                          <button
                            onClick={() => onSetReminderInterval(client.id, 5)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              client.intervalo_recordatorio === 5 ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-655'
                            }`}
                          >
                            Cada 5h
                          </button>
                          <button
                            onClick={() => onSetReminderInterval(client.id, 8)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              client.intervalo_recordatorio === 8 ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-655'
                            }`}
                          >
                            Cada 8h
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </ModalLayout>
  );
}

// 2. ActiveCampaignsModal
function ActiveCampaignsModal({
  clients,
  campaigns,
  onClose,
  onNavigate
}: {
  clients: any[];
  campaigns: any[];
  onClose: () => void;
  onNavigate: (path: string) => void;
}) {
  const activeCampaigns = campaigns.filter(c => c.estado === 'activa');

  return (
    <ModalLayout title="Campañas Publicitarias Activas" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-xs text-slate-500">
          Listado de pautas publicitarias actualmente activas. Presiona sobre una campaña para ver su desglose de pauta.
        </p>

        {activeCampaigns.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No hay campañas activas en este momento.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activeCampaigns.map(camp => {
              const clientName = clients.find(cl => cl.id === camp.client_id)?.nombre || 'Marca';
              return (
                <button
                  key={camp.id}
                  onClick={() => {
                    onNavigate(`/fplus/clients/${camp.client_id}/campaigns`);
                    onClose();
                  }}
                  className="w-full text-left py-3 px-3 -mx-3 hover:bg-slate-50 rounded-xl transition-all cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 hover:text-blue-600 transition-colors">
                      {camp.nombre}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                      <span className="font-bold text-slate-500">{clientName}</span>
                      <span>·</span>
                      <span>Presupuesto: ${camp.presupuesto_total?.toLocaleString('es') ?? '0'}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {camp.plataforma && (
                      <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                        <PlatformIcon platform={camp.plataforma} size={10} />
                        {camp.plataforma}
                      </span>
                    )}
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                      Activa
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </ModalLayout>
  );
}

// 3. MonthlyProgressModal
function MonthlyProgressModal({
  clients,
  contentPieces,
  onClose,
  onNavigate
}: {
  clients: any[];
  contentPieces: any[];
  onClose: () => void;
  onNavigate: (path: string) => void;
}) {
  return (
    <ModalLayout title="Avance de Planificación Mensual" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-xs text-slate-500">
          Progreso de aprobación y publicación del calendario de contenidos por cliente para el periodo actual.
        </p>

        <div className="space-y-4">
          {clients.map(client => {
            const clientPieces = contentPieces.filter(cp => cp.client_id === client.id);
            const approvedPieces = clientPieces.filter(cp => ['aprobado_cliente', 'aprobado_final', 'publicado'].includes(cp.estado));
            const totalCount = clientPieces.length;
            const approvedCount = approvedPieces.length;
            const pct = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;

            return (
              <button
                key={client.id}
                onClick={() => {
                  onNavigate(`/fplus/clients/${client.id}/calendar`);
                  onClose();
                }}
                className="w-full text-left hover:bg-slate-50 p-2.5 -mx-2.5 rounded-xl transition-all cursor-pointer block"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 hover:text-blue-605 flex items-center gap-0.5 text-left">
                    {client.nombre} <ChevronRight className="w-3 h-3 text-slate-400" />
                  </span>
                  <span className="text-slate-505 font-semibold">{approvedCount} de {totalCount} aprobadas ({pct}%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </ModalLayout>
  );
}

// 4. SentRemindersModal
function SentRemindersModal({
  clients,
  onClose,
  onNavigate,
  onToggleAutoReminder
}: {
  clients: any[];
  onClose: () => void;
  onNavigate: (path: string) => void;
  onToggleAutoReminder: (id: string, val: boolean) => void;
}) {
  return (
    <ModalLayout title="Seguimiento Automático de Aprobaciones" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-xs text-slate-505">
          Configuración y registro de notificaciones automáticas para clientes con aprobaciones pendientes. El sistema envía recordatorios programados por WhatsApp y Correo.
        </p>

        <div className="divide-y divide-slate-100">
          {clients.map(client => {
            return (
              <div key={client.id} className="py-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <button
                      onClick={() => {
                        onNavigate(`/fplus/clients/${client.id}/brief`);
                        onClose();
                      }}
                      className="text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors flex items-center gap-0.5 cursor-pointer text-left"
                    >
                      {client.nombre} <ChevronRight className="w-3 h-3 text-slate-400" />
                    </button>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {client.recordatorio_automatico 
                        ? `Recordatorio activo cada ${client.intervalo_recordatorio} horas`
                        : 'Seguimiento automático desactivado'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={client.recordatorio_automatico}
                      onChange={(e) => onToggleAutoReminder(client.id, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-205 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {client.recordatorio_automatico && (
                  <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1.5 border border-slate-100">
                    <div className="flex justify-between text-slate-500">
                      <span>Logs de notificaciones hoy:</span>
                      <span className="font-semibold text-slate-600">2 enviados</span>
                    </div>
                    <ul className="space-y-1 text-[11px] text-slate-400">
                      <li className="flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-emerald-500" />
                        WhatsApp enviado hace {timeAgo(client.ultimo_recordatorio_enviado)}
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-emerald-500" />
                        Correo electrónico enviado hace {timeAgo(new Date(new Date(client.ultimo_recordatorio_enviado).getTime() - 8 * 3600000).toISOString())}
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </ModalLayout>
  );
}
