import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import swaggerUi from "swagger-ui-express";
import YAML from "yaml";
import apiRoutes from "./routes/apiRoutes";
import { verificarEstadoSupabase } from "./config/supabase";

dotenv.config({ override: true });

const app: Application = express();
const PUERTO = Number(process.env.PORT || 4000);
const HOST = "0.0.0.0";
const ORIGEN_CORS = process.env.CORS_ORIGIN || "*";

/**
 * Carga el contrato de la API generado con OpenSpec (openapi.json u openapi.yaml)
 * para servirlo en el visor interactivo Swagger UI en GET /api-docs.
 */
function cargarEspecificacionOpenSpec(): Record<string, unknown> {
  try {
    const rutaJson = path.resolve(__dirname, "../openapi.json");
    const rutaYaml = path.resolve(__dirname, "../openapi.yaml");

    if (fs.existsSync(rutaJson)) {
      return JSON.parse(fs.readFileSync(rutaJson, "utf-8"));
    }

    if (fs.existsSync(rutaYaml)) {
      return YAML.parse(fs.readFileSync(rutaYaml, "utf-8"));
    }
  } catch (error) {
    console.error("Advertencia al leer especificación OpenSpec:", error);
  }

  return {
    openapi: "3.1.0",
    info: {
      title: "SEIA - Inteligencia Contractual (MGD Bitforge S.A.S.)",
      version: "1.1.0",
    },
    paths: {},
  };
}

const documentoOpenSpec = cargarEspecificacionOpenSpec();

/**
 * Middlewares globales de seguridad, registro y análisis JSON.
 * Se desactiva contentSecurityPolicy en helmet para permitir los recursos de Swagger UI en /api-docs.
 */
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(
  cors({
    origin:
      ORIGEN_CORS === "*"
        ? "*"
        : [ORIGEN_CORS, "http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

/**
 * Ruta GET /api-docs: Visor interactivo Swagger UI alimentado por el contrato OpenSpec.
 */
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(documentoOpenSpec, {
    customSiteTitle: "SEIA - Documentación API REST (Swagger UI)",
  })
);

/**
 * Ruta raíz informativa del servicio backend
 */
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    sistema: "SEIA - Inteligencia Contractual (MGD Bitforge S.A.S.)",
    modulo: "seia-services",
    version: "1.1.0",
    swaggerUi: "/api-docs",
    documentacionOpenSpec: "/api/especificacion",
    salud: "/api/salud",
  });
});

/**
 * Montaje de rutas REST principales bajo el prefijo /api
 */
app.use("/api", apiRoutes);

/**
 * Manejador global de rutas no encontradas
 */
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    exito: false,
    mensaje: "La ruta solicitada no existe en seia-services.",
  });
});

/**
 * Manejador global de errores no controlados
 */
app.use(
  (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
    res.status(500).json({
      exito: false,
      mensaje: "Se produjo un error inesperado en el servidor.",
      detalle: err.message,
    });
  }
);

if (require.main === module) {
  app.listen(PUERTO, HOST, async () => {
    console.log("==============================================================");
    console.log(
      `SEIA Backend (seia-services) escuchando en http://${HOST}:${PUERTO}`
    );
    console.log(
      `Swagger UI (OpenSpec) disponible en http://localhost:${PUERTO}/api-docs`
    );
    try {
      const estadoSupabase = await verificarEstadoSupabase();
      console.log(
        `Conectado a Supabase: ${estadoSupabase.conectado ? "SÍ" : "NO"}`
      );
      console.log(`Detalle: ${estadoSupabase.detalle}`);
    } catch (error) {
      console.error("Error verificando estado inicial de Supabase:", error);
    }
    console.log("==============================================================");
  });
}

export default app;
