# Notebooks de Machine Learning — SEIA

Notebooks de Google Colab con los modelos de aprendizaje automático de SEIA. Ambos usan la misma fuente de datos que `seia-services`: el endpoint abierto **SECOP II – Contratos Electrónicos** (`jbjy-vk9h`) de datos.gov.co.

| Notebook | Tipo | Problema | Modelo | Abrir |
|---|---|---|---|---|
| [`01_clustering_contratos_secop.ipynb`](01_clustering_contratos_secop.ipynb) | No supervisado | Segmentar contratos por valor mensual, duración, ejecución financiera y prórrogas | MiniBatch K-Means (k = 4) | [![Abrir en Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/marugomez28/seia/blob/dev_nicolas/notebooks/01_clustering_contratos_secop.ipynb) |
| [`02_clasificacion_afinidad_secop.ipynb`](02_clasificacion_afinidad_secop.ipynb) | Supervisado (NLP) | Clasificar si un contrato es afín al portafolio (gestión documental, archivística y TI) a partir del texto del objeto contractual | TF-IDF + SVM lineal (`LinearSVC`) | [![Abrir en Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/marugomez28/seia/blob/dev_nicolas/notebooks/02_clasificacion_afinidad_secop.ipynb) |

> Los enlaces de Colab apuntan a la rama `dev_nicolas`. Cuando se fusione a `main`, hay que cambiar `dev_nicolas` por `main` en la URL.

## Datos

- **Subconjunto**: contratos firmados en 2024 cuyo `id_contrato` termina en 1, 4 o 7. Es una muestra sistemática del 30 %, de ≈ 267.000 registros, repartida a lo largo de todo el año.
- **Descarga**: cada notebook descarga sus columnas con la API SODA (unos 2 minutos en Colab) y guarda una copia en `datos_secop/`. Esa carpeta está en `.gitignore`.
- **Privacidad**: no se descargan nombres, documentos ni datos de contacto de los contratistas.
- El endpoint se actualiza a diario, así que al reejecutar los notebooks las cifras pueden variar un poco respecto a las salidas guardadas.

## Ejecución

1. Abrir el notebook en Colab con el botón de la tabla.
2. Ejecutar `Entorno de ejecución → Ejecutar todas`. No hay que instalar nada: todas las librerías vienen en Colab.
3. Tiempo aproximado en Colab (CPU): de 3 a 5 minutos por notebook, incluida la descarga.

Para ejecutarlos en local hace falta Python 3.9 o superior con `pandas`, `numpy`, `scikit-learn`, `matplotlib`, `seaborn`, `pyarrow`, `requests` y `joblib`.

## Resultados guardados

Los `.ipynb` se entregan **ya ejecutados**, con todas las salidas, métricas y gráficas visibles. Resumen:

- **Clustering**: 4 segmentos (ejecutados y pagados, sin pagos registrados, prorrogados, y cortos de alto valor mensual), evaluados con Silhouette, Davies-Bouldin y Calinski-Harabasz.
- **Clasificación**: Accuracy, Precision, Recall, F1-Score y matriz de confusión sobre un 20 % de prueba estratificado. El notebook 02 guarda el modelo entrenado en `modelo_afinidad_seia.joblib`.

## Del notebook a la aplicación

El modelo que exporta el notebook 02 es el que usa la aplicación en vivo:

1. El notebook entrena y evalúa el modelo y lo guarda con `joblib.dump(...)` en `modelo_afinidad_seia.joblib`. En esta carpeta ese archivo está en `.gitignore`.
2. La copia versionada que carga la aplicación está en [`seia-ml/modelo/modelo_afinidad_seia.joblib`](../seia-ml/modelo/), con sus métricas en [`metadatos.json`](../seia-ml/modelo/metadatos.json).
3. El microservicio [`seia-ml`](../seia-ml/README.md) la carga una sola vez al iniciar, sin reentrenar, y `seia-services` la usa para calcular la afinidad de cada proceso de SECOP II.

**Para actualizar el modelo:** vuelve a ejecutar el notebook 02, copia el nuevo `.joblib` a `seia-ml/modelo/`, actualiza `metadatos.json` y reinicia `seia-ml`.
