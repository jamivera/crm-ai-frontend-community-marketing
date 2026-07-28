# KNOWN_ISSUES · FPlus RC1

> Solo problemas **reales demostrados con evidencia**. No hipótesis presentadas como hechos.

---

## ISSUE-001 · `POST /token` devuelve HTTP 500 al ejecutar el Custom Access Token Hook

- **Severidad:** Alta (bloqueaba el login real de usuarios).
- **Estado:** ✅ **Resuelto.**
- **Solución:** Se implementó un espacio de nombres (*namespacing*) para el claim de cliente, renombrándolo de `client_id` a `fplus_client_id` en los claims del token de acceso (evitando la colisión con el claim reservado `client_id` de GoTrue) y redefiniendo el helper RLS `auth_client_id()` para leer este nuevo claim. Esto se materializó en la migración `20260711000001_namespace_client_id.sql`.

### Síntoma original (evidencia)
Tras registrar el hook y hacer login real (`test_clientes_dal_auth.mjs`), la emisión del token fallaba con:
```
POST /token → status: 500
name: AuthRetryableFetchError
message: {}
```

### Diagnóstico confirmado
GoTrue valida el claim reservado `client_id` para flujos OAuth. Al sobrescribirlo con `null` o con un valor no reconocido por GoTrue (el UUID del cliente del portal), el servidor de autenticación fallaba internamente y devolvía HTTP 500. Al usar `fplus_client_id` (namespaced) no hay colisión, y GoTrue emite el token exitosamente con los claims requeridos por RLS.

### Validación
Verificado localmente mediante PGlite (`node supabase/test_migrations.mjs`) y de manera integrada contra Staging (`node supabase/test_clientes_dal_auth.mjs`), obteniéndose un login exitoso y RLS operando correctamente.

---

## Observaciones menores (no bloqueantes)

- **Doble lockfile** trackeado: `package-lock.json` y `pnpm-lock.yaml`. Elegir uno en el futuro (no se tocó en el RC1 por regla de no cambiar dependencias).
- **i18n `journey.json`** contienen cadenas tipo-JWT (`eyJ…`) — muy probablemente datos de ejemplo; conviene una verificación humana rápida antes de hacer público el repo.
- `supabase/bootstrap_staging.sql` y `supabase/seed.sql` son artefactos legacy (ver `PROJECT_INVENTORY.md`).
