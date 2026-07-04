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

create extension if not exists "uuid-ossp";

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
  id          uuid primary key default uuid_generate_v4(),
  nombre      text not null,            -- 'Primero Digital'
  created_at  timestamptz not null default now()
);

create table users (
  id          uuid primary key default uuid_generate_v4(),
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
  id                  uuid primary key default uuid_generate_v4(),
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
  id           uuid primary key default uuid_generate_v4(),
  agency_id    uuid not null references agencies(id),
  client_id    uuid references clients(id),   -- NULL = invitación a colaborador
  email        text not null,
  rol          user_role not null,
  token        uuid not null default uuid_generate_v4() unique,
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
  id                uuid primary key default uuid_generate_v4(),
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
  id                  uuid primary key default uuid_generate_v4(),
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
  id           uuid primary key default uuid_generate_v4(),
  contract_id  uuid not null references contracts(id) on delete cascade,
  tipo         content_type not null,
  cantidad     int not null check (cantidad > 0),
  unique (contract_id, tipo)
);

-- ─── BRIEF (el corazón estratégico) ─────────────────────────────────────────

create table briefs (
  id                    uuid primary key default uuid_generate_v4(),
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
  id                    uuid primary key default uuid_generate_v4(),
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
  id                  uuid primary key default uuid_generate_v4(),
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
  id                uuid primary key default uuid_generate_v4(),
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
  id                uuid primary key default uuid_generate_v4(),
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
  id                uuid primary key default uuid_generate_v4(),
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
  id                 uuid primary key default uuid_generate_v4(),
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
  id                   uuid primary key default uuid_generate_v4(),
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
  id                    uuid primary key default uuid_generate_v4(),
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
  id                  uuid primary key default uuid_generate_v4(),
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
  id                 uuid primary key default uuid_generate_v4(),
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
  id                uuid primary key default uuid_generate_v4(),
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
  id              uuid primary key default uuid_generate_v4(),
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
