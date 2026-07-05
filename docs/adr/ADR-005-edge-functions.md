# ADR-005 — Edge Functions para operaciones con secretos

**Estado:** ✅ Aceptada · **Fecha:** 2026-07-04

## Contexto

FPlus debe integrarse con Meta, Google, TikTok, LinkedIn, OpenAI, Claude, Gemini, WhatsApp y más. Estas
integraciones requieren llaves secretas y, en algunos casos, cómputo del lado del servidor.

## Problema

Las llaves secretas **nunca** pueden estar en el navegador: cualquiera las extraería del bundle. Además,
recibir webhooks, enviar correos o correr sincronizaciones pesadas no puede depender del cliente.

## Alternativas evaluadas

- **Llamar a las APIs desde el frontend:** inaceptable — expone secretos y depende del navegador del usuario.
- **Backend dedicado (servidor propio) desde el día 1:** válido, pero añade infraestructura y operación antes de necesitarla.
- **Supabase Edge Functions (Deno serverless):** ejecución del lado del servidor, integrada con Supabase, con secretos seguros.

## Decisión

Todo lo que necesite **secretos o cómputo servidor** corre en **Edge Functions**: llamadas a APIs externas,
generación de IA, ingesta de webhooks, envío de correos, sincronización de métricas. El frontend solo invoca
`syncMetaAds()`, `aiGenerate()`… sin conocer los secretos.

## Consecuencias positivas

- Los secretos viven solo en el servidor (Supabase Vault / variables de entorno del runtime).
- Segunda capa del DAL: separación limpia entre CRUD (cliente, vía RLS) y operaciones privilegiadas (servidor).
- Escala serverless: sin servidores que administrar.
- Webhooks y sincronizaciones desacoplados de la sesión del usuario.

## Riesgos

- Límites de tiempo de ejecución de las funciones serverless para trabajos muy largos → mitigado con el sistema de `jobs`/queue (procesos largos se encolan).
- Deno tiene un ecosistema más pequeño que Node → aceptable para el alcance de las funciones.

## Evoluciones futuras

- Migrar funciones a un backend propio o a workers dedicados si la carga lo exige, sin cambiar el frontend (invoca el DAL).
