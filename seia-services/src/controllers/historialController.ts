import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { HistorialFiltro } from "../types/entidades";

/**
 * Controlador CRUD para la tabla historial_filtros en Supabase.
 * Implementa manejo de errores transparente con console.error("Error BD:", error)
 * y retorno del objeto error en res.status(500).json().
 */

export const listarHistorial = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from("historial_filtros")
      .select("*");

    if (error) {
      console.error("Error BD:", error);
      res.status(500).json({
        exito: false,
        mensaje: "Error al consultar la tabla historial_filtros en Supabase.",
        error,
        detalle: error.message,
      });
      return;
    }

    const lista = ((data || []) as HistorialFiltro[]).sort((a, b) =>
      (b.fecha_ejecucion || "").localeCompare(a.fecha_ejecucion || "")
    );

    res.status(200).json({
      exito: true,
      total: lista.length,
      datos: lista,
    });
  } catch (error: any) {
    console.error("Error BD:", error);
    res.status(500).json({
      exito: false,
      mensaje: "No fue posible consultar el historial de filtros en Supabase.",
      error,
      detalle: error?.message || "Error interno del servidor",
    });
  }
};

export const crearHistorial = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      parametro_id,
      nombre_ejecucion,
      filtros_aplicados,
      total_encontrados,
      nuevos_insertados,
      tiempo_ejecucion_ms,
      estado_sincronizacion,
    } = req.body;

    if (!nombre_ejecucion) {
      res.status(400).json({
        exito: false,
        mensaje: "El campo 'nombre_ejecucion' es obligatorio.",
      });
      return;
    }

    const { data, error } = await supabase
      .from("historial_filtros")
      .insert([
        {
          parametro_id: parametro_id || null,
          nombre_ejecucion,
          filtros_aplicados: filtros_aplicados || {},
          total_encontrados: Number(total_encontrados || 0),
          nuevos_insertados: Number(nuevos_insertados || 0),
          tiempo_ejecucion_ms: Number(tiempo_ejecucion_ms || 0),
          estado_sincronizacion: estado_sincronizacion || "completado",
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error BD:", error);
      res.status(500).json({
        exito: false,
        mensaje:
          "Error al insertar el registro en historial_filtros de Supabase.",
        error,
        detalle: error.message,
      });
      return;
    }

    res.status(201).json({
      exito: true,
      mensaje: "Registro de historial almacenado en Supabase.",
      datos: data as HistorialFiltro,
    });
  } catch (error: any) {
    console.error("Error BD:", error);
    res.status(500).json({
      exito: false,
      mensaje: "Error al registrar entrada en el historial.",
      error,
      detalle: error?.message || "Error interno del servidor",
    });
  }
};

export const eliminarHistorial = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = String(req.params.id);

    const { data, error } = await supabase
      .from("historial_filtros")
      .delete()
      .eq("id", id)
      .select();

    if (error) {
      console.error("Error BD:", error);
      res.status(500).json({
        exito: false,
        mensaje: "Error al eliminar el registro de historial en Supabase.",
        error,
        detalle: error.message,
      });
      return;
    }

    if (!data || data.length === 0) {
      res.status(404).json({
        exito: false,
        mensaje: "El registro de historial indicado no fue encontrado en Supabase.",
      });
      return;
    }

    res.status(200).json({
      exito: true,
      mensaje: "Registro de historial eliminado de Supabase.",
    });
  } catch (error: any) {
    console.error("Error BD:", error);
    res.status(500).json({
      exito: false,
      mensaje: "Error al eliminar el registro del historial en Supabase.",
      error,
      detalle: error?.message || "Error interno del servidor",
    });
  }
};
