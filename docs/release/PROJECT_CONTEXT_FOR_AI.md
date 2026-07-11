# PROJECT_CONTEXT_FOR_AI · FPlus

> **Léeme primero si eres una IA (o un dev) que nunca vio este proyecto.** Contexto mínimo para no romper nada.

## Qué es
FPlus = **Marketing OS multi-tenant** para agencias de marketing, construido como capa `/fplus/*` sobre **Evo CRM
Community**. Backend: **Supabase** (Postgres 15 + Auth + RLS). Primer tenant: **Primero Digital**. Horizonte 5–10 años.

## Dónde
- **Raíz oficial: `/Users/jamil/AgencyOs`** (NO `/Users/jamil/Pailux`). Rutas relativas a AgencyOs.
- Código FPlus en `src/fplus/`; DAL en `src/fplus/services/`. BD en `supabase/`.

## Las 10 cosas que NO debes hacer
1. No pongas `agency_id/rol/client_id` en `user_metadata` ni los aceptes del frontend. **Solo `app_metadata`.**
2. No hagas que el usuario sea el tenant. **El tenant es la agencia** (`agency_id`).
3. No generes un UUID propio en `public.users`. El canónico es **`auth.users.id`**.
4. No metas lógica de negocio en el **Trigger** (solo aprovisiona identidad).
5. No agregues claims nuevos en el Trigger. **Los claims evolucionan en el Auth Hook.**
6. No importes `supabase-js` en el frontend. **Solo el DAL** (`src/fplus/services/`) lo hace.
7. No pongas la **Secret Key** en el frontend ni en el repo. Solo en `.env` local / servidor.
8. No crees migraciones "por si acaso". **Cada migración responde a un problema demostrado.**
9. No crees scripts de diagnóstico de un solo uso. El **toolkit está congelado**.
10. No trates la **migración 0010** como una solución. Es **experimental, no validada**.

## La metodología (obligatoria)
**Evidencia → Diagnóstico → Corrección mínima → Validación.** Antes de cambiar algo: reproduce el problema con
evidencia; diagnostícalo; aplica el cambio mínimo; valida (estático + ejecución real). Congela decisiones en ADR.

## Estado en una línea
Identidad congelada (0001–0009), validada hasta `public.users`. **Login real bloqueado** por `POST /token 500`
(ISSUE-001). Ningún módulo conectado a datos reales aún.

## Mapa de lectura recomendado
1. Este archivo → 2. `AI_HANDOVER.md` → 3. `ARCHITECTURE.md` → 4. `ARCHITECTURE_DECISIONS.md` →
5. `DATABASE_MANIFEST.md` → 6. `KNOWN_ISSUES.md` → 7. `MIGRATION_JOURNAL.md` → 8. `PROJECT_STATUS.md`.

## Cómo verificar que entendiste el estado (sin tocar nada)
```bash
python3 supabase/validate_migrations.py    # gate estático → verde
node supabase/test_migrations.mjs          # ejecución real (PGlite) → verde, incluye flujo de identidad
```
