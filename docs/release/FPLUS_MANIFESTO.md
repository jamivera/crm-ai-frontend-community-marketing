# FPLUS_MANIFESTO

> El contrato de valores del proyecto. Si algo choca con este manifiesto, el manifiesto gana.

## La visión
FPlus es el **sistema operativo de una agencia de marketing**: multi-tenant, seguro, escalable a 5–10 años.
No una herramienta puntual, sino la plataforma donde vive el trabajo diario de muchas agencias.

## Principios
1. **La agencia es el tenant.** Los usuarios cambian; la agencia permanece.
2. **El aislamiento vive en la base de datos** (RLS), nunca en la aplicación.
3. **Una sola fuente de verdad** por dato: `app_metadata` para el contexto de identidad, `public.users` para el
   negocio, el CLI para el estado de migraciones.
4. **Desacoplamiento del proveedor:** el frontend habla con el DAL, no con Supabase.
5. **Seguridad por defecto:** secretos solo en el servidor; el frontend solo usa claves públicas.

## Valores técnicos
- **Multi-tenant real** desde el día uno, no adaptado después.
- **Reversibilidad:** migraciones documentadas y reversibles; nada de DDL manual en producción.
- **Reproducibilidad:** cualquiera puede reconstruir el entorno desde el repo (`SETUP.md`, `SYSTEM_SNAPSHOT.md`).
- **Observabilidad mínima** donde importa (p. ej. `RAISE LOG` en el Trigger), sin ruido.

## Valores de ingeniería
- **Evidencia sobre suposición.** No se cambia lo que no se ha reproducido.
- **Mínimo sobre máximo.** Se resuelve el problema demostrado, no el imaginado.
- **Explícito sobre implícito.** GRANTs por tabla, claims nombrados, decisiones en ADR.
- **Documentado sobre memorizado.** Si no está en el repo, no existe.

## Cómo tomamos decisiones
**Evidencia → Diagnóstico → Corrección mínima → Validación.** Y para lo estratégico: se evalúan alternativas, se
descarta con razón, se congela en un ADR. Ver `PROJECT_DECISIONS_INDEX.md`.

## Qué significa CALIDAD aquí
Que el sistema **haga lo correcto bajo aislamiento multi-tenant**, sea reproducible, y que su razonamiento quede
escrito. Calidad no es "código bonito"; es **corrección demostrada + conocimiento preservado**.

## Qué significa ARQUITECTURA aquí
Los límites que no se cruzan: identidad (Trigger/Hook), tenant (agencia/RLS), frontera del DAL, secretos
server-only. La arquitectura es lo que **no** cambia sin un ADR.

## Qué significa SIMPLICIDAD aquí
La pieza más pequeña que resuelve el problema **demostrado**. Un Trigger de 30 líneas que solo aprovisiona. Un
GRANT de dos tablas cuando el bootstrap solo lee dos. Simplicidad ≠ menos archivos; es **menos supuestos**.

## Qué significa EVIDENCIA aquí
Un error reproducido (código `42501`, `AuthRetryableFetchError 500`, un log de Postgres), una prueba de ejecución
en PGlite en verde, una consulta `has_*_privilege`. No "creo que"; **"se demostró que"**.

## Qué JAMÁS debe romper una IA
- Poner `agency_id/rol/client_id` fuera de `app_metadata`, o aceptarlos del frontend.
- Hacer del usuario el tenant, o generar un UUID propio en `public.users`.
- Meter lógica de negocio en el Trigger, o claims nuevos fuera del Auth Hook.
- Hacer que el frontend hable con supabase-js directo.
- Exponer la Secret Key.
- Cambiar algo congelado sin un nuevo ADR.
- Tratar la migración **0010** como una solución (es experimental, no validada).
- Crear infraestructura por anticipado o scripts de un solo uso.
