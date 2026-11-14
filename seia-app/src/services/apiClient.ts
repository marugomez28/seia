import {
  CrearParametroFormulario,
  EstadoInternoProceso,
  FiltrosActivosProcesos,
  HistorialFiltro,
  ParametroBusqueda,
  ProcesoSecop,
} from "@/types/seia";

const URL_BASE_CRUDA = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"
).replace(/\/+$/, "");

const API_BASE_URL = URL_BASE_CRUDA.endsWith("/api")
  ? URL_BASE_CRUDA
  : `${URL_BASE_CRUDA}/api`;

/**
 * Extrae el detalle legible del objeto error devuelto por Express / Supabase.
 */
function extraerMensajeError(json: any, predeterminado: string): string {
  if (!json) return predeterminado;
  if (typeof json.error === "object" && json.error !== null) {
    const msg = json.error.message || json.error.details || json.error.hint;
    const code = json.error.code ? ` (Código: ${json.error.code})` : "";
    if (msg) return `${msg}${code}`;
  }
  return json.detalle || json.mensaje || predeterminado;
}

/**
 * Cliente HTTP de seia-app conectado directamente a la API Express (seia-services)
 * y a las tablas reales de Supabase (parametros_busqueda, procesos_secop, historial_filtros).
 */
export const clienteApiSeia = {
  async obtenerParametros(): Promise<ParametroBusqueda[]> {
    const respuesta = await fetch(`${API_BASE_URL}/parametros`, {
      cache: "no-store",
    });

    const json = await respuesta.json();
    if (!respuesta.ok || !json.exito) {
      throw new Error(
        extraerMensajeError(
          json,
          "Error al obtener parámetros de búsqueda desde seia-services."
        )
      );
    }

    return (json.datos || []) as ParametroBusqueda[];
  },

  async crearParametro(
    datos: CrearParametroFormulario
  ): Promise<ParametroBusqueda> {
    const respuesta = await fetch(`${API_BASE_URL}/parametros`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });

    const json = await respuesta.json();
    if (!respuesta.ok || !json.exito) {
      throw new Error(
        extraerMensajeError(
          json,
          "Error al crear el parámetro de búsqueda en Supabase."
        )
      );
    }

    return json.datos as ParametroBusqueda;
  },

  async actualizarParametro(
    id: string,
    cambios: Partial<CrearParametroFormulario>
  ): Promise<ParametroBusqueda> {
    const respuesta = await fetch(`${API_BASE_URL}/parametros/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cambios),
    });

    const json = await respuesta.json();
    if (!respuesta.ok || !json.exito) {
      throw new Error(
        extraerMensajeError(
          json,
          "Error al actualizar el parámetro de búsqueda en Supabase."
        )
      );
    }

    return json.datos as ParametroBusqueda;
  },

  async eliminarParametro(id: string): Promise<void> {
    const respuesta = await fetch(`${API_BASE_URL}/parametros/${id}`, {
      method: "DELETE",
    });

    const json = await respuesta.json();
    if (!respuesta.ok || !json.exito) {
      throw new Error(
        extraerMensajeError(
          json,
          "Error al eliminar el parámetro de búsqueda en Supabase."
        )
      );
    }
  },

  async obtenerProcesos(
    filtros?: Partial<FiltrosActivosProcesos>
  ): Promise<ProcesoSecop[]> {
    const params = new URLSearchParams();
    if (filtros?.busqueda) params.set("busqueda", filtros.busqueda);
    if (filtros?.modalidad && filtros.modalidad !== "Todas") {
      params.set("modalidad", filtros.modalidad);
    }
    if (filtros?.departamento && filtros.departamento !== "Todos") {
      params.set("departamento", filtros.departamento);
    }
    if (filtros?.estado && filtros.estado !== "Todos") {
      params.set("estado", filtros.estado);
    }
    if (filtros?.cuantiaMinima) {
      params.set("cuantiaMinima", filtros.cuantiaMinima);
    }
    if (filtros?.soloFavoritos) {
      params.set("soloFavoritos", "true");
    }

    const queryString = params.toString();
    const url = queryString
      ? `${API_BASE_URL}/procesos?${queryString}`
      : `${API_BASE_URL}/procesos`;

    const respuesta = await fetch(url, { cache: "no-store" });
    const json = await respuesta.json();

    if (!respuesta.ok || !json.exito) {
      throw new Error(
        extraerMensajeError(
          json,
          "Error al consultar los procesos de SECOP II desde Supabase."
        )
      );
    }

    return (json.datos || []) as ProcesoSecop[];
  },

  async sincronizarConSecop(opciones?: {
    parametro_id?: string;
    limite?: number;
  }): Promise<{
    mensaje: string;
    nuevosInsertados: number;
    totalRecibidos: number;
    datos: ProcesoSecop[];
  }> {
    const respuesta = await fetch(`${API_BASE_URL}/procesos/sincronizar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(opciones || {}),
    });

    const json = await respuesta.json();
    if (!respuesta.ok || !json.exito) {
      throw new Error(
        extraerMensajeError(
          json,
          "Error al sincronizar contratos con la API de SECOP II."
        )
      );
    }

    return {
      mensaje: json.mensaje,
      nuevosInsertados: json.nuevosInsertados,
      totalRecibidos: json.totalRecibidos,
      datos: (json.datos || []) as ProcesoSecop[],
    };
  },

  async actualizarProceso(
    id: string,
    cambios: {
      estado_interno?: EstadoInternoProceso;
      es_favorito?: boolean;
      notas_analista?: string;
    }
  ): Promise<ProcesoSecop> {
    const respuesta = await fetch(`${API_BASE_URL}/procesos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cambios),
    });

    const json = await respuesta.json();
    if (!respuesta.ok || !json.exito) {
      throw new Error(
        extraerMensajeError(json, "Error al actualizar el proceso en Supabase.")
      );
    }

    return json.datos as ProcesoSecop;
  },

  async eliminarProceso(id: string): Promise<void> {
    const respuesta = await fetch(`${API_BASE_URL}/procesos/${id}`, {
      method: "DELETE",
    });

    const json = await respuesta.json();
    if (!respuesta.ok || !json.exito) {
      throw new Error(
        extraerMensajeError(json, "Error al eliminar el proceso en Supabase.")
      );
    }
  },

  async obtenerHistorial(): Promise<HistorialFiltro[]> {
    const respuesta = await fetch(`${API_BASE_URL}/historial`, {
      cache: "no-store",
    });

    const json = await respuesta.json();
    if (!respuesta.ok || !json.exito) {
      throw new Error(
        extraerMensajeError(
          json,
          "Error al consultar el historial de filtros en Supabase."
        )
      );
    }

    return (json.datos || []) as HistorialFiltro[];
  },

  async eliminarHistorial(id: string): Promise<void> {
    const respuesta = await fetch(`${API_BASE_URL}/historial/${id}`, {
      method: "DELETE",
    });

    const json = await respuesta.json();
    if (!respuesta.ok || !json.exito) {
      throw new Error(
        extraerMensajeError(
          json,
          "Error al eliminar el registro de historial en Supabase."
        )
      );
    }
  },
};
