# ARCHITECTURE_FREEZE · FPlus RC1

> Lo que queda **oficialmente congelado**. Cambiarlo requiere un **nuevo ADR** con justificación técnica fuerte.

## Alcance del freeze

La **arquitectura de identidad** (ADR-011) y toda la base sobre la que se apoya (ADR-001 a 010).
La identidad oficial **termina en la migración 0009**. La **0010 es experimental** y NO está congelada.

## Componentes congelados

| Componente | Definido en | Regla |
|---|---|---|
| Trigger `handle_new_user` | migr. 0006 + 0009 | Solo aprovisiona `public.users`. Idempotente. Sin lógica de negocio. |
| Auth Hook `custom_access_token_hook` | migr. 0007 | Construye los claims leyendo `public.users`. Todo claim nuevo evoluciona AQUÍ, no en el Trigger. |
| Modelo de tenant | ADR-003/011 | La agencia es el tenant. Todo depende de `agency_id`. |
| Fuente de verdad del contexto | ADR-011 Regla 1 | `app_metadata` (servidor). Nunca `user_metadata` ni frontend. |
| UUID canónico | ADR-011 Regla 4 | `auth.users.id`. `public.users` lo refleja. Sin sincronización manual como flujo normal. |
| Separación de responsabilidades | ADR-011 Regla 6 | Trigger / Auth Hook / Backend-DAL / Edge Functions, cada uno en su carril. |
| Claims oficiales | ADR-011 | `agency_id`, `rol`, `client_id` (en español `rol`, no `role`). |
| RLS | ADR-006 | Aislamiento en la BD. RLS es 2ª capa sobre GRANTs. |
| DAL | ADR-004 | Frontend desacoplado; solo `src/fplus/services/` toca supabase-js. |
| Entornos | ADR-010 | Staging-first; solo lo validado pasa a Producción. |

## Las 9 reglas/ajustes del ADR-011 (resumen)

1. `app_metadata` = fuente única de `agency_id/rol/client_id`.
2. Trigger mínimo: solo sincroniza identidad (no crea agencias/clientes/negocio, no manda emails, no llama APIs).
3. El tenant siempre es la agencia.
4. UUID canónico = `auth.users.id`.
5. Preparada para crecer: multi-agencia, portal cliente, invitaciones, Google/Microsoft/SSO — sin rediseño.
6. Separación de responsabilidades (tabla arriba).
7. Trigger idempotente (`ON CONFLICT (id) DO NOTHING`).
8. Observabilidad mínima del Trigger (`RAISE LOG`, sin lógica de negocio).
9. Separación evolutiva: claims nuevos → solo Auth Hook, nunca el Trigger.

## Qué NO está congelado (abierto / experimental)

- El **fix definitivo del ISSUE-001** (login 500). La 0010 es solo una hipótesis en investigación.
- La conexión de los 9 módulos al DAL (Sprint 2 en curso).
- Storage, Auth real en frontend, conectores de APIs de pauta (Sprint 3+).

## Prohibiciones del RC1

No refactorizar, renombrar, mover, optimizar "porque sí", ni actualizar dependencias sobre lo congelado.
No reescribir historia Git. No mezclar la 0010 con el freeze.
