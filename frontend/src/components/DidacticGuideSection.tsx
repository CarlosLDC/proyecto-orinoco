"use client";

import React, { useState } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";
import { MODEL_COLORS, StationMetadata, MetricItem } from "@/lib/api";

interface DidacticGuideSectionProps {
  stations: StationMetadata[];
  metrics: MetricItem[];
  selectedStation: string;
  onSelectStation: (stationId: string) => void;
  onNavigateTab: (tab: "forecast" | "metrics" | "wave") => void;
}

type ChapterId =
  | "intuicion"
  | "basura"
  | "trampa"
  | "senales"
  | "cerebros"
  | "notas";

const CHAPTERS: { id: ChapterId; num: string; title: string; hook: string }[] = [
  {
    id: "intuicion",
    num: "01",
    title: "¿Qué es predecir?",
    hook: "La física de una bañera gigante",
  },
  {
    id: "basura",
    num: "02",
    title: "Datos envenenados",
    hook: "Cuando un error humano engaña a la IA",
  },
  {
    id: "trampa",
    num: "03",
    title: "La máquina del tiempo",
    hook: "Por qué no puedes barajar los días",
  },
  {
    id: "senales",
    num: "04",
    title: "Traducir el mundo",
    hook: "Cómo un algoritmo siente el calendario y la distancia",
  },
  {
    id: "cerebros",
    num: "05",
    title: "7 formas de pensar",
    hook: "De una regla matemática a un transformer",
  },
  {
    id: "notas",
    num: "06",
    title: "¿Quién ganó el examen?",
    hook: "Por qué equivocarse por 1 metro duele más que 10 errores de 10 cm",
  },
];

export default function DidacticGuideSection({
  stations,
  selectedStation,
  onSelectStation,
  onNavigateTab,
}: DidacticGuideSectionProps) {
  const [chapter, setChapter] = useState<ChapterId>("intuicion");

  // --- Cap 01: El juego de predecir la cota ---
  const [userGuess, setUserGuess] = useState<number>(5.2);
  const [guessSubmitted, setGuessSubmitted] = useState<boolean>(false);
  const targetTomorrow = 5.08; // El río viene bajando suavemente en estiaje

  // --- Cap 02: El error humano ---
  const [fixTypo, setFixTypo] = useState<boolean>(false);

  // --- Cap 03: Barajar vs Cronológico ---
  const [shuffledView, setShuffledView] = useState<boolean>(false);

  // --- Cap 04: El círculo del tiempo ---
  const [daySlider, setDaySlider] = useState<number>(364); // 30 dic

  // --- Cap 05: El modelo activo ---
  const [activeModel, setActiveModel] = useState<string>("LSTM");

  // --- Cap 06: El simulador de castigo al error ---
  const [errorProfile, setErrorProfile] = useState<"uniforme" | "catastrofico">("uniforme");

  const currentIdx = CHAPTERS.findIndex((c) => c.id === chapter);
  const nextChapter = CHAPTERS[currentIdx + 1];

  // Cálculo trigonométrico interactivo
  const sinVal = Math.sin((2 * Math.PI * daySlider) / 365.25);
  const cosVal = Math.cos((2 * Math.PI * daySlider) / 365.25);

  return (
    <div className="rounded-xl border border-slate-200/70 bg-white p-5 dark:border-slate-800/80 dark:bg-slate-900/40">
      {/* Header con índice visual claro */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800/70">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-500">
            Aprende Machine Learning desde cero
          </span>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            La física y la matemática del Río Orinoco explicadas sin rodeos
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 p-0.5 text-xs dark:border-slate-800">
          {CHAPTERS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setChapter(c.id)}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                chapter === c.id
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <span className="mr-1 opacity-50">{c.num}</span>
              {c.title}
            </button>
          ))}
        </div>
      </div>

      {/* =========================================================================
          CAPÍTULO 01: LA INTUICIÓN FUNDAMENTAL
         ========================================================================= */}
      {chapter === "intuicion" && (
        <div className="mt-5 space-y-6">
          <div className="max-w-3xl space-y-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Ponte en los zapatos de la máquina: ¿cómo predecirías tú el río mañana?
            </h3>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              Imagina que estás parado en el malecón de Ciudad Bolívar. El río Orinoco no es una
              lotería ni una acción de bolsa que sube o baja por pánico. Es una gigantesca masa de
              agua de miles de kilómetros gobernada por la inercia:
            </p>
          </div>

          {/* Dinámica interactiva: Haz tu primera predicción manual */}
          <div className="rounded-lg border border-slate-200/80 p-4 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-sky-500 uppercase tracking-wide">
              Experimento mental #1
            </span>
            <h4 className="mt-1 text-xs font-semibold text-slate-900 dark:text-white">
              Si el río midió 5.30 m anteayer y 5.18 m ayer... ¿cuánto medirá hoy?
            </h4>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Estamos en febrero (época seca). El río viene bajando suavemente. Arrastra la barra y
              haz tu estimación:
            </p>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex-1">
                <input
                  type="range"
                  min={4.5}
                  max={6.0}
                  step={0.01}
                  value={userGuess}
                  disabled={guessSubmitted}
                  onChange={(e) => setUserGuess(parseFloat(e.target.value))}
                  className="w-full accent-sky-500"
                />
                <div className="mt-1 flex justify-between text-[11px] font-mono text-slate-400">
                  <span>4.50 m (caída brusca)</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    Tu apuesta: {userGuess.toFixed(2)} m
                  </span>
                  <span>6.00 m (crecida irreal)</span>
                </div>
              </div>

              <div className="flex gap-2">
                {!guessSubmitted ? (
                  <button
                    type="button"
                    onClick={() => setGuessSubmitted(true)}
                    className="rounded-lg bg-sky-500 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-600"
                  >
                    Confirmar predicción
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setGuessSubmitted(false)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300"
                  >
                    <RotateCcw className="h-3 w-3" /> Probar otra vez
                  </button>
                )}
              </div>
            </div>

            {guessSubmitted && (
              <div className="mt-4 rounded-lg bg-slate-50 p-3.5 text-xs text-slate-600 dark:bg-slate-900/80 dark:text-slate-300">
                <p>
                  El valor real medido fue <strong>{targetTomorrow.toFixed(2)} m</strong> (siguió
                  su pendiente natural cayendo 10 cm). Tu error fue de solo{" "}
                  <strong className="text-sky-500 font-mono">
                    {Math.abs(userGuess - targetTomorrow).toFixed(2)} m
                  </strong>
                  .
                </p>
                <p className="mt-1.5 text-slate-500 dark:text-slate-400">
                  Acabas de aplicar sin darte cuenta los tres pilares del Machine Learning:
                  <strong> inercia autorregresiva</strong> (miraste ayer),
                  <strong> tendencia local</strong> (viste que bajaba) y
                  <strong> contexto estacional</strong> (sabías que en febrero no llueve a cántaros).
                  Una red neuronal hace exactamente eso, pero calculando millones de correlaciones
                  simultáneas.
                </p>
              </div>
            )}
          </div>

          {/* Las dos fuentes de información del río */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200/70 p-3.5 dark:border-slate-800/80">
              <strong className="text-xs font-semibold text-slate-900 dark:text-white">
                1. La memoria local (El agua que ya está aquí)
              </strong>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Si hoy el río está en 10 metros, mañana es imposible físicamente que esté en 3 metros
                o en 20 metros. El agua tarda días en drenar. El pasado inmediato de la misma
                estación es el 80% de la respuesta.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200/70 p-3.5 dark:border-slate-800/80">
              <strong className="text-xs font-semibold text-slate-900 dark:text-white">
                2. El espía aguas arriba (La ola que viene en camino)
              </strong>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Si cae un aguacero torrencial en la selva de Puerto Ayacucho, esa masa de agua tardará
                <strong> 14 días</strong> en llegar a Ciudad Bolívar. Saber qué pasó hace 2 semanas
                aguas arriba es como tener una ventana al futuro.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          CAPÍTULO 02: DATOS ENVENENADOS (GIGO)
         ========================================================================= */}
      {chapter === "basura" && (
        <div className="mt-5 space-y-6">
          <div className="max-w-3xl space-y-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Una IA no tiene sentido común: aprenderá ciegamente lo que le des
            </h3>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              En Machine Learning existe la máxima <em>&quot;Garbage In, Garbage Out&quot;</em> (si
              metes basura, obtienes basura). Los modelos no &quot;sienten&quot; el río; solo buscan
              fórmulas matemáticas que unan números. Mira este caso real que encontramos en el
              dataset original:
            </p>
          </div>

          {/* Interactivo de Outlier: Haz clic para reparar */}
          <div className="rounded-lg border border-slate-200/80 p-4 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-amber-500 uppercase tracking-wide">
                Caso real: Estación Palúa (29 de octubre de 2021)
              </span>
              <button
                type="button"
                onClick={() => setFixTypo(!fixTypo)}
                className={`rounded px-2.5 py-1 text-xs font-semibold transition ${
                  fixTypo
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-amber-500 text-white hover:bg-amber-600"
                }`}
              >
                {fixTypo ? "✓ Dato Limpio (Interpolado)" : "Corregir dedazo humano"}
              </button>
            </div>

            {/* Simulación visual de la serie con el error */}
            <div className="mt-4 grid grid-cols-5 gap-2 text-center text-xs font-mono">
              <div className="rounded bg-slate-50 p-2 dark:bg-slate-900">
                <div className="text-[10px] text-slate-400">27-Oct</div>
                <div className="mt-1 font-semibold text-slate-700 dark:text-slate-200">8.65 m</div>
              </div>
              <div className="rounded bg-slate-50 p-2 dark:bg-slate-900">
                <div className="text-[10px] text-slate-400">28-Oct</div>
                <div className="mt-1 font-semibold text-slate-700 dark:text-slate-200">8.73 m</div>
              </div>
              <div
                className={`rounded p-2 transition ${
                  fixTypo
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold"
                    : "bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold ring-2 ring-rose-500"
                }`}
              >
                <div className="text-[10px] opacity-75">29-Oct</div>
                <div className="mt-1">{fixTypo ? "8.79 m" : "9.79 m (!)"}</div>
              </div>
              <div className="rounded bg-slate-50 p-2 dark:bg-slate-900">
                <div className="text-[10px] text-slate-400">30-Oct</div>
                <div className="mt-1 font-semibold text-slate-700 dark:text-slate-200">8.86 m</div>
              </div>
              <div className="rounded bg-slate-50 p-2 dark:bg-slate-900">
                <div className="text-[10px] text-slate-400">31-Oct</div>
                <div className="mt-1 font-semibold text-slate-700 dark:text-slate-200">8.92 m</div>
              </div>
            </div>

            <div className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {!fixTypo ? (
                <p>
                  ⚠️ <strong>¿Qué pasó aquí?</strong> Un transcriptor humano presionó el{" "}
                  <code className="font-mono text-rose-500 font-bold">9</code> en vez del{" "}
                  <code className="font-mono text-slate-800 dark:text-slate-200 font-bold">8</code>.
                  El río subió 1 metro entero en 24 horas y al día siguiente cayó 1 metro. Si le
                  pasas esto a una red neuronal, aprenderá que un río de 3 kilómetros de ancho puede
                  comportarse como un resorte loco.
                </p>
              ) : (
                <p>
                  ✅ <strong>Reparado con sentido físico:</strong> Borramos el valor corrupto y
                  trazamos una línea recta entre el día anterior (8.73m) y el posterior (8.86m).
                  Ahora la red neuronal aprenderá la suave curva natural del río.
                </p>
              )}
            </div>
          </div>

          {/* El caso del corrimiento de 638 días */}
          <div className="rounded-lg border border-slate-200/70 p-3.5 text-xs text-slate-600 dark:border-slate-800/80 dark:text-slate-300">
            <h4 className="font-semibold text-slate-900 dark:text-white">
              El fantasma de Ciudad Bolívar: un olvido que desfasó 2 años enteros
            </h4>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              En la hoja de Excel donde pegaron los datos a mano faltaba una sola fecha: el 1 de enero
              de 2020. Al pegar hacia abajo, los 638 días siguientes quedaron corridos un casillero
              hacia atrás. El modelo creía que el río crecía en fechas donde en realidad ya estaba
              bajando. Por eso descartamos esa hoja y reconstruimos todo matemáticamente desde las
              hojas de registro primarias.
            </p>
          </div>
        </div>
      )}

      {/* =========================================================================
          CAPÍTULO 03: LA MÁQUINA DEL TIEMPO (DATA LEAKAGE)
         ========================================================================= */}
      {chapter === "trampa" && (
        <div className="mt-5 space-y-6">
          <div className="max-w-3xl space-y-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              ¿Por qué en series de tiempo está terminantemente prohibido barajar?
            </h3>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              En problemas típicos de machine learning (como reconocer si una foto es un perro o un
              gato), mezclas todas las fotos como una baraja de cartas antes de entrenar. Si haces eso
              con un río, creas una paradoja temporal:
            </p>
          </div>

          {/* Demostración interactiva: Barajar vs Cronológico */}
          <div className="rounded-lg border border-slate-200/80 p-4 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-sky-500 uppercase tracking-wide">
                Simulador de examen
              </span>
              <button
                type="button"
                onClick={() => setShuffledView(!shuffledView)}
                className="rounded px-2.5 py-1 text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                {shuffledView ? "Ver orden real cronológico" : "Simular trampa (Barajar fechas)"}
              </button>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-3 text-xs">
              {!shuffledView ? (
                <>
                  <div className="rounded border border-sky-500/40 bg-sky-500/5 p-3">
                    <div className="font-semibold text-sky-600 dark:text-sky-400">
                      1. Entrenamiento (El Pasado)
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">2009 – 2023</div>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">
                      El modelo solo estudia libros de historia cerrados. Jamás ha visto qué pasó en
                      2024 ni 2025.
                    </p>
                  </div>
                  <div className="rounded border border-slate-200 p-3 dark:border-slate-800">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      2. Validación (Simulacro)
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">Ene – Nov 2024</div>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">
                      Simulamos que estamos en 2024 para ajustar la red sin quemar las preguntas del
                      examen final.
                    </p>
                  </div>
                  <div className="rounded border border-emerald-500/40 bg-emerald-500/5 p-3">
                    <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                      3. Examen Final (El Futuro)
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">Dic 24 – Feb 25</div>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">
                      86 días totalmente ciegos. Aquí descubrimos si aprendió la física o si solo era
                      un loro repitiendo.
                    </p>
                  </div>
                </>
              ) : (
                <div className="sm:col-span-3 rounded bg-rose-500/10 p-3 text-rose-600 dark:text-rose-400">
                  <strong>🚨 Trampa detectada (Data Leakage):</strong> Si barajamos los días, el
                  modelo usará el día 15 de marzo de 2024 para adivinar el 14 de marzo de 2024. ¡Es
                  como hacer un examen con las respuestas anotadas en la mano! En el laboratorio te
                  dará 99.9% de precisión, pero al ponerlo a predecir el futuro real fracasará por
                  completo.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200/70 p-3.5 text-xs text-slate-600 dark:border-slate-800/80 dark:text-slate-300">
            <strong className="text-slate-900 dark:text-white">
              La regla de los 35 días a ciegas:
            </strong>{" "}
            Cuando hoy es 24 de febrero y queremos predecir hasta el 31 de marzo, no podemos usar la
            medición real de mañana para predecir pasado mañana, porque mañana aún no ha ocurrido.
            Nuestros modelos lanzan los 35 días en un solo disparo simultáneo o van alimentando la
            cola con sus propias estimaciones previas.
          </div>
        </div>
      )}

      {/* =========================================================================
          CAPÍTULO 04: TRADUCIR EL MUNDO (FEATURE ENGINEERING)
         ========================================================================= */}
      {chapter === "senales" && (
        <div className="mt-5 space-y-6">
          <div className="max-w-3xl space-y-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              ¿Cómo le dices a una máquina qué día del año es sin confundirla?
            </h3>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              Si le dices al modelo que hoy es el día 365 (31 de diciembre) y mañana es el día 1 (1
              de enero), la máquina pensará que hubo un salto catastrófico de 364 unidades de
              distancia, cuando en realidad pasaron solo 24 horas. Para resolverlo usamos la magia de
              la trigonometría:
            </p>
          </div>

          {/* El reloj circular interactivo */}
          <div className="rounded-lg border border-slate-200/80 p-4 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-sky-500 uppercase tracking-wide">
                El reloj estacional del Orinoco
              </span>
              <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                Día {daySlider} de 365
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Mueve el control hasta el día 365 y luego al día 1. Observa cómo los números son casi
              idénticos:
            </p>

            <input
              type="range"
              min={1}
              max={365}
              value={daySlider}
              onChange={(e) => setDaySlider(parseInt(e.target.value))}
              className="mt-3 w-full accent-sky-500"
            />

            <div className="mt-3 grid grid-cols-2 gap-3 text-center font-mono text-xs">
              <div className="rounded bg-slate-50 p-2 dark:bg-slate-900">
                <span className="text-[10px] text-slate-400 block">Seno (Eje Y del círculo)</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {sinVal.toFixed(3)}
                </span>
              </div>
              <div className="rounded bg-slate-50 p-2 dark:bg-slate-900">
                <span className="text-[10px] text-slate-400 block">Coseno (Eje X del círculo)</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {cosVal.toFixed(3)}
                </span>
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              💡 <strong>¿Por qué funciona?</strong> Porque enrollamos el año en un reloj de 360
              grados. El 31 de diciembre está pegado al 1 de enero en el círculo. Así el modelo
              entiende de forma continua cuándo empieza la temporada de lluvias y cuándo la sequía sin
              sufrir saltos matemáticos.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200/70 p-3.5 text-xs text-slate-600 dark:border-slate-800/80 dark:text-slate-300">
            <h4 className="font-semibold text-slate-900 dark:text-white">
              Los retrovisores físicos: Lags de 7, 14 y 17 días
            </h4>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              No le pedimos a la IA que adivine el futuro de la nada. Para pronosticar Ciudad Bolívar
              le entregamos como variables qué nivel tenía Puerto Ayacucho hace 14 días. Es la
              velocidad real a la que viaja el agua por el lecho del río.
            </p>
          </div>
        </div>
      )}

      {/* =========================================================================
          CAPÍTULO 05: 7 FORMAS DE PENSAR (ARQUITECTURAS)
         ========================================================================= */}
      {chapter === "cerebros" && (
        <div className="mt-5 space-y-6">
          <div className="max-w-3xl space-y-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              No hay una sola IA: 7 cerebros con distintas personalidades
            </h3>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              Cada arquitectura analiza el río desde un ángulo filosófico diferente. Selecciona un
              modelo para entender cómo &quot;piensa&quot; con una analogía de la vida real:
            </p>
          </div>

          {/* Selector de modelos estilo chips */}
          <div className="flex flex-wrap gap-1.5">
            {["LSTM", "Bi-LSTM", "Transformer", "ARIMAX", "AutoARIMA", "TimesFM", "SimpleML"].map(
              (m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setActiveModel(m)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
                    activeModel === m
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: MODEL_COLORS[m] }}
                  />
                  {m}
                </button>
              )
            )}
          </div>

          {/* Tarjeta explicativa con analogía viva */}
          <div className="rounded-lg border border-slate-200/80 p-4 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-sky-500">
                {activeModel === "SimpleML" ? "Simple-ML (Baseline)" : activeModel}
              </span>
              <span className="text-[11px] text-slate-400">
                {activeModel === "ARIMAX" || activeModel === "AutoARIMA"
                  ? "Estadística Matemática"
                  : activeModel === "TimesFM"
                  ? "Modelo Fundacional (Google)"
                  : activeModel === "SimpleML"
                  ? "Referencia a vencer"
                  : "Red Neuronal Profunda"}
              </span>
            </div>

            <div className="mt-3 space-y-3 text-xs leading-relaxed">
              {activeModel === "LSTM" && (
                <>
                  <p className="text-slate-700 dark:text-slate-200 font-medium">
                    🧠 <strong>La analogía del estudiante con libreta de notas:</strong>
                  </p>
                  <p className="text-slate-500 dark:text-slate-400">
                    La LSTM lee los días uno tras otro en orden. Tiene compuertas de olvido: si lee
                    que llovió una tarde cualquiera pero el mes sigue siendo seco, borra ese dato de
                    su libreta para no alarmarse. Pero si lee que durante 10 días seguidos el río
                    crece con fuerza, graba eso en su memoria de largo plazo y proyecta una gran
                    crecida.
                  </p>
                </>
              )}

              {activeModel === "Bi-LSTM" && (
                <>
                  <p className="text-slate-700 dark:text-slate-200 font-medium">
                    🧠 <strong>La analogía del detective que relee la carta:</strong>
                  </p>
                  <p className="text-slate-500 dark:text-slate-400">
                    Cuando lees un párrafo complejo, muchas veces vas hasta el final y luego vuelves
                    hacia atrás para entender mejor las intenciones. La Bi-LSTM tiene dos redes: una
                    lee el pasado hacia adelante (de hace un mes hacia hoy) y otra retrocede (de hoy
                    hacia hace un mes). Une ambas visiones para comprender el estado real del río con
                    máxima claridad.
                  </p>
                </>
              )}

              {activeModel === "Transformer" && (
                <>
                  <p className="text-slate-700 dark:text-slate-200 font-medium">
                    🧠 <strong>La analogía del estratega con mapa desplegado:</strong>
                  </p>
                  <p className="text-slate-500 dark:text-slate-400">
                    No lee día por día como las LSTM. Pone todos los 30 días pasados sobre una mesa al
                    mismo tiempo y usa &quot;Atención&quot;: traza líneas invisibles entre el día de hoy y
                    lo que pasó hace 14 días en Puerto Ayacucho. Es la misma tecnología en la que se
                    basan los grandes modelos como ChatGPT o Gemini, adaptada a la hidrología.
                  </p>
                </>
              )}

              {activeModel === "ARIMAX" && (
                <>
                  <p className="text-slate-700 dark:text-slate-200 font-medium">
                    🧠 <strong>La analogía del físico calculista con ecuación en mano:</strong>
                  </p>
                  <p className="text-slate-500 dark:text-slate-400">
                    No usa neuronas ni capas ocultas. Usa una fórmula transparente y elegante: toma la
                    altura de ayer, le resta la anteayer para ver la velocidad de cambio, y le suma el
                    aporte de las estaciones aguas arriba multiplicado por factores fijos. Es súper
                    rápido y muy confiable en tramos regulares.
                  </p>
                </>
              )}

              {activeModel === "AutoARIMA" && (
                <>
                  <p className="text-slate-700 dark:text-slate-200 font-medium">
                    🧠 <strong>El ermitaño con ojos vendados:</strong>
                  </p>
                  <p className="text-slate-500 dark:text-slate-400">
                    Es exactamente igual a ARIMAX, pero se niega a mirar lo que ocurre aguas arriba.
                    Intenta adivinar el río solo con su propio pasado. En la pestaña de métricas verás
                    que casi siempre queda de último lugar: demuestra científicamente que la geografía
                    y el río interconectado sí importan.
                  </p>
                </>
              )}

              {activeModel === "TimesFM" && (
                <>
                  <p className="text-slate-700 dark:text-slate-200 font-medium">
                    🧠 <strong>El experto trotamundos de Google (Zero-Shot):</strong>
                  </p>
                  <p className="text-slate-500 dark:text-slate-400">
                    Nunca antes había visto el Río Orinoco. Pero Google lo entrenó previamente con
                    cientos de miles de millones de ondas del mundo (temperatura global, mareas,
                    viento, energía solar). Con solo mostrarle un fragmento largo del río, reconoce la
                    estacionalidad del planeta de inmediato y proyecta la curva sin necesidad de
                    entrenarlo desde cero.
                  </p>
                </>
              )}

              {activeModel === "SimpleML" && (
                <>
                  <p className="text-slate-700 dark:text-slate-200 font-medium">
                    🧠 <strong>El pronóstico automático de Excel (El rival a vencer):</strong>
                  </p>
                  <p className="text-slate-500 dark:text-slate-400">
                    Vino empaquetado en el archivo original con la función &quot;Forecast with Magic&quot;.
                    No corrigió errores humanos ni sabe de física de ríos. Lo mantenemos como línea
                    roja punteada en el gráfico para demostrar objetivamente cuánto valor aporta el
                    diseño científico frente a un botón mágico sin supervisión.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          CAPÍTULO 06: EL EXAMEN (MÉTRICAS RMSE vs MAE)
         ========================================================================= */}
      {chapter === "notas" && (
        <div className="mt-5 space-y-6">
          <div className="max-w-3xl space-y-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              ¿Por qué no basta con el promedio? La lección del error cuadrático
            </h3>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              Cuando ves la tabla de <strong>Métricas</strong>, los modelos están ordenados por{" "}
              <strong>RMSE</strong> y no por <strong>MAE</strong>. ¿Cuál es la diferencia práctica?
              Descúbrelo con este experimento:
            </p>
          </div>

          {/* El experimento del error cuadrático */}
          <div className="rounded-lg border border-slate-200/80 p-4 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-emerald-500 uppercase tracking-wide">
                Simulador de impacto de error
              </span>
              <div className="flex gap-1 rounded border border-slate-200 p-0.5 text-xs dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setErrorProfile("uniforme")}
                  className={`rounded px-2 py-0.5 font-medium transition ${
                    errorProfile === "uniforme"
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                      : "text-slate-400"
                  }`}
                >
                  Errores pequeños parejos
                </button>
                <button
                  type="button"
                  onClick={() => setErrorProfile("catastrofico")}
                  className={`rounded px-2 py-0.5 font-medium transition ${
                    errorProfile === "catastrofico"
                      ? "bg-rose-500 text-white"
                      : "text-slate-400"
                  }`}
                >
                  Un solo error catastrófico
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 text-xs">
              <div className="rounded bg-slate-50 p-3 dark:bg-slate-900">
                <span className="text-[11px] text-slate-400 block">
                  Errores cometidos en 5 días de pronóstico:
                </span>
                <span className="mt-1 font-mono font-bold text-sm text-slate-800 dark:text-slate-200 block">
                  {errorProfile === "uniforme"
                    ? "10 cm, 10 cm, 10 cm, 10 cm, 10 cm"
                    : "10 cm, 10 cm, 10 cm, 10 cm, 150 cm (1.5 metros)"}
                </span>
                <p className="mt-2 text-slate-500 dark:text-slate-400">
                  {errorProfile === "uniforme"
                    ? "El modelo tuvo un desempeño modesto pero estable todos los días."
                    : "El modelo acertó casi perfecto 4 días, pero en uno solo se equivocó por 1.5 metros."}
                </p>
              </div>

              <div className="rounded border border-slate-200/70 p-3 dark:border-slate-800">
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-500">MAE (Promedio simple):</span>
                  <span className="font-mono font-bold text-sky-500 text-sm">
                    {errorProfile === "uniforme" ? "0.10 m (10 cm)" : "0.38 m (38 cm)"}
                  </span>
                </div>
                <div className="mt-2 flex justify-between items-baseline border-t border-slate-100 pt-2 dark:border-slate-800">
                  <span className="text-slate-900 dark:text-white font-semibold">
                    RMSE (Penaliza desastres²):
                  </span>
                  <span className="font-mono font-bold text-emerald-500 text-sm">
                    {errorProfile === "uniforme"
                      ? "0.10 m (10 cm)"
                      : "0.68 m (¡Casi el doble del MAE!)"}
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-slate-400">
                  En hidrología, un error de 1.5 metros inunda una población o vara un barco de carga.
                  Por eso preferimos modelos que tengan un RMSE bajo, aunque su MAE sea parecido.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-sky-500/5 border border-sky-500/20 p-3.5 text-xs text-slate-600 dark:text-slate-300">
            <span>
              ¿Listo para ver quién ganó el examen con datos reales? Visita la tabla de métricas y la
              gráfica de pronóstico:
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onNavigateTab("metrics")}
                className="font-semibold text-sky-500 hover:underline"
              >
                Ir a Métricas →
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab("forecast")}
                className="font-semibold text-sky-500 hover:underline"
              >
                Ir a Pronóstico →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pie de navegación simple entre capítulos */}
      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400 dark:border-slate-800/70">
        <span>
          Capítulo {CHAPTERS[currentIdx].num} de 06 — {CHAPTERS[currentIdx].title}
        </span>

        {nextChapter ? (
          <button
            type="button"
            onClick={() => setChapter(nextChapter.id)}
            className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white"
          >
            Siguiente: {nextChapter.title} ({nextChapter.hook}) <ArrowRight className="h-3 w-3" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onNavigateTab("forecast")}
            className="inline-flex items-center gap-1 font-semibold text-sky-500 hover:underline"
          >
            Ver pronóstico en vivo <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}
