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
| Auth Hook / claims en JWT (0007) | ⚠️ Instalado y registrado, **pero login bloqueado** por un 500 (ver KNOWN_ISSUES) |
| Bootstrap del primer admin | ✅ Funciona hasta `public.users` con `ids_coinciden = true` |
| DAL (capa de servicios) | 🟡 Scaffold listo; **ningún módulo conectado aún** |
| Frontend (módulos FPlus) | 🟡 Funciona en **mock mode**; sin datos reales todavía |
| Migración 0010 | 🧪 **EXPERIMENTAL — hipótesis no validada** (no forma parte del freeze) |

## 3 · Estado por módulo (orden de migración del Sprint 2)

Ninguno está conectado a datos reales todavía; todos operan en **mock mode** (fallback seguro).

| # | Módulo | Estado | Notas |
|---|---|---|---|
| 1 | **Clientes** | 🔜 siguiente | Entidad raíz. Se conecta primero cuando se resuelva el login. |
| 2 | **Dashboard** | ⏳ pendiente | Solo lectura / agregados. |
| 3 | **Brief** | ⏳ pendiente | 1 registro por cliente. |
| 4 | **Contratos** | ⏳ pendiente | Wizard ya crea cliente+contrato en mock. |
| 5 | **Cronopost / Calendario** | ⏳ pendiente | Corazón del sistema; read+write complejo (drag&drop). |
| 6 | **Aprobaciones** | ⏳ pendiente | Máquina de estados; escrituras críticas. |
| 7 | **Multimedia** | ⏳ pendiente | Requiere Storage (fase posterior). |
| 8 | **Campañas** | ⏳ pendiente | Centro de Estrategia; cómputo. |
| 9 | **Métricas** | ⏳ pendiente | `metric_snapshots` + vista; datos de pauta llegan con APIs (Sprint 3). |

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

**`POST /token` devuelve HTTP 500 al ejecutar el Custom Access Token Hook** → el login real aún no funciona.
No bloquea el empaquetado del RC. Documentado en [KNOWN_ISSUES.md](KNOWN_ISSUES.md).
