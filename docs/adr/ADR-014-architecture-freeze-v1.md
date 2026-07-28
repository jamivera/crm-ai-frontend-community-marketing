# ADR-014 — Congelamiento de Arquitectura (Architecture Freeze V1) y Agency Knowledge Graph

**Estado:** ✅ Aceptada · **Fecha:** 2026-07-11 · **Refina:** [ADR-011 Arquitectura de Identidad](ADR-011-arquitectura-identidad.md), [ADR-012 Namespacing Claim](ADR-012-claim-namespacing.md), [ADR-013 Visión de Andrómeda AI](ADR-013-vision-andromeda-ai.md)

## Contexto

Con el inicio oficial de la etapa de **Beta Interna** en Primero Digital, FPlus cambia su enfoque desde el diseño conceptual y arquitectónico hacia el uso cotidiano, la estabilidad operativa y la resolución de necesidades reales surgidas del trabajo diario de la agencia. Para asegurar que la base de código permanezca predecible, segura y estable durante este periodo de uso activo, es imperativo establecer una línea base y congelar la estructura técnica central.

## Decisión de Congelamiento (Architecture Freeze V1)

Se declara formalmente el **Congelamiento de Arquitectura V1**. A partir de este momento:

1.  **Línea Base Consolidada:** Se fijan como estándar inalterable las siguientes decisiones arquitectónicas aprobadas:
    *   **Desacoplamiento de Accesos:** Modelo Tenant de cuatro niveles: *Organización (Business Group)* $\rightarrow$ *Marca (Brand)* $\rightarrow$ *Usuario (Profile/Auth)* $\rightarrow$ *Membresías/Invitaciones*. El correo administrativo del cliente y el correo de acceso al portal quedan definitivamente aislados.
    *   **Identidad y Claims:** Namespacing de claims de Supabase Auth inyectados en el JWT (`fplus_client_id` en lugar del reservado `client_id`) para evitar colisiones con GoTrue ([ADR-012](ADR-012-claim-namespacing.md)).
    *   **Modelo de Aprobación Forense:** Registro histórico de aprobaciones múltiples (`content_piece_approvals`) y firmas contractuales criptográficas asociadas a personas físicas (`contract_signatures`) con auditoría IP y User-Agent.
    *   **Auditoría y CRM Multi-Tenant:** Centralización de leads, pipelines y logs de auditoría aislados por Marca mediante RLS.
    *   **Optimización para Andrómeda AI:** Vistas materializadas indexadas de consolidación estratégica de marcas (`brand_strategic_summary`) para lecturas de contexto en milisegundos.
    *   **Optimización de Almacenamiento Local:** Omisión de datos binarios pesados (como base64 de firmas del canvas) en la persistencia local de Zustand para proteger la cuota de 5MB del navegador.
2.  **Protocolo de Modificación Estructural:** Queda prohibido alterar esquemas de bases de datos, políticas de RLS, estructuras de claims de identidad o la arquitectura general de persistencia de forma ad-hoc. Cualquier modificación estructural futura deberá ser justificada y aprobada mediante un nuevo registro ADR documentado en `docs/adr/`.

---

## Evoluciones Futuras: Agency Knowledge Graph (AKG)

Para el desarrollo de versiones futuras y la evolución de Andrómeda AI, se deja registrada la visión estratégica del **Agency Knowledge Graph (AKG)**.

### Visión
Andrómeda AI no consultará registros tabulares planos de forma aislada. Se estructurará una **Capa de Conocimiento Semántico** por marca que compile de forma estructurada los aprendizajes del negocio:

*   **Estrategia Cognitiva:** Registro de aprendizajes históricos, análisis de qué formatos convierten mejor para cada marca y comportamiento específico del engagement de la audiencia.
*   **Políticas de Redacción y Tono:** Registro de la personalidad de marca de la organización, incluyendo palabras recomendadas, términos estrictamente restringidos y guías de tono.
*   **Resultados Históricos:** Mapeo de publicaciones con alto y bajo rendimiento operativo con insights generados retrospectivamente por la IA para evitar cometer los mismos errores.

Esta capa servirá como el cerebro estratégico unificado al que Andrómeda AI consultará antes de redactar copys, seleccionar hashtags o planificar campañas publicitarias, asegurando que FPlus funcione verdaderamente a nivel de dirección estratégica y consultoría.
