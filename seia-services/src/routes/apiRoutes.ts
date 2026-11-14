import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { verificarEstadoSupabase } from "../config/supabase";
import {
  actualizarParametro,
  crearParametro,
  eliminarParametro,
  listarParametros,
  obtenerParametroPorId,
} from "../controllers/parametrosController";
import {
  actualizarProceso,
  crearProceso,
  eliminarProceso,
  listarProcesos,
  sincronizarProcesosDesdeSecop,
} from "../controllers/procesosController";
import {
  crearHistorial,
  eliminarHistorial,
  listarHistorial,
} from "../controllers/historialController";
import { clasificarTextos, obtenerEstadoIA } from "../controllers/iaController";

const router = Router();

/**
 * Endpoint de verificación de salud y estado de conexión real con Supabase.
 */
router.get("/salud", async (_req: Request, res: Response) => {
  const estadoDb = await verificarEstadoSupabase();
  res.status(200).json({
    estado: "operativo",
    servicio: "seia-services",
    conectadoSupabase: estadoDb.conectado,
    detalleConexion: estadoDb.detalle,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Endpoint para consultar la especificación OpenSpec / OpenAPI generada.
 */
router.get("/especificacion", (_req: Request, res: Response) => {
  try {
    const rutaJson = path.resolve(__dirname, "../../openapi.json");
    if (fs.existsSync(rutaJson)) {
      const contenido = JSON.parse(fs.readFileSync(rutaJson, "utf-8"));
      res.status(200).json(contenido);
      return;
    }
    res.status(404).json({
      exito: false,
      mensaje: "Archivo de especificación no encontrado.",
    });
  } catch (error) {
    res.status(500).json({
      exito: false,
      mensaje: "Error al leer la especificación técnica.",
      detalle: error instanceof Error ? error.message : "Error desconocido",
    });
  }
});

/**
 * 1. Rutas CRUD para ParametrosBusqueda (tabla parametros_busqueda en Supabase)
 */
router.get("/parametros", listarParametros);
router.get("/parametros/:id", obtenerParametroPorId);
router.post("/parametros", crearParametro);
router.put("/parametros/:id", actualizarParametro);
router.delete("/parametros/:id", eliminarParametro);

/**
 * 2. Rutas CRUD y Sincronización para ProcesosSecop (tabla procesos_secop en Supabase + secopFetcher.ts)
 */
router.get("/procesos", listarProcesos);
router.post("/procesos", crearProceso);
router.post("/procesos/sincronizar", sincronizarProcesosDesdeSecop);
router.patch("/procesos/:id", actualizarProceso);
router.delete("/procesos/:id", eliminarProceso);

/**
 * 3. Rutas CRUD para HistorialFiltros (tabla historial_filtros en Supabase)
 */
router.get("/historial", listarHistorial);
router.post("/historial", crearHistorial);
router.delete("/historial/:id", eliminarHistorial);

/**
 * 4. Rutas de Inteligencia Artificial (pasarela hacia el microservicio seia-ml)
 */
router.get("/ia/estado", obtenerEstadoIA);
router.post("/ia/clasificar", clasificarTextos);

export default router;
