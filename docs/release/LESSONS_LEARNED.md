# LESSONS_LEARNED · FPlus

> Aprendizajes técnicos y de proceso. Cada uno costó tiempo real de diagnóstico; están aquí para que ninguna IA
> ni desarrollador futuro los repita.

## Técnicos (Supabase / Postgres)

1. **RLS es una 2ª capa sobre los GRANTs.** Sin `GRANT` a `anon`/`authenticated`/`service_role`, la query da
   `42501 permission denied` **antes** de evaluar RLS — incluso con una policy `using(true)`. Las tablas creadas
   por migración **no** auto-otorgan permisos.
2. **GoTrue aplica `app_metadata` en un UPDATE posterior al INSERT.** Un trigger `AFTER INSERT` sobre `auth.users`
   NO ve el `app_metadata` de `admin.createUser`. Solución: `AFTER INSERT OR UPDATE OF raw_app_meta_data` (migr. 0009).
3. **El SQL Editor corre como `postgres`**, que ignora RLS y tiene todos los permisos. Probar el hook "como
   funciona" ahí es engañoso: hay que probar como `supabase_auth_admin` (o usar `has_*_privilege`).
4. **`set role supabase_auth_admin` está bloqueado** en el SQL Editor (`42501 permission denied to set role`).
   Usar `has_schema_privilege`/`has_table_privilege`/`has_function_privilege` como proxy.
5. **Las Secret Keys nuevas (`sb_secret_…`) reemplazan al `service_role` JWT legacy.** supabase-js las acepta
   igual (agnóstico al formato); mapean a `service_role` (que tiene `bypassrls`).
6. **La Auth Admin API ≠ la Data API.** La Secret Key autoriza `createUser` en GoTrue aunque falten GRANTs de
   tabla; el mismo key falla en un `SELECT` de PostgREST si el rol no tiene GRANT.
7. **Errores enmascarados por logging incompleto.** `authErr.message` puede venir vacío (`{}`) en un
   `AuthRetryableFetchError`; hay que loguear `status`/`code`/`name`/full para ver la causa.
8. **`client_id` es un claim gestionado por GoTrue** (OAuth) — sobrescribirlo en el hook es un riesgo de colisión
   (hipótesis del ISSUE-001, aún no demostrada por fuente oficial).
9. **La fuente de verdad del estado de migraciones es el CLI** (`supabase_migrations.schema_migrations`) y el
   Dashboard — **no** la REST API.
10. **PGlite** permite validación de ejecución real (Postgres WASM) sin Docker; hay que stubbear `auth.users`,
    los roles (`anon`, `authenticated`, `service_role`, `supabase_auth_admin`) y `auth.jwt()`.
11. **El método oficial para ver un 500 de auth** es el **Postgres Log / Auth Log** (Log Explorer); el error real
    no llega al cliente.

## De proceso

12. **Evidencia antes que hipótesis.** Cada migración respondió a un error real reproducido, no a una suposición.
13. **Corrección mínima.** Se resolvió un problema demostrado a la vez; nunca se preparó infraestructura futura.
14. **No acumular scripts de un solo uso.** El toolkit de verificación está congelado; los diagnósticos se
    incorporan a scripts existentes o se descartan (se eliminó un `diag_*.mjs` creado de más).
15. **Congelar decisiones en ADR.** Evita re-litigar la arquitectura; cualquier cambio requiere un nuevo ADR.
16. **La raíz del proyecto es `/Users/jamil/AgencyOs`**, no la primaria `/Users/jamil/Pailux`. Rutas relativas a
    AgencyOs; si el cwd no corresponde, avisar antes de continuar.
17. **Distinguir "aplica sin error" de "funciona".** Las pruebas end-to-end (bootstrap real, simulación GoTrue en
    PGlite) atraparon problemas que la validación estática no veía.
