# ADR-002 — PostgreSQL como base de datos

**Estado:** ✅ Aceptada · **Fecha:** 2026-07-04

## Contexto

Los datos de FPlus son profundamente relacionales: agencia → clientes → usuarios → campañas → contenido →
métricas, con integridad transaccional en el flujo de aprobación y necesidad de analítica compleja.

## Problema

Se requiere una base de datos que garantice integridad referencial, soporte millones de registros, permita
consultas analíticas ricas y ofrezca flexibilidad para datos semiestructurados (payloads de APIs externas).

## Alternativas evaluadas

- **MongoDB / NoSQL:** flexible pero débil en relaciones e integridad; la analítica cruzada (contenido↔métricas↔campañas) sería costosa.
- **MySQL:** relacional sólido, pero menos capacidades avanzadas (JSONB, particionado declarativo, RLS nativo, extensiones).
- **PostgreSQL:** relacional maduro con JSONB, particionado, RLS, índices avanzados y ecosistema de extensiones.

## Decisión

Usar **PostgreSQL** (vía Supabase). Combina lo mejor de ambos mundos: modelo relacional normalizado para el
núcleo + `JSONB` para lo que evoluciona (estrategias, `raw_data` de APIs, payloads de IA).

## Consecuencias positivas

- Integridad referencial y transacciones para el flujo crítico de aprobaciones.
- `JSONB` evita migraciones cada vez que una API externa cambia su formato.
- Row Level Security nativo → aislamiento multi-tenant en la base.
- Particionado declarativo para tablas de alto volumen (`metric_snapshots`, `audit_log`).
- Maneja miles de millones de filas; el escenario de 5 años no lo estresa.

## Riesgos

- Escalar escritura masiva eventualmente requiere réplicas y pooling (planificado, ver [roadmap](../roadmap.md) y §15 de la Constitución).

## Evoluciones futuras

- Read replicas para reportes.
- Camino OLAP (BigQuery/ClickHouse) alimentado desde Postgres solo a escala masiva.
