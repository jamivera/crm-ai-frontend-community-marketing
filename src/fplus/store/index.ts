import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  mockClients, mockCampaigns, mockContent,
  mockPublications, mockLeads, mockPortalComments, mockMetrics, mockBriefs,
} from '../mock';
import type {
  Client, Campaign, ContentPiece, Publication, Lead,
  ContentState, ContentType, Platform, HealthStatus,
  BriefMaestro, PublicationMetric, FplusNotification,
} from '../types';
import { CONTENT_STATE_LABELS } from '../constants';

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

export interface ProjectHistoryEvent {
  id: string;
  client_id: string;
  actor: string;
  categoria: 'contenido' | 'brief' | 'campana' | 'invitacion' | 'aprobacion' | 'comentario' | 'configuracion';
  descripcion: string;
  timestamp: string;
  metadata?: Record<string, any>;
  es_interno?: boolean;
}

const seedProjectHistory: ProjectHistoryEvent[] = [
  {
    id: 'ph1',
    client_id: 'cl3',
    actor: 'Andrea Solís (Agencia)',
    categoria: 'brief',
    descripcion: 'Creación y guardado inicial del Brief Maestro de la marca.',
    timestamp: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'ph2',
    client_id: 'cl3',
    actor: 'Andrea Solís (Agencia)',
    categoria: 'invitacion',
    descripcion: 'Generación del enlace de invitación al portal para Chef Marco Andrade.',
    timestamp: new Date(Date.now() - 9 * 86400000).toISOString(),
  },
  {
    id: 'ph3',
    client_id: 'cl3',
    actor: 'Chef Marco Andrade (Cliente)',
    categoria: 'invitacion',
    descripcion: 'Invitación aceptada. Portal activado y contraseña de acceso configurada.',
    timestamp: new Date(Date.now() - 9 * 86400000).toISOString(),
  },
  {
    id: 'ph4',
    client_id: 'cl3',
    actor: 'Andrea Solís (Agencia)',
    categoria: 'campana',
    descripcion: 'Campaña "Festival de Mariscos" creada de forma orgánica.',
    timestamp: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: 'ph5',
    client_id: 'cl3',
    actor: 'Carlos Ramos (Diseñador)',
    categoria: 'contenido',
    descripcion: 'Carga de material multimedia en "Reel Cocina Abierta con el Chef".',
    timestamp: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    id: 'ph6',
    client_id: 'cl3',
    actor: 'Chef Marco Andrade (Cliente)',
    categoria: 'aprobacion',
    descripcion: 'Publicación "Reel Cocina Abierta con el Chef" aprobada oficialmente.',
    timestamp: new Date(Date.now() - 5 * 86400000).toISOString(),
  }
];

// ─── State machine transitions ─────────────────────────────────────────────────
// Maps current state → valid next states
export const STATE_TRANSITIONS: Partial<Record<ContentState, ContentState[]>> = {
  borrador: ['en_produccion'],
  en_produccion: ['revision_interna', 'bloqueado'],
  revision_interna: ['enviado_cliente', 'cambios_internos'],
  cambios_internos: ['revision_interna'],
  listo_para_cliente: ['enviado_cliente'],
  enviado_cliente: ['aprobado_final', 'cambios_solicitados'],
  en_revision_cliente: ['aprobado_final', 'cambios_solicitados'],
  cambios_solicitados: ['en_produccion'],
  aprobado_cliente: ['aprobado_final'],
  aprobado_final: ['en_produccion_pauta', 'publicado'],
  en_produccion_pauta: ['publicado'],
  bloqueado: ['en_produccion'],
};

export const ACTION_LABELS: Partial<Record<ContentState, Partial<Record<ContentState, string>>>> = {
  borrador: { en_produccion: 'Iniciar producción' },
  en_produccion: { revision_interna: 'Enviar a revisión interna', bloqueado: 'Marcar bloqueado' },
  revision_interna: { enviado_cliente: 'Enviar a revisión', cambios_internos: 'Solicitar cambios internos' },
  cambios_internos: { revision_interna: 'Lista para revisión' },
  listo_para_cliente: { enviado_cliente: 'Enviar a revisión' },
  enviado_cliente: { aprobado_final: 'Registrar aprobación', cambios_solicitados: 'Registrar cambios' },
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
  projectHistory: ProjectHistoryEvent[];
  notifications: FplusNotification[];

  // ─── Notification actions ──────────────────────────────────────────────────
  addNotification: (clientId: string, agencyId: string, titulo: string, mensaje: string, tipo: 'estado' | 'comentario' | 'sistema') => void;
  markNotificationRead: (id: string) => void;
  clearNotificationsForClient: (clientId: string) => void;

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
  archiveCampaignPlanning: (campaignId: string) => void;
  clearMonthPlanning: (clientId: string, year: number, month: number, campaignId?: string) => void;
  updateFileProcessingState: (pieceId: string, fileId: string, processingState: 'pending' | 'processing' | 'ready' | 'failed') => void;
  uploadFileAndProcess: (pieceId: string, fileData: { id: string; nombre: string; tipo: 'imagen' | 'video' | 'pdf' | 'audio' | 'otro'; url: string; size: number }) => void;

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

  // ─── Project History actions ───────────────────────────────────────────────
  addProjectHistoryEvent: (
    client_id: string,
    actor: string,
    categoria: 'contenido' | 'brief' | 'campana' | 'invitacion' | 'aprobacion' | 'comentario' | 'configuracion',
    descripcion: string,
    metadata?: Record<string, any>
  ) => void;
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
  projectHistory: [...seedProjectHistory],
  notifications: [],

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
      
      const newNotifications = [...(s.notifications || [])];
      if (state === 'enviado_cliente' || state === 'en_revision_cliente') {
        const client = s.clients.find(c => c.id === piece?.client_id);
        const agencyId = client?.agency_id || 'agency-pd';
        newNotifications.push({
          id: `not-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          client_id: piece?.client_id || '',
          agency_id: agencyId,
          titulo: 'Nueva publicación para revisión',
          mensaje: `La agencia ha subido contenido para "${piece?.nombre || 'Sin nombre'}". Por favor, revísalo.`,
          leido: false,
          tipo: 'estado',
          destinatario: 'cliente',
          created_at: new Date().toISOString(),
        });
      }

      let phEvent: ProjectHistoryEvent | null = null;
      if (piece) {
        const stateLabel = CONTENT_STATE_LABELS[state] || state;
        const actorLabel = actor === 'Agencia' ? 'Andrea Solís (Agencia)' : `${actor} (Cliente)`;
        
        let desc = `Cambio de estado de pieza "${piece.nombre}" a "${stateLabel}".`;
        let cat: ProjectHistoryEvent['categoria'] = 'contenido';
        let esInterno = false;

        if (state === 'enviado_cliente' || state === 'en_revision_cliente') {
          desc = `Pieza "${piece.nombre}" enviada formalmente al cliente para su revisión.`;
          cat = 'aprobacion';
        } else if (state === 'aprobado_final' || state === 'aprobado_cliente') {
          desc = `Pieza "${piece.nombre}" aprobada oficialmente. Listo para publicar.`;
          cat = 'aprobacion';
        } else if (state === 'cambios_solicitados') {
          desc = `Cliente solicitó cambios en la pieza: "${piece.nombre}".`;
          cat = 'aprobacion';
        } else if (state === 'revision_interna') {
          desc = `Pieza "${piece.nombre}" enviada a revisión interna.`;
          esInterno = true;
        } else if (state === 'cambios_internos') {
          desc = `Pieza "${piece.nombre}" devuelta para correcciones internas.`;
          esInterno = true;
        } else if (state === 'en_produccion') {
          desc = `Pieza "${piece.nombre}" iniciada en etapa de producción creativa.`;
          esInterno = true;
        }

        phEvent = {
          id: `ph-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          client_id: piece.client_id,
          actor: actorLabel,
          categoria: cat,
          descripcion: desc,
          timestamp: new Date().toISOString(),
          es_interno: esInterno,
        };
      }

      return {
        contentPieces: s.contentPieces.map(cp =>
          cp.id === id
            ? { ...cp, estado: state, updated_at: new Date().toISOString() }
            : cp
        ),
        stateHistory: [...s.stateHistory, historyEvent],
        notifications: newNotifications,
        projectHistory: phEvent ? [...(s.projectHistory || []), phEvent] : s.projectHistory,
      };
    }),

  addContentComment: (comment) =>
    set(s => ({ contentComments: [...s.contentComments, comment] })),

  getContentComments: (pieceId) =>
    get().contentComments.filter(c => c.content_piece_id === pieceId),

  getStateHistory: (pieceId) =>
    get().stateHistory.filter(e => e.content_piece_id === pieceId),

  updateContent: (id, data) =>
    set(s => {
      const piece = s.contentPieces.find(cp => cp.id === id);
      if (!piece) return {};
      
      const newPiece = { ...piece, ...data, updated_at: new Date().toISOString() };
      
      const changes: string[] = [];
      const actor = data.archivos ? 'Agencia (Material Carga)' : 'Agencia';
      
      if (data.copy_activo && data.copy_activo !== piece.copy_activo) {
        changes.push('el copy/copywriting');
      }
      if (data.hashtags && JSON.stringify(data.hashtags) !== JSON.stringify(piece.hashtags)) {
        changes.push('los hashtags');
      }
      if (data.archivos && JSON.stringify(data.archivos) !== JSON.stringify(piece.archivos)) {
        changes.push('el material multimedia');
      }
      if (data.fecha_publicacion && data.fecha_publicacion !== piece.fecha_publicacion) {
        const parseString = data.fecha_publicacion.includes('T') ? data.fecha_publicacion : (data.fecha_publicacion + 'T12:00:00');
        const dObj = new Date(parseString);
        const formattedDate = isNaN(dObj.getTime()) ? 'Fecha inválida' : dObj.toLocaleDateString('es', { day: 'numeric', month: 'short' });
        changes.push(`la fecha al ${formattedDate}`);
      }

      let historyUpdate = {};
      if (changes.length > 0) {
        const phEvent: ProjectHistoryEvent = {
          id: `ph-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          client_id: piece.client_id,
          actor: actor,
          categoria: 'contenido',
          descripcion: `Modificación en pieza "${piece.nombre}": se actualizó ${changes.join(', ')}.`,
          timestamp: new Date().toISOString(),
        };
        historyUpdate = { projectHistory: [...(s.projectHistory || []), phEvent] };
      }

      return {
        contentPieces: s.contentPieces.map(cp => cp.id === id ? newPiece : cp),
        ...historyUpdate,
      };
    }),

  // ─── Creation ──────────────────────────────────────────────────────────────

  createClient: (client) =>
    set(s => {
      const phEvent: ProjectHistoryEvent = {
        id: `ph-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        client_id: client.id,
        actor: 'Agencia',
        categoria: 'configuracion',
        descripcion: `Creación del cliente "${client.nombre}". Cuenta activada.`,
        timestamp: new Date().toISOString(),
      };
      return {
        clients: [...s.clients, client],
        projectHistory: [...(s.projectHistory || []), phEvent],
      };
    }),

  updateClient: (id, data) =>
    set(s => {
      const client = s.clients.find(c => c.id === id);
      const changes: string[] = [];
      if (data.nombre && data.nombre !== client?.nombre) changes.push(`nombre a "${data.nombre}"`);
      if (data.presupuesto_pauta && data.presupuesto_pauta !== client?.presupuesto_pauta) changes.push(`presupuesto de pauta a $${data.presupuesto_pauta}`);
      if (data.pauta_plataformas && JSON.stringify(data.pauta_plataformas) !== JSON.stringify(client?.pauta_plataformas)) changes.push(`plataformas de pauta a ${data.pauta_plataformas.join(', ')}`);
      
      let historyUpdate = {};
      if (changes.length > 0 && client) {
        const phEvent: ProjectHistoryEvent = {
          id: `ph-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          client_id: id,
          actor: 'Agencia',
          categoria: 'configuracion',
          descripcion: `Configuración de cliente "${client.nombre}" actualizada: se modificó ${changes.join(', ')}.`,
          timestamp: new Date().toISOString(),
        };
        historyUpdate = { projectHistory: [...(s.projectHistory || []), phEvent] };
      }
      return {
        clients: s.clients.map(c => c.id === id ? { ...c, ...data } : c),
        ...historyUpdate,
      };
    }),

  createCampaign: (campaign) =>
    set(s => {
      const phEvent: ProjectHistoryEvent = {
        id: `ph-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        client_id: campaign.client_id,
        actor: 'Agencia',
        categoria: 'campana',
        descripcion: `Nueva campaña "${campaign.nombre}" creada con objetivo oficial ${campaign.objetivo} y función estratégica ${campaign.funcion_estrategica || 'N/A'}.`,
        timestamp: new Date().toISOString(),
      };
      return {
        campaigns: [...s.campaigns, campaign],
        projectHistory: [...(s.projectHistory || []), phEvent],
      };
    }),

  createContent: (piece) =>
    set(s => {
      const phEvent: ProjectHistoryEvent = {
        id: `ph-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        client_id: piece.client_id,
        actor: 'Agencia',
        categoria: 'contenido',
        descripcion: `Nueva pieza de contenido planificada: "${piece.nombre}" (${piece.tipo}).`,
        timestamp: new Date().toISOString(),
      };
      return {
        contentPieces: [...s.contentPieces, piece],
        projectHistory: [...(s.projectHistory || []), phEvent],
      };
    }),

  createManyContent: (pieces) =>
    set(s => {
      let historyUpdate = {};
      if (pieces.length > 0) {
        const phEvent: ProjectHistoryEvent = {
          id: `ph-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          client_id: pieces[0].client_id,
          actor: 'Agencia',
          categoria: 'contenido',
          descripcion: `Planificación y lote creativo generado: se crearon ${pieces.length} nuevas piezas.`,
          timestamp: new Date().toISOString(),
        };
        historyUpdate = { projectHistory: [...(s.projectHistory || []), phEvent] };
      }
      return {
        contentPieces: [...s.contentPieces, ...pieces],
        ...historyUpdate,
      };
    }),

  deleteContent: (id) =>
    set(s => {
      const piece = s.contentPieces.find(cp => cp.id === id);
      let historyUpdate = {};
      if (piece) {
        const phEvent: ProjectHistoryEvent = {
          id: `ph-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          client_id: piece.client_id,
          actor: 'Agencia',
          categoria: 'contenido',
          descripcion: `Pieza de contenido "${piece.nombre}" eliminada del calendario.`,
          timestamp: new Date().toISOString(),
          es_interno: true,
        };
        historyUpdate = { projectHistory: [...(s.projectHistory || []), phEvent] };
      }
      return {
        contentPieces: s.contentPieces.filter(cp => cp.id !== id),
        contentComments: s.contentComments.filter(cc => cc.content_piece_id !== id),
        stateHistory: s.stateHistory.filter(h => h.content_piece_id !== id),
        ...historyUpdate,
      };
    }),

  archiveCampaignPlanning: (campaignId) =>
    set(s => {
      const pieces = s.contentPieces.filter(cp => cp.campaign_id === campaignId);
      let historyUpdate = {};
      if (pieces.length > 0) {
        const phEvent: ProjectHistoryEvent = {
          id: `ph-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          client_id: pieces[0].client_id,
          actor: 'Agencia',
          categoria: 'campana',
          descripcion: `Planificación de campaña archivada temporalmente.`,
          timestamp: new Date().toISOString(),
          es_interno: true,
        };
        historyUpdate = { projectHistory: [...(s.projectHistory || []), phEvent] };
      }
      return {
        contentPieces: s.contentPieces.map(cp =>
          cp.campaign_id === campaignId && cp.estado !== 'publicado'
            ? { ...cp, estado: 'archivado' as ContentState, updated_at: new Date().toISOString() }
            : cp
        ),
        ...historyUpdate,
      };
    }),

  clearMonthPlanning: (clientId, year, month, campaignId) =>
    set(s => {
      const phEvent: ProjectHistoryEvent = {
        id: `ph-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        client_id: clientId,
        actor: 'Agencia',
        categoria: 'brief',
        descripcion: `Limpieza e inactivación de planificación mensual de posts para ${month + 1}/${year}.`,
        timestamp: new Date().toISOString(),
        es_interno: true,
      };
      return {
        contentPieces: s.contentPieces.map(cp => {
          if (cp.client_id !== clientId) return cp;
          if (cp.estado === 'publicado') return cp;
          if (campaignId && campaignId !== 'todas' && cp.campaign_id !== campaignId) return cp;
          if (cp.fecha_publicacion) {
            const d = new Date(cp.fecha_publicacion);
            if (d.getFullYear() === year && d.getMonth() === month) {
              return { ...cp, estado: 'archivado' as ContentState, updated_at: new Date().toISOString() };
            }
          }
          return cp;
        }),
        projectHistory: [...(s.projectHistory || []), phEvent],
      };
    }),

  updateFileProcessingState: (pieceId, fileId, processingState) =>
    set(s => ({
      contentPieces: s.contentPieces.map(cp =>
        cp.id === pieceId
          ? {
              ...cp,
              archivos: cp.archivos.map(f =>
                f.id === fileId ? { ...f, estado_procesamiento: processingState } : f
              ),
            }
          : cp
      )
    })),

  uploadFileAndProcess: (pieceId, fileData) => {
    const now = new Date().toISOString();
    set(s => {
      const cp = s.contentPieces.find(c => c.id === pieceId);
      let historyUpdate = {};
      if (cp) {
        const hasFiles = cp.archivos && cp.archivos.length > 0;
        const desc = hasFiles
          ? `Reemplazo de archivo multimedia en pieza "${cp.nombre}": nuevo archivo "${fileData.nombre}".`
          : `Carga de archivo multimedia "${fileData.nombre}" en pieza "${cp.nombre}".`;
        const phEvent: ProjectHistoryEvent = {
          id: `ph-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          client_id: cp.client_id,
          actor: 'Agencia',
          categoria: 'contenido',
          descripcion: desc,
          timestamp: now,
        };
        historyUpdate = { projectHistory: [...(s.projectHistory || []), phEvent] };
      }
      return {
        contentPieces: s.contentPieces.map(c => {
          if (c.id === pieceId) {
            const newFile = {
              id: fileData.id,
              nombre: fileData.nombre,
              tipo: fileData.tipo,
              url: fileData.url,
              tamanio_bytes: fileData.size,
              version: (c.archivos[0]?.version ?? 0) + 1,
              es_version_activa: true,
              subido_por_nombre: 'Agencia',
              created_at: now,
              estado_procesamiento: 'pending' as const,
              resolucion: fileData.tipo === 'video' ? '1080x1920 px' : '1080x1080 px',
              duracion_segundos: fileData.tipo === 'video' ? 15 : undefined,
              peso_formateado: fileData.size > 0 ? `${(fileData.size / 1024 / 1024).toFixed(1)} MB` : '4.2 MB',
              formato: fileData.tipo === 'video' ? 'MP4' : 'PNG',
            };
            return {
              ...c,
              archivos: [newFile],
              updated_at: now,
            };
          }
          return c;
        }),
        ...historyUpdate,
      };
    });

    // Disparar flujo de eventos asíncronos simulando backend storage triggers
    setTimeout(() => {
      get().updateFileProcessingState(pieceId, fileData.id, 'processing');
      setTimeout(() => {
        get().updateFileProcessingState(pieceId, fileData.id, 'ready');
      }, 1800);
    }, 1200);
  },

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
    set(s => {
      const piece = s.contentPieces.find(cp => cp.id === contentId);
      const client = s.clients.find(c => c.id === piece?.client_id);
      const agencyId = client?.agency_id || 'agency-pd';

      const historyEvent: StateHistoryEvent = {
        id: `sh-${Date.now()}`,
        content_piece_id: contentId,
        estado_anterior: piece?.estado,
        estado_nuevo: 'aprobado_final',
        actor: clientNombre,
        timestamp: new Date().toISOString(),
      };
      const phEvent: ProjectHistoryEvent = {
        id: `ph-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        client_id: piece?.client_id || '',
        actor: `${clientNombre} (Cliente)`,
        categoria: 'aprobacion',
        descripcion: `Pieza "${piece?.nombre || 'Sin nombre'}" aprobada oficialmente. Listo para publicar.`,
        timestamp: new Date().toISOString(),
      };
      const newNotification: FplusNotification = {
        id: `not-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        client_id: piece?.client_id || '',
        agency_id: agencyId,
        titulo: 'Publicación Aprobada',
        mensaje: `El cliente ${clientNombre} aprobó la pieza "${piece?.nombre || 'Sin nombre'}".`,
        leido: false,
        tipo: 'estado',
        destinatario: 'agencia',
        created_at: new Date().toISOString(),
      };
      return {
        contentPieces: s.contentPieces.map(cp =>
          cp.id === contentId
            ? { ...cp, estado: 'aprobado_final' as ContentState, updated_at: new Date().toISOString() }
            : cp
        ),
        stateHistory: [...s.stateHistory, historyEvent],
        projectHistory: [...(s.projectHistory || []), phEvent],
        notifications: [...(s.notifications || []), newNotification],
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
      };
    }),

  requestChanges: (contentId, comment, clientNombre) =>
    set(s => {
      const piece = s.contentPieces.find(cp => cp.id === contentId);
      const client = s.clients.find(c => c.id === piece?.client_id);
      const agencyId = client?.agency_id || 'agency-pd';

      const historyEvent: StateHistoryEvent = {
        id: `sh-${Date.now()}`,
        content_piece_id: contentId,
        estado_anterior: piece?.estado,
        estado_nuevo: 'cambios_solicitados',
        actor: clientNombre,
        timestamp: new Date().toISOString(),
      };
      const phEvent: ProjectHistoryEvent = {
        id: `ph-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        client_id: piece?.client_id || '',
        actor: `${clientNombre} (Cliente)`,
        categoria: 'aprobacion',
        descripcion: `Cambios solicitados en pieza "${piece?.nombre || 'Sin nombre'}": "${comment.slice(0, 50)}${comment.length > 50 ? '...' : ''}"`,
        timestamp: new Date().toISOString(),
      };
      const newNotification: FplusNotification = {
        id: `not-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        client_id: piece?.client_id || '',
        agency_id: agencyId,
        titulo: 'Cambios Solicitados',
        mensaje: `El cliente ${clientNombre} solicitó cambios en "${piece?.nombre || 'Sin nombre'}": "${comment.slice(0, 40)}..."`,
        leido: false,
        tipo: 'comentario',
        destinatario: 'agencia',
        created_at: new Date().toISOString(),
      };
      return {
        contentPieces: s.contentPieces.map(cp =>
          cp.id === contentId
            ? { ...cp, estado: 'cambios_solicitados' as ContentState, updated_at: new Date().toISOString() }
            : cp
        ),
        stateHistory: [...s.stateHistory, historyEvent],
        projectHistory: [...(s.projectHistory || []), phEvent],
        notifications: [...(s.notifications || []), newNotification],
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
      };
    }),

  addPortalComment: (contentId, comment) =>
    set(s => {
      const piece = s.contentPieces.find(cp => cp.id === contentId);
      const phEvent: ProjectHistoryEvent = {
        id: `ph-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        client_id: piece?.client_id || '',
        actor: comment.esAgencia ? 'Andrea Solís (Agencia)' : `${comment.autor} (Cliente)`,
        categoria: 'comentario',
        descripcion: `Nuevo comentario en pieza "${piece?.nombre || 'Sin nombre'}": "${comment.texto.slice(0, 50)}${comment.texto.length > 50 ? '...' : ''}"`,
        timestamp: new Date().toISOString(),
      };
      return {
        portalComments: {
          ...s.portalComments,
          [contentId]: [...(s.portalComments[contentId] ?? []), comment],
        },
        projectHistory: [...(s.projectHistory || []), phEvent],
      };
    }),

  addNotification: (clientId, agencyId, titulo, mensaje, tipo) =>
    set(s => {
      const newNotification: FplusNotification = {
        id: `not-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        client_id: clientId,
        agency_id: agencyId,
        titulo,
        mensaje,
        leido: false,
        tipo,
        created_at: new Date().toISOString(),
      };
      return {
        notifications: [...(s.notifications || []), newNotification],
      };
    }),

  markNotificationRead: (id) =>
    set(s => ({
      notifications: (s.notifications || []).map(n =>
        n.id === id ? { ...n, leido: true } : n
      ),
    })),

  clearNotificationsForClient: (clientId) =>
    set(s => ({
      notifications: (s.notifications || []).filter(n => n.client_id !== clientId),
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
    set(s => {
      const phEvent: ProjectHistoryEvent = {
        id: `ph-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        client_id: brief.client_id,
        actor: 'Agencia',
        categoria: 'brief',
        descripcion: `Respuestas y cambios guardados en el Brief Maestro del cliente.`,
        timestamp: new Date().toISOString(),
      };
      return {
        briefs: { ...s.briefs, [brief.client_id]: brief },
        projectHistory: [...(s.projectHistory || []), phEvent],
      };
    }),

  getBrief: (clientId) => get().briefs[clientId],

  addProjectHistoryEvent: (client_id, actor, categoria, descripcion, metadata) =>
    set(s => {
      const newEvent: ProjectHistoryEvent = {
        id: `ph-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        client_id,
        actor,
        categoria,
        descripcion,
        timestamp: new Date().toISOString(),
        metadata,
      };
      return {
        projectHistory: [...(s.projectHistory || []), newEvent]
      };
    }),
}), {
  name: 'fplus-store',
  version: 4,
  migrate: () => ({}) as FplusStore,
  // Los archivos base64 grandes pueden exceder la cuota de localStorage (~5MB):
  // se persiste todo menos las URLs de archivos que superen ~2MB por pieza.
  partialize: (state) => ({
    clients: state.clients.map(c => ({
      ...c,
      firma_contrato: c.firma_contrato
        ? { ...c.firma_contrato, imagen: '' }
        : undefined,
    })),
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
    projectHistory: state.projectHistory || [],
  } as any),
}));

// Export unused type aliases needed by creation forms
export type { ContentType, Platform, HealthStatus };
