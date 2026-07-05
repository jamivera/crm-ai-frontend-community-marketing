import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// ─── Cliente Supabase (singleton) ────────────────────────────────────────────
// ÚNICO lugar de toda la app que crea el cliente de Supabase.
// El resto del código (componentes, store) NUNCA importa @supabase/supabase-js;
// consume el Data Access Layer (src/fplus/services). Ver ADR-004 y Principio 1.
//
// Las credenciales vienen de variables de entorno (nunca hardcodeadas):
//   VITE_SUPABASE_URL              — URL pública del proyecto
//   VITE_SUPABASE_PUBLISHABLE_KEY  — Publishable Key (sb_publishable_…), pública
// Supabase migró la antigua "anon key" a la nueva Publishable Key; ambas son
// PÚBLICAS y seguras en el frontend. La service_role / secret key JAMÁS llega
// al navegador (solo Edge Functions — Principio 4).

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
// Nueva Publishable Key; fallback al nombre anterior por compatibilidad.
const anonKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  ?? import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;

let client: SupabaseClient | null = null;

/** Devuelve el cliente Supabase, o null si aún no hay credenciales (modo demo). */
export function getSupabase(): SupabaseClient | null {
  if (client) return client;
  if (!url || !anonKey) return null; // entorno demo (mock + localStorage)
  client = createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return client;
}

/** true cuando hay un backend real conectado; false en modo demo local. */
export function hasSupabase(): boolean {
  return Boolean(url && anonKey);
}
