-- ─── Migración 0010 · fix_auth_hook_client_id ──────────────────────────────
-- Por qué:   el hook sobrescribía el claim client_id (que GoTrue usa en OAuth),
--            poniéndolo en null para usuarios sin client → POST /token 500.
-- Resuelve:  agency_id y rol como siempre; client_id SOLO si v_client no es null.
-- Riesgos:   ninguno — acotado a un claim; no toca trigger, RLS, grants ni bootstrap.
-- Reversible: restaurar la función tal como la definió la 0007.
-- Tablas:    ninguna — solo redefine custom_access_token_hook.
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  v_agency uuid;
  v_rol    text;
  v_client uuid;
  v_claims jsonb;
begin
  select u.agency_id, u.rol::text, u.client_id
    into v_agency, v_rol, v_client
    from public.users u
    where u.id = (event ->> 'user_id')::uuid;

  v_claims := coalesce(event -> 'claims', '{}'::jsonb);

  if v_agency is not null then
    v_claims := jsonb_set(v_claims, '{agency_id}', to_jsonb(v_agency::text), true);
    v_claims := jsonb_set(v_claims, '{rol}',       to_jsonb(coalesce(v_rol, '')), true);
    -- client_id solo cuando hay valor real; nunca sobrescribir con null el
    -- claim reservado/gestionado por GoTrue (evita el POST /token 500).
    if v_client is not null then
      v_claims := jsonb_set(v_claims, '{client_id}', to_jsonb(v_client::text), true);
    end if;
  end if;

  return jsonb_set(event, '{claims}', v_claims, true);
end;
$$;
