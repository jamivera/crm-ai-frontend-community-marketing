-- =====================================================================
-- DATABASE MIGRATIONS - FPLUS AGENCYOS (BETA INTERNA V1)
-- Target Engine: Supabase PostgreSQL (event-driven, production ready)
-- =====================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CLIENTS TABLE
CREATE TABLE IF NOT EXISTS public.clients (
    id TEXT PRIMARY KEY DEFAULT 'cl-' || md5(random()::text),
    nombre TEXT NOT NULL,
    empresa TEXT,
    industria TEXT DEFAULT 'General',
    tipo_mercado TEXT DEFAULT 'General',
    instagram_handle TEXT,
    color_corporativo TEXT,
    account_manager_id TEXT NOT NULL,
    account_manager_name TEXT NOT NULL,
    plan_contratado TEXT DEFAULT 'standard',
    fecha_inicio_contrato TIMESTAMPTZ,
    fecha_fin_contrato TIMESTAMPTZ,
    presupuesto_mensual NUMERIC(12, 2) DEFAULT 0.00,
    precio_lista NUMERIC(12, 2) DEFAULT 0.00,
    descuento NUMERIC(12, 2) DEFAULT 0.00,
    meta_conectado BOOLEAN DEFAULT FALSE,
    meta_access_token TEXT,
    tipo_documento TEXT DEFAULT 'cedula',
    numero_documento TEXT,
    direccion TEXT,
    ciudad TEXT,
    provincia TEXT,
    pais TEXT,
    sitio_web TEXT,
    email_facturacion TEXT,
    servicios_contratados JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CAMPAIGNS TABLE
CREATE TABLE IF NOT EXISTS public.campaigns (
    id TEXT PRIMARY KEY DEFAULT 'cam-' || md5(random()::text),
    client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    client_nombre TEXT NOT NULL,
    nombre TEXT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'completado')),
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CONTENT PIECES (CRONOPOST & CALENDAR MAIN ENTITY)
CREATE TABLE IF NOT EXISTS public.content_pieces (
    id TEXT PRIMARY KEY DEFAULT 'cp-' || md5(random()::text),
    client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    client_nombre TEXT NOT NULL,
    campaign_id TEXT REFERENCES public.campaigns(id) ON DELETE SET NULL,
    campaign_nombre TEXT,
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL, -- reel, carrusel, tiktok, historia, etc.
    pilar TEXT,
    tono TEXT,
    incluye_cta BOOLEAN DEFAULT FALSE,
    estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'en_produccion', 'enviado_cliente', 'en_revision_cliente', 'cambios_solicitados', 'aprobado_cliente', 'aprobado_final', 'publicado', 'archivado')),
    account_manager_id TEXT NOT NULL,
    account_manager_nombre TEXT NOT NULL,
    fecha_publicacion TIMESTAMPTZ NOT NULL,
    plataforma TEXT NOT NULL, -- instagram, facebook, tiktok, linkedin, etc.
    iteraciones INTEGER DEFAULT 0,
    max_iteraciones INTEGER DEFAULT 3,
    hashtags TEXT[] DEFAULT '{}',
    origen TEXT DEFAULT 'planificada' CHECK (origen IN ('planificada', 'extraordinaria')),
    objetivo_marketing TEXT,
    etapa_embudo TEXT,
    cta_propuesto TEXT,
    tono_sugerido TEXT,
    explicacion_estrategica TEXT,
    razon_estrategica TEXT,
    copy_activo TEXT,
    observaciones_agencia TEXT,
    observaciones_cliente TEXT,
    seleccionado_pauta BOOLEAN DEFAULT FALSE,
    pauta_aprobada BOOLEAN DEFAULT FALSE,
    pauta_presupuesto NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CONTENT FILES (SUPABASE STORAGE ATTACHMENTS)
CREATE TABLE IF NOT EXISTS public.content_files (
    id TEXT PRIMARY KEY DEFAULT 'cf-' || md5(random()::text),
    content_piece_id TEXT NOT NULL REFERENCES public.content_pieces(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    nombre TEXT NOT NULL,
    formato TEXT,
    resolucion TEXT,
    size_mb NUMERIC(6, 2) DEFAULT 0.00,
    duracion_seg NUMERIC(6, 2),
    estado_procesamiento TEXT DEFAULT 'ready' CHECK (estado_procesamiento IN ('pending', 'processing', 'ready')),
    version INTEGER DEFAULT 1,
    es_version_activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PORTAL COMMENTS (BITACORA DE AUDITORIA)
CREATE TABLE IF NOT EXISTS public.portal_comments (
    id TEXT PRIMARY KEY DEFAULT 'comm-' || md5(random()::text),
    content_piece_id TEXT NOT NULL REFERENCES public.content_pieces(id) ON DELETE CASCADE,
    autor_rol TEXT NOT NULL CHECK (autor_rol IN ('Agencia', 'Cliente')),
    autor_nombre TEXT NOT NULL,
    texto TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_pieces_client ON public.content_pieces(client_id);
CREATE INDEX IF NOT EXISTS idx_pieces_campaign ON public.content_pieces(campaign_id);
CREATE INDEX IF NOT EXISTS idx_pieces_date ON public.content_pieces(fecha_publicacion);
CREATE INDEX IF NOT EXISTS idx_files_piece ON public.content_files(content_piece_id);
CREATE INDEX IF NOT EXISTS idx_comments_piece ON public.portal_comments(content_piece_id);

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Prevent Clients from seeing internal metrics, settings or other brand data
-- =====================================================================

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_pieces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_comments ENABLE ROW LEVEL SECURITY;

-- Clients can only see their own client record
CREATE POLICY client_select_own ON public.clients
    FOR SELECT
    USING (auth.uid()::text = id OR auth.role() = 'service_role');

-- Agency users can see all clients
CREATE POLICY agency_select_all_clients ON public.clients
    FOR ALL
    USING (auth.jwt() ->> 'email' LIKE '%@fplus.agency%' OR auth.role() = 'service_role');

-- Campaigns visibility rules
CREATE POLICY client_select_own_campaigns ON public.campaigns
    FOR SELECT
    USING (client_id = (auth.jwt() ->> 'client_id')::text OR auth.role() = 'service_role');

CREATE POLICY agency_all_campaigns ON public.campaigns
    FOR ALL
    USING (auth.jwt() ->> 'email' LIKE '%@fplus.agency%' OR auth.role() = 'service_role');

-- Pieces visibility rules
CREATE POLICY client_select_own_pieces ON public.content_pieces
    FOR SELECT
    USING (client_id = (auth.jwt() ->> 'client_id')::text OR auth.role() = 'service_role');

CREATE POLICY agency_all_pieces ON public.content_pieces
    FOR ALL
    USING (auth.jwt() ->> 'email' LIKE '%@fplus.agency%' OR auth.role() = 'service_role');

-- Files visibility rules
CREATE POLICY client_select_own_files ON public.content_files
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.content_pieces
        WHERE public.content_pieces.id = public.content_files.content_piece_id
          AND public.content_pieces.client_id = (auth.jwt() ->> 'client_id')::text
    ) OR auth.role() = 'service_role');

CREATE POLICY agency_all_files ON public.content_files
    FOR ALL
    USING (auth.jwt() ->> 'email' LIKE '%@fplus.agency%' OR auth.role() = 'service_role');
