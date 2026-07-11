# AI_BOOTSTRAP_GUIDE · FPlus

> Guía de arranque para **cualquier IA** (Antigravity, Claude, GPT, otra) que empiece a trabajar en FPlus **sin
> acceso a ninguna conversación previa**. Léela completa antes de tocar nada.

## Paso 0 · Ubícate
- Repo raíz: **`/Users/jamil/AgencyOs`** (NO `/Users/jamil/Pailux`). Todas las rutas son relativas a aquí.
- FPlus = Marketing OS multi-tenant sobre Supabase, capa `/fplus/*` de Evo CRM. Primer tenant: Primero Digital.
- Índice de toda la documentación: [INDEX.md](INDEX.md).

## Orden de lectura recomendado (por objetivo)

### 🟢 Nivel 1 — Orientación mínima (5 min, léelo SIEMPRE)
1. [INDEX.md](INDEX.md) — mapa de la documentación.
2. [PROJECT_CONTEXT_FOR_AI.md](PROJECT_CONTEXT_FOR_AI.md) — qué es + "las 10 cosas que NO debes hacer".
3. [PROJECT_STATE.json](PROJECT_STATE.json) — estado legible por máquina (consúmelo).
4. Este archivo (AI_BOOTSTRAP_GUIDE) — cómo trabajar.

### 🟡 Nivel 2 — Entender el proyecto (antes de proponer cambios)
5. [FPLUS_MANIFESTO.md](FPLUS_MANIFESTO.md) — valores; si algo choca, esto gana.
6. [ARCHITECTURE.md](ARCHITECTURE.md) + [ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md) — cómo encaja todo.
7. [ARCHITECTURE_FREEZE.md](ARCHITECTURE_FREEZE.md) — qué NO tocar.
8. [KNOWN_ISSUES.md](KNOWN_ISSUES.md) + [AI_HANDOVER.md](AI_HANDOVER.md) — dónde retomar.

### 🔵 Nivel 3 — Profundidad (según la tarea)
9. [DATABASE_MANIFEST.md](DATABASE_MANIFEST.md) + [MIGRATION_JOURNAL.md](MIGRATION_JOURNAL.md) — la BD y su porqué.
10. [ARCHITECTURE_DECISIONS.md](ARCHITECTURE_DECISIONS.md) + [PROJECT_DECISIONS_INDEX.md](PROJECT_DECISIONS_INDEX.md) — decisiones y descartes.
11. [LESSONS_LEARNED.md](LESSONS_LEARNED.md) — trampas ya resueltas.
12. [ROADMAP.md](ROADMAP.md) + [ANTIGRAVITY_READINESS.md](ANTIGRAVITY_READINESS.md) — qué sigue / qué migrar.
13. [PROMPTS_MASTER.md](PROMPTS_MASTER.md) — prompts listos para usar.

## Paso 2 · Verifica el estado SIN tocar nada
```bash
python3 supabase/validate_migrations.py     # gate estático -> verde
node supabase/test_migrations.mjs           # ejecucion real (PGlite) -> verde, incluye flujo de identidad
```
Si ambos están en verde, la infraestructura congelada está intacta.

## Paso 3 · Qué NO tocar (congelado — requiere nuevo ADR)
- Migraciones **0001–0009**, RLS, Trigger (`handle_new_user`), Auth Hook (`custom_access_token_hook`).
- El modelo de tenant (`agency_id`), la frontera del DAL, el manejo de secretos.
- Las 9 reglas del ADR-011. La convención `rol` (no `role`).
- La **migración 0010** es experimental: NO la trates como solución.

## Paso 4 · Qué revisar / dónde puedes trabajar
- **ISSUE-001** (login 500): es lo que desbloquea todo. Siguiente paso concreto en [AI_HANDOVER.md](AI_HANDOVER.md) §1.
- **Módulos FPlus en mock** (`src/fplus/`): Clientes → Dashboard → Brief → Contratos → Cronopost → Aprobaciones →
  Multimedia → Campañas → Métricas. Conéctalos al DAL en ese orden, uno a uno.
- **Implementaciones del DAL** (`src/fplus/services/`): reemplazables respetando las interfaces.

## Paso 5 · Cómo continuar (metodología obligatoria)
**Evidencia → Diagnóstico → Corrección mínima → Validación.**
- No inventes fixes; reproduce con evidencia (logs, `has_*_privilege`, PGlite, error con `status/code/name`).
- No crees infraestructura por anticipado ni scripts de un solo uso (toolkit congelado).
- Antes de una migración: enumera qué cambia y por qué; valida con el gate + PGlite; nombre con timestamp de 14
  dígitos; no toques migraciones existentes.
- Congela decisiones estratégicas en un ADR nuevo.
- Muestra los cambios antes de aplicarlos.

## Paso 6 · Trampas que te ahorran horas (de [LESSONS_LEARNED.md](LESSONS_LEARNED.md))
- El SQL Editor corre como `postgres` (ignora RLS). Prueba como `supabase_auth_admin` o con `has_*_privilege`
  (no puedes `set role supabase_auth_admin` en el editor).
- GoTrue escribe `app_metadata` en un UPDATE **tras** el INSERT (por eso el trigger es `INSERT OR UPDATE OF raw_app_meta_data`).
- Loguea el error completo, no solo `.message` (viene `{}` en `AuthRetryableFetchError`).
- La Secret Key `sb_secret_…` reemplaza al `service_role` legacy y funciona igual en supabase-js.
- El error real de un 500 de auth solo está en **Postgres Logs / Auth Logs**.

## Paso 7 · Prompts listos para usar
Ver [PROMPTS_MASTER.md](PROMPTS_MASTER.md) (prompt de arranque, diagnóstico, migración, conexión de módulo, ADR, y
anti-patrones que debes rechazar).
