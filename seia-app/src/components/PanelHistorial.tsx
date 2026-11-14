"use client";

import React from "react";
import { motion } from "framer-motion";
import { History, Trash2, Activity } from "lucide-react";
import { HistorialFiltro } from "@/types/seia";
import { formatearFechaCorta } from "./PanelProcesos";
import styles from "./PanelHistorial.module.css";

interface PropiedadesPanelHistorial {
  historial: HistorialFiltro[];
  alEliminarRegistro: (id: string) => Promise<void>;
}

export default function PanelHistorial({
  historial,
  alEliminarRegistro,
}: PropiedadesPanelHistorial) {
  if (historial.length === 0) {
    return (
      <div className={styles.estadoVacioHistorial}>
        <History size={28} />
        <h3>Sin ejecuciones registradas en historial_filtros</h3>
        <p>
          Cada vez que secopFetcher.ts sincronice procesos con SECOP II, la
          auditoría quedará registrada automáticamente en Supabase.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.contenedorHistorial}>
      {historial.map((item, idx) => (
        <motion.article
          key={item.id}
          className={styles.tarjetaRegistro}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 320,
            damping: 26,
            delay: idx * 0.04,
          }}
        >
          <div className={styles.cabeceraRegistro}>
            <div className={styles.tituloRegistro}>
              <Activity size={17} />
              <span>{item.nombre_ejecucion}</span>
            </div>
            <span className={styles.fechaRegistro}>
              <History
                size={13}
                style={{ marginRight: 6, verticalAlign: "middle" }}
              />
              {formatearFechaCorta(item.fecha_ejecucion)}
            </span>
          </div>

          <div className={styles.metricasRegistro}>
            <div className={styles.cajaMetrica}>
              <span className={styles.etiquetaMetrica}>
                Procesos Encontrados
              </span>
              <span className={styles.valorMetrica}>
                {item.total_encontrados} contratos
              </span>
            </div>
            <div className={styles.cajaMetrica}>
              <span className={styles.etiquetaMetrica}>
                Sincronizados en Supabase
              </span>
              <span className={styles.valorMetrica}>
                {item.nuevos_insertados} registros
              </span>
            </div>
            <div className={styles.cajaMetrica}>
              <span className={styles.etiquetaMetrica}>
                Tiempo de Respuesta
              </span>
              <span className={styles.valorMetrica}>
                {item.tiempo_ejecucion_ms} ms
              </span>
            </div>
            <div className={styles.cajaMetrica}>
              <span className={styles.etiquetaMetrica}>
                Estado Sincronización
              </span>
              <span className={styles.valorMetrica}>
                {item.estado_sincronizacion}
              </span>
            </div>
          </div>

          <pre className={styles.bloqueJson}>
            {JSON.stringify(item.filtros_aplicados, null, 2)}
          </pre>

          <div className={styles.pieRegistro}>
            <motion.button
              type="button"
              className={styles.botonEliminar}
              onClick={() => alEliminarRegistro(item.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 24 }}
            >
              <Trash2 size={14} />
              <span>Depurar Registro</span>
            </motion.button>
          </div>
        </motion.article>
      ))}
    </div>
  );
}
