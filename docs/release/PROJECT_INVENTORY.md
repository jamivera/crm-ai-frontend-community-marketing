# PROJECT_INVENTORY · FPlus RC1

> Inventario del repositorio (basado en la auditoría de Fase 1; no se re-escaneó). Raíz: `/Users/jamil/AgencyOs`.

## Raíz
```
.env.example .env.staging.example .env.production.example   ← plantillas (trackeadas, seguras)
.env.staging .env.local                                     ← reales, SECRETOS (gitignored, NO trackeados)
.gitignore .editorconfig .prettierrc .dockerignore
package.json package-lock.json pnpm-lock.yaml               ← ⚠️ doble lockfile
vite.config.ts vitest.config.ts playwright.config.ts eslint.config.js
tsconfig*.json index.html nginx.conf Dockerfile docker-entrypoint.sh e2e-harness.html
README.md CHANGELOG.md CONTRIBUTING.md LICENSE NOTICE SECURITY.md TRADEMARKS.md EXTENSION_POINTS.md  ← base Evo
src/ public/ e2e/ dist/ docs/ supabase/ node_modules/ .github/ .claude/
```

## `src/` (frontend)
- **Base Evo CRM:** `components/{agents,chat,integrations,journey,macros,segments,users,…}`, `contexts/chat`,
  `hooks/chat`, `pages/Customer/…`, `i18n/locales/{en,es,fr,it,pt,pt-BR}`. (Contiene ~30 `TODO/HACK` heredados.)
- **FPlus:** `src/fplus/` — `components/modals/` (p. ej. `NewClientModal.tsx`), y **`src/fplus/services/`** = el
  **DAL** (`supabaseClient.ts`, `interfaces/`, `supabase/clientService.ts`, `index.ts` factory).

## `supabase/`
### Migraciones (`supabase/migrations/`) — congeladas 0001–0009
```
20260704000001_initial_schema.sql          20260705000006_identity_provisioning_trigger.sql
20260704000002_rls_policies.sql            20260705000007_auth_hook_custom_claims.sql
20260704000003_soft_delete_audit.sql       20260705000008_service_role_grants.sql
20260704000004_rls_performance_indexes.sql 20260705000009_fix_trigger_gotrue_timing.sql
20260705000005_grants_and_missing_rls.sql  20260705000010_fix_auth_hook_client_id.sql  ← 🧪 EXPERIMENTAL
```
### Toolkit OFICIAL (6 + gate)
```
verify_identity_infra.sql   verify_clean_state.sql
test_migrations.mjs         test_clientes_dal.mjs   test_clientes_dal_auth.mjs
bootstrap_admin.mjs         validate_migrations.py   (gate estático)
```
### LEGACY (no borrar; ver abajo)
```
align_admin_user.sql   verify_admin_user.sql   bootstrap_staging.sql   seed.sql
```
### Otros
```
config.toml   README.md   seed/ (10 archivos modulares)   factories/   .temp/ (ya NO versionado)
```

## `docs/`
- `docs/adr/` — ADR-001 … ADR-011 (arquitectura congelada).
- `docs/architecture.md`, `docs/database-policy.md`, `docs/roadmap.md`, `docs/backlog.md`, `docs/principles.md`.
- `docs/sprints/` — `sprint-02.md`.
- **`docs/release/`** — este set de documentos del RC1.

## Scripts LEGACY — por qué existen y por qué ya no son oficiales
| Archivo | Qué resolvía | Por qué es legacy |
|---|---|---|
| `align_admin_user.sql` | Alinear manualmente el UUID del admin del seed con `auth.users` | Superado por el flujo oficial (Admin API → Trigger). Solo bootstrap de emergencia. |
| `verify_admin_user.sql` | Verificación temprana Auth↔modelo | Superado por `verify_identity_infra.sql` + `verify_clean_state.sql`. |
| `bootstrap_staging.sql` (97 KB) | Dump consolidado 0001-0003+seed para pegar en el SQL Editor (Sprint 1B) | Superado por el flujo CLI `db push`. Artefacto generado. |
| `seed.sql` | Seed en un solo archivo | Superado por `seed/` modular (orden en `config.toml`). |

## Variables necesarias
Ver [SETUP.md](SETUP.md) §2 y [DEPENDENCY_MANIFEST.md](DEPENDENCY_MANIFEST.md).
