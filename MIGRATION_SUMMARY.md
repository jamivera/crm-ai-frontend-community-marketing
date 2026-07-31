# Resumen General de Cambios y Migración a Mac M1 — AgencyOS

Este archivo resume de manera consolidada todas las implementaciones de la sesión de hoy, la auditoría del estado actual y la guía de migración para la nueva **MacBook Pro M1**.

---

## 1. Ajustes y Características Implementadas Hoy

### A. LinkedIn Ads Completamente Integrado
* Se pre-configuraron campañas reales de LinkedIn Ads para el cliente `cl1` (FPLUS) en `src/fplus/mock/index.ts`.
* Se implementaron cabeceras y placeholders específicos para LinkedIn en la tabla de planificación de anuncios (`ClientCampaigns.tsx`), incluyendo cargos, target y presupuestos.

### B. Consolidación de "Ver todas"
* Se eliminó la pestaña duplicada "Consolidado". 
* La pestaña **"Ver todas"** ahora actúa como el único unificador de la vista consolidada de métricas y gráficos agregados para todas las plataformas, alineando la agencia y el portal de forma exacta.

### C. Aislamiento de Métricas por Plataforma e Indicador de API
* Al seleccionar un canal (Meta, Google, TikTok o LinkedIn Ads), la interfaz filtra los KPIs para mostrar únicamente los datos del canal activo.
* Se agregó el indicador dinámico de API en la cabecera:
  * **Ver todas**: `Contra APIs`
  * **Meta Ads**: `Contra API Meta`
  * **Google Ads**: `Contra API Google Ads`
  * **TikTok Ads**: `Contra API TikTok Ads`
  * **LinkedIn Ads**: `Contra API LinkedIn Ads`

### D. Rediseño del Portal de Cliente y Spacing (UX/UI)
* Se reorganizó `PortalMetrics.tsx` aplicando mayor jerarquía visual y espaciados generosos (`space-y-12`, `gap-8`) para evitar la acumulación densa de información y facilitar la lectura.
* Se eliminó el botón **"Generar informe mensual"** de la vista del Portal del Cliente. La acción permanece únicamente accesible para los gestores en la vista de la Agencia (`ClientMetrics.tsx`).

---

## 2. Inventario de la Base de Datos Local (Supabase)

La base de datos se encuentra completamente versionada en código bajo la carpeta `supabase/`:
1.  **Migraciones (`supabase/migrations/`)**:
    *   Existen **11 archivos de migración SQL** secuenciales, cubriendo el esquema inicial, políticas de RLS, triggers de provisión de perfiles en GoTrue, y la asignación de roles.
2.  **Seeds (`supabase/seed/`)**:
    *   Existen **10 archivos SQL** de datos de prueba cargados automáticamente en el reset: `seed_agencies.sql`, `seed_users.sql`, `seed_clients.sql`, `seed_briefs.sql`, `seed_campaigns.sql`, entre otros.
3.  **Configuración del CLI (`supabase/config.toml`)**:
    *   Define el puerto de desarrollo local en el `54321` y el puerto de base de datos Postgres de Supabase en el `54322` para evitar colisiones.
    *   Lista de manera ordenada los 10 archivos de seed a ejecutarse.

---

## 3. Guía Rápida de Instalación en la Mac M1

Sigue estos pasos en la nueva máquina para recrear el entorno local:

1.  **Clonar el repositorio**:
    ```bash
    git clone https://github.com/jamivera/crm-ai-frontend-community-marketing.git agencyos-m1
    cd agencyos-m1
    ```
2.  **Instalar dependencias**:
    ```bash
    pnpm install
    ```
3.  **Configurar variables de entorno**:
    *   Copia `.env.example` a `.env.local`
4.  **Iniciar Supabase local** (Asegúrate de tener Docker Desktop abierto):
    ```bash
    supabase start
    ```
5.  **Ejecutar migraciones y datos semilla**:
    ```bash
    supabase db reset
    ```
6.  **Iniciar servidor de desarrollo**:
    ```bash
    npm run dev
    ```

---

## 4. Persistencia para Antigravity (`.agents/AGENTS.md`)
Se ha configurado y subido el archivo `.agents/AGENTS.md`. Cuando abras el repositorio clonado en Antigravity en la MacBook M1, el agente cargará automáticamente las directrices del proyecto sin necesidad de re-explicar las reglas.
