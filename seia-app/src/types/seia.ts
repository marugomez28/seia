/**
 * Definiciones de tipos para el frontend de SEIA (seia-app)
 * Coherentes con el contrato OpenSpec y las tablas reales en Supabase.
 */

export type FrecuenciaAlerta = "tiempo_real" | "diaria" | "semanal";

export type EstadoInternoProceso =
  | "Detectado"
  | "En análisis"
  | "Estructurando oferta"
  | "Presentado"
  | "Descartado";

export type VistaActiva = "procesos" | "parametros" | "historial" | "openspec";

export type TipoParametroBusqueda =
  | "palabra_clave"
  | "codigo_unspsc"
  | "modalidad";

export interface ParametroBusqueda {
  id: string;
  tipo: TipoParametroBusqueda | string;
  valor: string;
  area: string;
  activo: boolean;
}

export interface CrearParametroFormulario {
  tipo: string;
  valor: string;
  area: string;
  activo?: boolean;
}

export interface ProcesoSecop {
  id: string;
  uid_secop: string;
  id_proceso_secop: string;
  referencia_proceso: string;
  entidad: string;
  nit_entidad: string;
  departamento: string;
  ciudad: string;
  objeto_contrato: string;
  descripcion_proceso: string;
  precio_base: number;
  modalidad: string;
  tipo_contrato: string;
  codigo_unspsc: string;
  codigo_unspsc_usado?: string | null;
  estado_proceso: string;
  estado_interno: EstadoInternoProceso;
  fecha_publicacion: string | null;
  fecha_cierre?: string | null;
  fecha_limite_recepcion: string | null;
  url_proceso: string;
  es_favorito: boolean;
  notas_analista: string;
  fecha_sincronizacion: string;
}

export interface HistorialFiltro {
  id: string;
  parametro_id: string | null;
  nombre_ejecucion: string;
  filtros_aplicados: Record<string, unknown>;
  total_encontrados: number;
  nuevos_insertados: number;
  tiempo_ejecucion_ms: number;
  estado_sincronizacion: "completado" | "parcial" | "error";
  fecha_ejecucion: string;
}

export interface FiltrosActivosProcesos {
  busqueda: string;
  modalidad: string;
  departamento: string;
  estado: string;
  cuantiaMinima: string;
  soloFavoritos: boolean;
}
