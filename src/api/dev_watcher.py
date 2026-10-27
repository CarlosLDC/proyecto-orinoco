"""
Dev Watcher: Módulo para sincronizar el ciclo de vida del navegador con los servidores de desarrollo.
Cierra los procesos automáticamente cuando la pestaña del navegador se cierra,
respetando navegación interna, múltiples pestañas y recargas (F5).
"""

import os
import signal
import time
import threading
from typing import Dict, Optional
from fastapi import APIRouter, Request
from pydantic import BaseModel

router = APIRouter(prefix="/api/dev", tags=["Dev Watcher"])

class HeartbeatPayload(BaseModel):
    tab_id: str

class DevWatcher:
    def __init__(self, grace_period_seconds: float = 4.0, max_silence_seconds: float = 6.0):
        self.grace_period_seconds = grace_period_seconds
        self.max_silence_seconds = max_silence_seconds
        self.active_tabs: Dict[str, float] = {}
        self.lock = threading.Lock()
        self.has_connected = False
        self.shutdown_timer: Optional[threading.Timer] = None
        self.monitor_thread: Optional[threading.Thread] = None
        self.is_shutting_down = False

    def start_background_monitor(self):
        if self.monitor_thread is None:
            self.monitor_thread = threading.Thread(target=self._monitor_loop, daemon=True)
            self.monitor_thread.start()

    def record_heartbeat(self, tab_id: str):
        with self.lock:
            self.has_connected = True
            self.active_tabs[tab_id] = time.time()
            if self.shutdown_timer is not None:
                self.shutdown_timer.cancel()
                self.shutdown_timer = None
        self.start_background_monitor()

    def record_tab_closed(self, tab_id: str):
        with self.lock:
            if tab_id in self.active_tabs:
                del self.active_tabs[tab_id]
            if not self.active_tabs and self.has_connected and not self.is_shutting_down:
                if self.shutdown_timer is None:
                    self.shutdown_timer = threading.Timer(self.grace_period_seconds, self._trigger_shutdown)
                    self.shutdown_timer.start()

    def _monitor_loop(self):
        while not self.is_shutting_down:
            time.sleep(1.0)
            with self.lock:
                if not self.has_connected or self.is_shutting_down:
                    continue
                now = time.time()
                # Eliminar pestañas inactivas que hayan dejado de responder
                stale_tabs = [tid for tid, last_t in self.active_tabs.items() if (now - last_t) > self.max_silence_seconds]
                for tid in stale_tabs:
                    del self.active_tabs[tid]

                if not self.active_tabs and self.shutdown_timer is None:
                    self.shutdown_timer = threading.Timer(self.grace_period_seconds, self._trigger_shutdown)
                    self.shutdown_timer.start()

    def _trigger_shutdown(self):
        with self.lock:
            if self.is_shutting_down:
                return
            if self.active_tabs:
                self.shutdown_timer = None
                return
            self.is_shutting_down = True

        print("\n" + "=" * 60)
        print("🛑 Pestaña del navegador cerrada. Deteniendo servidores...")
        print("=" * 60)

        def _kill():
            time.sleep(0.3)
            try:
                # En Windows o Unix matar el proceso actual de uvicorn
                if os.name == "nt":
                    os.kill(os.getpid(), signal.SIGTERM)
                else:
                    os.kill(os.getpid(), signal.SIGINT)
            except Exception:
                os._exit(0)

        threading.Thread(target=_kill, daemon=True).start()

watcher = DevWatcher()

@router.post("/heartbeat")
def heartbeat(payload: HeartbeatPayload):
    watcher.record_heartbeat(payload.tab_id)
    return {"status": "ok", "active_tabs": len(watcher.active_tabs)}

@router.post("/tab-closed")
async def tab_closed(request: Request):
    tab_id = "default"
    try:
        body = await request.body()
        if body:
            import json
            data = json.loads(body.decode("utf-8"))
            tab_id = data.get("tab_id", tab_id)
    except Exception:
        pass
    watcher.record_tab_closed(tab_id)
    return {"status": "closing_grace_period_started"}
