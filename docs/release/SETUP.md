# SETUP · FPlus

> Cómo un desarrollador clona el repo y reproduce **exactamente** este estado. Incluye pasos manuales del Dashboard.

## 0 · Prerrequisitos
- Node.js (ver `package.json` engines) · Supabase CLI · una cuenta Supabase con un proyecto (o los proyectos
  `fplus-staging` / `fplus-production`). Región `us-east-1`.
- **Raíz del proyecto:** `/Users/jamil/AgencyOs` (todas las rutas son relativas a aquí).

## 1 · Clonar e instalar
```bash
git clone https://github.com/jamivera/crm-ai-frontend-community-marketing.git
cd crm-ai-frontend-community-marketing
npm install            # (hay doble lockfile npm/pnpm; usar uno de forma consistente)
```

## 2 · Variables de entorno
Copiar las plantillas y rellenar (los `.env` reales están gitignored):
```bash
cp .env.staging.example .env.staging
```
Variables:
| Variable | Uso | Sensibilidad |
|---|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto | pública |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | frontend / DAL (rol anon/authenticated) | pública |
| `SUPABASE_SERVICE_ROLE_KEY` | **solo** `bootstrap_admin.mjs` (Secret Key `sb_secret_…`) | 🔴 SECRETA — nunca al repo ni al frontend |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | admin real para bootstrap/login | 🔴 local |
| `VITE_APP_ENV` | `staging` / `production` | — |

## 3 · Base de datos (Staging)
```bash
supabase login
supabase link --project-ref <staging-ref>       # p. ej. rbhorgjriovyyeurzuiy
supabase db push --include-seed                  # aplica migraciones 0001–0009 (+0010 experimental) + seed
supabase migration list                          # verificar Local == Remote
```
> Nota: la 0010 es experimental; si quieres el freeze puro, revisa `KNOWN_ISSUES.md` antes de aplicarla.

## 4 · Verificar la infraestructura (toolkit)
En el **SQL Editor** de Staging:
- `supabase/verify_identity_infra.sql` — funciones, trigger, permisos del hook, policy, prueba funcional.
- `supabase/verify_clean_state.sql` — estado limpio antes del bootstrap (auth.users=0, public.users=seed).

Local (sin Docker):
```bash
python3 supabase/validate_migrations.py     # gate estático
node supabase/test_migrations.mjs           # ejecución real (PGlite) + flujo de identidad
```

## 5 · Configuración manual en el Dashboard (¡obligatoria!)
1. **Auth → Hooks → Customize Access Token (JWT) Claims** → tipo **Postgres**, schema `public`, function
   `custom_access_token_hook`. (Sin esto, el JWT no lleva claims.)
2. **Auth → Sign In / Providers** → **deshabilitar** "Allow new users to sign up" (no signup abierto).

## 6 · Bootstrap del primer admin (flujo oficial)
Con `SUPABASE_SERVICE_ROLE_KEY` + `ADMIN_EMAIL` + `ADMIN_PASSWORD` en `.env.staging`:
```bash
node supabase/bootstrap_admin.mjs           # Admin API → auth.users → Trigger → public.users
```
Esperado: `ids_coinciden: true`, `rol: agency_admin`.

## 7 · Validar login end-to-end
```bash
node supabase/test_clientes_dal_auth.mjs
```
⚠️ **Actualmente falla con `POST /token 500` (ISSUE-001).** El login real aún no funciona; ese es el punto abierto.

## 8 · Frontend
```bash
npm run dev        # levanta la app (mock mode por defecto hasta conectar módulos)
```

## Comandos útiles
| Comando | Qué hace |
|---|---|
| `npm run dev` | dev server |
| `npm run validate:migrations` | gate estático de migraciones |
| `npm run test:migrations` | ejecución real en PGlite |
| `supabase db push` | aplica migraciones pendientes |
| `supabase migration list` | compara local vs remoto |
