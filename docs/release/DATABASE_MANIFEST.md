# DATABASE_MANIFEST · FPlus

> Manifiesto de la base de datos: qué existe, cómo se organiza, cómo se protege y cómo se evoluciona.
> Fuente de verdad: `supabase/migrations/` (0001–0009 congeladas). Proyecto Staging: `rbhorgjriovyyeurzuiy`.

## 1 · Plataforma

- PostgreSQL 15 gestionado por Supabase, región `us-east-1`.
- Entornos: `fplus-staging` (desarrollo/validación) y `fplus-production` (clientes reales). Staging-first.
- Flujo oficial de migraciones (CLI): `supabase login` → `supabase link` → `supabase db push --include-seed`
  (Staging) / `supabase db push` (Producción). **La fuente de verdad del estado es el historial del CLI**
  (`supabase_migrations.schema_migrations`), no la REST API.

## 2 · Esquema (32 tablas, migr. 0001)

Familias principales (todas cuelgan de `agency_id`, directa o indirectamente):
- **Identidad/acceso:** `agencies`, `users`, `user_clients`, `user_invitations`.
- **Clientes/contratos:** `clients`, `plan_templates`, `contracts`, `contract_items`.
- **Contenido:** `briefs`, `smart_events`, `content_pieces`, `content_files`, `comments`, `approval_events`.
- **Pauta/campañas:** `campaigns`, `ad_accounts`, `ad_campaigns`, `ad_sets`, `ads`, `publications`, `metric_snapshots`.
- **Sistema/billing:** `integrations`, `ai_generations`, `feature_flags`, `subscription_plans`, `subscriptions`,
  `invoices`, `payments`, `jobs`, `audit_log`, `webhook_logs`, `notifications`.
- Vista: `v_content_performance`. UUIDs con `gen_random_uuid()` (no uuid-ossp).

## 3 · Aislamiento (RLS, migr. 0002)

- RLS habilitado en todas las tablas de negocio. Helpers que leen el JWT: `auth_agency_id()`, `auth_client_id()`,
  `auth_rol()`, `is_agency_user()`.
- Casos especiales: `payments` (sin `agency_id` → vía JOIN a `invoices`), `feature_flags` (agency_id nullable =
  global). `service_role` tiene `bypassrls`.
- **RLS es una segunda capa SOBRE los GRANTs:** sin GRANT, la query devuelve `42501` antes de evaluar RLS.

## 4 · Integridad y auditoría (migr. 0003)

- **Soft-delete:** `deleted_at` (nunca DELETE físico). Trigger `updated_at`. `fn_audit` → `audit_log`.
- Particiones por rango: `audit_log_2026`, `webhook_logs_2026` (PK compuesta `(id, created_at/received_at)`).

## 5 · Rendimiento de RLS (migr. 0004)

- 7 índices sobre columnas FK usadas en los JOINs de las policies (RLS corre en **cada** query).

## 6 · Privilegios (migr. 0005 y 0008)

- `authenticated`: `SELECT/INSERT/UPDATE` explícito por tabla (sin DELETE → soft-delete). `webhook_logs` excluida.
- `anon`: solo `SELECT` en `subscription_plans` (referencia pública).
- `service_role`: `SELECT` en `agencies` y `users` (lo mínimo demostrado por el bootstrap).

## 7 · Identidad (migr. 0006/0007/0009)

- `handle_new_user` (Trigger): `auth.users` → `public.users` con UUID canónico, leyendo `raw_app_meta_data`.
  `AFTER INSERT OR UPDATE OF raw_app_meta_data` (0009, por el timing de GoTrue). Idempotente.
- `custom_access_token_hook` (Hook): lee `public.users`, inyecta claims. Ejecutable solo por `supabase_auth_admin`
  (+ policy `auth_admin_read`).

## 8 · Seed

- Modular en `supabase/seed/` (10 archivos, orden en `config.toml [db.seed]`), idempotente, fechas relativas.
- Datos: Primero Digital (`11111111-…`), 5 clientes (`33333333-…`), 11 usuarios (`22222222-…`), 20 content_pieces, etc.
- Conteos esperados: `agencies=1, users=11, clients=5, content_pieces=20, …`.

## 9 · Cómo se valida (obligatorio antes de push)

1. `python3 supabase/validate_migrations.py` — gate estático (naming, PG compat, RLS/JOIN, índices, ciclos).
2. `node supabase/test_migrations.mjs` — **ejecución real** en PGlite (Postgres WASM) de migraciones + seed +
   flujo de identidad end-to-end. Sin Docker.

## 10 · Política de evolución

8 reglas inviolables (`docs/database-policy.md`): nunca DDL manual en producción, migraciones reversibles,
staging-first, validar antes de aplicar, cada migración responde a un problema demostrado. La 0010 es
**experimental** y no forma parte del freeze.
