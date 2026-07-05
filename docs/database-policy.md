# FPLUS — Política de Evolución de la Base de Datos

> **La base de datos es el activo más importante de FPlus — su corazón.** Este documento es el
> **estándar técnico obligatorio** para toda evolución del modelo de datos, desde hoy hasta Producción y
> durante toda la vida del proyecto. Complementa la [Constitución](architecture.md) y los [Principios](principles.md).

## Filosofía

La base de datos es un **sistema vivo**. FPlus es un SaaS que crecerá durante años: nuevos módulos, IA,
integraciones (Meta, Google, TikTok, LinkedIn, WhatsApp), automatizaciones, reportes, facturación. Que la
base evolucione **no significa que esté mal diseñada** — significa que el producto crece.

**Nunca reconstruimos la base. La evolucionamos** — de forma ordenada, reversible y compatible.

## Reglas inviolables

1. **Nunca modificar tablas manualmente** desde el SQL Editor de Supabase.
2. **Nunca crear tablas manualmente** en el dashboard.
3. **Nunca eliminar datos directamente** (soft delete, no `DELETE`).
4. **Todo cambio de schema es una migración versionada** en `supabase/migrations/`.
5. **Toda migración es reversible** cuando sea técnicamente posible (incluir el `-- down` o el plan de reversión).
6. **Toda modificación mantiene compatibilidad** con los datos existentes (nunca romper filas ya guardadas).
7. **Nunca romper Producción** por un cambio de Staging.
8. **Staging primero** → validar → Producción. Mismos comandos, misma migración, paridad garantizada.

## Análisis de impacto (antes de cada funcionalidad nueva)

Antes de tocar la base, se analiza **si la funcionalidad puede resolverse SIN modificarla**. Si se puede,
esa es la opción preferida. Si necesita cambios, se analiza el impacto sobre:

- **Schema** — ¿nuevas tablas/columnas/relaciones? ¿afecta las existentes?
- **RLS** — ¿nuevas policies? ¿el aislamiento multi-tenant se mantiene?
- **DAL** — ¿nuevos servicios/métodos? ¿cambian firmas existentes?
- **Storage** — ¿nuevos buckets o rutas?
- **Auth** — ¿nuevos roles/claims/permisos?
- **APIs** — ¿afecta o prepara una integración?
- **Rendimiento** — ¿nuevos índices? ¿queries costosas?
- **Escalabilidad** — ¿la tabla crecerá a millones? ¿necesita particionado?

## Estrategia de migración por tipo de cambio

| Necesidad | Estrategia recomendada |
|---|---|
| Nuevo campo | `ALTER TABLE ADD COLUMN` **nullable** o con `DEFAULT` (no rompe filas existentes) |
| Nueva tabla | `CREATE TABLE` + RLS + índices con `agency_id` a la cabeza |
| Nueva relación | Nueva FK; si aplica, columna nullable primero, backfill, luego `NOT NULL` |
| Renombrar/cambiar tipo | Migración en fases: nueva columna → backfill → cambiar DAL → eliminar la vieja (nunca en un solo paso destructivo) |
| Nuevo módulo | Tablas nuevas aisladas; el resto del schema no se toca (bajo acoplamiento) |
| Dato de referencia | Seed/migración de datos idempotente, nunca hardcode en código |

## Validación previa (obligatoria antes de cada migración)

**Ninguna migración se ejecuta sin este análisis.** Se corre el validador automático
(`supabase/validate_migrations.py`) que comprueba lo estáticamente verificable, y se revisan a mano los
puntos que dependen del entorno vivo. Si se detecta cualquier riesgo, **primero se propone la solución y
luego se genera/ajusta la migración.**

| # | Comprobación | Cómo se valida |
|---|---|---|
| 1 | Compatibilidad con PostgreSQL de Supabase | Validador: sin `uuid-ossp`/`uuid_generate_v4`, sin sintaxis deprecada |
| 2 | Compatibilidad con el CLI | Validador: nombre `<timestamp>_<nombre>.sql`, sin `\ir` en migraciones |
| 3 | Compatibilidad con el schema existente | Validador: referencias a tablas/columnas existentes |
| 4 | Dependencias entre migraciones | Validador: orden por timestamp; las posteriores dependen de las previas |
| 5 | Conflictos con RLS | Validador: policy única por tabla; columna usada existe; **tablas de JOIN existen, columnas de JOIN válidas, sin ciclos de dependencia** |
| 5b | Escalabilidad de RLS | Validador: **columnas de FK usadas en JOINs de policies deben estar indexadas** (RLS corre en cada query) |
| 6 | Conflictos con índices | Validador: nombres de índice únicos |
| 7 | Conflictos con datos existentes | Validador: `ADD COLUMN NOT NULL` sin `DEFAULT` = riesgo → alerta |
| 8 | Conflictos con Auth | Revisión: ¿toca claims/roles/hooks? Probar login tras aplicar |
| 9 | Conflictos con Storage | Revisión: ¿toca buckets/policies de `storage`? |
| 10 | Reversibilidad | Validador: encabezado incluye plan de reversión |

Los puntos 1-7 y 10 son automáticos. Los 8-9 requieren revisión + prueba en Staging antes de Producción.

## Backups y snapshots

Antes de una migración **crítica** (destructiva, que altere tipos, que haga backfill masivo o toque tablas
con datos reales), se evalúa y se indica explícitamente si conviene un snapshot:

- **Staging vacío / desechable:** no requiere backup (no hay nada que perder).
- **Staging con datos de trabajo:** snapshot recomendado si la migración es destructiva.
- **Producción (con clientes reales):** **snapshot obligatorio antes de cada migración.** Supabase Pro da
  backups diarios + PITR; además se toma un snapshot manual (o rama) inmediatamente antes de aplicar.

Cuando FPlus tenga clientes reales, este análisis de backup es **parte obligatoria** del proceso de migración.

## Documentación de cada migración

Toda migración importante incluye, en su encabezado, un bloque corto:

```sql
-- ─── Migración: <nombre> ───
-- Por qué:   <motivación / qué necesidad del producto la origina>
-- Resuelve:  <qué problema soluciona>
-- Tablas:    <tablas creadas/modificadas>
-- Riesgos:   <posibles riesgos y su mitigación; reversibilidad>
```

Así entenderemos la historia del proyecto dentro de años.

## Flujo de despliegue (resumen)

Flujo estándar por migraciones, **sin `reset`**, idéntico en ambos entornos:

- **Staging:** `supabase db push --include-seed` → migraciones + seed de desarrollo (no destructivo, CLI-nativo).
- **Producción:** `supabase db push` → **solo** migraciones nuevas. **Sin** `--include-seed`, sin seed de desarrollo.
- **`supabase db reset`:** reservado a casos específicos (reconstrucción total de Staging, instalación desde
  cero, validación de migraciones, recuperación). **Nunca** en el flujo normal ni en Producción.

Detalle operativo en [`supabase/README.md`](../supabase/README.md).

## Objetivo

Que FPlus evolucione durante muchos años **sin reconstruir jamás su base de datos**, creciendo de forma
ordenada, estable y profesional. Este es el estándar de FPlus desde hoy.
