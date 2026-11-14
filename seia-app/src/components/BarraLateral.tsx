"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Briefcase,
  SlidersHorizontal,
  History,
  FileCode2,
  RefreshCw,
  ShieldCheck,
  BookOpen,
} from "lucide-react";
import { VistaActiva } from "@/types/seia";
import styles from "./BarraLateral.module.css";

interface PropiedadesBarraLateral {
  vistaActiva: VistaActiva;
  alCambiarVista: (vista: VistaActiva) => void;
  totalProcesos: number;
  totalParametros: number;
  totalHistorial: number;
  sincronizando: boolean;
  alSincronizarAhora: () => void;
}

const elementosMenu: {
  id: VistaActiva;
  etiqueta: string;
  icono: React.ComponentType<{ size?: number }>;
}[] = [
  {
    id: "procesos",
    etiqueta: "Procesos SECOP II",
    icono: Briefcase,
  },
  {
    id: "parametros",
    etiqueta: "Parámetros de Búsqueda",
    icono: SlidersHorizontal,
  },
  {
    id: "historial",
    etiqueta: "Historial de Filtros",
    icono: History,
  },
  {
    id: "openspec",
    etiqueta: "Contrato OpenSpec API",
    icono: FileCode2,
  },
];

export default function BarraLateral({
  vistaActiva,
  alCambiarVista,
  totalProcesos,
  totalParametros,
  totalHistorial,
  sincronizando,
  alSincronizarAhora,
}: PropiedadesBarraLateral) {
  const obtenerContador = (id: VistaActiva): number | null => {
    if (id === "procesos") return totalProcesos;
    if (id === "parametros") return totalParametros;
    if (id === "historial") return totalHistorial;
    return null;
  };

  return (
    <aside className={styles.barraLateral}>
      <div className={styles.bloqueSuperior}>
        <div className={styles.marcaContenedor}>
          <div className={styles.emblemaIcono}>
            <ShieldCheck size={22} />
          </div>
          <div className={styles.marcaTexto}>
            <span className={styles.siglaSistema}>SEIA</span>
            <span className={styles.subtituloSistema}>
              INTELIGENCIA SECOP II
            </span>
          </div>
        </div>

        <nav aria-label="Navegación principal del sistema">
          <div className={styles.seccionEtiqueta}>Módulos Operativos</div>
          <div className={styles.listaNavegacion}>
            {elementosMenu.map((item) => {
              const Icono = item.icono;
              const activo = vistaActiva === item.id;
              const contador = obtenerContador(item.id);

              return (
                <motion.button
                  key={item.id}
                  type="button"
                  onClick={() => alCambiarVista(item.id)}
                  className={`${styles.botonNav} ${
                    activo ? styles.botonNavActivo : ""
                  }`}
                  whileHover={{ x: 3 }}
                  whileTap={{ scale: 0.985 }}
                  transition={{ type: "spring", stiffness: 400, damping: 26 }}
                >
                  {activo && (
                    <motion.div
                      layoutId="indicadorNavegacionSeia"
                      className={styles.indicadorActivo}
                      transition={{
                        type: "spring",
                        stiffness: 350,
                        damping: 28,
                      }}
                    />
                  )}
                  <span className={styles.contenidoBotonNav}>
                    <Icono size={17} />
                    <span>{item.etiqueta}</span>
                  </span>
                  {contador !== null && (
                    <span className={styles.contadorInsignia}>{contador}</span>
                  )}
                </motion.button>
              );
            })}

            <Link href="/documentacion" className={styles.enlaceDocumentacionNav}>
              <span className={styles.contenidoBotonNav}>
                <BookOpen size={17} />
                <span>Documentación Técnica</span>
              </span>
            </Link>
          </div>
        </nav>
      </div>

      <div className={styles.panelEstadoConexion}>
        <div className={styles.cabeceraEstado}>
          <span className={styles.tituloEstado}>
            <span className={styles.puntoPulso} />
            Supabase + SODA API
          </span>
        </div>
        <p className={styles.descripcionEstado}>
          Sincroniza procesos reales desde Datos Abiertos (p6dx-8zbt.json)
          según los parámetros activos en Supabase.
        </p>
        <motion.button
          type="button"
          className={styles.botonSincronizarRapido}
          onClick={alSincronizarAhora}
          disabled={sincronizando}
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.975 }}
          transition={{ type: "spring", stiffness: 380, damping: 24 }}
        >
          <RefreshCw size={15} />
          <span>
            {sincronizando
              ? "Sincronizando SECOP II..."
              : "Sincronizar Contratos"}
          </span>
        </motion.button>
      </div>
    </aside>
  );
}
