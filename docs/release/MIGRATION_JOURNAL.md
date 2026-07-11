# MIGRATION_JOURNAL · FPlus

> El **diario empírico**: no solo qué hace cada migración, sino qué problema real la provocó, cómo se
> diagnosticó y cómo se validó. Ejemplo vivo de la metodología Evidencia → Diagnóstico → Corrección → Validación.

## 0001–0004 · Fundación (Sprint 1)
Schema (32 tablas), RLS, soft-delete/audit, índices de RLS. Validadas por ejecución real en PGlite.
- **Aprendizaje:** `uuid_generate_v4`/uuid-ossp no eran compatibles → migrado a `gen_random_uuid()`.
- **Bug corregido:** la RLS 0002 falló con `column "agency_id" does not exist` porque `payments` no tiene
  `agency_id` (tenant vía `invoices`) y `feature_flags` lo tiene nullable (global). Corregido con policies propias.
- **Hallazgo del validador:** 7 columnas FK de JOINs de RLS sin índice → migración 0004.

## 0005 · grants_and_missing_rls
- **Evidencia:** `test_clientes_dal.mjs` conectó Clientes con la publishable key (rol `anon`) → **`42501 permission
  denied`** en TODAS las tablas, incluida una con policy permisiva.
- **Diagnóstico:** RLS es 2ª capa **sobre** los GRANTs; sin GRANT a los roles de API, nada pasa. Las tablas creadas
  por migración no auto-otorgan permisos.
- **Corrección mínima:** GRANT explícito por tabla a `authenticated`, SELECT a `anon` en `subscription_plans`,
  RLS en 4 tablas sin proteger. Sin `GRANT ALL`, sin default privileges (decisión del usuario).

## 0006 · identity_provisioning_trigger
- Trigger `handle_new_user` (AFTER INSERT) que crea `public.users` desde `app_metadata`. Idempotente + `RAISE LOG`.
- Validado en PGlite con `auth.users` stub.

## 0007 · auth_hook_custom_claims
- `custom_access_token_hook` lee `public.users` e inyecta `agency_id/rol/client_id`. Grants + policy `auth_admin_read`.

## 0008 · service_role_grants
- **Evidencia:** `bootstrap_admin.mjs` falló con `42501 permission denied for table agencies`.
- **Diagnóstico (confirmado con `has_table_privilege`):** `service_role` no tenía GRANT (la 0005 solo otorgó a
  `authenticated`/`anon`). La Secret Key mapea a `service_role`, que existe pero no tenía privilegios de tabla.
- **Corrección mínima:** `SELECT` a `service_role` en las 2 tablas que el bootstrap lee (`agencies`, `users`).

## 0009 · fix_trigger_gotrue_timing
- **Evidencia:** al crear el admin, `createUser` daba **500 (`AuthRetryableFetchError`)**; en Postgres Logs:
  `handle_new_user: alta SIN tenant → rechazada`.
- **Diagnóstico:** GoTrue hace el INSERT en `auth.users` y aplica el `app_metadata` en un **UPDATE posterior**;
  el trigger `AFTER INSERT` corría antes de que existiera el tenant → `raise` → rollback → 500.
- **Corrección mínima:** trigger pasa a `AFTER INSERT OR UPDATE OF raw_app_meta_data`; sin tenant → `return new`
  (no bloquea). Idempotente por `ON CONFLICT`. Validado simulando el flujo real de GoTrue en PGlite.
- **Resultado:** bootstrap end-to-end OK (`Admin API → auth.users → Trigger → public.users`, `ids_coinciden=true`).

## 0010 · fix_auth_hook_client_id — 🧪 EXPERIMENTAL, NO VALIDADA
- **Contexto:** tras registrar el hook, el **login real** falla con `POST /token 500`.
- **Descartado con evidencia:** contrato del payload (doc oficial), lógica del hook (corre como `postgres`),
  permisos (`has_*` = true, policy presente).
- **Hipótesis (no confirmada):** el hook sobrescribe el claim reservado `client_id` (que GoTrue usa en OAuth),
  poniéndolo en `null` para el admin.
- **Cambio experimental:** no escribir `client_id` cuando es null. **No hay fuente oficial** que demuestre esta
  relación con el 500. Pendiente confirmar con el error exacto de Postgres Logs.
- **Estado:** investigación. NO forma parte del freeze de identidad (que termina en 0009). Ver ISSUE-001.

## Notas de proceso (aplican a todo el diario)
- Validación obligatoria: `validate_migrations.py` + `test_migrations.mjs` en verde **antes** de cada `db push`.
- El usuario aplica `db push` en su máquina (los secretos viven solo en su `.env`).
- Los avisos de encabezado del validador (campos "Riesgos"/"Reversible" fuera de los primeros 600 chars) se
  corrigieron compactando cabeceras — no son bloqueantes.
