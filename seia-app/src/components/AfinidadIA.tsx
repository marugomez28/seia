"use client";

import React from "react";
import { BrainCircuit } from "lucide-react";
import { AfinidadIA, NivelAfinidadIA, TerminoClaveIA } from "@/types/seia";
import styles from "./AfinidadIA.module.css";

const claseNivel: Record<NivelAfinidadIA, string> = {
  Alta: styles.nivelAlta,
  Media: styles.nivelMedia,
  Baja: styles.nivelBaja,
};

export const descripcionNivel: Record<NivelAfinidadIA, string> = {
  Alta: "Afín al portafolio",
  Media: "Revisar: afinidad parcial",
  Baja: "No afín al portafolio",
};

export function formatearPuntaje(puntaje: number): string {
  return `${puntaje >= 0 ? "+" : ""}${puntaje.toFixed(2)}`;
}

/**
 * Insignia compacta con el nivel y el puntaje que calculó el modelo en vivo.
 */
export function InsigniaAfinidad({
  afinidad,
}: {
  afinidad?: AfinidadIA | null;
}) {
  if (!afinidad) {
    return (
      <span className={`${styles.insignia} ${styles.nivelSinDato}`} title="El servicio de IA no respondió">
        <BrainCircuit size={12} />
        <span>IA no disponible</span>
      </span>
    );
  }
  return (
    <span
      className={`${styles.insignia} ${claseNivel[afinidad.nivel]}`}
      title={`${descripcionNivel[afinidad.nivel]} · puntaje SVM ${formatearPuntaje(afinidad.puntaje)}`}
    >
      <BrainCircuit size={12} />
      <span>
        Afinidad IA: {afinidad.nivel} ({formatearPuntaje(afinidad.puntaje)})
      </span>
    </span>
  );
}

/**
 * Desglose de los términos que más aportaron a la decisión del modelo.
 * La contribución es tfidf(término) x coeficiente(término) de la SVM lineal.
 */
export function DesgloseTerminos({
  terminos,
}: {
  terminos?: TerminoClaveIA[];
}) {
  if (!terminos || terminos.length === 0) {
    return (
      <p className={styles.sinTerminos}>
        El modelo no reconoció términos de su vocabulario en este texto.
      </p>
    );
  }
  const maximo = Math.max(...terminos.map((t) => Math.abs(t.contribucion)), 0.0001);
  return (
    <ul className={styles.listaTerminos}>
      {terminos.map((t) => (
        <li key={t.termino} className={styles.filaTermino}>
          <span className={styles.nombreTermino}>{t.termino}</span>
          <span className={styles.pistaBarra}>
            <span
              className={`${styles.barra} ${
                t.direccion === "afin" ? styles.barraAfin : styles.barraNoAfin
              }`}
              style={{ width: `${(Math.abs(t.contribucion) / maximo) * 100}%` }}
            />
          </span>
          <span className={styles.valorTermino}>{formatearPuntaje(t.contribucion)}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Bloque completo (nivel, puntaje y términos) para el detalle de un proceso.
 */
export function AnalisisAfinidad({ afinidad }: { afinidad?: AfinidadIA | null }) {
  if (!afinidad) {
    return (
      <p className={styles.sinTerminos}>
        El servicio de IA (seia-ml) no respondió al cargar los procesos. Verifique que esté
        en ejecución y recargue la vista.
      </p>
    );
  }
  return (
    <div className={styles.bloqueAnalisis}>
      <div className={styles.filaResumen}>
        <InsigniaAfinidad afinidad={afinidad} />
        <span className={styles.notaResumen}>
          {descripcionNivel[afinidad.nivel]} · {afinidad.terminos_reconocidos} términos
          reconocidos
        </span>
      </div>
      <span className={styles.subtitulo}>Términos que explican la decisión</span>
      <DesgloseTerminos terminos={afinidad.terminos_clave} />
    </div>
  );
}
