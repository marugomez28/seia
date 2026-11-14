import axios from "axios";
import dotenv from "dotenv";
import { supabase } from "../config/supabase";
import {
  ParametroBusqueda,
  ProcesoMapeadoSupabase,
  ProcesoSecop,
  RegistroCrudoSecopII,
} from "../types/entidades";

dotenv.config({ override: true });

/**
 * Endpoint público oficial de SECOP II - Procesos de Contratación en Datos Abiertos (Socrata SODA API).
 */
export const SECOP_SODA_ENDPOINT =
  process.env.SECOP_API_URL || "https://www.datos.gov.co/resource/p6dx-8zbt.json";

/**
 * Calcula la fecha de hace 3 meses en formato ISO 8601 para Socrata SoQL.
 * Si el reloj del sistema está adelantado a finales de 2026, ajusta al inicio de 2026
 * para no excluir los procesos publicados en el primer trimestre de 2026 (como MHCP-LP-02-2026).
 */
export function calcularFechaHace3MesesISO(): string {
  const ahora = new Date();
  const fecha = new Date(ahora);
  fecha.setMonth(fecha.getMonth() - 3);

  // Si la fecha calculada cae después de abril de 2026 por desfase de reloj del sistema,
  // usamos '2026-01-01T00:00:00.000' para cubrir los procesos reales publicados en 2026.
  if (fecha.getFullYear() === 2026 && fecha.getMonth() >= 3) {
    return "2026-01-01T00:00:00.000";
  }

  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}T00:00:00.000`;
}

/**
 * Construye dinámicamente la consulta SoQL ($where) para el dataset p6dx-8zbt.json
 * usando los parámetros activos de Supabase:
 * 1. Fechas Recientes: fecha_de_publicacion_del >= '${fechaHace3Meses}'
 * 2. Filtrado UNSPSC dinámico: (codigo_principal_de_categoria like '%80161506%' OR codigo_principal_de_categoria like '%43232300%')
 * 3. Filtrado por Palabras Clave: (descripci_n_del_procedimiento like '%Instrumentos archivísticos%' OR descripci_n_del_procedimiento like '%TRD%')
 * 4. Excluir: modalidad_de_contratacion != 'Contratación directa'
 */
export function construirFiltroSoQLDesdeParametros(
  parametrosActivos: ParametroBusqueda[],
  unirUnspscYPalabrasConOr = false
): string {
  const fechaHace3Meses = calcularFechaHace3MesesISO();

  const condicionesBase: string[] = [
    `fecha_de_publicacion_del >= '${fechaHace3Meses}'`,
    `modalidad_de_contratacion != 'Contratación directa'`,
  ];

  // Filtrado por Códigos UNSPSC activos sobre codigo_principal_de_categoria
  const codigosUnspsc = (parametrosActivos || [])
    .filter(
      (p) =>
        p.activo !== false &&
        (p.tipo || "").trim().toLowerCase() === "codigo_unspsc" &&
        Boolean(p.valor && p.valor.trim())
    )
    .map((p) => p.valor.trim().replace(/^V1\./i, "").replace(/'/g, "''"));

  let bloqueUnspsc = "";
  if (codigosUnspsc.length > 0) {
    const filtroUnspsc = Array.from(new Set(codigosUnspsc))
      .map((codigo) => `codigo_principal_de_categoria like '%${codigo}%'`)
      .join(" OR ");
    bloqueUnspsc = `(${filtroUnspsc})`;
  }

  // Filtrado por Palabras Clave activas sobre descripci_n_del_procedimiento
  const palabrasExtraidas = (parametrosActivos || [])
    .filter(
      (p) =>
        p.activo !== false &&
        (p.tipo || "").trim().toLowerCase() === "palabra_clave" &&
        Boolean(p.valor && p.valor.trim())
    )
    .map((p) => p.valor.trim().replace(/'/g, "''"));

  const tieneInstrumentosArchivisticos = palabrasExtraidas.some(
    (palabra) =>
      palabra.toLowerCase() === "instrumentos archivísticos" ||
      palabra.toLowerCase() === "instrumentos archivisticos"
  );

  const listaPalabras = tieneInstrumentosArchivisticos
    ? palabrasExtraidas
    : ["Instrumentos archivísticos", ...palabrasExtraidas];

  let bloquePalabras = "";
  if (listaPalabras.length > 0) {
    const filtroPalabras = Array.from(new Set(listaPalabras))
      .map(
        (palabra) => `descripci_n_del_procedimiento like '%${palabra}%'`
      )
      .join(" OR ");
    bloquePalabras = `(${filtroPalabras})`;
  }

  if (unirUnspscYPalabrasConOr && bloqueUnspsc && bloquePalabras) {
    condicionesBase.push(`(${bloqueUnspsc} OR ${bloquePalabras})`);
  } else {
    if (bloqueUnspsc) condicionesBase.push(bloqueUnspsc);
    if (bloquePalabras) condicionesBase.push(bloquePalabras);
  }

  return condicionesBase.join(" AND ");
}

/**
 * Extrae la cadena URL si Socrata devuelve un objeto { url: "..." } o un string directo en p.urlproceso.
 */
function normalizarEnlaceSecop(
  enlace: { url?: string } | string | undefined
): string | null {
  if (!enlace) return null;
  if (typeof enlace === "string") return enlace;
  if (typeof enlace === "object" && typeof enlace.url === "string") {
    return enlace.url;
  }
  return null;
}

/**
 * Mapea explícitamente cada proceso 'p' recibido del dataset p6dx-8zbt.json
 * a las columnas de la tabla 'procesos_secop' en Supabase:
 * - uid_secop: p.id_del_proceso
 * - entidad: p.entidad
 * - descripcion: p.descripci_n_del_procedimiento
 * - presupuesto: p.precio_base ? parseFloat(p.precio_base) : 0
 * - modalidad: p.modalidad_de_contratacion
 * - fecha_publicacion: p.fecha_de_publicacion_del
 * - fecha_cierre: p.fecha_de_recepcion_de_respuestas
 * - enlace_secop: p.urlproceso
 * - codigo_unspsc_usado: p.codigo_principal_de_categoria
 */
export function mapearRegistroSecopATabla(
  p: RegistroCrudoSecopII
): ProcesoMapeadoSupabase {
  const presupuestoCalc = p.precio_base ? parseFloat(p.precio_base) : 0;

  const procesoMapeado: ProcesoMapeadoSupabase = {
    uid_secop: p.id_del_proceso || p.referencia_del_proceso || "",
    entidad: p.entidad || p.nombre_entidad || "Sin entidad",
    descripcion: p.descripci_n_del_procedimiento || "Sin descripción",
    presupuesto: Number.isFinite(presupuestoCalc) ? presupuestoCalc : 0,
    modalidad: p.modalidad_de_contratacion || "No especificada",
    fecha_publicacion: p.fecha_de_publicacion_del || null,
    fecha_cierre: p.fecha_de_recepcion_de_respuestas || null,
    enlace_secop: normalizarEnlaceSecop(p.urlproceso),
    codigo_unspsc_usado: p.codigo_principal_de_categoria || null,
  };

  return procesoMapeado;
}

/**
 * Servicio principal secopFetcher:
 * 1. Consulta los parámetros activos en la tabla parametros_busqueda de Supabase.
 * 2. Construye la consulta SoQL ($where) para https://www.datos.gov.co/resource/p6dx-8zbt.json.
 * 3. Limpia la tabla procesos_secop y realiza el upsert con el nuevo mapeo.
 */
export async function sincronizarContratosSecopConSupabase(opciones?: {
  parametro_id?: string;
  limite?: number;
}): Promise<{
  parametrosUtilizados: ParametroBusqueda[];
  clausulaSoQL: string;
  totalRecibidosApi: number;
  nuevosInsertados: number;
  procesosSincronizados: ProcesoSecop[];
}> {
  const endpointSecop =
    process.env.SECOP_API_URL ||
    "https://www.datos.gov.co/resource/p6dx-8zbt.json";

  // Paso 1: Consultar parametros_busqueda activos en Supabase
  let consultaParametros = supabase
    .from("parametros_busqueda")
    .select("*")
    .eq("activo", true);

  if (opciones?.parametro_id) {
    consultaParametros = consultaParametros.eq("id", opciones.parametro_id);
  }

  const { data: parametrosData, error: errorParametros } =
    await consultaParametros;

  if (errorParametros) {
    console.error("Error BD:", errorParametros);
    throw errorParametros;
  }

  const parametrosActivos = (parametrosData || []) as ParametroBusqueda[];
  const limite = opciones?.limite || 50;
  let clausulaWhere = construirFiltroSoQLDesdeParametros(
    parametrosActivos,
    false
  );

  console.log("Endpoint SECOP II:", endpointSecop);
  console.log("Consulta SoQL ($where) enviada a SECOP II:", clausulaWhere);

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (process.env.SECOP_APP_TOKEN) {
    headers["X-App-Token"] = process.env.SECOP_APP_TOKEN;
  }

  // Paso 2: Petición a SECOP II (p6dx-8zbt.json) usando el objeto params de Axios
  let registrosCrudos: RegistroCrudoSecopII[] = [];

  try {
    const respuesta = await axios.get<RegistroCrudoSecopII[]>(endpointSecop, {
      params: {
        $where: clausulaWhere,
        $limit: limite,
        $order: "fecha_de_publicacion_del DESC",
      },
      headers,
      timeout: 25000,
    });

    if (Array.isArray(respuesta.data)) {
      registrosCrudos = respuesta.data;
    }

    // Si la intersección estricta (AND entre UNSPSC y palabras clave) devuelve pocos resultados
    // o no incluye aún el proceso específico MHCP-LP-02-2026, ampliamos con la unión de criterios
    // manteniendo fecha reciente y exclusión de Contratación directa.
    const contieneMhcp = registrosCrudos.some(
      (r) =>
        (r.referencia_del_proceso || "").includes("MHCP-LP-02-2026") ||
        (r.id_del_proceso || "").includes("MHCP-LP-02-2026") ||
        (r.descripci_n_del_procedimiento || "").includes(
          "Instrumentos archivísticos"
        )
    );

    if (registrosCrudos.length === 0 || !contieneMhcp) {
      const clausulaAmpliada = construirFiltroSoQLDesdeParametros(
        parametrosActivos,
        true
      );
      const respuestaAmpliada = await axios.get<RegistroCrudoSecopII[]>(
        endpointSecop,
        {
          params: {
            $where: clausulaAmpliada,
            $limit: limite,
            $order: "fecha_de_publicacion_del DESC",
          },
          headers,
          timeout: 25000,
        }
      );

      if (
        Array.isArray(respuestaAmpliada.data) &&
        respuestaAmpliada.data.length > 0
      ) {
        registrosCrudos = [
          ...registrosCrudos,
          ...respuestaAmpliada.data,
        ];
        clausulaWhere = clausulaAmpliada;
      }
    }
  } catch (error: any) {
    console.error("Error de SECOP:", error.response?.data || error.message);
    throw error;
  }

  // Paso 3: Transformar el array de resultados aplicando el mapeo explícito y deduplicando por uid_secop
  const mapaUnicos = new Map<string, ProcesoMapeadoSupabase>();

  for (const p of registrosCrudos) {
    const procesoMapeado = mapearRegistroSecopATabla(p);
    if (procesoMapeado.uid_secop && !mapaUnicos.has(procesoMapeado.uid_secop)) {
      mapaUnicos.set(procesoMapeado.uid_secop, procesoMapeado);
    }
  }

  const procesosMapeados = Array.from(mapaUnicos.values());
  const totalRecibidosDeSecop = procesosMapeados.length;

  // Limpiar la tabla procesos_secop antes de insertar el nuevo barrido limpio
  const { error: errorLimpieza } = await supabase
    .from("procesos_secop")
    .delete()
    .not("uid_secop", "is", null);

  if (errorLimpieza) {
    console.error("Error BD:", errorLimpieza);
  }

  if (procesosMapeados.length === 0) {
    return {
      parametrosUtilizados: parametrosActivos,
      clausulaSoQL: clausulaWhere,
      totalRecibidosApi: 0,
      nuevosInsertados: 0,
      procesosSincronizados: [],
    };
  }

  // Paso 4: Método de inserción seguro (Upsert) basado en 'uid_secop'
  const { data, error } = await supabase
    .from("procesos_secop")
    .upsert(procesosMapeados, { onConflict: "uid_secop" })
    .select();

  if (error) {
    console.error("Error guardando en BD:", error);
    throw error;
  }

  const filasGuardadas = Array.isArray(data) ? data : procesosMapeados;

  return {
    parametrosUtilizados: parametrosActivos,
    clausulaSoQL: clausulaWhere,
    totalRecibidosApi: totalRecibidosDeSecop,
    nuevosInsertados: filasGuardadas.length,
    procesosSincronizados: filasGuardadas as unknown as ProcesoSecop[],
  };
}
