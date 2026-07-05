# FPLUS — Flujo oficial de migraciones (Supabase CLI)

Flujo profesional de despliegue de base de datos. **Los mismos comandos aplican a Staging y a
Producción** → paridad garantizada y **historial completo de migraciones** preservado.

`bootstrap_staging.sql` NO es el flujo principal: es solo herramienta de recuperación/instalación rápida.

## Requisitos (una vez, en tu máquina)

- **Supabase CLI:** `brew install supabase/tap/supabase` (macOS).
- **Cliente psql:** normalmente ya instalado; si no, `brew install libpq` y añádelo al PATH.
- **Access Token:** supabase.com → Account → Access Tokens (para `supabase login`).
- **Contraseña de la base:** la que definiste al crear el proyecto (queda solo en tu máquina).

## Flujo oficial del proyecto

Flujo estándar por **migraciones versionadas** (nunca `reset`), igual en Staging y Producción.

> El CLI actual **no** tiene `supabase db seed` para datos. El seeding se ejecuta con
> `db push --include-seed`, que aplica migraciones **y** corre el seed de `config.toml [db.seed]` de forma
> **no destructiva**. (`supabase seed buckets` es solo para Storage.)

### Staging (con seed de desarrollo)

```bash
# 0. Desde la raíz del repo (donde está la carpeta supabase/)
supabase login                                   # pega tu Access Token

# 1. Enlazar el proyecto (pide la contraseña de la base)
supabase link --project-ref <PROJECT_REF>        # staging: rbhorgjriovyyeurzuiy

# 2. Migraciones + seed (no destructivo, CLI-nativo desde config.toml)
supabase db push --include-seed

# 3. Confirmar el historial aplicado
supabase migration list                          # 0001/0002/0003 como aplicadas
```

### Producción (solo migraciones, SIN seed de desarrollo)

```bash
supabase link --project-ref <PROD_REF>
supabase db push                                 # SIN --include-seed
supabase migration list
```

Mismo comando `db push`, misma migración → **paridad garantizada**. La única diferencia es el flag
`--include-seed`, que jamás se usa en Producción.

## `supabase db reset` — solo casos específicos

`reset` es **destructivo** y NO forma parte del flujo normal. Se reserva para: reconstrucción completa de
Staging, pruebas de instalación desde cero, validación de migraciones o recuperación de un entorno.
**Nunca en Producción.**

## Migraciones existentes

| Versión | Archivo | Contenido |
|---|---|---|
| 0001 | `20260704000001_initial_schema.sql` | Schema completo (32 tablas, enums, índices, vista) |
| 0002 | `20260704000002_rls_policies.sql` | Row Level Security (aislamiento agencia/cliente) |
| 0003 | `20260704000003_soft_delete_audit.sql` | Soft delete, `updated_at`, audit triggers, particiones |

## Nuevas migraciones (a futuro)

```bash
supabase migration new <nombre>     # crea supabase/migrations/<timestamp>_<nombre>.sql
# ... editas el SQL ...
supabase db push                    # la aplica en el entorno enlazado
```

Regla: **nunca** editar el schema a mano en el dashboard de un entorno. Todo cambio nace como migración
versionada, se prueba en Staging y se promueve a Producción con el mismo `db push` (Principio 15 / ADR-010).
