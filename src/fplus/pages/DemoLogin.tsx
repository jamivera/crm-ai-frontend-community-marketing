import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

// Login genérico para el entorno de pruebas (VITE_FPLUS_DEMO=true).
// Credenciales: admin / admin. Se reemplazará por la autenticación real
// de Evo CRM al conectar el backend.

export default function DemoLogin() {
  const navigate = useNavigate();
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');

  // Sesión demo ya iniciada → directo al dashboard
  if (sessionStorage.getItem('fplus-demo-auth') === 'true') {
    return <Navigate to="/fplus/dashboard" replace />;
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user.trim() === 'admin' && pass === 'admin') {
      sessionStorage.setItem('fplus-demo-auth', 'true');
      navigate('/fplus/dashboard', { replace: true });
    } else {
      setError('Credenciales incorrectas. Usa admin / admin en el entorno de pruebas.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1428] via-[#0f1e3c] to-[#0a1428] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">FPLUS</span>
          </div>
          <p className="text-xs text-blue-300/70 mt-2">Plataforma de gestión de contenido · Primero Digital</p>
        </div>

        <form onSubmit={submit} className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 space-y-4">
          <div>
            <h1 className="text-lg font-bold text-white">Iniciar sesión</h1>
            <p className="text-xs text-blue-200/60 mt-0.5">Entorno de pruebas — Beta Privada</p>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-blue-200/70 uppercase tracking-wide mb-1.5">
              Usuario
            </label>
            <input
              type="text"
              value={user}
              onChange={e => setUser(e.target.value)}
              placeholder="admin"
              autoFocus
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-blue-200/70 uppercase tracking-wide mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              value={pass}
              onChange={e => setPass(e.target.value)}
              placeholder="••••••"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-blue-400"
            />
          </div>

          {error && (
            <p className="text-xs text-red-300 bg-red-500/10 border border-red-400/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
          >
            Ingresar
          </button>

          <p className="text-[10px] text-center text-blue-200/40">
            Acceso de demostración: <strong className="text-blue-200/70">admin / admin</strong>
          </p>
        </form>
      </div>
    </div>
  );
}
