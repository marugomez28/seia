"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Search,
  Bookmark,
  RotateCcw,
  Building2,
  MapPin,
  CalendarClock,
  Tag,
  Eye,
  Trash2,
  FolderSearch,
} from "lucide-react";
import {
  EstadoInternoProceso,
  FiltrosActivosProcesos,
  ProcesoSecop,
} from "@/types/seia";
import { InsigniaAfinidad } from "./AfinidadIA";
import styles from "./PanelProcesos.module.css";

interface PropiedadesPanelProcesos {
  procesos: ProcesoSecop[];
  cargando: boolean;
  filtros: FiltrosActivosProcesos;
  alCambiarFiltros: (nuevos: FiltrosActivosProcesos) => void;
  alRestablecerFiltros: () => void;
  alAlternarFavorito: (proceso: ProcesoSecop) => void;
  alCambiarEstadoInterno: (
    proceso: ProcesoSecop,
    nuevoEstado: EstadoInternoProceso
  ) => void;
  alSeleccionarProceso: (proceso: ProcesoSecop) => void;
  alEliminarProceso: (id: string, referencia: string) => void;
}

const opcionesModalidad = [
  "Todas",
  "Licitación pública",
  "Concurso de méritos abierto",
  "Selección abreviada subasta inversa",
  "Selección abreviada menor cuantía",
  "Contratación directa",
];

const opcionesDepartamento = [
  "Todos",
  "Bogotá D.C.",
  "Antioquia",
  "Valle del Cauca",
  "Cundinamarca",
  "Santander",
  "Atlántico",
];

const opcionesEstadoInterno: EstadoInternoProceso[] = [
  "Detectado",
  "En análisis",
  "Estructurando oferta",
  "Presentado",
  "Descartado",
];

export function formatearMonedaCOP(valor: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(valor);
}

export function formatearFechaCorta(fechaIso?: string | null): string {
  if (!fechaIso) return "No especificada";
  try {
    const fecha = new Date(fechaIso);
    if (Number.isNaN(fecha.getTime())) return String(fechaIso);
    return new Intl.DateTimeFormat("es-CO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(fecha);
  } catch {
    return String(fechaIso);
  }
}

export default function PanelProcesos({
  procesos,
  cargando,
  filtros,
  alCambiarFiltros,
  alRestablecerFiltros,
  alAlternarFavorito,
  alCambiarEstadoInterno,
  alSeleccionarProceso,
  alEliminarProceso,
}: PropiedadesPanelProcesos) {
  return (
    <div className={styles.contenedorProcesos}>
      <section
        className={styles.barraFiltrosGlass}
        aria-label="Filtros avanzados de búsqueda SECOP II"
      >
        <div className={styles.filaBusquedaPrincipal}>
          <div className={styles.campoBusquedaWrapper}>
            <Search size={16} className={styles.iconoBusqueda} />
            <input
              type="text"
              className={styles.inputBusqueda}
              placeholder="Buscar por objeto contractual, referencia SECOP II, uid_secop, entidad o código UNSPSC..."
              value={filtros.busqueda}
              onChange={(e) =>
                alCambiarFiltros({ ...filtros, busqueda: e.target.value })
              }
            />
          </div>

          <motion.button
            type="button"
            className={`${styles.botonFiltroFavoritos} ${
              filtros.soloFavoritos ? styles.botonFiltroFavoritosActivo : ""
            }`}
            onClick={() =>
              alCambiarFiltros({
                ...filtros,
                soloFavoritos: !filtros.soloFavoritos,
              })
            }
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <Bookmark size={15} />
            <span>Prioritarios</span>
          </motion.button>

          <motion.button
            type="button"
            className={styles.botonLimpiar}
            onClick={alRestablecerFiltros}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <RotateCcw size={14} />
            <span>Restablecer</span>
          </motion.button>
        </div>

        <div className={styles.gridSelectores}>
          <div className={styles.grupoCampo}>
            <label className={styles.etiquetaCampo} htmlFor="filtro-modalidad">
              Modalidad de Contratación
            </label>
            <select
              id="filtro-modalidad"
              className={styles.selectorInput}
              value={filtros.modalidad}
              onChange={(e) =>
                alCambiarFiltros({ ...filtros, modalidad: e.target.value })
              }
            >
              {opcionesModalidad.map((mod) => (
                <option key={mod} value={mod}>
                  {mod}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.grupoCampo}>
            <label
              className={styles.etiquetaCampo}
              htmlFor="filtro-departamento"
            >
              Departamento Entidad
            </label>
            <select
              id="filtro-departamento"
              className={styles.selectorInput}
              value={filtros.departamento}
              onChange={(e) =>
                alCambiarFiltros({ ...filtros, departamento: e.target.value })
              }
            >
              {opcionesDepartamento.map((dep) => (
                <option key={dep} value={dep}>
                  {dep}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.grupoCampo}>
            <label className={styles.etiquetaCampo} htmlFor="filtro-estado">
              Estado de Gestión SEIA
            </label>
            <select
              id="filtro-estado"
              className={styles.selectorInput}
              value={filtros.estado}
              onChange={(e) =>
                alCambiarFiltros({ ...filtros, estado: e.target.value })
              }
            >
              <option value="Todos">Todos los estados</option>
              {opcionesEstadoInterno.map((est) => (
                <option key={est} value={est}>
                  {est}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.grupoCampo}>
            <label className={styles.etiquetaCampo} htmlFor="filtro-cuantia">
              Cuantía Mínima (COP)
            </label>
            <select
              id="filtro-cuantia"
              className={styles.selectorInput}
              value={filtros.cuantiaMinima}
              onChange={(e) =>
                alCambiarFiltros({ ...filtros, cuantiaMinima: e.target.value })
              }
            >
              <option value="">Sin límite mínimo</option>
              <option value="50000000">Desde $ 50.000.000</option>
              <option value="300000000">Desde $ 300.000.000</option>
              <option value="800000000">Desde $ 800.000.000</option>
              <option value="1500000000">Desde $ 1.500.000.000</option>
            </select>
          </div>

          <div className={styles.grupoCampo}>
            <label className={styles.etiquetaCampo} htmlFor="filtro-afinidad">
              Afinidad IA (modelo en vivo)
            </label>
            <select
              id="filtro-afinidad"
              className={styles.selectorInput}
              value={filtros.afinidadIA}
              onChange={(e) =>
                alCambiarFiltros({ ...filtros, afinidadIA: e.target.value })
              }
            >
              <option value="Todos">Todas las afinidades</option>
              <option value="Alta">Solo afines (Alta)</option>
              <option value="Alta y Media">Afines y por revisar (Alta y Media)</option>
            </select>
          </div>

          <div className={styles.grupoCampo}>
            <label className={styles.etiquetaCampo} htmlFor="orden-procesos">
              Ordenar por
            </label>
            <select
              id="orden-procesos"
              className={styles.selectorInput}
              value={filtros.ordenarPor}
              onChange={(e) =>
                alCambiarFiltros({
                  ...filtros,
                  ordenarPor: e.target.value as FiltrosActivosProcesos["ordenarPor"],
                })
              }
            >
              <option value="fecha">Fecha de publicación</option>
              <option value="afinidad">Afinidad IA (mayor a menor)</option>
            </select>
          </div>
        </div>
      </section>

      {cargando ? (
        <div className={styles.estadoVacio}>
          <h3>Consultando tabla procesos_secop en Supabase...</h3>
          <p>Obteniendo los contratos reales a través de seia-services.</p>
        </div>
      ) : procesos.length === 0 ? (
        <div className={styles.estadoVacio}>
          <FolderSearch size={32} />
          <h3>No hay procesos sincronizados en la tabla procesos_secop</h3>
          <p>
            Configure un parámetro activo en &quot;Parámetros de Búsqueda&quot; y
            presione &quot;Sincronizar Contratos&quot; para consultar la API de
            SECOP II e insertar los contratos reales en Supabase.
          </p>
        </div>
      ) : (
        <div className={styles.listaTarjetasProcesos}>
          {procesos.map((proceso, idx) => (
            <motion.article
              key={proceso.id || proceso.uid_secop}
              className={`${styles.tarjetaProceso} ${
                proceso.es_favorito ? styles.tarjetaProcesoDestacada : ""
              }`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -2 }}
              transition={{
                type: "spring",
                stiffness: 320,
                damping: 26,
                delay: Math.min(idx * 0.025, 0.25),
              }}
            >
              <div className={styles.cabeceraTarjeta}>
                <div className={styles.bloqueIdentificacion}>
                  <div className={styles.filaInsignias}>
                    <InsigniaAfinidad afinidad={proceso.afinidad_ia} />
                    <span className={styles.insigniaUnspsc}>
                      <Tag size={12} />
                      <span>
                        Código UNSPSC:{" "}
                        {proceso.codigo_unspsc_usado ||
                          proceso.codigo_unspsc ||
                          "No especificado"}
                      </span>
                    </span>
                    <span className={styles.insigniaSecopId}>
                      UID: {proceso.uid_secop || proceso.id_proceso_secop}
                    </span>
                    <span className={styles.insigniaModalidad}>
                      {proceso.modalidad}
                    </span>
                  </div>
                  <div className={styles.nombreEntidad}>
                    <Building2 size={15} />
                    <span>
                      {proceso.entidad}
                      {proceso.nit_entidad ? ` — NIT ${proceso.nit_entidad}` : ""}
                    </span>
                  </div>
                </div>

                <div className={styles.bloqueCuantia}>
                  <span className={styles.etiquetaCuantia}>
                    Presupuesto Oficial
                  </span>
                  <span className={styles.valorCuantia}>
                    {formatearMonedaCOP(proceso.precio_base)}
                  </span>
                </div>
              </div>

              <p className={styles.objetoContrato}>{proceso.objeto_contrato}</p>

              <div className={styles.bloqueFechasTarjeta}>
                <div className={styles.itemFechaTarjeta}>
                  <CalendarClock size={14} />
                  <span>
                    Fecha de publicación:{" "}
                    <strong className={styles.valorFechaTarjeta}>
                      {formatearFechaCorta(proceso.fecha_publicacion)}
                    </strong>
                  </span>
                </div>
                <div className={styles.itemFechaTarjeta}>
                  <CalendarClock size={14} />
                  <span>
                    Fecha de presentación de ofertas:{" "}
                    <strong className={styles.valorFechaTarjeta}>
                      {formatearFechaCorta(
                        proceso.fecha_cierre ?? proceso.fecha_limite_recepcion
                      )}
                    </strong>
                  </span>
                </div>
              </div>

              <div className={styles.pieTarjeta}>
                <div className={styles.metadatosPie}>
                  <span className={styles.itemMetadato}>
                    <MapPin size={14} />
                    <span>
                      {proceso.ciudad}, {proceso.departamento}
                    </span>
                  </span>
                </div>

                <div className={styles.accionesTarjeta}>
                  <select
                    aria-label={`Estado interno para ${proceso.referencia_proceso}`}
                    className={styles.selectorEstadoRapido}
                    value={proceso.estado_interno}
                    onChange={(e) =>
                      alCambiarEstadoInterno(
                        proceso,
                        e.target.value as EstadoInternoProceso
                      )
                    }
                  >
                    {opcionesEstadoInterno.map((estado) => (
                      <option key={estado} value={estado}>
                        {estado}
                      </option>
                    ))}
                  </select>

                  <motion.button
                    type="button"
                    title="Alternar seguimiento prioritario"
                    className={`${styles.botonIconoAccion} ${
                      proceso.es_favorito ? styles.botonIconoAccionActivo : ""
                    }`}
                    onClick={() => alAlternarFavorito(proceso)}
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                    transition={{ type: "spring", stiffness: 420, damping: 22 }}
                  >
                    <Bookmark size={15} />
                  </motion.button>

                  <motion.button
                    type="button"
                    title="Eliminar proceso de Supabase"
                    className={styles.botonIconoAccion}
                    onClick={() =>
                      alEliminarProceso(proceso.id, proceso.referencia_proceso)
                    }
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                    transition={{ type: "spring", stiffness: 420, damping: 22 }}
                  >
                    <Trash2 size={15} />
                  </motion.button>

                  <motion.button
                    type="button"
                    className={styles.botonVerDetalle}
                    onClick={() => alSeleccionarProceso(proceso)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <Eye size={15} />
                    <span>Inspeccionar Pliego</span>
                  </motion.button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </div>
  );
}
