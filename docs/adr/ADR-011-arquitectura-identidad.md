# ADR-011 — Arquitectura Oficial de Identidad de FPlus

**Estado:** ✅ Aceptada (congelada) · **Fecha:** 2026-07-05 · **Refina:** [ADR-003 Multi-tenant](ADR-003-multi-tenant.md), [ADR-006 RLS](ADR-006-row-level-security.md), [ADR-004 DAL](ADR-004-data-access-layer.md), [ADR-005 Edge Functions](ADR-005-edge-functions.md)

## Contexto

FPlus es un SaaS multi-tenant sobre Supabase. La identidad de todo usuario existirá simultáneamente en
`auth.users` (gestionada por Supabase Auth) y en `public.users` (modelo de negocio con `agency_id`, `rol`,
`client_id`). Coexistirán tres tipos de usuario —administrador de agencia, colaborador de agencia y cliente
del portal— y en el futuro proveedores SSO (Google, Microsoft, SSO empresarial).

La prueba empírica del DAL con un usuario `anon` (ver `test_clientes_dal.mjs`) y el análisis de consistencia
`auth.users` ↔ `public.users` demostraron que se necesita un flujo **automático, seguro y agnóstico al origen**
para sincronizar identidad e inyectar los claims de tenant en el JWT. No debe depender de scripts manuales ni
del frontend.

## Problema

Sincronizar `auth.users` → `public.users` sin drift, para cualquier origen de alta (signup, invitación,
OAuth/SSO, alta desde el Dashboard), e inyectar `agency_id`/`rol`/`client_id` en el JWT para que RLS aísle por
tenant — todo ello preparado para crecer sin rediseñar el modelo de identidad.

## Distinción clave

Son **dos problemas distintos**, resueltos por dos componentes complementarios:

1. **Aprovisionamiento** — crear la fila en `public.users` cuando aparece un `auth.users`. → **Trigger**.
2. **Claims** — inyectar los claims de tenant en el JWT para RLS. → **Custom Access Token Hook**.

El Auth Hook no sustituye al Trigger: lee lo que el Trigger garantizó que existe.

## Alternativas evaluadas

- **Trigger sobre `auth.users`:** atómico, agnóstico al origen, nativo de BD. Aprovisiona.
- **Auth Hook:** único lugar correcto para claims de tenant en el JWT. No aprovisiona.
- **Edge Function:** buena para efectos externos, pero asíncrona → ventana de drift si es la fuente de verdad.
- **Backend/DAL:** control total del negocio, pero no cubre altas que no pasan por la API (SSO, invitación nativa, Dashboard) → drift.
- **Combinación:** separa responsabilidades. **Elegida.**

## Decisión

Se adopta como **arquitectura oficial de identidad** la combinación:

1. **Trigger sobre `auth.users`** → aprovisionamiento: sincroniza `auth.users` → `public.users`.
2. **Custom Access Token Hook** → construye los custom claims del JWT (`agency_id`, `role`, `client_id`).
3. **Backend / DAL** → toda la lógica de negocio.
4. **Edge Functions** → solo procesos asíncronos y efectos externos.

### Reglas arquitectónicas congeladas

**Regla 1 — Fuente única de verdad.** `agency_id`, `role` y `client_id` tienen una única fuente: **`app_metadata`**.
Nunca `user_metadata`, nunca valores enviados desde el frontend, nunca parámetros manipulables por el cliente.
Toda invitación/creación de usuarios establece estos valores **desde el servidor** en `app_metadata`. El
frontend nunca decide el tenant ni el rol de un usuario.

**Regla 2 — Responsabilidad mínima del Trigger.** El Trigger es extremadamente pequeño. Su única
responsabilidad es sincronizar `auth.users` → `public.users` con el UUID canónico.
- **Debe:** crear la fila en `public.users`; copiar `auth.uid()`; copiar `email`; copiar `app_metadata`;
  asignar los valores mínimos necesarios.
- **No debe:** crear agencias, clientes, contratos, campañas, billing, integraciones ni configuraciones;
  enviar correos; consumir APIs externas; ejecutar lógica de negocio. Todo eso pertenece al Backend/DAL.

**Regla 3 — El tenant siempre es la agencia.** La **agencia es el tenant**; el usuario **nunca** es el tenant.
Toda la arquitectura se organiza alrededor de `agency_id`. Ninguna funcionalidad futura dependerá del usuario
autenticado como propietario de los datos. Modelo conceptual:

```
Agency
 ├── Users
 ├── Clients
 ├── Contracts
 ├── Briefs
 ├── Content
 ├── Campaigns
 ├── Publications
 ├── Metrics
 ├── Integrations
 ├── Billing
 └── Notifications
```

Los usuarios pueden cambiar; la agencia permanece.

**Regla 4 — UUID canónico.** El UUID oficial de un usuario es siempre el generado por `auth.users`.
`public.users` **nunca** genera un UUID propio: refleja exactamente el de `auth.users`. La sincronización es
automática mediante el Trigger; no hay sincronizaciones manuales como flujo normal. `align_admin_user.sql` es
únicamente un **bootstrap excepcional** para el primer tenant de FPlus y no forma parte del funcionamiento
normal del producto.

**Regla 5 — Preparada para crecimiento.** La arquitectura soporta desde el día uno, sin rediseñar el modelo de
identidad: múltiples agencias; múltiples usuarios por agencia; múltiples clientes por agencia; invitaciones de
colaboradores; portal de clientes; Google OAuth; Microsoft OAuth; SSO empresarial futuro; múltiples
proveedores de autenticación.

**Regla 6 — Separación de responsabilidades.**

| Componente | Responsabilidad |
|---|---|
| **Trigger** | Aprovisionamiento de identidad · sincronizar `auth.users` → `public.users`. |
| **Auth Hook** | Construir los custom claims del JWT · inyectar `agency_id`, `role`, `client_id`. |
| **Backend / DAL** | Crear agencias, clientes, contratos; emitir invitaciones; onboarding; billing; reglas de negocio; validaciones funcionales. |
| **Edge Functions** | Procesos asíncronos · emails · Stripe · Meta · Google · TikTok · webhooks · integraciones externas. |

Cada componente se mantiene dentro de su responsabilidad.

**Claims oficiales (congelados).** Las claves técnicas son exactamente `agency_id`, `rol`, `client_id`
(en español, `rol` — coherente con la columna y con los helpers de RLS de la migración 0002; **no** `role`).
`app_metadata` y los claims del JWT usan estas mismas claves.

**Regla 7 — Idempotencia del Trigger.** El Trigger es completamente idempotente. Si el mismo usuario vuelve a
pasar por el flujo (reintentos, restauraciones, sincronizaciones, importaciones o procesos administrativos),
nunca genera registros duplicados ni estados inconsistentes. La operación produce el mismo resultado ejecutada
múltiples veces (`insert … on conflict (id) do nothing`).

**Regla 8 — Observabilidad mínima del Trigger.** El Trigger emite logs **técnicos** mínimos (no de negocio):
usuario aprovisionado, timestamp, resultado y error si existiera — vía `RAISE LOG` (logs de Postgres, no
transaccional). Suficiente para auditoría y diagnóstico. Nada de lógica de negocio dentro del Trigger; solo
observabilidad.

**Regla 9 — Separación evolutiva (Trigger vs Auth Hook).** El Trigger **solo sincroniza identidad**. El Auth
Hook **construye el contexto de autorización**. Cualquier claim nuevo del JWT (p. ej. `permissions`,
`feature_flags`, `billing_plan`, `timezone`, `locale`, `organization_type`) evolucionará **únicamente en el
Auth Hook** — el Trigger no se modifica por ello. Esta separación queda congelada.

## Consecuencias positivas

- **Sin drift:** todo `auth.users` produce `public.users` en la misma transacción, venga de donde venga.
- **RLS correcto:** los claims de tenant viven en el único lugar seguro (el Auth Hook, desde la BD).
- **SSO-ready desde el día uno:** Google/Microsoft/SAML insertan en `auth.users` → Trigger + Hook los cubren sin código nuevo.
- **Sin secretos en el cliente:** cero `service_role` en el frontend.
- **Versionado y reproducible:** Trigger y Hook son funciones SQL bajo la [política de BD](../database-policy.md), promovibles de Staging a Producción.
- **Seguridad de tenant:** al usar `app_metadata` (control del servidor), un usuario no puede auto-asignarse tenant ni rol.

## Riesgos

- **`SECURITY DEFINER`** del Trigger y del Hook → mitigado: `search_path` fijado, privilegios mínimos, ejecución restringida (`supabase_auth_admin`).
- **Un Trigger que lance excepción bloquea el signup** → mitigado: lógica mínima (Regla 2), a prueba de nulos, validado en Staging antes de Producción.
- **Bootstrap del primer tenant** (paradoja huevo-gallina: la primera agencia no tiene quién la invite) → `align_admin_user.sql` como excepción única y documentada; el Trigger puede contemplar el caso "primer usuario de agencia nueva" para eliminarlo del todo.

## Evoluciones futuras

- Contemplar en el Trigger el alta self-serve de una agencia nueva para retirar por completo el bootstrap manual.
- Resolución de tenant en SSO por dominio de correo o por invitación pre-aprovisionada.
- Promoción de Trigger y Hook por CI/CD (Staging → aprobación → Producción).

## Implementación (posterior a este ADR)

Dos migraciones bien delimitadas, siguiendo el proceso disciplinado del proyecto
(Arquitectura → Validación → Implementación → Evidencia → Corrección → Validación):

1. **Migración 0006 — Trigger `handle_new_user`** sobre `auth.users` (aprovisionamiento; Reglas 2, 7, 8).
2. **Migración 0007 — Custom Access Token Hook** `custom_access_token_hook` (claims; Reglas 3, 9) +
   habilitación en el Dashboard (Auth → Hooks) y deshabilitación del signup abierto (Auth → Settings).

Configuración manual asociada (no es SQL): habilitar el hook, deshabilitar el registro público, y restringir
OAuth a usuarios invitados. El bootstrap del primer admin se hace por el flujo real (admin API con
`app_metadata` → Trigger), no por `UPSERT` manual.
