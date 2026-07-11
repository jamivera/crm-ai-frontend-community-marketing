# AI_HANDOVER · FPlus

> Traspaso completo para la siguiente IA/desarrollador. Asume que **el historial del chat desapareció**. Todo lo
> necesario para continuar sin nuestra memoria está aquí y en los demás docs de `docs/release/`.

## 1 · Dónde retomar
El **único punto abierto** es **ISSUE-001**: el login real falla con `POST /token 500` al ejecutar el Custom
Access Token Hook. Todo lo demás (schema, RLS, grants, trigger, bootstrap hasta `public.users`) está validado.

### Qué ya se descartó (con evidencia) — NO lo repitas
- El contrato del payload del hook coincide con la doc oficial (`user_id` top-level, `claims` objeto, return del event).
- La lógica de la función es correcta (corre bien como `postgres`).
- Los permisos de `supabase_auth_admin` están OK (`has_schema/table/function_privilege` = true, policy `auth_admin_read` presente).
- El hook estaba **sin registrar** en el Dashboard; ya se registró.

### Hipótesis vigente (NO confirmada)
El hook sobrescribe el claim **`client_id`** (reservado/gestionado por GoTrue en OAuth), poniéndolo en `null`
para el admin → posible fallo de validación post-hook. **No hay fuente oficial que lo demuestre.**

### Siguiente paso concreto
Obtener el **error exacto del hook en Postgres Logs** (Dashboard → Logs → Postgres, severidad ERROR, alrededor del
login). Es el método oficial de Supabase para 500 de auth y da la causa raíz sin adivinar. Con ese texto, decidir:
- Si es la colisión de `client_id` → fix definitivo = **namespacing** del claim (renombrar en el hook `custom_access_token_hook`
  y en el helper `auth_client_id()` de la migr. 0002). Evaluar promover o descartar la 0010 experimental.
- Si es otra cosa (p. ej. una excepción SQL, un claim requerido faltante, un timeout de 2s) → corregir eso.

## 2 · Cómo trabajar aquí (no negociable)
**Evidencia → Diagnóstico → Corrección mínima → Validación.** No inventes fixes; reprodúcelos con evidencia real.
No crees infraestructura por anticipado. No crees scripts de un solo uso (toolkit congelado). Congela decisiones
estratégicas en un ADR.

## 3 · Reglas de arquitectura que NO puedes romper
Ver `PROJECT_CONTEXT_FOR_AI.md` §"Las 10 cosas que NO debes hacer" y `ARCHITECTURE_FREEZE.md`. En especial:
`app_metadata` como fuente única; agencia = tenant; UUID canónico = `auth.users.id`; Trigger solo aprovisiona;
claims nuevos solo en el Hook; DAL como única puerta a supabase-js; Secret Key nunca en frontend/repo.

## 4 · Estado del flujo de identidad (qué funciona hoy)
```
Admin API → auth.users → Trigger handle_new_user → public.users   ✅ (ids_coinciden=true, rol=agency_admin)
public.users → Auth Hook → JWT (agency_id/rol/client_id)          ❌ POST /token 500  ← AQUÍ estás
JWT → DAL → RLS → datos del módulo                                 ⛔ bloqueado hasta resolver el Hook
```

## 5 · Herramientas para retomar
- `node supabase/test_migrations.mjs` → valida migraciones + seed + identidad en PGlite (Postgres real, sin Docker).
- `python3 supabase/validate_migrations.py` → gate estático.
- `supabase/verify_identity_infra.sql` / `verify_clean_state.sql` → verificación en el SQL Editor de Staging.
- `node supabase/bootstrap_admin.mjs` → crea el admin por el flujo oficial (necesita Secret Key en `.env`).
- `node supabase/test_clientes_dal_auth.mjs` → login real (hoy reproduce el 500; ya loguea `status/code/name/full`).

## 6 · Después del login: el Sprint 2 continúa
Conectar módulos en orden: Clientes → Dashboard → Brief → Contratos → Cronopost → Aprobaciones → Multimedia →
Campañas → Métricas. Por módulo: DAL → lectura → escritura → RLS → UI → e2e → congelar. Ver `ROADMAP.md`.

## 7 · Trampas conocidas (te ahorran horas)
- El SQL Editor corre como `postgres` (ignora RLS) → probar como `supabase_auth_admin` o con `has_*_privilege`.
- `set role supabase_auth_admin` está bloqueado en el SQL Editor.
- GoTrue escribe `app_metadata` en un UPDATE tras el INSERT (por eso el trigger es `INSERT OR UPDATE OF raw_app_meta_data`).
- La Secret Key `sb_secret_…` reemplaza al `service_role` legacy; funciona igual en supabase-js.
- Loguea el error completo (`status/code/name`), no solo `.message` (viene vacío en `AuthRetryableFetchError`).
Detalle en `LESSONS_LEARNED.md`.
