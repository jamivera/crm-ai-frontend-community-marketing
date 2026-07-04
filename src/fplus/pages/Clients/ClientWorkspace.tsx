import React from 'react';
import { Routes, Route, Navigate, useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, LayoutDashboard, CalendarDays, Grid3X3, Image,
  CheckSquare, MessageSquare, Clock, Megaphone, BookOpen,
  AlertCircle, FileText, BarChart3, ExternalLink,
} from 'lucide-react';
import { useFplusStore } from '../../store';
import { usePortalContext, PortalContextProvider } from '../Portal/PortalContext';
import PortalDashboard from '../Portal/PortalDashboard';
import Cronopost from '../Portal/Cronopost';
import { PortalApprovalsList, PortalApprovalDetail } from '../Portal/PortalApprovals';
import PortalCalendar from '../Portal/PortalCalendar';
import PortalMultimedia from '../Portal/PortalMultimedia';
import BriefMaestro from './BriefMaestro';
import ClientContract from './ClientContract';
import ClientMetrics from './ClientMetrics';
import ClientCampaigns from './ClientCampaigns';
import Placeholder from '../Placeholder';
import { EmptyState } from '../../components/ui/EmptyState';

// ─── Sub-nav tabs ─────────────────────────────────────────────────────────────

interface WorkspaceTab {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
}

// Orden según el flujo real de la agencia:
// Calendario (planificación) → Cronopost (editorial) → Multimedia (archivos) → Aprobación → Métricas
const WORKSPACE_TABS: WorkspaceTab[] = [
  { id: 'dashboard',  label: 'Dashboard',    icon: LayoutDashboard, path: '' },
  { id: 'calendar',   label: 'Calendario',   icon: Grid3X3,         path: 'calendar' },
  { id: 'cronopost',  label: 'Cronopost',    icon: CalendarDays,    path: 'cronopost' },
  { id: 'multimedia', label: 'Multimedia',   icon: Image,           path: 'multimedia' },
  { id: 'approvals',  label: 'Aprobaciones', icon: CheckSquare,     path: 'approvals' },
  { id: 'comments',   label: 'Comentarios',  icon: MessageSquare,   path: 'comments' },
  { id: 'history',    label: 'Historial',    icon: Clock,           path: 'history' },
  // El Brief va ANTES de Campañas: la estrategia no puede construirse
  // sin conocer al cliente. Campañas queda bloqueado hasta completar el Brief.
  { id: 'brief',      label: 'Brief',        icon: BookOpen,        path: 'brief' },
  { id: 'campaigns',  label: 'Campañas',     icon: Megaphone,       path: 'campaigns' },
  { id: 'contract',   label: 'Contrato',     icon: FileText,        path: 'contract' },
  { id: 'metrics',    label: 'Métricas',     icon: BarChart3,       path: 'metrics' },
];

// ─── Workspace layout shell ───────────────────────────────────────────────────

function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { clientId, clientNombre } = usePortalContext();
  const contentPieces = useFplusStore(s => s.contentPieces);
  const client = useFplusStore(s => s.clients.find(c => c.id === clientId));

  const pendientes = contentPieces.filter(
    cp => cp.client_id === clientId &&
    (cp.estado === 'enviado_cliente' || cp.estado === 'en_revision_cliente')
  ).length;

  const basePath = `/fplus/clients/${clientId}`;

  const isActive = (tabPath: string) => {
    if (tabPath === '') {
      return location.pathname === basePath || location.pathname === basePath + '/';
    }
    return location.pathname.startsWith(`${basePath}/${tabPath}`);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Workspace header */}
      <div className="flex-shrink-0 bg-[#0f1e3c] text-white">
        <div className="px-6 py-3 flex items-center gap-4">
          <button
            onClick={() => navigate('/fplus/clients')}
            className="flex items-center gap-1.5 text-xs text-blue-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Clientes
          </button>
          <div className="w-px h-4 bg-white/10" />
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-sm font-bold flex-shrink-0">
            {clientNombre.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold leading-none">{clientNombre}</h2>
            {client && (
              <p className="text-[11px] text-blue-300 mt-0.5">
                {client.empresa ?? client.industria}
                {client.plan_contratado && (
                  <span className="ml-2 bg-white/10 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide">
                    {client.plan_contratado}
                  </span>
                )}
              </p>
            )}
          </div>
          {pendientes > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-medium px-3 py-1 rounded-full">
              <AlertCircle className="w-3 h-3" />
              {pendientes} por aprobar
            </div>
          )}
          <a
            href={`/fplus/portal/${clientId}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/10 text-blue-200 text-xs font-medium px-3 py-1 rounded-full transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Portal Cliente
          </a>
        </div>

        {/* Sub-tabs */}
        <div className="flex overflow-x-auto scrollbar-none border-t border-white/10">
          {WORKSPACE_TABS.map(tab => {
            const active = isActive(tab.path);
            const Icon = tab.icon;
            const isApprovals = tab.id === 'approvals';
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path === '' ? basePath : `${basePath}/${tab.path}`)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors flex-shrink-0 ${
                  active
                    ? 'text-white border-blue-400 bg-white/5'
                    : 'text-blue-300/70 border-transparent hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                {tab.label}
                {isApprovals && pendientes > 0 && (
                  <span className="bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                    {pendientes}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content area — scrollable */}
      <div className="flex-1 overflow-y-auto bg-slate-50">
        {children}
      </div>
    </div>
  );
}

// ─── Entry point ──────────────────────────────────────────────────────────────

export default function ClientWorkspace() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const client = useFplusStore(s => s.clients.find(c => c.id === id));

  if (!client) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate('/fplus/clients')}
          className="flex items-center gap-2 text-sm text-blue-600 hover:underline mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a clientes
        </button>
        <EmptyState title="Cliente no encontrado" description="El cliente que buscas no existe o fue eliminado." />
      </div>
    );
  }

  return (
    <PortalContextProvider clientId={id} clientNombre={client.nombre} isPremium={['premium', 'enterprise', 'oro', 'platinum'].includes(client.plan_contratado ?? '')}>
      <WorkspaceShell>
        <Routes>
          <Route index element={<PortalDashboard />} />
          <Route path="cronopost" element={<Cronopost canCreate />} />
          <Route path="calendar" element={<PortalCalendar canCreate />} />
          <Route path="multimedia" element={<PortalMultimedia canCreate />} />
          <Route path="approvals" element={<PortalApprovalsList />} />
          <Route path="approvals/:id" element={<PortalApprovalDetail />} />
          <Route path="comments" element={<Placeholder />} />
          <Route path="history" element={<Placeholder />} />
          <Route path="campaigns" element={<ClientCampaigns />} />
          <Route path="brief" element={<BriefMaestro />} />
          <Route path="contract" element={<ClientContract />} />
          <Route path="metrics" element={<ClientMetrics />} />
          <Route path="*" element={<Navigate to="" replace />} />
        </Routes>
      </WorkspaceShell>
    </PortalContextProvider>
  );
}
