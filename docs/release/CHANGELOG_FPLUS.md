# CHANGELOG_FPLUS

> Changelog **exclusivo de FPlus** (no sobrescribe el `CHANGELOG.md` raíz de la base Evo CRM).
> Formato: cada entrada = migración/cambio · qué cambió · por qué · fecha.

## [RC1] — 2026-07-06 — Freeze: Identity Infrastructure

### Migraciones (arquitectura congelada, 0001–0009)

| Versión | Nombre | Qué cambió | Por qué |
|---|---|---|---|
| `20260704000001` | initial_schema | 32 tablas + enums + vista `v_content_performance`; `gen_random_uuid()` | Base del modelo multi-tenant |
| `20260704000002` | rls_policies | RLS + policies en todas las tablas de negocio; helpers `auth_agency_id/rol/client_id` | Aislamiento multi-tenant en la BD (ADR-006) |
| `20260704000003` | soft_delete_audit | `deleted_at`, trigger `updated_at`, `fn_audit`, particiones `audit_log_2026`/`webhook_logs_2026` | Nunca borrar; historial auditable |
| `20260704000004` | rls_performance_indexes | 7 índices sobre columnas FK usadas por JOINs de RLS | RLS corre en cada query → escalabilidad |
| `20260705000005` | grants_and_missing_rls | GRANT explícito por tabla a `authenticated`; SELECT a `anon` en `subscription_plans`; RLS en 4 tablas sin proteger | Evidencia: `42501` para anon en todas las tablas (RLS es 2ª capa sobre GRANTs) |
| `20260705000006` | identity_provisioning_trigger | Trigger `handle_new_user` (AFTER INSERT en `auth.users`) → crea `public.users` desde `app_metadata` | Aprovisionamiento atómico, agnóstico al origen (ADR-011) |
| `20260705000007` | auth_hook_custom_claims | `custom_access_token_hook` lee `public.users` e inyecta `agency_id/rol/client_id`; grants + policy `auth_admin_read` para `supabase_auth_admin` | Claims de tenant en el JWT para RLS |
| `20260705000008` | service_role_grants | SELECT a `service_role` en `agencies` y `users` | Evidencia: bootstrap dio `42501` (service_role sin GRANT) |
| `20260705000009` | fix_trigger_gotrue_timing | Trigger pasa a `AFTER INSERT OR UPDATE OF raw_app_meta_data`; sin tenant → `return new` (no raise) | Evidencia: GoTrue escribe `app_metadata` en un UPDATE tras el INSERT → el trigger hacía rollback (500 en createUser) |

### Experimental (NO parte del freeze)

| Versión | Nombre | Qué cambió | Estado |
|---|---|---|---|
| `20260705000010` | fix_auth_hook_client_id | El hook no escribe `client_id` cuando es null | 🧪 **Hipótesis no validada** del ISSUE-001 |

### Tooling / hygiene

- `.gitignore`: se añadió `supabase/.temp` y `supabase/.branches`; se ejecutó `git rm --cached` (sin borrar locales).
- Toolkit de verificación: `verify_identity_infra.sql`, `verify_clean_state.sql`, `test_migrations.mjs`, `test_clientes_dal.mjs`, `test_clientes_dal_auth.mjs`, `bootstrap_admin.mjs`, `validate_migrations.py`.
