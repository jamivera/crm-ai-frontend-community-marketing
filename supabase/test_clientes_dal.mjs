// Prueba EMPÍRICA: conectar el módulo Clientes vía el DAL real (supabase-js)
// contra Staging, con la Publishable Key (rol anon, sin login todavía).
// Observamos qué ocurre — NO asumimos. Validar → Diagnosticar.
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

// Leer credenciales de .env.staging (públicas)
const env = Object.fromEntries(
  readFileSync(new URL('../.env.staging', import.meta.url), 'utf8')
    .split('\n').filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const SB_URL = env.VITE_SUPABASE_URL;
const SB_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;
console.log('Proyecto:', SB_URL, '\nRol: anon (Publishable Key, sin sesión)\n' + '─'.repeat(64));

const sb = createClient(SB_URL, SB_KEY);
const show = (label, { data, error }) =>
  console.log(`${label}\n   → ${error ? `❌ ERROR ${error.code}: ${error.message}` : `✅ ${data?.length ?? 0} filas`}`);

// Exactamente lo que hace clientService.list()
show('clientService.list()  ·  from clients (deleted_at is null, order created_at)',
  await sb.from('clients').select('*').is('deleted_at', null).order('created_at', { ascending: false }));

// Comparaciones para diagnosticar
show('subscription_plans (tiene policy read_all using(true))',
  await sb.from('subscription_plans').select('codigo,nombre'));
show('content_pieces (tabla con RLS por client→agency)',
  await sb.from('content_pieces').select('id').limit(1));

console.log('─'.repeat(64));
console.log('Diagnóstico:');
console.log('  · 42501 permission denied  → faltan GRANTs (justifica 0005)');
console.log('  · [] vacío sin error       → hay GRANT pero RLS filtra (sin claims → justifica 0006)');
console.log('  · filas con datos          → no se necesita esa migración');
