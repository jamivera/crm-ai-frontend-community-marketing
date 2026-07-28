# ADR-012 — Espacio de Nombres (Namespacing) del Claim de Cliente en el JWT

**Estado:** ✅ Aceptada · **Fecha:** 2026-07-11 · **Refina:** [ADR-011 Arquitectura de Identidad](ADR-011-arquitectura-identidad.md), [ADR-006 RLS](ADR-006-row-level-security.md)

## Contexto

La arquitectura de identidad de FPlus ([ADR-011](ADR-011-arquitectura-identidad.md)) establece la inyección de claims personalizados en el JWT (`agency_id`, `rol`, `client_id`) mediante un Custom Access Token Hook en Supabase Auth (GoTrue).
Al implementar el hook e intentar realizar el login autenticado real ([test_clientes_dal_auth.mjs](file:///Users/jamil/AgencyOs/supabase/test_clientes_dal_auth.mjs)), la llamada a `POST /token` devolvía un error HTTP 500 (`AuthRetryableFetchError`).

## Problema

El claim `client_id` es un claim estándar reservado y gestionado de manera interna por GoTrue en flujos OAuth para rastrear la aplicación cliente. Al escribir un claim personalizado con la clave `client_id` (que para usuarios colaboradores se establecía en `null` y para usuarios de portal cliente contenía la FK de su marca), se producía una colisión con el claim interno de GoTrue. Esto desencadenaba una excepción de tipado y validación de JWT en el backend de GoTrue, retornando un error HTTP 500 y bloqueando por completo la autenticación de los usuarios.

## Alternativas evaluadas

*   **Evitar la inyección cuando sea nulo (Migración 0010 experimental):** Dejar de inyectar el claim `client_id` si el usuario no tiene marca asociada (`client_id IS NULL`).
    *   *Desventaja:* Aunque solucionaba el login para administradores y colaboradores de la agencia, mantenía el riesgo de colisión para los usuarios del portal cliente que sí inyectaban un UUID en `client_id`, rompiendo potencialmente flujos futuros de OAuth/SSO o la integridad del JWT de GoTrue.
*   **Espacio de nombres (Namespacing) del claim (Elegida):** Cambiar el nombre del claim personalizado de `client_id` a `fplus_client_id` en el JWT.
    *   *Ventaja:* Evita de manera definitiva la colisión con claims reservados del motor de autenticación, permitiendo la inyección segura de valores tanto nulos como UUIDs. Además, se alinea con la convención del frontend de FPlus, que ya esperaba el atributo `fplus_client_id` en `user.custom_attributes`.

## Decisión

Se adopta como estándar técnico el **espacio de nombres (namespacing)** para el claim de cliente. El token de acceso contendrá el claim personalizado `fplus_client_id` en lugar de `client_id`.

Se ejecutan las siguientes acciones asociadas en la migración `20260711000001_namespace_client_id.sql`:
1.  Actualizar la función de RLS helper `auth_client_id()` para extraer `fplus_client_id` de la estructura del JWT.
2.  Redefinir `custom_access_token_hook()` para inyectar `fplus_client_id` en lugar de `client_id`.

## Consecuencias positivas

*   **Estabilidad del Login:** Resolución definitiva de ISSUE-001 y restablecimiento del inicio de sesión.
*   **Seguridad y sin colisiones:** Aislamiento absoluto de claims personalizados frente a claims estándar de GoTrue, asegurando la escalabilidad para futuros SSO/OAuth.
*   **Consistencia Frontend-BD:** Alineación exacta con los hooks del cliente web de FPlus que consumían `fplus_client_id`.

## Riesgos

*   **Desactualización de políticas antiguas:** Cualquier política de RLS que consultara directamente `auth.jwt() ->> 'client_id'` quedaría rota. Mitigado porque todas las policies de negocio en RLS consultan a través del helper encapsulado `auth_client_id()`, por lo que cambiar el helper protege a toda la base de datos de manera automática.

## Evoluciones futuras

*   Mantener el principio de namespacing (`fplus_*`) para cualquier nuevo claim de negocio que se requiera inyectar en el JWT en el futuro (por ejemplo, planes de facturación o flags de características especiales), protegiendo al sistema de colisiones futuras conforme GoTrue evolucione.
