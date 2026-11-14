"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ExternalLink, Save } from "lucide-react";
import { ProcesoSecop } from "@/types/seia";
import { formatearFechaCorta, formatearMonedaCOP } from "./PanelProcesos";
import { AnalisisAfinidad } from "./AfinidadIA";
import styles from "./ModalDetalleProceso.module.css";

interface PropiedadesModalDetalleProceso {
  proceso: ProcesoSecop | null;
  alCerrar: () => void;
  alGuardarNotas: (id: string, notas: string) => Promise<void>;
}

export default function ModalDetalleProceso({
  proceso,
  alCerrar,
  alGuardarNotas,
}: PropiedadesModalDetalleProceso) {
  const [notas, setNotas] = useState(proceso?.notas_analista || "");

  React.useEffect(() => {
    setNotas(proceso?.notas_analista || "");
  }, [proceso]);

  return (
    <AnimatePresence>
      {proceso && (
        <motion.div
          className={styles.fondoModal}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={alCerrar}
        >
          <motion.div
            className={styles.ventanaModal}
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.cabeceraModal}>
              <div>
                <span className={styles.referenciaModal}>
                  {proceso.referencia_proceso} — UID:{" "}
                  {proceso.uid_secop || proceso.id_proceso_secop}
                </span>
                <h2 className={styles.tituloEntidadModal}>{proceso.entidad}</h2>
              </div>
              <button
                type="button"
                className={styles.botonCerrar}
                onClick={alCerrar}
                aria-label="Cerrar ventana de inspección"
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.rejillaFichaTecnica}>
              <div className={styles.celdaFicha}>
                <span className={styles.etiquetaCelda}>
                  Presupuesto Oficial
                </span>
                <span className={styles.valorCelda}>
                  {formatearMonedaCOP(proceso.precio_base)}
                </span>
              </div>
              <div className={styles.celdaFicha}>
                <span className={styles.etiquetaCelda}>Modalidad SECOP II</span>
                <span className={styles.valorCelda}>{proceso.modalidad}</span>
              </div>
              <div className={styles.celdaFicha}>
                <span className={styles.etiquetaCelda}>Tipo de Contrato</span>
                <span className={styles.valorCelda}>
                  {proceso.tipo_contrato}
                </span>
              </div>
              <div className={styles.celdaFicha}>
                <span className={styles.etiquetaCelda}>Código UNSPSC</span>
                <span className={styles.valorCelda}>
                  {proceso.codigo_unspsc_usado ||
                    proceso.codigo_unspsc ||
                    "No especificado"}
                </span>
              </div>
              <div className={styles.celdaFicha}>
                <span className={styles.etiquetaCelda}>
                  Fecha de publicación
                </span>
                <span className={styles.valorCelda}>
                  {formatearFechaCorta(proceso.fecha_publicacion)}
                </span>
              </div>
              <div className={styles.celdaFicha}>
                <span className={styles.etiquetaCelda}>
                  Fecha de presentación de ofertas
                </span>
                <span className={styles.valorCelda}>
                  {formatearFechaCorta(
                    proceso.fecha_cierre ?? proceso.fecha_limite_recepcion
                  )}
                </span>
              </div>
            </div>

            <div className={styles.seccionTexto}>
              <span className={styles.subtituloSeccion}>
                Objeto del Contrato
              </span>
              <p className={styles.parrafoDescripcion}>
                {proceso.objeto_contrato}
              </p>
            </div>

            <div className={styles.seccionTexto}>
              <span className={styles.subtituloSeccion}>
                Análisis de afinidad del modelo de IA (calculado en vivo)
              </span>
              <AnalisisAfinidad afinidad={proceso.afinidad_ia} />
            </div>

            <div className={styles.seccionTexto}>
              <span className={styles.subtituloSeccion}>
                Alcance y Descripción Técnica
              </span>
              <p className={styles.parrafoDescripcion}>
                {proceso.descripcion_proceso}
              </p>
            </div>

            <div className={styles.seccionTexto}>
              <label className={styles.subtituloSeccion} htmlFor="notas-modal">
                Dictamen Técnico y Notas del Analista
              </label>
              <textarea
                id="notas-modal"
                className={styles.areaNotas}
                placeholder="Registre observaciones jurídicas, financieras o requisitos habilitantes del pliego..."
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
              />
            </div>

            <div className={styles.pieModal}>
              <a
                href={proceso.url_proceso}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.enlaceExternoSecop}
              >
                <ExternalLink size={15} />
                <span>Abrir Expediente en Portal SECOP II</span>
              </a>

              <motion.button
                type="button"
                className={styles.botonGuardarNotas}
                onClick={() => alGuardarNotas(proceso.id, notas)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 24 }}
              >
                <Save size={15} />
                <span>Guardar Dictamen en Supabase</span>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
