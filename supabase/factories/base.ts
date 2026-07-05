// ─── Factories · contrato base y utilidades ─────────────────────────────────
// Contrato común a todas las factories. Cada una construye N registros del tipo
// que le corresponde y los inserta en lote respetando el schema y las relaciones.
//
// Ejecutar solo en el entorno de scripts (Node), nunca en el frontend: usan la
// service_role key (Principio 4).

import type { SupabaseClient } from '@supabase/supabase-js';

export interface Factory<TInput, TRow> {
  /** Construye N filas en memoria (sin insertar). */
  build(count: number, input: TInput): TRow[];
  /** Construye e inserta N filas en lote; devuelve las filas creadas. */
  create(sb: SupabaseClient, count: number, input: TInput): Promise<TRow[]>;
}

// ─── Utilidades de generación ────────────────────────────────────────────────

export const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const between = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

/** Fecha relativa a hoy, en ISO (para que el dato generado nunca quede obsoleto). */
export const relativeDate = (daysFromNow: number): string =>
  new Date(Date.now() + daysFromNow * 86400000).toISOString();

/** Inserta en lotes para no exceder límites de payload. */
export async function insertInBatches<T extends object>(
  sb: SupabaseClient, table: string, rows: T[], batchSize = 500,
): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { data, error } = await sb.from(table).insert(batch).select();
    if (error) throw new Error(`${table}: ${error.message}`);
    out.push(...((data ?? []) as T[]));
  }
  return out;
}
