# ANTIGRAVITY_READINESS · FPlus

> Documento específico para la evaluación/migración técnica con **Antigravity**. Qué puede migrarse, qué no, qué
> validar primero, qué nunca romper. Ampliado para el Preservation Package.

## Contexto para el evaluador
FPlus es un SaaS multi-tenant sobre Supabase, capa `/fplus/*` sobre Evo CRM Community. La **infraestructura de
identidad está congelada y validada** (migraciones 0001–0009); el único punto abierto es el login (ISSUE-001).
Lee `AI_BOOTSTRAP_GUIDE.md`, `PROJECT_CONTEXT_FOR_AI.md` y `ARCHITECTURE.md` antes de evaluar.

## 1 · Qué PUEDE migrarse
- **Módulos de frontend FPlus** (`src/fplus/`) que operan en **mock mode**: Clientes, Dashboard, Brief, Contratos,
  Cronopost, Aprobaciones, Multimedia, Campañas, Métricas. Están desacoplados vía el DAL.
- **Implementaciones del DAL** (`src/fplus/services/`): cada servicio es un adaptador reemplazable
  (Ports-and-Adapters). Migrar/optimizar la *implementación* es válido **si respeta las interfaces**.
- **Presentación/UI, i18n, componentes** FPlus (con cuidado si comparten con la base Evo).

## 2 · Qué NO debe migrarse / tocarse
- La **arquitectura de identidad** (Trigger + Auth Hook + reglas ADR-011).
- Las **migraciones 0001–0009** (schema, RLS, grants, trigger, hook).
- El **modelo de tenant** (`agency_id`) y la **RLS**.
- La **frontera del DAL** (el frontend no debe hablar con supabase-js directo).
- El **manejo de secretos** (Secret Key server-only).

## 3 · Módulos INDEPENDIENTES (bajo riesgo de migrar)
Se pueden abordar de forma aislada porque solo dependen del DAL + su tabla:
- **Clientes** (entidad raíz, CRUD simple), **Dashboard** (solo lectura/agregados), **Brief** (1 registro/cliente),
  **Métricas** (solo lectura de `metric_snapshots`).

## 4 · Módulos CRÍTICOS (alto riesgo — migrar con cuidado)
- **Cronopost** (corazón del sistema; read/write complejo, drag&drop, `content_pieces`).
- **Aprobaciones** (máquina de estados; escribe `approval_events` + `comments` + notificaciones; cruza RLS agencia/cliente).
- **Multimedia** (requiere Storage, aún no implementado).
- **Campañas** (cómputo que integra brief + contrato + material de pauta).

## 5 · Riesgos de migración (ver RISK_REGISTER.md)
- **ISSUE-001 bloquea el login** → sin login real, no se pueden validar los módulos con datos reales. Resolver primero.
- **RLS multi-tenant:** cualquier cambio que evada la RLS puede filtrar datos entre agencias.
- **La 0010 es experimental:** no construir sobre ella como si fuera un fix.
- **Doble lockfile / entorno:** fijar npm y las versiones (`SYSTEM_SNAPSHOT.md`) antes de reconstruir.

## 6 · Cómo iniciar la migración (orden sugerido)
1. **Reproducir el estado** con el gate + PGlite (`AI_BOOTSTRAP_GUIDE.md` §2) → confirmar verde.
2. **Cerrar ISSUE-001** (login) — desbloquea todo lo demás.
3. Migrar **un módulo independiente** primero (Clientes) end-to-end como piloto del patrón DAL→RLS→UI.
4. Validar aislamiento multi-tenant (agencia A no ve datos de agencia B) antes de escalar a módulos críticos.

## 7 · Qué VALIDAR primero (checklist)
- [ ] `validate_migrations.py` y `test_migrations.mjs` en verde.
- [ ] `verify_identity_infra.sql` + `verify_clean_state.sql` OK en el entorno destino.
- [ ] Login real funciona (JWT con `agency_id/rol`) — hoy bloqueado por ISSUE-001.
- [ ] RLS: un usuario de agencia solo ve su agencia; un cliente solo ve lo suyo.
- [ ] El frontend NO importa supabase-js fuera del DAL.
- [ ] Sin secretos en el repo/entorno migrado.

## 8 · Qué NUNCA romper
`app_metadata` como fuente única · agencia = tenant · UUID canónico `auth.users.id` · Trigger solo aprovisiona ·
claims solo en el Hook · DAL como única puerta · Secret Key server-only · claim `rol` (no `role`) ·
metodología Evidencia → Diagnóstico → Corrección mínima → Validación.

## 9 · Congelado vs abierto
| Congelado (no tocar sin ADR) | Abierto (evaluable/migrable) |
|---|---|
| Identidad (0001–0009), RLS, tenant, DAL boundary, secretos, ADR-011 | Fix ISSUE-001, conexión de módulos al DAL, UI, Storage (futuro), integraciones de pauta (Sprint 3+) |

## 10 · Criterio de "listo para evaluar/migrar"
✅ Arquitectura documentada y congelada · ✅ Migraciones validadas · ✅ Sin secretos en git · ✅ Issue abierto
documentado con evidencia y siguiente paso · ✅ Metodología explícita · ✅ Diagramas + estado JSON legible por IA.
**Bloqueo funcional:** login (ISSUE-001) — resolver antes de conectar módulos a datos reales.
