# clasificacion-afinidad Specification

## Purpose
Clasifica en vivo la afinidad de un objeto contractual de SECOP II con el portafolio de MGD Bitforge S.A.S. (gestión documental, archivística y tecnología SGDEA) usando el modelo de aprendizaje supervisado entrenado en `notebooks/02_clasificacion_afinidad_secop.ipynb`, explica cada predicción y expone el estado y las métricas del modelo.

## Requirements

### Requirement: Cargar el modelo entrenado sin reentrenar
El sistema SHALL cargar el modelo de afinidad desde el artefacto entrenado (`modelo_afinidad_seia.joblib`) al iniciar el servicio de inferencia, sin ejecutar ningún proceso de entrenamiento, y SHALL rechazar el inicio si el artefacto no existe o no se puede leer.

#### Scenario: Inicio con el artefacto disponible
- **WHEN** el servicio de inferencia arranca y el archivo del modelo existe
- **THEN** el modelo queda cargado en memoria y la verificación de estado informa `modelo_cargado: true` con la versión del modelo

#### Scenario: Artefacto ausente
- **WHEN** el servicio de inferencia arranca y el archivo del modelo no existe
- **THEN** el servicio termina con un error que indica la ruta esperada del artefacto, sin entrenar un modelo nuevo

### Requirement: Clasificar textos en el momento de la solicitud
El sistema SHALL exponer un endpoint que reciba entre 1 y 200 textos de objeto contractual y devuelva, para cada uno, el puntaje del modelo, la decisión `afin` y un nivel `Alta`, `Media` o `Baja`, calculados en el momento de la solicitud a partir del texto recibido. El nivel MUST ser `Alta` cuando el puntaje supera el umbral balanceado, `Media` cuando está entre el umbral de exploración y el balanceado, y `Baja` en otro caso.

#### Scenario: Texto claramente tecnológico
- **WHEN** se envía el texto "Adquisición de licencias de software antivirus y renovación del soporte técnico"
- **THEN** la respuesta tiene código HTTP 200, `afin: true`, nivel `Alta` y un puntaje mayor que el umbral balanceado

#### Scenario: Texto ajeno al portafolio
- **WHEN** se envía el texto "Prestación de servicios como auxiliar de enfermería en el hospital municipal"
- **THEN** la respuesta tiene código HTTP 200, `afin: false` y nivel `Baja`

#### Scenario: Resultado recalculado con cada solicitud
- **WHEN** se clasifica un texto nuevo que nunca fue almacenado por el sistema
- **THEN** la respuesta incluye el puntaje calculado para ese texto y el tiempo de inferencia en milisegundos

#### Scenario: Solicitud inválida
- **WHEN** se envía una lista vacía de textos, más de 200 textos o un texto vacío
- **THEN** la respuesta tiene código HTTP 422 y describe el error de validación

### Requirement: Explicar la predicción
El sistema SHALL devolver, cuando se solicite la explicación, hasta 6 términos del texto que más aportaron a la decisión, cada uno con su contribución numérica y el sentido en que empujan la decisión (hacia afín o hacia no afín).

#### Scenario: Explicación de un texto afín
- **WHEN** se clasifica con explicación el texto "Renovación del licenciamiento de software y soporte de la plataforma en la nube"
- **THEN** cada resultado incluye una lista `terminos_clave` no vacía, ordenada por la magnitud de su contribución, en la que aparece al menos un término con contribución positiva

### Requirement: Exponer el estado y las métricas del modelo
El sistema SHALL exponer el estado del servicio de inferencia y los metadatos del modelo cargado: tipo de modelo, fecha de entrenamiento, fuente de datos, umbrales de decisión y métricas de evaluación en el conjunto de prueba (accuracy, precision, recall, F1 y ROC-AUC).

#### Scenario: Consulta del estado desde la API principal
- **WHEN** el cliente invoca `GET /api/ia/estado` en `seia-services`
- **THEN** la respuesta tiene código HTTP 200 e indica si el servicio de IA está disponible y, cuando lo está, los metadatos y métricas del modelo

#### Scenario: Servicio de IA no disponible
- **WHEN** el cliente invoca `GET /api/ia/estado` y el servicio de inferencia no responde
- **THEN** la respuesta tiene código HTTP 200 con `disponible: false` y un mensaje que describe la causa

### Requirement: Clasificar textos libres desde la API principal
El sistema SHALL exponer `POST /api/ia/clasificar` en `seia-services`, que reciba un texto o una lista de textos, los envíe al servicio de inferencia con explicación y devuelva sus resultados. Si el servicio de inferencia no está disponible, MUST responder con código HTTP 503 y un mensaje descriptivo.

#### Scenario: Clasificación desde la interfaz
- **WHEN** un analista escribe un objeto contractual en la vista "Clasificador IA" y solicita la clasificación
- **THEN** la interfaz muestra el puntaje, el nivel, los términos clave y el tiempo de inferencia devueltos por `POST /api/ia/clasificar`

#### Scenario: Inferencia caída
- **WHEN** se invoca `POST /api/ia/clasificar` y el servicio de inferencia no responde
- **THEN** la respuesta tiene código HTTP 503 con `exito: false` y un mensaje descriptivo
