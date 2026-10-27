import type { Metadata } from "next";
import "./globals.css";
import { DevLifecycleWatcher } from "@/components/DevLifecycleWatcher";

export const metadata: Metadata = {
  title: "Orinoco HydroForecast | Predicción Hidrométrica del Río Orinoco",
  description:
    "Plataforma de monitoreo, análisis de propagación de onda y pronóstico multimodelo (AutoARIMA, ARIMAX, LSTM, Bi-LSTM, Transformer, Google TimesFM) para las estaciones del Río Orinoco.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#060c18] dark:text-slate-100">
        <DevLifecycleWatcher />
        {children}
      </body>
    </html>
  );
}
