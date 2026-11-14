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

export type VistaActiva =
  | "procesos"
  | "ia"
  | "parametros"
  | "historial"
  | "openspec";

/**
 * Integración con el modelo de IA (seia-ml) a través de seia-services.
 */
export type NivelAfinidadIA = "Alta" | "Media" | "Baja";

export interface TerminoClaveIA {
  termino: string;
  contribucion: number;
  direccion: "afin" | "no_afin";
}

export interface AfinidadIA {
  puntaje: number;
  afin: boolean;
  nivel: NivelAfinidadIA;
  terminos_reconocidos: number;
  terminos_clave?: TerminoClaveIA[];
}

export interface ResultadoClasificacionIA extends AfinidadIA {
  texto: string;
}

export interface RespuestaClasificacionIA {
  resultados: ResultadoClasificacionIA[];
  tiempo_inferencia_ms: number;
  version_modelo: string;
  umbrales: { balanceado: number; exploracion: number };
  calculado_en: string;
}

export interface ModeloIA {
  version: string;
  tipo: string;
  terminos_vocabulario: number;
  umbrales: { balanceado: number; exploracion: number };
  entrenado_en?: string;
  notebook?: string;
  fuente_datos?: string;
  variable_objetivo?: string;
  registros?: Record<string, number>;
  metricas_prueba?: Record<string, number>;
  matriz_confusion_prueba?: Record<string, number>;
  hiperparametros?: Record<string, unknown>;
}

export interface EstadoIA {
  disponible: boolean;
  servicio: string;
  mensaje?: string;
  modelo?: ModeloIA;
}

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
  /** Afinidad calculada en vivo por el modelo de IA (null si seia-ml no responde). */
  afinidad_ia?: AfinidadIA | null;
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
  /** "Todos" | "Alta" (solo afines) | "Alta y Media" (afines y por revisar) */
  afinidadIA: string;
  ordenarPor: "fecha" | "afinidad";
}
