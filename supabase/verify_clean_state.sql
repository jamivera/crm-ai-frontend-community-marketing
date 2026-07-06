-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN DE ESTADO LIMPIO · previo al bootstrap del primer admin
-- ═══════════════════════════════════════════════════════════════════════════
-- Ejecutar en el SQL Editor de STAGING, DESPUÉS de verify_identity_infra.sql.
-- SOLO LECTURA. Confirma que llegamos al bootstrap con un estado conocido:
-- sin usuarios reales provisionados, sin restos de pruebas, sin duplicados ni
-- drift, y sin aprovisionamiento accidental del Trigger.

-- 1 · Conteos globales.
--     Esperado (estado limpio):
--       auth_users            = 0   (aún no se crea ningún usuario real)
--       public_users          = 11  (solo el seed del equipo Primero Digital)
--       public_provisionados  = 0   (ninguna fila de public.users existe en auth.users)
--       public_solo_seed      = 11  (todo public.users es seed, sin identidad en Auth)
select
  (select count(*) from auth.users)   as auth_users,
  (select count(*) from public.users) as public_users,
  (select count(*) from public.users pu
     where exists (select 1 from auth.users au where au.id = pu.id))     as public_provisionados,
  (select count(*) from public.users pu
     where not exists (select 1 from auth.users au where au.id = pu.id)) as public_solo_seed;

-- 2 · ¿Hay restos de pruebas anteriores en auth.users?
--     Esperado: 0 filas. Si aparece alguna, es un resto → borrarla en el
--     Dashboard (Auth → Users) ANTES del bootstrap (no borrar auth.users por SQL).
select id, email,
       (email_confirmed_at is not null)   as confirmado,
       (raw_app_meta_data ? 'agency_id')  as tiene_agency_meta,
       created_at
from auth.users
order by created_at;

-- 3 · ¿El Trigger ya aprovisionó algo? (filas de public.users que existen en auth.users)
--     Esperado: 0 filas → ningún aprovisionamiento accidental todavía.
select pu.id, pu.email, pu.rol, pu.agency_id, pu.created_at
from public.users pu
join auth.users au on au.id = pu.id
order by pu.created_at;

-- 4 · Drift: mismo email en ambas tablas pero con id distinto (el bug a evitar).
--     Esperado: 0 filas.
select au.email, au.id as auth_id, pu.id as public_id
from auth.users au
join public.users pu on lower(pu.email) = lower(au.email)
where au.id <> pu.id;

-- 5 · Huérfanos en Auth: usuarios en auth.users sin fila en public.users.
--     Esperado: 0 filas (con auth.users vacío). Si aparece, es un resto
--     anterior al Trigger → limpiar en el Dashboard antes de continuar.
select au.id, au.email
from auth.users au
left join public.users pu on pu.id = au.id
where pu.id is null;
