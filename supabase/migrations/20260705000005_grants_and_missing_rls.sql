-- ─── Migración 0005 · grants_and_missing_rls ───────────────────────────────
-- Por qué:   prueba empírica del DAL → 42501 permission denied en TODAS las
--            tablas. RLS es 2ª capa SOBRE los privilegios; sin GRANT, ninguna
--            query pasa. Problema demostrado, no hipótesis.
-- Resuelve:  GRANT mínimos para el DAL + RLS de las 4 tablas sin protección.
-- Riesgos:   un GRANT de más expone datos → se compensa con RLS; webhook_logs
--            sin GRANT (solo service_role). No toca el modelo de datos.
-- Reversible: REVOKE de los GRANT + disable RLS / drop policy de las 4 tablas.
-- Tablas:    GRANT explícito por tabla a authenticated (soft-delete → sin
--            DELETE, webhook_logs omitida); SELECT a anon en subscription_plans;
--            RLS nuevo en agencies, user_clients, user_invitations, webhook_logs.
-- ════════════════════════════════════════════════════════════════════════════

-- ─── 1 · RLS en las 4 tablas sin protección (ANTES de otorgar GRANT) ─────────
-- Se activa RLS primero para que, en el instante en que exista el GRANT, el
-- aislamiento ya esté vigente (nunca hay una ventana de exposición).

-- agencies: no tiene agency_id (ES la agencia) → cada usuario ve solo la suya.
alter table agencies enable row level security;
create policy agency_self on agencies
  using (id = auth_agency_id());

-- user_clients: tenant vía client_id → clients.agency_id (JOIN).
-- client_id es la 2ª columna del PK (user_id, client_id) → sin índice propio.
-- La policy hace JOIN por client_id en cada query → se indexa (como en 0004).
alter table user_clients enable row level security;
create index if not exists idx_user_clients_client on user_clients (client_id);
create policy agency_access on user_clients
  using (exists (
    select 1 from clients c
    where c.id = user_clients.client_id and c.agency_id = auth_agency_id()
  ));

-- user_invitations: agency_id DIRECTO (contiene emails y tokens de un solo uso).
alter table user_invitations enable row level security;
create policy agency_access on user_invitations
  using (agency_id = auth_agency_id());

-- webhook_logs: tabla de sistema (webhooks de proveedores). Sin tenant y sin
-- GRANT a roles de API → RLS deny-all (habilitada, sin policy) como defensa en
-- profundidad. Solo service_role (que ignora RLS) la usa desde Edge Functions.
alter table webhook_logs enable row level security;

-- ─── 2 · GRANTs de privilegios (la capa que faltaba → causa del 42501) ───────

-- Prerrequisito: acceso al esquema.
grant usage on schema public to authenticated, anon;

-- authenticated (rol real de la app tras login): CRUD sin DELETE (soft-delete).
-- RLS filtra las filas; el GRANT solo habilita la capa de privilegios.
-- GRANT EXPLÍCITO por bloque (sin ON ALL TABLES): la lista deja a la vista
-- exactamente qué queda expuesto. webhook_logs se OMITE a propósito (tabla de
-- sistema, solo service_role). Las tablas futuras se decidirán conscientemente
-- cuando existan — aquí no se preparan permisos por anticipado.

-- Acceso y usuarios (agencia, cuentas, vínculos usuario↔cliente, invitaciones)
grant select, insert, update on agencies, users, user_clients, user_invitations to authenticated;

-- Clientes (entidad raíz; todo lo demás se filtra por cliente)
grant select, insert, update on clients to authenticated;

-- Planes y contratos (plantillas de plan, contratos y sus ítems)
grant select, insert, update on plan_templates, contracts, contract_items to authenticated;

-- Brief y eventos inteligentes (planificación de contenido)
grant select, insert, update on briefs, smart_events to authenticated;

-- Cronopost (piezas de contenido, archivos, comentarios, aprobaciones)
grant select, insert, update on content_pieces, content_files, comments, approval_events to authenticated;

-- Campañas y pauta (centro de estrategia + cuentas/campañas/sets/ads/publicaciones)
grant select, insert, update on campaigns, ad_accounts, ad_campaigns, ad_sets, ads, publications to authenticated;

-- Métricas (snapshots de rendimiento)
grant select, insert, update on metric_snapshots to authenticated;

-- Facturación y suscripciones (planes, suscripciones, facturas, pagos)
grant select, insert, update on subscription_plans, subscriptions, invoices, payments to authenticated;

-- Integraciones e IA (conectores y generaciones de Andrómeda)
grant select, insert, update on integrations, ai_generations to authenticated;

-- Sistema (feature flags, jobs, auditoría, notificaciones)
grant select, insert, update on feature_flags, jobs, audit_log, notifications to authenticated;

-- anon (Publishable Key, sin sesión): solo el dato público de referencia.
grant select on subscription_plans to anon;
