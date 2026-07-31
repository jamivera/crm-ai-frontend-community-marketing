# Normas del Agente — AgencyOS Customizations

Este archivo define las reglas de comportamiento, diseño e implementación para Antigravity cuando continúe el desarrollo de **AgencyOS** en la nueva máquina MacBook Pro M1.

---

## 1. Arquitectura de Datos y Métricas

*   **Única fuente de verdad (Single Source of Truth)**: Todas las vistas de métricas (como `PortalMetrics.tsx` del cliente y `ClientMetrics.tsx` de la agencia) y las exportaciones a PDF deben consumir **exclusivamente** el adaptador centralizado `getUnifiedPlatformMetrics` en `src/fplus/services/metricsAdapter.ts`.
*   **Separación de Canales**: Nunca mezcles métricas de múltiples canales cuando el usuario esté visualizando una plataforma específica (Meta, Google, TikTok, LinkedIn). El consolidado general solo debe mostrarse en la pestaña **"Ver todas"**.
*   **Datos Reales y Estructuras Extensibles**: En las tablas de planificación operativa (`extraData.gridRows`), trabaja únicamente con información de configuración real proveniente de `campaign_rows` o variables de base de datos. Evita inyectar valores mockeados ficticios para Google Ads o LinkedIn Ads de forma estática en las vistas.

---

## 2. Lineamientos Estéticos y de Diseño (UX/UI)

*   **Jerarquía y Aire Visual**: La interfaz del Portal del Cliente debe mantenerse con una estructura limpia y aireada. Usa contenedores espaciosos (`rounded-3xl`, `p-6` o `p-8`) y separaciones amplias (`space-y-12`, `gap-8`) para evitar la acumulación densa de información.
*   **Barra de Estado API Target**: Muestra siempre el banner dinámico de conexión a API según el canal activo:
    *   Ver todas: `Contra APIs`
    *   Meta Ads: `Contra API Meta`
    *   Google Ads: `Contra API Google Ads`
    *   TikTok Ads: `Contra API TikTok Ads`
    *   LinkedIn Ads: `Contra API LinkedIn Ads`
*   **Permisos de Exportación**: El botón "Generar informe mensual" debe ser de uso exclusivo para la Agencia. No debe mostrarse bajo ninguna circunstancia en el Portal del Cliente.

---

## 3. Base de Datos e Infraestructura Local

*   **Idempotencia con Supabase CLI**: Toda modificación a la estructura de la base de datos debe realizarse a través de archivos de migración SQL en `supabase/migrations/` para que cualquier instancia local se actualice con `supabase db reset`.
*   **Semillas de Desarrollo**: Los datos de prueba deben ser sembrados de forma automatizada mediante la sección `db.seed` del archivo `supabase/config.toml`.
