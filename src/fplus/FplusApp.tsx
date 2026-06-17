import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { FplusMainLayout } from './components/layout/FplusMainLayout';
import { PortalLayout } from './components/layout/PortalLayout';
import { SuperAdminLayout } from './components/layout/SuperAdminLayout';

// Pages — implemented
import Dashboard from './pages/Dashboard';
import ClientList from './pages/Clients/ClientList';
import ClientDetail from './pages/Clients/ClientDetail';
import ContentList from './pages/Content/ContentList';
import ContentDetail from './pages/Content/ContentDetail';
import CampaignList from './pages/Campaigns/CampaignList';
import CampaignDetail from './pages/Campaigns/CampaignDetail';
import CalendarView from './pages/Calendar/CalendarView';
import PublicationList from './pages/Publications/PublicationList';
import LeadsPipeline from './pages/Leads/LeadsPipeline';
// Portal screens
import PortalDashboard from './pages/Portal/PortalDashboard';
import Cronopost from './pages/Portal/Cronopost';
import { PortalApprovalsList, PortalApprovalDetail } from './pages/Portal/PortalApprovals';
import PortalCalendar from './pages/Portal/PortalCalendar';
import PortalMultimedia from './pages/Portal/PortalMultimedia';

// Placeholder for modules to be built in next sprints
import Placeholder from './pages/Placeholder';

export default function FplusApp() {
  return (
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

      {/* ── Portal del Cliente (isolated layout) ── */}
      <Route
        path="portal/*"
        element={
          <PortalLayout clientName="Clínica Smile" agencyName="Mi Agencia" isPremium={false} clientId="1">
            <Routes>
              <Route index element={<PortalDashboard />} />
              <Route path="cronopost" element={<Cronopost />} />
              <Route path="approvals" element={<PortalApprovalsList />} />
              <Route path="approvals/:id" element={<PortalApprovalDetail />} />
              <Route path="calendar" element={<PortalCalendar />} />
              <Route path="multimedia" element={<PortalMultimedia />} />
              <Route path="metrics" element={<Placeholder />} />
              <Route path="profile" element={<Placeholder />} />
            </Routes>
          </PortalLayout>
        }
      />

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
              <Route path="clients/:id" element={<ClientDetail />} />
              <Route path="clients/:id/brief" element={<Placeholder />} />

              {/* Campaigns */}
              <Route path="campaigns" element={<CampaignList />} />
              <Route path="campaigns/new" element={<Placeholder />} />
              <Route path="campaigns/:id" element={<CampaignDetail />} />

              {/* Content */}
              <Route path="content" element={<ContentList />} />
              <Route path="content/new" element={<Placeholder />} />
              <Route path="content/:id" element={<ContentDetail />} />

              {/* Calendar */}
              <Route path="calendar" element={<CalendarView />} />

              {/* Multimedia */}
              <Route path="multimedia" element={<Placeholder />} />

              {/* Approvals */}
              <Route path="approvals" element={<Placeholder />} />

              {/* Publications */}
              <Route path="publications" element={<PublicationList />} />

              {/* Leads */}
              <Route path="leads" element={<LeadsPipeline />} />
              <Route path="leads/list" element={<LeadsPipeline />} />

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
              <Route path="settings" element={<Placeholder />} />
              <Route path="settings/team" element={<Placeholder />} />
              <Route path="settings/profile" element={<Placeholder />} />
              <Route path="settings/billing" element={<Placeholder />} />

              {/* Default redirect */}
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
          </FplusMainLayout>
        }
      />
    </Routes>
  );
}
