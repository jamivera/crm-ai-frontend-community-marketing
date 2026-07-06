// Prueba EMPÍRICA (variante authenticated): repite exactamente las consultas de
// test_clientes_dal.mjs, pero con una SESIÓN REAL de Supabase Auth (rol
// authenticated), no con anon. Objetivo: validar la hipótesis de que el 42501 de
// clients era el comportamiento esperado para anon, y observar qué hace RLS con
// un usuario authenticated que TODAVÍA no tiene custom claims (agency_id, etc.).
//
// Usuario: el ADMIN REAL de Primero Digital (primer usuario de FPlus).
// Flujo oficial (ADR-011) — NO se crea a mano en el Dashboard:
//   1. Define en .env.staging: ADMIN_EMAIL, ADMIN_PASSWORD (+ SERVICE_ROLE key).
//   2. Créalo con:  node supabase/bootstrap_admin.mjs
//      (Admin API → auth.users → Trigger → public.users).
//   3. Este test inicia sesión con ESAS mismas credenciales para validar
//      el login real → JWT (Auth Hook) → RLS.
// La contraseña queda solo en tu .env (gitignored); nunca se comparte ni commitea.
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync(new URL('../.env.staging', import.meta.url), 'utf8')
    .split('\n').filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const SB_URL = env.VITE_SUPABASE_URL;
const SB_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;
const EMAIL = env.ADMIN_EMAIL;
const PASSWORD = env.ADMIN_PASSWORD;

console.log('Proyecto:', SB_URL, '\n' + '─'.repeat(68));

if (!EMAIL || !PASSWORD) {
  console.log('❌ Falta ADMIN_EMAIL / ADMIN_PASSWORD en .env.staging.');
  console.log('   Crea un usuario de prueba en el Dashboard (Auth → Users → Add user,');
  console.log('   "Auto Confirm User") y agrega sus credenciales a .env.staging.');
  process.exit(1);
}

const sb = createClient(SB_URL, SB_KEY);

// 1) Iniciar sesión real → obtenemos un JWT con role: authenticated
const { data: auth, error: authErr } = await sb.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
if (authErr || !auth?.session) {
  console.log('❌ No se pudo iniciar sesión →');
  if (authErr) {
    console.log('   status :', authErr.status);
    console.log('   code   :', authErr.code);
    console.log('   name   :', authErr.name);
    console.log('   message:', authErr.message);
    console.log('   full   :', JSON.stringify(authErr, Object.getOwnPropertyNames(authErr), 2));
  } else {
    console.log('   (sin error pero sin sesión)');
  }
  process.exit(1);
}

// 2) Inspeccionar los claims del JWT (evidencia clave para el diagnóstico)
const claims = JSON.parse(Buffer.from(auth.session.access_token.split('.')[1], 'base64url').toString());
const has = (k) => k in claims && claims[k] != null && claims[k] !== '';
console.log('1 · JWT role:', claims.role);
console.log('2 · Custom claims:');
console.log('      agency_id:', has('agency_id') ? claims.agency_id : '❌ AUSENTE');
console.log('      rol      :', has('rol')       ? claims.rol       : '❌ AUSENTE');
console.log('      client_id:', has('client_id') ? claims.client_id : '❌ AUSENTE');
console.log('─'.repeat(68));
console.log('3 · Resultado de cada consulta:');

// Reporter: en error → código + mensaje completo + tabla; en éxito → conteo +
// primer registro resumido (id y nombre si aplica).
function show(table, { data, error }) {
  if (error) {
    console.log(`   ${table}`);
    console.log(`      → ❌ ERROR`);
    console.log(`         · código PostgreSQL: ${error.code ?? '(sin código)'}`);
    console.log(`         · mensaje: ${error.message}`);
    console.log(`         · tabla consultada: ${table}`);
    if (error.details) console.log(`         · detalles: ${error.details}`);
    if (error.hint)    console.log(`         · hint: ${error.hint}`);
    return;
  }
  const n = data?.length ?? 0;
  let resumen = '(sin registros)';
  if (n > 0) {
    const r = data[0];
    const nombre = r.nombre ?? r.codigo ?? null;
    resumen = `id=${r.id ?? '(sin id)'}${nombre != null ? ` · nombre=${nombre}` : ''}`;
  }
  console.log(`   ${table}`);
  console.log(`      → ✅ ${n} registro(s) · primero: ${resumen}`);
}

// Exactamente las mismas consultas que la prueba anon, ahora autenticados
show('subscription_plans',
  await sb.from('subscription_plans').select('id,codigo,nombre'));
show('clients',
  await sb.from('clients').select('id,nombre').is('deleted_at', null).order('created_at', { ascending: false }));
show('content_pieces',
  await sb.from('content_pieces').select('id').limit(1));

await sb.auth.signOut();

console.log('─'.repeat(68));
console.log('4/5 arriba (error → código+mensaje+tabla · éxito → conteo+1er registro)');
console.log('Diagnóstico (rol authenticated):');
console.log('  · clients con datos   → GRANT ok Y RLS deja pasar (revisar por qué sin claims)');
console.log('  · clients [] sin error → GRANT ok; RLS filtra por falta de claims → justifica 0006');
console.log('  · clients 42501        → problema REAL en el GRANT de authenticated → corregir solo eso');
