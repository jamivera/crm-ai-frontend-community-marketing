-- ─── Migración 0008 · service_role_grants ──────────────────────────────────
-- Por qué:   evidencia real — bootstrap_admin.mjs falló con 42501 en agencies.
--            service_role no tenía GRANT (la 0005 solo otorgó a authenticated).
-- Resuelve:  otorga a service_role SOLO lo que el bootstrap demostró necesitar.
-- Tablas:    SELECT en agencies y users (las 2 que lee el bootstrap por Data API).
-- Riesgos:   ninguno — service_role es de servidor (secreto) y ya ignora RLS.
-- Reversible: revoke select on agencies, users from service_role.
-- ════════════════════════════════════════════════════════════════════════════

-- SELECT mínimos que bootstrap_admin.mjs ejerce por PostgREST:
--   · agencies → verifica que la agencia existe antes de crear el admin.
--   · users    → verifica que el Trigger aprovisionó public.users.
grant select on agencies to service_role;
grant select on users    to service_role;
