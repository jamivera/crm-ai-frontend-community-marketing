-- ═══════════════════════════════════════════════════════════════════════════
-- SEED · Usuarios del equipo de la agencia (roles variados — §2, §13)
-- ═══════════════════════════════════════════════════════════════════════════
-- Los usuarios del PORTAL CLIENTE se siembran en seed_clients.sql (dependen de
-- que los clientes existan primero, por la FK users.client_id → clients).
--
-- Nota Auth: en Supabase, la identidad real vive en auth.users. Estas filas de
-- public.users usan UUIDs fijos; al crear los usuarios en Auth (Sprint 1·B3) se
-- alinea su id con estos para que auth.uid() coincida. El seed es válido tal cual.

insert into users (id, agency_id, email, nombre, rol, client_id, activo) values
  ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001',
   'andrea@primerodigital.ec', 'Andrea Solís', 'agency_admin', null, true),
  ('22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001',
   'juan@primerodigital.ec', 'Juan Pérez', 'account_manager', null, true),
  ('22222222-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001',
   'maria@primerodigital.ec', 'María Loor', 'content_manager', null, true),
  ('22222222-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000001',
   'carlos@primerodigital.ec', 'Carlos Ramos', 'designer', null, true),
  ('22222222-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000001',
   'diego@primerodigital.ec', 'Diego Haro', 'media_buyer', null, true),
  -- Usuario colaborador desactivado (QA: activación/desactivación sin borrar)
  ('22222222-0000-0000-0000-000000000006', '11111111-0000-0000-0000-000000000001',
   'expracticante@primerodigital.ec', 'Ex Practicante', 'designer', null, false)
on conflict (id) do nothing;
