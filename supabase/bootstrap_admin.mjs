// ═══════════════════════════════════════════════════════════════════════════
// BOOTSTRAP · Primer administrador real de una agencia (ADR-011)
// ═══════════════════════════════════════════════════════════════════════════
// Ejecuta el FLUJO OFICIAL de identidad (no UPSERT manual):
//   Admin API → auth.users → Trigger handle_new_user → public.users
// Es el único bootstrap legítimo: el primer admin de la primera agencia no
// tiene quién lo invite. Reutilizable para cualquier agencia nueva en dev.
//
// Requiere en .env.staging (todo local, gitignored — NADA se comparte):
//   VITE_SUPABASE_URL           (público)
//   SUPABASE_SERVICE_ROLE_KEY   (SECRETO — solo tu máquina; NUNCA al frontend)
//   ADMIN_EMAIL                 (email del admin real de Primero Digital)
//   ADMIN_PASSWORD              (contraseña inicial)
//
// SEGURIDAD: la service_role key solo se usa aquí, en tu terminal. No la
// escribas en el chat ni la subas al repo.
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync(new URL('../.env.staging', import.meta.url), 'utf8')
    .split('\n').filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const URL_SB   = env.VITE_SUPABASE_URL;
const SERVICE  = env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL    = env.ADMIN_EMAIL;
const PASSWORD = env.ADMIN_PASSWORD;
const AGENCY   = '11111111-0000-0000-0000-000000000001';  // Primero Digital (seed)

const faltan = ['VITE_SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','ADMIN_EMAIL','ADMIN_PASSWORD']
  .filter(k => !env[k]);
if (faltan.length) {
  console.log('❌ Faltan variables en .env.staging:', faltan.join(', '));
  process.exit(1);
}

console.log('Proyecto:', URL_SB, '\nAgencia :', AGENCY, '(Primero Digital)\n' + '─'.repeat(64));

// Cliente admin (service_role): NO persiste sesión, solo administra.
const admin = createClient(URL_SB, SERVICE, { auth: { autoRefreshToken: false, persistSession: false } });

// 0 · La agencia debe existir (el Trigger NO crea agencias — Regla 2).
const { data: ag, error: agErr } = await admin.from('agencies').select('id,nombre').eq('id', AGENCY).maybeSingle();
if (agErr) { console.log('❌ Error leyendo agencies:', agErr.message); process.exit(1); }
if (!ag)   { console.log('❌ La agencia', AGENCY, 'no existe. Corre el seed antes del bootstrap.'); process.exit(1); }
console.log('✅ Agencia encontrada:', ag.nombre);

// 1 · Admin API → crea el usuario en auth.users CON app_metadata (fuente única
//     del contexto de tenant, Regla 1). email_confirm evita el paso de correo.
let authUser;
const { data: created, error: createErr } = await admin.auth.admin.createUser({
  email: EMAIL,
  password: PASSWORD,
  email_confirm: true,
  app_metadata: { agency_id: AGENCY, rol: 'agency_admin' },
});

if (createErr) {
  // Observabilidad: exponer el error COMPLETO (status/code/name/message/payload).
  const full = (e) => JSON.stringify(e, Object.getOwnPropertyNames(e), 2);
  console.log('⚠️  createUser error →');
  console.log('   status :', createErr.status);
  console.log('   code   :', createErr.code);
  console.log('   name   :', createErr.name);
  console.log('   message:', createErr.message);
  console.log('   full   :', full(createErr));
  // Idempotente: si ya existe, lo recuperamos y seguimos a la verificación.
  const { data: list, error: listErr } = await admin.auth.admin.listUsers();
  if (listErr) {
    console.log('⚠️  listUsers error →');
    console.log('   status :', listErr.status);
    console.log('   code   :', listErr.code);
    console.log('   name   :', listErr.name);
    console.log('   message:', listErr.message);
    console.log('   full   :', full(listErr));
  }
  authUser = list?.users?.find(u => u.email?.toLowerCase() === EMAIL.toLowerCase());
  if (!authUser) { console.log('❌ No se pudo crear ni encontrar el usuario.'); process.exit(1); }
} else {
  authUser = created.user;
  console.log('✅ Admin API creó auth.users · id =', authUser.id);
}

// 2 · Trigger → debe haber creado public.users con el MISMO id (UUID canónico).
const { data: pu, error: puErr } = await admin
  .from('users').select('id,agency_id,rol,nombre,email,activo').eq('id', authUser.id).maybeSingle();
if (puErr) { console.log('❌ Error leyendo public.users:', puErr.message); process.exit(1); }

console.log('─'.repeat(64));
if (!pu) {
  console.log('❌ El Trigger NO aprovisionó public.users para', authUser.id);
  console.log('   Revisar: ¿trigger on_auth_user_created activo? ¿app_metadata con agency_id/rol?');
  process.exit(1);
}
console.log('✅ Trigger aprovisionó public.users:');
console.log('   ids_coinciden :', authUser.id === pu.id);
console.log('   agency_id     :', pu.agency_id, pu.agency_id === AGENCY ? '✓' : '✗');
console.log('   rol           :', pu.rol);
console.log('   nombre        :', pu.nombre);
console.log('   email         :', pu.email, '· activo:', pu.activo);
console.log('─'.repeat(64));
console.log('Bootstrap OK. Siguiente paso: node supabase/test_clientes_dal_auth.mjs');
console.log('(usa ADMIN_EMAIL / ADMIN_PASSWORD para el login real y valida JWT + RLS end-to-end)');
