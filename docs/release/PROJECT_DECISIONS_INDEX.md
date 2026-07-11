# PROJECT_DECISIONS_INDEX · FPlus

> **Todas** las decisiones importantes — las tomadas **y las descartadas** — con su evidencia. Complementa
> `ARCHITECTURE_DECISIONS.md` (narrativa) y los ADR formales (`docs/adr/`).

Formato: **Decisión** · alternativa(s) evaluada(s) · por qué se descartó · evidencia · qué quedó.

| # | Tema | Alternativas evaluadas | Por qué se descartaron | Evidencia | Decisión final |
|---|---|---|---|---|---|
| D-01 | Backend | Postgres crudo + auth propia; Firebase; backend a medida | Reinventar Auth/Storage/RLS; NoSQL no encaja multi-tenant relacional; sobre-ingeniería inicial | Necesidad multi-tenant relacional a 5–10 años | **Supabase** (ADR-001) |
| D-02 | Base de datos | MySQL; NoSQL | Sin RLS nativa/relacional robusta | RLS es el mecanismo de aislamiento elegido | **PostgreSQL 15** (ADR-002) |
| D-03 | Multi-tenancy | DB por tenant; schema por tenant | Costoso de operar/escalar a miles de agencias | Objetivo miles de agencias | **Shared DB + agency_id + RLS** (ADR-003) |
| D-04 | Aislamiento | Filtrado en la app | Frágil; un bug expone datos entre tenants | Seguridad como requisito duro | **RLS en la BD** (ADR-006) |
| D-05 | Aprovisionamiento de identidad | Edge Function; Backend/DAL; solo Auth Hook | Edge = async/drift; Backend = no cubre SSO/invite/dashboard; Hook no crea filas | Debe ser atómico y agnóstico al origen | **Trigger AFTER INSERT/UPDATE** (ADR-011) |
| D-06 | Claims del JWT | Backend firma tokens; claims en el cliente | Inseguro/complejo; el cliente no debe decidir claims | RLS necesita claims confiables | **Custom Access Token Hook** (ADR-011) |
| D-07 | Fuente del tenant | `user_metadata`; parámetro del frontend | Editable por el usuario → auto-asignar tenant/rol | Seguridad de tenant | **`app_metadata` (servidor)** (Regla 1) |
| D-08 | Fuente de claims en runtime | Leer `app_metadata` en el hook | Cambiar rol exigiría tocar Auth | Backend debe gestionar roles en el modelo | **El hook lee `public.users`** (Regla 3) |
| D-09 | Dueño de los datos | El usuario | Los usuarios entran/salen; reasignar propiedad | — | **La agencia (agency_id)** (Regla 3) |
| D-10 | UUID de usuario | Generar propio en `public.users`; alinear a mano | Genera drift; sincronización manual frágil | Bootstrap manual (align_admin) superado | **UUID canónico = auth.users.id** (Regla 4) |
| D-11 | GRANTs | `GRANT ALL ON ALL TABLES`; `ALTER DEFAULT PRIVILEGES` | Opaco; otorga a tablas futuras sin decisión | `42501` reales guiaron el alcance mínimo | **GRANT explícito por tabla / por rol** (0005, 0008) |
| D-12 | Entornos | DEV local (Docker) principal; solo PROD | Docker no idéntico a la nube; probar en PROD inaceptable | — | **Staging + Production cloud, staging-first** (ADR-010) |
| D-13 | Validación de migraciones | Solo validación estática | No detecta errores de ejecución (RLS/timing) | Bugs atrapados solo por ejecución real | **Estático + ejecución real en PGlite** |
| D-14 | Storage | Supabase Storage fijo | Lock-in a futuro | — | **Supabase Storage con adaptador → R2 futuro** (ADR-009) |
| D-15 | Acceso a datos desde el front | Importar supabase-js en componentes | Acopla el frontend al proveedor | — | **DAL como única puerta** (ADR-004) |
| D-16 | Nombre del claim de rol | `role` (inglés) | La BD y los helpers RLS ya usan `rol` | Evitar migración innecesaria | **`rol`** (ADR-011) |
| D-17 | Signup | Registro público abierto | `users.agency_id` es NOT NULL; usuario sin tenant inválido | Trigger rechaza alta sin tenant | **Sin signup abierto; alta server-side** |
| D-18 | Metodología | "Construir lo que probablemente haga falta" | Deuda y complejidad no justificadas | Cada migración nació de un error real | **Evidencia → Diagnóstico → Corrección mínima → Validación** |
| D-19 | Toolkit | Crear scripts de diagnóstico por caso | Acumula herramientas de un solo uso | Se eliminó un `diag_*.mjs` de más | **Toolkit congelado (6 + gate)** |
| D-20 | ISSUE-001 (login 500) | Aceptar la 0010 como fix | No hay fuente oficial que lo demuestre | Descartes con evidencia; hipótesis client_id sin confirmar | **0010 = experimental; causa raíz pendiente (Postgres Logs)** |
