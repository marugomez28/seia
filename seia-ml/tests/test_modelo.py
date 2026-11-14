"""Pruebas del módulo de carga, limpieza, predicción y explicación del modelo."""

from pathlib import Path

import pytest

from app.modelo import (
    NIVEL_ALTA,
    NIVEL_BAJA,
    RUTA_MODELO_PREDETERMINADA,
    ModeloAfinidad,
    limpiar_texto,
)

TEXTO_TI = "Adquisición de licencias de software antivirus y renovación del soporte técnico"
TEXTO_NO_AFIN = "Prestación de servicios como auxiliar de enfermería en el hospital municipal"


@pytest.fixture(scope="module")
def modelo() -> ModeloAfinidad:
    return ModeloAfinidad(RUTA_MODELO_PREDETERMINADA)


@pytest.mark.parametrize(
    "entrada, esperado",
    [
        ("PRESTACIÓN DE SERVICIOS 2024; Gestión-Documental", "prestacion de servicios gestion documental"),
        ("Contrato No. 123 de 2024 para el SGDEA", "contrato no de para el sgdea"),
        ("  Archivo   central\n(TRD)  ", "archivo central trd"),
        ("Ñandú y cigüeña", "nandu y ciguena"),
    ],
)
def test_limpieza_igual_al_notebook(entrada, esperado):
    assert limpiar_texto(entrada) == esperado


def test_carga_sin_reentrenar(modelo):
    assert len(modelo.terminos) > 100_000
    assert modelo.coeficientes.shape[0] == len(modelo.terminos)
    assert modelo.umbral_exploracion < modelo.umbral_balanceado
    assert modelo.version == "1.0.0"


def test_artefacto_ausente(tmp_path: Path):
    with pytest.raises(FileNotFoundError):
        ModeloAfinidad(tmp_path / "no_existe.joblib")


def test_texto_tecnologico_es_afin(modelo):
    resultado = modelo.predecir([TEXTO_TI])[0]
    assert resultado["afin"] is True
    assert resultado["nivel"] == NIVEL_ALTA
    assert resultado["puntaje"] > modelo.umbral_balanceado


def test_texto_ajeno_no_es_afin(modelo):
    resultado = modelo.predecir([TEXTO_NO_AFIN])[0]
    assert resultado["afin"] is False
    assert resultado["nivel"] == NIVEL_BAJA


def test_explicacion_fiel_al_modelo(modelo):
    texto = "Renovación del licenciamiento de software y soporte de la plataforma en la nube"
    resultado = modelo.predecir([texto], explicar=True, max_terminos=10_000)[0]
    terminos = resultado["terminos_clave"]
    assert terminos, "La explicación no debe estar vacía"
    assert any(t["contribucion"] > 0 for t in terminos)
    magnitudes = [abs(t["contribucion"]) for t in terminos]
    assert magnitudes == sorted(magnitudes, reverse=True)
    # En un modelo lineal: puntaje = suma de contribuciones + sesgo
    reconstruido = sum(t["contribucion"] for t in terminos) + modelo.sesgo
    assert reconstruido == pytest.approx(resultado["puntaje"], abs=1e-2)


def test_prediccion_por_lotes_mantiene_el_orden(modelo):
    resultados = modelo.predecir([TEXTO_TI, TEXTO_NO_AFIN, TEXTO_TI])
    assert [r["afin"] for r in resultados] == [True, False, True]
    assert resultados[0]["puntaje"] == resultados[2]["puntaje"]
