# PROJECT_GLOSSARY · FPlus

> Vocabulario del proyecto. Si un término aparece en el código o la doc y no lo entiendes, está aquí.

| Término | Significado |
|---|---|
| **FPlus** | Marketing OS multi-tenant para agencias; capa `/fplus/*` sobre Evo CRM Community. |
| **Evo CRM Community** | CRM base open-source sobre el que se construye FPlus (código en `src/` no-fplus). |
| **Primero Digital** | Primera agencia/tenant real. `agency_id = 11111111-0000-0000-0000-000000000001`. |
| **Tenant** | La unidad de aislamiento = **la agencia**. Nunca el usuario. |
| **`agency_id`** | Clave de tenant; todo cuelga de ella. |
| **`rol`** | Rol del usuario (en español, NO `role`). Ej.: `agency_admin`, `account_manager`, `content_manager`, `designer`, `media_buyer`, `client_standard`, `client_premium`. |
| **`client_id`** (negocio) | Cliente/marca de una agencia al que se vincula un usuario de portal. ⚠️ Colisiona con el claim OAuth `client_id` de GoTrue (ISSUE-001). |
| **RLS** | Row Level Security de Postgres; aísla filas por tenant según los claims del JWT. |
| **Trigger `handle_new_user`** | Aprovisiona `public.users` desde `auth.users` (migr. 0006/0009). |
| **Auth Hook** | `custom_access_token_hook`: inyecta claims en el JWT (migr. 0007). |
| **`app_metadata`** | Metadatos del usuario controlados por el **servidor**; fuente única de `agency_id/rol/client_id`. Se guarda en `auth.users.raw_app_meta_data`. |
| **`user_metadata`** | Metadatos editables por el usuario; **prohibido** para campos de seguridad. |
| **UUID canónico** | `auth.users.id`; `public.users.id` lo refleja. |
| **DAL** | Data Access Layer; `src/fplus/services/`. Única capa que toca supabase-js. |
| **Publishable key** | `sb_publishable_…`; clave pública para el frontend (rol `anon`/`authenticated`). |
| **Secret key** | `sb_secret_…`; reemplaza al `service_role` legacy. SECRETA; mapea a `service_role` (`bypassrls`). |
| **`supabase_auth_admin`** | Rol de Postgres con el que GoTrue ejecuta el Auth Hook. |
| **PGlite** | Postgres compilado a WASM; corre migraciones+seed en Node sin Docker (`test_migrations.mjs`). |
| **Bootstrap** | Creación del primer admin por el flujo real (Admin API → Trigger). `bootstrap_admin.mjs`. |
| **Mock mode / real mode** | Interruptor: mock (datos falsos, fallback) vs real (datos de Supabase vía DAL). |
| **Cronopost** | Módulo de calendario/planificación de contenido estilo Trello. |
| **Andrómeda** | Nombre del asistente/copy con IA del producto. |
| **Diseño Comodín** | Tipo de contenido flexible (comodín) del plan. |
| **Freeze / RC1** | Punto de congelamiento oficial del proyecto (este release candidate). |
| **`42501`** | Código Postgres: `permission denied` (capa de GRANTs, antes de RLS). |
| **AuthRetryableFetchError** | Error de supabase-js cuando GoTrue devuelve 500 (p. ej. el hook falla). |
