import { create } from 'zustand';
import {
  mockClients, mockCampaigns, mockContent,
  mockPublications, mockLeads, mockPortalComments,
} from '../mock';
import type { Client, Campaign, ContentPiece, Publication, Lead, ContentState, BriefMaestro } from '../types';

export interface PortalComment {
  id: string;
  autor: string;
  esAgencia: boolean;
  texto: string;
  timestamp: string;
}

interface FplusStore {
  // ─── Data ──────────────────────────────────────────────────────────────────
  clients: Client[];
  campaigns: Campaign[];
  contentPieces: ContentPiece[];
  publications: Publication[];
  leads: Lead[];
  briefs: Record<string, BriefMaestro>;
  portalComments: Record<string, PortalComment[]>;

  // ─── Content actions ───────────────────────────────────────────────────────
  updateContentState: (id: string, state: ContentState) => void;

  // ─── Publication actions ───────────────────────────────────────────────────
  createPublication: (pub: Publication) => void;
  updatePublication: (id: string, data: Partial<Publication>) => void;
  confirmPublication: (id: string, url: string, externalPostId?: string) => void;

  // ─── Portal actions (client-side) ──────────────────────────────────────────
  approveContent: (contentId: string, clientNombre: string) => void;
  requestChanges: (contentId: string, comment: string, clientNombre: string) => void;
  addPortalComment: (contentId: string, comment: PortalComment) => void;

  // ─── Brief actions ─────────────────────────────────────────────────────────
  saveBrief: (brief: BriefMaestro) => void;
  getBrief: (clientId: string) => BriefMaestro | undefined;
}

export const useFplusStore = create<FplusStore>((set, get) => ({
  clients: [...mockClients],
  campaigns: [...mockCampaigns],
  contentPieces: [...mockContent],
  publications: [...mockPublications],
  leads: [...mockLeads],
  briefs: {},
  portalComments: { ...mockPortalComments },

  // ─── Content ───────────────────────────────────────────────────────────────

  updateContentState: (id, state) =>
    set(s => ({
      contentPieces: s.contentPieces.map(cp =>
        cp.id === id
          ? { ...cp, estado: state, updated_at: new Date().toISOString() }
          : cp
      ),
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

  // ─── Brief ─────────────────────────────────────────────────────────────────

  saveBrief: (brief) =>
    set(s => ({
      briefs: { ...s.briefs, [brief.client_id]: brief },
    })),

  getBrief: (clientId) => get().briefs[clientId],
}));
