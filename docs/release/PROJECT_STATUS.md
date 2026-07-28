# PROJECT_STATUS · FPlus — RC1 (Freeze Point)

**Fecha de congelamiento:** 2026-07-06 · **Commit base:** `5a336eb` · **Rama:** `main`
**Sprint actual:** Sprint 2 — *Conexión a datos reales (mocks → Supabase)*, fase de **Infraestructura de Identidad**.

> Este documento describe QUÉ está terminado, QUÉ falta, QUÉ está congelado y QUÉ está prohibido tocar.
> Es el punto oficial de arranque para la evaluación de Antigravity.

## 1 · Qué es FPlus (en una frase)

Un **Marketing Operating System** (SaaS multi-tenant para agencias de marketing), construido como una capa
`/fplus/*` sobre **Evo CRM Community**. Primer tenant real: **Primero Digital**. Diseñado como producto
independiente y escalable a 5–10 años.

## 2 · Estado global

| Área | Estado |
|---|---|
| Arquitectura de identidad (ADR-011) | ✅ **Congelada** (migraciones 0001→0009) |
| Base de datos (schema, RLS, seed, grants) | ✅ Validada en Staging |
| Trigger de aprovisionamiento (0006/0009) | ✅ Validado end-to-end (Admin API → auth.users → Trigger → public.users) |
| Auth Hook / claims en JWT (0007) | ✅ **Operativo y validado** (con namespacing de `fplus_client_id` en 0011) |
| Bootstrap del primer admin | ✅ Funciona hasta `public.users` con `ids_coinciden = true` |
| DAL (capa de servicios) | 🟡 Scaffold listo; módulos operando y persistiendo localmente |
| Frontend (módulos FPlus) | ✅ **Hito V1 Estabilizado**; módulos funcionales y persistentes localmente |
| Migración 0010 | 🧪 **EXPERIMENTAL** (hipótesis inicial; descartada en favor de 0011) |
| Migración 0011 | ✅ **namespacing de client_id** (resolución definitiva de ISSUE-001) |

## 3 · Estado por módulo (orden de migración del Sprint 2)

Ninguno está conectado a datos reales todavía; todos operan en **mock mode** (fallback seguro).

| # | Módulo | Estado | Notas |
|---|---|---|---|
| 1 | **Clientes** | ✅ **Estabilizado (V1 Local)** | CRUD e invitaciones operan en memoria local. |
| 2 | **Dashboard** | ✅ **Estabilizado (V1 Local)** | KPIs de control y timelines activos. |
| 3 | **Brief** | ✅ **Estabilizado (V1 Local)** | Guardado unificado y sugerencias AI funcionales. |
| 4 | **Contratos** | ✅ **Estabilizado (V1 Local)** | Creación y firma digital simulada. |
| 5 | **Cronopost / Calendario** | ✅ **Estabilizado (V1 Local)** | Reagendamiento (drag & drop) y validaciones completas. |
| 6 | **Aprobaciones** | ✅ **Estabilizado (V1 Local)** | Aprobación/Comentarios y campana de notificaciones. |
| 7 | **Multimedia** | ✅ **Estabilizado (V1 Local)** | Biblioteca visual, IndexedDB y link directo a pauta. |
| 8 | **Campañas** | ✅ **Estabilizado (V1 Local)** | Grilla de 3 niveles, columnas dinámicas y auto-equilibrio. |
| 9 | **Métricas** | ✅ **Estabilizado (V1 Local)** | Coherencia determinista via metricsProvider. |

## 4 · Qué está CONGELADO (no modificar sin nuevo ADR)

- La arquitectura de identidad completa: **Trigger + Auth Hook + DAL + Edge Functions** (ADR-011).
- Las **6 reglas** + 3 ajustes del ADR-011 (`app_metadata` como fuente única, tenant = agencia, UUID canónico = `auth.users.id`, etc.).
- Migraciones **0001 → 0009** (schema, RLS, soft-delete/audit, índices, grants, trigger, hook, service_role grants, fix timing).
- El **toolkit oficial** de verificación (6 scripts + `validate_migrations.py`).
- La **metodología**: Evidencia → Diagnóstico → Corrección mínima → Validación.

## 5 · Qué está PROHIBIDO modificar en el RC1

Refactorizar, renombrar, mover, optimizar "porque sí", cambiar RLS/Trigger/Hook/DAL/frontend/variables,
actualizar dependencias, reescribir historia Git, o mezclar la 0010 experimental con el freeze.

## 6 · Único punto abierto

Ninguno. El login real está completamente operativo y validado tanto localmente (PGlite) como en Staging. El Sprint 2 puede continuar.
