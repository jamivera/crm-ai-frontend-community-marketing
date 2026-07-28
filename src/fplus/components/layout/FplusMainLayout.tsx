import React, { useState } from 'react';
import { Bell, Search, ChevronDown, LogOut, Settings, User, FlaskConical, X, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FplusSidebar } from './FplusSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useFplusRole } from '../../hooks/useFplusRole';
import type { FplusRole } from '../../types';
import { useFplusStore } from '../../store';

interface FplusMainLayoutProps {
  children: React.ReactNode;
}

const FALLBACK_ROLE: FplusRole = 'agency_admin';

export function FplusMainLayout({ children }: FplusMainLayoutProps) {
  const { user: evoUser, logout } = useAuth();
  const { fplusRole } = useFplusRole();
  const [demoBannerDismissed, setDemoBannerDismissed] = useState(false);
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const notifications = useFplusStore(s => s.notifications) || [];
  const markNotificationRead = useFplusStore(s => s.markNotificationRead);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Filtrar notificaciones para esta agencia
  const currentAgencyId = (evoUser?.custom_attributes?.fplus_agency_id as string) || 'agency-pd';
  const agencyNotifications = notifications.filter(n => n.agency_id === currentAgencyId);
  const unreadCount = agencyNotifications.filter(n => !n.leido).length;

  const user = {
    name: evoUser?.name ?? evoUser?.display_name ?? 'Usuario',
    email: evoUser?.email ?? '',
    role: fplusRole ?? FALLBACK_ROLE,
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile drawer backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile drawer panel */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl transform transition-transform duration-250 ease-in-out md:hidden
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="absolute top-4 right-4 z-50">
          <button onClick={() => setMobileMenuOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <FplusSidebar role={user.role} agencyName="Mi Agencia" onCloseMobile={() => setMobileMenuOpen(false)} />
      </div>

      {/* Sidebar (Desktop) */}
      <FplusSidebar role={user.role} agencyName="Mi Agencia" />

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top header */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 gap-4 flex-shrink-0">
          {/* Hamburger button for mobile */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors md:hidden"
            title="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
          {/* Search */}
          <div className="flex-1 max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar campañas, tareas, archivos... (Próximamente)"
                disabled
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none cursor-not-allowed placeholder:text-slate-400 opacity-75"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(p => !p)}
                className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                title="Notificaciones"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 top-full mt-1 w-80 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50 max-h-96 overflow-y-auto">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Notificaciones</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">
                        {unreadCount} nuevas
                      </span>
                    )}
                  </div>
                  {agencyNotifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-slate-400 text-xs">
                      No tienes notificaciones
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {agencyNotifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => { markNotificationRead(n.id); setNotificationsOpen(false); }}
                          className={`px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors text-left ${
                            !n.leido ? 'bg-blue-50/30' : ''
                          }`}
                        >
                          <div className="flex justify-between items-start gap-1">
                            <span className="text-xs font-bold text-slate-800">{n.titulo}</span>
                            <span className="text-[9px] text-slate-400">
                              {new Date(n.created_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-1 leading-snug">{n.mensaje}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(p => !p)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                  {user.name.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-semibold text-slate-800 leading-none">{user.name}</div>
                  <div className="text-[11px] text-slate-400 leading-none mt-0.5 capitalize">{user.role.replace('_', ' ')}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <div className="text-sm font-semibold text-slate-800">{user.name}</div>
                    <div className="text-xs text-slate-500 truncate">{user.email}</div>
                  </div>
                  <button
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    onClick={() => { setProfileOpen(false); navigate('/fplus/settings'); }}
                  >
                    <Settings className="w-4 h-4 text-slate-400" /> Configuración
                  </button>
                  <button
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    onClick={() => { setProfileOpen(false); navigate('/fplus/settings/profile'); }}
                  >
                    <User className="w-4 h-4 text-slate-400" /> Mi perfil
                  </button>
                  <div className="border-t border-slate-100 mt-1">
                    <button
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      onClick={() => { setProfileOpen(false); logout(); navigate('/login'); }}
                    >
                      <LogOut className="w-4 h-4" /> Cerrar sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Demo data banner */}
        {!demoBannerDismissed && (
          <div className="flex items-center gap-3 px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs shrink-0">
            <FlaskConical className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <span><strong>Datos de ejemplo.</strong> Los datos que ves son simulados para demostración. Las acciones que realices se guardan durante esta sesión.</span>
            <button onClick={() => setDemoBannerDismissed(true)} className="ml-auto p-0.5 hover:bg-amber-100 rounded">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* Click-away for profile/notification dropdowns */}
      {(profileOpen || notificationsOpen) && (
        <div className="fixed inset-0 z-40" onClick={() => { setProfileOpen(false); setNotificationsOpen(false); }} />
      )}
    </div>
  );
}
