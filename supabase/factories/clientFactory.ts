// ─── ClientFactory — referencia implementada ────────────────────────────────
// Molde que siguen las demás factories: build() genera en memoria, create()
// inserta en lote. Genera clientes ficticios coherentes para pruebas de carga.

import type { SupabaseClient } from '@supabase/supabase-js';
import { type Factory, pick, between, insertInBatches } from './base';

interface ClientInput {
  agencyId: string;
  accountManagerId: string;
}

interface ClientRow {
  agency_id: string;
  nombre: string;
  empresa: string;
  industria: string;
  tipo_mercado: string;
  email: string;
  account_manager_id: string;
  objetivo_marketing: string;
  estado: string;
  semaforo: string;
}

const MERCADOS = ['Restaurante', 'Belleza', 'Retail', 'Servicios Profesionales', 'B2B', 'Salud', 'Educación'] as const;
const OBJETIVOS = ['alcance', 'conversion', 'comunidad', 'lanzamiento'] as const;
const ESTADOS = ['activo', 'activo', 'activo', 'pausado'] as const; // sesgo a activo
const SEMAFOROS = ['verde', 'verde', 'amarillo', 'rojo'] as const;

export const clientFactory: Factory<ClientInput, ClientRow> = {
  build(count, input) {
    return Array.from({ length: count }, (_, i) => {
      const n = between(1000, 9999);
      const mercado = pick(MERCADOS);
      return {
        agency_id: input.agencyId,
        nombre: `Cliente Carga ${i + 1}-${n}`,
        empresa: `Empresa de Prueba ${n} S.A.`,
        industria: mercado,
        tipo_mercado: mercado,
        email: `carga${i + 1}.${n}@loadtest.local`,
        account_manager_id: input.accountManagerId,
        objetivo_marketing: pick(OBJETIVOS),
        estado: pick(ESTADOS),
        semaforo: pick(SEMAFOROS),
      };
    });
  },

  async create(sb: SupabaseClient, count, input) {
    const rows = this.build(count, input);
    return insertInBatches(sb, 'clients', rows);
  },
};
