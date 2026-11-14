# seia-ml — Servicio de inferencia del modelo de afinidad

Microservicio **FastAPI** que carga el modelo de IA **ya entrenado** en [`notebooks/02_clasificacion_afinidad_secop.ipynb`](../notebooks/02_clasificacion_afinidad_secop.ipynb) y clasifica en vivo la afinidad de objetos contractuales de SECOP II con el portafolio de MGD Bitforge S.A.S.

- **Modelo:** TF-IDF de unigramas y bigramas (186.852 términos) + `LinearSVC` (`C = 1`, `class_weight = 'balanced'`).
- **Artefacto:** [`modelo/modelo_afinidad_seia.joblib`](modelo/), cargado con `joblib.load` **una sola vez** al iniciar. No se reentrena.
- **Metadatos:** [`modelo/metadatos.json`](modelo/metadatos.json) incluye métricas, umbrales, datos de entrenamiento y versiones.

## Ejecutar

```bash
python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements-dev.txt
```

```bash
uvicorn app.main:app --port 8000
```

Con Docker:

```bash
docker build -t seia-ml . && docker run -p 8000:8000 seia-ml
```

Documentación interactiva: http://localhost:8000/docs

## Endpoints

| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/salud` | `modelo_cargado`, `version_modelo` y tiempo de carga |
| GET | `/modelo` | Tipo de modelo, vocabulario, umbrales, métricas de prueba, datos de entrenamiento |
| POST | `/predecir` | Recibe `{"textos": [...], "explicar": true}` con 1 a 200 textos. Devuelve `puntaje`, `afin`, `nivel` y `terminos_clave` por texto, más `tiempo_inferencia_ms` |

```bash
curl -s -X POST http://localhost:8000/predecir -H 'Content-Type: application/json' -d '{"textos":["Licenciamiento de software y soporte en la nube"],"explicar":true}'
```

**Niveles:**
- `Alta`: puntaje mayor que 0, el umbral balanceado (F1 ≈ 0,67).
- `Media`: puntaje entre −0,44 y 0. El −0,44 es el umbral de exploración, con recall ≥ 80 %.
- `Baja`: puntaje menor que −0,44.

**Explicación:** para cada término se calcula `tfidf(término) × coeficiente(término)`. La suma de todas las contribuciones más el sesgo da exactamente el puntaje.

## Cargar el modelo desde Python (sin el servicio)

Desde la carpeta `seia-ml/`:

```python
import joblib
from app.modelo import limpiar_texto

artefacto = joblib.load("modelo/modelo_afinidad_seia.joblib")
X = artefacto["vectorizador"].transform([limpiar_texto("Soporte de la plataforma SGDEA en la nube")])
print(artefacto["modelo"].decision_function(X))
```

## Pruebas

```bash
pytest
```

Las 19 pruebas cubren:
- que la limpieza de texto sea idéntica al notebook;
- la carga del artefacto y el error cuando falta;
- las predicciones de referencia y la explicación exacta;
- el orden de los lotes;
- los endpoints y las validaciones 422.

## Variables de entorno

| Variable | Por defecto | Descripción |
|---|---|---|
| `SEIA_MODELO_RUTA` | `modelo/modelo_afinidad_seia.joblib` | Ruta del artefacto entrenado |

> El artefacto se serializó con `scikit-learn 1.6.1`. Por eso la versión está fijada en `requirements.txt`.
