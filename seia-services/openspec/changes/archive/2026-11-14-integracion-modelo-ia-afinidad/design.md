# Design

## Context

SEIA tiene dos capas: `seia-app` (Next.js) y `seia-services` (Express con TypeScript), conectadas a Supabase y a la API SODA de SECOP II. El modelo de afinidad se entrenó en Python con scikit-learn: TF-IDF de unigramas y bigramas más `LinearSVC` con `C = 1` y `class_weight = 'balanced'`. El notebook `02_clasificacion_afinidad_secop.ipynb` lo guarda como un diccionario `joblib` con el vectorizador, el modelo y los umbrales. La limpieza de texto (minúsculas, sin tildes ni signos, sin números aislados) se define en el notebook y no forma parte del objeto serializado. La motivación del cambio está en `proposal.md`.

## Goals / Non-Goals

**Goals:**
- Servir el modelo ya entrenado, con exactamente la misma limpieza de texto del entrenamiento.
- Calcular la afinidad en vivo en cada solicitud, para que la demostración pruebe que no hay resultados precargados.
- Mantener la aplicación operativa aunque el servicio de IA esté caído (degradación controlada).
- Ejecutar todo con un solo `docker compose up`, y también sin Docker en desarrollo.

**Non-Goals:**
- Reentrenar el modelo desde la aplicación o hacer aprendizaje en línea.
- Guardar la afinidad en Supabase: no se cambia el esquema de la base de datos.
- Autenticación de usuarios y calibración de probabilidades.

## Decisions

1. **Microservicio de inferencia en Python (FastAPI) en lugar de ejecutar el modelo en Node.js.**
   El artefacto es un objeto de scikit-learn y solo se puede usar de forma fiable desde Python. FastAPI aporta validación con Pydantic, documentación OpenAPI automática en `/docs` y un rendimiento suficiente. *Alternativas descartadas:* exportar a ONNX para Node.js (convertir TF-IDF con bigramas y stopwords es frágil y obliga a reimplementar la limpieza en TypeScript), o llamar a Python con `child_process` desde Express (el proceso se inicia en cada solicitud y es difícil de observar).

2. **El modelo se carga una sola vez al iniciar el proceso (`lifespan`) y se mantiene en memoria.**
   La inferencia de un lote de 100 textos tarda pocos milisegundos. Si el artefacto falta, el servicio no arranca, así un despliegue roto queda visible de inmediato.

3. **La limpieza de texto vive en un módulo de Python con la misma lógica del notebook**, y una prueba automatizada compara su salida con casos del notebook. Así se evita que los datos de producción se procesen distinto que los de entrenamiento.

4. **La explicación se calcula como `tfidf(término) × coeficiente(término)`.** En un modelo lineal, el puntaje es exactamente la suma de esas contribuciones más el sesgo, así que la explicación es fiel al modelo, sin aproximaciones como SHAP o LIME.

5. **`seia-services` actúa como pasarela.** El navegador solo habla con Express y el servicio de IA queda en la red interna de Docker. El enriquecimiento de `GET /api/procesos` envía **un solo lote** al modelo con todas las descripciones, con un tiempo de espera de 5 s. Si falla, cada proceso queda con `afinidad_ia: null` e `iaDisponible: false`.

6. **Umbrales de decisión.** El umbral balanceado es `0` (punto de operación del notebook: F1 ≈ 0,67). El umbral de exploración es ≈ `-0,44` (recall ≥ 80 %, elegido por validación cruzada). Los niveles se definen así: `Alta` si el puntaje es mayor que 0; `Media` si está entre el umbral de exploración y 0, para revisión manual; `Baja` en otro caso.

7. **Versiones fijadas.** `scikit-learn==1.6.1`, la misma versión que serializó el artefacto, para que no haya incompatibilidades al cargarlo.

## Risks / Trade-offs

- [El artefacto depende de la versión de scikit-learn] → Se fija `scikit-learn==1.6.1` en `requirements.txt`, y `metadatos.json` documenta la versión con la que se serializó.
- [Agregar el modelo hace más lenta la consulta de procesos] → Una sola llamada por lote con tiempo de espera de 5 s; si se excede, la aplicación sigue respondiendo sin afinidad.
- [Ruido de etiquetas UNSPSC: precision ≈ 0,65] → Se muestran el puntaje y los términos que explican la decisión, para que el analista valide. El nivel `Media` marca los casos de revisión manual.
- [Gestión documental subrepresentada en el entrenamiento] → Queda documentado como limitación. El umbral de exploración aumenta el recall.
- [Archivo binario de 7,5 MB en git] → Es aceptable para el alcance académico. La alternativa sería Git LFS o un registro de modelos.

## Migration Plan

1. Desplegar `seia-ml` y comprobar `GET /salud`.
2. Configurar `SEIA_ML_URL` en `seia-services` y reiniciarlo.
3. Desplegar `seia-app`.
4. *Rollback:* quitar `SEIA_ML_URL` o detener `seia-ml`. La API sigue funcionando con `iaDisponible: false`, sin cambios de esquema que revertir.
