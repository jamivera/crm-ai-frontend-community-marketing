# ADR-010 — Ambientes cloud staging-first (sin local como principal)

**Estado:** ✅ Aceptada · **Fecha:** 2026-07-04 · **Refina:** §13 de la [Constitución](../architecture.md)

## Contexto

La Constitución v1.0 (§13) contemplaba tres ambientes: DEV (Supabase local con Docker), STAGING y PROD.
Al pasar de prototipo a operación real con Primero Digital como primer cliente, se decide trabajar desde el
inicio con **infraestructura real en la nube**, no con una instancia local como entorno principal.

## Problema

Se necesita una separación limpia entre pruebas y clientes reales, sin arriesgar datos de producción, pero
sin la fricción de mantener un entorno local que no refleja exactamente la infraestructura real.

## Alternativas evaluadas

- **DEV local (Docker) + STAGING + PROD:** fiel a la Constitución original, pero añade un entorno que no es idéntico a la nube y requiere Docker en cada máquina.
- **Solo PROD:** inaceptable — probar sobre datos de clientes reales.
- **STAGING + PROD (ambos cloud):** dos proyectos Supabase; Staging absorbe desarrollo, pruebas y validación; Producción solo recibe lo ya validado.

## Decisión

Adoptar **dos ambientes cloud**: `fplus-staging` (pruebas, desarrollo y validación) y `fplus-production`
(clientes reales). **Todo desarrollo ocurre primero en Staging; solo lo validado pasa a Producción.**
Nunca se prueba directamente sobre la base de datos de Producción. El desarrollo local contra Supabase
local (Docker) queda como opción secundaria, no como entorno principal.

## Consecuencias positivas

- Staging es idéntico a la infraestructura real (mismo Supabase) → cero sorpresas al promover a Producción.
- Datos de clientes reales protegidos: jamás se prueba sobre ellos.
- Flujo simple: `.env.staging` / `.env.production` + `npm run build:staging|production`.
- Menos fricción operativa que mantener Docker en cada equipo.

## Riesgos

- Sin entorno gratuito local, el desarrollo consume recursos del proyecto Staging → mitigado: Staging puede ser plan Free/Pro económico; los costos reales están en Producción.
- Requiere disciplina de "primero Staging" → reforzado por proceso y por este ADR.

## Evoluciones futuras

- Migraciones promovidas por CI/CD: merge a `main` → aplica en Staging → aprobación → aplica en Producción.
- Un DEV local con Docker puede reintroducirse para trabajo offline sin cambiar esta estrategia.
