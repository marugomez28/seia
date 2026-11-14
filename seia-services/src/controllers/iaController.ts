import axios from "axios";
import { Request, Response } from "express";
import { z } from "zod";
import {
  URL_SERVICIO_IA,
  describirErrorIA,
  obtenerEstadoServicioIA,
  predecirAfinidad,
} from "../services/clienteIA";

/**
 * GET /api/ia/estado
 * Informa si el servicio de inferencia está disponible y, en ese caso,
 * los metadatos y métricas del modelo entrenado que tiene cargado.
 */
export const obtenerEstadoIA = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const { salud, modelo } = await obtenerEstadoServicioIA();
    res.status(200).json({
      exito: true,
      disponible: true,
      servicio: URL_SERVICIO_IA,
      salud,
      modelo,
    });
  } catch (error) {
    res.status(200).json({
      exito: true,
      disponible: false,
      servicio: URL_SERVICIO_IA,
      mensaje: describirErrorIA(error),
    });
  }
};

const esquemaClasificacion = z
  .object({
    texto: z.string().trim().min(1).max(5000).optional(),
    textos: z.array(z.string().trim().min(1).max(5000)).min(1).max(200).optional(),
  })
  .refine((cuerpo) => Boolean(cuerpo.texto) !== Boolean(cuerpo.textos), {
    message: "Envíe 'texto' (un objeto contractual) o 'textos' (lista de 1 a 200), pero no ambos.",
  });

/**
 * POST /api/ia/clasificar
 * Clasifica en el momento uno o varios objetos contractuales con el modelo
 * entrenado y devuelve el puntaje, el nivel y los términos que explican la decisión.
 */
export const clasificarTextos = async (
  req: Request,
  res: Response
): Promise<void> => {
  const validacion = esquemaClasificacion.safeParse(req.body ?? {});
  if (!validacion.success) {
    res.status(422).json({
      exito: false,
      mensaje: "Solicitud inválida para el clasificador de afinidad.",
      detalle: validacion.error.issues.map((i) => i.message).join(" "),
    });
    return;
  }

  const textos = validacion.data.textos ?? [validacion.data.texto as string];

  try {
    const prediccion = await predecirAfinidad(textos, true);
    res.status(200).json({
      exito: true,
      datos: prediccion.resultados.map((resultado, i) => ({
        texto: textos[i],
        ...resultado,
      })),
      tiempo_inferencia_ms: prediccion.tiempo_inferencia_ms,
      version_modelo: prediccion.version_modelo,
      umbrales: prediccion.umbrales,
      calculado_en: prediccion.calculado_en,
    });
  } catch (error) {
    const respuestaIA = axios.isAxiosError(error) ? error.response : undefined;
    if (respuestaIA?.status === 422) {
      res.status(422).json({
        exito: false,
        mensaje: "El modelo rechazó la solicitud.",
        detalle: describirErrorIA(error),
      });
      return;
    }
    res.status(503).json({
      exito: false,
      mensaje: "El servicio de IA no está disponible en este momento.",
      detalle: describirErrorIA(error),
    });
  }
};
