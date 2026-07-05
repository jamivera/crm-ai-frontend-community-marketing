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
