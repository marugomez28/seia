import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { ParametroBusqueda } from "../types/entidades";

/**
 * Controlador CRUD para la tabla parametros_busqueda en Supabase.
 * Implementa manejo de errores transparente imprimiendo console.error("Error BD:", error)
 * y devolviendo el objeto error en res.status(500).json().
 */

export const listarParametros = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const soloActivos = req.query.soloActivos === "true";

    let consulta = supabase.from("parametros_busqueda").select("*");

    if (soloActivos) {
      consulta = consulta.eq("activo", true);
    }

    const { data, error } = await consulta;

    if (error) {
      console.error("Error BD:", error);
      res.status(500).json({
        exito: false,
        mensaje: "Error al consultar la tabla parametros_busqueda en Supabase.",
        error,
        detalle: error.message,
      });
      return;
    }

    const lista = ((data || []) as ParametroBusqueda[]).sort((a, b) => {
      const fechaA = a.fecha_creacion || "";
      const fechaB = b.fecha_creacion || "";
      return fechaB.localeCompare(fechaA);
    });

    res.status(200).json({
      exito: true,
      total: lista.length,
      datos: lista,
    });
  } catch (error: any) {
    console.error("Error BD:", error);
    res.status(500).json({
      exito: false,
      mensaje: "No fue posible consultar los parámetros de búsqueda en Supabase.",
      error,
      detalle: error?.message || "Error interno del servidor",
    });
  }
};

export const obtenerParametroPorId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = String(req.params.id);

    const { data, error } = await supabase
      .from("parametros_busqueda")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error BD:", error);
      res.status(500).json({
        exito: false,
        mensaje: "Error al consultar el parámetro de búsqueda en Supabase.",
        error,
        detalle: error.message,
      });
      return;
    }

    if (!data) {
      res.status(404).json({
        exito: false,
        mensaje: "El perfil de parámetro de búsqueda solicitado no existe.",
      });
      return;
    }

    res.status(200).json({
      exito: true,
      datos: data as ParametroBusqueda,
    });
  } catch (error: any) {
    console.error("Error BD:", error);
    res.status(500).json({
      exito: false,
      mensaje: "Error al obtener el perfil de búsqueda desde Supabase.",
      error,
      detalle: error?.message || "Error interno del servidor",
    });
  }
};

export const crearParametro = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { tipo, valor, area, activo } = req.body;

    if (!valor || typeof valor !== "string" || !valor.trim()) {
      res.status(400).json({
        exito: false,
        mensaje: "El campo obligatorio 'valor' es requerido.",
      });
      return;
    }

    const nuevoRegistro: Record<string, unknown> = {
      tipo: tipo ? String(tipo).trim() : "palabra_clave",
      valor: valor.trim(),
      area: area ? String(area).trim() : "General",
      activo: activo !== undefined ? Boolean(activo) : true,
    };

    const { data, error } = await supabase
      .from("parametros_busqueda")
      .insert([nuevoRegistro])
      .select()
      .single();

    if (error) {
      console.error("Error BD:", error);
      res.status(500).json({
        exito: false,
        mensaje:
          "Error al insertar el parámetro en la tabla parametros_busqueda de Supabase.",
        error,
        detalle: error.message,
      });
      return;
    }

    res.status(201).json({
      exito: true,
      mensaje: "Parámetro de búsqueda guardado en Supabase correctamente.",
      datos: data as ParametroBusqueda,
    });
  } catch (error: any) {
    console.error("Error BD:", error);
    res.status(500).json({
      exito: false,
      mensaje: "Error al registrar el parámetro de búsqueda en Supabase.",
      error,
      detalle: error?.message || "Error interno del servidor",
    });
  }
};

export const actualizarParametro = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = String(req.params.id);
    const cambios = { ...req.body };

    const { data, error } = await supabase
      .from("parametros_busqueda")
      .update(cambios)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error BD:", error);
      res.status(500).json({
        exito: false,
        mensaje: "Error al actualizar el parámetro de búsqueda en Supabase.",
        error,
        detalle: error.message,
      });
      return;
    }

    res.status(200).json({
      exito: true,
      mensaje: "Parámetro de búsqueda actualizado en Supabase correctamente.",
      datos: data as ParametroBusqueda,
    });
  } catch (error: any) {
    console.error("Error BD:", error);
    res.status(500).json({
      exito: false,
      mensaje: "Error al actualizar el parámetro de búsqueda en Supabase.",
      error,
      detalle: error?.message || "Error interno del servidor",
    });
  }
};

export const eliminarParametro = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = String(req.params.id);

    const { data, error } = await supabase
      .from("parametros_busqueda")
      .delete()
      .eq("id", id)
      .select();

    if (error) {
      console.error("Error BD:", error);
      res.status(500).json({
        exito: false,
        mensaje: "Error al eliminar el parámetro en Supabase.",
        error,
        detalle: error.message,
      });
      return;
    }

    if (!data || data.length === 0) {
      res.status(404).json({
        exito: false,
        mensaje: "El parámetro de búsqueda indicado no existe en Supabase.",
      });
      return;
    }

    res.status(200).json({
      exito: true,
      mensaje: "Perfil de búsqueda eliminado de Supabase correctamente.",
    });
  } catch (error: any) {
    console.error("Error BD:", error);
    res.status(500).json({
      exito: false,
      mensaje: "Error al eliminar el parámetro de búsqueda en Supabase.",
      error,
      detalle: error?.message || "Error interno del servidor",
    });
  }
};
