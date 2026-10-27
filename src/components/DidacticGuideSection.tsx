"use client";

import React, { useState } from "react";
import { ArrowRight } from "lucide-react";
import { MODEL_COLORS, StationMetadata, MetricItem } from "@/lib/api";

interface DidacticGuideSectionProps {
  stations: StationMetadata[];
  metrics: MetricItem[];
  selectedStation: string;
  onSelectStation: (stationId: string) => void;
  onNavigateTab: (tab: "forecast" | "metrics" | "wave") => void;
}

type StepId =
  | "uso"
  | "datos"
  | "leakage"
  | "features"
  | "modelos"
  | "metricas";

const STEPS: { id: StepId; num: string; label: string }[] = [
  { id: "uso", num: "01", label: "Uso" },
  { id: "datos", num: "02", label: "Datos" },
  { id: "leakage", num: "03", label: "Partición" },
  { id: "features", num: "04", label: "Variables" },
  { id: "modelos", num: "05", label: "Modelos" },
  { id: "metricas", num: "06", label: "Métricas" },
];

const MODELS_INFO: Record<
  string,
  { family: string; summary: string; detail: string }
> = {
  LSTM: {
    family: "Deep Learning (PyTorch)",
    summary: "Red neuronal recurrente con compuertas de memoria.",
    detail:
      "Lee una ventana de días pasados y usa compuertas de olvido y entrada para retener tendencias largas (la gran crecida anual) e ignorar fluctuaciones de un solo día. Predice los 35 días de golpe (Multi-Output).",
  },
  "Bi-LSTM": {
    family: "Deep Learning (PyTorch)",
    summary: "Doble lectura (adelante y atrás) sobre el pasado conocido.",
    detail:
      "Recorre la ventana histórica en ambos sentidos (t-30 → t y t → t-30) únicamente sobre días ya ocurridos. Esto le permite contextualizar mejor la pendiente del río antes de proyectar los 35 días futuros.",
  },
  Transformer: {
    family: "Deep Learning (PyTorch)",
    summary: "Mecanismo de atención directa entre fechas clave.",
    detail:
      "En lugar de leer día por día en fila, usa Atención Multi-Cabezal (Multi-Head Attention) para conectar directamente el nivel actual con lo que ocurrió hace exactamente 7, 14 o 17 días aguas arriba.",
  },
  ARIMAX: {
    family: "Estadístico Exógeno",
    summary: "Autorregresión clásica potenciada con variables aguas arriba.",
    detail:
      "Combina la inercia propia de la estación (AR), la diferencia diaria (I) y los errores recientes (MA) con variables exógenas (X): el ciclo anual (seno/coseno) y los niveles de Puerto Ayacucho y Caicara en t-7, t-14 y t-17.",
  },
  AutoARIMA: {
    family: "Estadístico Univariado",
    summary: "Solo mira el pasado de su propia estación.",
    detail:
      "Encuentra automáticamente los parámetros óptimos (p, d, q), pero ignora lo que pasa aguas arriba. Compararlo contra ARIMAX permite ver cuánto aporta la física del río al pronóstico.",
  },
  TimesFM: {
    family: "Modelo Fundacional (Google)",
    summary: "Inferencia Zero-Shot sin entrenamiento local.",
    detail:
      "Preentrenado por Google con miles de millones de series temporales del mundo real. Recibe directamente entre 256 y 512 días de historia del Orinoco y proyecta los 35 días reconociendo patrones estacionales al instante.",
  },
  SimpleML: {
    family: "Baseline (Excel original)",
    summary: "Punto de referencia precalculado a superar.",
    detail:
      "Generado con la extensión 'Simple ML for Sheets' en el archivo original antes de corregir errores de datos ni incluir rezagos espaciales. Es la línea roja punteada que nuestros modelos buscan vencer.",
  },
};

export default function DidacticGuideSection({
  stations,
  selectedStation,
  onSelectStation,
  onNavigateTab,
}: DidacticGuideSectionProps) {
  const [step, setStep] = useState<StepId>("uso");

  // Controles interactivos ligeros
  const [doy, setDoy] = useState<number>(225);
  const [surge, setSurge] = useState<number>(2.0);
  const [activeModel, setActiveModel] = useState<string>("LSTM");
  const [windowL, setWindowL] = useState<14 | 30 | 60>(30);
  const [spikeError, setSpikeError] = useState<boolean>(false);

  const sinDoy = Math.sin((2 * Math.PI * doy) / 365.25);
  const cosDoy = Math.cos((2 * Math.PI * doy) / 365.25);

  const currentStepIdx = STEPS.findIndex((s) => s.id === step);
  const nextStep = STEPS[currentStepIdx + 1];

  return (
    <div className="rounded-xl border border-slate-200/70 bg-white p-5 dark:border-slate-800/80 dark:bg-slate-900/40">
      {/* Header + Minimal Step Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800/70">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Guía Didáctica de Machine Learning
          </h2>
          <p className="text-xs text-slate-400">
            Cómo funciona el proyecto paso a paso, desde los datos crudos hasta la inferencia
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 p-0.5 text-xs dark:border-slate-800">
          {STEPS.map((s) => {
            const active = step === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setStep(s.id)}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                  active
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                <span className="mr-1 opacity-60">{s.num}</span>
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* =====================================================================
          01. USO DE LA PLATAFORMA
         ===================================================================== */}
      {step === "uso" && (
        <div className="mt-5 space-y-5">
          <div className="max-w-2xl space-y-1">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              ¿Qué hace esta plataforma y cómo explorarla?
            </h3>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Estimamos el nivel diario del Río Orinoco (cota en metros sobre el nivel del mar,{" "}
              <code className="text-slate-700 dark:text-slate-200">m s.n.m.</code>) para un
              horizonte futuro de <strong>35 días</strong> en 4 estaciones sucesivas, comparando 7
              modelos distintos.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-slate-200/70 p-3.5 dark:border-slate-800/80">
              <span className="font-mono text-[11px] text-sky-500">PASO 1</span>
              <h4 className="mt-1 text-xs font-semibold text-slate-900 dark:text-white">
                Selecciona una estación
              </h4>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Las 4 tarjetas superiores siguen el curso del agua: desde{" "}
                <strong>Puerto Ayacucho</strong> (origen) hasta <strong>Palúa</strong> (+17 días de
                retardo).
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1">
                {stations.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => onSelectStation(st.id)}
                    className={`rounded px-2 py-0.5 text-[11px] font-medium transition ${
                      selectedStation === st.id
                        ? "bg-sky-500/15 text-sky-500"
                        : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    }`}
                  >
                    {st.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200/70 p-3.5 dark:border-slate-800/80">
              <span className="font-mono text-[11px] text-sky-500">PASO 2</span>
              <h4 className="mt-1 text-xs font-semibold text-slate-900 dark:text-white">
                Explora el Pronóstico (35d)
              </h4>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                La línea vertical marca el <code className="font-mono">2025-02-24</code>. A la
                izquierda ves el nivel real; a la derecha, los 35 días predichos. Activa{" "}
                <strong>Test Set</strong> para ver cómo rindió cada modelo en el pasado reciente.
              </p>
              <button
                type="button"
                onClick={() => onNavigateTab("forecast")}
                className="mt-2.5 inline-flex items-center gap-1 text-xs font-medium text-sky-500 hover:underline"
              >
                Abrir Pronóstico <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="rounded-lg border border-slate-200/70 p-3.5 dark:border-slate-800/80">
              <span className="font-mono text-[11px] text-sky-500">PASO 3</span>
              <h4 className="mt-1 text-xs font-semibold text-slate-900 dark:text-white">
                Compara las Métricas
              </h4>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Consulta el ranking objetivo en los 86 días de prueba ordenado de menor a mayor
                error (<strong>RMSE</strong> en metros).
              </p>
              <button
                type="button"
                onClick={() => onNavigateTab("metrics")}
                className="mt-2.5 inline-flex items-center gap-1 text-xs font-medium text-sky-500 hover:underline"
              >
                Abrir Métricas <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="rounded-lg border border-slate-200/70 p-3.5 dark:border-slate-800/80">
              <span className="font-mono text-[11px] text-sky-500">PASO 4</span>
              <h4 className="mt-1 text-xs font-semibold text-slate-900 dark:text-white">
                Verifica la Onda Física
              </h4>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Comprueba mediante correlación cruzada por qué las crecidas tardan 7, 14 y 17 días
                en viajar aguas abajo.
              </p>
              <button
                type="button"
                onClick={() => onNavigateTab("wave")}
                className="mt-2.5 inline-flex items-center gap-1 text-xs font-medium text-sky-500 hover:underline"
              >
                Abrir Propagación <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          02. LIMPIEZA Y AUDITORÍA DE DATOS
         ===================================================================== */}
      {step === "datos" && (
        <div className="mt-5 space-y-5">
          <div className="max-w-2xl space-y-1">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Auditoría y Limpieza: corregir los datos antes de entrenar
            </h3>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Un modelo solo es tan bueno como los datos que recibe. Al auditar el archivo Excel
              original encontramos 4 problemas que distorsionaban el aprendizaje y los corregimos
              reconstruyendo las 5.899 fechas (2009–2025) desde las matrices históricas.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 text-slate-400 dark:border-slate-800">
                <tr>
                  <th className="pb-2.5 font-medium">Anomalía detectada</th>
                  <th className="pb-2.5 font-medium">Efecto en el dataset crudo</th>
                  <th className="pb-2.5 font-medium">Solución en el pipeline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                <tr>
                  <td className="py-3 font-medium text-slate-900 dark:text-white">
                    Desfase de 638 días (Ciudad Bolívar)
                  </td>
                  <td className="py-3 text-slate-500 dark:text-slate-400">
                    Faltaba el <code className="font-mono">2020-01-01 (7.34m)</code>, corriendo
                    2020–2021 un día hacia atrás y duplicando el <code className="font-mono">2021-12-31</code>.
                  </td>
                  <td className="py-3 text-emerald-600 dark:text-emerald-400">
                    Reconstrucción directa desde las 4 hojas matrices (Día × Año).
                  </td>
                </tr>
                <tr>
                  <td className="py-3 font-medium text-slate-900 dark:text-white">
                    Spikes de transcripción (Outliers)
                  </td>
                  <td className="py-3 text-slate-500 dark:text-slate-400">
                    Salto irreal a <code className="font-mono">9.79m</code> en Palúa (2021-10-29) y
                    escalón de +1m en Ciudad Bolívar (Ene 2019).
                  </td>
                  <td className="py-3 text-emerald-600 dark:text-emerald-400">
                    Reemplazo por <code className="font-mono">NaN</code> e interpolación lineal.
                  </td>
                </tr>
                <tr>
                  <td className="py-3 font-medium text-slate-900 dark:text-white">
                    Días bisiestos vacíos (29-Feb)
                  </td>
                  <td className="py-3 text-slate-500 dark:text-slate-400">
                    3 valores nulos en Palúa (<code className="font-mono">2012, 2016, 2020</code>) y
                    filas sobrantes en años no bisiestos.
                  </td>
                  <td className="py-3 text-emerald-600 dark:text-emerald-400">
                    Filtro de fila 59 en años normales e interpolación en bisiestos.
                  </td>
                </tr>
                <tr>
                  <td className="py-3 font-medium text-slate-900 dark:text-white">
                    Error puntual en Caicara
                  </td>
                  <td className="py-3 text-slate-500 dark:text-slate-400">
                    El <code className="font-mono">2019-12-29</code> figuraba como{" "}
                    <code className="font-mono">25.83m</code> en lugar de{" "}
                    <code className="font-mono">25.91m</code>.
                  </td>
                  <td className="py-3 text-emerald-600 dark:text-emerald-400">
                    Restaurado automáticamente desde la matriz de Caicara.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          03. PARTICIÓN TEMPORAL Y PREVENCIÓN DE DATA LEAKAGE
         ===================================================================== */}
      {step === "leakage" && (
        <div className="mt-5 space-y-5">
          <div className="max-w-2xl space-y-1">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Prevención de Fuga de Datos (Data Leakage)
            </h3>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              En series de tiempo está prohibido mezclar fechas al azar (<code className="font-mono">shuffle=False</code>).
              Si un modelo ve datos de mañana para predecir ayer, hace trampa. Dividimos la serie en
              4 bloques estrictamente cronológicos:
            </p>
          </div>

          {/* Barra cronológica minimalista */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
            <div className="rounded-lg border border-slate-200/80 p-3 sm:col-span-5 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-900 dark:text-white">1. Train</span>
                <span className="font-mono text-[11px] text-sky-500">2009 – 2023</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                15 años donde el modelo aprende pesos y donde se ajusta (<code className="font-mono">.fit</code>)
                el escalador.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200/80 p-3 sm:col-span-3 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-900 dark:text-white">2. Validation</span>
                <span className="font-mono text-[11px] text-purple-500">Ene–Nov 2024</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Ajuste de hiperparámetros y parada temprana (<em>Early Stopping</em>).
              </p>
            </div>

            <div className="rounded-lg border border-slate-200/80 p-3 sm:col-span-2 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-900 dark:text-white">3. Test</span>
                <span className="font-mono text-[11px] text-emerald-500">86 días</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Dic 2024 a 24-Feb-2025. Examen final para medir RMSE.
              </p>
            </div>

            <div className="rounded-lg border border-sky-500/40 bg-sky-500/5 p-3 sm:col-span-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-sky-500">4. Forecast</span>
                <span className="font-mono text-[11px] text-sky-500">35 días</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                25-Feb a 31-Mar-2025. Inferencia a ciegas.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200/60 p-3 text-xs dark:border-slate-800/70">
              <strong className="text-slate-900 dark:text-white">Escalado sin fuga:</strong>{" "}
              <span className="text-slate-500 dark:text-slate-400">
                El <code className="font-mono">StandardScaler</code> calcula media y desviación solo
                en Train (2009–2023) para no filtrar máximos futuros.
              </span>
            </div>
            <div className="rounded-lg border border-slate-200/60 p-3 text-xs dark:border-slate-800/70">
              <strong className="text-slate-900 dark:text-white">Inferencia honesta a 35d:</strong>{" "}
              <span className="text-slate-500 dark:text-slate-400">
                Ningún rezago usa mediciones futuras que aún no ocurren; se predice en bloque
                (Multi-Output) o recursivamente.
              </span>
            </div>
            <div className="rounded-lg border border-slate-200/60 p-3 text-xs dark:border-slate-800/70">
              <strong className="text-slate-900 dark:text-white">Control de Overfitting:</strong>{" "}
              <span className="text-slate-500 dark:text-slate-400">
                Si el error sigue bajando en Train pero sube en Validation, detenemos el
                entrenamiento automáticamente.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          04. VARIABLES Y FÍSICA DEL RÍO (FEATURE ENGINEERING)
         ===================================================================== */}
      {step === "features" && (
        <div className="mt-5 space-y-5">
          <div className="max-w-2xl space-y-1">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Feature Engineering: traduciendo el calendario y la geografía a números
            </h3>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Creamos dos grupos de variables predictoras: codificación cíclica anual para que el
              modelo sepa en qué época de lluvias está, y rezagos espaciales (<code className="font-mono">lags</code>)
              para anticipar la onda que baja desde Puerto Ayacucho.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Control 1: Reloj Cíclico */}
            <div className="rounded-lg border border-slate-200/80 p-4 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-900 dark:text-white">
                  1. Codificación Cíclica Anual (Seno / Coseno)
                </span>
                <span className="font-mono text-sky-500">Día {doy} / 365</span>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Une el 31 de diciembre (día 365) con el 1 de enero (día 1) sin saltos numéricos:
              </p>

              <input
                type="range"
                min={1}
                max={365}
                value={doy}
                onChange={(e) => setDoy(Number(e.target.value))}
                className="mt-3 w-full accent-sky-500"
              />

              <div className="mt-2 flex items-center justify-between rounded bg-slate-50 px-3 py-2 font-mono text-xs dark:bg-slate-900">
                <span>
                  sin_doy:{" "}
                  <strong className="text-slate-900 dark:text-white">
                    {sinDoy >= 0 ? `+${sinDoy.toFixed(3)}` : sinDoy.toFixed(3)}
                  </strong>
                </span>
                <span>
                  cos_doy:{" "}
                  <strong className="text-slate-900 dark:text-white">
                    {cosDoy >= 0 ? `+${cosDoy.toFixed(3)}` : cosDoy.toFixed(3)}
                  </strong>
                </span>
              </div>
            </div>

            {/* Control 2: Lags de Propagación */}
            <div className="rounded-lg border border-slate-200/80 p-4 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-900 dark:text-white">
                  2. Rezagos Aguas Arriba (Lags 7, 14 y 17 días)
                </span>
                <span className="font-mono text-sky-500">+{surge.toFixed(1)} m en origen</span>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Simula una subida hoy en Puerto Ayacucho y su llegada escalonada aguas abajo:
              </p>

              <input
                type="range"
                min={0.5}
                max={3.5}
                step={0.1}
                value={surge}
                onChange={(e) => setSurge(Number(e.target.value))}
                className="mt-3 w-full accent-sky-500"
              />

              <div className="mt-2 grid grid-cols-4 gap-1.5 text-center font-mono text-[11px]">
                <div className="rounded bg-slate-50 py-1.5 dark:bg-slate-900">
                  <div className="text-slate-400">Hoy (0d)</div>
                  <div className="font-semibold text-sky-500">+{surge.toFixed(1)}m</div>
                </div>
                <div className="rounded bg-slate-50 py-1.5 dark:bg-slate-900">
                  <div className="text-slate-400">+7d Caicara</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    +{(surge * 0.72).toFixed(1)}m
                  </div>
                </div>
                <div className="rounded bg-slate-50 py-1.5 dark:bg-slate-900">
                  <div className="text-slate-400">+14d Bolívar</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    +{(surge * 0.58).toFixed(1)}m
                  </div>
                </div>
                <div className="rounded bg-slate-50 py-1.5 dark:bg-slate-900">
                  <div className="text-slate-400">+17d Palúa</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    +{(surge * 0.48).toFixed(1)}m
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          05. LOS 7 MODELOS Y VENTANAS DESLIZANTES
         ===================================================================== */}
      {step === "modelos" && (
        <div className="mt-5 space-y-5">
          {/* Selector de modelo tipo píldora igual al gráfico */}
          <div className="flex flex-wrap items-center gap-1.5">
            {Object.keys(MODELS_INFO).map((m) => {
              const active = activeModel === m;
              const color = MODEL_COLORS[m] || "#94a3b8";
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setActiveModel(m)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                    active
                      ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white"
                      : "text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300"
                  }`}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  {m === "SimpleML" ? "Simple-ML" : m}
                </button>
              );
            })}
          </div>

          {/* Detalle limpio del modelo seleccionado */}
          <div className="rounded-lg border border-slate-200/80 p-4 dark:border-slate-800">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {activeModel === "SimpleML" ? "Simple-ML (Baseline)" : activeModel}
              </h3>
              <span className="text-xs text-slate-400">
                {MODELS_INFO[activeModel].family}
              </span>
            </div>
            <p className="mt-1 text-xs font-medium text-sky-500">
              {MODELS_INFO[activeModel].summary}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {MODELS_INFO[activeModel].detail}
            </p>
          </div>

          {/* Ventana Deslizante minimalista */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200/60 p-3.5 text-xs dark:border-slate-800/70">
            <div className="space-y-0.5">
              <span className="font-semibold text-slate-900 dark:text-white">
                Ventana Deslizante (Sliding Window): Entrada L = {windowL}d → Salida H = 35d
              </span>
              <p className="text-slate-500 dark:text-slate-400">
                Las redes en PyTorch toman los últimos {windowL} días multivariados y proyectan los
                35 días futuros.
              </p>
            </div>

            <div className="flex items-center rounded-lg border border-slate-200 p-0.5 dark:border-slate-800">
              {([14, 30, 60] as const).map((L) => (
                <button
                  key={L}
                  type="button"
                  onClick={() => setWindowL(L)}
                  className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                    windowL === L
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                  }`}
                >
                  {L}d
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          06. MÉTRICAS DE EVALUACIÓN
         ===================================================================== */}
      {step === "metricas" && (
        <div className="mt-5 space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-slate-200/80 p-3.5 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <strong className="text-slate-900 dark:text-white">RMSE (m)</strong>
                <span className="text-[11px] text-emerald-500">Menor es mejor ↓</span>
              </div>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                Raíz del error cuadrático medio. Eleva los fallos al cuadrado antes de promediar,
                castigando fuertemente cualquier pico de error peligroso.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200/80 p-3.5 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <strong className="text-slate-900 dark:text-white">MAE (m)</strong>
                <span className="text-[11px] text-sky-500">Menor es mejor ↓</span>
              </div>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                Error absoluto medio. Indica de forma directa por cuántos metros o centímetros se
                desvía el modelo en un día típico.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200/80 p-3.5 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <strong className="text-slate-900 dark:text-white">MAPE (%)</strong>
                <span className="text-[11px] text-sky-500">Menor es mejor ↓</span>
              </div>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                Error porcentual relativo a la altura del río en esa estación, útil para comparar
                estaciones de distinta escala.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200/80 p-3.5 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <strong className="text-slate-900 dark:text-white">R²</strong>
                <span className="text-[11px] text-amber-500">Óptimo = 1.000 ↑</span>
              </div>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                Fracción de la variación real del río explicada por el modelo. Cercano a 1 es
                excelente; menor a 0 es peor que predecir el promedio.
              </p>
            </div>
          </div>

          {/* Demostración minimalista RMSE vs MAE */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200/60 p-3.5 text-xs dark:border-slate-800/70">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-slate-500 dark:text-slate-400">
                Errores en 5 días:{" "}
                <code className="font-mono text-slate-800 dark:text-slate-200">
                  [0.10, 0.10, 0.10, 0.10, {spikeError ? "1.50m" : "0.10m"}]
                </code>
              </span>
              <span className="font-mono">
                MAE: <strong>{spikeError ? "0.380m" : "0.100m"}</strong>
              </span>
              <span className="font-mono">
                RMSE:{" "}
                <strong className={spikeError ? "text-amber-500" : ""}>
                  {spikeError ? "0.677m" : "0.100m"}
                </strong>
              </span>
            </div>

            <button
              type="button"
              onClick={() => setSpikeError((prev) => !prev)}
              className="rounded-lg border border-slate-200 px-3 py-1 font-medium text-slate-600 hover:text-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:text-white"
            >
              {spikeError ? "Restaurar errores parejos" : "Simular 1 pico de error (+1.50m)"}
            </button>
          </div>
        </div>
      )}

      {/* Minimal Footer Navigation */}
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3.5 text-xs text-slate-400 dark:border-slate-800/70">
        <span>
          Paso {STEPS[currentStepIdx].num} de 06 — {STEPS[currentStepIdx].label}
        </span>

        {nextStep ? (
          <button
            type="button"
            onClick={() => setStep(nextStep.id)}
            className="inline-flex items-center gap-1 font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          >
            Siguiente: {nextStep.label} <ArrowRight className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onNavigateTab("forecast")}
            className="inline-flex items-center gap-1 font-medium text-sky-500 hover:underline"
          >
            Volver al Pronóstico <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
