"""Carga y uso del modelo de afinidad entrenado en
`notebooks/02_clasificacion_afinidad_secop.ipynb`.

El modelo NO se reentrena aquí: se lee el artefacto `modelo_afinidad_seia.joblib`
(vectorizador TF-IDF + LinearSVC + umbrales) y se usa tal cual para inferencia.
"""

from __future__ import annotations

import json
import re
import unicodedata
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

import joblib
import numpy as np

DIRECTORIO_MODELO = Path(__file__).resolve().parent.parent / "modelo"
RUTA_MODELO_PREDETERMINADA = DIRECTORIO_MODELO / "modelo_afinidad_seia.joblib"
RUTA_METADATOS_PREDETERMINADA = DIRECTORIO_MODELO / "metadatos.json"

NIVEL_ALTA = "Alta"
NIVEL_MEDIA = "Media"
NIVEL_BAJA = "Baja"


def limpiar_texto(texto: str) -> str:
    """Normaliza el texto EXACTAMENTE igual que en el notebook de entrenamiento.

    1. Minúsculas y eliminación de tildes.
    2. Eliminación de puntuación y símbolos.
    3. Eliminación de números aislados (años, números de contrato).
    4. Unificación de espacios.
    """
    texto = unicodedata.normalize("NFKD", str(texto).lower())
    texto = "".join(ch for ch in texto if not unicodedata.combining(ch))
    texto = re.sub(r"[^a-z0-9 ]", " ", texto)
    texto = re.sub(r"\b\d+\b", " ", texto)
    return re.sub(r"\s+", " ", texto).strip()


class ModeloAfinidad:
    """Envoltorio del artefacto entrenado con predicción por lotes y explicación."""

    def __init__(self, ruta_modelo: Path, ruta_metadatos: Path | None = None) -> None:
        ruta_modelo = Path(ruta_modelo)
        if not ruta_modelo.exists():
            raise FileNotFoundError(
                f"No se encontró el modelo entrenado en '{ruta_modelo}'. "
                "Genérelo con notebooks/02_clasificacion_afinidad_secop.ipynb "
                "o configure SEIA_MODELO_RUTA."
            )

        artefacto = joblib.load(ruta_modelo)
        self.vectorizador = artefacto["vectorizador"]
        self.modelo = artefacto["modelo"]
        self.umbral_balanceado = float(artefacto.get("umbral", 0.0))
        self.umbral_exploracion = float(artefacto.get("umbral_exploracion", -0.44))

        self.terminos = self.vectorizador.get_feature_names_out()
        self.coeficientes = self.modelo.coef_.ravel()
        self.sesgo = float(np.ravel(self.modelo.intercept_)[0])

        ruta_metadatos = Path(ruta_metadatos or ruta_modelo.with_name("metadatos.json"))
        self.metadatos: Dict[str, Any] = (
            json.loads(ruta_metadatos.read_text(encoding="utf-8"))
            if ruta_metadatos.exists()
            else {}
        )
        self.ruta_modelo = ruta_modelo
        self.cargado_en = datetime.now(timezone.utc).isoformat()

    @property
    def version(self) -> str:
        return str(self.metadatos.get("version", "desconocida"))

    def nivel(self, puntaje: float) -> str:
        if puntaje > self.umbral_balanceado:
            return NIVEL_ALTA
        if puntaje > self.umbral_exploracion:
            return NIVEL_MEDIA
        return NIVEL_BAJA

    def predecir(
        self, textos: List[str], explicar: bool = False, max_terminos: int = 6
    ) -> List[Dict[str, Any]]:
        """Calcula el puntaje (distancia al hiperplano de la SVM) de cada texto."""
        limpios = [limpiar_texto(t) for t in textos]
        matriz = self.vectorizador.transform(limpios).tocsr()
        puntajes = self.modelo.decision_function(matriz)

        resultados: List[Dict[str, Any]] = []
        for i, puntaje in enumerate(np.ravel(puntajes)):
            puntaje = float(puntaje)
            fila = matriz.getrow(i)
            resultado: Dict[str, Any] = {
                "puntaje": round(puntaje, 4),
                "afin": puntaje > self.umbral_balanceado,
                "nivel": self.nivel(puntaje),
                "terminos_reconocidos": int(fila.nnz),
            }
            if explicar:
                resultado["terminos_clave"] = self._explicar_fila(fila, max_terminos)
            resultados.append(resultado)
        return resultados

    def _explicar_fila(self, fila, max_terminos: int) -> List[Dict[str, Any]]:
        """Contribución exacta de cada término: tfidf(término) x coeficiente(término).

        En un modelo lineal, puntaje = sum(contribuciones) + sesgo, por lo que la
        explicación es fiel al modelo (no es una aproximación).
        """
        if fila.nnz == 0:
            return []
        indices = fila.indices
        contribuciones = fila.data * self.coeficientes[indices]
        orden = np.argsort(-np.abs(contribuciones))[:max_terminos]
        return [
            {
                "termino": str(self.terminos[indices[j]]),
                "contribucion": round(float(contribuciones[j]), 4),
                "direccion": "afin" if contribuciones[j] > 0 else "no_afin",
            }
            for j in orden
        ]

    def descripcion(self) -> Dict[str, Any]:
        return {
            "version": self.version,
            "tipo": self.metadatos.get("tipo", type(self.modelo).__name__),
            "terminos_vocabulario": int(len(self.terminos)),
            "sesgo": round(self.sesgo, 4),
            "umbrales": {
                "balanceado": self.umbral_balanceado,
                "exploracion": round(self.umbral_exploracion, 4),
            },
            "cargado_en": self.cargado_en,
            "artefacto": self.ruta_modelo.name,
            **{k: v for k, v in self.metadatos.items() if k not in {"version", "tipo"}},
        }
