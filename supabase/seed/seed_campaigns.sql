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
