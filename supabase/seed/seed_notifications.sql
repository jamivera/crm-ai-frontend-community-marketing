-- ═══════════════════════════════════════════════════════════════════════════
-- SEED · Notificaciones (pendientes y leídas — §13)
-- ═══════════════════════════════════════════════════════════════════════════
-- Sistema unificado (in-app por ahora). Mezcla de leídas y no leídas para QA.

insert into notifications
  (id, agency_id, user_id, canal, tipo, titulo, cuerpo, entidad, entidad_id, leida, enviada_at, created_at)
values
  -- Para la agencia: cambios solicitados por un cliente (no leída → badge)
  ('aaaaaaaa-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000001',
   '22222222-0000-0000-0000-000000000001','in_app','cambios_solicitados',
   'Pesatronic solicitó cambios','El cliente pidió mencionar la certificación ISO en el post.',
   'content_pieces','55555555-0000-0000-0005-000000000001', false, now() - interval '3 days', now() - interval '3 days'),

  -- Para la agencia: pieza aprobada por el cliente (leída)
  ('aaaaaaaa-0000-0000-0000-000000000002','11111111-0000-0000-0000-000000000001',
   '22222222-0000-0000-0000-000000000002','in_app','aprobacion',
   'ATUK aprobó una pieza','Carrusel · Nueva colección andina fue aprobado.',
   'content_pieces','55555555-0000-0000-0003-000000000001', true, now() - interval '2 days', now() - interval '2 days'),

  -- Para el cliente Kinara: contenido por revisar (no leída)
  ('aaaaaaaa-0000-0000-0000-000000000003','11111111-0000-0000-0000-000000000001',
   '22222222-0000-0000-0000-0000000000c1','in_app','revision',
   'Tienes contenido por revisar','Carrusel · 3 razones para venir a Kinara espera tu aprobación.',
   'content_pieces','55555555-0000-0000-0001-000000000006', false, now() - interval '2 days', now() - interval '2 days'),

  -- Para la agencia: alerta de contrato por vencer (no leída)
  ('aaaaaaaa-0000-0000-0000-000000000004','11111111-0000-0000-0000-000000000001',
   '22222222-0000-0000-0000-000000000002','in_app','contrato_por_vencer',
   'Contrato de ATUK por vencer','El contrato de ATUK vence en menos de 20 días. Coordinar renovación.',
   'clients','33333333-0000-0000-0000-000000000003', false, now() - interval '1 day', now() - interval '1 day'),

  -- Para la agencia: contrato vencido (no leída)
  ('aaaaaaaa-0000-0000-0000-000000000005','11111111-0000-0000-0000-000000000001',
   '22222222-0000-0000-0000-000000000001','in_app','contrato_vencido',
   'Contrato de Pesatronic vencido','El contrato venció hace 30 días. Cliente pausado.',
   'clients','33333333-0000-0000-0000-000000000005', false, now() - interval '30 days', now() - interval '30 days')
on conflict (id) do nothing;
