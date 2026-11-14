"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Target,
  Layers,
  Cpu,
  Server,
  ExternalLink,
  ShieldCheck,
  Database,
  Code2,
} from "lucide-react";
import styles from "./page.module.css";

const transicionResorte = {
  type: "spring" as const,
  stiffness: 300,
  damping: 28,
};

export default function PaginaDocumentacionSeia() {
  return (
    <main className={styles.contenedorPagina}>
      <div className={styles.barraSuperior}>
        <Link href="/" className={styles.enlaceVolver}>
          <ArrowLeft size={16} />
          <span>Volver al Panel Operativo SEIA</span>
        </Link>
        <span className={styles.insigniaAcademica}>
          Entrega Académica Oficial — MGD Bitforge S.A.S.
        </span>
      </div>

      <motion.header
        className={styles.encabezadoHero}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transicionResorte}
      >
        <span className={styles.etiquetaSubtituloHero}>
          <ShieldCheck size={15} />
          <span>Documentación Técnica y Arquitectura del Sistema</span>
        </span>
        <h1 className={styles.tituloPrincipal}>
          SEIA - Inteligencia Contractual (MGD Bitforge S.A.S.)
        </h1>
        <p className={styles.resumenHero}>
          Plataforma integral de vigilancia tecnológica, filtrado automatizado y
          gestión estratégica de oportunidades de contratación pública sobre el
          ecosistema de Datos Abiertos de SECOP II.
        </p>
      </motion.header>

      <div className={styles.rejillaSecciones}>
        {/* Sección 1 - Objetivo del Proyecto */}
        <motion.section
          className={styles.tarjetaSeccion}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transicionResorte, delay: 0.06 }}
        >
          <div className={styles.cabeceraSeccion}>
            <div className={styles.iconoSeccion}>
              <Target size={20} />
            </div>
            <div className={styles.bloqueTituloSeccion}>
              <span className={styles.numeroSeccion}>Sección 1</span>
              <h2 className={styles.tituloSeccion}>Objetivo del Proyecto</h2>
            </div>
          </div>

          <p className={styles.parrafoSeccion}>
            SEIA automatiza la búsqueda, recolección y filtrado de procesos de
            contratación pública en SECOP II, enfocándose estratégicamente en
            las líneas de negocio de <strong>Gestión Documental</strong>{" "}
            (Instrumentos Archivísticos, TRD, SGDEA, Digitalización) y{" "}
            <strong>Desarrollo de Software</strong>.
          </p>

          <div className={styles.listaPuntos}>
            <div className={styles.itemPunto}>
              <Code2 size={16} />
              <span>
                Construcción dinámica de consultas SoQL sobre la API SODA de
                Datos Abiertos (<code>p6dx-8zbt.json</code>) filtrando procesos
                recientes por códigos UNSPSC, modalidades competitivas y
                palabras clave técnicas.
              </span>
            </div>
            <div className={styles.itemPunto}>
              <ShieldCheck size={16} />
              <span>
                Reducción de tiempos operativos en la identificación de pliegos
                relevantes y centralización del flujo de estructuración de
                ofertas para MGD Bitforge S.A.S.
              </span>
            </div>
          </div>
        </motion.section>

        {/* Sección 2 - Arquitectura (Materia DevOps) */}
        <motion.section
          className={styles.tarjetaSeccion}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transicionResorte, delay: 0.12 }}
        >
          <div className={styles.cabeceraSeccion}>
            <div className={styles.iconoSeccion}>
              <Layers size={20} />
            </div>
            <div className={styles.bloqueTituloSeccion}>
              <span className={styles.numeroSeccion}>
                Sección 2 — Materia DevOps
              </span>
              <h2 className={styles.tituloSeccion}>
                Arquitectura del Sistema
              </h2>
            </div>
          </div>

          <p className={styles.parrafoSeccion}>
            Arquitectura desacoplada en dos servicios principales con tipado
            estricto en TypeScript: frontend reactivo en{" "}
            <strong>Next.js (App Router)</strong> (<code>seia-app</code>) y
            backend API REST en <strong>Node.js con Express</strong> (
            <code>seia-services</code>), conectados en tiempo real a un modelo
            de datos relacional de 3 tablas en{" "}
            <strong>PostgreSQL (Supabase)</strong> con operaciones CRUD
            completas:
          </p>

          <div className={styles.listaPuntos}>
            <div className={styles.itemPunto}>
              <Database size={16} />
              <span>
                <span className={styles.etiquetaTabla}>
                  1. parametros_busqueda:
                </span>{" "}
                Almacena las reglas activas de filtrado (<code>tipo</code>,{" "}
                <code>valor</code>, <code>area</code>, <code>activo</code>) para
                códigos UNSPSC, palabras clave y modalidades.
              </span>
            </div>
            <div className={styles.itemPunto}>
              <Database size={16} />
              <span>
                <span className={styles.etiquetaTabla}>2. procesos_secop:</span>{" "}
                Persistencia de procesos sincronizados mediante{" "}
                <code>upsert</code> por <code>uid_secop</code>, incluyendo
                presupuesto, fechas de publicación/cierre y código UNSPSC.
              </span>
            </div>
            <div className={styles.itemPunto}>
              <Database size={16} />
              <span>
                <span className={styles.etiquetaTabla}>
                  3. historial_filtros:
                </span>{" "}
                Registro de auditoría y trazabilidad de cada ejecución de
                sincronización con SECOP II.
              </span>
            </div>
          </div>
        </motion.section>

        {/* Sección 3 - Inteligencia Artificial (Materia Machine Learning) */}
        <motion.section
          className={styles.tarjetaSeccion}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transicionResorte, delay: 0.18 }}
        >
          <div className={styles.cabeceraSeccion}>
            <div className={styles.iconoSeccion}>
              <Cpu size={20} />
            </div>
            <div className={styles.bloqueTituloSeccion}>
              <span className={styles.numeroSeccion}>
                Sección 3 — Materia Machine Learning
              </span>
              <h2 className={styles.tituloSeccion}>
                Inteligencia Artificial y Clasificación NLP
              </h2>
            </div>
          </div>

          <p className={styles.parrafoSeccion}>
            El sistema se integra con un modelo de clasificación de{" "}
            <strong>Procesamiento de Lenguaje Natural (NLP)</strong> entrenado
            en un <strong>Jupyter Notebook externo</strong> para analizar las
            descripciones técnicas de los procedimientos y predecir
            automáticamente la relevancia contractual de cada proceso frente al
            portafolio de MGD Bitforge S.A.S.
          </p>

          <div className={styles.listaPuntos}>
            <div className={styles.itemPunto}>
              <Cpu size={16} />
              <span>
                Vectorización de texto sobre el objeto contractual y evaluación
                supervisada de afinidad temática en Gestión Documental,
                Archivística y Tecnología SGDEA.
              </span>
            </div>
          </div>
        </motion.section>

        {/* Sección 4 - Contrato API REST */}
        <motion.section
          className={`${styles.tarjetaSeccion} ${styles.tarjetaSeccionAnchoCompleto}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transicionResorte, delay: 0.24 }}
        >
          <div className={styles.cabeceraSeccion}>
            <div className={styles.iconoSeccion}>
              <Server size={20} />
            </div>
            <div className={styles.bloqueTituloSeccion}>
              <span className={styles.numeroSeccion}>
                Sección 4 — Especificación OpenSpec y OpenAPI 3.1
              </span>
              <h2 className={styles.tituloSeccion}>Contrato API REST</h2>
            </div>
          </div>

          <p className={styles.parrafoSeccion}>
            El contrato formal de la API de <code>seia-services</code> fue
            estructurado y validado con <code>@fission-ai/openspec</code> y se
            sirve de manera interactiva mediante{" "}
            <strong>Swagger UI Express</strong> en el servidor backend para
            inspeccionar y probar en vivo todos los endpoints CRUD y de
            sincronización con SECOP II.
          </p>

          <div className={styles.contenedorAccionSwagger}>
            <div className={styles.metaRutaSwagger}>
              <span className={styles.etiquetaRuta}>
                Endpoint del Visor Interactivo
              </span>
              <code className={styles.codigoEndpoint}>
                GET http://localhost:4000/api-docs
              </code>
            </div>

            <motion.a
              href="http://localhost:4000/api-docs"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.botonSwaggerInteractivo}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={transicionResorte}
            >
              <Server size={18} />
              <span>Abrir Documentación Interactiva (Swagger)</span>
              <ExternalLink size={16} />
            </motion.a>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
