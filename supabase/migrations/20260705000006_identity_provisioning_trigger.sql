-- ─── Migración 0006 · identity_provisioning_trigger ────────────────────────
-- Por qué:   ADR-011 — aprovisionamiento: todo auth.users produce public.users
--            con el UUID canónico, sin drift ni sincronización manual.
-- Resuelve:  trigger AFTER INSERT en auth.users → crea public.users leyendo
--            agency_id/rol/client_id SOLO de app_metadata (Regla 1).
-- Tablas:    escribe en public.users. No crea agencias/clientes/negocio.
-- Reversible: drop trigger on_auth_user_created + drop function handle_new_user.
-- Riesgos:   un error bloquea el signup → lógica mínima (Regla 2), a prueba de
--            nulos, idempotente (Regla 7). SECURITY DEFINER acotado.
-- ════════════════════════════════════════════════════════════════════════════

-- Responsabilidad ÚNICA (Regla 2): sincronizar auth.users → public.users.
-- SECURITY DEFINER con search_path fijado → todo va calificado por esquema.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_agency uuid;
  v_rol    text;
  v_client uuid;
  v_nombre text;
begin
  -- Fuente ÚNICA de verdad del contexto de tenant: app_metadata (Regla 1).
  -- En auth.users, app_metadata se almacena en raw_app_meta_data.
  v_agency := nullif(new.raw_app_meta_data ->> 'agency_id', '')::uuid;
  v_rol    := nullif(new.raw_app_meta_data ->> 'rol', '');
  v_client := nullif(new.raw_app_meta_data ->> 'client_id', '')::uuid;

  -- Nombre visible: NO es campo de seguridad → puede venir de user_metadata/OAuth.
  v_nombre := coalesce(
    nullif(new.raw_app_meta_data  ->> 'nombre', ''),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'name', ''),
    new.email
  );

  -- users.agency_id es NOT NULL: no hay identidad sin tenant. Un alta sin
  -- agency_id/rol es inválida (nunca signup abierto) → se rechaza sin dejar
  -- estado inconsistente. RAISE LOG no es transaccional → queda el diagnóstico.
  if v_agency is null or v_rol is null then
    raise log 'handle_new_user: alta SIN tenant · user=% email=% → rechazada (falta agency_id/rol en app_metadata)',
      new.id, new.email;
    raise exception 'Aprovisionamiento inválido: falta agency_id/rol en app_metadata (user %).', new.id;
  end if;

  -- Idempotente (Regla 7): si ya existe, no duplica ni altera.
  insert into public.users (id, agency_id, email, nombre, rol, client_id, activo)
  values (new.id, v_agency, new.email, v_nombre, v_rol::public.user_role, v_client, true)
  on conflict (id) do nothing;

  -- Observabilidad mínima (Regla 8): resultado técnico, sin lógica de negocio.
  if found then
    raise log 'handle_new_user: usuario aprovisionado · user=% email=% agency=% rol=%',
      new.id, new.email, v_agency, v_rol;
  else
    raise log 'handle_new_user: idempotente (ya existía) · user=% email=%', new.id, new.email;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
