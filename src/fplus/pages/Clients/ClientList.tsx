import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MoreVertical, Search, ArrowRight, Users } from 'lucide-react';
import { HealthLight } from '../../components/ui/HealthLight';
import { PlatformIcon } from '../../components/ui/PlatformIcon';
import { EmptyState } from '../../components/ui/EmptyState';
import { useFplusStore } from '../../store';
import { NewClientModal } from '../../components/modals/NewClientModal';
import type { Client } from '../../types';

type FilterHealth = 'all' | 'verde' | 'amarillo' | 'rojo';

export default function ClientList() {
  const navigate = useNavigate();
  const clients = useFplusStore(s => s.clients);
  const [search, setSearch] = useState('');
  const [healthFilter, setHealthFilter] = useState<FilterHealth>('all');
  const [showNewClient, setShowNewClient] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const filtered = clients.filter(c => {
    const matchSearch = c.nombre.toLowerCase().includes(search.toLowerCase()) ||
      c.industria.toLowerCase().includes(search.toLowerCase());
    const matchHealth = healthFilter === 'all' || c.semaforo === healthFilter;
    // Los archivados se conservan siempre (historial), pero se ocultan por defecto
    const matchArchived = showArchived ? c.estado === 'inactivo' : c.estado !== 'inactivo';
    return matchSearch && matchHealth && matchArchived;
  });
  const archivedCount = clients.filter(c => c.estado === 'inactivo').length;

  const counts = {
    all: clients.length,
    verde: clients.filter(c => c.semaforo === 'verde').length,
    amarillo: clients.filter(c => c.semaforo === 'amarillo').length,
    rojo: clients.filter(c => c.semaforo === 'rojo').length,
  };

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Clientes</h1>
          <p className="text-sm text-slate-500 mt-0.5">{clients.length} clientes activos</p>
        </div>
        <button
          onClick={() => setShowNewClient(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Nuevo cliente
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          />
        </div>

        {/* Health filter tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {(['all', 'verde', 'amarillo', 'rojo'] as const).map(f => (
            <button
              key={f}
              onClick={() => setHealthFilter(f)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                healthFilter === f ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {f !== 'all' && <span className={`w-2 h-2 rounded-full ${f === 'verde' ? 'bg-emerald-500' : f === 'amarillo' ? 'bg-amber-400' : 'bg-red-500'}`} />}
              {f === 'all' ? 'Todos' : f.charAt(0).toUpperCase() + f.slice(1)}
              <span className="text-slate-400">({counts[f]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="No hay clientes que coincidan"
          description="Intenta con otro término de búsqueda o limpia los filtros."
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Cliente</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 hidden md:table-cell">AM</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Estado</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Contrato</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 hidden lg:table-cell">Piezas</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 hidden lg:table-cell">Próx. publicación</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 hidden xl:table-cell">Leads / mes</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(client => (
                <ClientRow key={client.id} client={client} onClick={() => navigate(`/fplus/clients/${client.id}`)} />
              ))}
            </tbody>
          </table>
        </div>
      )}
      {archivedCount > 0 && (
        <button
          onClick={() => setShowArchived(a => !a)}
          className="mt-3 mr-4 text-xs text-slate-400 hover:text-slate-600 underline"
        >
          {showArchived ? '← Volver a clientes activos' : `Ver archivados (${archivedCount})`}
        </button>
      )}
      {/* Leyenda de estado de contrato (uso interno) */}
      <div className="flex gap-4 flex-wrap mt-3 text-[11px] text-slate-400">
        <span>🟢 Plan vigente, contrato activo</span>
        <span>🟡 Próximo a vencer (&lt;30 días) — coordinar renovación</span>
        <span>🔴 Vencido — cliente pendiente de renovación</span>
      </div>
      {showNewClient && <NewClientModal onClose={() => setShowNewClient(false)} />}
    </div>
  );
}

// Estado del contrato calculado automáticamente con fecha inicio/fin.
// Solo para uso interno de Primero Digital — el portal del cliente no lo ve.
type ContractStatus = 'activo' | 'por_vencer' | 'vencido' | 'sin_contrato';

function getContractStatus(client: Client): ContractStatus {
  if (!client.fecha_fin_contrato) return 'sin_contrato';
  const fin = new Date(client.fecha_fin_contrato).getTime();
  const hoy = Date.now();
  if (fin < hoy) return 'vencido';
  if (fin - hoy < 30 * 86400000) return 'por_vencer';
  return 'activo';
}

const CONTRACT_BADGE: Record<ContractStatus, { dot: string; label: string; cls: string }> = {
  activo:       { dot: '🟢', label: 'Activo',       cls: 'bg-emerald-50 text-emerald-700' },
  por_vencer:   { dot: '🟡', label: 'Por vencer',   cls: 'bg-amber-50 text-amber-700' },
  vencido:      { dot: '🔴', label: 'Vencido',      cls: 'bg-red-50 text-red-700' },
  sin_contrato: { dot: '⚪', label: 'Sin contrato', cls: 'bg-slate-50 text-slate-500' },
};

const PLAN_BADGE: Record<string, { label: string; cls: string }> = {
  plata:      { label: '🥈 Plata',    cls: 'bg-slate-100 text-slate-600' },
  oro:        { label: '🥇 Oro',      cls: 'bg-amber-50 text-amber-700' },
  platinum:   { label: '💎 Platinum', cls: 'bg-blue-50 text-blue-700' },
  basico:     { label: 'Básico',      cls: 'bg-slate-100 text-slate-600' },
  estandar:   { label: 'Estándar',    cls: 'bg-slate-100 text-slate-600' },
  premium:    { label: '⭐ Premium',  cls: 'bg-blue-50 text-blue-700' },
  enterprise: { label: '🏢 Enterprise', cls: 'bg-slate-800 text-white' },
};

function ClientRow({ client, onClick }: { client: Client; onClick: () => void }) {
  const updateClient = useFplusStore(st => st.updateClient);
  const [menuOpen, setMenuOpen] = useState(false);

  // Invitación al Portal del Cliente: genera el enlace seguro de activación.
  // En producción el correo lo envía el backend (user_invitations + Auth);
  // en el entorno de pruebas el enlace se copia al portapapeles.
  const handleInvite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    let email = client.email;
    if (!email) {
      email = window.prompt(`${client.nombre} no tiene correo registrado.\nIngresa el correo del cliente para enviar la invitación:`)?.trim() || undefined;
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return;
      updateClient(client.id, { email });
    }
    const token = client.portal_invitacion?.token
      ?? `inv-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    updateClient(client.id, {
      portal_invitacion: {
        ...client.portal_invitacion,
        email,
        token,
        enviada_at: new Date().toISOString(),
      },
    });
    const link = `${window.location.origin}/activar/${token}`;
    navigator.clipboard?.writeText(link).catch(() => {});
    window.alert(`✉️ Invitación enviada a ${email}\n\nEnlace de activación (copiado al portapapeles):\n${link}\n\nEl cliente creará su contraseña en el primer ingreso.`);
  };

  // Archivar en lugar de eliminar: el historial del cliente nunca se pierde.
  // Solo el rol Administrador ve esta acción; requiere doble confirmación.
  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    if (!window.confirm(`¿Archivar al cliente "${client.nombre}"?\n\nEl cliente dejará de aparecer en la lista activa, pero TODA su información histórica se conserva.`)) return;
    if (!window.confirm('Confirma nuevamente: esta acción archiva al cliente. Podrá restaurarse desde el filtro "Archivados".')) return;
    updateClient(client.id, { estado: 'inactivo' });
  };

  return (
    <tr className="hover:bg-slate-50 cursor-pointer transition-colors" onClick={onClick}>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-semibold flex-shrink-0">
            {client.nombre.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-900">{client.nombre}</span>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                (PLAN_BADGE[client.plan_contratado ?? ''] ?? { cls: 'bg-slate-100 text-slate-400' }).cls
              }`}>
                {(PLAN_BADGE[client.plan_contratado ?? ''] ?? { label: 'Sin plan' }).label}
              </span>
            </div>
            <div className="text-xs text-slate-400">{client.industria}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5 hidden md:table-cell">
        <span className="text-sm text-slate-600">{client.account_manager_name}</span>
      </td>
      <td className="px-4 py-3.5">
        <HealthLight status={client.semaforo} showLabel />
      </td>
      <td className="px-4 py-3.5">
        {(() => {
          const st = getContractStatus(client);
          const b = CONTRACT_BADGE[st];
          const dias = client.fecha_fin_contrato
            ? Math.ceil((new Date(client.fecha_fin_contrato).getTime() - Date.now()) / 86400000)
            : null;
          return (
            <span
              className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${b.cls}`}
              title={st === 'por_vencer' && dias != null ? `Vence en ${dias} días` : st === 'vencido' ? 'Pendiente de renovación' : undefined}
            >
              {b.dot} {b.label}
            </span>
          );
        })()}
      </td>
      <td className="px-4 py-3.5 hidden lg:table-cell">
        <span className="text-sm text-slate-700 font-medium">{client.piezas_activas}</span>
        {client.piezas_atrasadas > 0 && (
          <span className="ml-1.5 text-xs text-amber-600">({client.piezas_atrasadas} atr.)</span>
        )}
      </td>
      <td className="px-4 py-3.5 hidden lg:table-cell">
        {client.proxima_publicacion ? (
          <div className="flex items-center gap-1.5">
            {client.proxima_publicacion_plataforma && (
              <PlatformIcon platform={client.proxima_publicacion_plataforma} />
            )}
            <span className="text-xs text-slate-600">
              {new Date(client.proxima_publicacion).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        )}
      </td>
      <td className="px-4 py-3.5 hidden xl:table-cell">
        <span className="text-sm font-medium text-slate-700">{client.leads_mes}</span>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1 justify-end relative">
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(o => !o); }}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
            title="Acciones"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 z-20 bg-white border border-slate-200 rounded-xl shadow-lg py-1 w-44" onClick={e => e.stopPropagation()}>
              {client.estado === 'inactivo' ? (
                <button
                  onClick={e => { e.stopPropagation(); setMenuOpen(false); updateClient(client.id, { estado: 'activo' }); }}
                  className="w-full text-left px-3 py-2 text-xs text-emerald-600 hover:bg-emerald-50"
                >
                  ♻️ Restaurar cliente
                </button>
              ) : (
                <button
                  onClick={handleArchive}
                  className="w-full text-left px-3 py-2 text-xs text-amber-600 hover:bg-amber-50"
                >
                  📦 Archivar cliente
                </button>
              )}
              <button
                onClick={handleInvite}
                className="w-full text-left px-3 py-2 text-xs text-blue-600 hover:bg-blue-50"
              >
                ✉️ {client.portal_invitacion?.aceptada_at
                  ? 'Portal activo — reenviar invitación'
                  : client.portal_invitacion
                  ? 'Reenviar invitación'
                  : 'Enviar invitación al portal'}
              </button>
              <p className="px-3 py-1.5 text-[9px] text-slate-300 border-t border-slate-50">Solo Administrador</p>
            </div>
          )}
          <ArrowRight className="w-4 h-4 text-slate-300" />
        </div>
      </td>
    </tr>
  );
}
