# Proposal

## Why

La documentación de SEIA (Sección 3, "Materia Machine Learning") promete un modelo de clasificación NLP que lee el objeto de cada proceso de SECOP II y predice su relevancia frente al portafolio de MGD Bitforge S.A.S. (gestión documental, archivística y tecnología SGDEA). Ese modelo ya fue entrenado y evaluado en `notebooks/02_clasificacion_afinidad_secop.ipynb`, pero la aplicación todavía no lo usa: el filtro actual depende solo de códigos UNSPSC y palabras clave, que las entidades asignan de forma genérica. Este cambio integra el modelo entrenado en la plataforma para que la afinidad se calcule en vivo sobre los procesos reales.

## What Changes

- Nuevo servicio de inferencia `seia-ml` (Python) que carga el modelo entrenado desde un archivo `.joblib`, sin reentrenarlo, y expone una API REST para clasificar textos, explicar la predicción y consultar los metadatos y métricas del modelo.
- `seia-services` expone nuevos endpoints `GET /api/ia/estado` y `POST /api/ia/clasificar`, que actúan como pasarela hacia el servicio de inferencia.
- `GET /api/procesos` agrega a cada proceso su **afinidad calculada en el momento** por el modelo (puntaje, nivel y términos que explican la decisión). Si el servicio de IA no está disponible, la respuesta conserva los procesos y lo indica, sin fallar.
- `seia-app` muestra la afinidad de cada proceso en el explorador y en el detalle, permite ordenar y filtrar por afinidad, e incorpora la vista "Clasificador IA" para clasificar en vivo cualquier objeto contractual.
- Orquestación: `docker-compose.yml` agrega el servicio `seia-ml`, y el contrato OpenAPI documenta los nuevos endpoints.
- Documentación técnica y de ejecución: documento técnico de arquitectura y tecnologías, README con los pasos para ejecutar el sistema completo y guía de demostración.

## Capabilities

### New Capabilities
- `clasificacion-afinidad`: Clasificación en vivo de la afinidad de un objeto contractual con el portafolio, usando el modelo entrenado, con explicación de la predicción, metadatos del modelo y verificación de estado.

### Modified Capabilities
- `procesos-secop`: Se agrega el requisito de calcular en vivo la afinidad de cada proceso consultado, tolerando la indisponibilidad del servicio de IA.

## Impact

- Nuevo directorio `seia-ml/`: servicio FastAPI, modelo `modelo/modelo_afinidad_seia.joblib`, metadatos, pruebas y Dockerfile.
- `seia-services`: cliente HTTP hacia `seia-ml`, controlador y rutas `/api/ia/*`, enriquecimiento de `GET /api/procesos`, nueva variable de entorno `SEIA_ML_URL` y contrato OpenAPI.
- `seia-app`: tipos, cliente de API, tarjetas de procesos, detalle del proceso, barra lateral y nueva vista "Clasificador IA".
- `docker-compose.yml`, `README.md`, `docs/` y `notebooks/README.md`.
- Nuevas dependencias de Python: `fastapi`, `uvicorn`, `scikit-learn`, `numpy`, `joblib`, y `pytest` y `httpx` para las pruebas.
