import React, { createContext, useContext } from 'react';
import { useParams, Navigate, Routes, Route } from 'react-router-dom';
import { useFplusStore } from '../../store';
import { PortalLayout } from '../../components/layout/PortalLayout';
import PortalDashboard from './PortalDashboard';
import Cronopost from './Cronopost';
import { PortalApprovalsList, PortalApprovalDetail } from './PortalApprovals';
import PortalCalendar from './PortalCalendar';
import PortalMultimedia from './PortalMultimedia';
import Placeholder from '../Placeholder';

// ─── Context ─────────────────────────────────────────────────────────────────

interface PortalContextValue {
  clientId: string;
  clientNombre: string;
  isPremium: boolean;
}

const PortalContext = createContext<PortalContextValue>({
  clientId: '1',
  clientNombre: 'Cliente',
  isPremium: false,
});

export const usePortalContext = () => useContext(PortalContext);

export function PortalContextProvider({ clientId, clientNombre, isPremium, children }: PortalContextValue & { children: React.ReactNode }) {
  return (
    <PortalContext.Provider value={{ clientId, clientNombre, isPremium }}>
      {children}
    </PortalContext.Provider>
  );
}

// ─── Wrapper (sets context, renders layout + nested routes) ──────────────────

export function PortalRouteWrapper() {
  const { clientId = '1' } = useParams<{ clientId: string }>();
  const client = useFplusStore(s => s.clients.find(c => c.id === clientId));

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8">
          <p className="text-slate-500 text-sm">Portal no encontrado.</p>
          <p className="text-xs text-slate-400 mt-1">Verifica el link con tu agencia.</p>
        </div>
      </div>
    );
  }

  const isPremium = false; // future: client.plan === 'premium'

  return (
    <PortalContext.Provider value={{ clientId, clientNombre: client.nombre, isPremium }}>
      <PortalLayout
        clientName={client.nombre}
        agencyName="Mi Agencia"
        isPremium={isPremium}
        clientId={clientId}
      >
        <Routes>
          <Route index element={<PortalDashboard />} />
          <Route path="cronopost" element={<Cronopost />} />
          <Route path="approvals" element={<PortalApprovalsList />} />
          <Route path="approvals/:id" element={<PortalApprovalDetail />} />
          <Route path="calendar" element={<PortalCalendar />} />
          <Route path="multimedia" element={<PortalMultimedia />} />
          <Route path="metrics" element={<Placeholder />} />
          <Route path="profile" element={<Placeholder />} />
          <Route path="*" element={<Navigate to="" replace />} />
        </Routes>
      </PortalLayout>
    </PortalContext.Provider>
  );
}
