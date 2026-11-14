import axios from "axios";
import dotenv from "dotenv";
import { RespuestaPrediccionIA } from "../types/entidades";

dotenv.config({ override: true });

/**
 * Cliente HTTP hacia el microservicio de inferencia seia-ml (FastAPI),
 * que carga el modelo de afinidad YA ENTRENADO (TF-IDF + LinearSVC).
 */
export const URL_SERVICIO_IA = (
  process.env.SEIA_ML_URL || "http://localhost:8000"
).replace(/\/+$/, "");

const TIEMPO_ESPERA_MS = Number(process.env.SEIA_ML_TIMEOUT_MS || 5000);

/** El servicio acepta como máximo 200 textos por solicitud. */
const TAMANO_LOTE = 200;

/**
 * Envía los textos al modelo y devuelve un resultado por texto, en el mismo orden.
 * Si hay más de 200 textos, los divide en lotes y une las respuestas.
 */
export async function predecirAfinidad(
  textos: string[],
  explicar = true
): Promise<RespuestaPrediccionIA> {
  const lotes: string[][] = [];
  for (let i = 0; i < textos.length; i += TAMANO_LOTE) {
    lotes.push(textos.slice(i, i + TAMANO_LOTE));
  }

  const respuestas = await Promise.all(
    lotes.map((lote) =>
      axios
        .post<RespuestaPrediccionIA>(
          `${URL_SERVICIO_IA}/predecir`,
          { textos: lote, explicar },
          { timeout: TIEMPO_ESPERA_MS }
        )
        .then((r) => r.data)
    )
  );

  const [primera] = respuestas;
  return {
    ...primera,
    resultados: respuestas.flatMap((r) => r.resultados),
    total: respuestas.reduce((acc, r) => acc + r.total, 0),
    tiempo_inferencia_ms: Number(
      respuestas.reduce((acc, r) => acc + r.tiempo_inferencia_ms, 0).toFixed(2)
    ),
  };
}

/**
 * Consulta en paralelo la salud del servicio y los metadatos del modelo cargado.
 */
export async function obtenerEstadoServicioIA(): Promise<{
  salud: Record<string, unknown>;
  modelo: Record<string, unknown>;
}> {
  const [salud, modelo] = await Promise.all([
    axios.get(`${URL_SERVICIO_IA}/salud`, { timeout: TIEMPO_ESPERA_MS }),
    axios.get(`${URL_SERVICIO_IA}/modelo`, { timeout: TIEMPO_ESPERA_MS }),
  ]);
  return { salud: salud.data, modelo: modelo.data };
}

/**
 * Traduce un error de axios a un mensaje legible para la API y la interfaz.
 */
export function describirErrorIA(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.code === "ECONNREFUSED") {
      return `El servicio de IA (seia-ml) no responde en ${URL_SERVICIO_IA}. Verifique que esté en ejecución.`;
    }
    if (error.code === "ECONNABORTED") {
      return `El servicio de IA superó el tiempo de espera de ${TIEMPO_ESPERA_MS} ms.`;
    }
    if (error.response) {
      return `El servicio de IA respondió ${error.response.status}: ${JSON.stringify(
        error.response.data?.detail ?? error.response.data
      )}`;
    }
    return error.message;
  }
  return error instanceof Error ? error.message : "Error desconocido en el servicio de IA.";
}
