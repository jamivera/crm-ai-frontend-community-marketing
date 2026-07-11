# DEPENDENCY_MANIFEST · FPlus

> Dependencias y herramientas. **No se tocaron en el RC1** (regla: no actualizar/instalar paquetes).

## Runtime / frontend (de `package.json`)
- **React 19**, **TypeScript** (strict), **Vite**, **TailwindCSS 4**, **Zustand**, **React Router 7**.
- i18n con locales en `src/i18n/locales/` (en, es, fr, it, pt, pt-BR).

## Backend / datos
- **Supabase** (PostgreSQL 15 gestionado, Auth/GoTrue, Storage, Realtime, RLS).
- **`@supabase/supabase-js` 2.110.0** (soporta las nuevas API keys `sb_publishable_`/`sb_secret_`).
- **Supabase CLI** para migraciones (`db push`, `migration list`).

## Tooling de validación (toolkit)
- **`@electric-sql/pglite`** — Postgres WASM para `test_migrations.mjs` (ejecución real sin Docker).
- **Python 3** — `validate_migrations.py` (gate estático; sin dependencias externas).

## Testing / calidad
- **Vitest** (`vitest.config.ts`), **Playwright** (`playwright.config.ts`, e2e), **ESLint** (`eslint.config.js`),
  **Prettier** (`.prettierrc`).

## Contenedores / despliegue (heredado de Evo)
- `Dockerfile`, `docker-entrypoint.sh`, `nginx.conf`, `.dockerignore`.

## ⚠️ Observaciones (no resueltas en RC1)
- **Doble lockfile:** `package-lock.json` **y** `pnpm-lock.yaml` están ambos versionados. Riesgo de instalaciones
  divergentes según el gestor. **Decisión pendiente:** elegir uno (npm o pnpm) y eliminar el otro — fuera del
  alcance del RC1 por la regla de no cambiar dependencias.
- Las versiones exactas de cada paquete están en `package.json` / `package-lock.json`; no se listan aquí para no
  duplicar una fuente de verdad que puede cambiar.

## Variables de entorno requeridas
Ver [SETUP.md](SETUP.md) §2. Resumen: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (públicas);
`SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` (secretas/locales).
