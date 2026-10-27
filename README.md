# Proyecto Orinoco - Monorepo

Monorepo integral para el pronóstico y análisis de cotas hidrométricas del Río Orinoco en 4 estaciones clave:
1. **Puerto Ayacucho** (Alto Orinoco)
2. **Caicara del Orinoco** (Medio Orinoco)
3. **Ciudad Bolívar** (Bajo Orinoco)
4. **Palúa** (Confluencia Caroní-Orinoco)

Este repositorio unifica:
* **Backend y ML Pipelines (`src/`):** Modelado predictivo (AutoARIMA, ARIMAX, LSTM, Bi-LSTM, Transformer, TimesFM) y API REST con FastAPI.
* **Frontend (`frontend/`):** Dashboard web interactivo desarrollado con Next.js 15, React, Tailwind CSS y Recharts.

---

## 🚀 Requisitos y Configuración

### 1. Backend (Python 3.10+)
Crear y activar el entorno virtual e instalar dependencias:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Frontend (Node.js 18+)
Instalar dependencias y levantar el servidor web:

```bash
cd frontend
npm install
npm run dev
```
Acceder a la aplicación en `http://localhost:3000`.

---

## 📊 Pipeline de Ciencia de Datos y Machine Learning

Los módulos en `src/` implementan las fases especificadas en `AGENTS.md`:

1. **Limpieza y Reconstrucción:**
   ```bash
   python src/data_cleaner.py
   ```
   Reconstruye la serie temporal 2009–2025 limpia desde las matrices del Excel, corrigiendo desfases y anomalías en `datos-crudos/orinoco_2009_2025_limpio.csv`.

2. **Análisis de Correlación Cruzada (EDA):**
   ```bash
   python src/eda_correlations.py
   ```
   Demuestra empíricamente la propagación de onda hidrodinámica (lags de 7, 14 y 17 días).

3. **Ingeniería de Características y Partición Temporal:**
   ```bash
   python src/feature_engineering.py
   ```
   Genera codificación cíclica (`sin_doy`, `cos_doy`), rezagos autorregresivos y espaciales, y crea las particiones de entrenamiento, validación y prueba sin fuga de datos.

4. **Modelos Estadísticos (AutoARIMA y ARIMAX):**
   ```bash
   python src/models_arima.py
   ```

5. **Modelos de Deep Learning (LSTM, Bi-LSTM, Transformer):**
   ```bash
   python src/train_deep_learning.py
   ```

6. **Modelo Fundacional Zero-Shot (Google TimesFM):**
   ```bash
   python src/models_timesfm.py
   ```

7. **Consolidación y Métricas Globales:**
   ```bash
   python src/evaluate_and_visualize.py
   ```
   Genera tablas comparativas y gráficos finales en `notebooks/evaluation_results/`.

---

## 🌐 API REST (FastAPI)

### Levantar el servidor de desarrollo:
```bash
uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000
```

Documentación interactiva disponible en:
* Swagger UI: `http://localhost:8000/docs`
* Redoc: `http://localhost:8000/redoc`

### Endpoints principales:
* `GET /api/stations`: Metadatos de las 4 estaciones.
* `GET /api/summary`: Resumen ejecutivo de niveles actuales, tendencias y mejor modelo.
* `GET /api/historical`: Serie histórica limpia con filtros de fecha y estación.
* `GET /api/forecasts`: Proyecciones del horizonte de 35 días a ciegas para todos los modelos.
* `GET /api/metrics`: Tabla comparativa en test (MAE, RMSE, MAPE, R2).
* `GET /api/compare-series`: Serie combinada histórica + predicciones para visualización en frontend.
* `GET /api/wave-propagation`: Perfiles de correlación cruzada y rezagos físicos.

---

## 🧪 Pruebas Unitarias
Ejecutar la suite de pruebas:
```bash
pytest
```
