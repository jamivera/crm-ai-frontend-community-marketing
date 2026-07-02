import React, { useState } from 'react';
import { Building2, Users, Key, Bell } from 'lucide-react';

type Tab = 'agencia' | 'equipo' | 'acceso';

const TEAM = [
  { name: 'Andrea Solís',  role: 'Account Manager', email: 'andrea@agencia.com',  avatar: 'A', status: 'activo' },
  { name: 'Juan Pérez',    role: 'Agency Admin',     email: 'juan@agencia.com',    avatar: 'J', status: 'activo' },
  { name: 'Carlos Ramos',  role: 'Content Manager',  email: 'carlos@agencia.com',  avatar: 'C', status: 'activo' },
  { name: 'María Loor',    role: 'Designer',         email: 'maria@agencia.com',   avatar: 'M', status: 'activo' },
  { name: 'Luis Castro',   role: 'Media Buyer',      email: 'luis@agencia.com',    avatar: 'L', status: 'inactivo' },
];

const ROLE_COLORS: Record<string, string> = {
  'Agency Admin':     'bg-blue-100 text-blue-700',
  'Account Manager':  'bg-green-100 text-green-700',
  'Content Manager':  'bg-amber-100 text-amber-700',
  'Designer':         'bg-purple-100 text-purple-700',
  'Media Buyer':      'bg-cyan-100 text-cyan-700',
};

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('agencia');
  const [agencyName, setAgencyName] = useState('Mi Agencia');
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'agencia', label: 'Agencia', icon: Building2 },
    { id: 'equipo',  label: 'Equipo',  icon: Users },
    { id: 'acceso',  label: 'Acceso',  icon: Key },
  ];

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Configuración</h1>
        <p className="text-sm text-slate-500 mt-0.5">Ajustes de tu agencia y equipo de trabajo</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-slate-200 mb-8">
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                active ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Agencia */}
      {tab === 'agencia' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Perfil de la agencia</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre de la agencia</label>
                <input
                  type="text"
                  value={agencyName}
                  onChange={e => setAgencyName(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Zona horaria</label>
                <select className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
                  <option>America/Guayaquil (UTC-5)</option>
                  <option>America/Bogota (UTC-5)</option>
                  <option>America/Lima (UTC-5)</option>
                  <option>America/Santiago (UTC-4)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Moneda</label>
                <select className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
                  <option>USD — Dólar</option>
                  <option>COP — Peso colombiano</option>
                  <option>PEN — Sol peruano</option>
                  <option>CLP — Peso chileno</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                {saved ? '✓ Guardado' : 'Guardar cambios'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-1">
              <Bell className="w-4 h-4 text-slate-400" />
              <h2 className="font-semibold text-slate-800">Notificaciones</h2>
            </div>
            <p className="text-sm text-slate-500 mb-4">Configuración de alertas del equipo</p>
            {[
              ['Piezas atrasadas', 'Alerta cuando una pieza supere su fecha límite'],
              ['Aprobación pendiente', 'Recordatorio cuando el cliente no responde en 48h'],
              ['Publicación sin confirmar', 'Alerta cuando una publicación lleva más de 24h sin confirmar'],
            ].map(([label, desc]) => (
              <div key={label} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                <div>
                  <div className="text-sm font-medium text-slate-700">{label}</div>
                  <div className="text-xs text-slate-400">{desc}</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-9 h-5 bg-slate-200 peer-checked:bg-blue-600 rounded-full peer-focus:ring-2 peer-focus:ring-blue-300 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Equipo */}
      {tab === 'equipo' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Miembros del equipo</h2>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
              <Users className="w-3.5 h-3.5" /> Invitar
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {TEAM.map(m => (
              <div key={m.email} className="flex items-center gap-4 px-6 py-4">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-semibold flex-shrink-0">
                  {m.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800">{m.name}</div>
                  <div className="text-xs text-slate-400 truncate">{m.email}</div>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_COLORS[m.role] ?? 'bg-slate-100 text-slate-600'}`}>
                  {m.role}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${m.status === 'activo' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                  {m.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Acceso */}
      {tab === 'acceso' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-4 h-4 text-slate-400" />
              <h2 className="font-semibold text-slate-800">Acceso de clientes al portal</h2>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Cada cliente accede a su portal mediante una URL única. No requiere contraseña por defecto — se genera un enlace de acceso desde su ficha.
            </p>
            <div className="bg-slate-50 rounded-lg p-4 font-mono text-xs text-slate-600 break-all">
              https://tuagencia.fplus.app/portal/<span className="text-blue-600">:clientId</span>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <b>Próximamente:</b> Autenticación con magic link, SSO y gestión de tokens por cliente. Disponible en V1.
          </div>
        </div>
      )}
    </div>
  );
}
