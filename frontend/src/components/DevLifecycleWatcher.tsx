"use client";

import { useEffect, useRef } from "react";

/**
 * DevLifecycleWatcher:
 * Monitorea la presencia del navegador enviando un heartbeat periódico al backend.
 * Al cerrarse la pestaña, notifica inmediatamente para que los servidores finalicen de forma limpia.
 */
export function DevLifecycleWatcher() {
  const tabIdRef = useRef<string>("");

  useEffect(() => {
    // Generar o recuperar ID persistente de la pestaña actual
    const tabId =
      sessionStorage.getItem("orinoco_dev_tab_id") ||
      `tab_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem("orinoco_dev_tab_id", tabId);
    tabIdRef.current = tabId;

    // Enviar heartbeat cada 1.5s
    const sendHeartbeat = () => {
      fetch("/backend-api/api/dev/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tab_id: tabId }),
        keepalive: true,
      }).catch(() => {
        // Silenciar errores en caso de apagado o recarga
      });
    };

    // Heartbeat inicial
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 1500);

    // Notificar cierre de pestaña
    const handleClose = () => {
      const payload = JSON.stringify({ tab_id: tabId });
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon("/backend-api/api/dev/tab-closed", blob);
      } else {
        fetch("/backend-api/api/dev/tab-closed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    };

    window.addEventListener("pagehide", handleClose);
    window.addEventListener("beforeunload", handleClose);

    return () => {
      clearInterval(interval);
      window.removeEventListener("pagehide", handleClose);
      window.removeEventListener("beforeunload", handleClose);
    };
  }, []);

  return null;
}
