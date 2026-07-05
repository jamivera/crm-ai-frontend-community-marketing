// ─── Data Access Layer — contratos de servicio ──────────────────────────────
// El frontend depende SOLO de estas interfaces, nunca de una implementación
// concreta (Supabase, NestJS, etc.). Migrar de proveedor = nueva implementación
// de estas interfaces, sin tocar la app. Ver ADR-004 y Principio 1.
//
// Se declaran de forma incremental: cada sprint añade los métodos del módulo que
// migra. Las firmas espejan las acciones actuales del store para una transición
// 1:1 sin cambiar las pantallas.

import type {
  Client, BriefMaestro, ContentPiece, Campaign, ContentFile,
} from '../../types';

// Resultado uniforme: nunca se lanza; se devuelve error tipado (Principio/convención §6).
export type Result<T> = { data: T; error: null } | { data: null; error: string };

export interface IClientService {
  list(): Promise<Result<Client[]>>;
  get(id: string): Promise<Result<Client>>;
  create(client: Client): Promise<Result<Client>>;
  update(id: string, data: Partial<Client>): Promise<Result<Client>>;
  archive(id: string): Promise<Result<void>>;          // soft delete (Principio 7)
  invite(id: string, email: string): Promise<Result<{ token: string }>>;
}

export interface IBriefService {
  get(clientId: string): Promise<Result<BriefMaestro | null>>;
  save(brief: BriefMaestro): Promise<Result<BriefMaestro>>;
}

export interface IContentService {
  listByClient(clientId: string): Promise<Result<ContentPiece[]>>;
  create(piece: ContentPiece): Promise<Result<ContentPiece>>;
  createMany(pieces: ContentPiece[]): Promise<Result<ContentPiece[]>>;
  update(id: string, data: Partial<ContentPiece>): Promise<Result<ContentPiece>>;
  delete(id: string): Promise<Result<void>>;
  approve(id: string, actor: string): Promise<Result<void>>;
  requestChanges(id: string, comment: string, actor: string): Promise<Result<void>>;
}

export interface ICampaignService {
  listByClient(clientId: string): Promise<Result<Campaign[]>>;
  save(campaign: Campaign): Promise<Result<Campaign>>;
}

export interface IMediaService {
  upload(clientId: string, pieceId: string, file: File): Promise<Result<ContentFile>>;
  getUrl(objectKey: string): Promise<Result<string>>; // nunca se hardcodea la URL (Principio 10)
}

export interface IMetricsService {
  getContentPerformance(clientId: string): Promise<Result<unknown[]>>;
}

// Agregado de todos los servicios que expone el DAL.
export interface DataAccessLayer {
  clients: IClientService;
  briefs: IBriefService;
  content: IContentService;
  campaigns: ICampaignService;
  media: IMediaService;
  metrics: IMetricsService;
}
