import {
  LayoutDashboard, Users, Megaphone, FileImage, Calendar,
  ImageIcon, CheckSquare, Send, TrendingUp, DollarSign,
  BarChart3, Brain, Settings, Building2, ShieldCheck,
  AlertTriangle, Flag, FileText, Home, Clock,
} from 'lucide-react';
import type { FplusRole } from '../../types';

export interface FplusMenuItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  section?: string;
  subItems?: { label: string; href: string }[];
}

type MenuMap = Record<FplusRole, FplusMenuItem[]>;

export const FPLUS_MENU: MenuMap = {
  agency_admin: [
    // PRINCIPAL
    { id: 'dashboard', label: 'Dashboard', href: '/fplus/dashboard', icon: LayoutDashboard, section: 'Principal' },
    { id: 'clients', label: 'Clientes', href: '/fplus/clients', icon: Users, section: 'Principal' },
    { id: 'campaigns', label: 'Campañas', href: '/fplus/campaigns', icon: Megaphone, section: 'Principal' },
    { id: 'content', label: 'Contenido', href: '/fplus/content', icon: FileImage, section: 'Principal' },
    { id: 'calendar', label: 'Calendario', href: '/fplus/calendar', icon: Calendar, section: 'Principal' },
    { id: 'multimedia', label: 'Multimedia', href: '/fplus/multimedia', icon: ImageIcon, section: 'Principal' },
    { id: 'approvals', label: 'Aprobaciones', href: '/fplus/approvals', icon: CheckSquare, section: 'Principal' },
    { id: 'publications', label: 'Publicaciones', href: '/fplus/publications', icon: Send, section: 'Principal' },
    // REVENUE
    { id: 'leads', label: 'Leads & Pipeline', href: '/fplus/leads', icon: TrendingUp, section: 'Revenue' },
    { id: 'revenue', label: 'Revenue Hub', href: '/fplus/revenue', icon: DollarSign, section: 'Revenue' },
    // INTELIGENCIA
    { id: 'reports', label: 'Reportes', href: '/fplus/reports', icon: BarChart3, section: 'Inteligencia' },
    { id: 'intelligence', label: 'Inteligencia', href: '/fplus/intelligence', icon: Brain, section: 'Inteligencia' },
    // SISTEMA
    { id: 'settings', label: 'Configuración', href: '/fplus/settings', icon: Settings, section: 'Sistema' },
  ],

  account_manager: [
    { id: 'dashboard', label: 'Dashboard', href: '/fplus/dashboard', icon: LayoutDashboard, section: 'Principal' },
    { id: 'clients', label: 'Mis Clientes', href: '/fplus/clients', icon: Users, section: 'Principal' },
    { id: 'campaigns', label: 'Campañas', href: '/fplus/campaigns', icon: Megaphone, section: 'Principal' },
    { id: 'content', label: 'Contenido', href: '/fplus/content', icon: FileImage, section: 'Principal' },
    { id: 'calendar', label: 'Calendario', href: '/fplus/calendar', icon: Calendar, section: 'Principal' },
    { id: 'approvals', label: 'Aprobaciones', href: '/fplus/approvals', icon: CheckSquare, section: 'Principal' },
    { id: 'publications', label: 'Publicaciones', href: '/fplus/publications', icon: Send, section: 'Principal' },
    { id: 'leads', label: 'Mis Leads', href: '/fplus/leads', icon: TrendingUp, section: 'Revenue' },
    { id: 'reports', label: 'Mis Reportes', href: '/fplus/reports', icon: BarChart3, section: 'Inteligencia' },
  ],

  media_buyer: [
    { id: 'dashboard', label: 'Dashboard', href: '/fplus/dashboard', icon: LayoutDashboard, section: 'Principal' },
    { id: 'calendar', label: 'Calendario', href: '/fplus/calendar', icon: Calendar, section: 'Principal' },
    { id: 'publications', label: 'Publicaciones', href: '/fplus/publications', icon: Send, section: 'Principal' },
    { id: 'multimedia', label: 'Multimedia', href: '/fplus/multimedia', icon: ImageIcon, section: 'Principal' },
  ],

  content_manager: [
    { id: 'dashboard', label: 'Dashboard', href: '/fplus/dashboard', icon: LayoutDashboard, section: 'Principal' },
    { id: 'content', label: 'Mis Piezas', href: '/fplus/content', icon: FileImage, section: 'Principal' },
    { id: 'approvals', label: 'Mis Revisiones', href: '/fplus/approvals', icon: CheckSquare, section: 'Principal' },
  ],

  designer: [
    { id: 'dashboard', label: 'Dashboard', href: '/fplus/dashboard', icon: LayoutDashboard, section: 'Principal' },
    { id: 'content', label: 'Mis Piezas', href: '/fplus/content', icon: FileImage, section: 'Principal' },
    { id: 'multimedia', label: 'Multimedia', href: '/fplus/multimedia', icon: ImageIcon, section: 'Principal' },
    { id: 'approvals', label: 'Mis Revisiones', href: '/fplus/approvals', icon: CheckSquare, section: 'Principal' },
  ],

  client_standard: [
    { id: 'portal-approvals', label: 'Pendientes', href: '/fplus/portal/approvals', icon: Clock, section: 'Portal' },
    { id: 'portal-history', label: 'Mis Aprobaciones', href: '/fplus/portal/history', icon: CheckSquare, section: 'Portal' },
    { id: 'portal-calendar', label: 'Calendario', href: '/fplus/portal/calendar', icon: Calendar, section: 'Portal' },
  ],

  client_premium: [
    { id: 'portal-approvals', label: 'Pendientes', href: '/fplus/portal/approvals', icon: Clock, section: 'Portal' },
    { id: 'portal-history', label: 'Mis Aprobaciones', href: '/fplus/portal/history', icon: CheckSquare, section: 'Portal' },
    { id: 'portal-calendar', label: 'Calendario', href: '/fplus/portal/calendar', icon: Calendar, section: 'Portal' },
    { id: 'portal-metrics', label: 'Mis Resultados', href: '/fplus/portal/metrics', icon: BarChart3, section: 'Portal' },
    { id: 'portal-campaigns', label: 'Mis Campañas', href: '/fplus/portal/campaigns', icon: Megaphone, section: 'Portal' },
  ],

  super_admin: [
    { id: 'platform-dashboard', label: 'Platform Dashboard', href: '/fplus/platform/dashboard', icon: LayoutDashboard, section: 'Plataforma' },
    { id: 'platform-orgs', label: 'Organizaciones', href: '/fplus/platform/organizations', icon: Building2, section: 'Plataforma' },
    { id: 'platform-admins', label: 'Super Admins', href: '/fplus/platform/admins', icon: ShieldCheck, section: 'Plataforma' },
    { id: 'platform-intelligence', label: 'Platform Intelligence', href: '/fplus/platform/intelligence', icon: Brain, section: 'Plataforma' },
    { id: 'platform-alerts', label: 'Alertas', href: '/fplus/platform/alerts', icon: AlertTriangle, section: 'Plataforma' },
    { id: 'platform-settings', label: 'Configuración', href: '/fplus/platform/settings', icon: Settings, section: 'Sistema' },
    { id: 'platform-audit', label: 'Audit Log', href: '/fplus/platform/audit', icon: FileText, section: 'Sistema' },
    { id: 'platform-flags', label: 'Feature Flags', href: '/fplus/platform/features', icon: Flag, section: 'Sistema' },
  ],
};

export function getMenuForRole(role: FplusRole): FplusMenuItem[] {
  return FPLUS_MENU[role] ?? FPLUS_MENU.account_manager;
}

export function getMenuSections(items: FplusMenuItem[]): string[] {
  const seen = new Set<string>();
  return items
    .map(i => i.section ?? '')
    .filter(s => s && !seen.has(s) && seen.add(s) as unknown as boolean);
}
