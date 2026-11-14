"""Pruebas de la API REST de seia-ml (FastAPI TestClient con el modelo real)."""

import pytest
from fastapi.testclient import TestClient

from app.main import MAX_TEXTOS, app


@pytest.fixture(scope="module")
def cliente():
    with TestClient(app) as c:  # ejecuta el lifespan: carga el modelo real
        yield c


def test_salud(cliente):
    respuesta = cliente.get("/salud")
    assert respuesta.status_code == 200
    cuerpo = respuesta.json()
    assert cuerpo["modelo_cargado"] is True
    assert cuerpo["version_modelo"] == "1.0.0"


def test_metadatos_y_metricas(cliente):
    cuerpo = cliente.get("/modelo").json()
    for metrica in ("accuracy", "precision", "recall", "f1", "roc_auc"):
        assert metrica in cuerpo["metricas_prueba"]
    assert cuerpo["umbrales"]["balanceado"] == 0.0


def test_predecir_con_explicacion(cliente):
    respuesta = cliente.post(
        "/predecir",
        json={
            "textos": [
                "Adquisición de licencias de software antivirus y renovación del soporte técnico",
                "Prestación de servicios como auxiliar de enfermería en el hospital municipal",
            ],
            "explicar": True,
        },
    )
    assert respuesta.status_code == 200
    cuerpo = respuesta.json()
    assert cuerpo["total"] == 2
    assert cuerpo["tiempo_inferencia_ms"] >= 0
    afin, no_afin = cuerpo["resultados"]
    assert (afin["afin"], afin["nivel"]) == (True, "Alta")
    assert (no_afin["afin"], no_afin["nivel"]) == (False, "Baja")
    assert afin["terminos_clave"]


def test_texto_nuevo_se_calcula_en_el_momento(cliente):
    texto = "Implementación de mesa de ayuda y soporte de infraestructura en la nube para la alcaldía de prueba 98765"
    cuerpo = cliente.post("/predecir", json={"textos": [texto]}).json()
    assert isinstance(cuerpo["resultados"][0]["puntaje"], float)
    assert "calculado_en" in cuerpo


@pytest.mark.parametrize(
    "carga",
    [
        {"textos": []},
        {"textos": ["   "]},
        {"textos": ["texto"] * (MAX_TEXTOS + 1)},
        {"textos": ["x" * 5001]},
        {},
    ],
)
def test_solicitudes_invalidas(cliente, carga):
    assert cliente.post("/predecir", json=carga).status_code == 422
