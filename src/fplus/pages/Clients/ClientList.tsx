import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, ArrowRight, Users } from 'lucide-react';
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

  const filtered = clients.filter(c => {
    const matchSearch = c.nombre.toLowerCase().includes(search.toLowerCase()) ||
      c.industria.toLowerCase().includes(search.toLowerCase());
    const matchHealth = healthFilter === 'all' || c.semaforo === healthFilter;
    return matchSearch && matchHealth;
  });

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
      {showNewClient && <NewClientModal onClose={() => setShowNewClient(false)} />}
    </div>
  );
}

function ClientRow({ client, onClick }: { client: Client; onClick: () => void }) {
  return (
    <tr className="hover:bg-slate-50 cursor-pointer transition-colors" onClick={onClick}>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-semibold flex-shrink-0">
            {client.nombre.charAt(0)}
          </div>
          <div>
            <div className="text-sm font-medium text-slate-900">{client.nombre}</div>
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
        <ArrowRight className="w-4 h-4 text-slate-300" />
      </td>
    </tr>
  );
}
