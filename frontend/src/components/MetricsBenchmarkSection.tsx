"use client";

import React, { useState, useMemo } from "react";
import { MetricItem, MODEL_COLORS, StationMetadata } from "@/lib/api";

interface MetricsBenchmarkSectionProps {
  metrics: MetricItem[];
  stations: StationMetadata[];
  selectedStation: string;
}

export default function MetricsBenchmarkSection({
  metrics,
  stations,
  selectedStation,
}: MetricsBenchmarkSectionProps) {
  const [showAll, setShowAll] = useState(false);

  const stationObj = stations.find((s) => s.id === selectedStation);

  const rows = useMemo(() => {
    const filtered = showAll
      ? metrics
      : metrics.filter((m) => m.station_id === selectedStation);
    return [...filtered].sort((a, b) => a.rmse - b.rmse);
  }, [metrics, selectedStation, showAll]);

  return (
    <div className="rounded-xl border border-slate-200/70 bg-white p-5 dark:border-slate-800/80 dark:bg-slate-900/40">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Métricas en Test Set — {showAll ? "Todas las estaciones" : stationObj?.name}
          </h2>
          <p className="text-xs text-slate-400">
            Ordenado de menor a mayor error (RMSE)
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAll((prev) => !prev)}
          className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:text-white"
        >
          {showAll ? "Ver estación actual" : "Ver todas"}
        </button>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-100 text-slate-400 dark:border-slate-800">
            <tr>
              {showAll && <th className="pb-2.5 font-medium">Estación</th>}
              <th className="pb-2.5 font-medium">Modelo</th>
              <th className="pb-2.5 text-right font-medium">RMSE (m)</th>
              <th className="pb-2.5 text-right font-medium">MAE (m)</th>
              <th className="pb-2.5 text-right font-medium">MAPE (%)</th>
              <th className="pb-2.5 text-right font-medium">R²</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {rows.map((row, idx) => {
              const isBest = !showAll && idx === 0;
              return (
                <tr
                  key={`${row.station_id}-${row.modelo}`}
                  className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30"
                >
                  {showAll && (
                    <td className="py-3 text-slate-500 dark:text-slate-400">
                      {row.station_name === "Caicara el mini mini"
                        ? "Caicara"
                        : row.station_name}
                    </td>
                  )}
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{
                          backgroundColor:
                            MODEL_COLORS[row.modelo] || "#94a3b8",
                        }}
                      />
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {row.modelo}
                      </span>
                      {isBest && (
                        <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-500">
                          Mejor
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 text-right font-mono font-semibold text-slate-900 dark:text-white">
                    {row.rmse.toFixed(3)}
                  </td>
                  <td className="py-3 text-right font-mono text-slate-500 dark:text-slate-400">
                    {row.mae.toFixed(3)}
                  </td>
                  <td className="py-3 text-right font-mono text-slate-500 dark:text-slate-400">
                    {row.mape.toFixed(2)}%
                  </td>
                  <td className="py-3 text-right font-mono text-slate-500 dark:text-slate-400">
                    {row.r2.toFixed(3)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
