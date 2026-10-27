"use client";

import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { StationMetadata, StationSummary } from "@/lib/api";

interface StationCardsProps {
  stations: StationMetadata[];
  summaries: StationSummary[];
  selectedStation: string;
  onSelectStation: (stationId: string) => void;
}

export default function StationCards({
  stations,
  summaries,
  selectedStation,
  onSelectStation,
}: StationCardsProps) {
  const summaryMap = new Map(summaries.map((s) => [s.station_id, s]));

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stations.map((station) => {
        const sum = summaryMap.get(station.id);
        const isSelected = selectedStation === station.id;

        return (
          <button
            key={station.id}
            type="button"
            onClick={() => onSelectStation(station.id)}
            className={`group flex flex-col justify-between rounded-xl border p-4 text-left transition-all ${
              isSelected
                ? "border-sky-500 bg-sky-500/5 dark:border-sky-400 dark:bg-sky-500/10"
                : "border-slate-200/70 bg-white hover:border-slate-300 dark:border-slate-800/80 dark:bg-slate-900/40 dark:hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                0{station.order} •{" "}
                {station.lags_propagacion_dias[0] === 0
                  ? "Origen"
                  : `Lag +${station.lags_propagacion_dias.join("-")}d`}
              </span>
              <span
                className={`h-2 w-2 rounded-full ${
                  isSelected
                    ? "bg-sky-500"
                    : "bg-slate-200 dark:bg-slate-800"
                }`}
              />
            </div>

            <div className="mt-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                {station.name}
              </h3>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {sum ? sum.cota_actual_msnm.toFixed(2) : "--"}
                </span>
                <span className="text-xs text-slate-400">m</span>
              </div>

              {sum && (
                <span
                  className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                    sum.variacion_7d > 0.05
                      ? "text-amber-500"
                      : sum.variacion_7d < -0.05
                      ? "text-sky-500"
                      : "text-slate-400"
                  }`}
                >
                  {sum.variacion_7d > 0.05 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : sum.variacion_7d < -0.05 ? (
                    <TrendingDown className="h-3 w-3" />
                  ) : (
                    <Minus className="h-3 w-3" />
                  )}
                  {sum.variacion_7d > 0 ? "+" : ""}
                  {sum.variacion_7d.toFixed(2)}m
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
