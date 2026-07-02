import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  mockClients, mockCampaigns, mockContent,
  mockPublications, mockLeads, mockPortalComments, mockMetrics, mockBriefs,
} from '../mock';
import type {
  Client, Campaign, ContentPiece, Publication, Lead,
  ContentState, ContentType, Platform, HealthStatus,
  BriefMaestro, PublicationMetric,
} from '../types';

// ─── Local types (not persisted to backend) ────────────────────────────────────

export interface PortalComment {
  id: string;
  autor: string;
  esAgencia: boolean;
  texto: string;
  timestamp: string;
}

export interface ContentComment {
  id: string;
  content_piece_id: string;
  autor: string;
  texto: string;
  interno: boolean;
  timestamp: string;
}

export interface StateHistoryEvent {
  id: string;
  content_piece_id: string;
  estado_anterior?: ContentState;
  estado_nuevo: ContentState;
  actor: string;
  timestamp: string;
}

// ─── State machine transitions ─────────────────────────────────────────────────
// Maps current state → valid next states
export const STATE_TRANSITIONS: Partial<Record<ContentState, ContentState[]>> = {
  borrador: ['en_produccion'],
  en_produccion: ['revision_interna', 'bloqueado'],
  revision_interna: ['enviado_cliente', 'cambios_internos'],
  cambios_internos: ['revision_interna'],
  listo_para_cliente: ['enviado_cliente'],
  enviado_cliente: ['aprobado_cliente', 'cambios_solicitados'],
  en_revision_cliente: ['aprobado_cliente', 'cambios_solicitados'],
  cambios_solicitados: ['en_produccion'],
  aprobado_cliente: ['aprobado_final'],
  aprobado_final: ['en_produccion_pauta', 'publicado'],
  en_produccion_pauta: ['publicado'],
  bloqueado: ['en_produccion'],
};

export const ACTION_LABELS: Partial<Record<ContentState, Partial<Record<ContentState, string>>>> = {
  borrador: { en_produccion: 'Iniciar producción' },
  en_produccion: { revision_interna: 'Enviar a revisión interna', bloqueado: 'Marcar bloqueado' },
  revision_interna: { enviado_cliente: 'Enviar al cliente', cambios_internos: 'Solicitar cambios internos' },
  cambios_internos: { revision_interna: 'Lista para revisión' },
  listo_para_cliente: { enviado_cliente: 'Enviar al cliente' },
  enviado_cliente: { aprobado_cliente: 'Registrar aprobación', cambios_solicitados: 'Registrar cambios' },
  cambios_solicitados: { en_produccion: 'Iniciar correcciones' },
  aprobado_cliente: { aprobado_final: 'Aprobar final' },
  aprobado_final: { en_produccion_pauta: 'Pasar a pauta', publicado: 'Marcar publicado' },
  en_produccion_pauta: { publicado: 'Marcar publicado' },
  bloqueado: { en_produccion: 'Desbloquear' },
};

// ─── Initial seed comments for demo pieces ────────────────────────────────────
// cp1 = Reel Demo Day Launch (aprobado_final) — comments show internal review
const seedComments: ContentComment[] = [
  { id: 'cc1', content_piece_id: 'cp1', autor: 'Andrea Solís',  texto: 'Revisar que el hook de apertura sea menor a 3 segundos. El cliente es muy exigente con eso.', interno: true, timestamp: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: 'cc2', content_piece_id: 'cp1', autor: 'María Loor',    texto: 'Copy ajustado. Cambié "solicita demo" por "pide tu demo" — suena más directo.', interno: true, timestamp: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 'cc3', content_piece_id: 'cp1', autor: 'FPLUS',         texto: 'Aprobado. El reel se ve muy bien, el hook funciona perfecto.', interno: false, timestamp: new Date(Date.now() - 86400000).toISOString() },
  // cp9 = Reel Cocina Abierta (publicado) — shows full cycle
  { id: 'cc4', content_piece_id: 'cp9', autor: 'Andrea Solís',  texto: 'Chef Marcos confirmó que puede grabar el miércoles de 11am a 1pm en la cocina.', interno: true, timestamp: new Date(Date.now() - 12 * 86400000).toISOString() },
  { id: 'cc5', content_piece_id: 'cp9', autor: 'Carlos Ramos',  texto: 'Video editado. Duración: 32 segundos. Subido para revisión.', interno: true, timestamp: new Date(Date.now() - 8 * 86400000).toISOString() },
  { id: 'cc6', content_piece_id: 'cp9', autor: 'Kinara',        texto: 'Nos encantó. El ambiente y la música están perfectos. Aprobado.', interno: false, timestamp: new Date(Date.now() - 6 * 86400000).toISOString() },
];

// History trail for cp1 (aprobado_final) — shows complete state progression
const seedHistory: StateHistoryEvent[] = [
  { id: 'sh1', content_piece_id: 'cp1', estado_anterior: undefined,         estado_nuevo: 'borrador',         actor: 'Andrea Solís',  timestamp: new Date(Date.now() - 8 * 86400000).toISOString() },
  { id: 'sh2', content_piece_id: 'cp1', estado_anterior: 'borrador',         estado_nuevo: 'en_produccion',    actor: 'Carlos Ramos',  timestamp: new Date(Date.now() - 7 * 86400000).toISOString() },
  { id: 'sh3', content_piece_id: 'cp1', estado_anterior: 'en_produccion',    estado_nuevo: 'revision_interna', actor: 'Andrea Solís',  timestamp: new Date(Date.now() - 4 * 86400000).toISOString() },
  { id: 'sh4', content_piece_id: 'cp1', estado_anterior: 'revision_interna', estado_nuevo: 'enviado_cliente',  actor: 'Andrea Solís',  timestamp: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: 'sh5', content_piece_id: 'cp1', estado_anterior: 'enviado_cliente',  estado_nuevo: 'aprobado_cliente', actor: 'FPLUS',         timestamp: new Date(Date.now() - 86400000).toISOString() },
  { id: 'sh6', content_piece_id: 'cp1', estado_anterior: 'aprobado_cliente', estado_nuevo: 'aprobado_final',   actor: 'Andrea Solís',  timestamp: new Date(Date.now() - 86400000 + 3600000).toISOString() },
];

// ─── Store interface ────────────────────────────────────────────────────────────

interface FplusStore {
  // ─── Data ──────────────────────────────────────────────────────────────────
  clients: Client[];
  campaigns: Campaign[];
  contentPieces: ContentPiece[];
  publications: Publication[];
  leads: Lead[];
  metrics: PublicationMetric[];
  briefs: Record<string, BriefMaestro>;
  portalComments: Record<string, PortalComment[]>;
  contentComments: ContentComment[];
  stateHistory: StateHistoryEvent[];

  // ─── Content actions ───────────────────────────────────────────────────────
  updateContentState: (id: string, state: ContentState, actor?: string) => void;
  updateContent: (id: string, data: Partial<ContentPiece>) => void;
  addContentComment: (comment: ContentComment) => void;
  getContentComments: (pieceId: string) => ContentComment[];
  getStateHistory: (pieceId: string) => StateHistoryEvent[];

  // ─── Creation actions ──────────────────────────────────────────────────────
  createClient: (client: Client) => void;
  updateClient: (id: string, data: Partial<Client>) => void;
  createCampaign: (campaign: Campaign) => void;
  createContent: (piece: ContentPiece) => void;
  createManyContent: (pieces: ContentPiece[]) => void;
  deleteContent: (id: string) => void;

  // ─── Publication actions ───────────────────────────────────────────────────
  createPublication: (pub: Publication) => void;
  updatePublication: (id: string, data: Partial<Publication>) => void;
  confirmPublication: (id: string, url: string, externalPostId?: string) => void;

  // ─── Portal actions (client-side) ──────────────────────────────────────────
  approveContent: (contentId: string, clientNombre: string) => void;
  requestChanges: (contentId: string, comment: string, clientNombre: string) => void;
  addPortalComment: (contentId: string, comment: PortalComment) => void;

  // ─── Metric actions ────────────────────────────────────────────────────────
  addMetric: (metric: PublicationMetric) => void;
  updateMetric: (id: string, data: Partial<PublicationMetric>) => void;
  getMetricsByPublication: (publicationId: string) => PublicationMetric[];

  // ─── Lead actions ──────────────────────────────────────────────────────────
  updateLead: (id: string, data: Partial<Lead>) => void;

  // ─── Brief actions ─────────────────────────────────────────────────────────
  saveBrief: (brief: BriefMaestro) => void;
  getBrief: (clientId: string) => BriefMaestro | undefined;
}

// ─── Store implementation ───────────────────────────────────────────────────────

export const useFplusStore = create<FplusStore>()(persist((set, get) => ({
  clients: [...mockClients],
  campaigns: [...mockCampaigns],
  contentPieces: [...mockContent],
  publications: [...mockPublications],
  leads: [...mockLeads],
  metrics: [...mockMetrics],
  briefs: { ...mockBriefs },
  portalComments: { ...mockPortalComments },
  contentComments: [...seedComments],
  stateHistory: [...seedHistory],

  // ─── Content ───────────────────────────────────────────────────────────────

  updateContentState: (id, state, actor = 'Agencia') =>
    set(s => {
      const piece = s.contentPieces.find(cp => cp.id === id);
      const historyEvent: StateHistoryEvent = {
        id: `sh-${Date.now()}`,
        content_piece_id: id,
        estado_anterior: piece?.estado,
        estado_nuevo: state,
        actor,
        timestamp: new Date().toISOString(),
      };
      return {
        contentPieces: s.contentPieces.map(cp =>
          cp.id === id
            ? { ...cp, estado: state, updated_at: new Date().toISOString() }
            : cp
        ),
        stateHistory: [...s.stateHistory, historyEvent],
      };
    }),

  addContentComment: (comment) =>
    set(s => ({ contentComments: [...s.contentComments, comment] })),

  getContentComments: (pieceId) =>
    get().contentComments.filter(c => c.content_piece_id === pieceId),

  getStateHistory: (pieceId) =>
    get().stateHistory.filter(e => e.content_piece_id === pieceId),

  updateContent: (id, data) =>
    set(s => ({
      contentPieces: s.contentPieces.map(cp =>
        cp.id === id ? { ...cp, ...data, updated_at: new Date().toISOString() } : cp
      ),
    })),

  // ─── Creation ──────────────────────────────────────────────────────────────

  createClient: (client) =>
    set(s => ({ clients: [...s.clients, client] })),

  updateClient: (id, data) =>
    set(s => ({ clients: s.clients.map(c => c.id === id ? { ...c, ...data } : c) })),

  createCampaign: (campaign) =>
    set(s => ({ campaigns: [...s.campaigns, campaign] })),

  createContent: (piece) =>
    set(s => ({ contentPieces: [...s.contentPieces, piece] })),

  createManyContent: (pieces) =>
    set(s => ({ contentPieces: [...s.contentPieces, ...pieces] })),

  deleteContent: (id) =>
    set(s => ({
      contentPieces: s.contentPieces.filter(cp => cp.id !== id),
      contentComments: s.contentComments.filter(cc => cc.content_piece_id !== id),
      stateHistory: s.stateHistory.filter(h => h.content_piece_id !== id),
    })),

  // ─── Publications ──────────────────────────────────────────────────────────

  createPublication: (pub) =>
    set(s => ({ publications: [...s.publications, pub] })),

  updatePublication: (id, data) =>
    set(s => ({
      publications: s.publications.map(p => p.id === id ? { ...p, ...data } : p),
    })),

  confirmPublication: (id, url, externalPostId) =>
    set(s => ({
      publications: s.publications.map(p =>
        p.id === id
          ? {
              ...p,
              estado: 'publicada' as const,
              url_publicacion: url,
              external_post_id: externalPostId,
              publicada_at: new Date().toISOString(),
            }
          : p
      ),
    })),

  // ─── Portal ────────────────────────────────────────────────────────────────

  approveContent: (contentId, clientNombre) =>
    set(s => ({
      contentPieces: s.contentPieces.map(cp =>
        cp.id === contentId
          ? { ...cp, estado: 'aprobado_final' as ContentState, updated_at: new Date().toISOString() }
          : cp
      ),
      portalComments: {
        ...s.portalComments,
        [contentId]: [
          ...(s.portalComments[contentId] ?? []),
          {
            id: `auto-${Date.now()}`,
            autor: clientNombre,
            esAgencia: false,
            texto: '✅ Aprobado.',
            timestamp: new Date().toISOString(),
          },
        ],
      },
    })),

  requestChanges: (contentId, comment, clientNombre) =>
    set(s => ({
      contentPieces: s.contentPieces.map(cp =>
        cp.id === contentId
          ? { ...cp, estado: 'cambios_solicitados' as ContentState, updated_at: new Date().toISOString() }
          : cp
      ),
      portalComments: {
        ...s.portalComments,
        [contentId]: [
          ...(s.portalComments[contentId] ?? []),
          {
            id: `req-${Date.now()}`,
            autor: clientNombre,
            esAgencia: false,
            texto: comment,
            timestamp: new Date().toISOString(),
          },
        ],
      },
    })),

  addPortalComment: (contentId, comment) =>
    set(s => ({
      portalComments: {
        ...s.portalComments,
        [contentId]: [...(s.portalComments[contentId] ?? []), comment],
      },
    })),

  // ─── Metrics ───────────────────────────────────────────────────────────────

  addMetric: (metric) =>
    set(s => ({ metrics: [...s.metrics, metric] })),

  updateMetric: (id, data) =>
    set(s => ({
      metrics: s.metrics.map(m => m.id === id ? { ...m, ...data } : m),
    })),

  getMetricsByPublication: (publicationId) =>
    get().metrics.filter(m => m.publication_id === publicationId),

  // ─── Leads ─────────────────────────────────────────────────────────────────

  updateLead: (id, data) =>
    set(s => ({
      leads: s.leads.map(l => l.id === id ? { ...l, ...data } : l),
    })),

  // ─── Brief ─────────────────────────────────────────────────────────────────

  saveBrief: (brief) =>
    set(s => ({
      briefs: { ...s.briefs, [brief.client_id]: brief },
    })),

  getBrief: (clientId) => get().briefs[clientId],
}), {
  name: 'fplus-store',
  version: 2,
  // Al subir la versión (cambios en el mock semilla), se descarta el estado
  // persistido anterior y se rehidrata desde el mock actualizado.
  migrate: () => ({}) as FplusStore,
  // Los archivos base64 grandes pueden exceder la cuota de localStorage (~5MB):
  // se persiste todo menos las URLs de archivos que superen ~2MB por pieza.
  partialize: (state) => ({
    clients: state.clients,
    campaigns: state.campaigns,
    contentPieces: state.contentPieces.map(cp => ({
      ...cp,
      archivos: cp.archivos.map(a =>
        a.url.length > 2_000_000 ? { ...a, url: '' } : a
      ),
    })),
    publications: state.publications,
    leads: state.leads,
    metrics: state.metrics,
    briefs: state.briefs,
    portalComments: state.portalComments,
    contentComments: state.contentComments,
    stateHistory: state.stateHistory,
  }),
}));

// Export unused type aliases needed by creation forms
export type { ContentType, Platform, HealthStatus };
