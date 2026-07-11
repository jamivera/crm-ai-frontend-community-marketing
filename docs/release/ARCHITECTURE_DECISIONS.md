# ARCHITECTURE_DECISIONS · FPlus

> No solo QUÉ se decidió, sino **POR QUÉ** y **qué alternativas se descartaron**. Los ADR formales viven en
> `docs/adr/` (ADR-001 a ADR-011); aquí está la versión narrada + las decisiones "negativas".

## Índice de ADR formales

| ADR | Decisión |
|---|---|
| 001 | Supabase como backend inicial |
| 002 | PostgreSQL como base de datos |
| 003 | Multi-tenant (shared DB + `agency_id`) |
| 004 | Data Access Layer (frontend desacoplado) |
| 005 | Edge Functions para operaciones con secretos |
| 006 | Row Level Security para aislamiento |
| 007 | Región `us-east-1` |
| 008 | Arquitectura desacoplada y modular |
| 009 | Storage (Supabase → Cloudflare R2 futuro) |
| 010 | Ambientes cloud staging-first |
| 011 | **Arquitectura oficial de identidad** (Trigger + Auth Hook + DAL + Edge) |

---

## Decisiones y sus alternativas descartadas

### ¿Por qué Supabase? (ADR-001)
**Elegido** porque ofrece Postgres gestionado + Auth + Storage + Realtime + RLS en una sola plataforma,
escalable a 5–10 años, PG-nativo.
- ❌ **Postgres crudo + auth propia:** reinventar Auth/Storage/RLS-tooling; más tiempo, más superficie de bugs.
- ❌ **Firebase:** NoSQL, sin SQL/RLS relacional; mal encaje con un modelo multi-tenant relacional.
- ❌ **Backend a medida (Node/Nest):** flexibilidad a costa de construir y mantener todo; innecesario al inicio.

### ¿Por qué un Trigger para el aprovisionamiento? (ADR-011)
Se necesitaba crear `public.users` cuando aparece un `auth.users`, sin drift, para cualquier origen.
**Elegido: Trigger `AFTER INSERT/UPDATE` sobre `auth.users`.**
- ❌ **Edge Function:** asíncrona → ventana de carrera (usuario autenticado sin fila) y drift si falla.
- ❌ **Backend/DAL como único mecanismo:** no cubre altas que no pasan por la API (SSO, invitación nativa, Dashboard) → drift.
- ❌ **Solo Auth Hook:** el Hook inyecta claims, **no crea filas**; no resuelve el aprovisionamiento.
- ✅ El Trigger es **atómico y agnóstico al origen** (signup, invitación, OAuth, SSO, Dashboard: todos pasan por `auth.users`).

### ¿Por qué el Auth Hook lee `public.users` y no `app_metadata`? (ADR-011 Regla 3)
Para que el **Backend** pueda cambiar rol/tenant actualizando el modelo, sin tocar Auth ni recrear usuarios;
el cambio se refleja al refrescar el token. `public.users` es la verdad de negocio.

### ¿Por qué `app_metadata` y no `user_metadata`? (ADR-011 Regla 1)
`app_metadata` lo fija el **servidor** (admin API / invitaciones). `user_metadata` es **editable por el usuario**
→ un usuario podría auto-asignarse agencia o rol. Seguridad de tenant.

### ¿Por qué la agencia es el tenant y no el usuario? (ADR-011 Regla 3)
Los usuarios cambian (entran/salen); la agencia permanece. Anclar los datos al usuario obligaría a re-asignar
propiedad cada vez que alguien se va. Todo cuelga de `agency_id`.

### ¿Por qué GRANTs explícitos por tabla y no `GRANT ALL`? (migr. 0005/0008)
Para **revisar exactamente** qué queda expuesto a cada rol y no otorgar permisos a tablas futuras por accidente.
- ❌ `GRANT ALL ON ALL TABLES`: cómodo pero opaco; arrastra tablas nuevas sin decisión consciente.
- ❌ `ALTER DEFAULT PRIVILEGES`: prepara permisos para tablas que aún no existen (infra por anticipado).
- ✅ Para `service_role` (rol de servidor de confianza) se otorgó **solo lo demostrado** (`agencies`, `users`).

### ¿Por qué staging-first y dos entornos cloud? (ADR-010)
- ❌ **DEV local (Docker) como principal:** no es idéntico a la nube; fricción de Docker por máquina.
- ❌ **Solo PROD:** inaceptable probar sobre datos de clientes reales.
- ✅ **Staging + Production, ambos cloud:** Staging idéntico a la infra real; solo lo validado sube a PROD.

### ¿Por qué la metodología Evidencia → Diagnóstico → Corrección mínima → Validación?
Porque el objetivo es un SaaS a 5–10 años **sobre evidencia, no supuestos**. Cada migración responde a un
problema **demostrado** con una prueba real; nunca se crea infraestructura por anticipado. Ver
[LESSONS_LEARNED.md](LESSONS_LEARNED.md). Alternativa descartada: "construir todo lo que probablemente
haga falta" → deuda y complejidad no justificadas.

### ¿Por qué se congela vía ADR y no "se cambia y ya"?
Para que ninguna decisión estratégica se re-litigue sin dejar rastro. Un cambio congelado solo se revierte con
un **nuevo ADR** documentado. Protege la coherencia a largo plazo.
