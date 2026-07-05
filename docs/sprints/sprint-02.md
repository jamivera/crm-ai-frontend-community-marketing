# Sprint 2 — Conexión a datos reales (de mocks a Supabase)

> **Fases del roadmap:** 3 (Auth), 4 (Storage), 5 (Migración Frontend), 6 (Portal Cliente).
> **Regla:** todo respeta la [Arquitectura v1.0](../architecture.md), la [Política de BD](../database-policy.md)
> y los [Principios](../principles.md). Migración **incremental, módulo por módulo**, app siempre funcional.

## Objetivo

Conectar FPlus a la base de datos real de Staging: reemplazar progresivamente los mocks por consultas reales,
manteniendo la aplicación funcional en todo momento y validando cada módulo conforme se conecta.

## Alcance

**Dentro:** acceso autenticado a la BD (grants), Auth real (login, recuperación, invitaciones), Storage +
buckets, DAL completo sobre Supabase, migración de los 9 módulos (lecturas y escrituras), validación por módulo.

**Fuera (Sprint 3+):** conectores de APIs de pauta (Meta/Google/TikTok/LinkedIn), IA real. El módulo Métricas
se conecta a los datos del seed; los datos reales de pauta llegan con las APIs después.

---

## Estrategia para "app siempre funcional"

El riesgo central: el **mock usa IDs string (`cl3`)** y la **BD usa UUIDs**. Mezclar ambos rompe relaciones
(un cliente real UUID no encuentra contenido mock `cl3`). Mitigación:

- **Interruptor global `real mode`** (vía `hasSupabase()` + sesión activa). Apagado → comportamiento mock
  actual intacto (fallback seguro). Encendido → los datos vienen del DAL.
- El **seed es completo y consistente** (clientes, briefs, contenido, campañas, métricas con UUIDs y
  relaciones intactas). Por eso, al encender `real mode`, cada módulo muestra datos reales coherentes — no hay
  estado "vacío" ni mezclado.
- Migramos **módulo por módulo dentro de `real mode`**: conectamos el DAL de un módulo, lo validamos contra el
  seed, y solo entonces pasamos al siguiente. El **mock mode permanece intacto** como fallback hasta que todos
  los módulos estén validados en real.
- Regla de oro: **lecturas antes que escrituras** por módulo (menor riesgo primero).

---

## Fases

### Fase 0 — Verificación del seed (Dashboard)
- **Objetivo:** confirmar integridad de los datos cargados.
- **Tareas:** conteo de registros por tabla en el Dashboard SQL Editor; comparar con los valores esperados.
- **DoD:** los conteos coinciden (agencies=1, clients=5, users=11, content_pieces=20, …).

### Fase 1 — Acceso autenticado a la BD  ·  **migración 0005**
- **Problema real ya detectado:** los roles `anon`/`authenticated` no tienen GRANTs → `42501 permission
  denied`; y 4 tablas (`agencies`, `user_clients`, `user_invitations`, `webhook_logs`) no tienen RLS.
- **Tareas (migración 0005 `grants_and_missing_rls`):**
  1. RLS + policies en las 4 tablas sin protección.
  2. `GRANT` al rol `authenticated` (RLS filtra las filas); `anon` sin acceso salvo referencia pública.
  3. Policies **WITH CHECK** para INSERT/UPDATE (necesarias para que las escrituras del DAL pasen RLS).
  4. `alter default privileges` para tablas futuras.
- **Validación:** `npm run validate:migrations` + `npm run test:migrations` (ejecución real en PGlite) antes del push.
- **DoD:** un usuario `authenticated` puede leer/escribir sus datos (RLS filtra); ningún cross-tenant.

### Fase 2 — Auth real  ·  **migración 0006**
- **Tareas:**
  1. Migración 0006 `auth_hook`: función del **Custom Access Token Hook** que inyecta `agency_id`, `rol`,
     `client_id` en el JWT leyendo `public.users` del usuario que inicia sesión.
  2. Habilitar el hook en el Dashboard (Auth → Hooks) — paso guiado.
  3. Crear los usuarios reales en Supabase Auth y alinear su `id` con los `public.users` del seed.
  4. Reemplazar `DemoLogin` por Supabase Auth: login, recuperación de contraseña, activación por invitación.
- **DoD:** login real de agencia y de cliente; el JWT lleva los claims; RLS filtra correctamente por rol.

### Fase 3 — Storage
- **Tareas:** crear buckets (`media`) con policies por tenant; implementar `mediaService` (upload,
  getUrl) con el adaptador (Supabase→R2 futuro); la BD guarda solo `object_key` + metadata.
- **DoD:** subir un archivo lo guarda en Storage; la pieza lo muestra vía `getMediaUrl()`.

### Fase 4 — DAL + migración de módulos
Implementar cada servicio del DAL (molde de `clientService`) y conectar el módulo. **Lecturas primero,
escrituras después**, validando cada uno contra el seed antes de avanzar.

---

## Orden de migración de módulos (seguro → complejo)

| # | Módulo | Tipo | Por qué en este orden |
|---|---|---|---|
| 1 | **Clientes** | read + write (CRUD) | Entidad raíz; todo lo demás se filtra por cliente. Valida el stack completo (Auth→RLS→DAL→UI) con un CRUD simple. |
| 2 | **Dashboard** | solo lectura | Agregados/KPIs; valida el camino de lectura sin riesgo de escritura; alta visibilidad. |
| 3 | **Brief** | read + write | Un registro por cliente, formulario simple. Primer write sobre entidad de baja complejidad. |
| 4 | **Contratos** | read (+write existente) | Lee contrato + items; el wizard ya crea cliente+contrato. Bajo riesgo. |
| 5 | **Cronopost / Calendario** | read + write complejo | `content_pieces`: lista, crear, reprogramar (drag&drop), planificador. Corazón del sistema. |
| 6 | **Aprobaciones** | read + write (máquina de estados) | Aprobar/solicitar cambios → `approval_events` + `comments` + notificaciones. Escrituras críticas. |
| 7 | **Multimedia** | read + write + **Storage** | Requiere Storage (Fase 3) para subida real. `content_files`. |
| 8 | **Campañas** | read + cómputo | Centro de Estrategia: lee material de pauta + brief + contrato y calcula. |
| 9 | **Métricas** | solo lectura | `metric_snapshots` + vista `v_content_performance`. Último; los datos reales de pauta llegan con las APIs (Sprint 3). |

**Grupos de riesgo:** A (fundación de lecturas, bajo riesgo): 1-4 · B (read-write complejo): 5-6 ·
C (Storage + cómputo): 7-9.

---

## Riesgos

| Riesgo | Mitigación |
|---|---|
| IDs mock (`cl3`) vs UUID de la BD | `real mode` global; migrar dentro de real mode contra el seed consistente; mock mode como fallback |
| RLS bloquea lecturas/escrituras | Fase 1 (grants + WITH CHECK) antes de conectar módulos; probar con usuario real por rol |
| Claims del JWT mal configurados | Validar el Auth Hook en Staging antes de migrar módulos (login → inspeccionar JWT) |
| Un módulo roto tumba la app | Interruptor por módulo: si falla, vuelve a mock al instante; se valida uno a la vez |
| Escrituras sin WITH CHECK | Las policies de INSERT/UPDATE se incluyen en 0005; se prueban en Aprobaciones/Cronopost |
| Migración de datos del mock | No se migra el mock; el seed ya es la fuente real. El mock solo es fallback de desarrollo |

## Definition of Done

- Login real (agencia + cliente) con Auth de Supabase; recuperación e invitaciones operativas.
- Los 9 módulos leen y escriben datos reales de Staging vía el DAL; el mock queda solo como fallback.
- Aislamiento por RLS verificado: agencia no ve otra agencia; cliente solo ve lo suyo.
- Storage operativo (subida real de multimedia).
- `npm run test:migrations` y el build en verde; app funcional en cada paso.

## Criterios de aceptación

1. Iniciar sesión como agencia muestra los 5 clientes reales del seed.
2. Iniciar sesión como cliente (Kinara) muestra solo su portal, con su contenido real.
3. Crear/editar un cliente, brief o pieza persiste en Supabase y sobrevive al refresh (sin localStorage).
4. Aprobar/solicitar cambios escribe en `approval_events` y notifica.
5. Subir un video lo guarda en Storage y la pieza lo muestra.
6. Ningún usuario accede jamás a datos de otro tenant (probado por rol).

## Resultado esperado

FPlus operando sobre datos reales de Staging, multi-tenant y seguro, con Primero Digital y sus 5 clientes —
la primera Beta funcional lista para pruebas reales, y la base para conectar las APIs de pauta en el Sprint 3.

---

## Estado

**Propuesto.** Pendiente de aprobación del orden y de las migraciones 0005/0006 antes de implementar.
Arrancamos por la Fase 0 (verificación del seed) en cuanto apruebes.
