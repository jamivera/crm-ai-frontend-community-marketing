import { useState } from 'react';
import { Building2, Users, CheckCircle2, UserPlus, Lock } from 'lucide-react';
import { usePortalContext } from './PortalContext';
import { useFplusStore } from '../../store';
import { PLATFORM_LABELS, CONTENT_TYPE_LABELS } from '../../constants';
import type { ContentType } from '../../types';
import { getSupabase } from '../../services/supabaseClient';

// Mi Marca — sección de consulta para el cliente: la información estratégica
// de su proyecto (brief, plan, servicios), sin datos internos de la agencia.

export default function PortalBrand() {
  const { clientId } = usePortalContext();
  const client = useFplusStore(s => s.clients.find(c => c.id === clientId));

  const [members] = useState([
    { nombre: 'Paula (Tú)', email: client?.email || 'paula@example.com', rol: 'Administrador (Owner)' },
    { nombre: 'Juan Revisor', email: 'juan.revisor@example.com', rol: 'Colaborador' },
  ]);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('colaborador');
  const [invitations, setInvitations] = useState<{ id: string; email: string; rol: string; fecha: string }[]>([]);

  // Password change states
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');
    if (newPassword !== confirmNewPassword) {
      setPwdError('Las contraseñas nuevas no coinciden.');
      return;
    }
    const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!PASSWORD_REGEX.test(newPassword)) {
      setPwdError('La nueva contraseña debe tener al menos 8 caracteres e incluir una mayúscula, un número y un carácter especial (@$!%*?&).');
      return;
    }

    const sb = getSupabase();
    if (sb) {
      const { error } = await sb.auth.updateUser({ password: newPassword });
      if (error) {
        setPwdError(error.message);
        return;
      }
    } else {
      // Simulación local en local storage sin password_demo
      const simulatedPasswords = JSON.parse(localStorage.getItem('fplus-simulated-auth') || '{}');
      const email = client?.portal_invitacion?.email || client?.email;
      if (email) {
        simulatedPasswords[email.toLowerCase()] = newPassword;
        localStorage.setItem('fplus-simulated-auth', JSON.stringify(simulatedPasswords));
      } else {
        setPwdError('No se encontró un correo válido para este cliente.');
        return;
      }
    }

    setPwdSuccess('Contraseña actualizada con éxito.');
    setNewPassword('');
    setConfirmNewPassword('');
  };

  if (!client) return null;

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) return;
    
    setInvitations([
      ...invitations,
      {
        id: `inv-${Date.now()}`,
        email: inviteEmail,
        rol: inviteRole === 'administrador' ? 'Administrador' : 'Colaborador',
        fecha: new Date().toLocaleDateString('es')
      }
    ]);
    
    window.alert(`✉️ Invitación enviada a ${inviteEmail} como ${inviteRole === 'administrador' ? 'Administrador' : 'Colaborador'}.\n\nSe ha creado el enlace de acceso temporal para su activación.`);
    setInviteName('');
    setInviteEmail('');
  };

  const Section = ({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) => (
    <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
      <p className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2.5">
        <Icon className="w-3.5 h-3.5" /> {title}
      </p>
      {children}
    </div>
  );

  const Row = ({ label, value }: { label: string; value?: string }) =>
    value ? (
      <div className="py-1.5">
        <p className="text-[10px] font-semibold text-slate-400 uppercase">{label}</p>
        <p className="text-sm text-slate-700 leading-relaxed">{value}</p>
      </div>
    ) : null;

  return (
    <div className="px-4 sm:px-8 pt-6 sm:pt-10 pb-16 sm:pb-20 max-w-6xl mx-auto space-y-8 sm:space-y-12">
      <div>
        <h1 className="text-lg font-bold text-slate-800">Mi Marca</h1>
        <p className="text-xs text-slate-400 mt-0.5">La información estratégica de tu proyecto, siempre a mano</p>
      </div>

      <Section icon={Building2} title="Información general">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
          <Row label="Empresa" value={client.empresa ?? client.nombre} />
          {client.tipo_documento && client.numero_documento && (
            <Row label="Identificación" value={`${client.tipo_documento.toUpperCase()}: ${client.numero_documento}`} />
          )}
          <Row label="Sector" value={client.tipo_mercado ?? client.industria} />
          <Row label="Contacto" value={client.responsable_cliente} />
          {client.telefono && <Row label="Teléfono" value={client.telefono} />}
          {client.email && <Row label="Correo" value={client.email} />}
          {client.email_facturacion && <Row label="Facturación" value={client.email_facturacion} />}
          {client.sitio_web && <Row label="Sitio Web" value={client.sitio_web} />}
          {[client.direccion, client.ciudad, client.provincia, client.pais].some(Boolean) && (
            <Row label="Ubicación" value={[client.direccion, client.ciudad, client.provincia, client.pais].filter(Boolean).join(', ')} />
          )}
        </div>
      </Section>

      {/* Servicios contratados */}
      <Section icon={CheckCircle2} title="Servicios contratados">
        <p className="text-sm text-slate-700 capitalize font-semibold mb-2">
          {client.plan_contratado === 'platinum' ? '💎 Plan Platinum' :
           client.plan_contratado === 'oro' ? '🥇 Plan Oro' :
           client.plan_contratado === 'plata' ? '🥈 Plan Plata' :
           client.plan_contratado === 'personalizado' ? '⚙️ Plan Personalizado' :
           client.plan_contratado ?? 'Plan personalizado'}
          {client.piezas_mensuales ? ` — ${client.piezas_mensuales} piezas mensuales` : ''}
        </p>
        {client.distribucion_piezas && Object.keys(client.distribucion_piezas).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {(Object.entries(client.distribucion_piezas) as [ContentType, number][]).map(([tipo, qty]) => (
              <span key={tipo} className="text-xs bg-slate-50 border border-slate-100 px-2 py-1 rounded-full text-slate-600">
                {qty} {CONTENT_TYPE_LABELS[tipo]}
              </span>
            ))}
          </div>
        )}
        {client.redes_contratadas && client.redes_contratadas.length > 0 && (
          <p className="text-xs text-slate-500 mb-2">
            Redes: {client.redes_contratadas.map(r => PLATFORM_LABELS[r]).join(' · ')}
          </p>
        )}

        {client.plan_contratado === 'personalizado' && client.servicios_contratados && client.servicios_contratados.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Servicios y Entregables Contratados</p>
            {client.servicios_contratados.map(s => {
              const statusColors = {
                activo: 'bg-blue-50 text-blue-700 border-blue-100',
                en_progreso: 'bg-amber-50 text-amber-700 border-amber-200',
                entregado: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                suspendido: 'bg-red-50 text-red-700 border-red-100',
              };
              return (
                <div key={s.id} className="border border-slate-100 rounded-xl p-3 bg-slate-50/50 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-slate-700">{s.nombre}</h4>
                      <p className="text-[9px] text-slate-400 font-medium capitalize">{s.categoria || 'General'}</p>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-semibold ${statusColors[s.estado]}`}>
                      {s.estado === 'activo' ? 'Activo' : s.estado === 'en_progreso' ? 'En Progreso' : s.estado === 'entregado' ? 'Entregado' : 'Suspendido'}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] text-slate-500">
                      <span>Progreso</span>
                      <span className="font-semibold">{s.progreso}%</span>
                    </div>
                    <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${s.progreso}%` }} />
                    </div>
                  </div>

                  {s.fecha_entrega && (
                    <p className="text-[9px] text-slate-400">
                      Fecha de entrega: <span className="text-slate-600 font-semibold">{new Date(s.fecha_entrega).toLocaleDateString('es', { day: 'numeric', month: 'short' })}</span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Section>



      {/* Gestión de Accesos (Membresías V1) */}
      <Section icon={Users} title="Accesos y Colaboradores">
        <p className="text-xs text-slate-400 mb-4">
          Administra las personas de tu organización que tienen acceso a este portal de marca.
        </p>

        {/* Members List */}
        <div className="space-y-3 mb-5">
          {members.map(m => (
            <div key={m.email} className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-xl p-3">
              <div>
                <p className="text-xs font-semibold text-slate-800">{m.nombre}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{m.email}</p>
              </div>
              <span className="text-[9px] font-bold text-slate-600 bg-slate-200/50 px-2 py-0.5 rounded-full uppercase leading-none">
                {m.rol}
              </span>
            </div>
          ))}

          {invitations.map(inv => (
            <div key={inv.id} className="flex justify-between items-center bg-amber-50/50 border border-amber-100/50 rounded-xl p-3">
              <div>
                <p className="text-xs font-semibold text-amber-800">{inv.email}</p>
                <p className="text-[10px] text-amber-500 mt-0.5">Enviado el {inv.fecha} · Expiración en 48 hrs</p>
              </div>
              <span className="text-[9px] font-bold text-amber-600 bg-amber-100/20 px-2 py-0.5 rounded-full uppercase leading-none border border-amber-100">
                Pendiente
              </span>
            </div>
          ))}
        </div>

        {/* Invite Form */}
        <form onSubmit={handleSendInvite} className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 space-y-3">
          <p className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
            <UserPlus className="w-3.5 h-3.5 text-blue-500" />
            Invitar nuevo colaborador
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Nombre completo"
              value={inviteName}
              onChange={e => setInviteName(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
            <input
              type="email"
              placeholder="correo@empresa.com"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <select
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="colaborador">Colaborador (Revisar y Comentar)</option>
              <option value="administrador">Administrador (Owner)</option>
            </select>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-1.5 rounded-lg transition-colors"
            >
              Enviar invitación
            </button>
          </div>
        </form>
      </Section>

      {/* Seguridad y Contraseña */}
      <Section icon={Lock} title="Seguridad y Acceso">
        <p className="text-xs text-slate-400 mb-4">
          Actualiza tu contraseña de acceso de forma segura.
        </p>
        
        {pwdError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-xl mb-3">
            {pwdError}
          </div>
        )}
        {pwdSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-3 py-2 rounded-xl mb-3">
            {pwdSuccess}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="password"
              placeholder="Nueva contraseña"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
            <input
              type="password"
              placeholder="Confirmar nueva contraseña"
              value={confirmNewPassword}
              onChange={e => setConfirmNewPassword(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs px-4 py-1.5 rounded-lg transition-colors"
            >
              Actualizar contraseña
            </button>
          </div>
        </form>
      </Section>
    </div>
  );
}
