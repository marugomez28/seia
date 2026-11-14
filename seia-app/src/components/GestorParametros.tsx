"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  PlusCircle,
  Play,
  Power,
  Trash2,
  SlidersHorizontal,
  Edit3,
  Database,
  Layers,
  Tag,
} from "lucide-react";
import { CrearParametroFormulario, ParametroBusqueda } from "@/types/seia";
import styles from "./GestorParametros.module.css";

interface PropiedadesGestorParametros {
  parametros: ParametroBusqueda[];
  cargando: boolean;
  alCrearParametro: (nuevo: CrearParametroFormulario) => Promise<void>;
  alActualizarParametro: (
    id: string,
    cambios: Partial<CrearParametroFormulario>
  ) => Promise<void>;
  alAlternarEstadoParametro: (parametro: ParametroBusqueda) => Promise<void>;
  alEliminarParametro: (id: string, nombre: string) => Promise<void>;
  alEjecutarSincronizacionConPerfil: (
    parametro: ParametroBusqueda
  ) => Promise<void>;
}

const AREAS_DISPONIBLES = [
  "Gestión Documental",
  "Tecnología y SGDEA",
  "General",
];

/**
 * Formatea el identificador técnico del campo 'tipo' a su etiqueta legible.
 */
export function formatearTipoParametro(tipo: string | undefined): string {
  const normalizado = (tipo || "").trim().toLowerCase();
  if (normalizado === "codigo_unspsc") return "Código UNSPSC";
  if (normalizado === "palabra_clave") return "Palabra Clave";
  if (normalizado === "modalidad") return "Modalidad";
  if (!normalizado) return "Regla de Búsqueda";
  return normalizado
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letra) => letra.toUpperCase());
}

export default function GestorParametros({
  parametros,
  cargando,
  alCrearParametro,
  alActualizarParametro,
  alAlternarEstadoParametro,
  alEliminarParametro,
  alEjecutarSincronizacionConPerfil,
}: PropiedadesGestorParametros) {
  const [idEnEdicion, setIdEnEdicion] = useState<string | null>(null);
  const [tipo, setTipo] = useState<string>("palabra_clave");
  const [valor, setValor] = useState<string>("");
  const [area, setArea] = useState<string>("Gestión Documental");

  const limpiarFormulario = () => {
    setIdEnEdicion(null);
    setTipo("palabra_clave");
    setValor("");
    setArea("Gestión Documental");
  };

  const iniciarEdicion = (parametro: ParametroBusqueda) => {
    setIdEnEdicion(parametro.id);
    setTipo(parametro.tipo || "palabra_clave");
    setValor(parametro.valor || "");
    setArea(parametro.area || "Gestión Documental");
  };

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valor.trim()) return;

    const payload: CrearParametroFormulario = {
      tipo,
      valor: valor.trim(),
      area,
    };

    if (idEnEdicion) {
      await alActualizarParametro(idEnEdicion, payload);
    } else {
      await alCrearParametro(payload);
    }

    limpiarFormulario();
  };

  const opcionesArea = AREAS_DISPONIBLES.includes(area)
    ? AREAS_DISPONIBLES
    : [...AREAS_DISPONIBLES, area];

  return (
    <div className={styles.contenedorParametros}>
      <motion.form
        className={styles.panelFormulario}
        onSubmit={manejarEnvio}
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
      >
        <div className={styles.tituloFormulario}>
          <SlidersHorizontal size={18} />
          <span>
            {idEnEdicion
              ? "Editar Parámetro en Supabase"
              : "Nuevo Perfil de Búsqueda"}
          </span>
        </div>
        <p className={styles.subtituloFormulario}>
          Registra reglas de búsqueda en la tabla parametros_busqueda de
          Supabase (tipo, valor y área) para filtrar procesos en SECOP II.
        </p>

        <div className={styles.grupoInput}>
          <label className={styles.etiqueta} htmlFor="tipo-parametro">
            Tipo de Parámetro
          </label>
          <select
            id="tipo-parametro"
            className={styles.campoSelect}
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            <option value="palabra_clave">Palabra Clave</option>
            <option value="codigo_unspsc">Código UNSPSC</option>
            <option value="modalidad">Modalidad</option>
          </select>
        </div>

        <div className={styles.grupoInput}>
          <label className={styles.etiqueta} htmlFor="valor-parametro">
            Valor
          </label>
          <input
            id="valor-parametro"
            type="text"
            required
            className={styles.campoTexto}
            placeholder={
              tipo === "codigo_unspsc"
                ? "Ej. 43232300"
                : tipo === "modalidad"
                ? "Ej. Menor cuantía"
                : "Ej. TRD, Gestión Documental, SGDEA"
            }
            value={valor}
            onChange={(e) => setValor(e.target.value)}
          />
        </div>

        <div className={styles.grupoInput}>
          <label className={styles.etiqueta} htmlFor="area-parametro">
            Área
          </label>
          <select
            id="area-parametro"
            className={styles.campoSelect}
            value={area}
            onChange={(e) => setArea(e.target.value)}
          >
            {opcionesArea.map((opcion) => (
              <option key={opcion} value={opcion}>
                {opcion}
              </option>
            ))}
          </select>
        </div>

        <motion.button
          type="submit"
          className={styles.botonGuardar}
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 380, damping: 24 }}
        >
          <PlusCircle size={16} />
          <span>{idEnEdicion ? "Guardar Cambios" : "Registrar"}</span>
        </motion.button>

        {idEnEdicion && (
          <button
            type="button"
            className={styles.botonCancelarEdicion}
            onClick={limpiarFormulario}
          >
            Cancelar edición
          </button>
        )}
      </motion.form>

      <div className={styles.listaPerfiles}>
        {cargando ? (
          <div className={styles.estadoVacioParametros}>
            <Database size={28} />
            <h3>Consultando tabla parametros_busqueda en Supabase...</h3>
            <p>Cargando las reglas configuradas desde seia-services.</p>
          </div>
        ) : parametros.length === 0 ? (
          <div className={styles.estadoVacioParametros}>
            <Database size={28} />
            <h3>No hay parámetros registrados en Supabase</h3>
            <p>
              Utilice el formulario lateral para registrar una nueva regla en la
              tabla parametros_busqueda.
            </p>
          </div>
        ) : (
          parametros.map((param, idx) => {
            const etiquetaTipo = formatearTipoParametro(param.tipo);
            return (
              <motion.article
                key={param.id}
                className={`${styles.tarjetaPerfil} ${
                  param.activo ? styles.tarjetaPerfilActiva : ""
                }`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 320,
                  damping: 26,
                  delay: idx * 0.025,
                }}
              >
                <div className={styles.cabeceraPerfil}>
                  <span className={styles.etiquetaTipo}>
                    <Tag size={12} />
                    <span>{etiquetaTipo}</span>
                  </span>
                  <span
                    className={`${styles.insigniaEstado} ${
                      param.activo ? styles.insigniaEstadoActivo : ""
                    }`}
                  >
                    {param.activo ? "Activo" : "Pausado"}
                  </span>
                </div>

                <div className={styles.bloqueValorCentral}>
                  <h3 className={styles.valorPrincipal}>
                    {param.valor || "Sin valor"}
                  </h3>
                  <p className={styles.subtituloArea}>
                    <Layers size={13} />
                    <span>{param.area || "General"}</span>
                  </p>
                </div>

                <div className={styles.accionesPerfil}>
                  <motion.button
                    type="button"
                    className={styles.botonAccionSecundario}
                    onClick={() => iniciarEdicion(param)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 24 }}
                  >
                    <Edit3 size={14} />
                    <span>Editar</span>
                  </motion.button>

                  <motion.button
                    type="button"
                    className={styles.botonAccionSecundario}
                    onClick={() => alAlternarEstadoParametro(param)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 24 }}
                  >
                    <Power size={14} />
                    <span>{param.activo ? "Pausar" : "Activar"}</span>
                  </motion.button>

                  <motion.button
                    type="button"
                    className={styles.botonAccionSecundario}
                    onClick={() =>
                      alEliminarParametro(
                        param.id,
                        `${etiquetaTipo}: ${param.valor}`
                      )
                    }
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 24 }}
                  >
                    <Trash2 size={14} />
                    <span>Eliminar</span>
                  </motion.button>

                  <motion.button
                    type="button"
                    className={styles.botonAccionPrimario}
                    onClick={() => alEjecutarSincronizacionConPerfil(param)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 24 }}
                  >
                    <Play size={14} />
                    <span>Sincronizar</span>
                  </motion.button>
                </div>
              </motion.article>
            );
          })
        )}
      </div>
    </div>
  );
}
