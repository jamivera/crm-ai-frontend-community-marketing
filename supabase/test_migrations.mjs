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
  '20260705000005_grants_and_missing_rls.sql',
  '20260705000006_identity_provisioning_trigger.sql',
  '20260705000007_auth_hook_custom_claims.sql',
  '20260705000008_service_role_grants.sql',
  '20260705000009_fix_trigger_gotrue_timing.sql',
  '20260705000010_fix_auth_hook_client_id.sql',
];
const SEED = [
  'seed_agencies','seed_users','seed_clients','seed_contracts','seed_briefs',
  'seed_content','seed_campaigns','seed_metrics','seed_media','seed_notifications',
];

const db = await PGlite.create();
const results = [];
let failed = false;

// Stubs de roles de API (Supabase los provee; PGlite/Postgres puro no).
// Sin ellos, los GRANT/ALTER DEFAULT PRIVILEGES de la 0005 fallan.
await db.exec(`
  do $$ begin
    if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon; end if;
    if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
    if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role; end if;
    if not exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then create role supabase_auth_admin; end if;
  end $$;
`);

// Stubs del esquema auth (Supabase los provee; PGlite/Postgres puro no).
// auth.users se stubea como TABLA para que el trigger de la 0006 pueda crearse.
await db.exec(`
  create schema if not exists auth;
  create table if not exists auth.users (
    id                 uuid primary key default gen_random_uuid(),
    email              text,
    raw_app_meta_data  jsonb,
    raw_user_meta_data jsonb,
    created_at         timestamptz default now()
  );
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
const identity = [];   // evidencia del flujo identidad (0006 + 0007)
if (!failed) {
  const q = async (sql) => (await db.query(sql)).rows;
  tables = (await q(`select count(*) n from information_schema.tables where table_schema='public'`))[0].n;
  policies = (await q(`select count(*) n from pg_policies where schemaname='public'`))[0].n;
  for (const t of ['agencies','users','clients','contracts','briefs','content_pieces',
                   'campaigns','ads','publications','metric_snapshots','notifications']) {
    counts[t] = (await q(`select count(*) n from ${t}`))[0].n;
  }

  // ─── Flujo de identidad end-to-end (ADR-011) ──────────────────────────────
  try {
    const NEW_ID = '99999999-0000-0000-0000-000000000001';
    const AGENCY = '11111111-0000-0000-0000-000000000001';  // Primero Digital (seed)

    // (a) TRIGGER: insertar en auth.users con app_metadata → debe crear public.users
    await db.exec(`
      insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data) values
      ('${NEW_ID}', 'nuevo.colab@primerodigital.ec',
       '{"agency_id":"${AGENCY}","rol":"designer"}'::jsonb,
       '{"full_name":"Nuevo Colaborador"}'::jsonb);
    `);
    const prov = (await q(`select id, agency_id, rol, nombre from public.users where id = '${NEW_ID}'`))[0];
    identity.push(prov
      ? `Trigger aprovisiona ✅ · public.users id=${prov.id} rol=${prov.rol} nombre=${prov.nombre}`
      : `Trigger aprovisiona ❌ · no se creó public.users`);

    // (b) IDEMPOTENCIA (Regla 7): reinsertar el mismo id no debe duplicar
    await db.exec(`
      insert into auth.users (id, email, raw_app_meta_data) values
      ('${NEW_ID}', 'nuevo.colab@primerodigital.ec', '{"agency_id":"${AGENCY}","rol":"designer"}'::jsonb)
      on conflict (id) do nothing;
    `);
    const dup = (await q(`select count(*) n from public.users where id = '${NEW_ID}'`))[0].n;
    identity.push(`Idempotencia ${Number(dup) === 1 ? '✅' : '❌'} · filas para el mismo id = ${dup}`);

    // (c) AUTH HOOK: para un usuario del seed, debe inyectar los claims desde public.users
    const ANDREA = '22222222-0000-0000-0000-000000000001';
    const hook = (await q(`
      select public.custom_access_token_hook(
        jsonb_build_object('user_id','${ANDREA}','claims','{}'::jsonb)
      ) as out
    `))[0].out;
    const c = hook.claims || {};
    const clientKey = ('client_id' in c);   // 0010: debe OMITIRSE cuando es null (Andrea no tiene client_id)
    identity.push(`Auth Hook claims ${c.agency_id ? '✅' : '❌'} · agency_id=${c.agency_id ?? '(ausente)'} rol=${c.rol ?? '(ausente)'} · client_id ${clientKey ? 'presente=' + c.client_id : 'omitido ✅ (0010)'}`);

    // (d) Simula el flujo REAL de GoTrue (0009): INSERT sin app_metadata NO debe
    //     provisionar ni romper; el UPDATE posterior de app_metadata SÍ provisiona.
    const GT_ID = '99999999-0000-0000-0000-000000000002';
    await db.exec(`insert into auth.users (id, email, raw_app_meta_data) values
      ('${GT_ID}', 'gotrue.sim@primerodigital.ec', '{"provider":"email","providers":["email"]}'::jsonb);`);
    const preUpd = (await q(`select count(*) n from public.users where id='${GT_ID}'`))[0].n;
    await db.exec(`update auth.users
      set raw_app_meta_data = raw_app_meta_data || '{"agency_id":"${AGENCY}","rol":"content_manager"}'::jsonb
      where id='${GT_ID}';`);
    const postUpd = (await q(`select rol from public.users where id='${GT_ID}'`))[0];
    identity.push(`GoTrue timing (0009): INSERT sin tenant no provisiona ${Number(preUpd) === 0 ? '✅' : '❌'} · UPDATE de app_metadata provisiona ${postUpd ? '✅ rol=' + postUpd.rol : '❌'}`);
  } catch (e) {
    identity.push(`Flujo identidad ❌ · ${e.message.split('\n')[0]}`);
    failed = true;
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
if (identity.length) {
  console.log('Flujo de identidad (ADR-011 · 0006 Trigger + 0007 Auth Hook):');
  for (const line of identity) console.log('  · ' + line);
  console.log('-'.repeat(74));
}
if (!failed) {
  console.log(`Tablas creadas: ${tables} · Policies RLS creadas: ${policies}`);
  console.log('Conteos del seed:', Object.entries(counts).map(([k, v]) => `${k}=${v}`).join(' · '));
  console.log('\n✅ TODO OK: migraciones + seed + flujo de identidad sin errores en PostgreSQL.');
} else {
  console.log('\n❌ FALLÓ. Ver el error arriba.');
}
console.log('═'.repeat(74));
process.exit(failed ? 1 : 0);
