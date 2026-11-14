"""SEIA ML: API REST de inferencia del modelo de afinidad (FastAPI)."""

from __future__ import annotations

import os
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import List

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator

from .modelo import RUTA_MODELO_PREDETERMINADA, ModeloAfinidad

MAX_TEXTOS = 200
MAX_CARACTERES = 5000

estado_servicio: dict = {}


@asynccontextmanager
async def ciclo_de_vida(_app: FastAPI):
    """Carga el modelo entrenado UNA sola vez al iniciar. Si falta el artefacto, no arranca."""
    ruta = Path(os.getenv("SEIA_MODELO_RUTA", str(RUTA_MODELO_PREDETERMINADA)))
    inicio = time.perf_counter()
    estado_servicio["modelo"] = ModeloAfinidad(ruta)
    estado_servicio["tiempo_carga_ms"] = round((time.perf_counter() - inicio) * 1000, 1)
    print(f"[seia-ml] Modelo cargado desde {ruta} en {estado_servicio['tiempo_carga_ms']} ms")
    yield
    estado_servicio.clear()


app = FastAPI(
    title="SEIA ML · Servicio de afinidad contractual",
    version="1.0.0",
    description=(
        "Clasifica en vivo la afinidad de objetos contractuales de SECOP II con el portafolio "
        "de MGD Bitforge S.A.S. (gestión documental, archivística y tecnología SGDEA). "
        "Modelo: TF-IDF + LinearSVC entrenado en notebooks/02_clasificacion_afinidad_secop.ipynb."
    ),
    lifespan=ciclo_de_vida,
)


class SolicitudPrediccion(BaseModel):
    textos: List[str] = Field(
        ...,
        min_length=1,
        max_length=MAX_TEXTOS,
        description=f"Entre 1 y {MAX_TEXTOS} objetos contractuales.",
        examples=[["Adquisición de licencias de software y soporte técnico"]],
    )
    explicar: bool = Field(False, description="Incluir los términos que explican cada predicción.")

    @field_validator("textos")
    @classmethod
    def validar_textos(cls, textos: List[str]) -> List[str]:
        for posicion, texto in enumerate(textos):
            if not texto or not texto.strip():
                raise ValueError(f"El texto en la posición {posicion} está vacío.")
            if len(texto) > MAX_CARACTERES:
                raise ValueError(
                    f"El texto en la posición {posicion} supera {MAX_CARACTERES} caracteres."
                )
        return textos


def obtener_modelo() -> ModeloAfinidad:
    modelo = estado_servicio.get("modelo")
    if modelo is None:
        raise HTTPException(status_code=503, detail="El modelo todavía no está cargado.")
    return modelo


@app.get("/", tags=["Servicio"])
def raiz():
    return {
        "servicio": "seia-ml",
        "descripcion": "Inferencia del modelo de afinidad contractual de SEIA",
        "endpoints": ["/salud", "/modelo", "/predecir", "/docs"],
    }


@app.get("/salud", tags=["Servicio"])
def salud():
    modelo = estado_servicio.get("modelo")
    return {
        "estado": "operativo" if modelo else "iniciando",
        "servicio": "seia-ml",
        "modelo_cargado": modelo is not None,
        "version_modelo": modelo.version if modelo else None,
        "tiempo_carga_ms": estado_servicio.get("tiempo_carga_ms"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/modelo", tags=["Modelo"])
def describir_modelo():
    return obtener_modelo().descripcion()


@app.post("/predecir", tags=["Modelo"])
def predecir(solicitud: SolicitudPrediccion):
    modelo = obtener_modelo()
    inicio = time.perf_counter()
    resultados = modelo.predecir(solicitud.textos, explicar=solicitud.explicar)
    tiempo_ms = (time.perf_counter() - inicio) * 1000
    return {
        "resultados": resultados,
        "total": len(resultados),
        "tiempo_inferencia_ms": round(tiempo_ms, 2),
        "version_modelo": modelo.version,
        "umbrales": {
            "balanceado": modelo.umbral_balanceado,
            "exploracion": round(modelo.umbral_exploracion, 4),
        },
        "calculado_en": datetime.now(timezone.utc).isoformat(),
    }
