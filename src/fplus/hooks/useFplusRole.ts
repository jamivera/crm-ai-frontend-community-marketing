import { useAuth } from '@/contexts/AuthContext';
import type { UserResponse } from '@/types/auth';
import type { FplusRole } from '../types';

const FPLUS_ROLES = new Set<string>([
  'agency_admin', 'account_manager', 'content_manager',
  'designer', 'media_buyer', 'super_admin',
  'client_standard', 'client_premium',
]);

const CLIENT_ROLES = new Set<FplusRole>(['client_standard', 'client_premium']);

const LANDINGS: Partial<Record<FplusRole, string>> = {
  agency_admin:    '/fplus/dashboard',
  account_manager: '/fplus/dashboard',
  super_admin:     '/fplus/platform/dashboard',
  content_manager: '/fplus/content?mio=true',
  designer:        '/fplus/content?mio=true',
  media_buyer:     '/fplus/publications',
};

export function toFplusRole(user: UserResponse | null): FplusRole | null {
  if (!user) return null;

  // 1. custom_attributes.fplus_role — campo de producción asignado en Evo CRM
  const custom = user.custom_attributes?.fplus_role as string | undefined;
  if (custom && FPLUS_ROLES.has(custom)) return custom as FplusRole;

  // 2. Fallback por role.key: administrator → agency_admin, agent sin fplus_role → null (CRM puro)
  if (user.role?.key === 'administrator') return 'agency_admin';
  return null;
}

export function useFplusRole(): {
  fplusRole: FplusRole | null;
  hasFplusAccess: boolean;
  isClient: boolean;
  landingPath: string;
  clientId: string | null;
} {
  const { user } = useAuth();
  const fplusRole = toFplusRole(user);
  const isClient = fplusRole !== null && CLIENT_ROLES.has(fplusRole);
  const clientId = (user?.custom_attributes?.fplus_client_id as string) ?? null;

  const landingPath = (() => {
    if (!fplusRole) return '/conversations';
    if (isClient) return clientId ? `/fplus/portal/${clientId}` : '/fplus/portal';
    return LANDINGS[fplusRole] ?? '/fplus/dashboard';
  })();

  return { fplusRole, hasFplusAccess: fplusRole !== null, isClient, landingPath, clientId };
}
