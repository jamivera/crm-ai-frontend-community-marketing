# ARCHITECTURE_DIAGRAM · FPlus

> Diagramas en **Mermaid** (texto, no imágenes). Renderizan en GitHub. Reflejan el estado congelado (0001–0009).
> Nota: donde aparece ❌/bloqueo es el estado **actual** por ISSUE-001, no un fallo de diseño.

## 1 · Arquitectura general
```mermaid
flowchart TB
  subgraph Client["Frontend (React 19)"]
    UI["Módulos FPlus /fplus/*"]
    DAL["DAL src/fplus/services"]
  end
  subgraph Supabase["Supabase (us-east-1)"]
    Auth["Auth / GoTrue"]
    PG[("PostgreSQL 15 + RLS")]
    Edge["Edge Functions"]
    Storage["Storage (futuro -> R2)"]
  end
  UI --> DAL
  DAL -->|publishable key + JWT| PG
  DAL -.->|login| Auth
  Auth --> PG
  Edge -->|secret key| PG
  Edge -.-> Storage
  UI -.-> Storage
```

## 2 · Flujo de identidad (ADR-011)
```mermaid
flowchart LR
  A["Admin API / signup / invite / OAuth"] --> B[("auth.users INSERT/UPDATE")]
  B -->|AFTER INSERT OR UPDATE OF raw_app_meta_data| T["Trigger handle_new_user"]
  T -->|copia id + email + app_metadata| U[("public.users")]
  U --> H["Auth Hook custom_access_token_hook"]
  H -->|inyecta agency_id/rol/client_id| J["JWT"]
  J --> RLS["RLS filtra por tenant"]
```

## 3 · Flujo DAL (ADR-004)
```mermaid
flowchart LR
  UI["Componentes FPlus"] --> IFace["Interfaces (IClientService...)"]
  IFace --> Impl["Impl Supabase (clientService.ts)"]
  Impl --> SB["supabaseClient (publishable key)"]
  SB --> PG[("PostgreSQL + RLS")]
  UI -. real mode off .-> Mock["Mock fallback"]
```

## 4 · Flujo RLS
```mermaid
flowchart TB
  Q["Query del DAL"] --> G{"¿GRANT al rol?"}
  G -- no --> E42501["42501 permission denied"]
  G -- si --> P{"¿Policy RLS permite? (auth_agency_id del JWT)"}
  P -- no --> Empty["[] filas"]
  P -- si --> Rows["Filas del tenant"]
```

## 5 · Flujo Bootstrap (primer admin)
```mermaid
flowchart LR
  ENV[".env: SECRET_KEY + ADMIN_*"] --> BS["bootstrap_admin.mjs"]
  BS -->|admin.createUser app_metadata| GT["GoTrue Admin API"]
  GT --> AU[("auth.users")]
  AU --> TR["Trigger"]
  TR --> PU[("public.users")]
  BS -->|SELECT verifica| PU
  PU --> OK{"ids_coinciden = true?"}
```

## 6 · Flujo Auth (login objetivo)
```mermaid
sequenceDiagram
  participant U as Usuario
  participant SB as supabase-js (DAL)
  participant GT as GoTrue
  participant HK as Auth Hook
  participant DB as public.users
  U->>SB: signInWithPassword
  SB->>GT: POST /token
  GT->>HK: custom_access_token_hook(event)
  HK->>DB: SELECT agency_id,rol,client_id
  DB-->>HK: fila
  HK-->>GT: claims (❌ hoy: 500 ISSUE-001)
  GT-->>SB: JWT
```

## 7 · Flujo Cliente (portal)
```mermaid
flowchart TB
  CU["Usuario cliente (rol client_*)"] --> J["JWT con client_id"]
  J --> RLS{"RLS: client_id = auth_client_id()"}
  RLS --> Own["Solo su contenido / aprobaciones / no notas internas"]
```

## 8 · Flujo Agencia
```mermaid
flowchart TB
  AU2["Usuario de agencia (rol agency_*/staff)"] --> J2["JWT con agency_id"]
  J2 --> RLS2{"RLS: agency_id = auth_agency_id()"}
  RLS2 --> All["Todos los clientes/contenido/campañas de SU agencia"]
```

## 9 · Flujo Storage (futuro, ADR-009)
```mermaid
flowchart LR
  UPL["Subida de media (UI)"] --> MS["mediaService (DAL)"]
  MS --> BK["Bucket media (policies por tenant)"]
  MS --> META[("content_files: object_key + metadata")]
  VIEW["getMediaUrl()"] --> BK
  BK -. migracion futura .-> R2["Cloudflare R2"]
```

## 10 · Flujo Campañas (Centro de Estrategia)
```mermaid
flowchart LR
  BR["Brief"] --> CMP["campaigns"]
  CT["Contrato + items"] --> CMP
  ADS["ad_accounts/ad_campaigns/ad_sets/ads"] --> CMP
  CMP --> COMP["Cómputo de estrategia"]
  COMP --> METR[("metric_snapshots")]
```

## 11 · Flujo de publicación
```mermaid
flowchart LR
  CP["content_pieces"] --> APR{"approval_events (aprobado?)"}
  APR -- si --> PUB["publications (programada/publicada)"]
  PUB --> PLAT["Redes (Meta/IG/TikTok...) via Edge (Sprint 3)"]
  PLAT --> WH[("webhook_logs")]
  WH --> METR2[("metric_snapshots")]
```
