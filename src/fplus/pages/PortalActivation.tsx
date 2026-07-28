import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sparkles, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { getSupabase } from './../services/supabaseClient';
import { useFplusStore } from './../store';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export default function PortalActivation() {
  const { token = '' } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const clients = useFplusStore(s => s.clients);
  const updateClient = useFplusStore(s => s.updateClient);
  const addProjectHistoryEvent = useFplusStore(s => s.addProjectHistoryEvent);

  const client = clients.find(c => c.portal_invitacion?.token === token);
  const isExpired = client?.portal_invitacion?.expira_at
    ? new Date(client.portal_invitacion.expira_at).getTime() < Date.now()
    : false;

  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  if (!client || isExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a1428] via-[#0f1e3c] to-[#0a1428] flex items-center justify-center p-4">
        <div className="text-center text-white/70 bg-white/5 border border-white/10 rounded-2xl p-8 max-w-sm">
          <p className="text-sm font-semibold text-red-300">Enlace de activación no válido o expirado</p>
          <p className="text-xs mt-2 text-white/50 leading-relaxed">
            Por motivos de seguridad, los enlaces de invitación expiran después de 48 horas. Solicita a tu Account Manager que te envíe una nueva invitación.
          </p>
        </div>
      </div>
    );
  }

  const activar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!PASSWORD_REGEX.test(pass)) {
      setError('La contraseña debe tener al menos 8 caracteres e incluir una mayúscula, un número y un carácter especial (@$!%*?&).');
      return;
    }
    if (pass !== pass2) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    const sb = getSupabase();
    if (sb) {
      const { error: authErr } = await sb.auth.updateUser({ password: pass });
      if (authErr) {
        setError(authErr.message);
        return;
      }
    } else {
      // Simulación local en local storage sin password_demo
      const simulatedPasswords = JSON.parse(localStorage.getItem('fplus-simulated-auth') || '{}');
      simulatedPasswords[client.portal_invitacion!.email.toLowerCase()] = pass;
      localStorage.setItem('fplus-simulated-auth', JSON.stringify(simulatedPasswords));
    }

    updateClient(client.id, {
      portal_invitacion: {
        ...client.portal_invitacion!,
        aceptada_at: new Date().toISOString(),
      },
    });
    addProjectHistoryEvent(
      client.id,
      client.nombre,
      'invitacion',
      'Invitación aceptada. Portal activado y contraseña de acceso configurada.'
    );
    
    // Inyectar datos en sessionStorage para iniciar la sesión automáticamente
    sessionStorage.setItem('fplus-demo-auth', 'true');
    sessionStorage.setItem('fplus-demo-role', 'client');
    sessionStorage.setItem('fplus-demo-client-id', client.id);

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
          <p className="text-xs text-blue-300/70 mt-2">Portal del Cliente · {client?.agency_name || 'Tu Agencia'}</p>
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
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={pass}
                  onChange={e => setPass(e.target.value)}
                  placeholder="Min. 8 carac. (1 Mayús, 1 Núm, 1 Especial)"
                  autoFocus
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-blue-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-blue-200/70 uppercase tracking-wide mb-1.5">
                Confirmar contraseña
              </label>
              <div className="relative">
                <input
                  type={showPass2 ? 'text' : 'password'}
                  value={pass2}
                  onChange={e => setPass2(e.target.value)}
                  placeholder="Repite la contraseña"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-blue-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPass2(!showPass2)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                >
                  {showPass2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
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
