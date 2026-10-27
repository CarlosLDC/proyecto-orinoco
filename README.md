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

## ⚡ Inicio Rápido (Multiplataforma por Defecto)

Gracias a la automatización del monorepo, **los mismos comandos funcionan idénticamente en Windows, Linux y macOS**:

### 1. Descargar e instalar todo
Prepara el entorno virtual de Python (`.venv`), instala las dependencias de `requirements.txt` e instala los paquetes de Node.js en `frontend/`:

```bash
npm run setup
```

### 2. Levantar ambos servidores en paralelo
Inicia simultáneamente **FastAPI** en `http://localhost:8000` (documentación en `/docs`) y **Next.js** en `http://localhost:3000`:

```bash
npm run dev
```

> [!TIP]
> **Detención limpia:** Al presionar `Ctrl + C`, se detienen de forma ordenada tanto el frontend como el backend (liberando automáticamente los puertos en Windows, Linux y macOS).

---

## 🛠️ Comandos Disponibles

Todos se ejecutan desde la raíz del proyecto y funcionan en cualquier sistema operativo:

| Comando | Acción |
|---|---|
| `npm run setup` | Instala todas las dependencias del Backend (Python) y Frontend (Node.js) |
| `npm run dev` | Inicia Backend (`:8000`) y Frontend (`:3000`) en simultáneo con recarga en vivo |
| `npm run backend` | Inicia únicamente el servidor FastAPI |
| `npm run frontend` | Inicia únicamente la aplicación Next.js |
| `npm run test` | Ejecuta las pruebas unitarias del backend con `pytest` |

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
