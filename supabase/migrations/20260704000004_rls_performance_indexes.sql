-- ─── Migración 0004 · rls_performance_indexes ──────────────────────────────
-- Por qué:   las policies RLS corren en CADA query; sus JOINs por FK sin índice
--            provocan sequential scans → lentitud a escala (miles de agencias).
-- Resuelve:  indexa las columnas de FK usadas por los JOINs de las policies
--            (detectado por el validador: check RLS/ÍNDICE). No cambia el modelo.
-- Tablas:    índices en contracts, campaigns, publications, content_files,
--            comments, payments, ad_accounts.
-- Riesgos:   ninguno (solo añade índices). Reversible: DROP INDEX.
-- ════════════════════════════════════════════════════════════════════════════

-- Postgres NO crea índices automáticos en columnas FK (solo en PK/UNIQUE).
-- Estas columnas se usan en los JOINs de las policies RLS → deben indexarse.

create index if not exists idx_contracts_client      on contracts (client_id);
create index if not exists idx_campaigns_client       on campaigns (client_id);
create index if not exists idx_publications_client    on publications (client_id);
create index if not exists idx_content_files_piece    on content_files (content_piece_id);
create index if not exists idx_comments_piece         on comments (content_piece_id);
create index if not exists idx_payments_invoice       on payments (invoice_id);
create index if not exists idx_ad_accounts_client     on ad_accounts (client_id);
