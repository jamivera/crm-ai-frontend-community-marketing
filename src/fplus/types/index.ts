// ─── FPLUS Core Types ─────────────────────────────────────────────────────────

export type FplusRole =
  | 'super_admin'
  | 'agency_admin'
  | 'account_manager'
  | 'media_buyer'
  | 'content_manager'
  | 'designer'
  | 'client_standard'
  | 'client_premium';

// ─── Content ──────────────────────────────────────────────────────────────────

export type ContentState =
  | 'borrador'
  | 'en_produccion'
  | 'revision_interna'
  | 'cambios_internos'
  | 'listo_para_cliente'
  | 'enviado_cliente'
  | 'en_revision_cliente'
  | 'aprobado_cliente'
  | 'cambios_solicitados'
  | 'segunda_revision'
  | 'aprobado_final'
  | 'rechazado'
  | 'cancelado'
  | 'en_produccion_pauta'
  | 'publicado'
  | 'archivado'
  | 'bloqueado';

export type ContentType =
  | 'reel'
  | 'carrusel'
  | 'post_imagen'
  | 'post_video'
  | 'historia'
  | 'historia_video'
  | 'short'
  | 'tiktok'
  | 'video_youtube'
  | 'banner'
  | 'infografia'
  | 'blog'
  | 'otro';

export type Platform =
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'youtube'
  | 'linkedin'
  | 'twitter'
  | 'google';

export type HealthStatus = 'verde' | 'amarillo' | 'rojo';

export type PlanContratado = 'basico' | 'estandar' | 'premium' | 'enterprise';
export type PautaPublicitaria = 'no_incluye' | 'incluida_agencia' | 'cliente_paga' | 'presupuesto_compartido';

// Objetivo de marketing del cliente — modula la planificación inteligente del Cronopost
export type MarketingObjective = 'alcance' | 'conversion' | 'comunidad' | 'lanzamiento';

// Distribución de piezas contratadas por tipo de contenido (ej. { reel: 8, carrusel: 6 })
export type DistribucionPiezas = Partial<Record<ContentType, number>>;

export interface Client {
  id: string;
  nombre: string;
  empresa?: string;
  industria: string;
  instagram_handle?: string;
  logo_url?: string;
  // Responsable / AM
  account_manager_id: string;
  account_manager_name: string;
  responsable_cliente?: string;
  // Contrato
  plan_contratado?: PlanContratado;
  fecha_inicio_contrato?: string;
  fecha_fin_contrato?: string;
  presupuesto_mensual?: number;
  pauta_publicitaria?: PautaPublicitaria;
  // Contrato operativo — base de la planificación del Cronopost
  piezas_mensuales?: number;
  distribucion_piezas?: DistribucionPiezas;
  redes_contratadas?: Platform[];
  objetivo_marketing?: MarketingObjective;
  // Estado operativo
  estado: 'activo' | 'inactivo' | 'pausado';
  semaforo: HealthStatus;
  // Observaciones
  observaciones?: string;
  notas_internas?: string;
  // Métricas rápidas (dashboard)
  piezas_activas: number;
  piezas_atrasadas: number;
  proxima_publicacion?: string;
  proxima_publicacion_plataforma?: Platform;
  leads_mes: number;
  revenue_mes: number;
  created_at: string;
}

export interface Campaign {
  id: string;
  client_id: string;
  client_nombre: string;
  nombre: string;
  codigo_interno: string;
  tipo: 'organica' | 'pauta' | 'mixta';
  objetivo: 'awareness' | 'engagement' | 'leads' | 'ventas' | 'retencion';
  estado: 'planificada' | 'activa' | 'pausada' | 'completada' | 'cancelada';
  fecha_inicio: string;
  fecha_fin: string;
  presupuesto_total?: number;
  piezas_totales: number;
  piezas_publicadas: number;
  leads: number;
  cpl?: number;
  roas?: number;
  engagement_rate?: number;
  created_at: string;
}

export interface ContentFile {
  id: string;
  nombre: string;
  tipo: 'imagen' | 'video' | 'pdf' | 'audio' | 'otro';
  url: string;
  thumbnail_url?: string;
  tamanio_bytes: number;
  version: number;
  es_version_activa: boolean;
  subido_por_nombre: string;
  created_at: string;
}

export interface ContentPiece {
  id: string;
  client_id: string;
  client_nombre: string;
  campaign_id?: string;
  campaign_nombre?: string;
  nombre: string;
  tipo: ContentType;
  pilar?: string;
  tono?: string[];
  incluye_cta: boolean;
  estado: ContentState;
  account_manager_id: string;
  account_manager_nombre: string;
  designer_id?: string;
  designer_nombre?: string;
  content_manager_id?: string;
  content_manager_nombre?: string;
  fecha_limite?: string;
  fecha_publicacion?: string;
  plataforma?: Platform;
  iteraciones: number;
  max_iteraciones: number;
  archivos: ContentFile[];
  thumbnail_url?: string;
  copy_activo?: string;
  hashtags?: string[];
  // Planificación inteligente
  origen?: PieceOrigin;
  razon_estrategica?: string;
  created_at: string;
  updated_at: string;
}

// Origen de una pieza: 'planificada' viene del contrato vía planificador,
// 'extraordinaria' es adicional (promos, tendencias) y no cuenta contra el contrato,
// 'manual' fue creada directamente por la agencia.
export type PieceOrigin = 'planificada' | 'extraordinaria' | 'manual';

// Evento del calendario inteligente (feriados, fechas comerciales, efemérides,
// eventos propios del cliente). Bonifica días en la planificación y genera alertas.
export interface SmartEvent {
  id: string;
  fecha: string; // YYYY-MM-DD (los recurrentes anuales se comparan por MM-DD)
  nombre: string;
  tipo: 'feriado' | 'comercial' | 'efemeride' | 'sector' | 'cliente';
  recurrente_anual: boolean;
  industrias_relevantes?: string[]; // vacío/undefined = relevante para todos
  client_id?: string; // solo para tipo 'cliente'
}

export interface Comment {
  id: string;
  content_piece_id: string;
  autor_nombre: string;
  autor_avatar?: string;
  texto: string;
  es_interno: boolean;
  created_at: string;
}

export interface StateEvent {
  id: string;
  estado_anterior?: ContentState;
  estado_nuevo: ContentState;
  actor_nombre: string;
  created_at: string;
}

// ─── Leads ────────────────────────────────────────────────────────────────────

export type LeadState =
  | 'nuevo'
  | 'contactado'
  | 'calificado'
  | 'oportunidad'
  | 'ganado'
  | 'perdido'
  | 'invalido';

export type LeadQuality = 'alta' | 'media' | 'baja';

export interface Lead {
  id: string;
  organization_id: string;
  client_id: string;
  client_nombre: string;
  nombre: string;
  empresa?: string;
  email?: string;
  telefono?: string;
  fuente: string;
  calidad: LeadQuality;
  estado: LeadState;
  publication_id?: string;
  publication_thumbnail?: string;
  account_manager_nombre: string;
  ingreso_potencial?: number;
  dias_en_estado: number;
  created_at: string;
}

// ─── Publications ──────────────────────────────────────────────────────────────

export interface Publication {
  id: string;
  // Relations
  content_piece_id: string;
  content_piece_nombre: string;
  client_id: string;
  client_nombre: string;
  campaign_id?: string;
  // Scheduling
  plataforma: Platform;
  fecha_programada: string;
  hora_programada?: string;
  timezone?: string;
  // Content
  copy_final?: string;
  hashtags?: string[];
  menciones?: string[];
  call_to_action?: string;
  media_urls?: string[];
  formato?: string;
  duracion_segundos?: number;
  // UTMs
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  // Status
  estado: 'planificada' | 'publicada' | 'sin_confirmar' | 'cancelada';
  // Post-publication
  external_post_id?: string;
  url_publicacion?: string;
  publicada_at?: string;
  thumbnail_url?: string;
  // Attribution
  leads_atribuidos: number;
  engagement_rate?: number;
  roas?: number;
  // Blueprint — base para Content Intelligence futura
  objetivo?: string;
  pilar?: string;
  hook?: string;
  oferta?: string;
}

// ─── Brief Maestro ────────────────────────────────────────────────────────────

export interface BriefMaestro {
  client_id: string;
  // Negocio
  propuesta_valor: string;
  diferenciadores: string;
  competencia: string;
  historia_marca: string;
  // Audiencia
  perfil_cliente: string;
  rango_edad: string;
  ubicacion: string;
  pain_points: string;
  motivaciones: string;
  objeciones: string;
  // Contenido
  pilares: string[];
  tono: string[];
  formatos_preferidos: ContentType[];
  que_no_hacer: string;
  hashtags_habituales: string[];
  // Canales
  plataformas_activas: Platform[];
  frecuencia_semanal: number;
  horarios_preferidos: string;
  objetivo_principal: string;
  url_landing?: string;
  updated_at: string;
}

export interface PublicationMetric {
  id: string;
  publication_id: string;
  plataforma: Platform;
  snapshot_at: string;
  // Reach & visibility
  reach?: number;
  impressions?: number;
  // Engagement
  engagements?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  // Traffic
  clicks?: number;
  video_views?: number;
  // Spend
  spend?: number;
  // Attribution
  leads?: number;
  // Derived (calculated)
  cpm?: number;
  cpc?: number;
  cpl?: number;
  engagement_rate?: number;
  // Raw platform data
  raw_data?: Record<string, unknown>;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardStats {
  piezas_activas: number;
  piezas_bloqueadas: number;
  leads_hoy: number;
  revenue_mes: number;
  piezas_activas_delta: number;
  leads_hoy_delta: number;
  revenue_mes_delta: number;
}

export interface TeamMember {
  id: string;
  nombre: string;
  rol: FplusRole;
  avatar?: string;
  piezas_activas: number;
  piezas_atrasadas: number;
  ultima_actividad: string;
}

export interface ActivityEvent {
  id: string;
  actor_nombre: string;
  actor_avatar?: string;
  accion: string;
  objeto: string;
  cliente?: string;
  timestamp: string;
}
