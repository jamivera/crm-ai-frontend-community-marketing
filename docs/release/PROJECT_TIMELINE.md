# PROJECT_TIMELINE · FPlus

> Reconstrucción cronológica del proyecto. Fechas de migración en formato de versión (14 dígitos).

## Nacimiento
- Necesidad de Primero Digital: gestionar contenido/pauta de clientes con roles y portal.
- Decisión fundacional: construir FPlus como capa `/fplus/*` sobre **Evo CRM Community**, multi-tenant, 5–10 años.

## Sprint 0 · Frontend Beta (mock)
- Beta 0.9→0.96: Cronopost (Trello), aprobaciones, detalle de pieza, contraste, wizard de cliente,
  planificación-vs-producción, invitaciones, validaciones, estados de contrato, "Diseño Comodín", IA (Andrómeda),
  Centro de Estrategia (Campañas), firma electrónica, preparación de métricas. **Todo sobre mocks.**
- **Freeze de arquitectura v1.0:** `docs/architecture.md` + ADRs 001–010 + roadmap/backlog/principios.

## Sprint 1 · Base de datos
- Plataforma: Supabase Cloud, `us-east-1`, staging-first (ADR-010).
- Schema (32 tablas), RLS, soft-delete/audit, seed modular, DAL scaffold.
- Gate de validación: `validate_migrations.py` (estático) + `test_migrations.mjs` (PGlite, ejecución real).

## Sprint 1·B · Ejecución en Staging
- Migraciones 0001–0004 aplicadas por CLI. Bug RLS (`payments`/`feature_flags`) corregido.
- Aprendizaje: la fuente de verdad es el CLI + Dashboard, no la REST API.

## Sprint 2 · Conexión a datos reales (infraestructura de identidad)
| Hito | Evidencia / resultado |
|---|---|
| Prueba DAL con `anon` | `42501` en todas las tablas → **migr. 0005** (grants) |
| Congelar identidad | **ADR-011** (Trigger + Auth Hook + reglas 1–9) |
| Implementación | **0006** (trigger), **0007** (auth hook) |
| Bootstrap del admin | `42501` en `agencies` → **0008** (grants service_role) |
| createUser 500 | GoTrue aplica app_metadata post-INSERT → **0009** (fix timing). Bootstrap OK, `ids_coinciden=true` |
| Login real | `POST /token 500` en el hook → **ISSUE-001** → **0010 experimental** (hipótesis client_id, no validada) |

## Congelamientos
- Arquitectura v1.0 (Sprint 0). ADR-011 identidad (Sprint 2). **RC1 / Preservation Package** (este punto).
- Commit del freeze: `5a336eb` (2026-07-06).

## Estado actual (2026-07-10)
Identidad congelada (0001–0009), validada hasta `public.users`. Login bloqueado por ISSUE-001. Módulos en mock.
Documentación de preservación completa en `docs/release/`. Sin secretos en git. Listo para taggear tras aprobación.
