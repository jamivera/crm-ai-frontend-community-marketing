import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toFplusRole } from '@/fplus/hooks/useFplusRole';
import type { FplusRole } from '@/fplus/types';

const CLIENT_ROLES = new Set<FplusRole>(['client_standard', 'client_premium']);

const LANDINGS: Partial<Record<FplusRole, string>> = {
  agency_admin:    '/fplus/dashboard',
  account_manager: '/fplus/dashboard',
  super_admin:     '/fplus/platform/dashboard',
  content_manager: '/fplus/content?mio=true',
  designer:        '/fplus/content?mio=true',
  media_buyer:     '/fplus/publications',
};

const SmartRedirect = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const fplusRole = toFplusRole(user);

  if (!fplusRole) {
    // Evo CRM puro — sin acceso FPLUS
    return <Navigate to="/conversations" replace />;
  }

  if (CLIENT_ROLES.has(fplusRole)) {
    const clientId = user.custom_attributes?.fplus_client_id as string | undefined;
    const dest = clientId ? `/fplus/portal/${clientId}` : '/fplus/portal';
    return <Navigate to={dest} replace />;
  }

  return <Navigate to={LANDINGS[fplusRole] ?? '/fplus/dashboard'} replace />;
};

export default SmartRedirect;
