# Guía de demostración en vivo y sustentación — SEIA

Guion para la **demostración funcional (20 %)** y la **sustentación técnica (15 %)**. Está pensado para unos 10 minutos de demo. Como la evaluación puede ser individual, cada integrante debería poder recorrerlo completo.

---

## 0. Antes de la presentación (checklist)

- [ ] `docker compose up --build` (o las tres terminales del README) **sin errores**.
- [ ] `curl http://localhost:8000/salud` devuelve `"modelo_cargado": true`.
- [ ] `curl http://localhost:4000/api/ia/estado` devuelve `"disponible": true`.
- [ ] http://localhost:3000 muestra en la barra lateral **"Modelo IA v1.0.0 activo"**.
- [ ] Hay procesos en Supabase. Si no, pulsa **Sincronizar Contratos**.
- [ ] La tabla `historial_filtros` existe en Supabase (`seia-services/supabase/schema.sql`).
- [ ] Tienes abiertos: la app, Swagger del backend (`:4000/api-docs`), Swagger del modelo (`:8000/docs`) y el notebook 02 en Colab.

## 1. Guion de la demostración

| Paso | Qué hacer | Qué decir (idea clave) |
|---|---|---|
| 1. Arquitectura | Muestra el diagrama del README | "Tres servicios: Next.js, Express y un microservicio Python que carga el modelo ya entrenado. El navegador nunca habla directo con la IA." |
| 2. Modelo cargado | Abre `:8000/salud` y `:8000/modelo` | "El modelo se cargó una vez desde `modelo_afinidad_seia.joblib`, sin reentrenarse. Aquí están sus métricas de prueba: F1 0,67 y ROC-AUC 0,97." |
| 3. Procesos reales con IA | En la app, vista **Procesos SECOP II**, elige *Ordenar por: Afinidad IA* | "Estos procesos vienen de Supabase. Al pedirlos, el backend manda sus 50 descripciones al modelo en un solo lote, y el modelo responde en unos 10 ms." |
| 4. Explicabilidad | Abre **Inspeccionar Pliego** en un proceso de nivel Alta | "No es una caja negra: estos son los términos que más empujaron la decisión. En un modelo lineal la contribución es exacta: TF-IDF por el coeficiente." |
| 5. Prueba de que no hay nada precargado | Vista **Clasificador IA**: escribe **un texto inventado en el momento** (puede proponerlo el jurado) | "Este texto nunca existió en la base de datos. El puntaje, el tiempo de inferencia y la hora se calculan ahora mismo." |
| 6. Cambio en vivo | Edita el texto: quita "software" o agrega "enfermería" y vuelve a clasificar | "Si cambio el texto, cambian el puntaje y los términos. El resultado depende de la entrada, no está guardado." |
| 7. Integración completa | Muestra la terminal o los logs de `seia-services` (morgan) y de `seia-ml` (uvicorn) | "Aquí se ve la cadena: `POST /api/ia/clasificar` en Express y `POST /predecir` en FastAPI, en el mismo segundo." |
| 8. Resiliencia (opcional) | Detén `seia-ml` (`docker compose stop seia-ml`) y recarga | "Si la IA cae, la aplicación no se rompe: los procesos se muestran con 'IA no disponible' y la API responde `iaDisponible: false`." Después: `docker compose start seia-ml` |
| 9. OpenSpec | En la terminal: `npx openspec validate --all --strict` y `npx openspec list --specs` | "Todo se especificó antes de implementarse: propuesta, diseño, *spec deltas* y tareas, validados en modo estricto y archivados." |

### Textos sugeridos para la prueba en vivo

| Texto | Resultado esperado |
|---|---|
| "Contratar el soporte, mantenimiento y licenciamiento de la plataforma de gestión documental electrónica en la nube" | **Alta**, con puntaje alto (≈ +2,95) |
| "Adquisición de licencias de software antivirus y renovación del soporte técnico" | **Alta** (≈ +3,40) |
| "Servicio de nube y mesa de ayuda para la plataforma web institucional" | **Alta** (≈ +1,94) |
| "Implementación de un sistema de gestión de documentos electrónicos de archivo SGDEA" | **Media**, en la frontera (≈ −0,05). Sirve para explicar la limitación de las etiquetas de gestión documental |
| "Prestación de servicios como auxiliar de enfermería en el hospital municipal" | **Baja** (≈ −1,23) |

### Comandos útiles para la demo por API

```bash
curl -s http://localhost:4000/api/ia/estado
```

```bash
curl -s -X POST http://localhost:4000/api/ia/clasificar -H 'Content-Type: application/json' -d '{"texto":"Servicio de nube y mesa de ayuda para la plataforma web institucional"}'
```

```bash
curl -s "http://localhost:4000/api/procesos?ordenarPor=afinidad"
```

## 2. Preguntas técnicas probables y respuestas

### Tecnologías

**¿Por qué tres servicios y no uno?**
El modelo es un objeto de scikit-learn y solo se puede usar con confianza desde Python. Separarlo en `seia-ml`:
- aísla las dependencias de ML;
- permite escalar o reemplazar el modelo sin tocar la API;
- mantiene la IA fuera del alcance directo del navegador.

Express sigue siendo el único punto de entrada.

**¿Por qué FastAPI?**
- Valida automáticamente con Pydantic (si la entrada no cumple, responde 422).
- Genera la documentación OpenAPI en `/docs`.
- Su ciclo de vida (`lifespan`) permite cargar el modelo una sola vez al arrancar.

**¿Por qué Supabase?**
Es PostgreSQL gestionado con API y cliente oficial para Node, así que no hay que operar un servidor. El `upsert` por `uid_secop` evita duplicados al sincronizar.

**¿Por qué TypeScript?**
Los mismos tipos (`AfinidadIA`, `ProcesoSecop`) describen el contrato en el frontend y en el backend, y los errores aparecen al compilar.

### Modelo de IA

**¿Qué problema resuelve el modelo?**
Es una clasificación binaria de texto: si el objeto de un contrato es afín al portafolio (TI y gestión documental) o no. Es aprendizaje **supervisado**: la etiqueta sale de los códigos UNSPSC y la entrada es el texto.

**¿Con qué datos se entrenó?**
Se descargaron 267.158 contratos reales de 2024 desde datos.gov.co (`jbjy-vk9h`). Tras quitar códigos inválidos, textos vacíos, duplicados y textos con etiquetas contradictorias quedaron **166.097 textos únicos**. La división fue 80/20 estratificada: 132.877 para entrenamiento y 33.220 para prueba.

**¿Por qué una SVM lineal?**
- **Rendimiento:** con TF-IDF hay unos 187.000 términos y muy pocos activos por texto, y en ese espacio disperso y de alta dimensión los clasificadores lineales de margen máximo funcionan muy bien.
- **Comparación:** le ganó a Naive Bayes (F1 0,48) y a la línea base (F1 0).
- **Costo:** entrena en segundos.
- **Interpretabilidad:** se puede leer el aporte de cada término.

**¿Cómo se eligieron los hiperparámetros?**
Con `GridSearchCV` sobre `C ∈ {0,3; 1; 3}` y `class_weight ∈ {None, balanced}`, con validación cruzada estratificada de 3 particiones y optimizando el F1. Ganó `C = 1` con `balanced`.

**¿Por qué el accuracy es 0,98 si el F1 es 0,67?**
Por el desbalance: solo el 2,3 % de los contratos es afín, así que un modelo que diga siempre "no afín" ya acierta el 97,7 %. Por eso las métricas que importan son la precision, el recall y el F1 de la clase afín.

**¿Qué significan precision 0,65 y recall 0,69?**
- **Precision:** de cada 100 contratos que el modelo marca como afines, 65 lo son según la etiqueta.
- **Recall:** de cada 100 contratos afines, el modelo encuentra 69.

El análisis de errores mostró que muchos "falsos positivos" son en realidad contratos de software mal codificados, así que la precision real es mayor.

**¿Por qué el ROC-AUC (0,97) es mucho más alto que el F1?**
El ROC-AUC mide qué tan bien **ordena** el modelo: la probabilidad de que un contrato afín reciba más puntaje que uno no afín. Por eso ordenar por afinidad es muy útil para el analista, aunque el umbral de decisión sea discutible.

**¿Qué son los niveles Alta, Media y Baja?**
- **Alta:** puntaje mayor que 0, el umbral balanceado (F1 0,67).
- **Media:** puntaje entre −0,44 y 0. El −0,44 es el umbral que da un recall del 80 % y se eligió por validación cruzada; estos casos son para revisión manual.
- **Baja:** puntaje menor que −0,44.

**¿Cómo se explica cada predicción?**
En un modelo lineal, el puntaje es la suma, término por término, de TF-IDF por el coeficiente, más el sesgo. Se muestran los 6 términos con mayor contribución. Es exacto, no una aproximación, y una prueba automatizada lo verifica.

**¿Cómo se carga el modelo sin reentrenar?**
El notebook lo exporta con `joblib.dump` y `seia-ml` hace `joblib.load` una sola vez al iniciar. Si el archivo falta, el servicio no arranca. La versión de scikit-learn está fijada en 1.6.1 para que el artefacto sea compatible.

**¿Cómo se garantiza que el texto se procesa igual que en el entrenamiento?**
`limpiar_texto()` en `seia-ml/app/modelo.py` replica la función del notebook, y una prueba compara casos (tildes, números, símbolos). Las *stopwords* van dentro del vectorizador serializado.

**¿Cuáles son las limitaciones?**
- Hay ruido en las etiquetas UNSPSC.
- Hay pocos ejemplos de gestión documental (el 97 % de los afines son de TI).
- El modelo no aprende en línea: hay que reentrenarlo con el notebook.
- TF-IDF no capta sinónimos. Como mejora futura se podrían usar *embeddings* o un modelo como BETO.

### Integración y pruebas

**¿Cómo demuestran que los resultados no están precargados?**
- El jurado escribe un texto nuevo y la respuesta trae el `tiempo_inferencia_ms` y la hora del cálculo.
- Al cambiar el texto, cambian el puntaje y los términos.
- La afinidad de los procesos no se guarda en Supabase: se calcula en cada `GET /api/procesos`.

**¿Qué pasa si la IA se cae?**
El backend espera como máximo 5 s y devuelve los procesos con `afinidad_ia: null` e `iaDisponible: false`. `POST /api/ia/clasificar` responde 503.

**¿Qué pruebas tienen?**
- 19 pruebas `pytest` del modelo y de la API de IA.
- Verificación de tipos con `tsc`.
- Validación estricta de OpenSpec.
- Pruebas de integración de punta a punta con datos reales.

### OpenSpec

**¿Cómo usaron OpenSpec?**
Para la integración de la IA se creó el cambio `integracion-modelo-ia-afinidad` con:
- `proposal.md`: el porqué y el qué;
- `design.md`: las decisiones y sus alternativas;
- los *spec deltas*: la nueva capacidad `clasificacion-afinidad` y la modificación de `procesos-secop`;
- `tasks.md`: las tareas con su criterio de verificación.

Se validó con `openspec validate --strict`, se implementó marcando las tareas y se archivó, lo que fusionó los requisitos en `openspec/specs/`.

**¿Qué es un spec delta?**
Es la diferencia de requisitos que introduce un cambio: `ADDED`, `MODIFIED` o `REMOVED`. Al archivar, OpenSpec la aplica sobre la especificación vigente.
