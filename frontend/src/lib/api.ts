export interface StationMetadata {
  id: string;
  name: string;
  raw_name: string;
  order: number;
  description: string;
  lags_propagacion_dias: number[];
  alerta_cota: {
    normal: number;
    alerta: number;
    critico: number;
  };
}

export interface StationSummary {
  station_id: string;
  station_name: string;
  ultima_fecha: string;
  cota_actual_msnm: number;
  variacion_7d: number;
  tendencia: "subiendo" | "bajando" | "estable";
  mejor_modelo: string;
  mejor_rmse: number | null;
  alerta: "normal" | "alerta" | "critico";
}

export interface DashboardSummaryResponse {
  fecha_corte_historico: string;
  total_registros_historicos: number;
  estaciones: StationSummary[];
}

export interface MetricItem {
  station_id: string;
  station_name: string;
  modelo: string;
  mae: number;
  rmse: number;
  mape: number;
  r2: number;
}

export interface CompareSeriesPoint {
  fecha: string;
  real: number | null;
  es_prediccion: boolean;
  es_test?: boolean;
  AutoARIMA?: number | null;
  ARIMAX?: number | null;
  LSTM?: number | null;
  "Bi-LSTM"?: number | null;
  Transformer?: number | null;
  TimesFM?: number | null;
  SimpleML?: number | null;
  [key: string]: string | number | boolean | null | undefined;
}

export interface CompareSeriesResponse {
  station_id: string;
  station_name: string;
  timeline: CompareSeriesPoint[];
}

export interface HistoricalRecord {
  fecha: string;
  puerto_ayacucho?: number;
  caicara?: number;
  ciudad_bolivar?: number;
  palua?: number;
  [key: string]: string | number | undefined;
}

export interface WavePairCorrelation {
  pair_id: string;
  upstream_id: string;
  downstream_id: string;
  label: string;
  expected_physical_lag: number;
  peak_lag_nivel: number;
  peak_corr_nivel: number;
  peak_lag_diferencia: number;
  peak_corr_diferencia: number;
  series: {
    lag: number;
    corr_nivel: number;
    corr_diferencia: number;
  }[];
}

export interface WavePropagationResponse {
  max_lag: number;
  reference_lags: number[];
  pairs: WavePairCorrelation[];
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "/backend-api";

async function fetchJson<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Error HTTP ${res.status} al consultar ${endpoint}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getStations: () => fetchJson<StationMetadata[]>("/api/stations"),
  getSummary: () => fetchJson<DashboardSummaryResponse>("/api/summary"),
  getMetrics: (stationId?: string) =>
    fetchJson<{ count: number; metrics: MetricItem[] }>(
      `/api/metrics${stationId ? `?station_id=${stationId}` : ""}`
    ),
  getCompareSeries: (stationId: string, historyDays = 86) =>
    fetchJson<CompareSeriesResponse>(
      `/api/compare-series?station_id=${stationId}&history_days=${historyDays}`
    ),
  getHistorical: (limit = 730, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (limit) params.set("limit", String(limit));
    if (startDate) params.set("start_date", startDate);
    if (endDate) params.set("end_date", endDate);
    return fetchJson<{ count: number; data: HistoricalRecord[] }>(
      `/api/historical?${params.toString()}`
    );
  },
  getWavePropagation: (maxLag = 30) =>
    fetchJson<WavePropagationResponse>(
      `/api/wave-propagation?max_lag=${maxLag}`
    ),
};

export const MODEL_COLORS: Record<string, string> = {
  real: "#38bdf8", // sky-400 (Serie Real)
  LSTM: "#10b981", // emerald-500
  "Bi-LSTM": "#a855f7", // purple-500
  Transformer: "#f59e0b", // amber-500
  ARIMAX: "#ec4899", // pink-500
  AutoARIMA: "#64748b", // slate-500
  TimesFM: "#3b82f6", // blue-500
  SimpleML: "#ef4444", // red-500 (Baseline Magic)
};

export const MODEL_FAMILIES: Record<string, string> = {
  LSTM: "Deep Learning (PyTorch)",
  "Bi-LSTM": "Deep Learning (PyTorch)",
  Transformer: "Deep Learning (PyTorch)",
  ARIMAX: "Estadístico Exógeno",
  AutoARIMA: "Estadístico Univariado",
  TimesFM: "Modelo Fundacional (Google)",
  SimpleML: "Baseline Excel (Magic)",
};
