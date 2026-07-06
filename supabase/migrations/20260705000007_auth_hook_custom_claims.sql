-- ─── Migración 0007 · auth_hook_custom_claims ──────────────────────────────
-- Por qué:   ADR-011 — los claims de tenant (agency_id, rol, client_id) deben
--            viajar en el JWT para que RLS aísle por tenant.
-- Resuelve:  custom_access_token_hook lee public.users (verdad de negocio,
--            Regla 3) e inyecta los claims. Todo claim futuro evoluciona AQUÍ,
--            no en el Trigger (Regla 9).
-- Tablas:    lee public.users (policy de solo lectura para supabase_auth_admin).
-- Reversible: revoke/grant inversos + drop function + drop policy auth_admin_read.
-- Riesgos:   si el hook falla, falla el login → función mínima y defensiva
--            (sin fila → sin claims → RLS deny seguro). Ejecutable solo por Auth.
-- ════════════════════════════════════════════════════════════════════════════

-- El hook corre como supabase_auth_admin. Lee public.users por PK (rápido).
-- No usa app_metadata en runtime: la verdad de negocio vive en public.users,
-- así el Backend cambia rol/tenant sin tocar Auth (se refleja al refrescar token).
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

  -- Defensivo: sin fila/tenant → no se inyectan claims → RLS filtra todo (deny).
  if v_agency is not null then
    v_claims := jsonb_set(v_claims, '{agency_id}', to_jsonb(v_agency::text), true);
    v_claims := jsonb_set(v_claims, '{rol}',       to_jsonb(coalesce(v_rol, '')), true);
    v_claims := jsonb_set(v_claims, '{client_id}',
      case when v_client is null then 'null'::jsonb else to_jsonb(v_client::text) end, true);
  end if;

  return jsonb_set(event, '{claims}', v_claims, true);
end;
$$;

-- Solo Auth (supabase_auth_admin) puede ejecutar el hook; nadie más.
grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;

-- El hook necesita leer public.users (que tiene RLS): policy de solo lectura
-- acotada al rol de Auth. No expone datos a usuarios finales.
grant select on public.users to supabase_auth_admin;
create policy auth_admin_read on public.users
  as permissive for select to supabase_auth_admin using (true);
