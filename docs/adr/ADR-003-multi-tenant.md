# ADR-003 — Arquitectura Multi-Tenant (shared DB + agency_id)

**Estado:** ✅ Aceptada · **Fecha:** 2026-07-04

## Contexto

FPlus no es una herramienta para una sola agencia. Primero Digital es el primer tenant, pero la plataforma
debe servir a miles de agencias, cada una con sus clientes, usuarios y datos completamente aislados.

## Problema

Se necesita aislamiento total entre agencias (una nunca puede ver datos de otra) sin sacrificar escalabilidad
ni costos, soportando miles de tenants.

## Alternativas evaluadas

- **Base de datos por agencia:** aislamiento máximo, pero no escala a miles (miles de bases), operación y costo inviables.
- **Esquema por agencia:** mejor que lo anterior, pero PostgreSQL/Supabase no lo manejan bien a gran escala; migraciones y conexiones se complican.
- **Base compartida + `agency_id` + Row Level Security:** una sola base, aislamiento a nivel de fila forzado por la base de datos.

## Decisión

**Base de datos compartida, esquema compartido, `agency_id NOT NULL` en toda tabla de negocio + Row Level
Security.** Es el patrón estándar de SaaS a escala.

## Consecuencias positivas

- Escala a miles de agencias con una sola base.
- Aislamiento estructural: aunque el frontend tuviera un bug, una query no devuelve datos de otra agencia.
- Costo y operación eficientes; migraciones únicas.
- Índices con `agency_id` a la cabeza → rendimiento y aislamiento juntos.

## Riesgos

- Un error en una policy de RLS podría exponer datos → mitigado con revisión obligatoria de policies y pruebas de aislamiento.
- El `agency_id` debe viajar siempre en el JWT (custom claim) → responsabilidad de la capa de auth.

## Evoluciones futuras

- Réplicas de lectura regionales para agencias internacionales.
- Tenants enterprise con requisitos de residencia de datos podrían aislarse en proyectos dedicados (excepción, no norma).
