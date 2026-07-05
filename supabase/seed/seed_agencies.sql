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
