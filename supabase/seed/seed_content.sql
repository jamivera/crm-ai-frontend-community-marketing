-- ═══════════════════════════════════════════════════════════════════════════
-- SEED · Contenido (fechas relativas, todos los estados — §4, §5, §9, §13)
-- ═══════════════════════════════════════════════════════════════════════════
-- Fechas SIEMPRE relativas a now(): el seed nunca queda obsoleto.
-- campaign_id se enlaza en seed_campaigns.sql (evita dependencia circular).
-- Cubre: publicado, aprobado, enviado a revisión, en producción, cambios
-- solicitados, y planificado-por-IA-incompleto (🟡 pendiente de completar).

insert into content_pieces
  (id, client_id, nombre, tipo, estado, origen, razon_estrategica,
   fecha_publicacion, plataforma, copy_activo, hashtags, angulo_andromeda,
   incluye_cta, seleccionado_pauta, iteraciones,
   account_manager_id, designer_id, created_at)
values
-- ─── KINARA (flagship) ───────────────────────────────────────────────────────
  ('55555555-0000-0000-0001-000000000001','33333333-0000-0000-0000-000000000001',
   'Reel · Cocina abierta con el Chef','reel','publicado','manual',
   'Reel el jueves: mayor rendimiento del formato en Instagram para gastronomía.',
   now() - interval '20 days','instagram',
   'Así nace cada plato en Kinara 👨‍🍳 El chef Marcos te muestra el proceso. Reservas → link en bio.',
   array['#KinaraEC','#CocinaDeAutor','#GastronomiaQuito'],'Descubrimiento',true,true,2,
   '22222222-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000004', now() - interval '28 days'),

  ('55555555-0000-0000-0001-000000000002','33333333-0000-0000-0000-000000000001',
   'Carrusel · 5 platos estrella de la temporada','carrusel','publicado','manual',null,
   now() - interval '12 days','facebook',
   'El menú llegó con todo 🍽️ Desliza y descubre cuál será el tuyo. Mesa disponible → link en bio.',
   array['#KinaraEC','#MenuDeTemporada'],'Deseo',true,true,1,
   '22222222-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000004', now() - interval '18 days'),

  ('55555555-0000-0000-0001-000000000003','33333333-0000-0000-0000-000000000001',
   'Reel · Proceso del chimichurri artesanal','reel','publicado','manual',null,
   now() - interval '6 days','instagram',
   'El secreto está en las hierbas 🌿 Mira cómo preparamos el chimichurri que acompaña nuestros platos.',
   array['#KinaraEC','#HechoEnCasa'],'Descubrimiento',false,false,1,
   '22222222-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000004', now() - interval '11 days'),

  ('55555555-0000-0000-0001-000000000004','33333333-0000-0000-0000-000000000001',
   'Post · Postre del mes: mousse de maracuyá','post_imagen','aprobado_final','manual',null,
   now() + interval '1 day','instagram',
   'Dulce final 🍮 Mousse de maracuyá, solo este mes. Reserva tu mesa → link en bio.',
   array['#KinaraEC','#PostreDelMes'],'Deseo',true,false,1,
   '22222222-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000004', now() - interval '5 days'),

  ('55555555-0000-0000-0001-000000000005','33333333-0000-0000-0000-000000000001',
   'Reel · Cóctel de bienvenida con frutas locales','reel','aprobado_cliente','manual',null,
   now() + interval '3 days','tiktok',
   'El comienzo perfecto 🍹 Nuestro cóctel de bienvenida con frutas locales de temporada.',
   array['#KinaraEC','#Cocteleria'],'Descubrimiento',false,false,1,
   '22222222-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000004', now() - interval '4 days'),

  ('55555555-0000-0000-0001-000000000006','33333333-0000-0000-0000-000000000001',
   'Carrusel · 3 razones para venir a Kinara','carrusel','enviado_cliente','manual',null,
   now() + interval '5 days','instagram',
   '3 razones por las que Kinara es el favorito de Quito 🍽️ Desliza y descúbrelas.',
   array['#KinaraEC','#QuitoFoodie'],'Consideración',true,false,1,
   '22222222-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000004', now() - interval '3 days'),

  ('55555555-0000-0000-0001-000000000007','33333333-0000-0000-0000-000000000001',
   'Historia · Sabores de temporada','historia','en_produccion','manual',null,
   now() + interval '8 days','instagram',null,
   array[]::text[],null,false,false,0,
   '22222222-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000004', now() - interval '1 days'),

  ('55555555-0000-0000-0001-000000000008','33333333-0000-0000-0000-000000000001',
   'Reel · Noche de maridaje (planificado IA)','reel','borrador','planificada',
   'Reel el viernes: mejor alcance de video corto en Instagram para gastronomía.',
   now() + interval '12 days','instagram',null,
   array[]::text[],null,false,false,0,
   '22222222-0000-0000-0000-000000000001',null, now() - interval '1 days'),

-- ─── VELORA (contenido pendiente de revisión) ───────────────────────────────
  ('55555555-0000-0000-0002-000000000001','33333333-0000-0000-0000-000000000002',
   'Reel · Rutina de noche en 3 pasos','reel','enviado_cliente','manual',null,
   now() + interval '4 days','instagram',
   'Tu piel también descansa 🌙 Rutina de noche en 3 pasos con Velora. ¿La haces? 👇',
   array['#VeloraBrand','#RutinaFacial'],'Educación',true,false,1,
   '22222222-0000-0000-0000-000000000002','22222222-0000-0000-0000-000000000004', now() - interval '2 days'),

  ('55555555-0000-0000-0002-000000000002','33333333-0000-0000-0000-000000000002',
   'Carrusel · Mitos del skincare','carrusel','enviado_cliente','manual',null,
   now() + interval '6 days','instagram',
   '¿Cuántos creías ciertos? 😮 Desmontamos 5 mitos del cuidado facial. Guarda este post 📌',
   array['#VeloraBrand','#SkincareEc'],'Educación',true,false,1,
   '22222222-0000-0000-0000-000000000002','22222222-0000-0000-0000-000000000004', now() - interval '2 days'),

  ('55555555-0000-0000-0002-000000000003','33333333-0000-0000-0000-000000000002',
   'Historia · Antes y después','historia','en_revision_cliente','manual',null,
   now() + interval '2 days','tiktok',
   '2 semanas de constancia ✨ Mira el cambio. Agenda tu sesión → link en bio.',
   array['#VeloraBrand'],'Prueba social',true,false,1,
   '22222222-0000-0000-0000-000000000002','22222222-0000-0000-0000-000000000004', now() - interval '3 days'),

  ('55555555-0000-0000-0002-000000000004','33333333-0000-0000-0000-000000000002',
   'Reel · Ingredientes que amamos','reel','publicado','manual',null,
   now() - interval '8 days','instagram',
   'Origen natural, resultados reales 🌱 Estos son los ingredientes estrella de Velora.',
   array['#VeloraBrand','#SkincareNatural'],'Descubrimiento',false,false,1,
   '22222222-0000-0000-0000-000000000002','22222222-0000-0000-0000-000000000004', now() - interval '13 days'),

-- ─── ATUK (contrato por vencer + planificado IA) ────────────────────────────
  ('55555555-0000-0000-0003-000000000001','33333333-0000-0000-0000-000000000003',
   'Carrusel · Nueva colección andina','carrusel','aprobado_cliente','manual',null,
   now() + interval '3 days','instagram',
   'Tejida a mano, pensada para ti 🧵 Conoce la nueva colección ATUK. Envíos a todo el país.',
   array['#ATUK','#DisenoAndino','#HechoEnEcuador'],'Deseo',true,false,1,
   '22222222-0000-0000-0000-000000000002','22222222-0000-0000-0000-000000000004', now() - interval '4 days'),

  ('55555555-0000-0000-0003-000000000002','33333333-0000-0000-0000-000000000003',
   'Reel · El proceso artesanal (planificado IA)','reel','borrador','planificada',
   'Reel el sábado: los recorridos de proceso rinden hacia el fin de semana.',
   now() + interval '10 days','instagram',null,
   array[]::text[],null,false,false,0,
   '22222222-0000-0000-0000-000000000002',null, now() - interval '1 days'),

  ('55555555-0000-0000-0003-000000000003','33333333-0000-0000-0000-000000000003',
   'Post · Regalo con significado','post_imagen','publicado','extraordinaria',null,
   now() - interval '5 days','facebook',
   'Un regalo que cuenta una historia 🎁 Piezas únicas hechas a mano. Encuéntralas en atuk.ec',
   array['#ATUK','#RegaloConSignificado'],'Emoción',true,false,1,
   '22222222-0000-0000-0000-000000000002','22222222-0000-0000-0000-000000000004', now() - interval '9 days'),

-- ─── LEXAVAL (publicaciones aprobadas, formal) ──────────────────────────────
  ('55555555-0000-0000-0004-000000000001','33333333-0000-0000-0000-000000000004',
   'Carrusel · 5 errores legales al contratar','carrusel','publicado','manual',null,
   now() - interval '10 days','linkedin',
   'Contratar sin asesoría puede costar caro ⚖️ Estos son 5 errores frecuentes que evitamos.',
   array['#Lexaval','#DerechoEmpresarial'],'Educación',true,false,1,
   '22222222-0000-0000-0000-000000000002',null, now() - interval '15 days'),

  ('55555555-0000-0000-0004-000000000002','33333333-0000-0000-0000-000000000004',
   'Post · Nueva normativa laboral','post_imagen','aprobado_final','manual',null,
   now() + interval '2 days','linkedin',
   'Lo que tu empresa debe saber sobre la nueva normativa laboral 📋 Te lo explicamos claro.',
   array['#Lexaval','#AsesoriaLegal'],'Autoridad',true,false,1,
   '22222222-0000-0000-0000-000000000002',null, now() - interval '4 days'),

  ('55555555-0000-0000-0004-000000000003','33333333-0000-0000-0000-000000000004',
   'Carrusel · Preguntas frecuentes de asesoría','carrusel','aprobado_cliente','manual',null,
   now() + interval '5 days','instagram',
   'Resolvemos las dudas más comunes de nuestras empresas cliente 💼 Desliza.',
   array['#Lexaval'],'Consideración',true,false,1,
   '22222222-0000-0000-0000-000000000002',null, now() - interval '6 days'),

-- ─── PESATRONIC (cambios solicitados + histórico) ───────────────────────────
  ('55555555-0000-0000-0005-000000000001','33333333-0000-0000-0000-000000000005',
   'Post · Línea de balanzas industriales','post_imagen','cambios_solicitados','manual',null,
   now() + interval '4 days','linkedin',
   'Precisión que tu operación necesita ⚙️ Conoce nuestra línea de balanzas industriales.',
   array['#Pesatronic','#Industrial'],'Autoridad',true,false,2,
   '22222222-0000-0000-0000-000000000001',null, now() - interval '7 days'),

  ('55555555-0000-0000-0005-000000000002','33333333-0000-0000-0000-000000000005',
   'Carrusel · Casos de éxito en planta','carrusel','publicado','manual',null,
   now() - interval '40 days','facebook',
   'Resultados que hablan por sí solos 📈 Así optimizamos la operación de nuestros clientes.',
   array['#Pesatronic','#B2B'],'Prueba social',true,false,1,
   '22222222-0000-0000-0000-000000000001',null, now() - interval '45 days')
on conflict (id) do nothing;

-- ─── Comentarios (internos y de cliente) ────────────────────────────────────
insert into comments (id, content_piece_id, autor_id, autor_nombre, texto, interno, created_at) values
  ('55555555-1111-0000-0000-000000000001','55555555-0000-0000-0001-000000000001',
   '22222222-0000-0000-0000-000000000003','María Loor','Hook menor a 3s, el cliente es exigente con eso.',true, now() - interval '25 days'),
  ('55555555-1111-0000-0000-000000000002','55555555-0000-0000-0001-000000000001',
   '22222222-0000-0000-0000-0000000000c1','Chef Marco Andrade','¡Aprobado! El reel se ve increíble 🔥',false, now() - interval '23 days'),
  ('55555555-1111-0000-0000-000000000003','55555555-0000-0000-0001-000000000006',
   '22222222-0000-0000-0000-0000000000c1','Chef Marco Andrade','¿Podemos cambiar la portada por la del plato principal?',false, now() - interval '1 days'),
  ('55555555-1111-0000-0000-000000000004','55555555-0000-0000-0005-000000000001',
   '22222222-0000-0000-0000-0000000000c5','Asistente de Marketing','El copy debe mencionar la certificación ISO. Ajustar por favor.',false, now() - interval '3 days')
on conflict (id) do nothing;

-- ─── Historial de aprobación (approval_events, append-only) ──────────────────
insert into approval_events (id, content_piece_id, estado_anterior, estado_nuevo, actor_id, actor_nombre, comentario, created_at) values
  -- Kinara k1: ciclo completo hasta publicado
  ('55555555-2222-0000-0000-000000000001','55555555-0000-0000-0001-000000000001','revision_interna','enviado_cliente','22222222-0000-0000-0000-000000000003','María Loor',null, now() - interval '24 days'),
  ('55555555-2222-0000-0000-000000000002','55555555-0000-0000-0001-000000000001','enviado_cliente','aprobado_cliente','22222222-0000-0000-0000-0000000000c1','Chef Marco Andrade',null, now() - interval '23 days'),
  ('55555555-2222-0000-0000-000000000003','55555555-0000-0000-0001-000000000001','aprobado_final','publicado','22222222-0000-0000-0000-000000000002','Juan Pérez',null, now() - interval '20 days'),
  -- Kinara k6: enviado a revisión (pendiente)
  ('55555555-2222-0000-0000-000000000004','55555555-0000-0000-0001-000000000006','revision_interna','enviado_cliente','22222222-0000-0000-0000-000000000003','María Loor',null, now() - interval '2 days'),
  -- Pesatronic p1: cliente solicitó cambios
  ('55555555-2222-0000-0000-000000000005','55555555-0000-0000-0005-000000000001','enviado_cliente','cambios_solicitados','22222222-0000-0000-0000-0000000000c5','Asistente de Marketing','El copy debe mencionar la certificación ISO.', now() - interval '3 days')
on conflict (id) do nothing;
