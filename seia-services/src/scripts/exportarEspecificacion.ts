import { execSync } from "child_process";
import fs from "fs";
import path from "path";

/**
 * Script de utilidad para validar especificaciones mediante OpenSpec CLI
 * y exportar los artefactos JSON/YAML de la API de Express.
 */
function ejecutarValidacionYExportacion(): void {
  const raizBackend = path.resolve(__dirname, "../..");
  const directorioSpecs = path.join(raizBackend, "openspec", "specs");

  console.log("Ejecutando validación estricta de OpenSpec...");
  const salidaValidacion = execSync("openspec validate --all --strict", {
    cwd: raizBackend,
    encoding: "utf-8",
  });
  console.log(salidaValidacion.trim());

  const capacidades = [
    "parametros-busqueda",
    "procesos-secop",
    "historial-filtros",
  ];

  for (const cap of capacidades) {
    const jsonSpec = execSync(`openspec show ${cap} --type spec --json`, {
      cwd: raizBackend,
      encoding: "utf-8",
    });
    const destino = path.join(directorioSpecs, cap, "spec.json");
    fs.writeFileSync(destino, jsonSpec, "utf-8");
    console.log(`Especificación JSON exportada: ${destino}`);
  }
}

ejecutarValidacionYExportacion();
