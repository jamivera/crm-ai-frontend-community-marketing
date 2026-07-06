-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN · Consistencia Supabase Auth ↔ modelo de datos (FPlus)
-- ═══════════════════════════════════════════════════════════════════════════
-- Ejecutar en el SQL Editor del Dashboard de STAGING (conexión privilegiada:
-- el DAL no puede leer auth.users ni public.users sin claims).
-- Es SOLO LECTURA — no modifica nada. Objetivo: confirmar que el usuario
-- administrador de Primero Digital quedó correctamente relacionado con
-- users / agencies / user_clients / rol / agency_id, y que su id de Auth
-- coincide con el de public.users (requisito del futuro Auth Hook · auth.uid()).

-- 1 · ¿Qué usuarios existen en Supabase Auth?
select id as auth_id,
       email,
       (email_confirmed_at is not null) as confirmado,
       created_at
from auth.users
order by created_at;

-- 2 · Cruce Auth ↔ public.users por email:
--     ¿está vinculado?  ¿los id coinciden?  ¿qué rol / agencia tiene?
select
  au.email,
  au.id                       as auth_id,
  pu.id                       as public_id,
  (au.id = pu.id)             as ids_coinciden,   -- CRÍTICO para el Auth Hook
  pu.rol,
  pu.agency_id,
  ag.nombre                   as agencia,
  pu.client_id,
  pu.activo
from auth.users au
left join public.users pu    on lower(pu.email) = lower(au.email)
left join public.agencies ag on ag.id = pu.agency_id
order by au.email;

-- 3 · Vínculos usuario↔cliente (portal), si aplican
select uc.user_id, u.email, uc.client_id, c.nombre as cliente, uc.rol
from public.user_clients uc
join public.users u   on u.id = uc.user_id
join public.clients c on c.id = uc.client_id
order by u.email;

-- 4 · Admin(s) de agencia según el modelo (referencia del seed)
select id, email, nombre, rol, agency_id, client_id, activo
from public.users
where rol = 'agency_admin'
order by email;
