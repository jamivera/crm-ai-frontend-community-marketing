# KNOWN_ISSUES · FPlus RC1

> Solo problemas **reales demostrados con evidencia**. No hipótesis presentadas como hechos.

---

## ISSUE-001 · `POST /token` devuelve HTTP 500 al ejecutar el Custom Access Token Hook

- **Severidad:** Alta (bloquea el login real de usuarios).
- **Estado:** 🔴 **En investigación · No resuelto · No confirmado.**
- **No bloquea:** el empaquetado del RC ni el aprovisionamiento de identidad (que sí funciona hasta `public.users`).

### Síntoma (evidencia)
Tras registrar el hook y hacer login real (`test_clientes_dal_auth.mjs`), la emisión del token falla:
```
POST /token → status: 500
name: AuthRetryableFetchError
message: {}
```

### Qué YA se descartó con evidencia
| Causa candidata | Estado | Evidencia |
|---|---|---|
| Aprovisionamiento (Trigger → public.users) | ✅ descartada | bootstrap OK, `ids_coinciden=true` |
| Contrato del payload del hook (`user_id`, `claims`, return) | ✅ descartada | doc oficial vigente coincide exacto |
| Lógica de la función del hook | ✅ descartada | corre como `postgres` y devuelve claims |
| Permisos de `supabase_auth_admin` (schema/execute/select/policy) | ✅ descartada | `has_*` = true, policy `auth_admin_read` presente |
| Registro del hook en el Dashboard | ✅ hecho | estaba vacío; se registró |

### Hipótesis vigente (NO confirmada)
El hook sobrescribe el claim **`client_id`**, que GoTrue ya usa/gestiona en flujos OAuth
(aparece en el payload oficial). Para el admin (sin cliente) se ponía en `null`, lo que podría romper la
validación posterior de GoTrue. **No hay fuente oficial que demuestre esta relación específica.** Ver
`docs/adr` y `MIGRATION_JOURNAL.md`.

### Prueba experimental preparada (NO validada)
La migración **0010** (`fix_auth_hook_client_id`, en `supabase/migrations/`) deja de escribir `client_id`
cuando es null. **Es una investigación experimental, no una solución confirmada.** No forma parte del freeze
de identidad (que termina en 0009).

### Siguiente paso documentado
Obtener el **error exacto del hook en Postgres Logs** (método oficial de Supabase para 500 de auth) — es la
única fuente que confirma la causa raíz sin adivinar. Luego decidir el fix definitivo.

---

## Observaciones menores (no bloqueantes)

- **Doble lockfile** trackeado: `package-lock.json` y `pnpm-lock.yaml`. Elegir uno en el futuro (no se tocó en el RC1 por regla de no cambiar dependencias).
- **i18n `journey.json`** contienen cadenas tipo-JWT (`eyJ…`) — muy probablemente datos de ejemplo; conviene una verificación humana rápida antes de hacer público el repo.
- `supabase/bootstrap_staging.sql` y `supabase/seed.sql` son artefactos legacy (ver `PROJECT_INVENTORY.md`).
