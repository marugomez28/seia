/**
 * Tipos e interfaces de dominio para SEIA (seia-services)
 * Conectado a las tablas reales en Supabase:
 * 1. parametros_busqueda
 * 2. procesos_secop
 * 3. historial_filtros
 */

export type FrecuenciaAlerta = "tiempo_real" | "diaria" | "semanal";

export type EstadoInternoProceso =
  | "Detectado"
  | "En análisis"
  | "Estructurando oferta"
  | "Presentado"
  | "Descartado";

export type EstadoSincronizacion = "completado" | "parcial" | "error";

/**
 * Tabla 1: parametros_busqueda (ParametrosBusqueda)
 * Estructura real en Supabase: id, tipo, valor, area, activo
 */
export interface ParametroBusqueda {
  id: string;
  tipo: string; // 'palabra_clave' | 'codigo_unspsc' | 'modalidad'
  valor: string; // ej. 'TRD', '43232300', 'Menor cuantía'
  area: string; // ej. 'Gestión Documental', 'Tecnología y SGDEA'
  activo: boolean;
  // Propiedades opcionales de compatibilidad
  nombre_perfil?: string;
  codigo_unspsc?: string;
  entidad_objetivo?: string;
  modalidad?: string;
  departamento?: string;
  cuantia_minima?: number;
  cuantia_maxima?: number | null;
  palabras_clave?: string[];
  frecuencia_alerta?: FrecuenciaAlerta;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

export interface CrearParametroBusquedaDTO {
  tipo: string;
  valor: string;
  area: string;
  activo?: boolean;
}

export type ActualizarParametroBusquedaDTO = Partial<CrearParametroBusquedaDTO>;

/**
 * Estructura exacta de inserción/upsert para la tabla procesos_secop en Supabase.
 */
export interface ProcesoMapeadoSupabase {
  uid_secop: string;
  entidad: string;
  descripcion: string;
  presupuesto: number;
  modalidad: string;
  codigo_unspsc_usado: string | null;
  fecha_publicacion: string | null;
  fecha_cierre: string | null;
  enlace_secop: string | null;
}

/**
 * Tabla 2: procesos_secop (ProcesosSecop)
 * Incluye las columnas reales de Supabase y campos normalizados para el dashboard.
 */
export interface ProcesoSecop {
  id?: string;
  uid_secop: string;
  id_proceso_secop?: string;
  referencia_proceso?: string;
  entidad: string;
  descripcion?: string;
  presupuesto?: number;
  codigo_unspsc_usado?: string | null;
  fecha_publicacion?: string | null;
  fecha_cierre?: string | null;
  enlace_secop?: string | null;
  nit_entidad?: string;
  departamento?: string;
  ciudad?: string;
  objeto_contrato?: string;
  descripcion_proceso?: string;
  precio_base?: number;
  modalidad: string;
  tipo_contrato?: string;
  codigo_unspsc?: string;
  estado_proceso?: string;
  estado_interno?: EstadoInternoProceso;
  fecha_limite_recepcion?: string | null;
  url_proceso?: string;
  es_favorito?: boolean;
  notas_analista?: string;
  fecha_sincronizacion?: string;
  /** Afinidad calculada en vivo por el modelo de IA (null si seia-ml no está disponible). */
  afinidad_ia?: ResultadoAfinidadIA | null;
}

/**
 * Integración con el modelo de IA (seia-ml): afinidad del objeto contractual
 * con el portafolio de MGD Bitforge S.A.S.
 */
export type NivelAfinidadIA = "Alta" | "Media" | "Baja";

export interface TerminoClaveIA {
  termino: string;
  contribucion: number;
  direccion: "afin" | "no_afin";
}

export interface ResultadoAfinidadIA {
  puntaje: number;
  afin: boolean;
  nivel: NivelAfinidadIA;
  terminos_reconocidos: number;
  terminos_clave?: TerminoClaveIA[];
}

export interface RespuestaPrediccionIA {
  resultados: ResultadoAfinidadIA[];
  total: number;
  tiempo_inferencia_ms: number;
  version_modelo: string;
  umbrales: { balanceado: number; exploracion: number };
  calculado_en: string;
}

export interface FiltrosConsultaProcesos {
  busqueda?: string;
  modalidad?: string;
  departamento?: string;
  estado?: string;
  cuantiaMinima?: number;
  cuantiaMaxima?: number;
  soloFavoritos?: boolean;
}

export interface ActualizarProcesoSecopDTO {
  estado_interno?: EstadoInternoProceso;
  es_favorito?: boolean;
  notas_analista?: string;
}

/**
 * Tabla 3: historial_filtros (HistorialFiltros)
 */
export interface HistorialFiltro {
  id: string;
  parametro_id: string | null;
  nombre_ejecucion: string;
  filtros_aplicados: Record<string, unknown>;
  total_encontrados: number;
  nuevos_insertados: number;
  tiempo_ejecucion_ms: number;
  estado_sincronizacion: EstadoSincronizacion;
  fecha_ejecucion?: string;
}

export interface CrearHistorialFiltroDTO {
  parametro_id?: string | null;
  nombre_ejecucion: string;
  filtros_aplicados: Record<string, unknown>;
  total_encontrados: number;
  nuevos_insertados: number;
  tiempo_ejecucion_ms: number;
  estado_sincronizacion?: EstadoSincronizacion;
}

/**
 * Estructura oficial del recurso SODA de Datos Abiertos de SECOP II
 * Endpoint público: https://www.datos.gov.co/resource/jbjy-vk9h.json
 */
export interface RegistroCrudoSecopII {
  id_del_proceso?: string;
  proceso_de_compra?: string;
  id_contrato?: string;
  referencia_del_contrato?: string;
  referencia_del_proceso?: string;
  nombre_entidad?: string;
  entidad?: string;
  nit_entidad?: string;
  departamento?: string;
  departamento_entidad?: string;
  ciudad?: string;
  ciudad_entidad?: string;
  descripci_n_del_procedimiento?: string;
  descripcion_del_proceso?: string;
  objeto_del_contrato?: string;
  nombre_del_procedimiento?: string;
  precio_base?: string;
  valor_del_contrato?: string;
  modalidad_de_contratacion?: string;
  tipo_de_contrato?: string;
  codigo_unspsc?: string;
  codigo_de_categoria_principal?: string;
  codigo_principal_de_categoria?: string;
  estado_contrato?: string;
  estado_del_procedimiento?: string;
  fecha_de_recepcion_de_respuestas?: string;
  fecha_de_publicacion_del?: string;
  fecha_de_firma?: string;
  fecha_de_inicio_del_contrato?: string;
  fecha_de_fin_del_contrato?: string;
  fecha_de_recepcion_de?: string;
  urlproceso?: { url?: string } | string;
  enlace_al_proceso?: { url?: string } | string;
}
