# AgencyOS — Guía de Migración y Checklist para Mac M1

Este documento contiene las instrucciones precisas para clonar, restaurar la base de datos local y ejecutar **AgencyOS** en tu nueva **MacBook Pro M1**. 

---

## 1. Requisitos Previos del Sistema

Asegúrate de instalar las siguientes herramientas en la nueva Mac M1 antes de comenzar:

*   **Sistema Operativo**: macOS Sequoia o superior.
*   **Arquitectura**: Apple Silicon (M1/M2/M3) nativo.
*   **Node.js**: `v20.x` (LTS recomendado). Se sugiere usar `fnm` o `nvm` para la gestión de versiones.
*   **Gestor de Paquetes**: `pnpm` (versión 8.x o superior) o `npm` (se incluye `pnpm-lock.yaml` en el repositorio).
*   **Docker Desktop**: Requerido para virtualizar la base de datos y servicios locales de Supabase.
*   **Supabase CLI**: Instalado mediante Homebrew:
    ```bash
    brew install supabase/tap/supabase
    ```
*   **Git**: Instalado mediante Xcode Command Line Tools o Homebrew.

---

## 2. Inventario de Variables de Entorno y Secretos

Copia el archivo `.env.example` a `.env.local` (el cual está protegido en `.gitignore`) para configurar el entorno de desarrollo local.

| Nombre de Variable | Finalidad | Ubicación / Valor para Desarrollo Local |
| :--- | :--- | :--- |
| `VITE_APP_ENV` | Define el entorno actual de la aplicación. | `development` |
| `VITE_SUPABASE_URL` | URL de la API de Supabase local o Cloud. | `http://127.0.0.1:54321` (Local CLI) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clave pública segura para acceder a Supabase. | Copiar desde la consola de `supabase start` |
| `VITE_API_URL` | Endpoint del servidor de backend de integraciones. | `http://localhost:3000` |
| `VITE_AUTH_API_URL` | Endpoint de autenticación centralizada. | `http://localhost:3001` |
| `VITE_EVOAI_API_URL` | Endpoint de la API de Inteligencia Artificial. | `http://localhost:5555` |
| `VITE_EVOFLOW_API_URL` | API del motor de flujos conversacionales. | `http://localhost:3334` |
| `VITE_AGENT_PROCESSOR_URL` | API del procesador de agentes autónomos. | `http://localhost:8000` |
| `VITE_TINYMCE_API_KEY` | Clave para el editor de plantillas de correo. | `no-api-key` (para omitir clave en local) |

> [!WARNING]
> Las variables de entorno de nivel administrador como `SUPABASE_SERVICE_ROLE_KEY` o credenciales de base de datos de staging y producción **NUNCA** deben guardarse en el repositorio de Git ni en el archivo `.env.local` público. Guárdalas en tu gestor de contraseñas seguro (Keepass/1Password) y configúralas en producción/CI únicamente.

---

## 3. Pasos de Restauración y Reconstrucción

Sigue este orden exacto en la nueva máquina para recrear el entorno local:

### Paso 3.1: Clonar el Repositorio
```bash
git clone https://github.com/jamivera/crm-ai-frontend-community-marketing.git agencyos-m1
cd agencyos-m1
```

### Paso 3.2: Instalar Dependencias
Se recomienda utilizar `pnpm` por velocidad y consistencia de bloqueos:
```bash
pnpm install
```
O de manera alternativa usando npm:
```bash
npm install
```

### Paso 3.3: Iniciar Supabase Local
1. Asegúrate de tener **Docker Desktop** abierto y ejecutándose en segundo plano.
2. Inicia la infraestructura de Supabase local:
   ```bash
   supabase start
   ```
   *Esto descargará las imágenes de PostgreSQL, GoTrue (Auth), PostgREST, Storage y Kong.*

### Paso 3.4: Ejecutar Migraciones y Seeds
El CLI de Supabase detectará automáticamente todas las migraciones en `/supabase/migrations/` y los cargará en la base de datos limpia de Docker. El archivo `config.toml` también ejecutará de manera ordenada las seeds de desarrollo en `supabase/seed/`.

Para forzar un reinicio limpio completo con datos pre-sembrados:
```bash
supabase db reset
```

Para validar que la base de datos no tiene errores de RLS o triggers en local, puedes correr el validador:
```bash
python3 supabase/validate_migrations.py
```

### Paso 3.5: Iniciar Servidor de Desarrollo
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:5173/`.

### Paso 3.6: Generar Compilación de Producción (Vite Bundle)
Para verificar la ausencia de errores de TypeScript antes de desplegar:
```bash
npm run build
```

---

## 4. Problemas Comunes en Mac M1 y Soluciones

### 1. Error de Docker: "Cannot connect to the Docker daemon"
*   **Causa**: Docker Desktop no está en ejecución o los permisos del socket no están configurados correctamente.
*   **Solución**: Abre la app Docker en macOS. Si persiste, añade tu usuario al grupo docker o reinicia los permisos del socket en Preferencias de Docker -> Advanced.

### 2. Conflicto de Puertos (Puerto `5432` o `54322` ocupado)
*   **Causa**: Postgres nativo de macOS está corriendo localmente en el puerto default.
*   **Solución**: Supabase local corre la DB en el puerto `54322` (según `supabase/config.toml`) para evitar conflicto con la base de datos PostgreSQL estándar en el puerto `5432`. Si tienes otro servicio en el puerto `54322`, edita el campo `port` en `supabase/config.toml` antes de ejecutar `supabase start`.

### 3. Error en Arquitectura de Docker (Emulación x86 vs ARM64)
*   **Causa**: Docker de M1 a veces intenta descargar imágenes de emulación x86.
*   **Solución**: Supabase CLI está optimizado para ARM64. Asegúrate de tener instalada la versión Apple Silicon de Docker Desktop y activa la opción "Use Virtualization framework" en la configuración de Docker.

---

## 5. Checklist de Verificación de Migración Exitosa

Marca las casillas una vez que completes los pasos en la nueva MacBook:

- [ ] Repositorio clonado.
- [ ] Dependencias instaladas sin conflictos (`node_modules` generado).
- [ ] Docker corriendo y `supabase start` finalizado de manera limpia.
- [ ] Migraciones locales completadas con éxito (`supabase db reset`).
- [ ] Base de datos sembrada con datos de Kinara (`cl3`) y FPLUS (`cl1`).
- [ ] Servidor local levantado en `http://localhost:5173/`.
- [ ] Build de producción finalizado con éxito (`dist/` generado).
