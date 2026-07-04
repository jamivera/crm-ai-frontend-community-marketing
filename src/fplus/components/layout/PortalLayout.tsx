import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Layers, CheckCircle, Sparkles, Megaphone, BarChart3 } from 'lucide-react';
import { useFplusStore } from '../../store';
import type { ContentState } from '../../types';

interface PortalLayoutProps {
  children: React.ReactNode;
  clientName?: string;
  agencyName?: string;
  isPremium?: boolean;
  clientId?: string;
}

const PORTAL_PENDING_STATES: ContentState[] = ['enviado_cliente', 'en_revision_cliente'];

export function PortalLayout({
  children,
  clientName = 'Cliente',
  agencyName = 'FPLUS',
  isPremium = false,
  clientId = '1',
}: PortalLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const contentPieces = useFplusStore(st => st.contentPieces);
  const pendingCount = contentPieces.filter(
    cp => cp.client_id === clientId && PORTAL_PENDING_STATES.includes(cp.estado)
  ).length;

  // Las rutas del portal SIEMPRE incluyen el clientId (/fplus/portal/:clientId/*)
  const base = `/fplus/portal/${clientId}`;
  // Navegación simple: Calendario se eliminó (Cronopost ya cumple esa función)
  // y "Archivos" se convirtió en "Mi Marca" (información estratégica del cliente).
  const navItems = [
    { label: 'Inicio', href: base, icon: Home, exact: true },
    { label: 'Cronopost', href: `${base}/cronopost`, icon: Layers },
    { label: 'Aprobar', href: `${base}/approvals`, icon: CheckCircle, badge: pendingCount },
    { label: 'Pauta', href: `${base}/pauta`, icon: Megaphone },
    { label: 'Mi Marca', href: `${base}/brand`, icon: Sparkles },
    ...(isPremium ? [
      { label: 'Resultados', href: `${base}/metrics`, icon: BarChart3 },
    ] : []),
  ];

  const isActive = (item: typeof navItems[0]) => {
    if ('exact' in item && item.exact) return location.pathname === item.href;
    return location.pathname.startsWith(item.href);
  };

  // El shell de Evo fija body{overflow:hidden}; el portal gestiona su propio
  // scroll con altura de viewport dinámica (100dvh) para móviles.
  return (
    <div className="h-screen supports-[height:100dvh]:h-[100dvh] overflow-y-auto overscroll-contain bg-slate-50 flex flex-col max-w-lg mx-auto relative">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div>
          <div className="text-[11px] text-slate-400 font-medium tracking-wide uppercase">{agencyName}</div>
          <div className="text-sm font-semibold text-slate-800">{clientName}</div>
        </div>
        <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
          {clientName.charAt(0)}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 pb-20 overflow-y-auto">
        {children}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white border-t border-slate-200 flex z-10">
        {navItems.map(item => {
          const active = isActive(item);
          const Icon = item.icon;
          const badge = 'badge' in item ? item.badge : 0;
          return (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors relative ${
                active ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${active ? 'scale-110' : ''}`} />
                {badge != null && badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {badge}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-blue-600 rounded-b-full" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
