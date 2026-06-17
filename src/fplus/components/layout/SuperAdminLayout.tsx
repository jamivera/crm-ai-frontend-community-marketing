import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, ShieldCheck, Brain,
  AlertTriangle, Settings, FileText, Flag, LogOut,
} from 'lucide-react';

const PLATFORM_NAV = [
  { label: 'Dashboard', href: '/fplus/platform/dashboard', icon: LayoutDashboard, section: 'Plataforma' },
  { label: 'Organizaciones', href: '/fplus/platform/organizations', icon: Building2, section: 'Plataforma' },
  { label: 'Super Admins', href: '/fplus/platform/admins', icon: ShieldCheck, section: 'Plataforma' },
  { label: 'Platform Intelligence', href: '/fplus/platform/intelligence', icon: Brain, section: 'Plataforma' },
  { label: 'Alertas', href: '/fplus/platform/alerts', icon: AlertTriangle, section: 'Plataforma' },
  { label: 'Configuración', href: '/fplus/platform/settings', icon: Settings, section: 'Sistema' },
  { label: 'Audit Log', href: '/fplus/platform/audit', icon: FileText, section: 'Sistema' },
  { label: 'Feature Flags', href: '/fplus/platform/features', icon: Flag, section: 'Sistema' },
];

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

export function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href + '/');
  const sections = [...new Set(PLATFORM_NAV.map(i => i.section))];

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 flex flex-col border-r border-slate-700">
        {/* Logo */}
        <div className="h-14 flex items-center px-4 gap-3 border-b border-slate-700">
          <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">F+</span>
          </div>
          <div>
            <div className="text-white text-sm font-semibold leading-none">FPLUS</div>
            <div className="text-slate-400 text-[10px] leading-none mt-0.5">Super Admin</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
          {sections.map(section => (
            <div key={section}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-2 mb-1">{section}</p>
              <ul className="space-y-0.5">
                {PLATFORM_NAV.filter(i => i.section === section).map(item => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <button
                        onClick={() => navigate(item.href)}
                        className={`w-full flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors ${
                          active
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="border-t border-slate-700 p-2">
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors">
            <LogOut className="w-4 h-4" />
            Salir
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">Platform Admin</span>
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
