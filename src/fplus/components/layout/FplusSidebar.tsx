import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { FplusRole } from '../../types';
import { getMenuForRole, getMenuSections } from './FplusMenuItems';
import { useFplusRole } from '../../hooks/useFplusRole';

interface FplusSidebarProps {
  role: FplusRole;
  agencyName?: string;
  onCloseMobile?: () => void;
}

export function FplusSidebar({ role, agencyName = 'Jamil Vera Technologies', onCloseMobile }: FplusSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('fplus-sidebar-collapsed');
    if (saved) setCollapsed(JSON.parse(saved));
  }, []);

  const toggle = () => {
    setCollapsed(prev => {
      localStorage.setItem('fplus-sidebar-collapsed', JSON.stringify(!prev));
      return !prev;
    });
  };

  const { clientId, isClient } = useFplusRole();
  const items = getMenuForRole(role);
  const sections = getMenuSections(items);

  const resolvePortalHref = (href: string) => {
    return isClient && clientId && href.startsWith('/fplus/portal/')
      ? href.replace('/fplus/portal/', `/fplus/portal/${clientId}/`)
      : href;
  };

  const isActive = (href: string) => {
    const resolved = resolvePortalHref(href);
    return location.pathname === resolved || location.pathname.startsWith(resolved + '/');
  };

  const handleNavigate = (href: string) => {
    navigate(resolvePortalHref(href));
    onCloseMobile?.();
  };

  return (
    <aside
      className={`
        flex flex-col flex-shrink-0 border-r border-slate-200 bg-white
        transition-all duration-200 ease-in-out h-full
        ${onCloseMobile ? 'w-full' : 'hidden md:flex'}
        ${!onCloseMobile && collapsed ? 'w-16' : !onCloseMobile ? 'w-60' : ''}
      `}
    >
      {/* Logo / agency name */}
      <div className={`flex items-center h-14 border-b border-slate-100 px-4 gap-3 flex-shrink-0`}>
        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">JV</span>
        </div>
        {(!collapsed || onCloseMobile) && (
          <span className="text-sm font-semibold text-slate-800 truncate">{agencyName}</span>
        )}
      </div>

      {/* Menu Header Label */}
      {(!collapsed || onCloseMobile) && (
        <div className="px-5 pt-4 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Menú
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
        {sections.map(section => {
          const sectionItems = items.filter(i => i.section === section);
          return (
            <div key={section}>
              {(!collapsed || onCloseMobile) && (
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-2 mb-1">
                  {section}
                </p>
              )}
              <ul className="space-y-0.5">
                {sectionItems.map(item => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => handleNavigate(item.href)}
                        title={collapsed && !onCloseMobile ? item.label : undefined}
                        className={`
                          w-full flex items-center gap-3 rounded-lg px-2 py-2 text-sm
                          transition-colors duration-100 cursor-pointer
                          ${active
                            ? 'bg-blue-50 text-blue-700 font-semibold'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }
                          ${collapsed && !onCloseMobile ? 'justify-center' : ''}
                        `}
                      >
                        <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                        {(!collapsed || onCloseMobile) && (
                          <span className="truncate">{item.label}</span>
                        )}
                        {(!collapsed || onCloseMobile) && item.badge !== undefined && item.badge > 0 && (
                          <span className="ml-auto text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5 leading-none">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Collapse toggle (only show on desktop) */}
      {!onCloseMobile && (
        <div className="border-t border-slate-100 p-2 flex-shrink-0">
          <button
            onClick={toggle}
            className="w-full flex items-center justify-center gap-2 py-2 px-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors text-xs"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Colapsar</span>
              </>
            )}
          </button>
        </div>
      )}
    </aside>
  );
}
