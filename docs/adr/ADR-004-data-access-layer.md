# ADR-004 — Data Access Layer (frontend desacoplado del proveedor)

**Estado:** ✅ Aceptada · **Fecha:** 2026-07-04

## Contexto

El frontend podría hablar directamente con `supabase-js`. Eso funciona hoy, pero acopla toda la aplicación
a un proveedor específico y complicaría una futura migración de infraestructura.

## Problema

Un SaaS de largo plazo no debe quedar atado a un proveedor. Si mañana se migra a un backend propio (NestJS,
Laravel, .NET) o a otra infraestructura, no debería reescribirse toda la aplicación.

## Alternativas evaluadas

- **Frontend → supabase-js directo:** simple y rápido, pero acoplamiento total; migrar = tocar todo el código.
- **Data Access Layer (patrón Repository / Ports & Adapters):** el frontend llama a funciones internas; solo esa capa conoce al proveedor.

## Decisión

Toda la aplicación consume únicamente **funciones internas del DAL** (`createClient()`, `saveContent()`,
`uploadMedia()`, `getMetrics()`…) definidas por **interfaces TypeScript**. Solo la implementación del DAL
importa `supabase-js`. El resto del sistema no sabe de dónde vienen los datos.

## Consecuencias positivas

- Migrar de proveedor = cambiar solo la implementación del DAL; la app no se toca.
- Testeable: se puede mockear el DAL sin backend.
- El store de Zustand actual (`createContent`, `approveContent`…) ya tiene esta forma → migración natural.
- Bajo acoplamiento, alta cohesión.

## Riesgos

- Sobre-abstraer puede hacer perder capacidades del proveedor (realtime, RLS). Mitigación: abstraer CRUD/queries/storage/auth, y dejar `realtime` como una abstracción fina y explícitamente consciente del proveedor (no perseguir independencia del 100%).

## Evoluciones futuras

- Segunda implementación del DAL (p. ej. contra un backend propio) sin cambiar la app.
- Contratos de servicio versionables.
