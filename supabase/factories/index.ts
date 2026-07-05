// ─── Factories · orquestador de generación masiva ───────────────────────────
// Genera datos de VOLUMEN sobre un entorno ya sembrado (Staging), sin tocar el
// seed base. Uso previsto:
//   npx tsx supabase/factories/index.ts --agency <uuid> --clients 500
//
// Requiere SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el entorno del script
// (nunca en el frontend — Principio 4). Las factories aún-no-implementadas
// siguen el molde de clientFactory.

import { createClient } from '@supabase/supabase-js';
import { clientFactory } from './clientFactory';

// Stubs: se implementan con el mismo molde cuando se necesiten (post Sprint 1).
export const factories = {
  clients: clientFactory,
  // agencies, users, briefs, contracts, campaigns, content, media,
  // notifications, metrics → pendientes (ver README).
};

export async function runBulk(opts: {
  agencyId: string;
  accountManagerId: string;
  clients: number;
}) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY; // solo en el script
  if (!url || !key) throw new Error('Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');

  const sb = createClient(url, key);
  const created = await clientFactory.create(sb, opts.clients, {
    agencyId: opts.agencyId,
    accountManagerId: opts.accountManagerId,
  });
  // eslint-disable-next-line no-console
  console.log(`✓ Generados ${created.length} clientes de carga.`);
  return created;
}
