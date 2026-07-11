# RELEASE_NOTES · FPlus RC1 — "Freeze: Identity Infrastructure"

**Tag propuesto:** `rc1` · **Commit base:** `5a336eb` · **Fecha:** 2026-07-06 · **Rama:** `main`

## Resumen del Sprint

El Sprint 2 conecta FPlus (hasta ahora 100% mocks) a una base de datos real de Supabase, **módulo por módulo**,
manteniendo la app funcional. Este RC congela la **primera gran pieza**: la **infraestructura de identidad
multi-tenant** (cómo un usuario real de una agencia existe, se aprovisiona y obtiene sus permisos).

## Qué se logró en este RC

- **Base de datos completa** en Staging: 32 tablas, RLS multi-tenant, soft-delete + audit, índices de RLS, seed consistente (Primero Digital + 5 clientes + equipo).
- **Arquitectura de identidad congelada (ADR-011):** Trigger de aprovisionamiento + Custom Access Token Hook + separación estricta de responsabilidades (Backend/DAL vs Edge Functions).
- **Flujo de identidad validado end-to-end hasta `public.users`:** `Admin API → auth.users → Trigger → public.users` con UUID canónico (`ids_coinciden = true`).
- **Toolkit de verificación oficial** (6 scripts + gate de validación estático + prueba de ejecución real en PGlite).
- **Grants explícitos** por rol (authenticated, anon, service_role) — resueltos por evidencia (errores 42501 reales), sin permisos globales.

## Arquitectura congelada

Ver [ARCHITECTURE_FREEZE.md](ARCHITECTURE_FREEZE.md) y [ARCHITECTURE_DECISIONS.md](ARCHITECTURE_DECISIONS.md).
La identidad oficial termina en la **migración 0009**.

## Migraciones incluidas (freeze)

`0001` schema · `0002` RLS · `0003` soft-delete/audit · `0004` índices RLS · `0005` grants+RLS faltante ·
`0006` trigger aprovisionamiento · `0007` auth hook · `0008` grants service_role · `0009` fix timing GoTrue.
Detalle en [MIGRATION_JOURNAL.md](MIGRATION_JOURNAL.md) y [CHANGELOG_FPLUS.md](CHANGELOG_FPLUS.md).

## Fuera del freeze (experimental)

- **Migración 0010** (`fix_auth_hook_client_id`): investigación experimental del ISSUE-001, **no validada**.

## Problemas resueltos durante el Sprint

- RLS bug en `payments`/`feature_flags` (0002).
- `42501 permission denied` por falta de GRANTs a `anon`/`authenticated` (0005) y a `service_role` (0008).
- Trigger que hacía rollback del signup porque GoTrue escribe `app_metadata` **después** del INSERT (0009).
- Errores enmascarados por logging incompleto (solo `.message`) → observabilidad ampliada.

## Problemas pendientes

- **ISSUE-001:** `POST /token 500` en el Custom Access Token Hook. Login real aún no funciona. Ver [KNOWN_ISSUES.md](KNOWN_ISSUES.md).

## Decisiones importantes

- `app_metadata` es la **única** fuente de verdad del tenant/rol (nunca `user_metadata` ni frontend).
- La **agencia es el tenant**; el usuario nunca lo es.
- UUID canónico = `auth.users.id`; `public.users` lo refleja.
- Cada migración responde a un **problema demostrado**; no se crea infraestructura por anticipado.

## Estado del proyecto

Infraestructura de identidad **congelada y documentada**, con un único issue abierto (login). Listo para
subir a GitHub, taggear `rc1` y comenzar la evaluación de Antigravity. Ver [PROJECT_STATUS.md](PROJECT_STATUS.md).
