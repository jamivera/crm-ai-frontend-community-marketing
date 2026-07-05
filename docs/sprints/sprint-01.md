# Sprint 1 — Fundación del Backend (Supabase)

> **Fase del roadmap:** 2 (Base de Datos), 3 (Autenticación), 4 (Storage) y arranque de 5 (Migración Frontend).
> **Regla:** todo respeta la [Arquitectura v1.0](../architecture.md) y los [Principios](../principles.md). Sin cambios estructurales.

---

## Objetivo

Levantar la infraestructura real de FPlus sobre Supabase: base de datos con el schema y RLS aplicados,
autenticación por roles, Storage con permisos, y la **Data Access Layer** conectada a datos reales —
dejando la plataforma lista para validar con Primero Digital como primer cliente.

## Alcance

**Dentro del sprint:**
- Proyecto Supabase Pro en `us-east-1` (DEV/STAGING/PROD).
- Migración del schema (32 tablas + enums + índices + vista) como migraciones versionadas.
- Políticas de Row Level Security (aislamiento agencia/cliente).
- Soft delete y triggers de audit log.
- Supabase Auth: login por roles, invitación, activación, recuperación de contraseña.
- Storage: buckets con RLS y adaptador de media.
- Data Access Layer: cliente Supabase, interfaces de servicio y primera implementación de referencia.
- Seed con Primero Digital + clientes de prueba.
- Conexión del store al DAL (sustituye mock + localStorage).

**Fuera del sprint (sprints posteriores):**
- Conectores de APIs de pauta (Meta, Google, TikTok, LinkedIn) → Sprint 2+.
- IA real (OpenAI/Claude/Gemini) → sprint posterior.
- Billing, Jobs en producción, notificaciones multicanal → según demanda.

## Tareas

### Bloque A — Construible sin proyecto cloud (✅ este sprint, ya ejecutado)
- [x] A1. Estructura `supabase/` (config, migrations, seed).
- [x] A2. Migración inicial del schema (`0001_initial_schema.sql`).
- [x] A3. Migración de RLS (`0002_rls_policies.sql`).
- [x] A4. Migración de soft delete + triggers de audit (`0003_soft_delete_audit.sql`).
- [x] A5. Estructura de la Data Access Layer (`src/fplus/services/`): cliente, interfaces, implementación de referencia, factory.
- [x] A6. Variables de entorno (`.env.example`) y dependencia `@supabase/supabase-js`.
- [x] A7. Seed base (`supabase/seed.sql`) con la agencia Primero Digital.

### Bloque B — Requiere el proyecto Supabase (🔒 bloqueado en acción del usuario)
> **Ambientes (ADR-010):** todo el Bloque B se ejecuta en **`fplus-staging`**. Producción solo recibe lo validado.
- [ ] B1. Crear proyectos **`fplus-staging`** y **`fplus-production`** en `us-east-1` (usuario). Comparte URL + anon key de **Staging**.
- [ ] B2. Ejecutar migraciones (`supabase db push`) en **Staging**.
- [ ] B3. Configurar Auth: proveedores, plantillas de correo, custom claims (`agency_id`, `rol`, `client_id`).
- [ ] B4. Crear buckets de Storage con sus policies.
- [ ] B5. Cargar seed y verificar aislamiento por RLS con usuarios de prueba.
- [ ] B6. Conectar el store al DAL real y validar el flujo completo end-to-end en Staging.
- [ ] B7. Promover a **Producción** solo lo validado (mismas migraciones, sin datos de prueba).

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Policies de RLS mal escritas exponen o bloquean datos | Pruebas de aislamiento por rol antes de cargar datos reales; revisión obligatoria |
| Custom claims del JWT mal configurados rompen el aislamiento | Verificar que `agency_id`/`rol`/`client_id` viajan en el token antes de B6 |
| Diferencia mock (IDs `cl3`) vs schema (UUID) | El seed mapea; el DAL ensambla las tablas normalizadas — trabajo previsto, no bloqueante |
| Migración del store introduce regresiones | Migrar módulo por módulo detrás del DAL, manteniendo las firmas actuales |
| Sin Docker local para dev | Usar proyecto cloud DEV, o instalar Docker Desktop si se prefiere dev local |

## Definition of Done

- Las migraciones corren sin error en un proyecto Supabase limpio.
- RLS activo: un usuario de la Agencia A no puede leer datos de la Agencia B (verificado con pruebas).
- Un cliente ve solo su información, sin `notas_internas` ni comentarios internos.
- Login real funciona para agencia y cliente; invitación y recuperación de contraseña operativas.
- Los archivos se suben a Storage; la base guarda solo `object_key` + metadata.
- El store consume el DAL (Supabase); no queda dependencia de mock/localStorage para los módulos migrados.
- `npx tsc --noEmit` y `npm run build` en verde.

## Criterios de aceptación

1. Crear un cliente desde el Portal Agencia lo persiste en Supabase y aparece tras recargar (sin localStorage).
2. Enviar invitación genera el registro y el correo; el cliente activa y entra a su portal.
3. Aprobar/solicitar cambios en una pieza escribe en `approval_events` y notifica.
4. Subir un video lo guarda en Storage y la pieza lo muestra vía `getMediaUrl()`.
5. Consultar como cliente jamás devuelve datos de otra agencia (RLS probado).

## Resultado esperado

FPlus corriendo sobre infraestructura real, multi-tenant y segura, con Primero Digital como primer tenant —
listo para las primeras pruebas con clientes reales y para conectar las APIs de pauta en el siguiente sprint.

---

## Estado actual del sprint

**Bloque A: ✅ completado** — todos los artefactos construidos y commiteados; la app compila en verde.
**Bloque B: 🔒 bloqueado** — requiere que el usuario cree el proyecto Supabase y comparta URL + anon key.

**Handoff para desbloquear el Bloque B:**
1. Crear cuenta y proyecto en [supabase.com](https://supabase.com) → Plan **Pro**, región **East US (N. Virginia)**.
2. Compartir por chat: **Project URL** y **anon/public key** (son públicas, seguras de compartir).
3. Guardar en `.env.local` (NO en el chat): `service_role key` y la contraseña de la base de datos.
4. Con eso ejecuto las migraciones, el seed, configuro Auth/Storage y conecto el DAL.
