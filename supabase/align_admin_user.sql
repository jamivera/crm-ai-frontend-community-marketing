-- ═══════════════════════════════════════════════════════════════════════════
-- CORRECCIÓN DE DATOS · Admin definitivo de Primero Digital (Auth ↔ modelo)
-- ═══════════════════════════════════════════════════════════════════════════
-- NO es una migración ni cambia el schema. Es una corrección de datos controlada.
-- Ejecutar en el SQL Editor del Dashboard de STAGING (conexión privilegiada).
--
-- Patrón Supabase: el UUID canónico del usuario es auth.users.id.
-- public.users se ALINEA a ese id (no al revés).
--
-- Requisito previo: haber creado tu admin en Auth → Users → Add user
-- (marca "Auto Confirm User"). Usa un email NO presente en el seed.
--
-- Efecto:
--   1. Inserta/actualiza tu fila en public.users con id = auth.users.id,
--      agency_id = Primero Digital, rol = agency_admin.
--   2. Deja UN SOLO admin: Andrea (seed) pasa de agency_admin a account_manager
--      (rol que ya cumple en los datos); su fila y todas sus FKs se conservan.
-- Idempotente: re-ejecutable sin efectos duplicados. Atómico (bloque DO).
-- ═══════════════════════════════════════════════════════════════════════════

do $$
declare
  -- >>> REEMPLAZA estos dos valores por los de tu usuario real de Auth <<<
  v_email  text := 'REEMPLAZA_tu-email@primerodigital.ec';
  v_nombre text := 'REEMPLAZA Tu Nombre';

  v_agency  uuid := '11111111-0000-0000-0000-000000000001';  -- Primero Digital
  v_andrea  uuid := '22222222-0000-0000-0000-000000000001';  -- admin del seed
  v_auth_id uuid;
begin
  -- Guarda: el usuario debe existir ya en auth.users.
  select id into v_auth_id from auth.users where lower(email) = lower(v_email);
  if v_auth_id is null then
    raise exception 'No hay usuario en auth.users con email %. Créalo primero en Auth → Users (Auto Confirm).', v_email;
  end if;

  -- 1 · public.users refleja el UUID canónico de Auth (upsert por id).
  insert into public.users (id, agency_id, email, nombre, rol, client_id, activo)
  values (v_auth_id, v_agency, v_email, v_nombre, 'agency_admin', null, true)
  on conflict (id) do update
    set agency_id = excluded.agency_id,
        email     = excluded.email,
        nombre    = excluded.nombre,
        rol       = 'agency_admin',
        activo    = true;

  -- 2 · Un único administrador: Andrea deja de ser agency_admin.
  --     Se conserva su fila (referenciada como account_manager en clientes/
  --     contenido y como actor en aprobaciones) — solo se ajusta su rol.
  update public.users
     set rol = 'account_manager'
   where id = v_andrea
     and id <> v_auth_id;

  raise notice 'Admin definitivo: % (%) · public.users.id = auth.users.id ✓', v_nombre, v_email;
end $$;

-- 3 · Verificación posterior: consistencia Auth ↔ modelo del admin definitivo.
select
  au.email,
  au.id                       as auth_id,
  pu.id                       as public_id,
  (au.id = pu.id)             as ids_coinciden,
  pu.rol,
  pu.agency_id,
  ag.nombre                   as agencia,
  pu.activo
from auth.users au
join public.users pu    on pu.id = au.id
join public.agencies ag on ag.id = pu.agency_id
order by au.email;
