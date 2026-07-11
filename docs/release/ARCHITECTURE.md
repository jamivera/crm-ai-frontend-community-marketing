# ARCHITECTURE · FPlus

> Visión técnica para un desarrollador que nunca vio el proyecto. Detalle de decisiones en
> [ARCHITECTURE_DECISIONS.md](ARCHITECTURE_DECISIONS.md); congelamiento en [ARCHITECTURE_FREEZE.md](ARCHITECTURE_FREEZE.md).

## 1 · Qué es y dónde vive

- **Producto:** FPlus — Marketing OS multi-tenant para agencias, capa `/fplus/*` sobre **Evo CRM Community**.
- **Ruta del repo:** `/Users/jamil/AgencyOs` (raíz oficial del proyecto — NO `/Users/jamil/Pailux`).
- **Primer tenant:** Primero Digital (agencia). Cada agencia administra sus propios clientes/marcas.

## 2 · Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 19, TypeScript strict, Vite, TailwindCSS 4, Zustand (`useFplusStore`), React Router 7 |
| Backend gestionado | **Supabase** (PostgreSQL 15 gestionado): Auth (GoTrue), Storage, Realtime, RLS |
| Región | `us-east-1` (ADR-007) |
| Entornos | `fplus-staging` + `fplus-production` (staging-first, ADR-010) |

## 3 · Multi-tenancy (el principio central)

- **Modelo:** shared database + columna `agency_id` + **Row Level Security (RLS)**.
- **La agencia es el tenant.** El usuario NUNCA es el tenant. Todo cuelga de `agency_id`:
  ```
  Agency ├ Users ├ Clients ├ Contracts ├ Briefs ├ Content ├ Campaigns
         ├ Publications ├ Metrics ├ Integrations ├ Billing └ Notifications
  ```
- **Aislamiento en la BD, no en la app:** RLS filtra por los claims del JWT (`agency_id`, `rol`, `client_id`).

## 4 · Identidad (ADR-011) — dos problemas, dos piezas

| Problema | Pieza | Responsabilidad |
|---|---|---|
| **Aprovisionamiento** (crear la fila de negocio del usuario) | **Trigger** `handle_new_user` sobre `auth.users` | Copiar `auth.uid()`, email y `app_metadata` a `public.users`. Nada más. |
| **Claims** (meter tenant/rol en el JWT) | **Custom Access Token Hook** `custom_access_token_hook` | Leer `public.users` e inyectar `agency_id/rol/client_id` en el token. |

Complementos:
- **Backend/DAL:** toda la lógica de negocio (crear agencias, clientes, contratos, invitaciones, onboarding, billing).
- **Edge Functions:** solo procesos asíncronos y efectos externos (emails, Stripe, Meta, webhooks).

**Regla de oro:** `agency_id/rol/client_id` viajan **solo** en `app_metadata` (control del servidor), nunca en
`user_metadata` ni desde el frontend. UUID canónico de un usuario = `auth.users.id`; `public.users` lo refleja.

## 5 · Data Access Layer (DAL) — ADR-004

- El **frontend nunca importa `supabase-js` directamente.** Solo lo hace `src/fplus/services/`.
- Cliente lee `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY` (clave pública; **nunca** secretos en el frontend).
- Patrón Repository / Ports-and-Adapters: interfaces (`IClientService`, …) + implementación Supabase + factory.
- Dos capas: (a) DAL cliente (CRUD vía RLS con la publishable key) y (b) Edge Functions (secretos/APIs/IA).
- `real mode` conmutable con fallback a mock: mientras un módulo no esté conectado, sigue en mock.

## 6 · Seguridad de claves

- **Publishable key** (`sb_publishable_…`): pública, va al frontend.
- **Secret key** (`sb_secret_…`, reemplaza al `service_role` legacy): SECRETA, solo en `.env.staging` local y en el servidor/Edge Functions. Nunca en el repo ni en el chat.
- RLS + GRANTs: `anon` y `authenticated` filtrados por RLS; `service_role` (secret key) ignora RLS (`bypassrls`).

## 7 · Flujo completo de un login real (objetivo)

```
Usuario → Supabase Auth (login) → auth.users
   → Trigger handle_new_user → public.users (si no existía)
   → Custom Access Token Hook → JWT con agency_id/rol/client_id
   → DAL (publishable key + JWT) → RLS filtra por tenant → datos del módulo
```
Estado actual: todo funciona **hasta `public.users`**; el paso del Hook está bloqueado por ISSUE-001.
