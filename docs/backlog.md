# FPlus — Backlog Técnico (Ideas Futuras)

Registro de ideas y mejoras para **versiones futuras**. **Nada de esto se implementa ahora** ni afecta el
desarrollo actual. Existe para no perder buenas ideas y para que, cuando llegue el momento, la decisión ya
tenga contexto.

Antes de mover algo de aquí al roadmap, se documenta como un ADR (qué problema resuelve, impacto, ventajas,
riesgos) y se aprueba.

**Prioridad estimada:** 🔴 Alta · 🟡 Media · 🟢 Baja (todas post-v1.0)

---

## Plataforma e infraestructura

| Idea | Prioridad | Notas |
|---|---|---|
| **Event Bus interno** | 🟡 | Desacoplar módulos con eventos (`piece.approved`, `metrics.synced`). Ya hay tablas de eventos; falta el bus. |
| **Jobs / Queue en producción** | 🔴 | Tabla `jobs` ya diseñada. Activar worker (cron/Edge) para sync de APIs, IA y correos a escala. |
| **Observabilidad** | 🔴 | Logs estructurados, métricas de sistema, tracing y alertas (Sentry / Logflare / OpenTelemetry). |
| **API Versioning** | 🟡 | Versionar contratos del DAL y de las Edge Functions (`v1`, `v2`) para evolucionar sin romper. |
| **Rate limiting** | 🟡 | Proteger Edge Functions y APIs externas de abuso y de límites de proveedor. |

## Almacenamiento y datos

| Idea | Prioridad | Notas |
|---|---|---|
| **Cloudflare R2** | 🔴 | Migrar Storage cuando el egress pese (egress $0). Adaptador ya previsto ([ADR-009](adr/ADR-009-storage-r2.md)). |
| **BigQuery / ClickHouse** | 🟡 | Camino OLAP para analítica masiva, alimentado desde Postgres, a escala de miles de agencias. |
| **Particionado activo** | 🔴 | `metric_snapshots`, `audit_log`, `webhook_logs` ya son particionables; activar particiones al crecer. |
| **Read replicas** | 🟡 | Réplicas de lectura para reportes pesados sin tocar la base principal. |

## Producto y negocio

| Idea | Prioridad | Notas |
|---|---|---|
| **Billing (Stripe)** | 🔴 | Tablas `subscription_plans/subscriptions/invoices/payments` ya diseñadas. Integrar Stripe. |
| **Feature Flags activos** | 🟡 | Tabla `feature_flags` ya diseñada. UI de administración por agencia/plan. |
| **Notificaciones multicanal** | 🟡 | Tabla `notifications` ya diseñada. Activar email → push → in-app. |
| **Multi-idioma (i18n)** | 🟡 | Textos por claves; catálogo de idiomas para agencias internacionales. |
| **Reportes exportables / Looker** | 🟢 | Exportar métricas a PDF/Looker Studio para presentaciones a clientes. |

## Acceso y seguridad

| Idea | Prioridad | Notas |
|---|---|---|
| **SSO / SAML (enterprise)** | 🟡 | Para agencias enterprise; evaluar WorkOS/Auth0 tras el DAL de auth. |
| **2FA** | 🟡 | Segundo factor para cuentas de agencia. |
| **Pruebas de aislamiento en CI** | 🔴 | Tests automáticos que verifiquen que ningún rol accede a datos de otro tenant. |

## Clientes y canales

| Idea | Prioridad | Notas |
|---|---|---|
| **Aplicación móvil** | 🟡 | La PWA es el primer paso; app nativa reutilizando la lógica sin reescribir. |
| **WhatsApp para aprobaciones** | 🟡 | Notificar/aprobar contenido vía WhatsApp Cloud API. |
| **IA de mejora de copy / CTA / variantes** | 🟢 | Funciones IA ya previstas (deshabilitadas en la UI); activarlas con IA real. |

---

> Este backlog es vivo: se agregan ideas conforme surgen, pero **ninguna** entra al desarrollo sin pasar por
> un ADR aprobado. Mantiene el foco: primero construir la v1.0 según la arquitectura congelada.
