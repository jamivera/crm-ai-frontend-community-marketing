import { getSupabase } from '../supabaseClient';
import type { IBriefService, Result } from '../interfaces';
import type { BriefMaestro } from '../../types';

function fail<T>(msg: string): Result<T> {
  return { data: null, error: msg };
}

function mapFromDb(db: any): BriefMaestro {
  return {
    client_id: db.client_id,
    objetivos_comerciales: db.objetivos_comerciales ?? undefined,
    servicios: db.servicios ?? undefined,
    productos: db.productos ?? undefined,
    ticket_promedio: db.ticket_promedio ?? undefined,
    presupuesto_marketing: db.presupuesto_marketing ?? undefined,
    proceso_comercial: db.proceso_comercial ?? undefined,
    embudo_actual: db.embudo_actual ?? undefined,
    propuesta_valor: db.propuesta_valor ?? '',
    diferenciadores: db.diferenciadores ?? '',
    competencia: db.competencia ?? '',
    historia_marca: db.historia_marca ?? '',
    perfil_cliente: db.perfil_cliente ?? '',
    rango_edad: db.rango_edad ?? '',
    ubicacion: db.ubicacion ?? '',
    pain_points: db.pain_points ?? '',
    motivaciones: db.motivaciones ?? '',
    objeciones: db.objeciones ?? '',
    pilares: db.pilares ?? [],
    tono: db.tono ?? [],
    formatos_preferidos: db.formatos_preferidos ?? [],
    que_no_hacer: db.que_no_hacer ?? '',
    hashtags_habituales: db.hashtags_habituales ?? [],
    plataformas_activas: db.plataformas_activas ?? [],
    frecuencia_semanal: db.frecuencia_semanal ?? 3,
    horarios_preferidos: db.horarios_preferidos ?? '',
    objetivo_principal: db.objetivo_principal ?? '',
    url_landing: db.url_landing ?? undefined,
    metadata: db.metadata ?? undefined,
    updated_at: db.updated_at ?? new Date().toISOString(),
  };
}

function mapToDb(brief: BriefMaestro): any {
  return {
    client_id: brief.client_id,
    objetivos_comerciales: brief.objetivos_comerciales || null,
    servicios: brief.servicios || null,
    productos: brief.productos || null,
    ticket_promedio: brief.ticket_promedio || null,
    presupuesto_marketing: brief.presupuesto_marketing || null,
    proceso_comercial: brief.proceso_comercial || null,
    embudo_actual: brief.embudo_actual || null,
    propuesta_valor: brief.propuesta_valor || '',
    diferenciadores: brief.diferenciadores || '',
    competencia: brief.competencia || '',
    historia_marca: brief.historia_marca || '',
    perfil_cliente: brief.perfil_cliente || '',
    rango_edad: brief.rango_edad || '',
    ubicacion: brief.ubicacion || '',
    pain_points: brief.pain_points || '',
    motivaciones: brief.motivaciones || '',
    objeciones: brief.objeciones || '',
    pilares: brief.pilares || [],
    tono: brief.tono || [],
    formatos_preferidos: brief.formatos_preferidos || [],
    que_no_hacer: brief.que_no_hacer || '',
    hashtags_habituales: brief.hashtags_habituales || [],
    plataformas_activas: brief.plataformas_activas || [],
    frecuencia_semanal: brief.frecuencia_semanal || 3,
    horarios_preferidos: brief.horarios_preferidos || '',
    objetivo_principal: brief.objetivo_principal || '',
    url_landing: brief.url_landing || null,
    metadata: brief.metadata || null,
    updated_at: new Date().toISOString(),
  };
}

export const briefService: IBriefService = {
  async get(clientId) {
    const sb = getSupabase();
    if (!sb) return fail('Supabase no configurado');
    
    const { data, error } = await sb
      .from('briefs')
      .select('*')
      .eq('client_id', clientId)
      .maybeSingle();

    if (error) return fail(error.message);
    if (!data) return { data: null, error: null };
    
    return { data: mapFromDb(data), error: null };
  },

  async save(brief) {
    const sb = getSupabase();
    if (!sb) return fail('Supabase no configurado');

    const dbPayload = mapToDb(brief);

    const { data, error } = await sb
      .from('briefs')
      .upsert(dbPayload, { onConflict: 'client_id' })
      .select()
      .single();

    if (error) return fail(error.message);
    return { data: mapFromDb(data), error: null };
  },
};
