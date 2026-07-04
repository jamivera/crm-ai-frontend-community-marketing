import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { useFplusStore } from './../store';

// Activación del Portal del Cliente (enlace seguro del correo de invitación).
// El cliente crea su contraseña en el primer ingreso y entra directo a su
// portal. En producción este flujo lo respalda Supabase Auth + user_invitations;
// la pantalla y la experiencia son las mismas.

export default function PortalActivation() {
  const { token = '' } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const clients = useFplusStore(s => s.clients);
  const updateClient = useFplusStore(s => s.updateClient);

  const client = clients.find(c => c.portal_invitacion?.token === token);

  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  if (!client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a1428] via-[#0f1e3c] to-[#0a1428] flex items-center justify-center p-4">
        <div className="text-center text-white/70">
          <p className="text-sm font-medium">Enlace de invitación no válido o expirado.</p>
          <p className="text-xs mt-1.5 text-white/40">Solicita una nueva invitación a tu agencia.</p>
        </div>
      </div>
    );
  }

  const activar = (e: React.FormEvent) => {
    e.preventDefault();
    if (pass.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return; }
    if (pass !== pass2) { setError('Las contraseñas no coinciden.'); return; }
    updateClient(client.id, {
      portal_invitacion: {
        ...client.portal_invitacion!,
        aceptada_at: new Date().toISOString(),
        password_demo: pass,
      },
    });
    setDone(true);
    setTimeout(() => navigate(`/fplus/portal/${client.id}`, { replace: true }), 1800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1428] via-[#0f1e3c] to-[#0a1428] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">FPLUS</span>
          </div>
          <p className="text-xs text-blue-300/70 mt-2">Portal del Cliente · Primero Digital</p>
        </div>

        {done ? (
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <p className="text-white font-semibold text-sm">¡Cuenta activada!</p>
            <p className="text-blue-200/60 text-xs mt-1.5">Entrando a tu portal…</p>
          </div>
        ) : (
          <form onSubmit={activar} className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 space-y-4">
            <div>
              <h1 className="text-lg font-bold text-white">¡Bienvenido, {client.nombre}!</h1>
              <p className="text-xs text-blue-200/60 mt-0.5">
                Crea tu contraseña para acceder a tu Portal del Cliente.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-blue-200/70 uppercase tracking-wide mb-1.5">
                Nueva contraseña
              </label>
              <input
                type="password"
                value={pass}
                onChange={e => setPass(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                autoFocus
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-blue-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-blue-200/70 uppercase tracking-wide mb-1.5">
                Confirmar contraseña
              </label>
              <input
                type="password"
                value={pass2}
                onChange={e => setPass2(e.target.value)}
                placeholder="Repite la contraseña"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-blue-400"
              />
            </div>

            {error && (
              <p className="text-xs text-red-300 bg-red-500/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
            >
              Activar mi cuenta
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
