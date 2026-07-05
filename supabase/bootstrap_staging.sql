-- ═══════════════════════════════════════════════════════════════════════
-- FPLUS — Bootstrap consolidado (Sprint 1·B) — GENERADO, no editar a mano
-- Migraciones (0001 schema → 0002 RLS → 0003 soft-delete/audit) + Seed.
-- Pegar y ejecutar en: Supabase Dashboard → SQL Editor → Run.
-- ═══════════════════════════════════════════════════════════════════════

-- ─── MIGRACIÓN 0001 · Schema ───────────────────────────────────────────
-- ═══════════════════════════════════════════════════════════════════════════
-- FPLUS — Schema de Base de Datos v1 (PostgreSQL / Supabase)
-- ═══════════════════════════════════════════════════════════════════════════
-- Principios de diseño:
--  1. Fuente única de verdad: content_pieces alimenta Calendario, Cronopost,
--     Multimedia, Aprobaciones, Campañas y Métricas.
--  2. Multi-tenant desde el día uno: todo cuelga de agency_id (RLS).
--  3. Historial, no sobrescritura: approval_events y metric_snapshots son
--     append-only; los clientes se archivan, nunca se eliminan.
--  4. Preparado para APIs: capa ads_* con IDs externos por proveedor y
--     payload crudo en JSONB — conectar Meta/Google/TikTok/LinkedIn no
--     requiere cambios estructurales.
--  5. Los nombres de columnas espejan los tipos TypeScript del frontend
--     (src/fplus/types) para una migración 1:1 del store.
-- ═══════════════════════════════════════════════════════════════════════════


-- ─── ENUMS ───────────────────────────────────────────────────────────────────

create type content_state as enum (
  'borrador','en_produccion','revision_interna','cambios_internos',
  'listo_para_cliente','enviado_cliente','en_revision_cliente',
  'aprobado_cliente','cambios_solicitados','segunda_revision',
  'aprobado_final','rechazado','cancelado','en_produccion_pauta',
  'publicado','archivado','bloqueado'
);

create type content_type as enum (
  'reel','carrusel','post_imagen','post_video','historia','historia_video',
  'short','tiktok','video_youtube','banner','infografia','blog',
  'diseno_comodin','otro'
);

create type platform as enum (
  'instagram','facebook','tiktok','youtube','linkedin','twitter','google'
);

create type pauta_publicitaria as enum (
  'no_incluye','incluida_agencia','cliente_paga','presupuesto_compartido'
);

create type marketing_objective as enum (
  'alcance','conversion','comunidad','lanzamiento'
);

create type piece_origin as enum ('planificada','extraordinaria','manual');

create type client_status as enum ('activo','inactivo','pausado');

create type user_role as enum (
  'super_admin','agency_admin','account_manager','media_buyer',
  'content_manager','designer','client_standard','client_premium'
);

create type ad_provider as enum ('meta','google','tiktok','linkedin');

create type funnel_stage as enum (
  'reconocimiento','consideracion','conversion','remarketing'
);

-- ─── TENANCY Y USUARIOS ──────────────────────────────────────────────────────

create table agencies (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,            -- 'Primero Digital'
  created_at  timestamptz not null default now()
);

create table users (
  id          uuid primary key default gen_random_uuid(),
  agency_id   uuid not null references agencies(id),
  email       text not null unique,
  nombre      text not null,
  rol         user_role not null,
  -- Los usuarios cliente quedan vinculados a su cliente (acceso al portal)
  client_id   uuid,                     -- FK diferida: se crea tras clients
  activo      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ─── CLIENTES ────────────────────────────────────────────────────────────────

create table clients (
  id                  uuid primary key default gen_random_uuid(),
  agency_id           uuid not null references agencies(id),
  nombre              text not null,
  empresa             text,
  industria           text not null,
  tipo_mercado        text,             -- alimenta el Motor de Planificación
  instagram_handle    text,
  logo_url            text,
  email               text,
  telefono            text,
  color_corporativo   text,
  responsable_cliente text,
  account_manager_id  uuid references users(id),
  objetivo_marketing  marketing_objective,
  estado              client_status not null default 'activo',
  semaforo            text not null default 'verde',   -- verde|amarillo|rojo
  observaciones       text,
  notas_internas      text,             -- nunca visible en el portal (RLS)
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table users
  add constraint users_client_fk foreign key (client_id) references clients(id);

-- ─── ACCESO Y GESTIÓN DE USUARIOS (una sola app, roles) ─────────────────────
-- Arquitectura de acceso (Opción C): una única Web App/PWA con autenticación
-- por roles. Supabase Auth maneja login, recuperación de contraseña y
-- verificación de email; estas tablas modelan la capa de negocio.
--
-- users.activo permite desactivar sin eliminar (historial intacto).
-- users.client_id cubre el caso simple (un usuario = un cliente).
-- user_clients cubre los casos avanzados:
--   · un cliente con varios usuarios (gerente + asistente de marketing)
--   · un mismo usuario externo administrando varias marcas

create table user_clients (
  user_id    uuid not null references users(id),
  client_id  uuid not null references clients(id),
  rol        user_role not null default 'client_standard',
  primary key (user_id, client_id)
);

-- Invitaciones seguras por correo: la agencia crea el cliente → el sistema
-- genera un token de un solo uso → el cliente define su contraseña en el
-- primer ingreso → entra por la misma URL y ve su portal según rol.
create table user_invitations (
  id           uuid primary key default gen_random_uuid(),
  agency_id    uuid not null references agencies(id),
  client_id    uuid references clients(id),   -- NULL = invitación a colaborador
  email        text not null,
  rol          user_role not null,
  token        uuid not null default gen_random_uuid() unique,
  invited_by   uuid references users(id),
  expires_at   timestamptz not null default now() + interval '7 days',
  accepted_at  timestamptz,                   -- NULL = pendiente
  created_at   timestamptz not null default now()
);

create index idx_invitations_token on user_invitations (token) where accepted_at is null;

-- ─── PLANES Y CONTRATOS ──────────────────────────────────────────────────────
-- Las plantillas viven en BD (no quemadas en código): Plata/Oro/Platinum
-- iniciales + planes personalizados futuros.

create table plan_templates (
  id                uuid primary key default gen_random_uuid(),
  agency_id         uuid not null references agencies(id),
  codigo            text not null,      -- 'plata' | 'oro' | 'platinum' | custom
  label             text not null,
  emoji             text,
  piezas_mensuales  int not null,
  distribucion      jsonb not null,     -- { "reel": 8, "carrusel": 6, ... }
  precio_lista      numeric(10,2) not null,
  redes_permitidas  platform[] not null,
  incluye_comodin   boolean not null default false,
  activo            boolean not null default true,
  unique (agency_id, codigo)
);

-- Un cliente puede renovar: histórico de contratos, nunca sobrescribir.
create table contracts (
  id                  uuid primary key default gen_random_uuid(),
  client_id           uuid not null references clients(id),
  plan_template_id    uuid references plan_templates(id),
  plan_codigo         text,             -- snapshot del plan al firmar
  fecha_inicio        date not null,
  fecha_fin           date,
  precio_lista        numeric(10,2),
  descuento           numeric(10,2) default 0,
  valor_final         numeric(10,2),    -- precio_lista - descuento
  piezas_mensuales    int not null,
  redes_contratadas   platform[] not null,
  pauta               pauta_publicitaria not null default 'no_incluye',
  pauta_plataformas   text[],           -- 'Meta Ads','Google Ads',…
  presupuesto_pauta   numeric(10,2),    -- SIEMPRE dinero del cliente
  -- Firma electrónica (respaldo comercial)
  firma_imagen        text,             -- URL en Storage (no base64 en BD)
  firma_firmante      text,
  firma_fecha         timestamptz,
  firma_ip            inet,
  firma_usuario       uuid references users(id),
  es_vigente          boolean not null default true,
  created_at          timestamptz not null default now()
);

-- Distribución de piezas por tipo (editable por contrato — planes a medida)
create table contract_items (
  id           uuid primary key default gen_random_uuid(),
  contract_id  uuid not null references contracts(id) on delete cascade,
  tipo         content_type not null,
  cantidad     int not null check (cantidad > 0),
  unique (contract_id, tipo)
);

-- ─── BRIEF (el corazón estratégico) ─────────────────────────────────────────

create table briefs (
  id                    uuid primary key default gen_random_uuid(),
  client_id             uuid not null references clients(id) unique,
  -- Comercial (alimenta Centro de Estrategia e IA)
  objetivos_comerciales text,
  servicios             text,
  productos             text,
  ticket_promedio       text,
  presupuesto_marketing text,
  proceso_comercial     text,
  embudo_actual         text,
  -- Negocio
  propuesta_valor       text,
  diferenciadores       text,
  competencia           text,
  historia_marca        text,
  -- Audiencia
  perfil_cliente        text,
  rango_edad            text,
  ubicacion             text,
  pain_points           text,
  motivaciones          text,
  objeciones            text,
  -- Contenido
  pilares               text[],
  tono                  text[],
  formatos_preferidos   content_type[],
  que_no_hacer          text,
  hashtags_habituales   text[],
  -- Canales
  plataformas_activas   platform[],
  frecuencia_semanal    int,
  horarios_preferidos   text,
  objetivo_principal    text,
  url_landing           text,
  updated_at            timestamptz not null default now()
);

-- Eventos propios del cliente para el Calendario Inteligente
-- (el banco global de feriados/fechas comerciales vive en smart_events)
create table smart_events (
  id                    uuid primary key default gen_random_uuid(),
  agency_id             uuid references agencies(id),  -- NULL = banco global
  client_id             uuid references clients(id),   -- NULL = para todos
  fecha                 date not null,
  nombre                text not null,
  tipo                  text not null,  -- feriado|comercial|efemeride|sector|cliente
  recurrente_anual      boolean not null default false,
  industrias_relevantes text[]
);

-- ─── CONTENIDO (fuente única de verdad) ──────────────────────────────────────

create table content_pieces (
  id                  uuid primary key default gen_random_uuid(),
  client_id           uuid not null references clients(id),
  campaign_id         uuid,             -- FK diferida a campaigns
  nombre              text not null,
  tipo                content_type not null,
  estado              content_state not null default 'borrador',
  origen              piece_origin not null default 'manual',
  razon_estrategica   text,             -- explicación del planificador IA
  fecha_publicacion   timestamptz,      -- incluye la hora recomendada
  fecha_limite        timestamptz,
  plataforma          platform,
  copy_activo         text,
  hashtags            text[],
  angulo_andromeda    text,             -- para el análisis de métricas futuro
  incluye_cta         boolean not null default false,
  seleccionado_pauta  boolean not null default false,
  pilar               text,
  tono                text[],
  iteraciones         int not null default 0,
  max_iteraciones     int not null default 3,
  account_manager_id  uuid references users(id),
  designer_id         uuid references users(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_pieces_client_fecha on content_pieces (client_id, fecha_publicacion);
create index idx_pieces_estado on content_pieces (client_id, estado);
create index idx_pieces_pauta on content_pieces (client_id) where seleccionado_pauta;

-- Archivos: los binarios van a Storage (S3/Supabase); aquí solo referencias.
-- Versionado: cada subida es una fila nueva; es_version_activa marca la vigente.
create table content_files (
  id                uuid primary key default gen_random_uuid(),
  content_piece_id  uuid not null references content_pieces(id) on delete cascade,
  nombre            text not null,
  tipo              text not null,      -- imagen|video|pdf|audio|otro
  storage_path      text not null,      -- ruta en el bucket (no base64)
  thumbnail_path    text,
  tamanio_bytes     bigint not null default 0,
  version           int not null default 1,
  es_version_activa boolean not null default true,
  subido_por        uuid references users(id),
  created_at        timestamptz not null default now()
);

-- Comentarios unificados: internos (agencia) y del portal (cliente)
create table comments (
  id                uuid primary key default gen_random_uuid(),
  content_piece_id  uuid not null references content_pieces(id) on delete cascade,
  autor_id          uuid references users(id),
  autor_nombre      text not null,      -- snapshot por si el usuario cambia
  texto             text not null,
  interno           boolean not null default false,  -- true = solo agencia (RLS)
  created_at        timestamptz not null default now()
);

-- Historial de aprobación/estados: append-only, jamás se edita.
-- Da gratis: tab Historial, auditoría, prioridades y disputas con clientes.
create table approval_events (
  id                uuid primary key default gen_random_uuid(),
  content_piece_id  uuid not null references content_pieces(id) on delete cascade,
  estado_anterior   content_state,
  estado_nuevo      content_state not null,
  actor_id          uuid references users(id),
  actor_nombre      text not null,
  comentario        text,               -- obligatorio en cambios_solicitados (app)
  created_at        timestamptz not null default now()
);

create index idx_events_piece on approval_events (content_piece_id, created_at);

-- ─── CAMPAÑAS Y ESTRATEGIA ───────────────────────────────────────────────────

create table campaigns (
  id                 uuid primary key default gen_random_uuid(),
  client_id          uuid not null references clients(id),
  nombre             text not null,
  nomenclatura       text,              -- KINARA_META_CONVERSION_…
  objetivo           marketing_objective,
  estado             text not null default 'planificada',
  fecha_inicio       date,
  fecha_fin          date,
  presupuesto_total  numeric(10,2),
  -- Snapshot de la estrategia generada/ajustada (score, embudo, audiencias):
  -- se guarda el resultado final que aprobó el estratega
  estrategia         jsonb,
  created_at         timestamptz not null default now()
);

alter table content_pieces
  add constraint pieces_campaign_fk foreign key (campaign_id) references campaigns(id);

-- ─── CAPA DE ADS (integración Meta/Google/TikTok/LinkedIn) ───────────────────
-- Cada proveedor tiene su conector; todos alimentan estas mismas tablas.

create table ad_accounts (
  id                   uuid primary key default gen_random_uuid(),
  client_id            uuid not null references clients(id),
  provider             ad_provider not null,
  external_account_id  text not null,
  -- Tokens SIEMPRE cifrados (Supabase Vault / KMS), nunca en texto plano
  credentials_ref      text,
  estado               text not null default 'desconectado',
  connected_at         timestamptz,
  unique (provider, external_account_id)
);

create table ad_campaigns (
  id                    uuid primary key default gen_random_uuid(),
  campaign_id           uuid references campaigns(id),   -- vínculo a FPLUS
  ad_account_id         uuid not null references ad_accounts(id),
  provider              ad_provider not null,
  external_campaign_id  text not null,
  nombre                text,
  objetivo              text,            -- objetivo nativo del proveedor
  etapa_embudo          funnel_stage,
  presupuesto           numeric(10,2),
  estado                text,
  unique (provider, external_campaign_id)
);

create table ad_sets (
  id                  uuid primary key default gen_random_uuid(),
  ad_campaign_id      uuid not null references ad_campaigns(id),
  provider            ad_provider not null,
  external_adset_id   text not null,
  nombre              text,
  audiencia           jsonb,             -- definición nativa del proveedor
  unique (provider, external_adset_id)
);

-- EL VÍNCULO CLAVE: cada anuncio sabe qué pieza de contenido usó.
-- copy/hashtags/ángulo se congelan al lanzar (snapshot) para que el
-- análisis histórico no se contamine si la pieza se edita después.
create table ads (
  id                 uuid primary key default gen_random_uuid(),
  ad_set_id          uuid not null references ad_sets(id),
  provider           ad_provider not null,
  external_ad_id     text not null,
  content_piece_id   uuid references content_pieces(id),
  copy_snapshot      text,
  hashtags_snapshot  text[],
  angulo_snapshot    text,
  created_at         timestamptz not null default now(),
  unique (provider, external_ad_id)
);

create index idx_ads_piece on ads (content_piece_id);

-- ─── PUBLICACIONES ORGÁNICAS ─────────────────────────────────────────────────

create table publications (
  id                uuid primary key default gen_random_uuid(),
  content_piece_id  uuid not null references content_pieces(id),
  client_id         uuid not null references clients(id),
  plataforma        platform not null,
  fecha_programada  timestamptz not null,
  fecha_publicada   timestamptz,
  url               text,
  external_post_id  text,               -- id del post en la red (sync futuro)
  estado            text not null default 'sin_confirmar',
  utm_params        jsonb,
  created_at        timestamptz not null default now()
);

-- ─── MÉTRICAS (modelo unificado) ────────────────────────────────────────────
-- Una fila por medición (snapshot temporal), nunca se sobrescribe.
-- Campos normalizados comunes a todos los proveedores; lo que un proveedor
-- no tenga queda NULL; el payload crudo completo va en raw_data.
-- Derivados (CTR, CPC, CPM, ROAS) NO se guardan: se calculan al consultar.

create table metric_snapshots (
  id              uuid primary key default gen_random_uuid(),
  -- exactamente uno de los dos orígenes:
  ad_id           uuid references ads(id),           -- métrica de pauta
  publication_id  uuid references publications(id),  -- métrica orgánica
  provider        ad_provider,                       -- NULL = carga manual
  snapshot_at     timestamptz not null default now(),
  granularidad    text not null default 'daily',     -- daily|lifetime
  -- Normalizados
  impressions     bigint,
  reach           bigint,
  clicks          bigint,
  engagements     bigint,
  likes           bigint,
  comments        bigint,
  shares          bigint,
  saves           bigint,
  video_views     bigint,
  leads           int,
  conversions     int,
  messages        int,
  followers_delta int,
  spend           numeric(12,4),
  revenue         numeric(12,4),        -- para ROAS cuando exista attribution
  -- Crudo del proveedor (nada se pierde)
  raw_data        jsonb,
  check (ad_id is not null or publication_id is not null)
);

create index idx_metrics_ad on metric_snapshots (ad_id, snapshot_at);
create index idx_metrics_pub on metric_snapshots (publication_id, snapshot_at);

-- ─── VISTA: el cerebro de Métricas ──────────────────────────────────────────
-- Une resultados con contenido, copy, ángulo y campaña. Responde:
-- ¿qué formato/ángulo/copy generó más leads / mejor CTR / mejor ROAS?

create view v_content_performance as
select
  cp.client_id,
  cp.id            as content_piece_id,
  cp.nombre,
  cp.tipo,
  cp.angulo_andromeda,
  ac.etapa_embudo,
  a.provider,
  sum(ms.impressions)                            as impressions,
  sum(ms.reach)                                  as reach,
  sum(ms.clicks)                                 as clicks,
  sum(ms.leads)                                  as leads,
  sum(ms.spend)                                  as spend,
  case when sum(ms.impressions) > 0
       then round(sum(ms.clicks)::numeric / sum(ms.impressions) * 100, 2)
       end                                       as ctr,
  case when sum(ms.clicks) > 0
       then round(sum(ms.spend) / sum(ms.clicks), 2)
       end                                       as cpc,
  case when sum(ms.leads) > 0
       then round(sum(ms.spend) / sum(ms.leads), 2)
       end                                       as costo_por_lead,
  case when sum(ms.spend) > 0
       then round(sum(ms.revenue) / sum(ms.spend), 2)
       end                                       as roas
from content_pieces cp
join ads a              on a.content_piece_id = cp.id
join ad_sets s          on s.id = a.ad_set_id
join ad_campaigns ac    on ac.id = s.ad_campaign_id
left join metric_snapshots ms on ms.ad_id = a.id
group by cp.client_id, cp.id, cp.nombre, cp.tipo, cp.angulo_andromeda,
         ac.etapa_embudo, a.provider;

-- ─── ROW LEVEL SECURITY (esquema de permisos) ───────────────────────────────
-- Regla general: los usuarios de agencia ven todo lo de su agency_id;
-- los usuarios cliente solo ven su client_id, sin notas_internas,
-- sin comments.interno y con estados internos mapeados en la app.
--
--   alter table clients enable row level security;
--   create policy agency_all on clients
--     using (agency_id = auth.jwt() ->> 'agency_id'::uuid);
--   create policy client_own on clients for select
--     using (id = (select client_id from users where id = auth.uid()));
--
-- (Las policies completas se implementan al montar Supabase; este esquema
--  ya está estructurado para soportarlas sin cambios.)

-- ═══════════════════════════════════════════════════════════════════════════
-- SCHEMA v2 — Mejoras arquitectónicas (Constitución Técnica, punto 16)
-- ═══════════════════════════════════════════════════════════════════════════
-- Estas tablas NO se implementan en la app todavía; nacen en el diseño para
-- que la base de datos esté preparada y no requiera migraciones estructurales.

-- ─── SEGURIDAD TRANSVERSAL: audit log + soft delete ─────────────────────────
-- Soft delete: se agrega `deleted_at timestamptz` a TODAS las tablas de
-- negocio (clients, content_pieces, campaigns, briefs, contracts, users, …).
-- Nada se borra físicamente; las queries y policies filtran deleted_at IS NULL.
-- Ejemplo:  alter table clients add column deleted_at timestamptz;

-- Registro automático de cambios (alimentado por triggers de PostgreSQL).
create table audit_log (
  id          bigint generated always as identity,
  agency_id   uuid,                    -- tenant (para RLS y particionado)
  actor_id    uuid,                    -- users.id que ejecutó la acción
  actor_email text,
  accion      text not null,           -- insert | update | delete | login | …
  entidad     text not null,           -- 'clients', 'content_pieces', …
  entidad_id  uuid,
  before      jsonb,                   -- estado anterior
  after       jsonb,                   -- estado nuevo
  ip          inet,
  user_agent  text,
  created_at  timestamptz not null default now(),
  -- La PK de una tabla particionada debe incluir la columna de partición
  primary key (id, created_at)
) partition by range (created_at);     -- append-only de alto volumen → particionada

create index idx_audit_agency on audit_log (agency_id, created_at);
create index idx_audit_entidad on audit_log (entidad, entidad_id);

-- ─── INTEGRACIONES (genérica, multi-proveedor) ──────────────────────────────
-- Una sola tabla para Meta, Google, TikTok, LinkedIn, WhatsApp, Calendar,
-- Drive, Analytics, Search Console, Stripe… Los tokens van cifrados en Vault.
create type integration_provider as enum (
  'meta','google_ads','tiktok','linkedin','openai','anthropic','gemini',
  'whatsapp','google_calendar','google_drive','google_analytics',
  'search_console','looker','stripe'
);

create table integrations (
  id              uuid primary key default gen_random_uuid(),
  agency_id       uuid not null references agencies(id),
  client_id       uuid references clients(id),   -- NULL = a nivel agencia
  provider        integration_provider not null,
  external_id     text,                          -- id de cuenta/página externa
  credentials_ref text,                          -- referencia a Supabase Vault
  scopes          text[],
  estado          text not null default 'desconectado',
  metadata        jsonb,
  connected_at    timestamptz,
  expires_at      timestamptz,                   -- vencimiento del token
  created_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

create index idx_integrations_tenant on integrations (agency_id, provider);

-- ─── INTELIGENCIA ARTIFICIAL (Andrómeda, multi-proveedor) ───────────────────
-- Guarda cada generación de IA: qué proveedor, modelo, prompt, respuesta,
-- costo, y a qué entidad pertenece. Permite cambiar de proveedor sin tocar la
-- app y responder "qué ángulo/modelo generó mejores resultados".
create table ai_generations (
  id            uuid primary key default gen_random_uuid(),
  agency_id     uuid not null references agencies(id),
  client_id     uuid references clients(id),
  provider      text not null,          -- 'openai' | 'anthropic' | 'gemini'
  modelo        text not null,          -- 'gpt-4o' | 'claude-…' | 'gemini-…'
  tarea         text not null,          -- copy | hashtags | estrategia | plan
  entidad       text,                   -- 'content_pieces' | 'campaigns' | …
  entidad_id    uuid,
  angulo_andromeda text,
  input         jsonb not null,         -- prompt + variables
  output        jsonb,                  -- respuesta estructurada
  tokens_input  int,
  tokens_output int,
  costo_usd     numeric(10,6),
  latencia_ms   int,
  created_at    timestamptz not null default now()
);

create index idx_ai_entidad on ai_generations (entidad, entidad_id);
create index idx_ai_tenant on ai_generations (agency_id, created_at);

-- ─── FEATURE FLAGS (por agencia o por plan) ─────────────────────────────────
create table feature_flags (
  id          uuid primary key default gen_random_uuid(),
  clave       text not null,            -- 'metrics_v2', 'ai_copy', 'whatsapp'
  descripcion text,
  -- Alcance: global, por plan o por agencia específica
  agency_id   uuid references agencies(id),   -- NULL = aplica a todas
  plan_codigo text,                            -- NULL = cualquier plan
  activo      boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (clave, agency_id, plan_codigo)
);

-- ─── BILLING (suscripciones — preparado, sin usar aún) ──────────────────────
create table subscription_plans (
  id            uuid primary key default gen_random_uuid(),
  codigo        text not null unique,   -- 'starter','growth','agency','enterprise'
  nombre        text not null,
  precio_mensual numeric(10,2),
  moneda        text not null default 'USD',
  limites       jsonb,                  -- { max_clients, max_users, storage_gb }
  activo        boolean not null default true
);

create table subscriptions (
  id             uuid primary key default gen_random_uuid(),
  agency_id      uuid not null references agencies(id),
  plan_id        uuid not null references subscription_plans(id),
  estado         text not null default 'trial',   -- trial|activa|morosa|cancelada
  stripe_customer_id     text,
  stripe_subscription_id text,
  periodo_inicio timestamptz,
  periodo_fin    timestamptz,
  created_at     timestamptz not null default now()
);

create table invoices (
  id              uuid primary key default gen_random_uuid(),
  agency_id       uuid not null references agencies(id),
  subscription_id uuid references subscriptions(id),
  numero          text,
  monto           numeric(10,2) not null,
  moneda          text not null default 'USD',
  estado          text not null default 'pendiente', -- pendiente|pagada|vencida
  stripe_invoice_id text,
  emitida_at      timestamptz not null default now(),
  pagada_at       timestamptz
);

create table payments (
  id           uuid primary key default gen_random_uuid(),
  invoice_id   uuid not null references invoices(id),
  monto        numeric(10,2) not null,
  metodo       text,                    -- card | transfer | …
  stripe_payment_intent_id text,
  estado       text not null default 'procesando',
  created_at   timestamptz not null default now()
);

-- ─── JOBS / QUEUE (procesos pesados asíncronos) ─────────────────────────────
-- Sincronización con Meta, generación de IA, envío de correos, cálculo de
-- métricas… no bloquean la app: se encolan y un worker los procesa.
create table jobs (
  id            uuid primary key default gen_random_uuid(),
  agency_id     uuid references agencies(id),
  tipo          text not null,          -- 'sync_meta' | 'ai_generate' | 'email'
  payload       jsonb not null,
  estado        text not null default 'pendiente', -- pendiente|corriendo|ok|error
  intentos      int not null default 0,
  max_intentos  int not null default 3,
  error         text,
  programado_at timestamptz not null default now(),
  iniciado_at   timestamptz,
  finalizado_at timestamptz,
  created_at    timestamptz not null default now()
);

create index idx_jobs_pendientes on jobs (estado, programado_at) where estado = 'pendiente';

-- ─── WEBHOOK LOGS (auditoría de webhooks entrantes) ─────────────────────────
create table webhook_logs (
  id           bigint generated always as identity,
  provider     text not null,          -- 'meta' | 'stripe' | 'google' | …
  evento       text,                   -- tipo de evento del proveedor
  headers      jsonb,
  payload      jsonb not null,
  firma_valida boolean,                -- verificación de firma HMAC
  procesado    boolean not null default false,
  error        text,
  received_at  timestamptz not null default now(),
  primary key (id, received_at)
) partition by range (received_at);    -- alto volumen → particionada

create index idx_webhooks_provider on webhook_logs (provider, received_at);

-- ─── NOTIFICACIONES (unificadas: in-app, email, push futuro) ────────────────
create table notifications (
  id          uuid primary key default gen_random_uuid(),
  agency_id   uuid not null references agencies(id),
  user_id     uuid references users(id),      -- destinatario
  canal       text not null default 'in_app', -- in_app | email | push
  tipo        text not null,                  -- 'aprobacion' | 'comentario' | …
  titulo      text not null,
  cuerpo      text,
  entidad     text,                           -- deep-link a la entidad
  entidad_id  uuid,
  leida       boolean not null default false,
  enviada_at  timestamptz,
  created_at  timestamptz not null default now()
);

create index idx_notif_user on notifications (user_id, leida, created_at);

-- ─── MIGRACIÓN 0002 · RLS ──────────────────────────────────────────────
-- ═══════════════════════════════════════════════════════════════════════════
-- FPLUS — Migración 0002: Row Level Security (aislamiento multi-tenant)
-- ═══════════════════════════════════════════════════════════════════════════
-- Principio (ADR-003, ADR-006): el aislamiento vive en la base de datos.
--   · Usuario de agencia → ve todo lo de SU agency_id.
--   · Usuario cliente   → ve solo SU client_id, sin notas internas.
-- Los claims agency_id, rol y client_id viajan en el JWT (Auth Hook, migración 0003).
-- ═══════════════════════════════════════════════════════════════════════════

-- Helpers: leen los claims del JWT del usuario autenticado.
create or replace function auth_agency_id() returns uuid
  language sql stable as $$ select nullif(auth.jwt() ->> 'agency_id','')::uuid $$;

create or replace function auth_client_id() returns uuid
  language sql stable as $$ select nullif(auth.jwt() ->> 'client_id','')::uuid $$;

create or replace function auth_rol() returns text
  language sql stable as $$ select auth.jwt() ->> 'rol' $$;

create or replace function is_agency_user() returns boolean
  language sql stable as $$ select coalesce(auth.jwt() ->> 'rol','') not in ('client_standard','client_premium') $$;

-- ─── Tablas con agency_id directo ────────────────────────────────────────────
-- Agencia ve lo suyo; cliente no accede (estas son tablas de gestión interna).

do $$
declare t text;
begin
  foreach t in array array[
    'clients','plan_templates','integrations','ai_generations',
    'feature_flags','subscriptions','invoices','payments','jobs',
    'notifications','audit_log'
  ] loop
    execute format('alter table %I enable row level security;', t);
    execute format($p$
      create policy agency_isolation on %I
        using (agency_id = auth_agency_id());
    $p$, t);
  end loop;
end $$;

-- users: la agencia gestiona sus usuarios; cada quien se ve a sí mismo.
alter table users enable row level security;
create policy users_agency on users
  using (agency_id = auth_agency_id());

-- ─── clients: policy adicional para que el CLIENTE vea su propia ficha ───────
create policy clients_own on clients for select
  using (id = auth_client_id());

-- ─── Tablas colgadas de client_id (contenido, briefs, contratos, campañas) ──
-- Agencia: todo lo de su agencia (join a clients). Cliente: solo lo suyo.

do $$
declare t text;
begin
  foreach t in array array[
    'briefs','contracts','content_pieces','campaigns','publications'
  ] loop
    execute format('alter table %I enable row level security;', t);
    -- Agencia
    execute format($p$
      create policy agency_access on %I
        using (exists (
          select 1 from clients c
          where c.id = %I.client_id and c.agency_id = auth_agency_id()
        ) and is_agency_user());
    $p$, t, t);
    -- Cliente (solo su client_id)
    execute format($p$
      create policy client_access on %I for select
        using (client_id = auth_client_id());
    $p$, t, t);
  end loop;
end $$;

-- contract_items: vía contracts → clients
alter table contract_items enable row level security;
create policy contract_items_access on contract_items
  using (exists (
    select 1 from contracts ct join clients c on c.id = ct.client_id
    where ct.id = contract_items.contract_id
      and c.agency_id = auth_agency_id()
  ));

-- content_files, comments, approval_events: vía content_pieces → clients
do $$
declare t text;
begin
  foreach t in array array['content_files','comments','approval_events'] loop
    execute format('alter table %I enable row level security;', t);
    -- Agencia: todo lo de su agencia
    execute format($p$
      create policy agency_access on %I
        using (exists (
          select 1 from content_pieces p join clients c on c.id = p.client_id
          where p.id = %I.content_piece_id and c.agency_id = auth_agency_id()
        ));
    $p$, t, t);
  end loop;
end $$;

-- content_files + approval_events: el cliente ve los de sus piezas (lectura)
create policy client_read on content_files for select
  using (exists (
    select 1 from content_pieces p
    where p.id = content_files.content_piece_id and p.client_id = auth_client_id()
  ));

create policy client_read on approval_events for select
  using (exists (
    select 1 from content_pieces p
    where p.id = approval_events.content_piece_id and p.client_id = auth_client_id()
  ));

-- comments: el cliente ve solo los NO internos de sus piezas
create policy client_read on comments for select
  using (interno = false and exists (
    select 1 from content_pieces p
    where p.id = comments.content_piece_id and p.client_id = auth_client_id()
  ));

-- ─── Capa de ads y métricas: solo agencia (el cliente ve resumen vía app) ────
do $$
declare t text;
begin
  foreach t in array array['ad_accounts','ad_campaigns','ad_sets','ads','metric_snapshots'] loop
    execute format('alter table %I enable row level security;', t);
  end loop;
end $$;

-- ad_accounts vía client → agency
create policy agency_access on ad_accounts
  using (exists (select 1 from clients c
    where c.id = ad_accounts.client_id and c.agency_id = auth_agency_id()));

-- Nota: ad_campaigns/ad_sets/ads/metric_snapshots heredan el aislamiento por
-- sus FKs; sus policies detalladas se afinan al construir el conector Meta
-- (Sprint de integraciones), cuando exista el patrón de acceso real.

-- ─── Tablas globales de solo lectura para usuarios autenticados ──────────────
alter table subscription_plans enable row level security;
create policy read_all on subscription_plans for select using (true);

alter table smart_events enable row level security;
create policy smart_events_access on smart_events
  using (agency_id is null or agency_id = auth_agency_id());

-- ─── MIGRACIÓN 0003 · Soft delete + Audit ──────────────────────────────
-- ═══════════════════════════════════════════════════════════════════════════
-- FPLUS — Migración 0003: Soft delete universal + triggers de audit log
-- ═══════════════════════════════════════════════════════════════════════════
-- Principios 7 y 8: no se borra físicamente; todo cambio importante se audita.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Soft delete: columna deleted_at en las tablas de negocio ───────────────
do $$
declare t text;
begin
  foreach t in array array[
    'clients','users','briefs','contracts','content_pieces',
    'campaigns','publications','integrations'
  ] loop
    execute format('alter table %I add column if not exists deleted_at timestamptz;', t);
    execute format('create index if not exists idx_%s_not_deleted on %I (deleted_at) where deleted_at is null;', t, t);
  end loop;
end $$;

-- Nota: las policies de RLS y las queries del DAL deben filtrar deleted_at IS NULL.

-- ─── updated_at automático ──────────────────────────────────────────────────
create or replace function set_updated_at() returns trigger
  language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['clients','content_pieces'] loop
    execute format($p$
      create trigger trg_%s_updated before update on %I
        for each row execute function set_updated_at();
    $p$, t, t);
  end loop;
end $$;

-- ─── Audit log automático (before/after) ────────────────────────────────────
-- Registra INSERT/UPDATE/DELETE de las tablas críticas en audit_log, con el
-- actor y el tenant tomados del JWT. Alimenta el tab Historial y la auditoría.

create or replace function fn_audit() returns trigger
  language plpgsql security definer as $$
declare
  v_agency uuid := nullif(auth.jwt() ->> 'agency_id','')::uuid;
  v_actor  uuid := auth.uid();
  v_email  text := auth.jwt() ->> 'email';
  v_id     uuid;
begin
  v_id := coalesce((to_jsonb(new) ->> 'id')::uuid, (to_jsonb(old) ->> 'id')::uuid);
  insert into audit_log (agency_id, actor_id, actor_email, accion, entidad, entidad_id, before, after)
  values (
    v_agency, v_actor, v_email, lower(tg_op), tg_table_name, v_id,
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'clients','content_pieces','contracts','campaigns','briefs'
  ] loop
    execute format($p$
      create trigger trg_audit_%s after insert or update or delete on %I
        for each row execute function fn_audit();
    $p$, t, t);
  end loop;
end $$;

-- ─── Particiones iniciales para audit_log y webhook_logs ────────────────────
-- Se crea la partición del período actual; un job mensual crea las siguientes.
create table if not exists audit_log_2026 partition of audit_log
  for values from ('2026-01-01') to ('2027-01-01');
create table if not exists webhook_logs_2026 partition of webhook_logs
  for values from ('2026-01-01') to ('2027-01-01');

-- ─── SEED ───────────────────────────────────────────────────────────────

-- · seed_agencies
-- ═══════════════════════════════════════════════════════════════════════════
-- SEED · Agencias, planes, billing y feature flags
-- ═══════════════════════════════════════════════════════════════════════════
-- Primero Digital = tenant principal de desarrollo/QA/demos.
-- Idempotente: UUIDs fijos + on conflict do nothing.

-- ─── Agencia fundadora ───────────────────────────────────────────────────────
insert into agencies (id, nombre) values
  ('11111111-0000-0000-0000-000000000001', 'Primero Digital')
on conflict (id) do nothing;

-- ─── Plantillas de planes (viven en BD, no quemadas — §16 / ADR) ─────────────
insert into plan_templates
  (id, agency_id, codigo, label, emoji, piezas_mensuales, distribucion, precio_lista, redes_permitidas, incluye_comodin)
values
  ('11111111-0000-0000-0000-0000000000a1', '11111111-0000-0000-0000-000000000001',
   'plata', 'Plan Plata', '🥈', 12,
   '{"reel":4,"carrusel":3,"post_imagen":3,"historia":2}', 400,
   array['facebook','instagram']::platform[], false),
  ('11111111-0000-0000-0000-0000000000a2', '11111111-0000-0000-0000-000000000001',
   'oro', 'Plan Oro', '🥇', 20,
   '{"reel":7,"carrusel":5,"post_imagen":4,"historia":4}', 600,
   array['facebook','instagram','tiktok']::platform[], true),
  ('11111111-0000-0000-0000-0000000000a3', '11111111-0000-0000-0000-000000000001',
   'platinum', 'Plan Platinum', '💎', 30,
   '{"reel":12,"carrusel":8,"post_imagen":5,"historia":5}', 950,
   array['facebook','instagram','tiktok','linkedin']::platform[], true)
on conflict (agency_id, codigo) do nothing;

-- ─── Billing (preparado, §16) — la agencia opera sobre un plan SaaS ──────────
insert into subscription_plans (id, codigo, nombre, precio_mensual, limites) values
  ('11111111-0000-0000-0000-0000000000b1', 'growth', 'Growth', 99,
   '{"max_clients":25,"max_users":10,"storage_gb":100}'),
  ('11111111-0000-0000-0000-0000000000b2', 'agency', 'Agency', 249,
   '{"max_clients":100,"max_users":30,"storage_gb":500}')
on conflict (codigo) do nothing;

insert into subscriptions (id, agency_id, plan_id, estado, periodo_inicio, periodo_fin) values
  ('11111111-0000-0000-0000-0000000000b9', '11111111-0000-0000-0000-000000000001',
   '11111111-0000-0000-0000-0000000000b2', 'activa',
   now() - interval '3 months', now() + interval '1 month')
on conflict (id) do nothing;

-- ─── Feature flags (§16) ─────────────────────────────────────────────────────
insert into feature_flags (id, clave, descripcion, agency_id, activo) values
  ('11111111-0000-0000-0000-0000000000f1', 'ai_copy', 'Generación de copy con IA', '11111111-0000-0000-0000-000000000001', true),
  ('11111111-0000-0000-0000-0000000000f2', 'metrics_v2', 'Centro de métricas unificado', '11111111-0000-0000-0000-000000000001', true),
  ('11111111-0000-0000-0000-0000000000f3', 'whatsapp', 'Aprobaciones por WhatsApp', '11111111-0000-0000-0000-000000000001', false)
on conflict (clave, agency_id, plan_codigo) do nothing;

-- · seed_users
-- ═══════════════════════════════════════════════════════════════════════════
-- SEED · Usuarios del equipo de la agencia (roles variados — §2, §13)
-- ═══════════════════════════════════════════════════════════════════════════
-- Los usuarios del PORTAL CLIENTE se siembran en seed_clients.sql (dependen de
-- que los clientes existan primero, por la FK users.client_id → clients).
--
-- Nota Auth: en Supabase, la identidad real vive en auth.users. Estas filas de
-- public.users usan UUIDs fijos; al crear los usuarios en Auth (Sprint 1·B3) se
-- alinea su id con estos para que auth.uid() coincida. El seed es válido tal cual.

insert into users (id, agency_id, email, nombre, rol, client_id, activo) values
  ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001',
   'andrea@primerodigital.ec', 'Andrea Solís', 'agency_admin', null, true),
  ('22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001',
   'juan@primerodigital.ec', 'Juan Pérez', 'account_manager', null, true),
  ('22222222-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001',
   'maria@primerodigital.ec', 'María Loor', 'content_manager', null, true),
  ('22222222-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000001',
   'carlos@primerodigital.ec', 'Carlos Ramos', 'designer', null, true),
  ('22222222-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000001',
   'diego@primerodigital.ec', 'Diego Haro', 'media_buyer', null, true),
  -- Usuario colaborador desactivado (QA: activación/desactivación sin borrar)
  ('22222222-0000-0000-0000-000000000006', '11111111-0000-0000-0000-000000000001',
   'expracticante@primerodigital.ec', 'Ex Practicante', 'designer', null, false)
on conflict (id) do nothing;

-- · seed_clients
-- ═══════════════════════════════════════════════════════════════════════════
-- SEED · Clientes reales con estados variados (§3, §4, §13)
-- ═══════════════════════════════════════════════════════════════════════════
-- Clientes reales del proyecto (uso interno de desarrollo/QA). Cada uno en un
-- estado distinto para ejercitar toda la interfaz.

insert into clients
  (id, agency_id, nombre, empresa, industria, tipo_mercado, instagram_handle,
   color_corporativo, email, telefono, responsable_cliente, account_manager_id,
   objetivo_marketing, estado, semaforo, observaciones, notas_internas, created_at)
values
  -- 1 · Kinara — ACTIVO, flagship (campañas + publicaciones + métricas)
  ('33333333-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001',
   'Kinara', 'Kinara Restaurante Cía. Ltda.', 'Gastronomía', 'Restaurante', 'kinaraec',
   '#c2410c', 'chef@kinara.ec', '+593987654321', 'Chef Marco Andrade',
   '22222222-0000-0000-0000-000000000001', 'alcance', 'activo', 'verde',
   'Muy activo en redes. Priorizar reels de cocina.', 'Pago el 5 de cada mes. Requiere factura electrónica.',
   now() - interval '5 months'),

  -- 2 · Velora — ACTIVO, con contenido pendiente de revisión del cliente
  ('33333333-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001',
   'Velora', 'Velora Brand Ecuador', 'Belleza & Bienestar', 'Belleza', 'velorabrand',
   '#be185d', 'contacto@velora.ec', '+593987112233', 'Valeria Morán',
   '22222222-0000-0000-0000-000000000002', 'comunidad', 'activo', 'amarillo',
   'Revisa los contenidos con demora. Recordar seguimiento semanal.', null,
   now() - interval '4 months'),

  -- 3 · ATUK — ACTIVO, contrato PRÓXIMO A VENCER (alerta comercial)
  ('33333333-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001',
   'ATUK', 'ATUK Diseño Andino', 'Moda & Artesanía', 'Retail', 'atuk.ec',
   '#0f766e', 'hola@atuk.ec', '+593986445566', 'Samantha Cabrera',
   '22222222-0000-0000-0000-000000000002', 'conversion', 'activo', 'verde',
   'Marca de diseño andino. Estética cuidada, tono cálido.', 'Renovación a coordinar este mes.',
   now() - interval '11 months'),

  -- 4 · Lexaval — ACTIVO, publicaciones aprobadas, SIN pauta contratada
  ('33333333-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000001',
   'Lexaval', 'Lexaval Abogados & Consultores', 'Servicios profesionales', 'Servicios Profesionales', 'lexaval.ec',
   '#1e3a8a', 'contacto@lexaval.ec', '+593984778899', 'Dra. Carolina Vélez',
   '22222222-0000-0000-0000-000000000002', 'conversion', 'activo', 'verde',
   'Contenido formal. Evitar humor y tendencias virales.', 'Aprueban rápido pero exigen precisión legal.',
   now() - interval '3 months'),

  -- 5 · Pesatronic — PAUSADO, contrato VENCIDO, publicaciones rechazadas
  ('33333333-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000001',
   'Pesatronic', 'Pesatronic Ecuador S.A.', 'Industrial / B2B', 'B2B', 'pesatronic',
   '#334155', 'marketing@pesatronic.ec', '+593982990011', 'Ing. Roberto Salas',
   '22222222-0000-0000-0000-000000000001', 'conversion', 'pausado', 'rojo',
   'Contrato vencido — pendiente de renovación.', 'Interesados en ampliar a videos de planta si renuevan.',
   now() - interval '8 months')
on conflict (id) do nothing;

-- ─── Usuarios del Portal Cliente (dependen de clients — FK users.client_id) ──
insert into users (id, agency_id, email, nombre, rol, client_id, activo) values
  ('22222222-0000-0000-0000-0000000000c1', '11111111-0000-0000-0000-000000000001',
   'chef@kinara.ec', 'Chef Marco Andrade', 'client_premium', '33333333-0000-0000-0000-000000000001', true),
  ('22222222-0000-0000-0000-0000000000c2', '11111111-0000-0000-0000-000000000001',
   'contacto@velora.ec', 'Valeria Morán', 'client_standard', '33333333-0000-0000-0000-000000000002', true),
  ('22222222-0000-0000-0000-0000000000c3', '11111111-0000-0000-0000-000000000001',
   'hola@atuk.ec', 'Samantha Cabrera', 'client_standard', '33333333-0000-0000-0000-000000000003', true),
  -- Cliente con un segundo usuario (gerente + asistente — M2M, §escalabilidad)
  ('22222222-0000-0000-0000-0000000000c4', '11111111-0000-0000-0000-000000000001',
   'contacto@lexaval.ec', 'Dra. Carolina Vélez', 'client_premium', '33333333-0000-0000-0000-000000000004', true),
  ('22222222-0000-0000-0000-0000000000c5', '11111111-0000-0000-0000-000000000001',
   'asistente@lexaval.ec', 'Asistente de Marketing', 'client_standard', '33333333-0000-0000-0000-000000000004', true)
on conflict (id) do nothing;

-- Relación M2M usuario↔cliente (un cliente con varios usuarios)
insert into user_clients (user_id, client_id, rol) values
  ('22222222-0000-0000-0000-0000000000c1', '33333333-0000-0000-0000-000000000001', 'client_premium'),
  ('22222222-0000-0000-0000-0000000000c2', '33333333-0000-0000-0000-000000000002', 'client_standard'),
  ('22222222-0000-0000-0000-0000000000c3', '33333333-0000-0000-0000-000000000003', 'client_standard'),
  ('22222222-0000-0000-0000-0000000000c4', '33333333-0000-0000-0000-000000000004', 'client_premium'),
  ('22222222-0000-0000-0000-0000000000c5', '33333333-0000-0000-0000-000000000004', 'client_standard')
on conflict (user_id, client_id) do nothing;

-- Invitaciones: activadas (aceptadas) + una PENDIENTE para QA
insert into user_invitations (id, agency_id, client_id, email, rol, token, invited_by, accepted_at) values
  ('33333333-0000-0000-0000-0000000000e1', '11111111-0000-0000-0000-000000000001',
   '33333333-0000-0000-0000-000000000001', 'chef@kinara.ec', 'client_premium',
   gen_random_uuid(), '22222222-0000-0000-0000-000000000001', now() - interval '4 months'),
  -- Pendiente: Pesatronic aún no activa su portal
  ('33333333-0000-0000-0000-0000000000e5', '11111111-0000-0000-0000-000000000001',
   '33333333-0000-0000-0000-000000000005', 'marketing@pesatronic.ec', 'client_standard',
   gen_random_uuid(), '22222222-0000-0000-0000-000000000001', null)
on conflict (id) do nothing;

-- Eventos propios del cliente (calendario inteligente)
insert into smart_events (id, agency_id, client_id, fecha, nombre, tipo, recurrente_anual) values
  ('33333333-0000-0000-0000-0000000000a1', '11111111-0000-0000-0000-000000000001',
   '33333333-0000-0000-0000-000000000001', (current_date + 12)::date, 'Aniversario Kinara', 'cliente', true),
  ('33333333-0000-0000-0000-0000000000a3', '11111111-0000-0000-0000-000000000001',
   '33333333-0000-0000-0000-000000000003', (current_date + 25)::date, 'Lanzamiento colección ATUK', 'cliente', false)
on conflict (id) do nothing;

-- · seed_contracts
-- ═══════════════════════════════════════════════════════════════════════════
-- SEED · Contratos (planes y estados variados — §4, §10, §13)
-- ═══════════════════════════════════════════════════════════════════════════
-- Fechas relativas: uno vigente, uno próximo a vencer, uno vencido.

insert into contracts
  (id, client_id, plan_template_id, plan_codigo, fecha_inicio, fecha_fin,
   precio_lista, descuento, valor_final, piezas_mensuales, redes_contratadas,
   pauta, pauta_plataformas, presupuesto_pauta, es_vigente)
values
  -- Kinara · Platinum · vigente (con pauta compartida)
  ('44444444-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001',
   '11111111-0000-0000-0000-0000000000a3', 'platinum',
   (current_date - 150)::date, (current_date + 215)::date,
   950, 0, 950, 30, array['instagram','facebook','tiktok']::platform[],
   'presupuesto_compartido', array['Meta Ads','TikTok Ads'], 1200, true),

  -- Velora · Oro · vigente (sin pauta)
  ('44444444-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000002',
   '11111111-0000-0000-0000-0000000000a2', 'oro',
   (current_date - 120)::date, (current_date + 245)::date,
   600, 50, 550, 20, array['instagram','tiktok']::platform[],
   'no_incluye', null, null, true),

  -- ATUK · Oro · PRÓXIMO A VENCER (18 días) — alerta comercial
  ('44444444-0000-0000-0000-000000000003', '33333333-0000-0000-0000-000000000003',
   '11111111-0000-0000-0000-0000000000a2', 'oro',
   (current_date - 347)::date, (current_date + 18)::date,
   600, 0, 600, 20, array['instagram','facebook']::platform[],
   'incluida_agencia', array['Meta Ads'], 400, true),

  -- Lexaval · Plata · vigente · SIN pauta
  ('44444444-0000-0000-0000-000000000004', '33333333-0000-0000-0000-000000000004',
   '11111111-0000-0000-0000-0000000000a1', 'plata',
   (current_date - 90)::date, (current_date + 275)::date,
   400, 0, 400, 12, array['linkedin','instagram']::platform[],
   'no_incluye', null, null, true),

  -- Pesatronic · Plata · VENCIDO (hace 30 días) — no vigente
  ('44444444-0000-0000-0000-000000000005', '33333333-0000-0000-0000-000000000005',
   '11111111-0000-0000-0000-0000000000a1', 'plata',
   (current_date - 395)::date, (current_date - 30)::date,
   400, 0, 400, 12, array['linkedin','facebook']::platform[],
   'cliente_paga', array['Google Ads'], 300, false)
on conflict (id) do nothing;

-- Distribución de piezas por tipo (contract_items)
insert into contract_items (contract_id, tipo, cantidad) values
  -- Kinara (30)
  ('44444444-0000-0000-0000-000000000001', 'reel', 12),
  ('44444444-0000-0000-0000-000000000001', 'carrusel', 8),
  ('44444444-0000-0000-0000-000000000001', 'post_imagen', 5),
  ('44444444-0000-0000-0000-000000000001', 'historia', 5),
  -- Velora (20)
  ('44444444-0000-0000-0000-000000000002', 'reel', 7),
  ('44444444-0000-0000-0000-000000000002', 'carrusel', 5),
  ('44444444-0000-0000-0000-000000000002', 'post_imagen', 4),
  ('44444444-0000-0000-0000-000000000002', 'historia', 4),
  -- ATUK (20)
  ('44444444-0000-0000-0000-000000000003', 'reel', 7),
  ('44444444-0000-0000-0000-000000000003', 'carrusel', 5),
  ('44444444-0000-0000-0000-000000000003', 'post_imagen', 4),
  ('44444444-0000-0000-0000-000000000003', 'historia', 4),
  -- Lexaval (12)
  ('44444444-0000-0000-0000-000000000004', 'carrusel', 5),
  ('44444444-0000-0000-0000-000000000004', 'post_imagen', 4),
  ('44444444-0000-0000-0000-000000000004', 'reel', 3),
  -- Pesatronic (12)
  ('44444444-0000-0000-0000-000000000005', 'post_imagen', 5),
  ('44444444-0000-0000-0000-000000000005', 'carrusel', 4),
  ('44444444-0000-0000-0000-000000000005', 'reel', 3)
on conflict (contract_id, tipo) do nothing;

-- · seed_briefs
-- ═══════════════════════════════════════════════════════════════════════════
-- SEED · Briefs (distintos por cliente — §5, §10)
-- ═══════════════════════════════════════════════════════════════════════════
-- 4 briefs completos y diferentes. Pesatronic queda SIN brief a propósito
-- (QA: Campañas bloqueado hasta completar el Brief).

insert into briefs
  (client_id, objetivos_comerciales, servicios, productos, ticket_promedio,
   presupuesto_marketing, proceso_comercial, embudo_actual, propuesta_valor,
   diferenciadores, competencia, perfil_cliente, rango_edad, ubicacion,
   pain_points, motivaciones, pilares, tono, formatos_preferidos, que_no_hacer,
   hashtags_habituales, plataformas_activas, frecuencia_semanal,
   horarios_preferidos, objetivo_principal)
values
  -- Kinara
  ('33333333-0000-0000-0000-000000000001',
   'Aumentar reservas en 30% y posicionar el menú de temporada.',
   'Servicio a la mesa, eventos privados, menú de maridaje.',
   'Platos de autor, coctelería de frutas locales.',
   '$25 por persona', '$1200/mes en pauta',
   'Mensaje o reserva online → confirmación → visita → fidelización.',
   'Recomendación boca a boca + Instagram + Google Maps.',
   'La buena mesa se disfruta mejor acompañada.',
   'Cocina de autor con ingredientes andinos; ambiente cálido.',
   'Restaurantes de autor en Quito norte.',
   'Foodies 28-45, ingreso medio-alto, disfrutan salir a comer.',
   '28-45', 'Quito, Ecuador',
   'Encontrar dónde comer algo especial sin arriesgar.',
   'Vivir experiencias gastronómicas memorables.',
   array['Menú de temporada','Detrás de cámara','Reservas'],
   array['cálido','cercano','apetitoso'],
   array['reel','carrusel','historia']::content_type[],
   'No usar humor forzado ni tendencias que no encajen con la marca.',
   array['#KinaraEC','#GastronomiaQuito','#CocinaDeAutor'],
   array['instagram','facebook','tiktok']::platform[],
   6, 'Jue-Sáb 12:00-13:00 y 18:30-19:30', 'Aumentar reservas del fin de semana'),

  -- Velora
  ('33333333-0000-0000-0000-000000000002',
   'Construir comunidad y lanzar la nueva línea de skincare.',
   'Tratamientos faciales, asesoría de rutina, membresías.',
   'Sérum de vitamina C, línea de limpieza facial.',
   '$45 por sesión', '$0 (sin pauta este trimestre)',
   'DM → agenda → sesión → recompra de productos.',
   'Instagram + referidos de clientas.',
   'Sentirte bien empieza por cuidarte.',
   'Rutinas personalizadas con productos de origen natural.',
   'Spas y centros de estética de barrio.',
   'Mujeres 25-40 interesadas en autocuidado.',
   '25-40', 'Quito, Ecuador',
   'No saber qué productos realmente funcionan para su piel.',
   'Verse y sentirse mejor con constancia.',
   array['Tips de skincare','Antes y después','Comunidad'],
   array['inspirador','empático','fresco'],
   array['reel','carrusel','historia']::content_type[],
   'No prometer resultados médicos ni exagerar beneficios.',
   array['#VeloraBrand','#SkincareEc','#RutinaFacial'],
   array['instagram','tiktok']::platform[],
   5, 'Lun-Vie 20:00-21:00', 'Crecer comunidad e interacción'),

  -- ATUK
  ('33333333-0000-0000-0000-000000000003',
   'Vender la nueva colección andina y llegar a turismo consciente.',
   'Venta de piezas de diseño, encargos personalizados.',
   'Bolsos, textiles y accesorios de artesanía andina.',
   '$80 por pieza', '$400/mes en pauta',
   'Descubrimiento en redes → web → compra → recompra/regalo.',
   'Instagram + ferias + web.',
   'Tu estilo habla por ti, con raíces andinas.',
   'Diseño contemporáneo con técnicas artesanales ecuatorianas.',
   'Marcas de moda artesanal y souvenirs.',
   'Personas 25-50 que valoran lo hecho a mano y lo local.',
   '25-50', 'Quito y Cuenca, Ecuador',
   'Encontrar regalos con significado y calidad.',
   'Apoyar lo local y tener piezas únicas.',
   array['Proceso artesanal','Colección','Historias de artesanos'],
   array['auténtico','cálido','orgulloso'],
   array['reel','carrusel','post_imagen']::content_type[],
   'No usar estética genérica de fast fashion.',
   array['#ATUK','#DisenoAndino','#HechoEnEcuador'],
   array['instagram','facebook']::platform[],
   5, 'Mar-Jue 13:00 y Sáb 11:00', 'Impulsar ventas de la colección'),

  -- Lexaval
  ('33333333-0000-0000-0000-000000000004',
   'Generar consultas calificadas de empresas y posicionar autoridad legal.',
   'Asesoría corporativa, laboral y tributaria.',
   'Paquetes de asesoría mensual para empresas.',
   'Consulta desde $150', '$0 (sin pauta)',
   'Contacto → reunión → propuesta → contrato de asesoría.',
   'Referidos + LinkedIn.',
   'La tranquilidad viene de estar bien asesorado.',
   'Respuestas claras, sin jerga, para decisiones empresariales.',
   'Estudios jurídicos tradicionales.',
   'Gerentes y dueños de PYMES que necesitan respaldo legal.',
   '35-55', 'Quito, Ecuador',
   'Riesgo legal por decisiones sin asesoría.',
   'Operar con seguridad jurídica.',
   array['Tips legales','Casos frecuentes','Novedades normativas'],
   array['formal','claro','confiable'],
   array['carrusel','post_imagen']::content_type[],
   'Nada de humor ni tendencias virales; precisión legal siempre.',
   array['#Lexaval','#AsesoriaLegal','#DerechoEmpresarial'],
   array['linkedin','instagram']::platform[],
   3, 'Mar y Jue 09:00-10:00', 'Generar consultas calificadas')
on conflict (client_id) do nothing;

-- · seed_content
-- ═══════════════════════════════════════════════════════════════════════════
-- SEED · Contenido (fechas relativas, todos los estados — §4, §5, §9, §13)
-- ═══════════════════════════════════════════════════════════════════════════
-- Fechas SIEMPRE relativas a now(): el seed nunca queda obsoleto.
-- campaign_id se enlaza en seed_campaigns.sql (evita dependencia circular).
-- Cubre: publicado, aprobado, enviado a revisión, en producción, cambios
-- solicitados, y planificado-por-IA-incompleto (🟡 pendiente de completar).

insert into content_pieces
  (id, client_id, nombre, tipo, estado, origen, razon_estrategica,
   fecha_publicacion, plataforma, copy_activo, hashtags, angulo_andromeda,
   incluye_cta, seleccionado_pauta, iteraciones,
   account_manager_id, designer_id, created_at)
values
-- ─── KINARA (flagship) ───────────────────────────────────────────────────────
  ('55555555-0000-0000-0001-000000000001','33333333-0000-0000-0000-000000000001',
   'Reel · Cocina abierta con el Chef','reel','publicado','manual',
   'Reel el jueves: mayor rendimiento del formato en Instagram para gastronomía.',
   now() - interval '20 days','instagram',
   'Así nace cada plato en Kinara 👨‍🍳 El chef Marcos te muestra el proceso. Reservas → link en bio.',
   array['#KinaraEC','#CocinaDeAutor','#GastronomiaQuito'],'Descubrimiento',true,true,2,
   '22222222-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000004', now() - interval '28 days'),

  ('55555555-0000-0000-0001-000000000002','33333333-0000-0000-0000-000000000001',
   'Carrusel · 5 platos estrella de la temporada','carrusel','publicado','manual',null,
   now() - interval '12 days','facebook',
   'El menú llegó con todo 🍽️ Desliza y descubre cuál será el tuyo. Mesa disponible → link en bio.',
   array['#KinaraEC','#MenuDeTemporada'],'Deseo',true,true,1,
   '22222222-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000004', now() - interval '18 days'),

  ('55555555-0000-0000-0001-000000000003','33333333-0000-0000-0000-000000000001',
   'Reel · Proceso del chimichurri artesanal','reel','publicado','manual',null,
   now() - interval '6 days','instagram',
   'El secreto está en las hierbas 🌿 Mira cómo preparamos el chimichurri que acompaña nuestros platos.',
   array['#KinaraEC','#HechoEnCasa'],'Descubrimiento',false,false,1,
   '22222222-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000004', now() - interval '11 days'),

  ('55555555-0000-0000-0001-000000000004','33333333-0000-0000-0000-000000000001',
   'Post · Postre del mes: mousse de maracuyá','post_imagen','aprobado_final','manual',null,
   now() + interval '1 day','instagram',
   'Dulce final 🍮 Mousse de maracuyá, solo este mes. Reserva tu mesa → link en bio.',
   array['#KinaraEC','#PostreDelMes'],'Deseo',true,false,1,
   '22222222-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000004', now() - interval '5 days'),

  ('55555555-0000-0000-0001-000000000005','33333333-0000-0000-0000-000000000001',
   'Reel · Cóctel de bienvenida con frutas locales','reel','aprobado_cliente','manual',null,
   now() + interval '3 days','tiktok',
   'El comienzo perfecto 🍹 Nuestro cóctel de bienvenida con frutas locales de temporada.',
   array['#KinaraEC','#Cocteleria'],'Descubrimiento',false,false,1,
   '22222222-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000004', now() - interval '4 days'),

  ('55555555-0000-0000-0001-000000000006','33333333-0000-0000-0000-000000000001',
   'Carrusel · 3 razones para venir a Kinara','carrusel','enviado_cliente','manual',null,
   now() + interval '5 days','instagram',
   '3 razones por las que Kinara es el favorito de Quito 🍽️ Desliza y descúbrelas.',
   array['#KinaraEC','#QuitoFoodie'],'Consideración',true,false,1,
   '22222222-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000004', now() - interval '3 days'),

  ('55555555-0000-0000-0001-000000000007','33333333-0000-0000-0000-000000000001',
   'Historia · Sabores de temporada','historia','en_produccion','manual',null,
   now() + interval '8 days','instagram',null,
   array[]::text[],null,false,false,0,
   '22222222-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000004', now() - interval '1 days'),

  ('55555555-0000-0000-0001-000000000008','33333333-0000-0000-0000-000000000001',
   'Reel · Noche de maridaje (planificado IA)','reel','borrador','planificada',
   'Reel el viernes: mejor alcance de video corto en Instagram para gastronomía.',
   now() + interval '12 days','instagram',null,
   array[]::text[],null,false,false,0,
   '22222222-0000-0000-0000-000000000001',null, now() - interval '1 days'),

-- ─── VELORA (contenido pendiente de revisión) ───────────────────────────────
  ('55555555-0000-0000-0002-000000000001','33333333-0000-0000-0000-000000000002',
   'Reel · Rutina de noche en 3 pasos','reel','enviado_cliente','manual',null,
   now() + interval '4 days','instagram',
   'Tu piel también descansa 🌙 Rutina de noche en 3 pasos con Velora. ¿La haces? 👇',
   array['#VeloraBrand','#RutinaFacial'],'Educación',true,false,1,
   '22222222-0000-0000-0000-000000000002','22222222-0000-0000-0000-000000000004', now() - interval '2 days'),

  ('55555555-0000-0000-0002-000000000002','33333333-0000-0000-0000-000000000002',
   'Carrusel · Mitos del skincare','carrusel','enviado_cliente','manual',null,
   now() + interval '6 days','instagram',
   '¿Cuántos creías ciertos? 😮 Desmontamos 5 mitos del cuidado facial. Guarda este post 📌',
   array['#VeloraBrand','#SkincareEc'],'Educación',true,false,1,
   '22222222-0000-0000-0000-000000000002','22222222-0000-0000-0000-000000000004', now() - interval '2 days'),

  ('55555555-0000-0000-0002-000000000003','33333333-0000-0000-0000-000000000002',
   'Historia · Antes y después','historia','en_revision_cliente','manual',null,
   now() + interval '2 days','tiktok',
   '2 semanas de constancia ✨ Mira el cambio. Agenda tu sesión → link en bio.',
   array['#VeloraBrand'],'Prueba social',true,false,1,
   '22222222-0000-0000-0000-000000000002','22222222-0000-0000-0000-000000000004', now() - interval '3 days'),

  ('55555555-0000-0000-0002-000000000004','33333333-0000-0000-0000-000000000002',
   'Reel · Ingredientes que amamos','reel','publicado','manual',null,
   now() - interval '8 days','instagram',
   'Origen natural, resultados reales 🌱 Estos son los ingredientes estrella de Velora.',
   array['#VeloraBrand','#SkincareNatural'],'Descubrimiento',false,false,1,
   '22222222-0000-0000-0000-000000000002','22222222-0000-0000-0000-000000000004', now() - interval '13 days'),

-- ─── ATUK (contrato por vencer + planificado IA) ────────────────────────────
  ('55555555-0000-0000-0003-000000000001','33333333-0000-0000-0000-000000000003',
   'Carrusel · Nueva colección andina','carrusel','aprobado_cliente','manual',null,
   now() + interval '3 days','instagram',
   'Tejida a mano, pensada para ti 🧵 Conoce la nueva colección ATUK. Envíos a todo el país.',
   array['#ATUK','#DisenoAndino','#HechoEnEcuador'],'Deseo',true,false,1,
   '22222222-0000-0000-0000-000000000002','22222222-0000-0000-0000-000000000004', now() - interval '4 days'),

  ('55555555-0000-0000-0003-000000000002','33333333-0000-0000-0000-000000000003',
   'Reel · El proceso artesanal (planificado IA)','reel','borrador','planificada',
   'Reel el sábado: los recorridos de proceso rinden hacia el fin de semana.',
   now() + interval '10 days','instagram',null,
   array[]::text[],null,false,false,0,
   '22222222-0000-0000-0000-000000000002',null, now() - interval '1 days'),

  ('55555555-0000-0000-0003-000000000003','33333333-0000-0000-0000-000000000003',
   'Post · Regalo con significado','post_imagen','publicado','extraordinaria',null,
   now() - interval '5 days','facebook',
   'Un regalo que cuenta una historia 🎁 Piezas únicas hechas a mano. Encuéntralas en atuk.ec',
   array['#ATUK','#RegaloConSignificado'],'Emoción',true,false,1,
   '22222222-0000-0000-0000-000000000002','22222222-0000-0000-0000-000000000004', now() - interval '9 days'),

-- ─── LEXAVAL (publicaciones aprobadas, formal) ──────────────────────────────
  ('55555555-0000-0000-0004-000000000001','33333333-0000-0000-0000-000000000004',
   'Carrusel · 5 errores legales al contratar','carrusel','publicado','manual',null,
   now() - interval '10 days','linkedin',
   'Contratar sin asesoría puede costar caro ⚖️ Estos son 5 errores frecuentes que evitamos.',
   array['#Lexaval','#DerechoEmpresarial'],'Educación',true,false,1,
   '22222222-0000-0000-0000-000000000002',null, now() - interval '15 days'),

  ('55555555-0000-0000-0004-000000000002','33333333-0000-0000-0000-000000000004',
   'Post · Nueva normativa laboral','post_imagen','aprobado_final','manual',null,
   now() + interval '2 days','linkedin',
   'Lo que tu empresa debe saber sobre la nueva normativa laboral 📋 Te lo explicamos claro.',
   array['#Lexaval','#AsesoriaLegal'],'Autoridad',true,false,1,
   '22222222-0000-0000-0000-000000000002',null, now() - interval '4 days'),

  ('55555555-0000-0000-0004-000000000003','33333333-0000-0000-0000-000000000004',
   'Carrusel · Preguntas frecuentes de asesoría','carrusel','aprobado_cliente','manual',null,
   now() + interval '5 days','instagram',
   'Resolvemos las dudas más comunes de nuestras empresas cliente 💼 Desliza.',
   array['#Lexaval'],'Consideración',true,false,1,
   '22222222-0000-0000-0000-000000000002',null, now() - interval '6 days'),

-- ─── PESATRONIC (cambios solicitados + histórico) ───────────────────────────
  ('55555555-0000-0000-0005-000000000001','33333333-0000-0000-0000-000000000005',
   'Post · Línea de balanzas industriales','post_imagen','cambios_solicitados','manual',null,
   now() + interval '4 days','linkedin',
   'Precisión que tu operación necesita ⚙️ Conoce nuestra línea de balanzas industriales.',
   array['#Pesatronic','#Industrial'],'Autoridad',true,false,2,
   '22222222-0000-0000-0000-000000000001',null, now() - interval '7 days'),

  ('55555555-0000-0000-0005-000000000002','33333333-0000-0000-0000-000000000005',
   'Carrusel · Casos de éxito en planta','carrusel','publicado','manual',null,
   now() - interval '40 days','facebook',
   'Resultados que hablan por sí solos 📈 Así optimizamos la operación de nuestros clientes.',
   array['#Pesatronic','#B2B'],'Prueba social',true,false,1,
   '22222222-0000-0000-0000-000000000001',null, now() - interval '45 days')
on conflict (id) do nothing;

-- ─── Comentarios (internos y de cliente) ────────────────────────────────────
insert into comments (id, content_piece_id, autor_id, autor_nombre, texto, interno, created_at) values
  ('55555555-1111-0000-0000-000000000001','55555555-0000-0000-0001-000000000001',
   '22222222-0000-0000-0000-000000000003','María Loor','Hook menor a 3s, el cliente es exigente con eso.',true, now() - interval '25 days'),
  ('55555555-1111-0000-0000-000000000002','55555555-0000-0000-0001-000000000001',
   '22222222-0000-0000-0000-0000000000c1','Chef Marco Andrade','¡Aprobado! El reel se ve increíble 🔥',false, now() - interval '23 days'),
  ('55555555-1111-0000-0000-000000000003','55555555-0000-0000-0001-000000000006',
   '22222222-0000-0000-0000-0000000000c1','Chef Marco Andrade','¿Podemos cambiar la portada por la del plato principal?',false, now() - interval '1 days'),
  ('55555555-1111-0000-0000-000000000004','55555555-0000-0000-0005-000000000001',
   '22222222-0000-0000-0000-0000000000c5','Asistente de Marketing','El copy debe mencionar la certificación ISO. Ajustar por favor.',false, now() - interval '3 days')
on conflict (id) do nothing;

-- ─── Historial de aprobación (approval_events, append-only) ──────────────────
insert into approval_events (id, content_piece_id, estado_anterior, estado_nuevo, actor_id, actor_nombre, comentario, created_at) values
  -- Kinara k1: ciclo completo hasta publicado
  ('55555555-2222-0000-0000-000000000001','55555555-0000-0000-0001-000000000001','revision_interna','enviado_cliente','22222222-0000-0000-0000-000000000003','María Loor',null, now() - interval '24 days'),
  ('55555555-2222-0000-0000-000000000002','55555555-0000-0000-0001-000000000001','enviado_cliente','aprobado_cliente','22222222-0000-0000-0000-0000000000c1','Chef Marco Andrade',null, now() - interval '23 days'),
  ('55555555-2222-0000-0000-000000000003','55555555-0000-0000-0001-000000000001','aprobado_final','publicado','22222222-0000-0000-0000-000000000002','Juan Pérez',null, now() - interval '20 days'),
  -- Kinara k6: enviado a revisión (pendiente)
  ('55555555-2222-0000-0000-000000000004','55555555-0000-0000-0001-000000000006','revision_interna','enviado_cliente','22222222-0000-0000-0000-000000000003','María Loor',null, now() - interval '2 days'),
  -- Pesatronic p1: cliente solicitó cambios
  ('55555555-2222-0000-0000-000000000005','55555555-0000-0000-0005-000000000001','enviado_cliente','cambios_solicitados','22222222-0000-0000-0000-0000000000c5','Asistente de Marketing','El copy debe mencionar la certificación ISO.', now() - interval '3 days')
on conflict (id) do nothing;

-- · seed_campaigns
-- ═══════════════════════════════════════════════════════════════════════════
-- SEED · Campañas + estructura de ads (preparada para APIs — §5, §11)
-- ═══════════════════════════════════════════════════════════════════════════
-- Corre DESPUÉS de content: enlaza content_pieces.campaign_id y siembra la
-- cadena ad_accounts→ad_campaigns→ad_sets→ads con IDs externos de placeholder
-- (los reemplazará el conector real de Meta sin cambiar la estructura).

-- ─── Campañas ────────────────────────────────────────────────────────────────
insert into campaigns
  (id, client_id, nombre, nomenclatura, objetivo, estado, fecha_inicio, fecha_fin,
   presupuesto_total, estrategia, created_at)
values
  ('66666666-0000-0000-0000-000000000001','33333333-0000-0000-0000-000000000001',
   'Kinara · Temporada Alcance','KINARA_META_ALCANCE_'||to_char(now(),'MonYY'),
   'alcance','activa',(current_date - 15)::date,(current_date + 15)::date, 1200,
   '{"score":83,"embudo":{"reconocimiento":50,"consideracion":25,"conversion":15,"remarketing":10},"plataformas":["Meta Ads","TikTok Ads"]}',
   now() - interval '18 days'),

  ('66666666-0000-0000-0000-000000000002','33333333-0000-0000-0000-000000000003',
   'ATUK · Lanzamiento Colección','ATUK_META_CONVERSION_'||to_char(now(),'MonYY'),
   'conversion','planificada',(current_date + 5)::date,(current_date + 35)::date, 400,
   '{"score":67,"embudo":{"reconocimiento":20,"consideracion":25,"conversion":40,"remarketing":15},"plataformas":["Meta Ads"]}',
   now() - interval '2 days')
on conflict (id) do nothing;

-- Enlace contenido↔campaña (piezas seleccionadas para pauta)
update content_pieces set campaign_id = '66666666-0000-0000-0000-000000000001'
  where id in ('55555555-0000-0000-0001-000000000001','55555555-0000-0000-0001-000000000002');

-- ─── Cuenta publicitaria (Meta) — IDs externos de placeholder ───────────────
insert into ad_accounts (id, client_id, provider, external_account_id, estado, connected_at) values
  ('66666666-1111-0000-0000-000000000001','33333333-0000-0000-0000-000000000001',
   'meta','seed-act-kinara-pending','conectado', now() - interval '20 days')
on conflict (provider, external_account_id) do nothing;

-- ─── Campaña de ads (mapea la campaña FPlus a la de Meta) ───────────────────
insert into ad_campaigns
  (id, campaign_id, ad_account_id, provider, external_campaign_id, nombre, objetivo, etapa_embudo, presupuesto, estado)
values
  ('66666666-2222-0000-0000-000000000001','66666666-0000-0000-0000-000000000001',
   '66666666-1111-0000-0000-000000000001','meta','seed-camp-kinara-001',
   'Kinara · Reconocimiento','Alcance','reconocimiento', 700,'activa')
on conflict (provider, external_campaign_id) do nothing;

-- ─── Conjunto de anuncios (audiencia) ───────────────────────────────────────
insert into ad_sets (id, ad_campaign_id, provider, external_adset_id, nombre, audiencia) values
  ('66666666-3333-0000-0000-000000000001','66666666-2222-0000-0000-000000000001',
   'meta','seed-adset-001','Foodies Quito 25-45',
   '{"ciudad":"Quito","radio_km":8,"edad":[25,45],"intereses":["gastronomia","restaurantes"]}')
on conflict (provider, external_adset_id) do nothing;

-- ─── Anuncio (EL VÍNCULO: content_piece_id + snapshots congelados) ──────────
insert into ads
  (id, ad_set_id, provider, external_ad_id, content_piece_id, copy_snapshot, hashtags_snapshot, angulo_snapshot)
values
  ('66666666-4444-0000-0000-000000000001','66666666-3333-0000-0000-000000000001',
   'meta','seed-ad-001','55555555-0000-0000-0001-000000000001',
   'Así nace cada plato en Kinara 👨‍🍳 El chef Marcos te muestra el proceso.',
   array['#KinaraEC','#CocinaDeAutor','#GastronomiaQuito'],'Descubrimiento')
on conflict (provider, external_ad_id) do nothing;

-- · seed_metrics
-- ═══════════════════════════════════════════════════════════════════════════
-- SEED · Publicaciones + métricas simuladas coherentes (§9, §10)
-- ═══════════════════════════════════════════════════════════════════════════
-- Números realistas y coherentes. metric_snapshots es append-only: se siembran
-- varias mediciones del anuncio para simular una serie temporal.

-- ─── Publicaciones orgánicas (de las piezas publicadas) ─────────────────────
insert into publications
  (id, content_piece_id, client_id, plataforma, fecha_programada, fecha_publicada, url, estado, utm_params, created_at)
values
  ('77777777-0000-0000-0001-000000000001','55555555-0000-0000-0001-000000000001','33333333-0000-0000-0000-000000000001','instagram', now() - interval '20 days', now() - interval '20 days','https://instagram.com/p/seed-kinara-1','publicado','{"utm_source":"instagram","utm_medium":"organic"}', now() - interval '20 days'),
  ('77777777-0000-0000-0001-000000000002','55555555-0000-0000-0001-000000000002','33333333-0000-0000-0000-000000000001','facebook',  now() - interval '12 days', now() - interval '12 days','https://facebook.com/seed-kinara-2','publicado','{"utm_source":"facebook","utm_medium":"organic"}', now() - interval '12 days'),
  ('77777777-0000-0000-0001-000000000003','55555555-0000-0000-0001-000000000003','33333333-0000-0000-0000-000000000001','instagram', now() - interval '6 days',  now() - interval '6 days','https://instagram.com/p/seed-kinara-3','publicado','{"utm_source":"instagram","utm_medium":"organic"}', now() - interval '6 days'),
  ('77777777-0000-0000-0002-000000000004','55555555-0000-0000-0002-000000000004','33333333-0000-0000-0000-000000000002','instagram', now() - interval '8 days',  now() - interval '8 days','https://instagram.com/p/seed-velora-1','publicado','{"utm_source":"instagram","utm_medium":"organic"}', now() - interval '8 days'),
  ('77777777-0000-0000-0003-000000000003','55555555-0000-0000-0003-000000000003','33333333-0000-0000-0000-000000000003','facebook',  now() - interval '5 days',  now() - interval '5 days','https://facebook.com/seed-atuk-1','publicado','{"utm_source":"facebook","utm_medium":"organic"}', now() - interval '5 days'),
  ('77777777-0000-0000-0004-000000000001','55555555-0000-0000-0004-000000000001','33333333-0000-0000-0000-000000000004','linkedin',  now() - interval '10 days', now() - interval '10 days','https://linkedin.com/feed/seed-lexaval-1','publicado','{"utm_source":"linkedin","utm_medium":"organic"}', now() - interval '10 days')
on conflict (id) do nothing;

-- ─── Métricas orgánicas (una medición lifetime por publicación) ─────────────
insert into metric_snapshots
  (id, publication_id, provider, snapshot_at, granularidad,
   impressions, reach, clicks, engagements, likes, comments, shares, saves, video_views, followers_delta)
values
  ('88888888-0000-0000-0001-000000000001','77777777-0000-0000-0001-000000000001',null, now() - interval '1 day','lifetime',
   26400, 21800, 810, 1390, 1240, 46, 92, 63, 8900, 58),
  ('88888888-0000-0000-0001-000000000002','77777777-0000-0000-0001-000000000002',null, now() - interval '1 day','lifetime',
   14200, 12100, 430, 720, 640, 22, 51, 41, 0, 24),
  ('88888888-0000-0000-0001-000000000003','77777777-0000-0000-0001-000000000003',null, now() - interval '1 day','lifetime',
   19800, 16700, 560, 980, 870, 31, 62, 55, 7200, 39),
  ('88888888-0000-0000-0002-000000000004','77777777-0000-0000-0002-000000000004',null, now() - interval '1 day','lifetime',
   11300, 9600, 380, 640, 560, 28, 33, 48, 5100, 31),
  ('88888888-0000-0000-0003-000000000003','77777777-0000-0000-0003-000000000003',null, now() - interval '1 day','lifetime',
   8700, 7400, 290, 410, 360, 14, 21, 26, 0, 18),
  ('88888888-0000-0000-0004-000000000001','77777777-0000-0000-0004-000000000001',null, now() - interval '1 day','lifetime',
   6200, 5300, 240, 300, 210, 19, 44, 22, 0, 27)
on conflict (id) do nothing;

-- ─── Métricas de pauta (anuncio Meta) — serie temporal de 3 mediciones ──────
insert into metric_snapshots
  (id, ad_id, provider, snapshot_at, granularidad,
   impressions, reach, clicks, engagements, leads, conversions, messages, spend, revenue)
values
  ('88888888-9999-0000-0000-000000000001','66666666-4444-0000-0000-000000000001','meta', now() - interval '3 days','daily',
   18500, 14200, 420, 690, 6, 4, 11, 55.00, 260.00),
  ('88888888-9999-0000-0000-000000000002','66666666-4444-0000-0000-000000000001','meta', now() - interval '2 days','daily',
   21300, 16800, 510, 810, 8, 5, 14, 62.00, 320.00),
  ('88888888-9999-0000-0000-000000000003','66666666-4444-0000-0000-000000000001','meta', now() - interval '1 day','daily',
   20100, 15900, 470, 760, 7, 5, 13, 58.00, 300.00)
on conflict (id) do nothing;

-- · seed_media
-- ═══════════════════════════════════════════════════════════════════════════
-- SEED · Metadata de archivos multimedia (§11)
-- ═══════════════════════════════════════════════════════════════════════════
-- La BD guarda SOLO referencias (object key + metadata), nunca binarios.
-- storage_path sigue la convención media/{agency}/{client}/{piece}/{version}.
-- Los binarios reales se suben en Storage (Sprint 1·B4); estas rutas de
-- placeholder representan archivos ya cargados en escenarios de demo.

insert into content_files
  (id, content_piece_id, nombre, tipo, storage_path, thumbnail_path, tamanio_bytes, version, es_version_activa, subido_por, created_at)
values
  ('99999999-0000-0000-0001-000000000001','55555555-0000-0000-0001-000000000001','reel-cocina-abierta.mp4','video',
   'media/11111111/33333333-0000-0000-0000-000000000001/55555555-0000-0000-0001-000000000001/1/reel.mp4',
   'media/11111111/33333333-0000-0000-0000-000000000001/55555555-0000-0000-0001-000000000001/1/thumb.jpg',
   18400000, 1, true, '22222222-0000-0000-0000-000000000004', now() - interval '25 days'),
  ('99999999-0000-0000-0001-000000000002','55555555-0000-0000-0001-000000000002','carrusel-platos.jpg','imagen',
   'media/11111111/33333333-0000-0000-0000-000000000001/55555555-0000-0000-0001-000000000002/1/img.jpg',
   'media/11111111/33333333-0000-0000-0000-000000000001/55555555-0000-0000-0001-000000000002/1/thumb.jpg',
   2100000, 1, true, '22222222-0000-0000-0000-000000000004', now() - interval '17 days'),
  ('99999999-0000-0000-0001-000000000004','55555555-0000-0000-0001-000000000004','postre-mousse.jpg','imagen',
   'media/11111111/33333333-0000-0000-0000-000000000001/55555555-0000-0000-0001-000000000004/1/img.jpg',
   'media/11111111/33333333-0000-0000-0000-000000000001/55555555-0000-0000-0001-000000000004/1/thumb.jpg',
   1850000, 1, true, '22222222-0000-0000-0000-000000000004', now() - interval '5 days'),
  ('99999999-0000-0000-0001-000000000006','55555555-0000-0000-0001-000000000006','carrusel-3razones.jpg','imagen',
   'media/11111111/33333333-0000-0000-0000-000000000001/55555555-0000-0000-0001-000000000006/1/img.jpg',
   'media/11111111/33333333-0000-0000-0000-000000000001/55555555-0000-0000-0001-000000000006/1/thumb.jpg',
   1990000, 1, true, '22222222-0000-0000-0000-000000000004', now() - interval '3 days'),
  ('99999999-0000-0000-0002-000000000001','55555555-0000-0000-0002-000000000001','reel-rutina-noche.mp4','video',
   'media/11111111/33333333-0000-0000-0000-000000000002/55555555-0000-0000-0002-000000000001/1/reel.mp4',
   'media/11111111/33333333-0000-0000-0000-000000000002/55555555-0000-0000-0002-000000000001/1/thumb.jpg',
   15200000, 1, true, '22222222-0000-0000-0000-000000000004', now() - interval '2 days'),
  ('99999999-0000-0000-0003-000000000001','55555555-0000-0000-0003-000000000001','carrusel-coleccion.jpg','imagen',
   'media/11111111/33333333-0000-0000-0000-000000000003/55555555-0000-0000-0003-000000000001/1/img.jpg',
   'media/11111111/33333333-0000-0000-0000-000000000003/55555555-0000-0000-0003-000000000001/1/thumb.jpg',
   2300000, 1, true, '22222222-0000-0000-0000-000000000004', now() - interval '4 days'),
  ('99999999-0000-0000-0004-000000000001','55555555-0000-0000-0004-000000000001','carrusel-errores-legales.jpg','imagen',
   'media/11111111/33333333-0000-0000-0000-000000000004/55555555-0000-0000-0004-000000000001/1/img.jpg',
   'media/11111111/33333333-0000-0000-0000-000000000004/55555555-0000-0000-0004-000000000001/1/thumb.jpg',
   1720000, 1, true, '22222222-0000-0000-0000-000000000004', now() - interval '15 days')
on conflict (id) do nothing;

-- · seed_notifications
-- ═══════════════════════════════════════════════════════════════════════════
-- SEED · Notificaciones (pendientes y leídas — §13)
-- ═══════════════════════════════════════════════════════════════════════════
-- Sistema unificado (in-app por ahora). Mezcla de leídas y no leídas para QA.

insert into notifications
  (id, agency_id, user_id, canal, tipo, titulo, cuerpo, entidad, entidad_id, leida, enviada_at, created_at)
values
  -- Para la agencia: cambios solicitados por un cliente (no leída → badge)
  ('aaaaaaaa-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000001',
   '22222222-0000-0000-0000-000000000001','in_app','cambios_solicitados',
   'Pesatronic solicitó cambios','El cliente pidió mencionar la certificación ISO en el post.',
   'content_pieces','55555555-0000-0000-0005-000000000001', false, now() - interval '3 days', now() - interval '3 days'),

  -- Para la agencia: pieza aprobada por el cliente (leída)
  ('aaaaaaaa-0000-0000-0000-000000000002','11111111-0000-0000-0000-000000000001',
   '22222222-0000-0000-0000-000000000002','in_app','aprobacion',
   'ATUK aprobó una pieza','Carrusel · Nueva colección andina fue aprobado.',
   'content_pieces','55555555-0000-0000-0003-000000000001', true, now() - interval '2 days', now() - interval '2 days'),

  -- Para el cliente Kinara: contenido por revisar (no leída)
  ('aaaaaaaa-0000-0000-0000-000000000003','11111111-0000-0000-0000-000000000001',
   '22222222-0000-0000-0000-0000000000c1','in_app','revision',
   'Tienes contenido por revisar','Carrusel · 3 razones para venir a Kinara espera tu aprobación.',
   'content_pieces','55555555-0000-0000-0001-000000000006', false, now() - interval '2 days', now() - interval '2 days'),

  -- Para la agencia: alerta de contrato por vencer (no leída)
  ('aaaaaaaa-0000-0000-0000-000000000004','11111111-0000-0000-0000-000000000001',
   '22222222-0000-0000-0000-000000000002','in_app','contrato_por_vencer',
   'Contrato de ATUK por vencer','El contrato de ATUK vence en menos de 20 días. Coordinar renovación.',
   'clients','33333333-0000-0000-0000-000000000003', false, now() - interval '1 day', now() - interval '1 day'),

  -- Para la agencia: contrato vencido (no leída)
  ('aaaaaaaa-0000-0000-0000-000000000005','11111111-0000-0000-0000-000000000001',
   '22222222-0000-0000-0000-000000000001','in_app','contrato_vencido',
   'Contrato de Pesatronic vencido','El contrato venció hace 30 días. Cliente pausado.',
   'clients','33333333-0000-0000-0000-000000000005', false, now() - interval '30 days', now() - interval '30 days')
on conflict (id) do nothing;
