# SYSTEM_SNAPSHOT · FPlus

> Foto exacta del entorno técnico en el momento del congelamiento. Sirve para reconstruir el entorno en años.

## Congelamiento
| Campo | Valor |
|---|---|
| Fecha snapshot | 2026-07-10 21:07 (-05) |
| Fecha del freeze (commit) | 2026-07-06 |
| Versión / tag propuesto | `rc1` (FPlus Project Preservation Package) |
| Branch | `main` |
| Último commit | `5a336eb fix(auth): finalize custom access token hook` |
| Hash completo | `5a336eb5684f0dc144b2e18290e0de5b89292e18` |

## Entorno de desarrollo
| Herramienta | Versión |
|---|---|
| Sistema operativo | Darwin 25.5.0 x86_64 (macOS) |
| Node.js | v24.15.0 |
| npm | 11.12.1 |
| pnpm | **no instalado** (⚠️ existe `pnpm-lock.yaml` versionado, pero el gestor activo es npm) |
| Supabase CLI | 2.109.0 |
| `@supabase/supabase-js` | 2.110.0 |
| Python | 3 (para `validate_migrations.py`; sin dependencias externas) |

## Backend (Supabase)
| Campo | Valor |
|---|---|
| Proyecto Staging | `rbhorgjriovyyeurzuiy` |
| Región | `us-east-1` |
| Motor | PostgreSQL 15 (gestionado) |
| Auth | GoTrue (Custom Access Token Hook registrado) |
| Entornos | `fplus-staging` (activo) + `fplus-production` (staging-first) |

## Estado Git en el snapshot
- Árbol base **limpio** (trabajo commiteado en `5a336eb`).
- Cambios preparados para el commit RC1 (aún **no** commiteados): `docs/release/` (documentación), `.gitignore`
  (añade `supabase/.temp`/`.branches`), y `git rm --cached` de `supabase/.temp/*`.

## Dependencias
Fuente de verdad: `package.json` + `package-lock.json`. Stack: React 19, TypeScript strict, Vite, TailwindCSS 4,
Zustand, React Router 7. Testing: Vitest, Playwright. Ver `DEPENDENCY_MANIFEST.md`.

## Notas de reconstrucción
- Usar **npm** (hay doble lockfile; `pnpm-lock.yaml` es legacy y pnpm no está instalado aquí).
- La Supabase CLI puede haber avanzado de versión; los comandos usados (`link`, `db push --include-seed`,
  `migration list`) son estables. Ver `SETUP.md`.
- Las claves (publishable/secret) son propias de cada proyecto Supabase; regenerar/rellenar en `.env.staging`.
