import { Routes, Route, Navigate } from 'react-router-dom';
import { FplusMainLayout } from './components/layout/FplusMainLayout';
import { SuperAdminLayout } from './components/layout/SuperAdminLayout';
import { PortalRouteWrapper } from './pages/Portal/PortalContext';

// Pages — implemented
import Dashboard from './pages/Dashboard';
import ClientList from './pages/Clients/ClientList';
import ClientWorkspace from './pages/Clients/ClientWorkspace';
import ContentList from './pages/Content/ContentList';
import ContentDetail from './pages/Content/ContentDetail';
import NewContentPage from './pages/Content/NewContentPage';
import CampaignList from './pages/Campaigns/CampaignList';
import CampaignDetail from './pages/Campaigns/CampaignDetail';
import NewCampaignPage from './pages/Campaigns/NewCampaignPage';
import CalendarView from './pages/Calendar/CalendarView';
import PublicationList from './pages/Publications/PublicationList';
import PublicationDetail from './pages/Publications/PublicationDetail';
import LeadsPipeline from './pages/Leads/LeadsPipeline';
import SettingsPage from './pages/Settings/SettingsPage';

// Placeholder for modules to be built in next sprints
import Placeholder from './pages/Placeholder';

export default function FplusApp() {
  return (
    <div className="fplus-scope h-full">
    <Routes>
      {/* ── Super Admin (isolated layout) ── */}
      <Route
        path="platform/*"
        element={
          <SuperAdminLayout>
            <Routes>
              <Route path="dashboard" element={<Placeholder />} />
              <Route path="organizations" element={<Placeholder />} />
              <Route path="admins" element={<Placeholder />} />
              <Route path="intelligence" element={<Placeholder />} />
              <Route path="alerts" element={<Placeholder />} />
              <Route path="settings" element={<Placeholder />} />
              <Route path="audit" element={<Placeholder />} />
              <Route path="features" element={<Placeholder />} />
              <Route index element={<Navigate to="dashboard" replace />} />
            </Routes>
          </SuperAdminLayout>
        }
      />

      {/* ── Portal del Cliente (dynamic :clientId) ── */}
      {/* La ruta base del portal SIEMPRE necesita clientId; el redirect relativo
          anterior producía /portal/portal/1 (cliente inexistente). El demo
          redirige al primer cliente; con auth real, SmartRedirect enviará a
          cada usuario cliente a su propio portal. */}
      <Route path="portal" element={<Navigate to="/fplus/portal/cl1" replace />} />
      <Route path="portal/:clientId/*" element={<PortalRouteWrapper />} />

      {/* ── Main App (agency layout) ── */}
      <Route
        path="*"
        element={
          <FplusMainLayout>
            <Routes>
              {/* Dashboard */}
              <Route path="dashboard" element={<Dashboard />} />

              {/* Clients */}
              <Route path="clients" element={<ClientList />} />
              <Route path="clients/new" element={<Placeholder />} />
              <Route path="clients/:id/*" element={<ClientWorkspace />} />

              {/* Campaigns */}
              <Route path="campaigns" element={<CampaignList />} />
              <Route path="campaigns/new" element={<NewCampaignPage />} />
              <Route path="campaigns/:id" element={<CampaignDetail />} />

              {/* Content */}
              <Route path="content" element={<ContentList />} />
              <Route path="content/new" element={<NewContentPage />} />
              <Route path="content/:id" element={<ContentDetail />} />

              {/* Calendar */}
              <Route path="calendar" element={<CalendarView />} />

              {/* Multimedia */}
              <Route path="multimedia" element={<Placeholder />} />

              {/* Approvals */}
              <Route path="approvals" element={<Placeholder />} />

              {/* Publications */}
              <Route path="publications" element={<PublicationList />} />
              <Route path="publications/:id" element={<PublicationDetail />} />

              {/* Leads */}
              <Route path="leads" element={<LeadsPipeline />} />

              {/* Revenue */}
              <Route path="revenue" element={<Placeholder />} />
              <Route path="revenue/pipeline" element={<Placeholder />} />

              {/* Reports */}
              <Route path="reports" element={<Placeholder />} />
              <Route path="reports/client/:id" element={<Placeholder />} />
              <Route path="reports/campaign/:id" element={<Placeholder />} />
              <Route path="reports/team" element={<Placeholder />} />
              <Route path="reports/agency" element={<Placeholder />} />

              {/* Intelligence */}
              <Route path="intelligence" element={<Placeholder />} />

              {/* Settings */}
              <Route path="settings" element={<SettingsPage />} />
              <Route path="settings/team" element={<SettingsPage />} />
              <Route path="settings/profile" element={<SettingsPage />} />

              {/* Default redirect */}
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
          </FplusMainLayout>
        }
      />
    </Routes>
    </div>
  );
}
