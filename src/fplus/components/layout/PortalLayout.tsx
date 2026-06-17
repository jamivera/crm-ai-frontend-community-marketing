import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Clock, CheckSquare, Calendar, BarChart3, Megaphone, User } from 'lucide-react';

interface PortalLayoutProps {
  children: React.ReactNode;
  clientName?: string;
  agencyName?: string;
  isPremium?: boolean;
}

export function PortalLayout({ children, clientName = 'Cliente', agencyName = 'FPLUS', isPremium = false }: PortalLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { label: 'Pendientes', href: '/fplus/portal/approvals', icon: Clock },
    { label: 'Aprobados', href: '/fplus/portal/history', icon: CheckSquare },
    { label: 'Calendario', href: '/fplus/portal/calendar', icon: Calendar },
    ...(isPremium ? [
      { label: 'Resultados', href: '/fplus/portal/metrics', icon: BarChart3 },
      { label: 'Campañas', href: '/fplus/portal/campaigns', icon: Megaphone },
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div>
          <div className="text-xs text-slate-400">{agencyName}</div>
          <div className="text-sm font-semibold text-slate-800">{clientName}</div>
        </div>
        <button className="p-2 rounded-full bg-slate-100 text-slate-600">
          <User className="w-4 h-4" />
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 pb-20">
        {children}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white border-t border-slate-200 flex">
        {navItems.map(item => {
          const active = location.pathname === item.href;
          const Icon = item.icon;
          return (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors ${active ? 'text-blue-600' : 'text-slate-400'}`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
