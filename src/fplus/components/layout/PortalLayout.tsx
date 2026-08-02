import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Layers, CheckCircle, Sparkles, BarChart3, LogOut, ChevronLeft, Bell } from 'lucide-react';
import { useFplusStore } from '../../store';
import { clientIncludesRedes, clientIncludesPauta } from '../../utils/clientHelpers';
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
  agencyName = 'Jamil Vera Technologies',
  isPremium = false,
  clientId = '1',
}: PortalLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const client = useFplusStore(st => st.clients.find(c => c.id === clientId));
  const hasRedes = client ? clientIncludesRedes(client) : true;
  const hasPauta = client ? clientIncludesPauta(client) : true;

  const contentPieces = useFplusStore(st => st.contentPieces);
  const pendingCount = contentPieces.filter(
    cp => cp.client_id === clientId && PORTAL_PENDING_STATES.includes(cp.estado)
  ).length;

  const notifications = useFplusStore(st => st.notifications) || [];
  const markNotificationRead = useFplusStore(st => st.markNotificationRead);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const clientNotifications = notifications.filter(n => n.client_id === clientId && n.destinatario === 'cliente');
  const unreadClientCount = clientNotifications.filter(n => !n.leido).length;

  // Las rutas del portal SIEMPRE incluyen el clientId (/fplus/portal/:clientId/*)
  const base = `/fplus/portal/${clientId}`;
  
  const navItems = [
    { label: 'Inicio', href: base, icon: Home, exact: true },
    ...(hasRedes ? [
      { label: 'Multimedia', href: `${base}/multimedia`, icon: Layers },
      { label: 'Aprobar', href: `${base}/approvals`, icon: CheckCircle, badge: pendingCount },
    ] : []),
    { label: 'Mi Marca', href: `${base}/brand`, icon: Sparkles },
    ...(isPremium && hasPauta ? [
      { label: 'Resultados', href: `${base}/metrics`, icon: BarChart3 },
    ] : []),
  ];

  const isActive = (item: typeof navItems[0]) => {
    if ('exact' in item && item.exact) return location.pathname === item.href;
    return location.pathname.startsWith(item.href);
  };

  const isRootPath = location.pathname === base;
  const handleHeaderBack = () => {
    navigate(base);
  };

  // El shell de Evo fija body{overflow:hidden}; el portal gestiona su propio
  // scroll con altura de viewport dinámica (100dvh) para móviles.
  return (
    <div className="h-screen supports-[height:100dvh]:h-[100dvh] overflow-y-auto overscroll-contain bg-slate-50 flex flex-col md:max-w-6xl max-w-lg mx-auto relative w-full shadow-sm">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-3 md:py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          {!isRootPath && (
            <button
              onClick={handleHeaderBack}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors animate-fade-in"
              title="Volver al inicio"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="text-[11px] text-slate-400 font-medium tracking-wide uppercase">{agencyName}</div>
            <div className="text-sm font-semibold text-slate-800">{clientName}</div>
          </div>
          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center gap-1.5 ml-8 border-l border-slate-100 pl-6">
            {navItems.map(item => {
              const active = isActive(item);
              const Icon = item.icon;
              return (
                <button
                  key={item.href}
                  onClick={() => navigate(item.href)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
                    active ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(p => !p)}
              className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
              title="Notificaciones"
            >
              <Bell className="w-4 h-4" />
              {unreadClientCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>
 
            {notificationsOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-1 z-50 max-h-80 overflow-y-auto">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Notificaciones</span>
                  {unreadClientCount > 0 && (
                    <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">
                      {unreadClientCount} nuevas
                    </span>
                  )}
                </div>
                {clientNotifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-slate-400 text-xs">
                    No tienes notificaciones
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {[...clientNotifications].reverse().map(n => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markNotificationRead(n.id);
                          setNotificationsOpen(false);
                        }}
                        className={`px-4 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors text-left ${
                          !n.leido ? 'bg-blue-50/20' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-xs font-bold text-slate-800">{n.titulo}</span>
                          <span className="text-[8px] text-slate-400 shrink-0">
                            {new Date(n.created_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">{n.mensaje}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
 
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
            {clientName.charAt(0)}
          </div>
          <button
            onClick={() => {
              if (window.confirm('¿Cerrar sesión del portal?')) {
                sessionStorage.removeItem('fplus-demo-auth');
                navigate('/login');
              }
            }}
            title="Cerrar sesión"
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>
 
      {/* Content */}
      <main className="flex-1 pb-20 overflow-y-auto">
        {children}
      </main>
 
      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white border-t border-slate-200 flex z-10 md:hidden">
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
