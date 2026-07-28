-- ─── Migración 0011 · namespace_client_id ──────────────────────────────
-- Por qué:   el hook custom_access_token_hook sobrescribía el claim reservado
--            client_id (usado por GoTrue para OAuth), causando HTTP 500.
-- Resuelve:  se renombra el claim personalizado de JWT a fplus_client_id y se
--            actualiza el helper auth_client_id() de RLS para leer dicho claim.
-- Riesgos:   ninguno — compatibilidad total; no altera el trigger ni las tablas.
-- Reversible: redefinir la función auth_client_id y custom_access_token_hook con el nombre anterior.
-- Tablas:    ninguna.
-- ════════════════════════════════════════════════════════════════════════════

-- 1) Redefinir helper RLS para leer el nuevo nombre del claim
create or replace function public.auth_client_id() returns uuid
  language sql stable as $$ select nullif(auth.jwt() ->> 'fplus_client_id','')::uuid $$;

-- 2) Redefinir hook para inyectar fplus_client_id en lugar del claim reservado client_id
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
    -- fplus_client_id evita colisión con el claim client_id reservado de GoTrue
    if v_client is not null then
      v_claims := jsonb_set(v_claims, '{fplus_client_id}', to_jsonb(v_client::text), true);
    end if;
  end if;

  return jsonb_set(event, '{claims}', v_claims, true);
end;
$$;
