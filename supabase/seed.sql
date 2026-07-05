-- ═══════════════════════════════════════════════════════════════════════════
-- FPLUS — SEED (orquestador)
-- ═══════════════════════════════════════════════════════════════════════════
-- Entorno oficial de desarrollo, QA y demos. Ejecuta los módulos en el orden
-- correcto de dependencias (FK-safe). Es IDEMPOTENTE: se puede volver a correr
-- sin romper la base (UUIDs fijos + on conflict do nothing).
--
-- Uso (Sprint 1·B5):  supabase db reset   (aplica migraciones + este seed)
--             o:      psql "$DATABASE_URL" -f supabase/seed.sql
--
-- Todas las fechas son RELATIVAS a now(): el seed nunca queda obsoleto — siempre
-- hay publicaciones programadas, en revisión, publicadas y pendientes.
--
-- Orden (= flujo de datos de FPlus): Agencia → Usuarios → Clientes → Contratos
--   → Briefs → Contenido → Campañas → Métricas → Media → Notificaciones.
-- ═══════════════════════════════════════════════════════════════════════════

\ir seed/seed_agencies.sql
\ir seed/seed_users.sql
\ir seed/seed_clients.sql
\ir seed/seed_contracts.sql
\ir seed/seed_briefs.sql
\ir seed/seed_content.sql
\ir seed/seed_campaigns.sql
\ir seed/seed_metrics.sql
\ir seed/seed_media.sql
\ir seed/seed_notifications.sql

-- Resumen de lo sembrado
do $$
begin
  raise notice 'FPLUS seed OK · agencias:% clientes:% usuarios:% piezas:% campañas:% métricas:%',
    (select count(*) from agencies),
    (select count(*) from clients),
    (select count(*) from users),
    (select count(*) from content_pieces),
    (select count(*) from campaigns),
    (select count(*) from metric_snapshots);
end $$;
