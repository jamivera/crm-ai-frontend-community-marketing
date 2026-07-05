-- ═══════════════════════════════════════════════════════════════════════════
-- SEED · Clientes reales con estados variados (§3, §4, §13)
-- ═══════════════════════════════════════════════════════════════════════════
-- Clientes reales del proyecto (uso interno de desarrollo/QA). Cada uno en un
-- estado distinto para ejercitar toda la interfaz.

insert into clients
  (id, agency_id, nombre, empresa, industria, tipo_mercado, instagram_handle,
   color_corporativo, email, telefono, responsable_cliente, account_manager_id,
   objetivo_marketing, estado, semaforo, observaciones, notas_internas, created_at)
values
  -- 1 · Kinara — ACTIVO, flagship (campañas + publicaciones + métricas)
  ('33333333-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001',
   'Kinara', 'Kinara Restaurante Cía. Ltda.', 'Gastronomía', 'Restaurante', 'kinaraec',
   '#c2410c', 'chef@kinara.ec', '+593987654321', 'Chef Marco Andrade',
   '22222222-0000-0000-0000-000000000001', 'alcance', 'activo', 'verde',
   'Muy activo en redes. Priorizar reels de cocina.', 'Pago el 5 de cada mes. Requiere factura electrónica.',
   now() - interval '5 months'),

  -- 2 · Velora — ACTIVO, con contenido pendiente de revisión del cliente
  ('33333333-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001',
   'Velora', 'Velora Brand Ecuador', 'Belleza & Bienestar', 'Belleza', 'velorabrand',
   '#be185d', 'contacto@velora.ec', '+593987112233', 'Valeria Morán',
   '22222222-0000-0000-0000-000000000002', 'comunidad', 'activo', 'amarillo',
   'Revisa los contenidos con demora. Recordar seguimiento semanal.', null,
   now() - interval '4 months'),

  -- 3 · ATUK — ACTIVO, contrato PRÓXIMO A VENCER (alerta comercial)
  ('33333333-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001',
   'ATUK', 'ATUK Diseño Andino', 'Moda & Artesanía', 'Retail', 'atuk.ec',
   '#0f766e', 'hola@atuk.ec', '+593986445566', 'Samantha Cabrera',
   '22222222-0000-0000-0000-000000000002', 'conversion', 'activo', 'verde',
   'Marca de diseño andino. Estética cuidada, tono cálido.', 'Renovación a coordinar este mes.',
   now() - interval '11 months'),

  -- 4 · Lexaval — ACTIVO, publicaciones aprobadas, SIN pauta contratada
  ('33333333-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000001',
   'Lexaval', 'Lexaval Abogados & Consultores', 'Servicios profesionales', 'Servicios Profesionales', 'lexaval.ec',
   '#1e3a8a', 'contacto@lexaval.ec', '+593984778899', 'Dra. Carolina Vélez',
   '22222222-0000-0000-0000-000000000002', 'conversion', 'activo', 'verde',
   'Contenido formal. Evitar humor y tendencias virales.', 'Aprueban rápido pero exigen precisión legal.',
   now() - interval '3 months'),

  -- 5 · Pesatronic — PAUSADO, contrato VENCIDO, publicaciones rechazadas
  ('33333333-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000001',
   'Pesatronic', 'Pesatronic Ecuador S.A.', 'Industrial / B2B', 'B2B', 'pesatronic',
   '#334155', 'marketing@pesatronic.ec', '+593982990011', 'Ing. Roberto Salas',
   '22222222-0000-0000-0000-000000000001', 'conversion', 'pausado', 'rojo',
   'Contrato vencido — pendiente de renovación.', 'Interesados en ampliar a videos de planta si renuevan.',
   now() - interval '8 months')
on conflict (id) do nothing;

-- ─── Usuarios del Portal Cliente (dependen de clients — FK users.client_id) ──
insert into users (id, agency_id, email, nombre, rol, client_id, activo) values
  ('22222222-0000-0000-0000-0000000000c1', '11111111-0000-0000-0000-000000000001',
   'chef@kinara.ec', 'Chef Marco Andrade', 'client_premium', '33333333-0000-0000-0000-000000000001', true),
  ('22222222-0000-0000-0000-0000000000c2', '11111111-0000-0000-0000-000000000001',
   'contacto@velora.ec', 'Valeria Morán', 'client_standard', '33333333-0000-0000-0000-000000000002', true),
  ('22222222-0000-0000-0000-0000000000c3', '11111111-0000-0000-0000-000000000001',
   'hola@atuk.ec', 'Samantha Cabrera', 'client_standard', '33333333-0000-0000-0000-000000000003', true),
  -- Cliente con un segundo usuario (gerente + asistente — M2M, §escalabilidad)
  ('22222222-0000-0000-0000-0000000000c4', '11111111-0000-0000-0000-000000000001',
   'contacto@lexaval.ec', 'Dra. Carolina Vélez', 'client_premium', '33333333-0000-0000-0000-000000000004', true),
  ('22222222-0000-0000-0000-0000000000c5', '11111111-0000-0000-0000-000000000001',
   'asistente@lexaval.ec', 'Asistente de Marketing', 'client_standard', '33333333-0000-0000-0000-000000000004', true)
on conflict (id) do nothing;

-- Relación M2M usuario↔cliente (un cliente con varios usuarios)
insert into user_clients (user_id, client_id, rol) values
  ('22222222-0000-0000-0000-0000000000c1', '33333333-0000-0000-0000-000000000001', 'client_premium'),
  ('22222222-0000-0000-0000-0000000000c2', '33333333-0000-0000-0000-000000000002', 'client_standard'),
  ('22222222-0000-0000-0000-0000000000c3', '33333333-0000-0000-0000-000000000003', 'client_standard'),
  ('22222222-0000-0000-0000-0000000000c4', '33333333-0000-0000-0000-000000000004', 'client_premium'),
  ('22222222-0000-0000-0000-0000000000c5', '33333333-0000-0000-0000-000000000004', 'client_standard')
on conflict (user_id, client_id) do nothing;

-- Invitaciones: activadas (aceptadas) + una PENDIENTE para QA
insert into user_invitations (id, agency_id, client_id, email, rol, token, invited_by, accepted_at) values
  ('33333333-0000-0000-0000-0000000000e1', '11111111-0000-0000-0000-000000000001',
   '33333333-0000-0000-0000-000000000001', 'chef@kinara.ec', 'client_premium',
   gen_random_uuid(), '22222222-0000-0000-0000-000000000001', now() - interval '4 months'),
  -- Pendiente: Pesatronic aún no activa su portal
  ('33333333-0000-0000-0000-0000000000e5', '11111111-0000-0000-0000-000000000001',
   '33333333-0000-0000-0000-000000000005', 'marketing@pesatronic.ec', 'client_standard',
   gen_random_uuid(), '22222222-0000-0000-0000-000000000001', null)
on conflict (id) do nothing;

-- Eventos propios del cliente (calendario inteligente)
insert into smart_events (id, agency_id, client_id, fecha, nombre, tipo, recurrente_anual) values
  ('33333333-0000-0000-0000-0000000000a1', '11111111-0000-0000-0000-000000000001',
   '33333333-0000-0000-0000-000000000001', (current_date + 12)::date, 'Aniversario Kinara', 'cliente', true),
  ('33333333-0000-0000-0000-0000000000a3', '11111111-0000-0000-0000-000000000001',
   '33333333-0000-0000-0000-000000000003', (current_date + 25)::date, 'Lanzamiento colección ATUK', 'cliente', false)
on conflict (id) do nothing;
