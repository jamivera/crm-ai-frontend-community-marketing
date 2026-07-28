# ANTIGRAVITY_EVALUATION · FPlus

> Evaluación técnica independiente (rol: Principal Software Architect / CTO). **Análisis, no desarrollo.**
> Documento de trabajo **post-RC1, NO commiteado**, fuera del paquete congelado `docs/release/`.
> **Premisa a confirmar:** "Antigravity" = Google Antigravity, plataforma de desarrollo agéntica (IDE con agentes),
> NO un backend/base de datos. Si la premisa es otra, las secciones de "migración" deben rehacerse.

---

## 1 · Resumen ejecutivo

FPlus tiene una **arquitectura sólida, disciplinada y bien documentada** para su etapa (early, mayormente en mock,
un bug de login abierto). La infraestructura de identidad multi-tenant (Trigger + Auth Hook + RLS + DAL) está
correctamente diseñada y congelada con trazabilidad ejemplar (ADRs, gate de validación, diario de migraciones).

**Conclusión central:** si Antigravity es un **entorno de desarrollo agéntico**, **no hay "migración" de backend
que hacer** — y no debería haberla. La decisión real es si adoptar Antigravity como **acelerador de desarrollo
supervisado**. El mayor riesgo no es técnico-de-plataforma, sino **que un agente rompa decisiones correctas ya
congeladas**. La recomendación es: **mantener la arquitectura y Supabase intactos; considerar Antigravity solo
como herramienta de desarrollo con guardarraíles estrictos.**

## 2 · Arquitectura actual (evaluación por eje)

| Eje | Evaluación | Nota |
|---|---|---|
| **Multi-tenancy** (shared DB + agency_id + RLS) | ✅ Sólida, estándar de industria, escalable | El aislamiento vive en la BD, no en la app. Correcto. |
| **Identidad** (Trigger + Hook + app_metadata) | ✅ Bien razonada, atómica, agnóstica al origen | 1 defecto abierto (ISSUE-001) — es un bug de integración, no de diseño. |
| **Separación de responsabilidades** (ADR-011) | ✅ Limpia (Trigger/Hook/Backend/Edge) | Cada pieza en su carril; claims solo en el Hook. |
| **DAL** (Ports & Adapters) | ✅ Excelente para portabilidad/desacople | Es el activo que reduce el lock-in y habilita cualquier futuro. |
| **Supabase** | ✅ Apropiado para la etapa | Reduce carga operativa. Lock-in real en features específicas (RLS, GoTrue hooks). |
| **Auth** | ✅ Diseño correcto (server-side, app_metadata) | Bloqueado por ISSUE-001. |
| **RLS** | ✅ Postura de seguridad correcta | Riesgo a escala: RLS corre en cada query (mitigado por índices 0004). |
| **Bootstrap** | ✅ Pragmático y validado | Depende de pasos manuales del Dashboard (documentados). |
| **Trigger** | ✅ Mínimo, idempotente, validado en PGlite | — |
| **Auth Hook** | ⚠️ Correcto pero bloqueado (ISSUE-001) | El 500 impide el login real. |
| **Storage** | ⏳ No implementado | Plan ADR-009 (Supabase → R2). Neutro. |
| **Frontend** | 🟡 React 19 sobre base Evo; mock mode | Arrastra deuda de la base (TODO/HACK heredados). |
| **Backend propio** | ⏳ Mínimo (Edge Functions planeadas) | Aún no construido. |
| **UX** | ❔ No evaluable a fondo desde docs | Mocks existen; falta validación con datos reales. |
| **Performance** | 🟡 Aceptable | Watch: RLS-por-query; single-region us-east-1. |

**Madurez:** arquitectura fuerte para su etapa; **disciplina excepcional**. Gap principal: es temprano (mayor
parte en mock, un bug bloqueante).

## 3 · Fortalezas
- Aislamiento multi-tenant en la BD (RLS) — seguridad por diseño.
- DAL desacoplado — portabilidad y baja dependencia del proveedor en la capa de datos CRUD.
- Decisiones congeladas y trazables (11 ADRs + índice de decisiones con alternativas descartadas).
- Gate de validación real (estático + ejecución en PGlite) — atrapa errores de ejecución.
- Documentación de preservación de nivel enterprise (auto-suficiente para IA/humanos).
- Metodología Evidencia → Diagnóstico → Corrección mínima → Validación, aplicada consistentemente.

## 4 · Debilidades
- **ISSUE-001** (login 500) bloquea validar cualquier módulo con datos reales.
- Superficie de producto aún **mayoritariamente mock**; el DAL no está conectado a ningún módulo.
- **Lock-in real en features Supabase-específicas**: RLS y el Custom Access Token Hook **no portan** trivialmente
  (el DAL desacopla CRUD, no la seguridad ni el modelo de claims).
- Deuda heredada de la base Evo CRM (TODO/HACK en `src/`).
- Doble lockfile (npm/pnpm). Single-region.

## 5 · Riesgos
- **R-07 (el mayor para esta fase):** una IA/agente rompe la arquitectura congelada (RLS, identidad, tenant).
- Category error: tratar Antigravity como backend y "migrar" RLS/Auth → reimplementar el aislamiento = alto riesgo, bajo retorno.
- Confundir la 0010 experimental con un fix.
- Pérdida de determinismo si se delega desarrollo crítico a agentes sin supervisión.

## 6 · Oportunidades
- El codebase es **altamente legible por agentes** (gracias al paquete de preservación) → buen terreno para
  asistencia agéntica en trabajo **repetitivo y bien especificado** (cableado DAL módulo-por-módulo).
- Los módulos **independientes** (Clientes, Dashboard, Brief, Métricas) son pilotos seguros para desarrollo asistido.

## 7 · Compatibilidad (con la premisa "Antigravity = IDE agéntico")
- **Alta como herramienta de desarrollo:** no requiere cambiar la arquitectura; opera sobre el repo tal cual.
- **Nula como "destino de migración de backend":** Supabase no se "migra a" un IDE. Si el objetivo fuese mover el
  backend a otra plataforma, Antigravity no es esa plataforma.

## 8 · Costo técnico y de migración
- **Como herramienta:** costo bajo-medio (curva de aprendizaje, overhead de revisión, suscripción). **Cero** costo
  de migración de datos.
- **Como (hipotética) migración de backend a otra plataforma:** costo **alto** — reimplementar RLS y el Auth Hook
  (features no portables), re-validar aislamiento multi-tenant, re-hacer el gate. **No recomendado sin un driver concreto.**

## 9 · Estimación
- Adopción como acelerador de desarrollo, con guardarraíles: **días** de setup + política de revisión.
- Migración de backend fuera de Supabase: **semanas-meses** y re-validación de seguridad. Injustificado hoy.

## 10 · Roadmap (evaluación, no ejecución)
Ver §Migration Strategy abajo. En síntesis: primero **cerrar ISSUE-001**, luego pilotar asistencia agéntica en un
módulo independiente con revisión humana, y **nunca** delegar sin supervisión la identidad/RLS/tenant.

## 11 · Recomendación profesional (honesta, crítica)
1. **No enmarcar esto como una migración.** Define primero qué es Antigravity para el proyecto.
2. **Mantener EXACTAMENTE como está:** modelo de tenant (agency_id + RLS), identidad (Trigger/Hook/app_metadata),
   frontera del DAL, migraciones 0001–0009, manejo de secretos. Antigravity **no aporta valor** a estas piezas y sí
   introduce riesgo si las toca.
3. **Adoptar Antigravity, si acaso, solo como acelerador de desarrollo supervisado**, cercado por el freeze
   (AI_BOOTSTRAP_GUIDE + MANIFESTO como guardarraíles), empezando por módulos independientes tras resolver el login.
4. **No mover el backend** de Supabase sin un driver de negocio concreto (costo/límite/lock-in demostrado). Hoy no existe.

---

## MIGRATION STRATEGY (solo diseño — NO ejecutar)

> Interpretación: "migración" = adopción progresiva de Antigravity como entorno de desarrollo agéntico sobre el
> backend Supabase que **permanece**. (Si fuese migración de backend, ver §8 — no recomendada.)

### Fase 0 — Encuadre y guardarraíles
- **Objetivo:** definir qué puede/no puede tocar el agente; fijar el freeze como límite duro; establecer gates de revisión humana.
- **Riesgos:** que el agente asuma libertad sobre lo congelado.
- **Dependencias:** paquete de preservación (ya existe); definición confirmada de Antigravity.
- **Rollback:** trivial (nada se cambió); revertir configuración de la herramienta.
- **Validación:** checklist de "qué NO tocar" (ANTIGRAVITY_READINESS §8) firmado.

### Fase 1 — Piloto en un módulo independiente
- **Objetivo:** cablear **Clientes** al DAL con asistencia agéntica, tras cerrar ISSUE-001. Revisión humana total.
- **Riesgos:** el agente rompe RLS/tenant o "refactoriza" lo congelado.
- **Dependencias:** login funcionando (ISSUE-001).
- **Rollback:** revertir el branch del módulo; mock mode como fallback.
- **Validación:** gate + PGlite en verde; aislamiento multi-tenant probado (agencia A no ve B).

### Fase 2 — Extensión a módulos independientes
- **Objetivo:** Dashboard, Brief, Métricas (lecturas, bajo riesgo).
- **Riesgos:** deriva de calidad; inconsistencia entre módulos.
- **Dependencias:** Fase 1 validada.
- **Rollback:** por módulo; el resto sigue en mock/real ya validado.
- **Validación:** e2e por módulo; revisión de diffs.

### Fase 3 — Módulos críticos (supervisión estricta)
- **Objetivo:** Cronopost, Aprobaciones (escrituras/máquina de estados). **Agente asiste, humano decide.**
- **Riesgos:** escrituras/estados incorrectos; fuga cross-tenant.
- **Dependencias:** Fases 1-2; patrón DAL consolidado.
- **Rollback:** feature flags / mock fallback por módulo.
- **Validación:** pruebas de estado + RLS por rol (agencia/cliente).

### Fase 4 — Régimen estable y retro
- **Objetivo:** operar con asistencia agéntica cercada; medir velocidad vs. defectos.
- **Riesgos:** complacencia; erosión de la disciplina.
- **Dependencias:** todo lo anterior.
- **Rollback:** volver a desarrollo 100% humano si la calidad cae.
- **Validación:** métricas de defectos/regresiones; retro trimestral.

---

## Veredicto objetivo (Tarea 6)
- **Partes que deben permanecer idénticas:** identidad, RLS, modelo de tenant, frontera del DAL, migraciones
  0001–0009, secretos server-only. Antigravity **no** debe tocarlas.
- **Dónde Antigravity NO aporta valor:** como sustituto de Supabase/backend, o sobre las piezas congeladas → **0 valor, alto riesgo.**
- **Dónde PODRÍA aportar valor:** como acelerador supervisado del trabajo repetitivo (cableado DAL de módulos independientes).
- **Recomendación final:** **KEEP la arquitectura y el backend. Confirmar qué es Antigravity. Adoptarlo, si acaso,
  solo como herramienta de desarrollo con guardarraíles.** La decisión debe basarse en un driver técnico concreto,
  no en entusiasmo. Hoy, ese driver no existe para una migración de backend.
