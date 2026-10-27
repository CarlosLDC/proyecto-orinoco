"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Compass,
  ShieldAlert,
  Sparkles,
  Waves,
  Sliders,
  BrainCircuit,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Clock,
  Cpu,
  Layers,
  Activity,
  HelpCircle,
  Play,
} from "lucide-react";
import { MODEL_COLORS, StationMetadata, MetricItem } from "@/lib/api";

interface DidacticGuideSectionProps {
  stations: StationMetadata[];
  metrics: MetricItem[];
  selectedStation: string;
  onSelectStation: (stationId: string) => void;
  onNavigateTab: (tab: "forecast" | "metrics" | "wave") => void;
}

type LessonId =
  | "guia-uso"
  | "auditoria-datos"
  | "data-leakage"
  | "feature-engineering"
  | "arquitecturas-ml"
  | "metricas-evaluacion";

const LESSONS: {
  id: LessonId;
  step: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: "guia-uso",
    step: "01",
    title: "Cómo usar la plataforma",
    subtitle: "Recorrido interactivo por el laboratorio",
    icon: Compass,
  },
  {
    id: "auditoria-datos",
    step: "02",
    title: "Limpieza y Auditoría de Datos",
    subtitle: "Basura entra, basura sale (GIGO)",
    icon: ShieldAlert,
  },
  {
    id: "data-leakage",
    step: "03",
    title: "Fuga de Datos y Corte Temporal",
    subtitle: "Por qué está prohibido barajar el tiempo",
    icon: Clock,
  },
  {
    id: "feature-engineering",
    step: "04",
    title: "Física del Río y Variables (Features)",
    subtitle: "Rezagos (7, 14, 17d) y reloj cíclico",
    icon: Sliders,
  },
  {
    id: "arquitecturas-ml",
    step: "05",
    title: "Los 7 Modelos Cara a Cara",
    subtitle: "Estadística vs. Deep Learning vs. IA Fundacional",
    icon: BrainCircuit,
  },
  {
    id: "metricas-evaluacion",
    step: "06",
    title: "Cómo Leer las Métricas",
    subtitle: "RMSE, MAE, MAPE y R² sin fórmulas aburridas",
    icon: BarChart3,
  },
];

export default function DidacticGuideSection({
  stations,
  metrics,
  selectedStation,
  onSelectStation,
  onNavigateTab,
}: DidacticGuideSectionProps) {
  const [activeLesson, setActiveLesson] = useState<LessonId>("guia-uso");

  // Interactive simulator state for Lesson 04 (Cyclical Day of Year + Wave Lag)
  const [simDayOfYear, setSimDayOfYear] = useState<number>(230); // ~Agosto (pico de crecida)
  const [simUpstreamSurge, setSimUpstreamSurge] = useState<number>(1.8); // subida en Puerto Ayacucho

  // Interactive simulator state for Lesson 05 (Sliding Window)
  const [windowSizeL, setWindowSizeL] = useState<14 | 30 | 60>(30);
  const [selectedModelCard, setSelectedModelCard] = useState<string>("LSTM");

  // Interactive simulator state for Lesson 06 (Metrics Outlier Sandbox)
  const [hasSpikeError, setHasSpikeError] = useState<boolean>(false);

  const sinDoy = Math.sin((2 * Math.PI * simDayOfYear) / 365.25);
  const cosDoy = Math.cos((2 * Math.PI * simDayOfYear) / 365.25);

  const approxMonthName = (doy: number) => {
    const months = [
      "Enero (Aguas bajas)",
      "Febrero (Mínimo anual)",
      "Marzo (Fin de sequía)",
      "Abril (Inicio de lluvias)",
      "Mayo (Ascenso rápido)",
      "Junio (Crecida media)",
      "Julio (Crecida alta)",
      "Agosto (Pico máximo anual)",
      "Septiembre (Inicio de bajante)",
      "Octubre (Descenso sostenido)",
      "Noviembre (Aguas en transición)",
      "Diciembre (Estiaje)",
    ];
    const idx = Math.min(11, Math.floor((doy - 1) / 30.5));
    return months[idx];
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner Didáctico */}
      <div className="relative overflow-hidden rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-500/10 via-white to-emerald-500/5 p-6 dark:border-sky-500/20 dark:from-sky-950/40 dark:via-slate-900/80 dark:to-emerald-950/20">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-600 dark:text-sky-400">
              <BookOpen className="h-3.5 w-3.5" />
              <span>Aula Abierta de Machine Learning Hidrológico</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              Aprende Inteligencia Artificial prediciendo el Río Orinoco
            </h1>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 sm:text-sm">
              Este proyecto no es una &ldquo;caja negra&rdquo;. Fue construido para que cualquier
              persona —desde estudiantes hasta ingenieros— comprenda paso a paso cómo se transforma
              una hoja de Excel con errores reales en un sistema de pronóstico con{" "}
              <strong>7 modelos de Machine Learning</strong>.
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col">
            <button
              type="button"
              onClick={() => onNavigateTab("forecast")}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-600"
            >
              <Play className="h-3.5 w-3.5" />
              Ir al Pronóstico en Vivo
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab("wave")}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Waves className="h-3.5 w-3.5 text-sky-500" />
              Explorar Onda del Río
            </button>
          </div>
        </div>
      </div>

      {/* Navegador de los 6 Capítulos Didácticos */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {LESSONS.map((lesson) => {
          const Icon = lesson.icon;
          const isActive = activeLesson === lesson.id;
          return (
            <button
              key={lesson.id}
              type="button"
              onClick={() => setActiveLesson(lesson.id)}
              className={`group flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all ${
                isActive
                  ? "border-sky-500 bg-sky-500/10 shadow-sm dark:border-sky-400 dark:bg-sky-500/15"
                  : "border-slate-200/70 bg-white hover:border-slate-300 dark:border-slate-800/80 dark:bg-slate-900/40 dark:hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`font-mono text-[11px] font-bold ${
                    isActive
                      ? "text-sky-600 dark:text-sky-400"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  MÓDULO {lesson.step}
                </span>
                <Icon
                  className={`h-4 w-4 ${
                    isActive
                      ? "text-sky-500"
                      : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300"
                  }`}
                />
              </div>
              <div className="mt-2.5">
                <p className="text-xs font-semibold leading-snug text-slate-900 dark:text-white">
                  {lesson.title}
                </p>
                <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500 dark:text-slate-400">
                  {lesson.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Contenido Dinámico del Capítulo Activo */}
      <div className="rounded-2xl border border-slate-200/70 bg-white p-5 sm:p-7 dark:border-slate-800/80 dark:bg-slate-900/40">
        {/* =====================================================================
            MÓDULO 01: CÓMO USAR LA PLATAFORMA
           ===================================================================== */}
        {activeLesson === "guia-uso" && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4 dark:border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-500">
                Módulo 01 • Manual Interactivo de Usuario
              </span>
              <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
                ¿Cómo usar este laboratorio y qué significa cada control?
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                Nuestro proyecto predice la altura diaria del agua (llamada{" "}
                <strong>cota</strong>, medida en metros sobre el nivel del mar,{" "}
                <code className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800">
                  m s.n.m.
                </code>
                ) en 4 ciudades sucesivas del Río Orinoco durante un horizonte futuro de{" "}
                <strong>35 días</strong>.
              </p>
            </div>

            {/* Paso a paso visual */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500 text-xs font-bold text-white">
                    1
                  </span>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Elige una de las 4 Estaciones (Arriba)
                  </h3>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  Las 4 tarjetas superiores están ordenadas en el sentido en que corre el agua,
                  desde el Amazonas hasta el Delta:
                </p>
                <ul className="mt-2.5 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <li>
                    • <strong>01 Puerto Ayacucho (Origen):</strong> Es nuestro sensor temprano aguas
                    arriba. Cuando llueve en la cuenca alta, sube aquí primero.
                  </li>
                  <li>
                    • <strong>02 Caicara (+7d):</strong> Recibe el impacto de Puerto Ayacucho unos{" "}
                    <strong>7 días después</strong>.
                  </li>
                  <li>
                    • <strong>03 Ciudad Bolívar (+14d):</strong> La onda tarda{" "}
                    <strong>~14 días</strong> en llegar desde Puerto Ayacucho.
                  </li>
                  <li>
                    • <strong>04 Palúa (+17d):</strong> A las puertas del Delta; refleja lo que
                    pasó en Puerto Ayacucho hace <strong>~17 días</strong>.
                  </li>
                </ul>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {stations.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        onSelectStation(st.id);
                      }}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
                        selectedStation === st.id
                          ? "bg-sky-500 text-white"
                          : "bg-slate-200/70 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      Probar {st.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
                    2
                  </span>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Pestaña «Pronóstico»: Pasado vs. Futuro a Ciegas
                  </h3>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  En la gráfica principal verás una línea vertical punteada el{" "}
                  <strong>24 de febrero de 2025</strong> (último día con datos reales medidos):
                </p>
                <ul className="mt-2.5 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <li>
                    • <strong>Zona izquierda (Línea Azul Continua):</strong> Es la historia real del
                    río. Puedes ampliar la ventana a{" "}
                    <code className="rounded bg-slate-200 px-1 dark:bg-slate-800">35d</code>,{" "}
                    <code className="rounded bg-slate-200 px-1 dark:bg-slate-800">86d</code> o{" "}
                    <code className="rounded bg-slate-200 px-1 dark:bg-slate-800">180d</code>.
                  </li>
                  <li>
                    • <strong>Zona derecha sombreada (25 Feb – 31 Mar 2025):</strong> Es el{" "}
                    <strong>Horizonte de Pronóstico de 35 días</strong>. Aquí compiten los 7
                    modelos.
                  </li>
                  <li>
                    • <strong>Botón «Test Set»:</strong> ¡Muy importante! Si lo activas, verás cómo
                    predijo cada modelo los <strong>86 días anteriores</strong> donde sí conocíamos
                    la respuesta real. Así puedes verificar visualmente quién acertó y quién falló.
                  </li>
                </ul>
                <button
                  type="button"
                  onClick={() => onNavigateTab("forecast")}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-sky-500 hover:underline"
                >
                  Ir a Pronóstico y probar el botón «Test Set»
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-xs font-bold text-white">
                    3
                  </span>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Pestaña «Métricas»: El Ranking de Precisión
                  </h3>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  No confíes solo en tus ojos. En la tabla de <strong>Métricas</strong> ordenamos
                  automáticamente los modelos desde el más preciso (menor error{" "}
                  <strong>RMSE</strong> en metros) hasta el menos preciso en cada estación. Puedes
                  alternar entre ver la estación actual o comparar las 4 estaciones juntas.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigateTab("metrics")}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-purple-500 hover:underline"
                >
                  Ver tabla de clasificación en Métricas
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
                    4
                  </span>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Pestaña «Propagación»: La Física detrás del ML
                  </h3>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  Aquí demostramos matemáticamente (usando <strong>Correlación Cruzada</strong>)
                  cuántos días tarda una subida brusca del río en viajar de una ciudad a otra, y
                  puedes explorar los 16 años de serie limpia (2009–2025).
                </p>
                <button
                  type="button"
                  onClick={() => onNavigateTab("wave")}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-500 hover:underline"
                >
                  Explorar correlaciones y retardos
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-sky-500/10 p-4 text-xs dark:bg-sky-500/15">
              <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-200">
                <Sparkles className="h-4 w-4 shrink-0 text-sky-500" />
                <span>
                  <strong>Consejo de aprendizaje:</strong> Continúa al Módulo 02 para descubrir los
                  errores ocultos que encontramos en el archivo Excel original antes de entrenar la
                  IA.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveLesson("auditoria-datos")}
                className="shrink-0 rounded-lg bg-sky-500 px-3 py-1.5 font-semibold text-white hover:bg-sky-600"
              >
                Siguiente: Auditoría →
              </button>
            </div>
          </div>
        )}

        {/* =====================================================================
            MÓDULO 02: LIMPIEZA Y AUDITORÍA DE DATOS
           ===================================================================== */}
        {activeLesson === "auditoria-datos" && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4 dark:border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-500">
                Módulo 02 • Ingeniería y Auditoría de Datos (Data Cleaning)
              </span>
              <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
                El secreto que nadie cuenta: «Si entra basura, sale basura»
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                En Machine Learning existe la ley{" "}
                <strong>GIGO (Garbage In, Garbage Out)</strong>. Si entrenas la red neuronal más
                avanzada del mundo con datos corruptos, aprenderá patrones falsos. Al auditar el
                Excel original (<code className="rounded bg-slate-100 px-1 dark:bg-slate-800">DATOS RIO ORINOCO.xlsx</code>),
                descubrimos <strong>5 anomalías críticas</strong> que tuvimos que reparar en el
                Módulo 1 del backend.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Anomalía 1 */}
              <div className="rounded-xl border border-rose-500/25 bg-rose-500/5 p-4 dark:bg-rose-950/20">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <h3 className="text-xs font-bold uppercase tracking-wide">
                    1. El Desfase Fantasma de 638 días (Ciudad Bolívar)
                  </h3>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  En la hoja consolidada <code className="font-mono">Entrenar</code>, alguien olvidó
                  copiar el día <strong>1 de enero de 2020 (7.34 m)</strong> de la matriz histórica
                  de Ciudad Bolívar. Eso corrió <strong>toda la serie un día hacia atrás</strong>{" "}
                  durante 2020 y 2021 (638 días desalineados) y duplicó el valor{" "}
                  <code className="font-mono">7.14 m</code> el 31 de diciembre de 2021.
                </p>
                <div className="mt-2.5 rounded-lg bg-white/80 p-2.5 text-[11px] text-emerald-700 dark:bg-slate-900/80 dark:text-emerald-400">
                  <strong>✔ Solución aplicada:</strong> En vez de confiar en la hoja copiada a mano,
                  reconstruimos por código las 5.899 fechas directamente desde las 4 hojas matrices
                  originales (Día × Año).
                </div>
              </div>

              {/* Anomalía 2 */}
              <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 dark:bg-amber-950/20">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <h3 className="text-xs font-bold uppercase tracking-wide">
                    2. «Dedazos» y Escalones Artificiales (Outliers)
                  </h3>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  Un río gigante de kilómetros de ancho tiene una inercia física enorme: no puede
                  subir 1 metro entero en un día y volver a bajar al día siguiente. Detectamos dos
                  errores de transcripción humana:
                </p>
                <ul className="mt-1.5 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                  <li>
                    • <strong>Palúa (2021-10-29):</strong> Pasó de <code className="font-mono">8.73m</code>{" "}
                    a <strong className="text-rose-500">9.79m</strong> y luego a{" "}
                    <code className="font-mono">8.86m</code>. Era un error de tipeo por{" "}
                    <code className="font-mono">8.79m</code>.
                  </li>
                  <li>
                    • <strong>Ciudad Bolívar (Enero 2019):</strong> Del 1 al 10 de enero la serie
                    saltó artificialmente +1 metro (<code className="font-mono">5.60m → 6.60m</code>)
                    mientras las otras estaciones bajaban.
                  </li>
                </ul>
                <div className="mt-2.5 rounded-lg bg-white/80 p-2.5 text-[11px] text-emerald-700 dark:bg-slate-900/80 dark:text-emerald-400">
                  <strong>✔ Solución aplicada:</strong> Convertimos las anomalías en valores vacíos (
                  <code className="font-mono">NaN</code>) e <strong>interpolamos linealmente</strong>{" "}
                  respetando la pendiente física del río.
                </div>
              </div>

              {/* Anomalía 3 */}
              <div className="rounded-xl border border-sky-500/25 bg-sky-500/5 p-4 dark:bg-sky-950/20">
                <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <h3 className="text-xs font-bold uppercase tracking-wide">
                    3. El Dilema de los Años Bisiestos (29 de Febrero)
                  </h3>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  Las hojas matrices tienen 366 filas fijas (la fila 60 es el 29 de febrero). En los
                  años normales esa fila debe omitirse, pero en los bisiestos (2012, 2016, 2020) la
                  estación <strong>Palúa</strong> tenía esos 3 casilleros en blanco (
                  <code className="font-mono">NaN</code>).
                </p>
                <div className="mt-2.5 rounded-lg bg-white/80 p-2.5 text-[11px] text-emerald-700 dark:bg-slate-900/80 dark:text-emerald-400">
                  <strong>✔ Solución aplicada:</strong> Eliminamos el 29-Feb en años no bisiestos e
                  imputamos los 3 días bisiestos faltantes de Palúa promediando el 28 de febrero y el
                  1 de marzo.
                </div>
              </div>

              {/* Anomalía 4 */}
              <div className="rounded-xl border border-purple-500/25 bg-purple-500/5 p-4 dark:bg-purple-950/20">
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                  <Eye className="h-4 w-4 shrink-0" />
                  <h3 className="text-xs font-bold uppercase tracking-wide">
                    4. El String «MANDARINA» y el Baseline Magic
                  </h3>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  El Excel original incluía 11 columnas vacías con anotaciones sueltas (¡incluso la
                  palabra <code className="font-mono">&quot;MANDARINA&quot;</code> en la fila 16!) y un
                  pronóstico hecho con la extensión <em>Simple ML for Sheets</em>.
                </p>
                <div className="mt-2.5 rounded-lg bg-white/80 p-2.5 text-[11px] text-emerald-700 dark:bg-slate-900/80 dark:text-emerald-400">
                  <strong>✔ Solución aplicada:</strong> Descartamos las columnas basura, pero
                  rescatamos las 35 predicciones de <strong>Simple-ML</strong> como nuestro{" "}
                  <em>Baseline</em> (línea roja punteada) para demostrar cuánto mejoran nuestros
                  modelos frente a una herramienta automática de hojas de cálculo.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-amber-500/10 p-4 text-xs dark:bg-amber-500/15">
              <span className="text-slate-700 dark:text-slate-200">
                Una vez limpia la serie de <strong>5.899 días</strong> (2009–2025), ¿cómo la
                dividimos para entrenar sin hacer trampa?
              </span>
              <button
                type="button"
                onClick={() => setActiveLesson("data-leakage")}
                className="shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 font-semibold text-white hover:bg-amber-600"
              >
                Siguiente: Fuga de Datos →
              </button>
            </div>
          </div>
        )}

        {/* =====================================================================
            MÓDULO 03: DATA LEAKAGE Y CORTE TEMPORAL
           ===================================================================== */}
        {activeLesson === "data-leakage" && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4 dark:border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500">
                Módulo 03 • Prevención de Fuga de Datos (Data Leakage)
              </span>
              <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
                La Regla de Oro en Series Temporales: Prohibido mirar el futuro
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                Cuando clasificas fotos de perros y gatos, puedes mezclar (hacer{" "}
                <code className="font-mono">shuffle</code>) las imágenes al azar. Pero en una{" "}
                <strong>serie temporal</strong>, mezclar los días al azar es hacer trampa: el modelo
                aprendería el nivel del río del martes mirando cuánto midió el miércoles. Eso se
                llama <strong>Data Leakage (Fuga de Datos)</strong>.
              </p>
            </div>

            {/* Línea de tiempo visual de la partición */}
            <div className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Nuestra Partición Temporal Estricta (Sin Shuffle)
              </h3>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
                <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-3 sm:col-span-6">
                  <div className="flex items-center justify-between text-xs font-bold text-sky-600 dark:text-sky-400">
                    <span>1. TRAIN SET (Entrenamiento)</span>
                    <span>15 Años</span>
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                    2009-01-01 → 2023-12-31
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    Los modelos estudian 15 ciclos anuales completos de crecidas y sequías.{" "}
                    <strong>Los escaladores se ajustan (.fit) SOLO aquí.</strong>
                  </p>
                </div>

                <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-3 sm:col-span-2">
                  <div className="text-xs font-bold text-purple-600 dark:text-purple-400">
                    2. VALIDATION
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                    Ene – Nov 2024
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    Simulacro de examen para ajustar hiperparámetros y frenar a tiempo (
                    <em>Early Stopping</em>).
                  </p>
                </div>

                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 sm:col-span-2">
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    3. TEST SET
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                    Dic 24 – 24 Feb 25
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <strong>86 días intocables.</strong> Examen final donde medimos el RMSE y MAE de
                    la tabla de Métricas.
                  </p>
                </div>

                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 sm:col-span-2">
                  <div className="text-xs font-bold text-amber-600 dark:text-amber-400">
                    4. FORECAST
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                    25 Feb – 31 Mar 25
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <strong>35 días a ciegas.</strong> El futuro que queremos predecir en producción.
                  </p>
                </div>
              </div>
            </div>

            {/* Las 3 trampas que evitamos */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-slate-200/80 p-4 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Trampa #1: Escalado con Fuga
                </h4>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  Las redes neuronales necesitan números pequeños (entre 0 y 1 o con media 0). Si
                  calculas el promedio y el máximo incluyendo el año 2025, le estás soplando al
                  modelo qué tan alto llegará el río en 2025. Por eso nuestro{" "}
                  <code className="font-mono">StandardScaler</code> se entrena{" "}
                  <strong>únicamente con datos de 2009 a 2023</strong>.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200/80 p-4 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Trampa #2: Rezagos del Futuro en los 35 Días
                </h4>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  Si hoy es 24 de febrero y quieres predecir el 31 de marzo (dentro de 35 días),{" "}
                  <strong>no tienes la medición real del 30 de marzo</strong>. Nuestros modelos usan{" "}
                  <strong>estrategia Directa Multi-Output</strong> (sacan los 35 días de golpe a
                  partir de la ventana pasada) o <strong>recursión honesta</strong> alimentándose de
                  sus propias predicciones previas.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200/80 p-4 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Trampa #3: Sobreajuste (Overfitting)
                </h4>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  Una red neuronal con millones de parámetros puede &ldquo;memorizar&rdquo; el pasado
                  como un loro y fallar en el futuro. Usamos el conjunto de{" "}
                  <strong>Validación (2024)</strong> con <em>Early Stopping</em>: en el instante en
                  que el error en 2024 deja de bajar, detenemos el entrenamiento y guardamos el
                  mejor peso.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 p-4 text-xs dark:bg-emerald-500/15">
              <span className="text-slate-700 dark:text-slate-200">
                ¿Qué pistas físicas le damos a los modelos para que anticipen la crecida del río?
              </span>
              <button
                type="button"
                onClick={() => setActiveLesson("feature-engineering")}
                className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white hover:bg-emerald-700"
              >
                Siguiente: Variables y Física →
              </button>
            </div>
          </div>
        )}

        {/* =====================================================================
            MÓDULO 04: INGENIERÍA DE CARACTERÍSTICAS (INTERACTIVO)
           ===================================================================== */}
        {activeLesson === "feature-engineering" && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4 dark:border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-500">
                Módulo 04 • Feature Engineering e Hidrodinámica
              </span>
              <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
                Cómo enseñarle física de ríos y estaciones del año a una máquina
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                Un modelo no sabe qué es &ldquo;agosto&rdquo; ni sabe que Puerto Ayacucho queda aguas
                arriba de Ciudad Bolívar. Mediante la{" "}
                <strong>Ingeniería de Características (Feature Engineering)</strong>, traducimos la
                geografía y el calendario en variables numéricas. ¡Prueba los dos simuladores abajo!
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Simulador 1: Reloj Cíclico Seno/Coseno */}
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <span className="rounded bg-purple-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-purple-500">
                  Simulador Interactivo 1
                </span>
                <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                  El Reloj Anual Cíclico (sin_doy y cos_doy)
                </h3>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  ¿Por qué no pasamos simplemente el número de día del año (1 al 365)? Porque para un
                  modelo matemático, el <strong>31 de diciembre (día 365)</strong> y el{" "}
                  <strong>1 de enero (día 1)</strong> estarían lejísimos (a 364 unidades de
                  distancia), cuando en realidad son días consecutivos. Al usar{" "}
                  <strong>Seno y Coseno</strong>, doblamos el calendario en un círculo perfecto:
                </p>

                <div className="mt-4 space-y-3 rounded-lg bg-slate-50 p-3.5 dark:bg-slate-900/90">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      Mueve el día del año: <strong>Día {simDayOfYear}</strong>
                    </span>
                    <span className="rounded-full bg-sky-500/15 px-2.5 py-0.5 font-semibold text-sky-500">
                      {approxMonthName(simDayOfYear)}
                    </span>
                  </div>

                  <input
                    type="range"
                    min={1}
                    max={365}
                    value={simDayOfYear}
                    onChange={(e) => setSimDayOfYear(Number(e.target.value))}
                    className="w-full accent-sky-500"
                  />

                  <div className="grid grid-cols-2 gap-2 pt-1 text-center font-mono text-xs">
                    <div className="rounded border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-950">
                      <div className="text-[10px] text-slate-400">sin_doy</div>
                      <div className="text-sm font-bold text-purple-500">
                        {sinDoy >= 0 ? `+${sinDoy.toFixed(3)}` : sinDoy.toFixed(3)}
                      </div>
                    </div>
                    <div className="rounded border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-950">
                      <div className="text-[10px] text-slate-400">cos_doy</div>
                      <div className="text-sm font-bold text-emerald-500">
                        {cosDoy >= 0 ? `+${cosDoy.toFixed(3)}` : cosDoy.toFixed(3)}
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    💡 <em>Prueba poner el deslizador en el Día 1 y luego en el Día 365:</em> verás
                    que ambos dan casi exactamente <code className="font-mono">sin ≈ 0.00</code> y{" "}
                    <code className="font-mono">cos ≈ +1.00</code>. ¡El modelo entiende que el fin de
                    año se conecta con el inicio!
                  </p>
                </div>
              </div>

              {/* Simulador 2: Propagación de Onda Aguas Arriba */}
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <span className="rounded bg-sky-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-sky-500">
                  Simulador Interactivo 2
                </span>
                <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                  Propagación Espacial: Rezagos de 7, 14 y 17 días
                </h3>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  Un modelo univariado mira solo el pasado de su propia ciudad. En cambio, nuestros
                  modelos multivariados (<strong>ARIMAX, LSTM, Bi-LSTM, Transformer</strong>) miran{" "}
                  <strong>lo que ocurrió aguas arriba hace 7, 14 y 17 días</strong>:
                </p>

                <div className="mt-4 space-y-3 rounded-lg bg-slate-50 p-3.5 dark:bg-slate-900/90">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      Simula un aumento hoy en <strong>Puerto Ayacucho</strong>:
                    </span>
                    <span className="font-mono font-bold text-sky-500">
                      +{simUpstreamSurge.toFixed(1)} m
                    </span>
                  </div>

                  <input
                    type="range"
                    min={0.2}
                    max={3.5}
                    step={0.1}
                    value={simUpstreamSurge}
                    onChange={(e) => setSimUpstreamSurge(Number(e.target.value))}
                    className="w-full accent-sky-500"
                  />

                  <div className="grid grid-cols-4 gap-1.5 pt-1 text-center text-[11px]">
                    <div className="rounded border border-sky-500/40 bg-sky-500/10 p-2">
                      <div className="font-bold text-sky-500">Día 0</div>
                      <div className="truncate text-[10px] text-slate-500 dark:text-slate-300">
                        Pto. Ayacucho
                      </div>
                      <div className="mt-1 font-mono text-xs font-bold">
                        +{simUpstreamSurge.toFixed(1)}m
                      </div>
                    </div>
                    <div className="rounded border border-purple-500/40 bg-purple-500/10 p-2">
                      <div className="font-bold text-purple-500">Día +7</div>
                      <div className="truncate text-[10px] text-slate-500 dark:text-slate-300">
                        Caicara
                      </div>
                      <div className="mt-1 font-mono text-xs font-bold">
                        ~+{(simUpstreamSurge * 0.72).toFixed(1)}m
                      </div>
                    </div>
                    <div className="rounded border border-emerald-500/40 bg-emerald-500/10 p-2">
                      <div className="font-bold text-emerald-500">Día +14</div>
                      <div className="truncate text-[10px] text-slate-500 dark:text-slate-300">
                        Cd. Bolívar
                      </div>
                      <div className="mt-1 font-mono text-xs font-bold">
                        ~+{(simUpstreamSurge * 0.58).toFixed(1)}m
                      </div>
                    </div>
                    <div className="rounded border border-amber-500/40 bg-amber-500/10 p-2">
                      <div className="font-bold text-amber-500">Día +17</div>
                      <div className="truncate text-[10px] text-slate-500 dark:text-slate-300">
                        Palúa
                      </div>
                      <div className="mt-1 font-mono text-xs font-bold">
                        ~+{(simUpstreamSurge * 0.48).toFixed(1)}m
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Además de los rezagos de otras estaciones (<code className="font-mono">t-7</code>,{" "}
                    <code className="font-mono">t-14</code>, <code className="font-mono">t-17</code>
                    ), cada estación incluye sus propios rezagos autorregresivos (
                    <code className="font-mono">t-1, t-2, t-7, t-14</code>) para capturar la
                    velocidad actual de subida o bajada.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-purple-500/10 p-4 text-xs dark:bg-purple-500/15">
              <span className="text-slate-700 dark:text-slate-200">
                Ahora que tenemos los datos limpios y las variables listas, ¿cómo piensa cada uno de
                los 7 modelos?
              </span>
              <button
                type="button"
                onClick={() => setActiveLesson("arquitecturas-ml")}
                className="shrink-0 rounded-lg bg-purple-600 px-3 py-1.5 font-semibold text-white hover:bg-purple-700"
              >
                Siguiente: Los 7 Modelos →
              </button>
            </div>
          </div>
        )}

        {/* =====================================================================
            MÓDULO 05: ARQUITECTURAS DE ML (LOS 7 MODELOS + VENTANA DESLIZANTE)
           ===================================================================== */}
        {activeLesson === "arquitecturas-ml" && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4 dark:border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-500">
                Módulo 05 • Arquitecturas de Machine Learning y Deep Learning
              </span>
              <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
                4 Familias de Inteligencia Artificial compitiendo en el mismo río
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                En lugar de casarnos con una sola técnica, implementamos el espectro completo de la
                ciencia de datos moderna: desde estadística clásica hasta redes neuronales profundas
                en PyTorch y modelos fundacionales preentrenados por Google. Haz clic en cada modelo
                para ver cómo funciona por dentro:
              </p>
            </div>

            {/* Selector interactivo de los 7 modelos */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: "LSTM", label: "1. LSTM (PyTorch)" },
                { id: "Bi-LSTM", label: "2. Bi-LSTM (PyTorch)" },
                { id: "Transformer", label: "3. Transformer (Atención)" },
                { id: "ARIMAX", label: "4. ARIMAX (Exógeno)" },
                { id: "AutoARIMA", label: "5. AutoARIMA (Univariado)" },
                { id: "TimesFM", label: "6. Google TimesFM (Zero-Shot)" },
                { id: "SimpleML", label: "7. Simple-ML (Baseline)" },
              ].map((m) => {
                const active = selectedModelCard === m.id;
                const color = MODEL_COLORS[m.id] || "#38bdf8";
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedModelCard(m.id)}
                    className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all ${
                      active
                        ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                    }`}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    {m.label}
                  </button>
                );
              })}
            </div>

            {/* Ficha explicativa del modelo seleccionado */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 dark:border-slate-800 dark:bg-slate-900/70">
              {selectedModelCard === "LSTM" && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full bg-emerald-500/15 px-3 py-0.5 text-xs font-bold text-emerald-500">
                      Deep Learning Recurrente • PyTorch
                    </span>
                    <span className="text-xs text-slate-400">
                      Especialidad: Memoria de corto y largo plazo
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    LSTM (Long Short-Term Memory)
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    <strong>La analogía intuitiva:</strong> Imagina un hidrólogo que lee el cuaderno
                    de mediciones día por día y tiene tres compuertas mentales: una{" "}
                    <strong>compuerta de olvido</strong> (descarta pequeñas lluvias irrelevantes de
                    hace semanas), una <strong>compuerta de entrada</strong> (anota en su memoria de
                    largo plazo que en Puerto Ayacucho empezó la gran crecida anual) y una{" "}
                    <strong>compuerta de salida</strong> (decide cuánto medirá el río los próximos 35
                    días).
                  </p>
                  <div className="grid gap-3 pt-2 sm:grid-cols-3">
                    <div className="rounded-lg bg-white p-3 text-xs dark:bg-slate-950">
                      <strong className="text-emerald-500">✔ Fortaleza:</strong> Captura no-linealidades
                      complejas (ej. cuando el cauce se ensancha y el agua sube más lento aunque
                      entre más caudal).
                    </div>
                    <div className="rounded-lg bg-white p-3 text-xs dark:bg-slate-950">
                      <strong className="text-sky-500">⚙ Cómo lo entrenamos:</strong> Recibe ventanas
                      históricas multivariadas (niveles + ondas aguas arriba + reloj cíclico) y
                      predice los 35 días de golpe (Multi-Output).
                    </div>
                    <div className="rounded-lg bg-white p-3 text-xs dark:bg-slate-950">
                      <strong className="text-amber-500">⚠ Cuándo sufre:</strong> Requiere miles de
                      ejemplos y regularización (Dropout + Early Stopping) para no memorizar ruido.
                    </div>
                  </div>
                </div>
              )}

              {selectedModelCard === "Bi-LSTM" && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full bg-purple-500/15 px-3 py-0.5 text-xs font-bold text-purple-500">
                      Deep Learning Bidireccional • PyTorch
                    </span>
                    <span className="text-xs text-slate-400">
                      Especialidad: Lectura en doble sentido del pasado
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Bi-LSTM (Bidirectional LSTM en el Encoder Histórico)
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    <strong>La analogía intuitiva:</strong> Cuando lees una frase difícil, a veces la
                    lees de principio a fin y luego de fin a principio para entender mejor el
                    contexto. La <strong>Bi-LSTM</strong> tiene dos redes LSTM internas que recorren
                    la ventana histórica de entrada (por ejemplo, los últimos 30 días conocidos): una
                    avanza del día <code className="font-mono">t-30 → t</code> y la otra retrocede
                    del día <code className="font-mono">t → t-30</code>.
                  </p>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    <strong>¿Eso rompe la regla de Fuga de Datos?</strong> ¡No! Porque el recorrido
                    bidireccional se hace <strong>exclusivamente dentro de la ventana pasada ya ocurrida</strong>{" "}
                    (el <em>Encoder</em>), jamás sobre los 35 días futuros. Así extrae un resumen
                    riquísimo de la tendencia antes de proyectar hacia adelante.
                  </p>
                </div>
              )}

              {selectedModelCard === "Transformer" && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full bg-amber-500/15 px-3 py-0.5 text-xs font-bold text-amber-500">
                      Atención Multi-Cabezal • PyTorch
                    </span>
                    <span className="text-xs text-slate-400">
                      La misma arquitectura base detrás de los LLMs modernos
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Time Series Transformer (Self-Attention)
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    <strong>La analogía intuitiva:</strong> Mientras que la LSTM lee el pasado día
                    por día en fila india, el <strong>Transformer</strong> despliega todos los días
                    de la ventana sobre una mesa y usa un mecanismo llamado{" "}
                    <strong>Atención Multi-Cabezal (Multi-Head Attention)</strong>. Un &ldquo;cabezal
                    de atención&rdquo; puede enfocarse directamente en lo que pasó en Puerto Ayacucho
                    hace exactamente 14 días, mientras otro cabezal compara la pendiente de esta
                    semana con la de hace un mes.
                  </p>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    Para que no pierda la noción del orden de los días, le inyectamos una{" "}
                    <strong>Codificación Posicional (Positional Encoding)</strong> junto con las
                    variables hidrológicas.
                  </p>
                </div>
              )}

              {selectedModelCard === "ARIMAX" && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full bg-pink-500/15 px-3 py-0.5 text-xs font-bold text-pink-500">
                      Modelo Estadístico con Variables Exógenas (X)
                    </span>
                    <span className="text-xs text-slate-400">
                      Altamente interpretable y veloz
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    ARIMAX (AutoRegressive Integrated Moving Average + Exogenous)
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    <strong>¿Qué significan sus siglas?</strong>
                  </p>
                  <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                    <li>
                      • <strong>AR (Autorregresivo):</strong> Usa una combinación lineal de los
                      últimos niveles de la propia estación.
                    </li>
                    <li>
                      • <strong>I (Integrado):</strong> Trabaja sobre las diferencias diarias (
                      <code className="font-mono">Δy = hoy - ayer</code>) para hacer la serie
                      estacionaria.
                    </li>
                    <li>
                      • <strong>MA (Media Móvil):</strong> Corrige su rumbo aprendiendo de los
                      errores recientes que cometió en los días previos.
                    </li>
                    <li>
                      • <strong>X (Exógeno):</strong> ¡La clave física! Le agregamos el reloj anual (
                      <code className="font-mono">sin_doy, cos_doy</code>) y los niveles de las
                      estaciones aguas arriba en <code className="font-mono">t-7, t-14, t-17</code>.
                    </li>
                  </ul>
                </div>
              )}

              {selectedModelCard === "AutoARIMA" && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full bg-slate-500/15 px-3 py-0.5 text-xs font-bold text-slate-500 dark:text-slate-300">
                      Estadístico Clásico Univariado
                    </span>
                    <span className="text-xs text-slate-400">
                      Punto de referencia estadístico puro
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    AutoARIMA Univariado (Sin variables externas)
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    Busca automáticamente la mejor combinación de parámetros <code className="font-mono">(p, d, q)</code>{" "}
                    minimizando el criterio de información de Akaike (AIC), pero{" "}
                    <strong>mirando únicamente la historia de esa misma estación</strong>, sin saber
                    qué ocurre aguas arriba.
                  </p>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    <strong>Lección didáctica clave:</strong> Si comparas <strong>AutoARIMA</strong>{" "}
                    contra <strong>ARIMAX</strong> en la pestaña de Pronóstico o Métricas, verás en
                    vivo cuánto valor aporta incluir las estaciones aguas arriba y el ciclo anual.
                  </p>
                </div>
              )}

              {selectedModelCard === "TimesFM" && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full bg-blue-500/15 px-3 py-0.5 text-xs font-bold text-blue-500">
                      Modelo Fundacional de Series Temporales • Google Research
                    </span>
                    <span className="text-xs text-slate-400">
                      Inferencia Zero-Shot con contexto largo (256–512 días)
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Google TimesFM (Time Series Foundation Model)
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    <strong>¿Qué es un Modelo Fundacional Zero-Shot?</strong> Así como un modelo de
                    lenguaje aprende gramática leyendo miles de millones de textos,{" "}
                    <strong>TimesFM</strong> fue preentrenado por Google con cientos de miles de
                    millones de puntos de series temporales del mundo real (clima, tráfico, energía,
                    finanzas) divididos en pequeños &ldquo;parches&rdquo; (patches).
                  </p>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    En modalidad <strong>Zero-Shot</strong>, le pasamos directamente los últimos{" "}
                    <strong>256 a 512 días</strong> del Río Orinoco y él proyecta los 35 días
                    siguientes reconociendo la forma de la onda estacional al instante.
                  </p>
                </div>
              )}

              {selectedModelCard === "SimpleML" && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full bg-rose-500/15 px-3 py-0.5 text-xs font-bold text-rose-500">
                      Baseline Precalculado en el Excel Original
                    </span>
                    <span className="text-xs text-slate-400">
                      Línea Roja Punteada en el gráfico
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Simple-ML for Sheets (&ldquo;Forecast with Magic&rdquo;)
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    En todo proyecto serio de Machine Learning necesitas un{" "}
                    <strong>Baseline (línea base a vencer)</strong>. El archivo Excel original traía
                    un pronóstico de los 35 días generado con el complemento automático{" "}
                    <em>Simple ML for Sheets</em> (que descompone tendencia + estacionalidad anual +
                    semanal).
                  </p>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    <strong>¿Por qué lo mostramos en rojo punteado?</strong> Porque ese pronóstico se
                    hizo sobre la hoja <code className="font-mono">Entrenar</code>{" "}
                    <strong>sin corregir el desfase de 638 días ni usar los rezagos aguas arriba</strong>.
                    Comparar nuestras curvas contra Simple-ML demuestra visualmente el impacto de una
                    buena ingeniería de datos.
                  </p>
                </div>
              )}
            </div>

            {/* Explicación interactiva de Ventanas Deslizantes (Sliding Windows) */}
            <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                    Concepto Clave de Deep Learning
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    ¿Cómo se alimenta una Red Neuronal? La Ventana Deslizante (Sliding Window)
                  </h4>
                </div>
                <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-0.5 text-xs dark:border-slate-800">
                  {([14, 30, 60] as const).map((L) => (
                    <button
                      key={L}
                      type="button"
                      onClick={() => setWindowSizeL(L)}
                      className={`rounded-md px-2.5 py-1 font-semibold transition ${
                        windowSizeL === L
                          ? "bg-sky-500 text-white"
                          : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                      }`}
                    >
                      Entrada L = {L} días
                    </button>
                  ))}
                </div>
              </div>

              <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                Una red neuronal (LSTM, Bi-LSTM o Transformer) necesita tensores de tamaño fijo{" "}
                <code className="font-mono">[Batch, L, Features]</code>. Recorremos los 15 años de
                entrenamiento deslizando un marco que toma <strong>L = {windowSizeL} días pasados</strong>{" "}
                como entrada (<code className="font-mono">X</code>) y aprende a predecir de golpe los{" "}
                <strong>H = 35 días siguientes</strong> (<code className="font-mono">Y</code>):
              </p>

              <div className="mt-3 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                <div
                  className="flex flex-col justify-center rounded-lg border border-sky-500/40 bg-sky-500/10 p-3 text-center transition-all"
                  style={{ flex: windowSizeL === 14 ? 1 : windowSizeL === 30 ? 1.6 : 2.4 }}
                >
                  <span className="text-xs font-bold text-sky-600 dark:text-sky-400">
                    Matriz de Entrada X (Pasado Conocido: L = {windowSizeL} días)
                  </span>
                  <span className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-300">
                    {windowSizeL} días × (Cota propia + Lags aguas arriba + sin/cos anual)
                  </span>
                </div>

                <div className="flex items-center justify-center text-slate-400">
                  <ArrowRight className="h-5 w-5 rotate-90 sm:rotate-0" />
                </div>

                <div className="flex flex-1 flex-col justify-center rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-center">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    Vector de Salida Y (Futuro: H = 35 días)
                  </span>
                  <span className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-300">
                    [t+1, t+2, ..., t+35] en metros s.n.m.
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-sky-500/10 p-4 text-xs dark:bg-sky-500/15">
              <span className="text-slate-700 dark:text-slate-200">
                Por último: ¿cómo decidimos cuál de los 7 modelos ganó en cada estación?
              </span>
              <button
                type="button"
                onClick={() => setActiveLesson("metricas-evaluacion")}
                className="shrink-0 rounded-lg bg-sky-500 px-3 py-1.5 font-semibold text-white hover:bg-sky-600"
              >
                Siguiente: Las 4 Métricas →
              </button>
            </div>
          </div>
        )}

        {/* =====================================================================
            MÓDULO 06: MÉTRICAS DE EVALUACIÓN (RMSE, MAE, MAPE, R²)
           ===================================================================== */}
        {activeLesson === "metricas-evaluacion" && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4 dark:border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500">
                Módulo 06 • Evaluación Científica en el Test Set
              </span>
              <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
                Cómo leer RMSE, MAE, MAPE y R² sin ser matemático
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                En la pestaña <strong>Métricas</strong> evaluamos a todos los modelos en el{" "}
                <strong>Test Set</strong> (los últimos 86 días reales antes del pronóstico ciego).
                Cada una de las 4 columnas responde una pregunta práctica distinta sobre los errores
                del modelo:
              </p>
            </div>

            {/* Tarjetas de las 4 métricas */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    1. MAE (Error Absoluto Medio)
                  </span>
                  <span className="rounded bg-sky-500/15 px-2 py-0.5 font-mono text-xs font-bold text-sky-500">
                    En metros (m) • Menor es mejor ↓
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  <strong>En español llano:</strong> Es el promedio simple de por cuántos centímetros
                  o metros se equivoca el modelo cada día, sin importar si se pasó por arriba o por
                  abajo. Si un modelo tiene <code className="font-mono">MAE = 0.080 m</code>,
                  significa que en promedio se desvía apenas <strong>8 centímetros</strong> del nivel
                  real del río.
                </p>
              </div>

              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 dark:bg-emerald-950/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    2. RMSE (Raíz del Error Cuadrático Medio)
                  </span>
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-mono text-xs font-bold text-emerald-500">
                    Métrica Reina • Menor es mejor ↓
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  <strong>¿Por qué usamos RMSE para coronar al mejor modelo?</strong> Porque antes de
                  promediar los errores, <strong>los eleva al cuadrado</strong>. En hidrología y
                  alertas de inundación, equivocarse por 10 cm todos los días es tolerable, pero
                  equivocarse un día por 2 metros enteros es peligroso. El RMSE castiga severamente
                  los picos de error grandes.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    3. MAPE (Error Porcentual Absoluto Medio)
                  </span>
                  <span className="rounded bg-purple-500/15 px-2 py-0.5 font-mono text-xs font-bold text-purple-500">
                    En porcentaje (%) • Menor es mejor ↓
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  <strong>¿Para qué sirve?</strong> Equivocarse por 20 cm cuando el río mide 40
                  metros en Puerto Ayacucho es un porcentaje diminuto (0.5%), pero equivocarse por 20
                  cm cuando Ciudad Bolívar está en aguas bajas de 3 metros es mucho más notorio. El
                  MAPE mide el error en proporción a la altura de esa estación.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    4. R² (Coeficiente de Determinación)
                  </span>
                  <span className="rounded bg-amber-500/15 px-2 py-0.5 font-mono text-xs font-bold text-amber-500">
                    Máximo ideal = 1.000 • Mayor es mejor ↑
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  <strong>La nota del examen:</strong> Compara a nuestro modelo contra un &ldquo;modelo
                  bobo&rdquo; que siempre prediga el promedio histórico constante.
                  <br />• <strong>R² cercano a 1.000 (ej. 0.985):</strong> El modelo captura casi el
                  100% de la subida y bajada real del río.
                  <br />• <strong>R² = 0:</strong> No es mejor que adivinar el promedio.
                  <br />• <strong>R² negativo:</strong> ¡Es peor que trazar una línea recta!
                </p>
              </div>
            </div>

            {/* Mini-demostración interactiva: Por qué RMSE castiga más que MAE */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/70">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-500">
                    Experimento Interactivo
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    ¿Por qué el RMSE siempre es mayor o igual al MAE?
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setHasSpikeError((prev) => !prev)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    hasSpikeError
                      ? "bg-rose-500 text-white"
                      : "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  }`}
                >
                  {hasSpikeError
                    ? "Quitar día con error grave (Volver a errores parejos)"
                    : "Simular 1 solo día con un error grave (+1.50m)"}
                </button>
              </div>

              <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                Imagina 5 días de pronóstico. En los primeros 4 días el modelo se equivoca apenas por{" "}
                <strong>0.10 m</strong> (10 cm). Haz clic en el botón para ver qué pasa con el{" "}
                <strong>MAE</strong> y el <strong>RMSE</strong> si en el 5° día comete un error brusco:
              </p>

              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg bg-white p-3 dark:bg-slate-950">
                  <div className="text-[10px] text-slate-400">Errores en los 5 días</div>
                  <div className="mt-1 font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                    0.10, 0.10, 0.10, 0.10,{" "}
                    <span className={hasSpikeError ? "font-bold text-rose-500" : ""}>
                      {hasSpikeError ? "1.50m" : "0.10m"}
                    </span>
                  </div>
                </div>
                <div className="rounded-lg bg-white p-3 dark:bg-slate-950">
                  <div className="text-[10px] text-slate-400">MAE (Promedio simple)</div>
                  <div className="mt-1 font-mono text-sm font-bold text-sky-500">
                    {hasSpikeError ? "0.380 m" : "0.100 m"}
                  </div>
                </div>
                <div className="rounded-lg bg-white p-3 dark:bg-slate-950">
                  <div className="text-[10px] text-slate-400">RMSE (Castiga el pico²)</div>
                  <div className="mt-1 font-mono text-sm font-bold text-emerald-500">
                    {hasSpikeError ? "0.677 m (¡Salta casi el doble!)" : "0.100 m"}
                  </div>
                </div>
                <div className="rounded-lg bg-white p-3 dark:bg-slate-950">
                  <div className="text-[10px] text-slate-400">Conclusión</div>
                  <div className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">
                    {hasSpikeError
                      ? "Un solo error grave dispara el RMSE mucho más que el MAE."
                      : "Cuando todos los errores son uniformes, MAE y RMSE valen igual."}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-emerald-500/10 p-4 text-xs dark:bg-emerald-500/15">
              <span className="text-slate-700 dark:text-slate-200">
                ¡Felicidades! Ya dominas la física, la ingeniería de datos y los 7 modelos del
                proyecto. Pon a prueba lo aprendido en las pestañas interactivas:
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onNavigateTab("metrics")}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white hover:bg-emerald-700"
                >
                  Ir a Tabla de Métricas
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab("forecast")}
                  className="rounded-lg bg-sky-500 px-3 py-1.5 font-semibold text-white hover:bg-sky-600"
                >
                  Ir a Pronóstico 35d
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
