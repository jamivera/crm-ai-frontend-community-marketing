# SPRINT_HISTORY · FPlus

> Narrativa de cómo llegamos aquí — con el POR QUÉ, no solo el qué.

## Beta 0.9–0.96 · Frontend (mock mode)
Features de producto en el frontend, todas sobre mocks: Cronopost estilo Trello, flujo de aprobación, detalle de
pieza, correcciones de contraste, wizard de cliente, distinción planificación-vs-producción, invitación de
clientes, validaciones de formularios, estados de contrato, "Diseño Comodín", copy con IA (Andrómeda), Centro de
Estrategia (Campañas), firma electrónica, preparación de métricas.

## Freeze de arquitectura v1.0
Se congeló la "Constitución Técnica" (`docs/architecture.md`), 10 ADRs (001–010), roadmap, backlog, principios.
**Por qué:** pasar de prototipo a producto real exige decisiones estables y trazables.

## Sprint 1 · Base de datos
- Elección de plataforma: **Supabase Cloud**, `us-east-1`, dos proyectos Pro (staging + production), staging-first.
- Schema (32 tablas), RLS, soft-delete/audit, seed modular, DAL scaffold.
- Se construyó el **gate de validación**: `validate_migrations.py` (estático) + `test_migrations.mjs` (ejecución
  real en PGlite, Postgres WASM, sin Docker).
- **Por qué PGlite:** el usuario exigió validación de **ejecución**, no estática; PGlite corre Postgres real en
  Node sin servidor/Docker.

## Sprint 1·B · Ejecución en Staging
- Migraciones aplicadas por el CLI oficial. Bug de RLS (`payments`/`feature_flags`) detectado y corregido.
- **Aprendizaje clave:** la **fuente de verdad** es el historial del CLI y el Dashboard, no la REST API.

## Sprint 2 (en curso) · Conexión a datos reales
Estrategia: conectar módulo por módulo con `real mode` conmutable + fallback a mock. Orden: Clientes → Dashboard →
Brief → Contratos → Cronopost → Aprobaciones → Multimedia → Campañas → Métricas.

**Fase de Infraestructura de Identidad (este RC):**
1. Prueba empírica: `anon` → `42501` en todas las tablas → migración **0005** (grants).
2. Diseño y congelamiento de la arquitectura de identidad → **ADR-011** (Trigger + Auth Hook + reglas 1–9).
3. Implementación: **0006** (trigger), **0007** (hook).
4. Bootstrap del primer admin por el flujo real → `42501` en `agencies` → **0008** (grants service_role).
5. `createUser` 500 → GoTrue aplica `app_metadata` post-INSERT → **0009** (fix timing). Bootstrap OK.
6. Login real → `POST /token 500` en el hook → investigación (ISSUE-001) → **0010 experimental** (hipótesis client_id).

**Estado:** identidad validada hasta `public.users`; login bloqueado por ISSUE-001; se congela el RC1.

## Convención de trabajo adoptada durante el Sprint
- Metodología estricta: **Evidencia → Diagnóstico → Corrección mínima → Validación**.
- Toolkit de verificación **congelado** (no crear scripts de un solo uso).
- Decisiones estratégicas se congelan como **ADR**.
- Raíz oficial del proyecto: `/Users/jamil/AgencyOs` (no `Pailux`).
