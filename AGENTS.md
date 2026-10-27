# Especificación Técnica: Predicción Hidrométrica del Río Orinoco

## 1. Contexto y Objetivo del Proyecto
Desarrollar, entrenar y comparar modelos de predicción de series temporales (Time Series Forecasting) para estimar el nivel diario (cota en m s. n. m.) del Río Orinoco en 4 estaciones hidrométricas sucesivas (de aguas arriba hacia aguas abajo):
1. **Puerto Ayacucho** (`Puerto Ayacucho`)
2. **Caicara del Orinoco** (`Caicara el mini mini`)
3. **Ciudad Bolívar** (`Ciudad Bolívar`)
4. **Palúa** (`Palúa`)

### Dinámica Física Clave (Propagación de Onda)
Existe un desfase temporal físico (retardo o *lag*) entre el aumento del caudal en Puerto Ayacucho y su impacto aguas abajo en Caicara, Ciudad Bolívar y Palúa. Se deben evaluar rezagos de **7, 14 y 17 días** como variables predictoras.

---

## 2. Descripción y Auditoría del Dataset (`DATOS RIO ORINOCO.xlsx`)
El archivo Excel contiene 5 hojas:
- **Hojas matrices históricas (Día x Año):** `Puerto Ayacucho` (1963–2025), `Caicara` (1968–2025), `Ciudad Bolivar` (1935–2025), `Palua` (1943–2025). Tienen 366 filas (el índice 59 corresponde al 29 de febrero).
- **Hoja `Entrenar`:** Serie diaria (5.934 filas) desde `2009-01-01` hasta `2025-03-31`.
  - **Datos reales:** `2009-01-01` hasta `2025-02-24` (5.899 días).
  - **Horizonte de predicción objetivo (Target ciego):** `2025-02-25` hasta `2025-03-31` (35 días exactamente).
  - **Baseline precalculado (`df_baseline_magic`):** Las columnas `Pred:Puerto Ayacucho`, `Pred:Caicara el mini mini`, `Pred:Ciudad Bolívar` y `Pred:Palúa` (junto con sus descomposiciones `trend`, `seasonality_weekly`, `seasonality_yearly`, `holiday`, `postprocess`) contienen las predicciones de los 35 días generadas con *Simple ML for Sheets* ("Forecast with Magic").
  - **Columnas basura a ignorar:** `Unnamed: 5` a `Unnamed: 15` (incluyendo el string `"MANDARINA"` en la fila 16).

### Anomalías Detectadas en el Dataset (Corrección Obligatoria en Módulo 1)
1. **Desfase de 638 días en `Ciudad Bolívar` (2020–2021) en la hoja `Entrenar`:** Al armar la hoja `Entrenar`, se omitió el valor del `2020-01-01` (`7.34`) de la hoja matriz `Ciudad Bolivar`, corriendo toda la serie un día hacia atrás durante 2020 y 2021 y duplicando el valor `7.14` el `2021-12-31`.
2. **Error de copiado en `Caicara el mini mini`:** El día `2019-12-29` en `Entrenar` tiene `25.83`, mientras que en la hoja matriz `Caicara` el valor real es `25.91`.
3. **Valores nulos en días bisiestos (`Palúa`):** Existen exactamente 3 valores `NaN` en el bloque 2009–2025, todos en `Palúa` y correspondientes al 29 de febrero de años bisiestos: `2012-02-29`, `2016-02-29` y `2020-02-29`.
4. **Outliers por error de transcripción (Spikes de 1 día / bloques):**
   - **Palúa (`2021-10-29`):** Salto irreal `8.73` -> **`9.79`** -> `8.86` (error de tipeo por `8.79`).
   - **Ciudad Bolívar (`2019-01-01` al `2019-01-10`):** Escalón artificial donde la cota salta de `5.60` (`2018-12-31`) a `6.60` (`2019-01-01`) y luego cae abruptamente de `5.445` (`2019-01-10`) a `4.90` (`2019-01-11`), mientras las demás estaciones bajaban de forma monótona.
5. **Hueco 2007–2008 y Bloque Histórico Adicional (1974–2006):** `Puerto Ayacucho` no tiene registros en 2007 ni en casi todo 2008. Sin embargo, entre `1974-01-01` y `2006-12-31` (33 años, ~12.053 días) las 4 estaciones están completas en sus hojas matrices (salvo 5 nulos en `Palua` en dic-1993 y espacios `' '` en años bisiestos no aplicables). Este bloque puede extraerse opcionalmente para preentrenar redes profundas.

---

## 3. Regla Crítica: Prevención de Fuga de Datos (Data Leakage)
1. **Prohibido el Shuffle:** Bajo ninguna circunstancia usar `train_test_split(..., shuffle=True)`.
2. **Partición Temporal Estricta (Time-Based Split sobre el bloque continuo 2009–2025):**
   - **Train Set (Entrenamiento):** `2009-01-01` a `2023-12-31`
   - **Validation Set (Ajuste de Hiperparámetros):** `2024-01-01` a `2024-11-30`
   - **Test Set (Evaluación Final de Métricas):** `2024-12-01` a `2025-02-24` (86 días; evaluar particularmente ventanas de 35 días equivalentes al horizonte final).
   - **Forecast Horizon (Inferencia a ciegas):** `2025-02-25` a `2025-03-31` (35 días).
3. **Escalado sin Fuga:** Cualquier `StandardScaler` o `MinMaxScaler` debe hacer `.fit()` **exclusivamente sobre el Train Set** y aplicar `.transform()` sobre Validation, Test y Forecast.
4. **Cálculo de Lags sin Fuga:** En inferencia multi-paso (35 días), ningún modelo puede usar valores reales futuros de $t+k$ que aún no hayan ocurrido; los rezagos menores a 35 días deben alimentarse recursivamente con las propias predicciones o mediante estrategias directas/multi-output.

---

## 4. Plan de Ejecución por Módulos (Instrucciones para el Agente)

### Módulo 1: Reconstrucción, Limpieza, Imputación y EDA
1. **Reconstrucción limpia (2009–2025):** En lugar de leer las columnas con desfase de `Entrenar`, reconstruir la serie diaria `2009-01-01` a `2025-02-24` directamente desde las 4 hojas matrices (`Puerto Ayacucho`, `Caicara`, `Ciudad Bolivar`, `Palua`), eliminando la fila de índice `59` (29 de febrero) en los años no bisiestos. Verificar que esto corrige las 638 filas de `Ciudad Bolívar` (2020–2021) y el dato de `Caicara` (`2019-12-29`).
2. **Extracción del Baseline:** Guardar en un DataFrame separado (`df_baseline_magic`) las últimas 35 filas (`2025-02-25` a `2025-03-31`) de las columnas `Pred:*` de la hoja `Entrenar`.
3. **Corrección de Outliers e Imputación:**
   - Reemplazar en `Palúa` el valor del `2021-10-29` (`9.79`) por `NaN` e interpolar linealmente (`8.795`).
   - Reemplazar en `Ciudad Bolívar` el bloque anómalo `2019-01-01` a `2019-01-10` por `NaN` e interpolar linealmente entre el `2018-12-31` (`5.60`) y el `2019-01-11` (`4.90`).
   - Imputar los 3 valores `NaN` de días bisiestos en `Palúa` (`2012-02-29`, `2016-02-29`, `2020-02-29`) usando interpolación lineal (`method='linear'`).
   - Guardar el dataset limpio resultante en `datos-crudos/orinoco_2009_2025_limpio.csv` (sin modificar el archivo Excel original).
4. **Análisis de Retardos (Cross-Correlation):** Calcular y graficar la correlación cruzada entre las estaciones (tanto en niveles como en primeras diferencias $\Delta y_t$) para demostrar empíricamente los lags de **7, 14 y 17 días** entre aguas arriba y aguas abajo.

### Módulo 2: Ingeniería de Características (Feature Engineering)
- Crear codificación cíclica anual a partir de `Fecha`:
  - `sin_doy = np.sin(2 * np.pi * day_of_year / 365.25)`
  - `cos_doy = np.cos(2 * np.pi * day_of_year / 365.25)`
- Crear rezagos (*lags*) temporales y espaciales:
  - Lags autorregresivos propios de cada estación: $t-1, t-2, t-7, t-14$.
  - Lags de propagación aguas arriba: incluir las cotas de `Puerto Ayacucho` y `Caicara` en $t-7$, $t-14$ y $t-17$ como variables exógenas para predecir `Caicara`, `Ciudad Bolívar` y `Palúa`.
- Generar los conjuntos `train`, `val` y `test` respetando los cortes de fecha de la Sección 3.

### Módulo 3: Modelos Estadísticos (AutoARIMA / SARIMAX)
- Implementar **AutoARIMA** (`pmdarima` o `statsforecast`) para las 4 estaciones:
  1. Versión univariada pura.
  2. Versión **ARIMAX** incorporando variables exógenas (codificación cíclica anual + lags de estaciones aguas arriba en $t-7$, $t-14$, $t-17$).
- Evaluar métricas en `test` y generar la proyección de 35 días (`2025-02-25` a `2025-03-31`).

### Módulo 4: Modelos de Deep Learning (LSTM, Bi-LSTM y Transformer)
- Construir generadores de ventanas deslizantes (*Sliding Windows*) multivariadas (ej. ventana de entrada $L \in \{14, 30, 60\}$ días para predecir horizonte $H = 35$ días de forma directa Multi-Output o recursiva).
- Entrenar y ajustar hiperparámetros (usando `val` con Early Stopping) para tres arquitecturas en PyTorch:
  1. **LSTM** (Long Short-Term Memory).
  2. **Bi-LSTM (`B-T`)** (Bidirectional LSTM en el encoder de contexto histórico).
  3. **Transformer** (Time Series Transformer / atención multi-cabezal sobre parches o pasos temporales).
- Evaluar en `test` y predecir los 35 días futuros.

### Módulo 5: Modelo Fundacional (Google TimesFM)
- Implementar un pipeline de inferencia con **Google TimesFM** (`timesfm`).
- Ejecutar predicción **Zero-Shot** (y opcionalmente con covariables / regresores exógenos de las estaciones aguas arriba) pasando contextos de 256 a 512 días para predecir el horizonte de `35` días.
- Evaluar desempeño en `test` y exportar la predicción del bloque `2025-02-25` a `2025-03-31`.

### Módulo 6: Evaluación Comparativa y Visualización Final
- Construir una tabla comparativa global en `test` con las métricas **MAE**, **RMSE**, **MAPE** y **$R^2$** para cada estación y cada modelo (AutoARIMA, ARIMAX, LSTM, Bi-LSTM, Transformer, TimesFM).
- Graficar para las 4 estaciones el tramo final de `test` y el horizonte de predicción (`2025-02-25` al `2025-03-31`), superponiendo las curvas de todos los modelos junto con el baseline `Simple-ML (Magic)` extraído del Excel original.
