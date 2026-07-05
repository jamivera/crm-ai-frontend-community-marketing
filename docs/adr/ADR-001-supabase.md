# ADR-001 — Supabase como backend inicial

**Estado:** ✅ Aceptada · **Fecha:** 2026-07-04

## Contexto

FPlus necesita un backend para persistencia, autenticación, almacenamiento de archivos y tiempo real.
El objetivo es llegar a producción con clientes reales lo antes posible, sin sacrificar la escalabilidad
a 5-10 años de un SaaS multi-tenant internacional.

## Problema

Construir backend, auth, storage y realtime a mano tomaría semanas y retrasaría la validación del producto.
Se necesita una base sólida que no obligue a rehacer la arquitectura al crecer.

## Alternativas evaluadas

- **Backend propio (NestJS/Laravel/.NET + PostgreSQL):** máximo control, pero 3-4 semanas más de trabajo y todo por construir (auth, storage, realtime).
- **Firebase:** rápido, pero NoSQL, con lock-in fuerte y débil para datos relacionales como los de FPlus.
- **Supabase:** PostgreSQL gestionado + Auth + Storage + Realtime + RLS integrados.

## Decisión

Usar **Supabase** como backend inicial. Aporta cuatro capacidades de una sola vez (base de datos, auth,
storage, realtime) sobre PostgreSQL estándar, sin lock-in propietario.

## Consecuencias positivas

- Camino más rápido a producción sin construir infraestructura base.
- Auth con recuperación de contraseña y verificación de correo incluidas (encaja con el flujo de invitación).
- RLS nativo para el aislamiento multi-tenant.
- Es PostgreSQL real: migrable a cualquier hosting el día que se requiera.

## Riesgos

- Dependencia de un proveedor gestionado (mitigado por el Data Access Layer — ver [ADR-004](ADR-004-data-access-layer.md)).
- Límites de conexiones en planes bajos (mitigado con connection pooling / Supavisor).

## Evoluciones futuras

- El día que se necesite un backend propio, solo cambia la implementación del DAL; la app no se toca.
- Componentes específicos (auth, storage) pueden migrar a proveedores especializados (ver [ADR-009](ADR-009-storage-r2.md)).
