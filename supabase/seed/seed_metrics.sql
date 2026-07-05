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
