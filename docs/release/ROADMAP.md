# ROADMAP · FPlus

> Dónde estamos y qué sigue. El "ahora" es el RC1 (freeze de identidad).

## Estado actual (RC1)
Infraestructura de identidad congelada (0001–0009), validada hasta `public.users`. Login real bloqueado por
ISSUE-001. Ningún módulo conectado a datos reales todavía (todos en mock).

## Inmediato — cerrar el login (desbloquear Sprint 2)
1. **Resolver ISSUE-001** (`POST /token 500`): obtener el error exacto del hook en Postgres Logs → decidir el fix
   definitivo (probablemente namespacing del claim `client_id`, evaluando si la 0010 se promueve o se descarta).
2. Con el login funcionando: validar `test_clientes_dal_auth.mjs` (JWT con `agency_id/rol` + RLS filtrando).

## Sprint 2 — conexión módulo por módulo (orden congelado)
Clientes → Dashboard → Brief → Contratos → Cronopost → Aprobaciones → Multimedia → Campañas → Métricas.
Por cada módulo: verificar estado → conectar DAL → validar lectura → validar escritura → validar RLS → integrar
UI → prueba end-to-end → congelar módulo. Lecturas antes que escrituras.

## Auth real en el frontend
Reemplazar `DemoLogin` por Supabase Auth: login, recuperación de contraseña, activación por invitación. Crear
usuarios reales alineando `auth.users.id` con `public.users` vía el flujo oficial (Admin API → Trigger).

## Storage (fase posterior)
Buckets (`media`) con policies por tenant; `mediaService` con adaptador (Supabase → R2 futuro, ADR-009). La BD
guarda `object_key` + metadata.

## Sprint 3+ — Integraciones y IA
Conectores de APIs de pauta (Meta/Google/TikTok/LinkedIn) vía Edge Functions; IA real (Andrómeda). Métricas
reales llegan aquí.

## Largo plazo (multi-tenant a 5–10 años)
Múltiples agencias self-serve, SSO empresarial (Google/Microsoft), portal de clientes, billing (Stripe),
CI/CD de migraciones (merge → Staging → aprobación → Producción).

## Qué NO está en el roadmap sin un ADR
Cambiar el modelo de identidad, el tenant (agencia), la fuente de verdad (`app_metadata`), o el patrón DAL.
