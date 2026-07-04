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
  diseno_comodin: 'Diseño Comodín',
  otro: 'Otro',
};

// ─── Identidad visual por tipo de contenido ─────────────────────────────────────
// Cada tipo tiene un color propio que se mantiene en Calendario, Cronopost y
// Multimedia para que el usuario lo identifique de inmediato:
// 🟦 Reel · 🟪 Carrusel · 🟩 Historia · 🟧 Post

export interface TypeVisual {
  emoji: string;
  dot: string;       // punto/indicador pequeño
  gradient: string;  // fondo de preview de tarjeta
  badge: string;     // chip de texto
  border: string;    // acento de borde
}

export const TYPE_VISUALS: Record<string, TypeVisual> = {
  reel: {
    emoji: '🎬',
    dot: 'bg-blue-500',
    gradient: 'from-blue-100 to-sky-50 border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    border: 'border-l-blue-500',
  },
  post_video: {
    emoji: '🎥',
    dot: 'bg-blue-500',
    gradient: 'from-blue-100 to-sky-50 border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    border: 'border-l-blue-500',
  },
  tiktok: {
    emoji: '🎵',
    dot: 'bg-blue-500',
    gradient: 'from-blue-100 to-sky-50 border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    border: 'border-l-blue-500',
  },
  carrusel: {
    emoji: '🖼️',
    dot: 'bg-violet-500',
    gradient: 'from-violet-100 to-purple-50 border-violet-200',
    badge: 'bg-violet-100 text-violet-700',
    border: 'border-l-violet-500',
  },
  historia: {
    emoji: '📱',
    dot: 'bg-emerald-500',
    gradient: 'from-emerald-100 to-green-50 border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-700',
    border: 'border-l-emerald-500',
  },
  historia_video: {
    emoji: '📱',
    dot: 'bg-emerald-500',
    gradient: 'from-emerald-100 to-green-50 border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-700',
    border: 'border-l-emerald-500',
  },
  post_imagen: {
    emoji: '🟧',
    dot: 'bg-orange-500',
    gradient: 'from-orange-100 to-amber-50 border-orange-200',
    badge: 'bg-orange-100 text-orange-700',
    border: 'border-l-orange-500',
  },
};

// Diseño Comodín: pieza flexible, disponible según plan (configurable, no quemado)
TYPE_VISUALS.diseno_comodin = {
  emoji: '🃏',
  dot: 'bg-pink-500',
  gradient: 'from-pink-100 to-rose-50 border-pink-200',
  badge: 'bg-pink-100 text-pink-700',
  border: 'border-l-pink-500',
};

const TYPE_VISUAL_FALLBACK: TypeVisual = {
  emoji: '📄',
  dot: 'bg-slate-400',
  gradient: 'from-slate-100 to-slate-50 border-slate-200',
  badge: 'bg-slate-100 text-slate-600',
  border: 'border-l-slate-400',
};

export function getTypeVisual(tipo: string): TypeVisual {
  return TYPE_VISUALS[tipo] ?? TYPE_VISUAL_FALLBACK;
}

// ─── Plantillas de planes ──────────────────────────────────────────────────────
// Base editable: al crear un cliente se parte de una plantilla y la distribución
// puede personalizarse por completo (planes a medida en el futuro).

export interface PlanTemplate {
  id: string;
  label: string;
  emoji: string;
  piezas_mensuales: number;
  distribucion: Partial<Record<ContentType, number>>;
  precio_lista: number;              // valor oficial del plan (USD)
  redes_permitidas: Platform[];      // plataformas que el plan habilita
  incluye_comodin: boolean;          // Diseño Comodín disponible
}

export const PLAN_TEMPLATES: PlanTemplate[] = [
  {
    id: 'plata',
    label: 'Plan Plata',
    emoji: '🥈',
    piezas_mensuales: 12,
    distribucion: { reel: 4, carrusel: 3, post_imagen: 3, historia: 2 },
    precio_lista: 400,
    redes_permitidas: ['facebook', 'instagram'],
    incluye_comodin: false,
  },
  {
    id: 'oro',
    label: 'Plan Oro',
    emoji: '🥇',
    piezas_mensuales: 20,
    distribucion: { reel: 7, carrusel: 5, post_imagen: 4, historia: 4 },
    precio_lista: 600,
    redes_permitidas: ['facebook', 'instagram', 'tiktok'],
    incluye_comodin: true,
  },
  {
    id: 'platinum',
    label: 'Plan Platinum',
    emoji: '💎',
    piezas_mensuales: 30,
    distribucion: { reel: 12, carrusel: 8, post_imagen: 5, historia: 5, diseno_comodin: 2 },
    precio_lista: 950,
    redes_permitidas: ['facebook', 'instagram', 'tiktok', 'linkedin'],
    incluye_comodin: true,
  },
];

// Redes permitidas según el plan del cliente. Prioriza redes_contratadas
// (personalizado por contrato) y cae a la plantilla del plan.
export function getAllowedPlatforms(client: { redes_contratadas?: Platform[]; plan_contratado?: string }): Platform[] {
  if (client.redes_contratadas?.length) return client.redes_contratadas;
  const tpl = PLAN_TEMPLATES.find(t => t.id === client.plan_contratado);
  return tpl?.redes_permitidas ?? ['instagram', 'facebook'];
}

// ─── Tipos de mercado ──────────────────────────────────────────────────────────
// Alimentan el Motor de Planificación Inteligente (y a futuro, Andrómeda).

export const MARKET_TYPES = [
  'Restaurante',
  'Salud',
  'Belleza',
  'Construcción',
  'Inmobiliaria',
  'Retail',
  'Educación',
  'Seguros',
  'Servicios Profesionales',
  'B2B',
  'B2C',
  'Otro',
] as const;

// ─── Plataformas de pauta publicitaria ─────────────────────────────────────────

// Extensible: agregar aquí (y a futuro desde BD) nuevas plataformas de pauta
export const AD_PLATFORMS = ['Meta Ads', 'Google Ads', 'TikTok Ads', 'LinkedIn Ads'] as const;

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
