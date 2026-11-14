"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  Briefcase,
  BookmarkCheck,
  TrendingUp,
  SlidersHorizontal,
} from "lucide-react";
import BarraLateral from "@/components/BarraLateral";
import PanelProcesos, { formatearMonedaCOP } from "@/components/PanelProcesos";
import GestorParametros from "@/components/GestorParametros";
import PanelHistorial from "@/components/PanelHistorial";
import ModalDetalleProceso from "@/components/ModalDetalleProceso";
import { clienteApiSeia } from "@/services/apiClient";
import {
  CrearParametroFormulario,
  EstadoInternoProceso,
  FiltrosActivosProcesos,
  HistorialFiltro,
  ParametroBusqueda,
  ProcesoSecop,
  VistaActiva,
} from "@/types/seia";
import styles from "./page.module.css";

const filtrosIniciales: FiltrosActivosProcesos = {
  busqueda: "",
  modalidad: "Todas",
  departamento: "Todos",
  estado: "Todos",
  cuantiaMinima: "",
  soloFavoritos: false,
};

export default function PaginaPrincipalSeia() {
  const [vistaActiva, setVistaActiva] = useState<VistaActiva>("procesos");
  const [procesos, setProcesos] = useState<ProcesoSecop[]>([]);
  const [parametros, setParametros] = useState<ParametroBusqueda[]>([]);
  const [historial, setHistorial] = useState<HistorialFiltro[]>([]);
  const [filtros, setFiltros] =
    useState<FiltrosActivosProcesos>(filtrosIniciales);
  const [procesoSeleccionado, setProcesoSeleccionado] =
    useState<ProcesoSecop | null>(null);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);

  const cargarDatosDesdeSupabase = useCallback(async () => {
    setCargandoDatos(true);
    try {
      const [resProc, resParam, resHist] = await Promise.allSettled([
        clienteApiSeia.obtenerProcesos(),
        clienteApiSeia.obtenerParametros(),
        clienteApiSeia.obtenerHistorial(),
      ]);

      if (resProc.status === "fulfilled") {
        setProcesos(resProc.value);
      } else {
        toast("Error en tabla procesos_secop", {
          description: resProc.reason?.message || "Error al consultar procesos",
        });
      }

      if (resParam.status === "fulfilled") {
        setParametros(resParam.value);
      } else {
        toast("Error en tabla parametros_busqueda", {
          description:
            resParam.reason?.message || "Error al consultar parámetros",
        });
      }

      if (resHist.status === "fulfilled") {
        setHistorial(resHist.value);
      }
    } finally {
      setCargandoDatos(false);
    }
  }, []);

  useEffect(() => {
    cargarDatosDesdeSupabase();
  }, [cargarDatosDesdeSupabase]);

  const procesosFiltrados = useMemo(() => {
    return procesos.filter((proc) => {
      if (filtros.soloFavoritos && !proc.es_favorito) return false;
      if (
        filtros.modalidad !== "Todas" &&
        !proc.modalidad.toLowerCase().includes(filtros.modalidad.toLowerCase())
      ) {
        return false;
      }
      if (
        filtros.departamento !== "Todos" &&
        !proc.departamento
          .toLowerCase()
          .includes(filtros.departamento.toLowerCase())
      ) {
        return false;
      }
      if (
        filtros.estado !== "Todos" &&
        proc.estado_interno.toLowerCase() !== filtros.estado.toLowerCase()
      ) {
        return false;
      }
      if (
        filtros.cuantiaMinima &&
        proc.precio_base < Number(filtros.cuantiaMinima)
      ) {
        return false;
      }
      if (filtros.busqueda.trim()) {
        const q = filtros.busqueda.trim().toLowerCase();
        const uid = (proc.uid_secop || proc.id_proceso_secop || "").toLowerCase();
        const coincide =
          proc.objeto_contrato.toLowerCase().includes(q) ||
          proc.entidad.toLowerCase().includes(q) ||
          proc.referencia_proceso.toLowerCase().includes(q) ||
          uid.includes(q) ||
          (proc.codigo_unspsc_usado || "").toLowerCase().includes(q) ||
          (proc.codigo_unspsc || "").toLowerCase().includes(q);
        if (!coincide) return false;
      }
      return true;
    });
  }, [procesos, filtros]);

  const cuantiaTotalAcumulada = useMemo(
    () =>
      procesosFiltrados.reduce(
        (acc, p) => acc + Number(p.precio_base || 0),
        0
      ),
    [procesosFiltrados]
  );

  const totalPrioritarios = useMemo(
    () => procesos.filter((p) => p.es_favorito).length,
    [procesos]
  );

  const totalPerfilesActivos = useMemo(
    () => parametros.filter((p) => p.activo).length,
    [parametros]
  );

  const manejarSincronizacionGeneral = async () => {
    setSincronizando(true);
    try {
      const resultado = await clienteApiSeia.sincronizarConSecop({
        limite: 50,
      });

      const [resProc, resHist] = await Promise.allSettled([
        clienteApiSeia.obtenerProcesos(),
        clienteApiSeia.obtenerHistorial(),
      ]);

      if (resProc.status === "fulfilled") {
        setProcesos(resProc.value);
      } else if (resultado.datos) {
        setProcesos(resultado.datos);
      }

      if (resHist.status === "fulfilled") {
        setHistorial(resHist.value);
      }

      toast("Sincronización con SECOP II completada", {
        description: resultado.mensaje,
      });
    } catch (error) {
      toast("Error al sincronizar con SECOP II", {
        description:
          error instanceof Error
            ? error.message
            : "Verifique la conexión del backend con Supabase y Datos Abiertos.",
      });
    } finally {
      setSincronizando(false);
    }
  };

  const manejarAlternarFavorito = async (proceso: ProcesoSecop) => {
    try {
      const nuevoValor = !proceso.es_favorito;
      const actualizado = await clienteApiSeia.actualizarProceso(proceso.id, {
        es_favorito: nuevoValor,
      });
      setProcesos((prev) =>
        prev.map((p) => (p.id === proceso.id ? actualizado : p))
      );
      toast(
        nuevoValor
          ? "Proceso marcado como prioritario en Supabase"
          : "Proceso retirado de prioritarios en Supabase",
        {
          description: `${proceso.referencia_proceso} — ${proceso.entidad}`,
        }
      );
    } catch (error) {
      toast("No se pudo actualizar el proceso", {
        description:
          error instanceof Error ? error.message : "Error en Supabase",
      });
    }
  };

  const manejarCambiarEstadoInterno = async (
    proceso: ProcesoSecop,
    nuevoEstado: EstadoInternoProceso
  ) => {
    try {
      const actualizado = await clienteApiSeia.actualizarProceso(proceso.id, {
        estado_interno: nuevoEstado,
      });
      setProcesos((prev) =>
        prev.map((p) => (p.id === proceso.id ? actualizado : p))
      );
      toast("Estado de gestión actualizado en Supabase", {
        description: `${proceso.referencia_proceso} pasó a "${nuevoEstado}".`,
      });
    } catch (error) {
      toast("No se pudo actualizar el estado", {
        description:
          error instanceof Error ? error.message : "Error en Supabase",
      });
    }
  };

  const manejarEliminarProceso = async (id: string, referencia: string) => {
    try {
      await clienteApiSeia.eliminarProceso(id);
      setProcesos((prev) => prev.filter((p) => p.id !== id));
      toast("Proceso eliminado de Supabase", {
        description: `Se eliminó la referencia ${referencia}.`,
      });
    } catch (error) {
      toast("No se pudo eliminar el proceso", {
        description:
          error instanceof Error ? error.message : "Error en Supabase",
      });
    }
  };

  const manejarGuardarNotasModal = async (id: string, notas: string) => {
    try {
      const actualizado = await clienteApiSeia.actualizarProceso(id, {
        notas_analista: notas,
      });
      setProcesos((prev) =>
        prev.map((p) => (p.id === id ? actualizado : p))
      );
      setProcesoSeleccionado(null);
      toast("Dictamen técnico almacenado en Supabase", {
        description: "Las observaciones del analista fueron actualizadas.",
      });
    } catch (error) {
      toast("Error al guardar las notas", {
        description:
          error instanceof Error ? error.message : "Error en Supabase",
      });
    }
  };

  const manejarCrearParametro = async (datos: CrearParametroFormulario) => {
    try {
      const creado = await clienteApiSeia.crearParametro(datos);
      setParametros((prev) => [creado, ...prev]);
      toast("Parámetro registrado en Supabase", {
        description: `Se registró "${creado.valor}" (${creado.area}) en parametros_busqueda.`,
      });
    } catch (error) {
      toast("Error al crear el parámetro", {
        description:
          error instanceof Error ? error.message : "Error en Supabase",
      });
    }
  };

  const manejarActualizarParametro = async (
    id: string,
    cambios: Partial<CrearParametroFormulario>
  ) => {
    try {
      const actualizado = await clienteApiSeia.actualizarParametro(id, cambios);
      setParametros((prev) =>
        prev.map((p) => (p.id === id ? actualizado : p))
      );
      toast("Parámetro actualizado en Supabase", {
        description: `${actualizado.valor} (${actualizado.area})`,
      });
    } catch (error) {
      toast("Error al actualizar el parámetro", {
        description:
          error instanceof Error ? error.message : "Error en Supabase",
      });
    }
  };

  const manejarAlternarEstadoParametro = async (
    parametro: ParametroBusqueda
  ) => {
    try {
      const nuevoEstado = !parametro.activo;
      const actualizado = await clienteApiSeia.actualizarParametro(
        parametro.id,
        {
          activo: nuevoEstado,
        }
      );
      setParametros((prev) =>
        prev.map((p) => (p.id === parametro.id ? actualizado : p))
      );
      toast(
        nuevoEstado
          ? "Parámetro activado en Supabase"
          : "Parámetro pausado en Supabase",
        {
          description: `${parametro.valor} (${parametro.area})`,
        }
      );
    } catch (error) {
      toast("Error al cambiar el estado del parámetro", {
        description:
          error instanceof Error ? error.message : "Error en Supabase",
      });
    }
  };

  const manejarEliminarParametro = async (id: string, nombre: string) => {
    try {
      await clienteApiSeia.eliminarParametro(id);
      setParametros((prev) => prev.filter((p) => p.id !== id));
      toast("Parámetro eliminado de Supabase", {
        description: nombre,
      });
    } catch (error) {
      toast("Error al eliminar el parámetro", {
        description:
          error instanceof Error ? error.message : "Error en Supabase",
      });
    }
  };

  const manejarSincronizarConPerfil = async (parametro: ParametroBusqueda) => {
    setSincronizando(true);
    try {
      const resultado = await clienteApiSeia.sincronizarConSecop({
        parametro_id: parametro.id,
        limite: 50,
      });

      const [resProc, resHist] = await Promise.allSettled([
        clienteApiSeia.obtenerProcesos(),
        clienteApiSeia.obtenerHistorial(),
      ]);

      if (resProc.status === "fulfilled") {
        setProcesos(resProc.value);
      } else if (resultado.datos) {
        setProcesos(resultado.datos);
      }

      if (resHist.status === "fulfilled") {
        setHistorial(resHist.value);
      }
      setVistaActiva("procesos");

      toast("Barrido SECOP II completado", {
        description: `Parámetro "${parametro.valor}": ${resultado.mensaje}`,
      });
    } catch (error) {
      toast("Error al ejecutar barrido SECOP II", {
        description:
          error instanceof Error ? error.message : "Error en sincronización",
      });
    } finally {
      setSincronizando(false);
    }
  };

  const manejarEliminarHistorial = async (id: string) => {
    try {
      await clienteApiSeia.eliminarHistorial(id);
      setHistorial((prev) => prev.filter((h) => h.id !== id));
      toast("Registro de historial eliminado de Supabase", {
        description: "El evento de auditoría fue depurado correctamente.",
      });
    } catch (error) {
      toast("Error al eliminar registro del historial", {
        description:
          error instanceof Error ? error.message : "Error en Supabase",
      });
    }
  };

  const titulosPorVista: Record<
    VistaActiva,
    { titulo: string; descripcion: string }
  > = {
    procesos: {
      titulo: "Explorador y Gestión de Procesos SECOP II",
      descripcion:
        "Contratos reales sincronizados mediante secopFetcher.ts desde Datos Abiertos hacia la tabla procesos_secop en Supabase.",
    },
    parametros: {
      titulo: "Perfiles y Parámetros de Búsqueda Automatizada",
      descripcion:
        "Gestión CRUD en tiempo real conectada directamente a la tabla parametros_busqueda en Supabase.",
    },
    historial: {
      titulo: "Auditoría e Historial de Ejecuciones de Filtrado",
      descripcion:
        "Trazabilidad cronológica almacenada en la tabla historial_filtros de Supabase.",
    },
    openspec: {
      titulo: "Especificación Técnica OpenSpec y Contrato API REST",
      descripcion:
        "Documentación viva validada con @fission-ai/openspec para los módulos de seia-services.",
    },
  };

  return (
    <div className={styles.disposicionGeneral}>
      <BarraLateral
        vistaActiva={vistaActiva}
        alCambiarVista={setVistaActiva}
        totalProcesos={procesos.length}
        totalParametros={parametros.length}
        totalHistorial={historial.length}
        sincronizando={sincronizando}
        alSincronizarAhora={manejarSincronizacionGeneral}
      />

      <main className={styles.areaContenidoPrincipal}>
        <header className={styles.encabezadoSuperior}>
          <div className={styles.bloqueTitulos}>
            <span className={styles.migasDePan}>
              SEIA / SUPABASE + SECOP II SODA API / {vistaActiva.toUpperCase()}
            </span>
            <h1 className={styles.tituloVista}>
              {titulosPorVista[vistaActiva].titulo}
            </h1>
            <p className={styles.descripcionVista}>
              {titulosPorVista[vistaActiva].descripcion}
            </p>
          </div>
        </header>

        <section
          className={styles.rejillaMetricasEjecutivas}
          aria-label="Indicadores clave de contratación en Supabase"
        >
          <motion.div
            className={`${styles.tarjetaMetricaGlass} ${styles.tarjetaMetricaDestacada}`}
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 360, damping: 26 }}
          >
            <div className={styles.filaSuperiorMetrica}>
              <span>Cuantía En Evaluación</span>
              <span className={styles.iconoCajaMetrica}>
                <TrendingUp size={16} />
              </span>
            </div>
            <span className={styles.cifraMetrica}>
              {formatearMonedaCOP(cuantiaTotalAcumulada)}
            </span>
            <span className={styles.notaMetrica}>
              Suma de presupuestos reales en procesos_secop
            </span>
          </motion.div>

          <motion.div
            className={styles.tarjetaMetricaGlass}
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 360, damping: 26 }}
          >
            <div className={styles.filaSuperiorMetrica}>
              <span>Contratos en Supabase</span>
              <span className={styles.iconoCajaMetrica}>
                <Briefcase size={16} />
              </span>
            </div>
            <span className={styles.cifraMetrica}>
              {procesosFiltrados.length} de {procesos.length}
            </span>
            <span className={styles.notaMetrica}>
              Sincronizados sin duplicados (uid_secop)
            </span>
          </motion.div>

          <motion.div
            className={styles.tarjetaMetricaGlass}
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 360, damping: 26 }}
          >
            <div className={styles.filaSuperiorMetrica}>
              <span>Seguimiento Prioritario</span>
              <span className={styles.iconoCajaMetrica}>
                <BookmarkCheck size={16} />
              </span>
            </div>
            <span className={styles.cifraMetrica}>{totalPrioritarios}</span>
            <span className={styles.notaMetrica}>
              Pliegos marcados para estructuración de oferta
            </span>
          </motion.div>

          <motion.div
            className={styles.tarjetaMetricaGlass}
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 360, damping: 26 }}
          >
            <div className={styles.filaSuperiorMetrica}>
              <span>Parámetros Activos</span>
              <span className={styles.iconoCajaMetrica}>
                <SlidersHorizontal size={16} />
              </span>
            </div>
            <span className={styles.cifraMetrica}>
              {totalPerfilesActivos} / {parametros.length}
            </span>
            <span className={styles.notaMetrica}>
              Reglas activas en parametros_busqueda
            </span>
          </motion.div>
        </section>

        <AnimatePresence mode="wait">
          {vistaActiva === "procesos" && (
            <motion.div
              key="vista-procesos"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
            >
              <PanelProcesos
                procesos={procesosFiltrados}
                cargando={cargandoDatos}
                filtros={filtros}
                alCambiarFiltros={setFiltros}
                alRestablecerFiltros={() => setFiltros(filtrosIniciales)}
                alAlternarFavorito={manejarAlternarFavorito}
                alCambiarEstadoInterno={manejarCambiarEstadoInterno}
                alSeleccionarProceso={setProcesoSeleccionado}
                alEliminarProceso={manejarEliminarProceso}
              />
            </motion.div>
          )}

          {vistaActiva === "parametros" && (
            <motion.div
              key="vista-parametros"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
            >
              <GestorParametros
                parametros={parametros}
                cargando={cargandoDatos}
                alCrearParametro={manejarCrearParametro}
                alActualizarParametro={manejarActualizarParametro}
                alAlternarEstadoParametro={manejarAlternarEstadoParametro}
                alEliminarParametro={manejarEliminarParametro}
                alEjecutarSincronizacionConPerfil={manejarSincronizarConPerfil}
              />
            </motion.div>
          )}

          {vistaActiva === "historial" && (
            <motion.div
              key="vista-historial"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
            >
              <PanelHistorial
                historial={historial}
                alEliminarRegistro={manejarEliminarHistorial}
              />
            </motion.div>
          )}

          {vistaActiva === "openspec" && (
            <motion.div
              key="vista-openspec"
              className={styles.panelOpenSpec}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
            >
              <div className={styles.rejillaSpecs}>
                <div className={styles.tarjetaCapacidad}>
                  <h3 className={styles.nombreCapacidad}>
                    Capacidad: parametros-busqueda
                  </h3>
                  <p className={styles.descripcionCapacidad}>
                    Especificación validada en OpenSpec para la administración
                    CRUD directa sobre la tabla parametros_busqueda en Supabase.
                  </p>
                  <div className={styles.listaEndpoints}>
                    <span className={styles.itemEndpoint}>
                      GET /api/parametros
                    </span>
                    <span className={styles.itemEndpoint}>
                      POST /api/parametros
                    </span>
                    <span className={styles.itemEndpoint}>
                      PUT /api/parametros/:id
                    </span>
                    <span className={styles.itemEndpoint}>
                      DELETE /api/parametros/:id
                    </span>
                  </div>
                </div>

                <div className={styles.tarjetaCapacidad}>
                  <h3 className={styles.nombreCapacidad}>
                    Capacidad: procesos-secop
                  </h3>
                  <p className={styles.descripcionCapacidad}>
                    Especificación para secopFetcher.ts (consulta a
                    jbjy-vk9h.json filtrando por UNSPSC y modalidad) e inserción
                    en procesos_secop evitando duplicados por uid_secop.
                  </p>
                  <div className={styles.listaEndpoints}>
                    <span className={styles.itemEndpoint}>
                      GET /api/procesos
                    </span>
                    <span className={styles.itemEndpoint}>
                      POST /api/procesos/sincronizar
                    </span>
                    <span className={styles.itemEndpoint}>
                      PATCH /api/procesos/:id
                    </span>
                    <span className={styles.itemEndpoint}>
                      DELETE /api/procesos/:id
                    </span>
                  </div>
                </div>

                <div className={styles.tarjetaCapacidad}>
                  <h3 className={styles.nombreCapacidad}>
                    Capacidad: historial-filtros
                  </h3>
                  <p className={styles.descripcionCapacidad}>
                    Especificación de trazabilidad en tiempo real sobre la tabla
                    historial_filtros en Supabase.
                  </p>
                  <div className={styles.listaEndpoints}>
                    <span className={styles.itemEndpoint}>
                      GET /api/historial
                    </span>
                    <span className={styles.itemEndpoint}>
                      POST /api/historial
                    </span>
                    <span className={styles.itemEndpoint}>
                      DELETE /api/historial/:id
                    </span>
                    <span className={styles.itemEndpoint}>
                      GET /api/especificacion (OpenAPI JSON)
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <ModalDetalleProceso
        proceso={procesoSeleccionado}
        alCerrar={() => setProcesoSeleccionado(null)}
        alGuardarNotas={manejarGuardarNotasModal}
      />
    </div>
  );
}
