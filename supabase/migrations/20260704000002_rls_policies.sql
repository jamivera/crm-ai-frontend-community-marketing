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
