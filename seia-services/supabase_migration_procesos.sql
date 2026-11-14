-- =============================================================================
-- SEIA - Actualización de esquema para la tabla procesos_secop en Supabase
-- Ejecuta este script en el SQL Editor de Supabase para habilitar las nuevas columnas
-- y vaciar los procesos antiguos no filtrados.
-- =============================================================================

ALTER TABLE public.procesos_secop
  ADD COLUMN IF NOT EXISTS codigo_unspsc_usado TEXT,
  ADD COLUMN IF NOT EXISTS fecha_publicacion TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS fecha_cierre TIMESTAMPTZ;

-- Opcional: Limpiar procesos antiguos antes de la nueva sincronización
TRUNCATE TABLE public.procesos_secop;
