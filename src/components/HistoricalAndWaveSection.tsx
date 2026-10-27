"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import {
  api,
  HistoricalRecord,
  WavePropagationResponse,
} from "@/lib/api";

const STATION_COLORS: Record<string, string> = {
  puerto_ayacucho: "#38bdf8",
  caicara: "#a855f7",
  ciudad_bolivar: "#10b981",
  palua: "#f59e0b",
};

const STATION_LABELS: Record<string, string> = {
  puerto_ayacucho: "Puerto Ayacucho",
  caicara: "Caicara",
  ciudad_bolivar: "Ciudad Bolívar",
  palua: "Palúa",
};

export default function HistoricalAndWaveSection() {
  const [mode, setMode] = useState<"wave" | "historical">("wave");

  // Wave propagation state
  const [waveData, setWaveData] = useState<WavePropagationResponse | null>(
    null
  );
  const [selectedPairId, setSelectedPairId] = useState<string>(
    "puerto_ayacucho__ciudad_bolivar"
  );

  // Historical state
  const [histLimit, setHistLimit] = useState<number>(365);
  const [histRecords, setHistRecords] = useState<HistoricalRecord[]>([]);

  useEffect(() => {
    api
      .getWavePropagation(30)
      .then(setWaveData)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (mode !== "historical") return;
    api
      .getHistorical(histLimit)
      .then((res) => {
        const raw = res.data;
        if (raw.length > 1000) {
          const step = Math.ceil(raw.length / 800);
          setHistRecords(raw.filter((_, i) => i % step === 0));
        } else {
          setHistRecords(raw);
        }
      })
      .catch(() => {});
  }, [mode, histLimit]);

  const currentPair = useMemo(() => {
    if (!waveData) return null;
    return (
      waveData.pairs.find((p) => p.pair_id === selectedPairId) ??
      waveData.pairs[0]
    );
  }, [waveData, selectedPairId]);

  return (
    <div className="rounded-xl border border-slate-200/70 bg-white p-5 dark:border-slate-800/80 dark:bg-slate-900/40">
      {/* Header & Mode Switch */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            {mode === "wave"
              ? "Propagación de Onda (Correlación Cruzada)"
              : "Serie Histórica Limpia (2009–2025)"}
          </h2>
          <p className="text-xs text-slate-400">
            {mode === "wave"
              ? `Pico empírico Δy: ${currentPair?.peak_lag_diferencia ?? "--"} días (Lag nominal: ~${currentPair?.expected_physical_lag ?? "--"}d)`
              : "Cotas diarias reconstruidas en m s.n.m."}
          </p>
        </div>

        <div className="flex items-center rounded-lg border border-slate-200 p-0.5 text-xs dark:border-slate-800">
          <button
            type="button"
            onClick={() => setMode("wave")}
            className={`rounded-md px-3 py-1 font-medium transition-colors ${
              mode === "wave"
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            Lags (7, 14, 17d)
          </button>
          <button
            type="button"
            onClick={() => setMode("historical")}
            className={`rounded-md px-3 py-1 font-medium transition-colors ${
              mode === "historical"
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            Historia
          </button>
        </div>
      </div>

      {/* Sub-filters */}
      {mode === "wave" ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {waveData?.pairs.map((pair) => (
            <button
              key={pair.pair_id}
              type="button"
              onClick={() => setSelectedPairId(pair.pair_id)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedPairId === pair.pair_id
                  ? "bg-sky-500/15 text-sky-500"
                  : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              {pair.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-3 text-xs">
            {Object.entries(STATION_LABELS).map(([id, label]) => (
              <span key={id} className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-300">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: STATION_COLORS[id] }}
                />
                {label}
              </span>
            ))}
          </div>

          <div className="flex gap-1 text-xs">
            {[
              { label: "1A", val: 365 },
              { label: "3A", val: 1095 },
              { label: "Todo", val: 5899 },
            ].map((opt) => (
              <button
                key={opt.val}
                type="button"
                onClick={() => setHistLimit(opt.val)}
                className={`rounded px-2 py-0.5 font-medium ${
                  histLimit === opt.val
                    ? "bg-sky-500/15 text-sky-500"
                    : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Single Clean Chart */}
      <div className="mt-4 h-[360px] w-full">
        {mode === "wave" && currentPair ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={currentPair.series}
              margin={{ top: 10, right: 16, left: 0, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#334155"
                opacity={0.18}
                vertical={false}
              />
              <XAxis
                dataKey="lag"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickFormatter={(v) => `${v}d`}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 1]}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                width={40}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.92)",
                  borderColor: "rgba(51, 65, 85, 0.6)",
                  borderRadius: "8px",
                  color: "#f8fafc",
                  fontSize: "12px",
                }}
                labelFormatter={(l) => `Lag: ${l} días`}
              />
              {[7, 14, 17].map((refLag) => (
                <ReferenceLine
                  key={refLag}
                  x={refLag}
                  stroke="#f59e0b"
                  strokeDasharray="3 3"
                  strokeOpacity={0.5}
                />
              ))}
              <ReferenceLine
                x={currentPair.peak_lag_diferencia}
                stroke="#10b981"
                strokeDasharray="4 4"
              />
              <Line
                type="monotone"
                dataKey="corr_diferencia"
                name="Corr (Δ diaria)"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 2.5 }}
              />
              <Line
                type="monotone"
                dataKey="corr_nivel"
                name="Corr (Nivel)"
                stroke="#38bdf8"
                strokeWidth={1.8}
                strokeDasharray="4 4"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={histRecords}
              margin={{ top: 10, right: 16, left: 0, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#334155"
                opacity={0.18}
                vertical={false}
              />
              <XAxis
                dataKey="fecha"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                minTickGap={45}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickFormatter={(v) => `${v}m`}
                width={44}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.92)",
                  borderColor: "rgba(51, 65, 85, 0.6)",
                  borderRadius: "8px",
                  color: "#f8fafc",
                  fontSize: "12px",
                }}
              />
              {Object.keys(STATION_LABELS).map((stId) => (
                <Line
                  key={stId}
                  type="monotone"
                  dataKey={stId}
                  name={STATION_LABELS[stId]}
                  stroke={STATION_COLORS[stId]}
                  strokeWidth={1.8}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
