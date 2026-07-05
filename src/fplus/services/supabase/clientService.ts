import { getSupabase } from '../supabaseClient';
import type { IClientService, Result } from '../interfaces';
import type { Client } from '../../types';

// ─── Implementación Supabase de referencia: IClientService ───────────────────
// Establece el PATRÓN que seguirán los demás servicios del DAL:
//   · Única capa que toca supabase-js.
//   · Filtra deleted_at IS NULL (soft delete, Principio 7).
//   · El aislamiento por agency_id lo garantiza RLS en la base (ADR-006);
//     el servicio no necesita añadir el filtro manualmente.
//   · Devuelve Result<T> tipado; nunca lanza.
//
// Los demás servicios (brief, content, campaigns, media, metrics) se implementan
// con este mismo molde conforme cada módulo se migra en los próximos sprints.

function fail<T>(msg: string): Result<T> {
  return { data: null, error: msg };
}

export const clientService: IClientService = {
  async list() {
    const sb = getSupabase();
    if (!sb) return fail('Supabase no configurado');
    const { data, error } = await sb
      .from('clients')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error) return fail(error.message);
    return { data: data as Client[], error: null };
  },

  async get(id) {
    const sb = getSupabase();
    if (!sb) return fail('Supabase no configurado');
    const { data, error } = await sb
      .from('clients')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();
    if (error) return fail(error.message);
    return { data: data as Client, error: null };
  },

  async create(client) {
    const sb = getSupabase();
    if (!sb) return fail('Supabase no configurado');
    const { data, error } = await sb.from('clients').insert(client).select().single();
    if (error) return fail(error.message);
    return { data: data as Client, error: null };
  },

  async update(id, patch) {
    const sb = getSupabase();
    if (!sb) return fail('Supabase no configurado');
    const { data, error } = await sb
      .from('clients')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) return fail(error.message);
    return { data: data as Client, error: null };
  },

  async archive(id) {
    const sb = getSupabase();
    if (!sb) return fail('Supabase no configurado');
    // Soft delete: nunca se borra físicamente (Principio 7).
    const { error } = await sb
      .from('clients')
      .update({ deleted_at: new Date().toISOString(), estado: 'inactivo' })
      .eq('id', id);
    if (error) return fail(error.message);
    return { data: undefined, error: null };
  },

  async invite(id, email) {
    const sb = getSupabase();
    if (!sb) return fail('Supabase no configurado');
    // El envío del correo lo hace una Edge Function (secretos en el servidor,
    // Principio 4/5). Aquí solo se registra la invitación.
    const token = crypto.randomUUID();
    const { error } = await sb.from('user_invitations').insert({
      client_id: id,
      email,
      rol: 'client_standard',
      token,
    });
    if (error) return fail(error.message);
    return { data: { token }, error: null };
  },
};
