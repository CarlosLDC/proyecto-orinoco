"""
FastAPI Backend Application for Rio Orinoco Hydrometric Forecasting.
Serves historical data, forecast results, model evaluations, and real-time station summaries.
"""

from pathlib import Path
from typing import List, Optional, Dict, Any
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Base directory for datasets
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "datos-crudos"

app = FastAPI(
    title="API Predicción Hidrométrica Río Orinoco",
    description="Endpoints para visualización, benchmarking y pronóstico de cotas hidrométricas del Río Orinoco.",
    version="1.0.0",
)

# Enable CORS for frontend applications (Next.js, React, Vite, Vue, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Station metadata with upstream-downstream hydro dynamics
STATIONS_METADATA = [
    {
        "id": "puerto_ayacucho",
        "name": "Puerto Ayacucho",
        "raw_name": "Puerto Ayacucho",
        "order": 1,
        "description": "Estación aguas arriba de referencia principal en el Alto/Medio Orinoco.",
        "lags_propagacion_dias": [0],
        "alerta_cota": {"normal": 40.0, "alerta": 52.0, "critico": 54.0},
    },
    {
        "id": "caicara",
        "name": "Caicara del Orinoco",
        "raw_name": "Caicara el mini mini",
        "order": 2,
        "description": "Estación de paso medio. Responde con lag físico aprox. de 7 días desde Puerto Ayacucho.",
        "lags_propagacion_dias": [7],
        "alerta_cota": {"normal": 22.0, "alerta": 33.0, "critico": 35.5},
    },
    {
        "id": "ciudad_bolivar",
        "name": "Ciudad Bolívar",
        "raw_name": "Ciudad Bolívar",
        "order": 3,
        "description": "Estación neurálgica del Bajo Orinoco. Responde con lag físico aprox. de 14 días desde Puerto Ayacucho.",
        "lags_propagacion_dias": [14],
        "alerta_cota": {"normal": 4.0, "alerta": 16.5, "critico": 18.0},
    },
    {
        "id": "palua",
        "name": "Palúa",
        "raw_name": "Palúa",
        "order": 4,
        "description": "Estación en confluencia Caroní-Orinoco. Responde con lag físico de 14 a 17 días.",
        "lags_propagacion_dias": [14, 17],
        "alerta_cota": {"normal": 2.0, "alerta": 11.5, "critico": 13.0},
    },
]

STATION_MAP = {s["id"]: s["raw_name"] for s in STATIONS_METADATA}
STATION_REVERSE_MAP = {s["raw_name"]: s["id"] for s in STATIONS_METADATA}


# --- CACHED DATA LOADERS ---
def get_clean_data() -> pd.DataFrame:
    file_path = DATA_DIR / "orinoco_2009_2025_limpio.csv"
    if not file_path.exists():
        raise HTTPException(status_code=500, detail="El archivo orinoco_2009_2025_limpio.csv no existe.")
    df = pd.read_csv(file_path)
    df["Fecha"] = pd.to_datetime(df["Fecha"])
    return df


def get_all_forecasts() -> pd.DataFrame:
    """Consolidates forecasts from ARIMA, Deep Learning, TimesFM, and Baseline Magic."""
    dfs = []
    
    # 1. ARIMA / SARIMAX
    p_arima = DATA_DIR / "forecast_35d_arima.csv"
    if p_arima.exists():
        dfs.append(pd.read_csv(p_arima))
        
    # 2. Deep Learning
    p_dl = DATA_DIR / "forecast_35d_deep_learning.csv"
    if p_dl.exists():
        dfs.append(pd.read_csv(p_dl))
        
    # 3. TimesFM
    p_tfm = DATA_DIR / "forecast_35d_timesfm.csv"
    if p_tfm.exists():
        dfs.append(pd.read_csv(p_tfm))

    # 4. Baseline Magic
    p_magic = DATA_DIR / "baseline_magic_target.csv"
    if p_magic.exists():
        df_m = pd.read_csv(p_magic)
        # Rename baseline columns to match standard naming convention: Station_SimpleML
        rename_dict = {
            "Pred:Puerto Ayacucho": "Puerto Ayacucho_SimpleML",
            "Pred:Caicara el mini mini": "Caicara el mini mini_SimpleML",
            "Pred:Ciudad Bolívar": "Ciudad Bolívar_SimpleML",
            "Pred:Palúa": "Palúa_SimpleML",
        }
        cols_to_keep = ["Fecha"] + [k for k in rename_dict.keys() if k in df_m.columns]
        df_m_clean = df_m[cols_to_keep].rename(columns=rename_dict)
        dfs.append(df_m_clean)

    if not dfs:
        raise HTTPException(status_code=500, detail="No se encontraron archivos de pronóstico.")

    merged = dfs[0]
    for other in dfs[1:]:
        merged = pd.merge(merged, other, on="Fecha", how="outer")
        
    merged["Fecha"] = pd.to_datetime(merged["Fecha"]).dt.strftime("%Y-%m-%d")
    return merged.sort_values("Fecha")


def get_all_metrics() -> pd.DataFrame:
    """Consolidates metrics from all models."""
    dfs = []
    for fname in ["metrics_arima_sarimax.csv", "metrics_deep_learning.csv", "metrics_timesfm.csv"]:
        fpath = DATA_DIR / fname
        if fpath.exists():
            dfs.append(pd.read_csv(fpath))
    if not dfs:
        raise HTTPException(status_code=500, detail="No se encontraron archivos de métricas.")
    return pd.concat(dfs, ignore_index=True)


# --- ROUTE ENDPOINTS ---

@app.get("/")
def read_root():
    return {
        "sistema": "API de Predicción Hidrométrica del Río Orinoco",
        "estado": "activo",
        "docs_url": "/docs",
        "estaciones": [s["name"] for s in STATIONS_METADATA],
        "modelos_disponibles": ["AutoARIMA", "ARIMAX", "LSTM", "Bi-LSTM", "Transformer", "TimesFM", "SimpleML"],
    }


@app.get("/api/stations")
def list_stations():
    """Retorna información y metadatos de las 4 estaciones de monitoreo."""
    return STATIONS_METADATA


@app.get("/api/summary")
def get_dashboard_summary():
    """
    Retorna el resumen ejecutivo para el dashboard principal:
    - Última cota registrada y fecha en cada estación
    - Tendencia inmediata (cambio en 7 días)
    - Mejor modelo histórico en test para cada estación según RMSE
    """
    df_clean = get_clean_data()
    df_metrics = get_all_metrics()
    
    last_row = df_clean.iloc[-1]
    prev_7d_row = df_clean.iloc[-8] if len(df_clean) >= 8 else df_clean.iloc[0]
    
    summary = []
    for station in STATIONS_METADATA:
        raw_name = station["raw_name"]
        curr_val = float(last_row[raw_name])
        prev_val = float(prev_7d_row[raw_name])
        delta_7d = round(curr_val - prev_val, 3)
        trend = "subiendo" if delta_7d > 0.05 else ("bajando" if delta_7d < -0.05 else "estable")
        
        # Best model according to RMSE
        sub_metrics = df_metrics[df_metrics["Estación"] == raw_name]
        best_model_name = "N/A"
        best_rmse = None
        if not sub_metrics.empty:
            best_row = sub_metrics.sort_values("RMSE").iloc[0]
            best_model_name = str(best_row["Modelo"])
            best_rmse = float(best_row["RMSE"])
            
        summary.append({
            "station_id": station["id"],
            "station_name": station["name"],
            "ultima_fecha": last_row["Fecha"].strftime("%Y-%m-%d"),
            "cota_actual_msnm": curr_val,
            "variacion_7d": delta_7d,
            "tendencia": trend,
            "mejor_modelo": best_model_name,
            "mejor_rmse": best_rmse,
            "alerta": "normal" if curr_val < station["alerta_cota"]["alerta"] else (
                "alerta" if curr_val < station["alerta_cota"]["critico"] else "critico"
            )
        })
        
    return {
        "fecha_corte_historico": last_row["Fecha"].strftime("%Y-%m-%d"),
        "total_registros_historicos": len(df_clean),
        "estaciones": summary
    }


@app.get("/api/historical")
def get_historical_data(
    station_id: Optional[str] = Query(None, description="Filtrar por estación (puerto_ayacucho, caicara, ciudad_bolivar, palua)"),
    start_date: Optional[str] = Query(None, description="Fecha de inicio (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Fecha de fin (YYYY-MM-DD)"),
    limit: Optional[int] = Query(None, description="Límite máximo de registros más recientes"),
):
    """
    Retorna la serie temporal limpia de cotas históricas.
    """
    df = get_clean_data()
    
    if start_date:
        df = df[df["Fecha"] >= pd.to_datetime(start_date)]
    if end_date:
        df = df[df["Fecha"] <= pd.to_datetime(end_date)]
    if limit and limit > 0:
        df = df.tail(limit)

    result = []
    for _, row in df.iterrows():
        item: Dict[str, Any] = {"fecha": row["Fecha"].strftime("%Y-%m-%d")}
        if station_id:
            raw_name = STATION_MAP.get(station_id)
            if not raw_name or raw_name not in row:
                raise HTTPException(status_code=400, detail=f"Estación inválida '{station_id}'.")
            item[station_id] = float(row[raw_name])
        else:
            for s_id, r_name in STATION_MAP.items():
                item[s_id] = float(row[r_name])
        result.append(item)

    return {
        "count": len(result),
        "data": result
    }


@app.get("/api/forecasts")
def get_forecasts(
    station_id: Optional[str] = Query(None, description="ID de la estación (ej. ciudad_bolivar)"),
    model_name: Optional[str] = Query(None, description="Filtrar por modelo (ej. LSTM, ARIMAX, Transformer, etc.)")
):
    """
    Retorna el pronóstico del horizonte de 35 días a ciegas (2025-02-25 a 2025-03-31)
    consolidando todos los modelos entrenados.
    """
    df_fc = get_all_forecasts()
    records = []

    for _, row in df_fc.iterrows():
        fecha = str(row["Fecha"])
        entry: Dict[str, Any] = {"fecha": fecha, "predicciones": {}}
        
        for col in df_fc.columns:
            if col == "Fecha":
                continue
            
            # Format is typically "StationRawName_ModelName"
            # Parse station and model
            for s in STATIONS_METADATA:
                prefix = s["raw_name"] + "_"
                if col.startswith(prefix):
                    st_id = s["id"]
                    m_name = col[len(prefix):]
                    
                    if station_id and station_id != st_id:
                        continue
                    if model_name and model_name.lower() != m_name.lower():
                        continue
                        
                    if st_id not in entry["predicciones"]:
                        entry["predicciones"][st_id] = {}
                    val = row[col]
                    entry["predicciones"][st_id][m_name] = None if pd.isna(val) else float(val)
                    break
                    
        records.append(entry)

    return {
        "horizonte_dias": len(records),
        "fecha_inicio": records[0]["fecha"] if records else None,
        "fecha_fin": records[-1]["fecha"] if records else None,
        "data": records
    }


@app.get("/api/metrics")
def get_metrics_table(
    station_id: Optional[str] = Query(None, description="Filtrar métricas por estación"),
    model_name: Optional[str] = Query(None, description="Filtrar por modelo")
):
    """
    Retorna la tabla comparativa de métricas en el conjunto de prueba (Test Set):
    MAE, RMSE, MAPE y R2 para todos los modelos evaluados.
    """
    df_metrics = get_all_metrics()
    
    if station_id:
        raw_name = STATION_MAP.get(station_id)
        if not raw_name:
            raise HTTPException(status_code=400, detail="Estación desconocida.")
        df_metrics = df_metrics[df_metrics["Estación"] == raw_name]

    if model_name:
        df_metrics = df_metrics[df_metrics["Modelo"].str.lower() == model_name.lower()]

    results = []
    for _, row in df_metrics.iterrows():
        st_raw = row["Estación"]
        st_id = STATION_REVERSE_MAP.get(st_raw, st_raw)
        results.append({
            "station_id": st_id,
            "station_name": st_raw,
            "modelo": row["Modelo"],
            "mae": round(float(row["MAE"]), 4),
            "rmse": round(float(row["RMSE"]), 4),
            "mape": round(float(row["MAPE"]), 4),
            "r2": round(float(row["R2"]), 4),
        })

    return {
        "count": len(results),
        "metrics": results
    }


@app.get("/api/compare-series")
def get_combined_comparison(
    station_id: str = Query(..., description="Estación obligatoria para graficar (ej. ciudad_bolivar)"),
    history_days: int = Query(60, description="Días previos de historia real antes de la predicción")
):
    """
    Endpoint especializado para gráficos de frontend (Chart.js / Recharts / Plotly):
    Devuelve los últimos N días de historia real concatenados con el horizonte de 35 días
    para todos los modelos y el baseline.
    """
    raw_name = STATION_MAP.get(station_id)
    if not raw_name:
        raise HTTPException(status_code=400, detail="Estación desconocida.")

    # 1. Historical tail
    df_clean = get_clean_data()
    tail_hist = df_clean.tail(history_days)
    
    timeline = []
    for _, r in tail_hist.iterrows():
        f_str = r["Fecha"].strftime("%Y-%m-%d")
        timeline.append({
            "fecha": f_str,
            "real": float(r[raw_name]),
            "es_prediccion": False,
        })
        
    # 2. Forecasts
    df_fc = get_all_forecasts()
    model_cols = [c for c in df_fc.columns if c.startswith(f"{raw_name}_")]
    
    for _, r in df_fc.iterrows():
        f_str = str(r["Fecha"])
        point = {
            "fecha": f_str,
            "real": None,
            "es_prediccion": True,
        }
        for col in model_cols:
            m_name = col.replace(f"{raw_name}_", "")
            val = r[col]
            point[m_name] = None if pd.isna(val) else float(val)
        timeline.append(point)

    return {
        "station_id": station_id,
        "station_name": raw_name,
        "timeline": timeline
    }
