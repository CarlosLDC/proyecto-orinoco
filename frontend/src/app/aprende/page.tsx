"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Waves, Sun, Moon, ArrowLeft } from "lucide-react";
import { api, StationMetadata, MetricItem } from "@/lib/api";
import DidacticGuideSection from "@/components/DidacticGuideSection";

export default function AprendePage() {
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [stations, setStations] = useState<StationMetadata[]>([]);
  const [metrics, setMetrics] = useState<MetricItem[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>("ciudad_bolivar");

  useEffect(() => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
  }, [darkMode]);

  useEffect(() => {
    Promise.all([api.getStations(), api.getMetrics()])
      .then(([stRes, metRes]) => {
        setStations(stRes);
        setMetrics(metRes.metrics);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200/60 bg-white/80 backdrop-blur dark:border-slate-800/60 dark:bg-[#060c18]/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver al Dashboard
            </Link>
            <div className="flex items-center gap-2">
              <Waves className="h-5 w-5 text-sky-500" />
              <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
                Río Orinoco • Aula Didáctica de ML
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setDarkMode((prev) => !prev)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900"
            title="Cambiar tema"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <DidacticGuideSection
          stations={stations}
          metrics={metrics}
          selectedStation={selectedStation}
          onSelectStation={setSelectedStation}
          onNavigateTab={() => {
            window.location.href = "/";
          }}
        />
      </main>
    </div>
  );
}
