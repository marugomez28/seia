-- =============================================================================
-- SEIA - Esquema de Base de Datos PostgreSQL para Supabase
-- Sistema Automatizado de Búsqueda, Filtrado y Gestión de Procesos SECOP II
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. Tabla: parametros_busqueda (ParametrosBusqueda)
-- Almacena los perfiles de búsqueda y criterios activos de filtrado (UNSPSC, modalidades, palabras clave)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.parametros_busqueda (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_perfil VARCHAR(160) NOT NULL,
    codigo_unspsc VARCHAR(60) NOT NULL DEFAULT '',
    entidad_objetivo VARCHAR(220) NOT NULL DEFAULT 'TODAS LAS ENTIDADES',
    modalidad VARCHAR(140) NOT NULL DEFAULT 'Licitación pública',
    departamento VARCHAR(100) NOT NULL DEFAULT 'Bogotá D.C.',
    cuantia_minima NUMERIC(18, 2) NOT NULL DEFAULT 0,
    cuantia_maxima NUMERIC(18, 2),
    palabras_clave TEXT[] NOT NULL DEFAULT '{}',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    frecuencia_alerta VARCHAR(30) NOT NULL DEFAULT 'diaria'
        CHECK (frecuencia_alerta IN ('tiempo_real', 'diaria', 'semanal')),
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 2. Tabla: procesos_secop (ProcesosSecop)
-- Almacena los contratos reales sincronizados desde Datos Abiertos de SECOP II
-- Usa uid_secop como clave única para evitar duplicados en cada sincronización
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.procesos_secop (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uid_secop VARCHAR(100) UNIQUE NOT NULL,
    id_proceso_secop VARCHAR(100),
    referencia_proceso VARCHAR(140) NOT NULL,
    entidad VARCHAR(250) NOT NULL,
    nit_entidad VARCHAR(50) DEFAULT '',
    departamento VARCHAR(100) DEFAULT '',
    ciudad VARCHAR(100) DEFAULT '',
    objeto_contrato TEXT NOT NULL,
    descripcion_proceso TEXT DEFAULT '',
    precio_base NUMERIC(18, 2) NOT NULL DEFAULT 0,
    modalidad VARCHAR(140) NOT NULL,
    tipo_contrato VARCHAR(120) DEFAULT '',
    codigo_unspsc VARCHAR(80) DEFAULT '',
    estado_proceso VARCHAR(100) NOT NULL DEFAULT 'Publicado',
    estado_interno VARCHAR(50) NOT NULL DEFAULT 'Detectado'
        CHECK (estado_interno IN ('Detectado', 'En análisis', 'Estructurando oferta', 'Presentado', 'Descartado')),
    fecha_publicacion TIMESTAMPTZ,
    fecha_limite_recepcion TIMESTAMPTZ,
    url_proceso TEXT DEFAULT '',
    es_favorito BOOLEAN NOT NULL DEFAULT FALSE,
    notas_analista TEXT DEFAULT '',
    fecha_sincronizacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 3. Tabla: historial_filtros (HistorialFiltros)
-- Registra la auditoría de cada ejecución de búsqueda y sincronización con SECOP II
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.historial_filtros (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parametro_id UUID REFERENCES public.parametros_busqueda(id) ON DELETE SET NULL,
    nombre_ejecucion VARCHAR(180) NOT NULL,
    filtros_aplicados JSONB NOT NULL DEFAULT '{}'::jsonb,
    total_encontrados INTEGER NOT NULL DEFAULT 0,
    nuevos_insertados INTEGER NOT NULL DEFAULT 0,
    tiempo_ejecucion_ms INTEGER NOT NULL DEFAULT 0,
    estado_sincronizacion VARCHAR(40) NOT NULL DEFAULT 'completado'
        CHECK (estado_sincronizacion IN ('completado', 'parcial', 'error')),
    fecha_ejecucion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para optimización de consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_procesos_secop_uid ON public.procesos_secop(uid_secop);
CREATE INDEX IF NOT EXISTS idx_procesos_secop_entidad ON public.procesos_secop(entidad);
CREATE INDEX IF NOT EXISTS idx_procesos_secop_modalidad ON public.procesos_secop(modalidad);
CREATE INDEX IF NOT EXISTS idx_procesos_secop_departamento ON public.procesos_secop(departamento);
CREATE INDEX IF NOT EXISTS idx_procesos_secop_unspsc ON public.procesos_secop(codigo_unspsc);
CREATE INDEX IF NOT EXISTS idx_procesos_secop_favorito ON public.procesos_secop(es_favorito);
CREATE INDEX IF NOT EXISTS idx_historial_filtros_fecha ON public.historial_filtros(fecha_ejecucion DESC);

-- Función y trigger para actualizar automáticamente fecha_actualizacion
CREATE OR REPLACE FUNCTION public.actualizar_columna_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_parametros_busqueda_actualizacion ON public.parametros_busqueda;
CREATE TRIGGER trg_parametros_busqueda_actualizacion
BEFORE UPDATE ON public.parametros_busqueda
FOR EACH ROW
EXECUTE FUNCTION public.actualizar_columna_timestamp();

-- Políticas de acceso para permitir operaciones CRUD mediante SUPABASE_ANON_KEY
ALTER TABLE public.parametros_busqueda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procesos_secop ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historial_filtros ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acceso completo a parametros_busqueda" ON public.parametros_busqueda;
CREATE POLICY "Acceso completo a parametros_busqueda"
ON public.parametros_busqueda FOR ALL
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Acceso completo a procesos_secop" ON public.procesos_secop;
CREATE POLICY "Acceso completo a procesos_secop"
ON public.procesos_secop FOR ALL
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Acceso completo a historial_filtros" ON public.historial_filtros;
CREATE POLICY "Acceso completo a historial_filtros"
ON public.historial_filtros FOR ALL
USING (true)
WITH CHECK (true);
