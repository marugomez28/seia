"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { BrainCircuit, Gauge, RefreshCw, Sparkles, Timer } from "lucide-react";
import { clienteApiSeia } from "@/services/apiClient";
import { EstadoIA, RespuestaClasificacionIA } from "@/types/seia";
import {
  DesgloseTerminos,
  InsigniaAfinidad,
  descripcionNivel,
  formatearPuntaje,
} from "./AfinidadIA";
import styles from "./ClasificadorIA.module.css";

const ejemplos = [
  "Implementación de un sistema de gestión de documentos electrónicos de archivo SGDEA para la entidad",
  "Prestación de servicios de digitalización y organización del archivo central conforme a las TRD",
  "Adquisición de licencias de software antivirus y renovación del soporte técnico",
  "Servicio de nube, hosting y mesa de ayuda para la plataforma web institucional",
  "Prestación de servicios como auxiliar de enfermería en el hospital municipal",
  "Construcción de placa huella en la vereda El Carmen del municipio",
];

const nombresMetricas: [string, string][] = [
  ["accuracy", "Accuracy"],
  ["precision", "Precision"],
  ["recall", "Recall"],
  ["f1", "F1-Score"],
  ["roc_auc", "ROC-AUC"],
];

/** Escala visual del puntaje de la SVM (distancia al hiperplano). */
const ESCALA_MIN = -2;
const ESCALA_MAX = 2;

function posicionEnEscala(valor: number): number {
  const limitado = Math.min(Math.max(valor, ESCALA_MIN), ESCALA_MAX);
  return ((limitado - ESCALA_MIN) / (ESCALA_MAX - ESCALA_MIN)) * 100;
}

interface PropiedadesClasificadorIA {
  estadoIA: EstadoIA | null;
  alRecargarEstado: () => void;
}

interface RegistroClasificacion {
  respuesta: RespuestaClasificacionIA;
  momento: string;
}

export default function ClasificadorIA({
  estadoIA,
  alRecargarEstado,
}: PropiedadesClasificadorIA) {
  const [texto, setTexto] = useState("");
  const [clasificando, setClasificando] = useState(false);
  const [historial, setHistorial] = useState<RegistroClasificacion[]>([]);

  const ultimo = historial[0];
  const resultado = ultimo?.respuesta.resultados[0];
  const umbrales = ultimo?.respuesta.umbrales ??
    estadoIA?.modelo?.umbrales ?? { balanceado: 0, exploracion: -0.44 };
  const modelo = estadoIA?.modelo;

  const clasificar = async (entrada: string) => {
    const limpio = entrada.trim();
    if (!limpio) {
      toast("Escriba un objeto contractual", {
        description: "El modelo necesita un texto para calcular la afinidad.",
      });
      return;
    }
    setClasificando(true);
    try {
      const respuesta = await clienteApiSeia.clasificarTexto(limpio);
      setHistorial((previo) =>
        [{ respuesta, momento: new Date().toLocaleTimeString("es-CO") }, ...previo].slice(0, 6)
      );
    } catch (error) {
      toast("No fue posible clasificar el texto", {
        description:
          error instanceof Error ? error.message : "El servicio de IA no respondió.",
      });
    } finally {
      setClasificando(false);
    }
  };

  return (
    <div className={styles.rejillaClasificador}>
      <section className={styles.panelPrincipal} aria-label="Clasificador de afinidad en vivo">
        <div className={styles.cabeceraPanel}>
          <span className={styles.iconoPanel}>
            <BrainCircuit size={18} />
          </span>
          <div>
            <h2 className={styles.tituloPanel}>Clasificar un objeto contractual</h2>
            <p className={styles.textoAyuda}>
              El texto se envía a seia-services, que lo pasa al microservicio seia-ml. El modelo
              entrenado (TF-IDF + SVM lineal) calcula la afinidad en el momento.
            </p>
          </div>
        </div>

        <textarea
          className={styles.areaTexto}
          placeholder="Ejemplo: Prestación de servicios para la organización, digitalización y custodia del archivo de gestión..."
          value={texto}
          maxLength={5000}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) clasificar(texto);
          }}
        />

        <div className={styles.filaEjemplos}>
          {ejemplos.map((ejemplo) => (
            <button
              key={ejemplo}
              type="button"
              className={styles.chipEjemplo}
              onClick={() => {
                setTexto(ejemplo);
                clasificar(ejemplo);
              }}
            >
              {ejemplo.length > 58 ? `${ejemplo.slice(0, 58)}…` : ejemplo}
            </button>
          ))}
        </div>

        <motion.button
          type="button"
          className={styles.botonClasificar}
          disabled={clasificando || !estadoIA?.disponible}
          onClick={() => clasificar(texto)}
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.975 }}
          transition={{ type: "spring", stiffness: 380, damping: 24 }}
        >
          <Sparkles size={15} />
          <span>{clasificando ? "Calculando con el modelo..." : "Clasificar con el modelo"}</span>
        </motion.button>

        {resultado && ultimo && (
          <motion.div
            key={ultimo.respuesta.calculado_en}
            className={styles.tarjetaResultado}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
          >
            <div className={styles.filaResultado}>
              <div>
                <span className={styles.etiqueta}>Resultado del modelo</span>
                <h3 className={styles.nivelResultado}>{descripcionNivel[resultado.nivel]}</h3>
              </div>
              <InsigniaAfinidad afinidad={resultado} />
            </div>

            <div className={styles.escala} aria-label="Puntaje en la escala del modelo">
              <span
                className={styles.zonaMedia}
                style={{
                  left: `${posicionEnEscala(umbrales.exploracion)}%`,
                  width: `${posicionEnEscala(umbrales.balanceado) - posicionEnEscala(umbrales.exploracion)}%`,
                }}
              />
              <span
                className={styles.zonaAlta}
                style={{ left: `${posicionEnEscala(umbrales.balanceado)}%` }}
              />
              <span
                className={styles.marcador}
                style={{ left: `${posicionEnEscala(resultado.puntaje)}%` }}
              />
            </div>
            <div className={styles.leyendaEscala}>
              <span>Baja</span>
              <span>Media (≥ {umbrales.exploracion.toFixed(2)})</span>
              <span>Alta (&gt; {umbrales.balanceado.toFixed(2)})</span>
            </div>

            <div className={styles.datosEjecucion}>
              <span>
                <Gauge size={13} /> Puntaje SVM: <strong>{formatearPuntaje(resultado.puntaje)}</strong>
              </span>
              <span>
                <Timer size={13} /> Inferencia: <strong>{ultimo.respuesta.tiempo_inferencia_ms} ms</strong>
              </span>
              <span>
                Calculado: <strong>{ultimo.momento}</strong>
              </span>
              <span>
                Modelo v<strong>{ultimo.respuesta.version_modelo}</strong>
              </span>
            </div>

            <span className={styles.etiqueta}>Términos que explican la decisión</span>
            <DesgloseTerminos terminos={resultado.terminos_clave} />
          </motion.div>
        )}

        {historial.length > 1 && (
          <div className={styles.historial}>
            <span className={styles.etiqueta}>Clasificaciones de esta sesión</span>
            <ul>
              {historial.slice(1).map((registro) => {
                const r = registro.respuesta.resultados[0];
                return (
                  <li key={registro.respuesta.calculado_en} className={styles.itemHistorial}>
                    <span className={styles.textoHistorial}>{r.texto}</span>
                    <InsigniaAfinidad afinidad={r} />
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      <aside className={styles.panelModelo} aria-label="Ficha del modelo entrenado">
        <div className={styles.cabeceraModelo}>
          <span className={styles.etiqueta}>Ficha del modelo</span>
          <button type="button" className={styles.botonRecargar} onClick={alRecargarEstado}>
            <RefreshCw size={13} />
            <span>Verificar</span>
          </button>
        </div>

        <div
          className={`${styles.estadoServicio} ${
            estadoIA?.disponible ? styles.estadoActivo : styles.estadoInactivo
          }`}
        >
          <span className={styles.punto} />
          {estadoIA === null
            ? "Consultando el servicio de IA..."
            : estadoIA.disponible
              ? `seia-ml operativo · modelo v${modelo?.version ?? "?"}`
              : estadoIA.mensaje || "Servicio de IA no disponible"}
        </div>

        {modelo && (
          <>
            <dl className={styles.listaDatos}>
              <div>
                <dt>Algoritmo</dt>
                <dd>{modelo.tipo}</dd>
              </div>
              <div>
                <dt>Entrenado</dt>
                <dd>{modelo.entrenado_en ?? "—"}</dd>
              </div>
              <div>
                <dt>Vocabulario</dt>
                <dd>{modelo.terminos_vocabulario.toLocaleString("es-CO")} términos</dd>
              </div>
              <div>
                <dt>Entrenamiento / prueba</dt>
                <dd>
                  {(modelo.registros?.entrenamiento ?? 0).toLocaleString("es-CO")} /{" "}
                  {(modelo.registros?.prueba ?? 0).toLocaleString("es-CO")} contratos
                </dd>
              </div>
            </dl>

            <span className={styles.etiqueta}>Métricas en el conjunto de prueba</span>
            <div className={styles.rejillaMetricas}>
              {nombresMetricas.map(([clave, nombre]) => (
                <div key={clave} className={styles.celdaMetrica}>
                  <span className={styles.valorMetrica}>
                    {modelo.metricas_prueba?.[clave]?.toFixed(3) ?? "—"}
                  </span>
                  <span className={styles.nombreMetrica}>{nombre}</span>
                </div>
              ))}
            </div>

            <p className={styles.notaModelo}>
              Fuente: {modelo.fuente_datos}. Notebook: <code>{modelo.notebook}</code>. El
              modelo se carga desde <code>modelo_afinidad_seia.joblib</code>, sin reentrenarse.
            </p>
          </>
        )}
      </aside>
    </div>
  );
}
