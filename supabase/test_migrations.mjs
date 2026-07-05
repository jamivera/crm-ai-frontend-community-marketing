// Prueba de EJECUCIÓN real de las migraciones + seed sobre PostgreSQL (PGlite).
// No es validación estática: aplica el SQL de verdad en un Postgres efímero.
// Los stubs de auth.* replican lo que Supabase provee (sin ellos, RLS no compila).
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const DIR = dirname(fileURLToPath(import.meta.url));
const ms = (a, b) => `${(Number(b - a) / 1e6).toFixed(0)} ms`;

const MIGRATIONS = [
  '20260704000001_initial_schema.sql',
  '20260704000002_rls_policies.sql',
  '20260704000003_soft_delete_audit.sql',
  '20260704000004_rls_performance_indexes.sql',
];
const SEED = [
  'seed_agencies','seed_users','seed_clients','seed_contracts','seed_briefs',
  'seed_content','seed_campaigns','seed_metrics','seed_media','seed_notifications',
];

const db = await PGlite.create();
const results = [];
let failed = false;

// Stubs del esquema auth (Supabase los provee; PGlite/Postgres puro no).
await db.exec(`
  create schema if not exists auth;
  create or replace function auth.jwt() returns jsonb language sql stable
    as $$ select nullif(current_setting('request.jwt.claims', true), '')::jsonb $$;
  create or replace function auth.uid() returns uuid language sql stable
    as $$ select (auth.jwt() ->> 'sub')::uuid $$;
  create or replace function auth.role() returns text language sql stable
    as $$ select coalesce(auth.jwt() ->> 'role', 'anon') $$;
`);

async function run(label, path) {
  const sql = readFileSync(path, 'utf8');
  const t0 = process.hrtime.bigint();
  try {
    await db.exec(sql);
    const t1 = process.hrtime.bigint();
    results.push({ label, time: ms(t0, t1), result: 'OK', note: '' });
  } catch (e) {
    const t1 = process.hrtime.bigint();
    results.push({ label, time: ms(t0, t1), result: 'ERROR', note: e.message.split('\n')[0] });
    failed = true;
  }
}

// 1) Migraciones en orden
for (const m of MIGRATIONS) { if (!failed) await run(`migración ${m.slice(10, 14)}`, join(DIR, 'migrations', m)); }
// 2) Seed modular en orden (solo si migraciones OK)
for (const s of SEED) { if (!failed) await run(`seed · ${s}`, join(DIR, 'seed', `${s}.sql`)); }

// 3) Verificaciones post-ejecución
let counts = {}, policies = 0, tables = 0;
if (!failed) {
  const q = async (sql) => (await db.query(sql)).rows;
  tables = (await q(`select count(*) n from information_schema.tables where table_schema='public'`))[0].n;
  policies = (await q(`select count(*) n from pg_policies where schemaname='public'`))[0].n;
  for (const t of ['agencies','users','clients','contracts','briefs','content_pieces',
                   'campaigns','ads','publications','metric_snapshots','notifications']) {
    counts[t] = (await q(`select count(*) n from ${t}`))[0].n;
  }
}

// ─── Reporte ─────────────────────────────────────────────────────────────────
console.log('\n' + '═'.repeat(74));
console.log('FPLUS · Prueba de EJECUCIÓN real (PGlite · PostgreSQL 18)');
console.log('═'.repeat(74));
console.log('Migración/Seed'.padEnd(34) + 'Tiempo'.padEnd(12) + 'Resultado');
console.log('-'.repeat(74));
for (const r of results) {
  console.log(r.label.padEnd(34) + r.time.padEnd(12) + (r.result === 'OK' ? '✅ OK' : '❌ ' + r.result) +
    (r.note ? `  ← ${r.note}` : ''));
}
console.log('-'.repeat(74));
if (!failed) {
  console.log(`Tablas creadas: ${tables} · Policies RLS creadas: ${policies}`);
  console.log('Conteos del seed:', Object.entries(counts).map(([k, v]) => `${k}=${v}`).join(' · '));
  console.log('\n✅ TODO OK: migraciones + seed se ejecutaron sin errores en PostgreSQL.');
} else {
  console.log('\n❌ FALLÓ. Ver el error arriba.');
}
console.log('═'.repeat(74));
process.exit(failed ? 1 : 0);
