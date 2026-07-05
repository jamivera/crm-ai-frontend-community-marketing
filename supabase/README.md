# FPLUS — Flujo oficial de migraciones (Supabase CLI)

Flujo profesional de despliegue de base de datos. **Los mismos comandos aplican a Staging y a
Producción** → paridad garantizada y **historial completo de migraciones** preservado.

`bootstrap_staging.sql` NO es el flujo principal: es solo herramienta de recuperación/instalación rápida.

## Requisitos (una vez, en tu máquina)

- **Supabase CLI:** `brew install supabase/tap/supabase` (macOS).
- **Cliente psql:** normalmente ya instalado; si no, `brew install libpq` y añádelo al PATH.
- **Access Token:** supabase.com → Account → Access Tokens (para `supabase login`).
- **Contraseña de la base:** la que definiste al crear el proyecto (queda solo en tu máquina).

## Despliegue a un entorno (Staging o Producción)

```bash
# 0. Desde la raíz del repo (donde está la carpeta supabase/)
supabase login                                   # pega tu Access Token

# 1. Enlazar el proyecto (pide la contraseña de la base)
supabase link --project-ref <PROJECT_REF>        # staging: rbhorgjriovyyeurzuiy

# 2. Aplicar las migraciones versionadas (registra el historial en el remoto)
supabase db push

# 3. Confirmar que quedaron aplicadas
supabase migration list                          # 0001/0002/0003 deben figurar como aplicadas

# 4. Ejecutar el Seed modular (idempotente, con \ir)
#    Connection string: Dashboard → Settings → Database → Connection string (URI)
psql "<CONNECTION_STRING>" -f supabase/seed.sql   # imprime el resumen al final
```

> El `CONNECTION_STRING` contiene la contraseña de la base: se usa solo en tu terminal, nunca se
> comparte ni se sube al repo.

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
