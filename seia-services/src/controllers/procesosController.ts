import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { sincronizarContratosSecopConSupabase } from "../services/secopFetcher";
import { ProcesoSecop } from "../types/entidades";

/**
 * Normaliza un registro leído de la tabla 'procesos_secop' en Supabase
 * (con columnas uid_secop, entidad, descripcion, presupuesto, modalidad, fecha_cierre, enlace_secop)
 * para que tanto las llaves de base de datos como las propiedades del dashboard en Next.js estén presentes.
 */
function normalizarProcesoDesdeBD(proc: Record<string, any>): ProcesoSecop {
  const uid = String(proc.uid_secop || proc.id_proceso_secop || proc.id || "");
  const presupuestoNum = Number(
    proc.presupuesto ?? proc.precio_base ?? proc.valor_del_contrato ?? 0
  );
  const textoDescripcion =
    proc.descripcion ||
    proc.objeto_contrato ||
    proc.descripcion_proceso ||
    "Sin descripción";

  let enlaceUrl =
    "https://community.secop.gov.co/Public/Tendering/ContractNoticeManagement/Index";
  const rawEnlace = proc.enlace_secop || proc.url_proceso;
  if (typeof rawEnlace === "string" && rawEnlace.trim().length > 0) {
    try {
      if (rawEnlace.trim().startsWith("{")) {
        const parsed = JSON.parse(rawEnlace);
        if (parsed?.url) enlaceUrl = parsed.url;
      } else {
        enlaceUrl = rawEnlace;
      }
    } catch {
      enlaceUrl = rawEnlace;
    }
  } else if (rawEnlace && typeof rawEnlace === "object" && rawEnlace.url) {
    enlaceUrl = rawEnlace.url;
  }

  const codigoUnspscUsado =
    proc.codigo_unspsc_usado || proc.codigo_unspsc || null;
  const fechaPublicacion = proc.fecha_publicacion || null;
  const fechaCierre =
    proc.fecha_cierre || proc.fecha_limite_recepcion || null;

  return {
    ...proc,
    id: String(proc.id || uid),
    uid_secop: uid,
    id_proceso_secop: uid,
    referencia_proceso: String(proc.referencia_proceso || uid || "SECOP-II"),
    entidad: String(proc.entidad || "Sin entidad"),
    descripcion: String(textoDescripcion),
    presupuesto: Number.isFinite(presupuestoNum) ? presupuestoNum : 0,
    modalidad: String(proc.modalidad || "No especificada"),
    codigo_unspsc_usado: codigoUnspscUsado ? String(codigoUnspscUsado) : null,
    fecha_publicacion: fechaPublicacion ? String(fechaPublicacion) : null,
    fecha_cierre: fechaCierre ? String(fechaCierre) : null,
    enlace_secop: enlaceUrl,
    nit_entidad: String(proc.nit_entidad || ""),
    departamento: String(proc.departamento || "Colombia"),
    ciudad: String(proc.ciudad || "SECOP II"),
    objeto_contrato: String(textoDescripcion),
    descripcion_proceso: String(textoDescripcion),
    precio_base: Number.isFinite(presupuestoNum) ? presupuestoNum : 0,
    tipo_contrato: String(proc.tipo_contrato || proc.modalidad || "Contrato SECOP II"),
    codigo_unspsc: codigoUnspscUsado ? String(codigoUnspscUsado) : "No especificado",
    estado_proceso: String(proc.estado_proceso || "Publicado"),
    estado_interno: proc.estado_interno || "Detectado",
    fecha_limite_recepcion: fechaCierre ? String(fechaCierre) : null,
    url_proceso: enlaceUrl,
    es_favorito: Boolean(proc.es_favorito),
    notas_analista: String(proc.notas_analista || ""),
    fecha_sincronizacion: String(
      proc.fecha_sincronizacion || proc.created_at || new Date().toISOString()
    ),
  };
}

export const listarProcesos = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const busqueda = req.query.busqueda ? String(req.query.busqueda).trim() : "";
    const modalidad = req.query.modalidad ? String(req.query.modalidad).trim() : "";
    const departamento = req.query.departamento
      ? String(req.query.departamento).trim()
      : "";
    const estado = req.query.estado ? String(req.query.estado).trim() : "";
    const cuantiaMinima = req.query.cuantiaMinima
      ? Number(req.query.cuantiaMinima)
      : undefined;
    const cuantiaMaxima = req.query.cuantiaMaxima
      ? Number(req.query.cuantiaMaxima)
      : undefined;
    const soloFavoritos = req.query.soloFavoritos === "true";

    const { data, error } = await supabase
      .from("procesos_secop")
      .select("*");

    if (error) {
      console.error("Error BD:", error);
      res.status(500).json({
        exito: false,
        mensaje: "Error al consultar la tabla procesos_secop en Supabase.",
        error,
        detalle: error.message,
      });
      return;
    }

    let procesos = ((data || []) as Record<string, any>[]).map((proc) =>
      normalizarProcesoDesdeBD(proc)
    );

    procesos = procesos
      .filter((proc) => {
        if (soloFavoritos && !proc.es_favorito) return false;
        if (
          modalidad &&
          modalidad !== "Todas" &&
          !(proc.modalidad || "").toLowerCase().includes(modalidad.toLowerCase())
        ) {
          return false;
        }
        if (
          departamento &&
          departamento !== "Todos" &&
          !(proc.departamento || "")
            .toLowerCase()
            .includes(departamento.toLowerCase())
        ) {
          return false;
        }
        if (
          estado &&
          estado !== "Todos" &&
          (proc.estado_interno || "").toLowerCase() !== estado.toLowerCase()
        ) {
          return false;
        }
        if (
          typeof cuantiaMinima === "number" &&
          !Number.isNaN(cuantiaMinima) &&
          (proc.precio_base || 0) < cuantiaMinima
        ) {
          return false;
        }
        if (
          typeof cuantiaMaxima === "number" &&
          !Number.isNaN(cuantiaMaxima) &&
          cuantiaMaxima > 0 &&
          (proc.precio_base || 0) > cuantiaMaxima
        ) {
          return false;
        }
        if (busqueda) {
          const termino = busqueda.toLowerCase();
          const coincide =
            (proc.objeto_contrato || "").toLowerCase().includes(termino) ||
            (proc.entidad || "").toLowerCase().includes(termino) ||
            (proc.referencia_proceso || "").toLowerCase().includes(termino) ||
            (proc.uid_secop || "").toLowerCase().includes(termino);
          if (!coincide) return false;
        }
        return true;
      })
      .sort((a, b) =>
        (b.fecha_publicacion || "").localeCompare(a.fecha_publicacion || "")
      );

    res.status(200).json({
      exito: true,
      total: procesos.length,
      datos: procesos,
    });
  } catch (error: any) {
    console.error("Error BD:", error);
    res.status(500).json({
      exito: false,
      mensaje: "No fue posible consultar los procesos desde Supabase.",
      error,
      detalle: error?.message || "Error interno del servidor",
    });
  }
};

export const crearProceso = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      uid_secop,
      id_proceso_secop,
      entidad,
      descripcion,
      objeto_contrato,
      presupuesto,
      precio_base,
      modalidad,
      fecha_cierre,
      enlace_secop,
    } = req.body;

    const uid = uid_secop || id_proceso_secop || `CO1.REQ.${Date.now()}`;

    const procesoMapeado = {
      uid_secop: uid,
      entidad: entidad || "Sin entidad",
      descripcion: descripcion || objeto_contrato || "Sin descripción",
      presupuesto: Number(presupuesto ?? precio_base ?? 0),
      modalidad: modalidad || "No especificada",
      fecha_cierre: fecha_cierre || null,
      enlace_secop: enlace_secop || null,
    };

    const { data, error } = await supabase
      .from("procesos_secop")
      .upsert([procesoMapeado], { onConflict: "uid_secop" })
      .select()
      .single();

    if (error) {
      console.error("Error guardando en BD:", error);
      res.status(500).json({
        exito: false,
        mensaje: "Error al guardar el proceso en procesos_secop de Supabase.",
        error,
        detalle: error.message,
      });
      return;
    }

    res.status(201).json({
      exito: true,
      mensaje: "Proceso de contratación registrado en Supabase.",
      datos: normalizarProcesoDesdeBD(data || procesoMapeado),
    });
  } catch (error: any) {
    console.error("Error BD:", error);
    res.status(500).json({
      exito: false,
      mensaje: "Error al registrar el proceso en Supabase.",
      error,
      detalle: error?.message || "Error interno del servidor",
    });
  }
};

export const sincronizarProcesosDesdeSecop = async (
  req: Request,
  res: Response
): Promise<void> => {
  const inicio = Date.now();
  try {
    const parametroId = req.body?.parametro_id
      ? String(req.body.parametro_id)
      : undefined;
    const limite = req.body?.limite ? Number(req.body.limite) : 50;

    const resultado = await sincronizarContratosSecopConSupabase({
      parametro_id: parametroId,
      limite,
    });

    const tiempoEjecucionMs = Date.now() - inicio;

    const procesosNormalizados = (resultado.procesosSincronizados || []).map(
      (p) => normalizarProcesoDesdeBD(p as Record<string, any>)
    );

    res.status(200).json({
      exito: true,
      mensaje: `Sincronización completada (${resultado.totalRecibidosApi} procesos obtenidos de SECOP II y ${resultado.nuevosInsertados} guardados en Supabase).`,
      fuente:
        process.env.SECOP_API_URL ||
        "https://www.datos.gov.co/resource/p6dx-8zbt.json",
      totalRecibidos: resultado.totalRecibidosApi,
      nuevosInsertados: resultado.nuevosInsertados,
      tiempoEjecucionMs,
      datos: procesosNormalizados,
    });
  } catch (error: any) {
    console.error("Error BD:", error);
    res.status(500).json({
      exito: false,
      mensaje: "Error durante la sincronización con SECOP II y Supabase.",
      error: error?.response?.data || error,
      detalle:
        error?.response?.data?.message ||
        error?.message ||
        "Error interno del servidor",
    });
  }
};

export const actualizarProceso = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = String(req.params.id);

    const { data, error } = await supabase
      .from("procesos_secop")
      .update(req.body)
      .eq("uid_secop", id)
      .select()
      .maybeSingle();

    if (error) {
      console.error("Error BD:", error);
      res.status(500).json({
        exito: false,
        mensaje: "No se pudo actualizar el proceso en Supabase.",
        error,
        detalle: error.message,
      });
      return;
    }

    res.status(200).json({
      exito: true,
      mensaje: "Estado del proceso actualizado en Supabase.",
      datos: normalizarProcesoDesdeBD(data || { uid_secop: id, ...req.body }),
    });
  } catch (error: any) {
    console.error("Error BD:", error);
    res.status(500).json({
      exito: false,
      mensaje: "Error al actualizar el proceso en Supabase.",
      error,
      detalle: error?.message || "Error interno del servidor",
    });
  }
};

export const eliminarProceso = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = String(req.params.id);

    let respuesta = await supabase
      .from("procesos_secop")
      .delete()
      .eq("uid_secop", id)
      .select();

    if (!respuesta.error && (!respuesta.data || respuesta.data.length === 0)) {
      respuesta = await supabase
        .from("procesos_secop")
        .delete()
        .eq("id", id)
        .select();
    }

    if (respuesta.error) {
      console.error("Error BD:", respuesta.error);
      res.status(500).json({
        exito: false,
        mensaje: "Error al eliminar el proceso en Supabase.",
        error: respuesta.error,
        detalle: respuesta.error.message,
      });
      return;
    }

    res.status(200).json({
      exito: true,
      mensaje: "Proceso eliminado de Supabase correctamente.",
    });
  } catch (error: any) {
    console.error("Error BD:", error);
    res.status(500).json({
      exito: false,
      mensaje: "Error al eliminar el proceso en Supabase.",
      error,
      detalle: error?.message || "Error interno del servidor",
    });
  }
};
