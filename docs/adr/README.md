# Architecture Decision Records (ADR)

Registro de las decisiones arquitectónicas importantes de FPlus. Cada ADR documenta **una** decisión:
su contexto, el problema, las alternativas evaluadas, la decisión tomada, las consecuencias, los riesgos
y las posibles evoluciones futuras.

Estas decisiones forman parte de la [Constitución Técnica](../architecture.md) v1.0 y están **congeladas**.
No se cambian sin una justificación técnica muy fuerte, documentada primero como un nuevo ADR.

| ADR | Decisión | Estado |
|---|---|---|
| [ADR-001](ADR-001-supabase.md) | Supabase como backend inicial | ✅ Aceptada |
| [ADR-002](ADR-002-postgresql.md) | PostgreSQL como base de datos | ✅ Aceptada |
| [ADR-003](ADR-003-multi-tenant.md) | Arquitectura Multi-Tenant (shared DB + agency_id) | ✅ Aceptada |
| [ADR-004](ADR-004-data-access-layer.md) | Data Access Layer (frontend desacoplado del proveedor) | ✅ Aceptada |
| [ADR-005](ADR-005-edge-functions.md) | Edge Functions para operaciones con secretos | ✅ Aceptada |
| [ADR-006](ADR-006-row-level-security.md) | Row Level Security para aislamiento de datos | ✅ Aceptada |
| [ADR-007](ADR-007-region-us-east-1.md) | Región `us-east-1` | ✅ Aceptada |
| [ADR-008](ADR-008-arquitectura-desacoplada.md) | Arquitectura desacoplada y modular | ✅ Aceptada |
| [ADR-009](ADR-009-storage-r2.md) | Supabase Storage con migración futura a Cloudflare R2 | ✅ Aceptada |
| [ADR-010](ADR-010-ambientes-staging-first.md) | Ambientes cloud staging-first (refina §13) | ✅ Aceptada |

## Estados posibles

- **Propuesta** — en discusión.
- **Aceptada** — vigente, se debe respetar.
- **Reemplazada** — sustituida por un ADR posterior (se enlaza).
- **Descartada** — evaluada y rechazada.
