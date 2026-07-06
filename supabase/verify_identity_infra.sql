-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN DE INFRAESTRUCTURA · Identidad (ADR-011 · migraciones 0006/0007)
-- ═══════════════════════════════════════════════════════════════════════════
-- Ejecutar en el SQL Editor de STAGING, DESPUÉS de `supabase db push`.
-- SOLO LECTURA — no crea ni modifica nada. Confirma que Trigger y Auth Hook
-- quedaron correctamente registrados ANTES de crear el primer usuario real.

-- 1 · Las dos funciones existen, con lenguaje y seguridad esperados.
--     Esperado: handle_new_user (security_definer = true, search_path fijado),
--     custom_access_token_hook (security_definer = false, stable).
select p.proname                                   as funcion,
       pg_get_function_identity_arguments(p.oid)   as args,
       l.lanname                                   as lenguaje,
       p.prosecdef                                 as security_definer,
       p.proconfig                                 as config      -- search_path
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
join pg_language  l on l.oid = p.prolang
where n.nspname = 'public'
  and p.proname in ('handle_new_user','custom_access_token_hook')
order by p.proname;

-- 2 · El Trigger quedó asociado a auth.users (AFTER INSERT, habilitado).
--     Esperado: 1 fila · on_auth_user_created · enabled = 'O' (origin/enabled).
select t.tgname                as trigger,
       n.nspname || '.' || c.relname as tabla,
       t.tgenabled            as enabled,
       pg_get_triggerdef(t.oid) as definicion
from pg_trigger t
join pg_class     c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where not t.tgisinternal
  and n.nspname = 'auth' and c.relname = 'users';

-- 3 · Privilegios de ejecución del Auth Hook.
--     Esperado: supabase_auth_admin = true · authenticated = false · anon = false.
select
  has_function_privilege('supabase_auth_admin', 'public.custom_access_token_hook(jsonb)', 'execute') as auth_admin_puede,
  has_function_privilege('authenticated',       'public.custom_access_token_hook(jsonb)', 'execute') as authenticated_puede,
  has_function_privilege('anon',                'public.custom_access_token_hook(jsonb)', 'execute') as anon_puede;

-- 4 · Policy de lectura del hook sobre public.users (solo supabase_auth_admin).
--     Esperado: aparece auth_admin_read · cmd = SELECT · roles = {supabase_auth_admin}.
select policyname, cmd, roles, qual
from pg_policies
where schemaname = 'public' and tablename = 'users'
order by policyname;

-- 5 · Prueba funcional del hook con un usuario del seed (sin crear nada nuevo).
--     Esperado: claims con agency_id de Primero Digital y rol = agency_admin.
select public.custom_access_token_hook(
  jsonb_build_object(
    'user_id', '22222222-0000-0000-0000-000000000001',   -- Andrea (seed)
    'claims',  '{}'::jsonb
  )
) as hook_output;
