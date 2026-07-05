# ADR-006 — Row Level Security para aislamiento de datos

**Estado:** ✅ Aceptada · **Fecha:** 2026-07-04

## Contexto

El aislamiento multi-tenant ([ADR-003](ADR-003-multi-tenant.md)) necesita ejecutarse en algún lugar: en el
frontend, en una capa de servicios o en la base de datos.

## Problema

Si el aislamiento depende del código de aplicación, un solo bug (un `WHERE agency_id` olvidado) puede
filtrar datos entre agencias. Se necesita una garantía que no dependa de que el desarrollador se acuerde.

## Alternativas evaluadas

- **Filtrado en el frontend:** inseguro; el cliente controla las queries.
- **Filtrado en la capa de servicios:** mejor, pero sigue siendo responsabilidad del desarrollador en cada consulta.
- **Row Level Security en PostgreSQL:** la base de datos rechaza las filas de otros tenants, sin importar la query.

## Decisión

Habilitar **Row Level Security** en todas las tablas de negocio. Cada policy compara el `agency_id` de la
fila contra el `agency_id` del JWT. El aislamiento vive en la base, no en la aplicación.

```sql
create policy agency_isolation on content_pieces
  using (agency_id = (auth.jwt() ->> 'agency_id')::uuid);
```

## Consecuencias positivas

- Aislamiento garantizado incluso si el frontend o el DAL tienen un bug.
- El cliente ve solo su `client_id`, sin `notas_internas` ni comentarios internos (policy adicional).
- Seguridad declarativa y auditable en un solo lugar.

## Riesgos

- Policies mal escritas podrían bloquear datos legítimos o exponer indebidos → mitigado con revisión obligatoria y pruebas de aislamiento por rol.
- Overhead mínimo por evaluación de policy → despreciable frente a la seguridad que aporta.

## Evoluciones futuras

- Policies más granulares por rol (diseñador ve solo lo asignado, etc.) sin cambiar la estructura.
- Pruebas automatizadas de aislamiento en CI.
