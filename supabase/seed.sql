-- ═══════════════════════════════════════════════════════════════════════════
-- FPLUS — Seed base: Primero Digital (primer tenant) + planes
-- ═══════════════════════════════════════════════════════════════════════════
-- Datos semilla mínimos para DEV/STAGING. La migración completa de los mocks
-- (clientes, piezas, briefs) se hace con un script dedicado en Sprint 1 · B5.
-- ═══════════════════════════════════════════════════════════════════════════

-- Agencia fundadora
insert into agencies (id, nombre) values
  ('00000000-0000-0000-0000-000000000001', 'Primero Digital')
on conflict (id) do nothing;

-- Plantillas de planes (viven en BD, no quemadas en código — ADR/§16)
insert into plan_templates
  (agency_id, codigo, label, emoji, piezas_mensuales, distribucion, precio_lista, redes_permitidas, incluye_comodin)
values
  ('00000000-0000-0000-0000-000000000001', 'plata', 'Plan Plata', '🥈', 12,
   '{"reel":4,"carrusel":3,"post_imagen":3,"historia":2}', 400,
   array['facebook','instagram']::platform[], false),
  ('00000000-0000-0000-0000-000000000001', 'oro', 'Plan Oro', '🥇', 20,
   '{"reel":7,"carrusel":5,"post_imagen":4,"historia":4}', 600,
   array['facebook','instagram','tiktok']::platform[], true),
  ('00000000-0000-0000-0000-000000000001', 'platinum', 'Plan Platinum', '💎', 30,
   '{"reel":12,"carrusel":8,"post_imagen":5,"historia":5}', 950,
   array['facebook','instagram','tiktok','linkedin']::platform[], true)
on conflict (agency_id, codigo) do nothing;

-- Cliente de ejemplo (Kinara) para validar el flujo end-to-end.
-- El plan NO vive en clients: es el histórico normalizado en contracts.
insert into clients
  (id, agency_id, nombre, empresa, industria, tipo_mercado, email, estado, semaforo, objetivo_marketing)
values
  ('00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-000000000001',
   'Kinara', 'Kinara Restaurante Cía. Ltda.', 'Gastronomía', 'Restaurante',
   'chef@kinara.ec', 'activo', 'verde', 'alcance')
on conflict (id) do nothing;

-- Contrato vigente de Kinara (plan Platinum) — el plan y la distribución
-- viven aquí, no en clients.
insert into contracts
  (id, client_id, plan_codigo, fecha_inicio, fecha_fin, precio_lista, descuento,
   valor_final, piezas_mensuales, redes_contratadas, pauta, es_vigente)
values
  ('00000000-0000-0000-0000-0000000000d3', '00000000-0000-0000-0000-0000000000c3',
   'platinum', '2026-02-15', '2027-02-14', 950, 0, 950, 30,
   array['instagram','facebook','tiktok']::platform[], 'presupuesto_compartido', true)
on conflict (id) do nothing;

insert into contract_items (contract_id, tipo, cantidad) values
  ('00000000-0000-0000-0000-0000000000d3', 'reel', 12),
  ('00000000-0000-0000-0000-0000000000d3', 'carrusel', 8),
  ('00000000-0000-0000-0000-0000000000d3', 'post_imagen', 5),
  ('00000000-0000-0000-0000-0000000000d3', 'historia', 5)
on conflict (contract_id, tipo) do nothing;
