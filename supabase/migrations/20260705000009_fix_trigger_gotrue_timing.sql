-- ─── Migración 0009 · fix_trigger_gotrue_timing ────────────────────────────
-- Por qué:   logs — GoTrue escribe el app_metadata en un UPDATE tras el INSERT;
--            el trigger AFTER INSERT corría antes → raise → rollback → 500.
-- Resuelve:  el trigger cubre el UPDATE de raw_app_meta_data y, sin tenant aún,
--            sale en silencio (no bloquea el INSERT).
-- Tablas:    aprovisiona public.users (responsabilidad única, como 0006).
-- Reversible: restaurar función/trigger tal como los definió la 0006.
-- Riesgos:   ninguno — no toca el modelo; idempotente por ON CONFLICT.
-- ════════════════════════════════════════════════════════════════════════════

-- Función: idéntica a 0006 salvo que, si falta el tenant, RETURN NEW en vez de
-- RAISE (GoTrue aplica app_metadata tras el INSERT → se aprovisiona en el UPDATE).
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
  -- Fuente ÚNICA de verdad del tenant: app_metadata (Regla 1).
  v_agency := nullif(new.raw_app_meta_data ->> 'agency_id', '')::uuid;
  v_rol    := nullif(new.raw_app_meta_data ->> 'rol', '');
  v_client := nullif(new.raw_app_meta_data ->> 'client_id', '')::uuid;

  -- Tenant aún ausente (INSERT inicial de GoTrue): salir sin error ni cambios.
  -- Se aprovisionará en la pasada del UPDATE que trae agency_id/rol.
  if v_agency is null or v_rol is null then
    return new;
  end if;

  -- Nombre visible: NO es campo de seguridad (Regla 1 no aplica a nombre).
  v_nombre := coalesce(
    nullif(new.raw_app_meta_data  ->> 'nombre', ''),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'name', ''),
    new.email
  );

  -- Aprovisiona UNA sola vez: si el id ya existe, ni reinserta ni modifica
  -- (Reglas 6 y 7). Cambios posteriores de rol/tenant → Backend/DAL, no el trigger.
  insert into public.users (id, agency_id, email, nombre, rol, client_id, activo)
  values (new.id, v_agency, new.email, v_nombre, v_rol::public.user_role, v_client, true)
  on conflict (id) do nothing;

  -- Observabilidad mínima (Regla 8): solo cuando realmente se creó la fila.
  if found then
    raise log 'handle_new_user: usuario aprovisionado · user=% email=% agency=% rol=%',
      new.id, new.email, v_agency, v_rol;
  end if;

  return new;
end;
$$;

-- Redefine el trigger: cubre el UPDATE de app_metadata de GoTrue.
-- Acotado a "of raw_app_meta_data" → los updates normales (last_sign_in_at, etc.)
-- NO disparan el trigger.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update of raw_app_meta_data on auth.users
  for each row execute function public.handle_new_user();
