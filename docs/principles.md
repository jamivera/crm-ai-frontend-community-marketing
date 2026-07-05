# FPlus — Principios de Desarrollo

Reglas que **ningún desarrollador debe romper**. Son la guía de trabajo diaria y derivan de la
[Constitución Técnica](architecture.md) y los [ADR](adr/). Si una tarea obliga a romper un principio, no se
implementa: primero se documenta como ADR y se evalúa.

---

## Arquitectura y acoplamiento

1. **Toda funcionalidad nueva pasa por la Data Access Layer.** Ningún componente, hook o store importa
   `supabase-js` directamente. Solo `services/supabase/*` conoce al proveedor. ([ADR-004](adr/ADR-004-data-access-layer.md))

2. **No acoplar módulos innecesariamente.** Cada módulo es autónomo. La comunicación entre módulos pasa por
   servicios o eventos, nunca por importaciones internas cruzadas. ([ADR-008](adr/ADR-008-arquitectura-desacoplada.md))

3. **Mantener compatibilidad con la arquitectura aprobada.** Ningún cambio contradice la Constitución v1.0 sin
   un ADR aprobado que lo justifique.

## Seguridad

4. **Ningún secreto llega al frontend.** Llaves de APIs, tokens y credenciales viven solo en el servidor
   (Edge Functions + Supabase Vault). ([ADR-005](adr/ADR-005-edge-functions.md))

5. **Toda integración externa pasa por Edge Functions.** Meta, Google, TikTok, LinkedIn, OpenAI, Claude,
   Gemini, WhatsApp… nunca se llaman desde el navegador.

6. **Toda nueva funcionalidad es Multi-Tenant.** Cada tabla de negocio lleva `agency_id`; cada acceso respeta
   RLS. Nunca se confía en el frontend para aislar datos. ([ADR-003](adr/ADR-003-multi-tenant.md), [ADR-006](adr/ADR-006-row-level-security.md))

## Datos e integridad

7. **No se borra información físicamente.** Soft delete (`deleted_at`) en todas las tablas de negocio. Los
   clientes se archivan, no se eliminan.

8. **Todo cambio importante queda auditado.** Las operaciones relevantes escriben en `audit_log` (vía
   triggers). El historial de estados de contenido vive en `approval_events`.

9. **Historial, no sobrescritura.** Las tablas de métricas y eventos son append-only. Una medición nueva es
   una fila nueva; nunca se pisa la anterior.

10. **Los archivos van a Storage, no a la base.** La base guarda solo `object_key` + metadata. Las URLs se
    resuelven siempre vía `getMediaUrl()`, nunca se hardcodean. ([ADR-009](adr/ADR-009-storage-r2.md))

## Integraciones y métricas

11. **Modelo de métricas unificado.** Cada conector normaliza a los campos comunes; lo que no exista queda
    `NULL`; el crudo va a `raw_data`. Los derivados (CTR, CPC, ROAS) se calculan, no se almacenan.

12. **Cada anuncio se vincula a su contenido.** `ads.content_piece_id` con snapshots de copy, hashtags y
    ángulo Andrómeda congelados al lanzar. Sin ese vínculo no hay analítica estratégica.

13. **La IA es multi-proveedor.** La app llama a `IAService`; nunca a un proveedor concreto. Cada generación
    se registra en `ai_generations`.

## Proceso

14. **Antes de una mejora arquitectónica, documentar.** Si durante el desarrollo se detecta una mejora
    importante: **no se implementa directamente.** Se documenta (problema, impacto, ventajas, riesgos) como
    ADR y se evalúa para una futura versión.

15. **Migraciones versionadas.** Ningún cambio de schema a mano en producción. Todo por Supabase CLI, en git,
    probado en `dev` → `staging` → `prod`.

16. **El código se lee como el que lo rodea.** Convenciones únicas (ver §6 de la Constitución): `snake_case`
    en BD, `PascalCase` en componentes, servicios como `verbo + entidad`.

---

> Estos principios existen para que FPlus crezca durante años sin acumular deuda técnica ni comprometer la
> seguridad. Son parte del contrato de todo el que escribe código en el proyecto.
