# PROJECT_MEMORY · FPlus

> La memoria viva del proyecto: cómo nació, qué problema resuelve, qué visión persigue y qué NUNCA debe llegar a ser.
> Escrito para que, sin el chat, se entienda el "alma" del proyecto — no solo su código.

## Cómo nació FPlus
FPlus nació de una necesidad real de **Primero Digital**, una agencia de marketing: gestionar el ciclo completo de
contenido y pauta de sus clientes (planificación, producción, aprobación, publicación, métricas) en un solo lugar,
con roles y un portal para que cada cliente vea lo suyo. En vez de construir desde cero, se decidió partir de un
CRM open-source sólido — **Evo CRM Community** — y montar encima una capa propia, `/fplus/*`.

## El problema inicial
El trabajo de una agencia estaba disperso (hojas de cálculo, chats, herramientas sueltas). No había una **fuente
única de verdad** por cliente, ni un flujo de aprobación trazable, ni separación limpia entre lo que ve la agencia
y lo que ve el cliente. Y cualquier solución tenía que servir a **muchas agencias**, no solo a una.

## La visión
Un **Marketing Operating System**: SaaS multi-tenant donde **cada agencia** administra sus clientes, contenido,
campañas y métricas, con aislamiento fuerte de datos, escalable a **5–10 años** y a miles de agencias. Primero
Digital es el primer tenant, no el único cliente.

## Por qué AgencyOS (el repo)
El proyecto vive en `/Users/jamil/AgencyOs` porque FPlus es una **plataforma para agencias** ("Agency OS"),
construida sobre Evo CRM. El nombre refleja la ambición: no una herramienta puntual, sino el sistema operativo del
día a día de una agencia.

## Qué queríamos construir
- Un producto **independiente y multi-tenant** desde el día uno (no una app de un solo cliente).
- Aislamiento de datos **en la base de datos** (RLS), no confiado a la aplicación.
- Una identidad robusta: usuarios reales de agencias y clientes, con roles, invitaciones y (a futuro) SSO.
- Una arquitectura que **no haya que rediseñar** cuando lleguen SSO, Storage, billing o las APIs de pauta.

## La filosofía que seguimos
**Evidencia → Diagnóstico → Corrección mínima → Validación.** Cada pieza de infraestructura respondió a un
problema **demostrado con una prueba real**, nunca a una suposición. Nada de construir "por si acaso". Cada
decisión estratégica se congeló como ADR. El conocimiento se documenta para no depender de la memoria.

## Qué NO queremos que el producto llegue a ser
- Un sistema donde el **aislamiento entre agencias** dependa de la lógica de la app (debe vivir en la BD, RLS).
- Un producto donde el **usuario** sea el dueño de los datos (el dueño es la **agencia**; los usuarios cambian).
- Una base con **secretos en el frontend** o donde el cliente decida su tenant/rol.
- Un monolito acoplado a Supabase imposible de mover (por eso el DAL desacopla al proveedor).
- Un proyecto cuyo conocimiento viva solo en la cabeza de alguien o en un chat.

## Principios que ninguna IA futura debe romper
1. La **agencia es el tenant**. Todo cuelga de `agency_id`.
2. `agency_id/rol/client_id` viajan **solo** en `app_metadata` (servidor), nunca en `user_metadata` ni desde el frontend.
3. El **UUID canónico** de un usuario es `auth.users.id`.
4. El **Trigger** solo aprovisiona identidad; los **claims** evolucionan solo en el **Auth Hook**.
5. El **frontend nunca** habla con supabase-js directo; solo el **DAL**.
6. Cada cambio de infraestructura nace de **evidencia**, se corrige al **mínimo** y se **valida**.
7. Las decisiones estratégicas se **congelan en ADR**; no se re-litigan sin uno nuevo.
