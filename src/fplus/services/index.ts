// ─── Data Access Layer — punto de entrada único ──────────────────────────────
// El resto de la app importa SOLO desde aquí (`import { services } from '...'`).
// Nunca importa supabase-js ni una implementación concreta. Ver ADR-004 / Principio 1.
//
// Hoy expone la implementación Supabase. Migrar a otro proveedor = cambiar estas
// asignaciones por otra implementación de las mismas interfaces; la app no se toca.

import type { DataAccessLayer } from './interfaces';
import { clientService } from './supabase/clientService';

// Servicios aún no migrados: se añaden con su implementación en los próximos
// sprints (mismo molde que clientService). Se marcan como pendientes para que
// TypeScript recuerde completarlos.
const notImplemented = (name: string) =>
  new Proxy({}, {
    get: () => async () => ({ data: null, error: `${name}: pendiente de migrar (Sprint posterior)` }),
  });

export const services: DataAccessLayer = {
  clients: clientService,
  briefs: notImplemented('briefs') as DataAccessLayer['briefs'],
  content: notImplemented('content') as DataAccessLayer['content'],
  campaigns: notImplemented('campaigns') as DataAccessLayer['campaigns'],
  media: notImplemented('media') as DataAccessLayer['media'],
  metrics: notImplemented('metrics') as DataAccessLayer['metrics'],
};

export type { DataAccessLayer, Result } from './interfaces';
export { hasSupabase } from './supabaseClient';
