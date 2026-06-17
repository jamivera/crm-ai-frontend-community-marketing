import type { ContentState, ContentType, Platform, LeadState, FplusRole } from '../types';

// ─── Content States ────────────────────────────────────────────────────────────

export const CONTENT_STATE_LABELS: Record<ContentState, string> = {
  borrador: 'Borrador',
  en_produccion: 'En producción',
  revision_interna: 'Revisión interna',
  cambios_internos: 'Cambios internos',
  listo_para_cliente: 'Listo para cliente',
  enviado_cliente: 'Enviado al cliente',
  en_revision_cliente: 'En revisión cliente',
  aprobado_cliente: 'Aprobado por cliente',
  cambios_solicitados: 'Cambios solicitados',
  segunda_revision: 'Segunda revisión',
  aprobado_final: 'Aprobado final',
  rechazado: 'Rechazado',
  cancelado: 'Cancelado',
  en_produccion_pauta: 'En producción pauta',
  publicado: 'Publicado',
  archivado: 'Archivado',
  bloqueado: 'Bloqueado',
};

export const CONTENT_STATE_COLORS: Record<ContentState, string> = {
  borrador: 'bg-slate-100 text-slate-600',
  en_produccion: 'bg-blue-100 text-blue-700',
  revision_interna: 'bg-yellow-100 text-yellow-700',
  cambios_internos: 'bg-orange-100 text-orange-700',
  listo_para_cliente: 'bg-teal-100 text-teal-700',
  enviado_cliente: 'bg-purple-100 text-purple-700',
  en_revision_cliente: 'bg-indigo-100 text-indigo-700',
  aprobado_cliente: 'bg-green-100 text-green-700',
  cambios_solicitados: 'bg-amber-100 text-amber-700',
  segunda_revision: 'bg-orange-100 text-orange-700',
  aprobado_final: 'bg-emerald-100 text-emerald-700',
  rechazado: 'bg-red-100 text-red-700',
  cancelado: 'bg-slate-100 text-slate-500',
  en_produccion_pauta: 'bg-blue-100 text-blue-700',
  publicado: 'bg-violet-100 text-violet-700',
  archivado: 'bg-slate-100 text-slate-400',
  bloqueado: 'bg-red-100 text-red-700',
};

// Columnas visibles en el kanban
export const KANBAN_COLUMNS: ContentState[] = [
  'borrador',
  'en_produccion',
  'revision_interna',
  'enviado_cliente',
  'cambios_solicitados',
  'aprobado_final',
  'publicado',
  'bloqueado',
];

// ─── Content Types ─────────────────────────────────────────────────────────────

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  reel: 'Reel',
  carrusel: 'Carrusel',
  post_imagen: 'Post imagen',
  post_video: 'Post video',
  historia: 'Historia',
  historia_video: 'Historia video',
  short: 'Short',
  tiktok: 'TikTok',
  video_youtube: 'Video YouTube',
  banner: 'Banner',
  infografia: 'Infografía',
  blog: 'Blog',
  otro: 'Otro',
};

// ─── Platforms ─────────────────────────────────────────────────────────────────

export const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  twitter: 'Twitter/X',
  google: 'Google',
};

export const PLATFORM_COLORS: Record<Platform, string> = {
  instagram: 'text-pink-600',
  facebook: 'text-blue-600',
  tiktok: 'text-slate-900',
  youtube: 'text-red-600',
  linkedin: 'text-blue-700',
  twitter: 'text-slate-800',
  google: 'text-blue-500',
};

// ─── Lead States ───────────────────────────────────────────────────────────────

export const LEAD_STATE_LABELS: Record<LeadState, string> = {
  nuevo: 'Nuevo',
  contactado: 'Contactado',
  calificado: 'Calificado',
  oportunidad: 'Oportunidad',
  ganado: 'Ganado',
  perdido: 'Perdido',
  invalido: 'Inválido',
};

export const LEAD_STATE_COLORS: Record<LeadState, string> = {
  nuevo: 'bg-slate-100 text-slate-700',
  contactado: 'bg-blue-100 text-blue-700',
  calificado: 'bg-teal-100 text-teal-700',
  oportunidad: 'bg-purple-100 text-purple-700',
  ganado: 'bg-green-100 text-green-700',
  perdido: 'bg-red-100 text-red-600',
  invalido: 'bg-slate-100 text-slate-400',
};

// ─── Roles ─────────────────────────────────────────────────────────────────────

export const ROLE_LABELS: Record<FplusRole, string> = {
  super_admin: 'Super Admin',
  agency_admin: 'Agency Admin',
  account_manager: 'Account Manager',
  media_buyer: 'Media Buyer',
  content_manager: 'Content Manager',
  designer: 'Diseñador',
  client_standard: 'Cliente Standard',
  client_premium: 'Cliente Premium',
};

// ─── Health Status ──────────────────────────────────────────────────────────────

export const HEALTH_STATUS_COLORS = {
  verde: { bg: 'bg-emerald-500', text: 'text-emerald-700', light: 'bg-emerald-50' },
  amarillo: { bg: 'bg-amber-400', text: 'text-amber-700', light: 'bg-amber-50' },
  rojo: { bg: 'bg-red-500', text: 'text-red-700', light: 'bg-red-50' },
};
