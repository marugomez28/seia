# Tasks

## 1. Servicio de inferencia seia-ml

- [x] 1.1 Copiar el artefacto entrenado a `seia-ml/modelo/modelo_afinidad_seia.joblib` y escribir `seia-ml/modelo/metadatos.json` con métricas, umbrales y versiones (verificar: el archivo carga con `joblib.load`)
- [x] 1.2 Implementar `seia-ml/app/modelo.py` con la limpieza de texto del notebook, la carga del artefacto, la predicción por lotes, los niveles y la explicación por términos (verificar: prueba unitaria de limpieza y de predicción)
- [x] 1.3 Implementar `seia-ml/app/main.py` con FastAPI: `GET /salud`, `GET /modelo` y `POST /predecir` con validación de 1 a 200 textos (verificar: `pytest seia-ml/tests` en verde)
- [x] 1.4 Agregar `requirements.txt`, `Dockerfile` y `README.md` de `seia-ml` (verificar: `uvicorn app.main:app` responde en `/salud`)

## 2. Integración en seia-services

- [x] 2.1 Crear el cliente `src/services/clienteIA.ts` con tiempo de espera y la variable `SEIA_ML_URL` (verificar: compila con `npm run build`)
- [x] 2.2 Crear `src/controllers/iaController.ts` y las rutas `GET /api/ia/estado` y `POST /api/ia/clasificar`, con respuesta 503 cuando la IA no responde (verificar: `curl` contra ambos endpoints con `seia-ml` encendido y apagado)
- [x] 2.3 Enriquecer `GET /api/procesos` con `afinidad_ia`, `iaDisponible` y `ordenarPor=afinidad` (verificar: `curl /api/procesos?ordenarPor=afinidad` devuelve puntajes ordenados)
- [x] 2.4 Documentar los endpoints nuevos en `openapi.yaml` y `openapi.json`, y agregar `SEIA_ML_URL` a `.env.example` (verificar: Swagger UI en `/api-docs` muestra la etiqueta IA)

## 3. Interfaz en seia-app

- [x] 3.1 Agregar los tipos `AfinidadIA` y `EstadoIA` y los métodos `clasificarTexto` y `obtenerEstadoIA` en `apiClient.ts` (verificar: `npm run build` sin errores de tipos)
- [x] 3.2 Mostrar la afinidad en las tarjetas de procesos, con ordenamiento y filtro por afinidad, y una sección de explicación en el detalle del proceso (verificar: el dashboard muestra el nivel y el puntaje de cada proceso)
- [x] 3.3 Crear la vista "Clasificador IA" con texto libre, ejemplos, resultado explicado, tiempo de inferencia y métricas del modelo, y su entrada en la barra lateral con el estado del servicio (verificar: clasificar un texto nuevo desde el navegador)
- [x] 3.4 Actualizar la página de documentación (Sección 3) y la vista OpenSpec con la capacidad `clasificacion-afinidad` (verificar: revisión visual)

## 4. Orquestación, documentación y verificación integral

- [x] 4.1 Agregar `seia-ml` a `docker-compose.yml` y conectar `SEIA_ML_URL` (verificado: el YAML se parsea con los servicios `seia-ml`, `seia-services` y `seia-app`, y `seia-services` depende del healthcheck de `seia-ml`; `docker compose up --build` queda para una máquina con Docker)
- [x] 4.2 Escribir `docs/DOCUMENTO_TECNICO.md` (arquitectura, tecnologías y justificación) y `docs/GUIA_DEMO_SUSTENTACION.md` (guion de demo y preguntas técnicas) (verificar: revisión de contenido)
- [x] 4.3 Reescribir `README.md` con los requisitos, la configuración y los pasos para ejecutar el sistema con y sin Docker (verificar: seguir los pasos en limpio)
- [x] 4.4 Prueba de punta a punta: `seia-ml`, `seia-services` y `seia-app` encendidos; clasificar en vivo y ver la afinidad de los procesos reales de Supabase (verificar: capturas y respuestas reales)
- [x] 4.5 Ejecutar `openspec validate --all --strict` sin errores (verificar: salida del comando)

## Workflow follow-up

- Archivar el cambio con `openspec archive integracion-modelo-ia-afinidad` para fusionar los deltas en `openspec/specs/`.
- Sincronizar la copia `seia-services/openspec/` con `openspec/`.
