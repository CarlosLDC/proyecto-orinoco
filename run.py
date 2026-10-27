#!/usr/bin/env python3
"""
Proyecto Orinoco - Cross-Platform Automation Runner
Compatible con Windows (CMD/PowerShell), Linux y macOS.
"""

import sys
import os
import shutil
import subprocess
import signal
import time
import socket
import threading
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = ROOT_DIR / "frontend"
IS_WINDOWS = os.name == "nt"

def find_available_port(start_port: int, host: str = "127.0.0.1", max_attempts: int = 50) -> int:
    """Busca el primer puerto disponible a partir de start_port."""
    for port in range(start_port, start_port + max_attempts):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind((host, port))
                return port
            except OSError:
                continue
    raise RuntimeError(f"No se encontró un puerto libre a partir de {start_port}")

def get_npm_cmd() -> str:
    """Devuelve el comando npm adecuado para el sistema."""
    if IS_WINDOWS:
        return "npm.cmd" if shutil.which("npm.cmd") else "npm"
    return "npm"

def get_venv_python() -> Path:
    """Devuelve la ruta al ejecutable de Python del entorno virtual según el SO."""
    if IS_WINDOWS:
        candidate = ROOT_DIR / ".venv" / "Scripts" / "python.exe"
    else:
        candidate = ROOT_DIR / ".venv" / "bin" / "python"
    return candidate

def open_browser_when_ready(url: str, timeout: float = 30.0):
    """Espera a que Next.js responda y abre el navegador automáticamente."""
    import urllib.request
    import webbrowser

    def _probe():
        start = time.time()
        while time.time() - start < timeout:
            try:
                with urllib.request.urlopen(url, timeout=1.0) as resp:
                    if resp.status == 200:
                        time.sleep(0.3)
                        print(f"\n🚀 Abriendo automáticamente la pestaña en el navegador: {url}")
                        webbrowser.open(url)
                        return
            except Exception:
                time.sleep(0.4)
        # Timeout: intentar abrirlo de todas formas
        webbrowser.open(url)

    threading.Thread(target=_probe, daemon=True).start()

def kill_process_tree(proc: subprocess.Popen):
    """Mata un proceso y todos sus subprocesos hijos de forma limpia y cruzada."""
    if not proc or proc.poll() is not None:
        return
    try:
        if IS_WINDOWS:
            # En Windows taskkill /F /T asegura matar todos los subprocesos (node, uvicorn, etc.)
            subprocess.run(
                ["taskkill", "/F", "/T", "/PID", str(proc.pid)],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                check=False,
            )
        else:
            try:
                os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
            except Exception:
                proc.terminate()
    except Exception:
        pass

def cmd_setup():
    """Instala todas las dependencias del backend y frontend."""
    print("=" * 60)
    print("  🌊 Proyecto Orinoco - Instalación Completa")
    print("=" * 60)

    # 1. Comprobar Node.js / npm
    npm_cmd = get_npm_cmd()
    if not shutil.which(npm_cmd):
        print("❌ Error: 'npm' no fue encontrado en el PATH del sistema.")
        print("   Por favor instala Node.js desde https://nodejs.org")
        sys.exit(1)

    # 2. Configurar entorno virtual
    venv_dir = ROOT_DIR / ".venv"
    venv_python = get_venv_python()

    print("\n📦 [1/2] Configurando Backend y Entorno Virtual Python...")
    if not venv_dir.exists() or not venv_python.exists():
        print(f"  Creando entorno virtual en {venv_dir}...")
        subprocess.check_call([sys.executable, "-m", "venv", str(venv_dir)])
    else:
        print(f"  Entorno virtual existente detectado en {venv_dir}.")

    print("  Instalando dependencias de Python (requirements.txt)...")
    subprocess.check_call([str(venv_python), "-m", "pip", "install", "--upgrade", "pip"])
    subprocess.check_call([str(venv_python), "-m", "pip", "install", "-r", str(ROOT_DIR / "requirements.txt")])
    print("✓ Dependencias de Python listas.")

    # 3. Configurar Frontend
    print("\n📦 [2/2] Instalando dependencias del Frontend (npm install)...")
    subprocess.check_call([npm_cmd, "install"], cwd=str(FRONTEND_DIR))
    print("✓ Dependencias de Frontend listas.")

    print("\n" + "=" * 60)
    print("  ✅ ¡Instalación completada con éxito!")
    print("=" * 60)
    print("Para iniciar ambos servidores simultáneamente ejecuta:")
    if IS_WINDOWS:
        print("  dev.bat   o   python run.py dev")
    else:
        print("  make dev   o   ./dev.sh   o   python3 run.py dev")
    print()

def cmd_dev():
    """Levanta los servidores de Backend y Frontend en simultáneo."""
    venv_python = get_venv_python()
    if not venv_python.exists():
        print("❌ Entorno virtual no encontrado.")
        print("   Ejecuta primero: python run.py setup (o dev.bat / make install)")
        sys.exit(1)

    npm_cmd = get_npm_cmd()
    if not (FRONTEND_DIR / "node_modules").exists():
        print("❌ Dependencias del frontend no encontradas.")
        print("   Ejecuta primero: python run.py setup (o dev.bat / make install)")
        sys.exit(1)

    backend_port = find_available_port(8000)
    frontend_port = find_available_port(3000)

    print("=" * 60)
    print("  🌊 Proyecto Orinoco - Levantando Servidores")
    print("=" * 60)
    print(f"  🌐 Backend API:  http://localhost:{backend_port}  (Docs: http://localhost:{backend_port}/docs)")
    print(f"  💻 Frontend Web: http://localhost:{frontend_port}")
    if backend_port != 8000 or frontend_port != 3000:
        print(f"  ℹ️  Se asignaron puertos alternativos libres ({backend_port} / {frontend_port})")
    print("  💡 Presiona Ctrl + C en esta terminal para detener ambos servidores.")
    print("=" * 60 + "\n")

    backend_proc = None
    frontend_proc = None

    try:
        # Pre-exec fn para crear un nuevo process group en Unix
        preexec = os.setsid if not IS_WINDOWS else None

        # 1. Iniciar FastAPI
        backend_cmd = [
            str(venv_python),
            "-m",
            "uvicorn",
            "src.api.main:app",
            "--host",
            "0.0.0.0",
            "--port",
            str(backend_port),
            "--reload",
        ]
        backend_proc = subprocess.Popen(
            backend_cmd,
            cwd=str(ROOT_DIR),
            preexec_fn=preexec,
        )

        time.sleep(1)

        # 2. Iniciar Next.js
        frontend_env = os.environ.copy()
        frontend_env["PORT"] = str(frontend_port)
        frontend_env["BACKEND_PORT"] = str(backend_port)

        frontend_proc = subprocess.Popen(
            [npm_cmd, "run", "dev", "--", "-p", str(frontend_port)],
            cwd=str(FRONTEND_DIR),
            preexec_fn=preexec,
            env=frontend_env,
        )

        # 3. Abrir navegador automáticamente cuando el frontend esté listo
        open_browser_when_ready(f"http://localhost:{frontend_port}")

        # Esperar a que alguno termine o se presione Ctrl+C
        while True:
            if backend_proc.poll() is not None:
                break
            if frontend_proc.poll() is not None:
                break
            time.sleep(0.5)

    except KeyboardInterrupt:
        print("\n🛑 Detención solicitada por el usuario...")
    finally:
        print("🛑 Deteniendo servidores...")
        if backend_proc:
            kill_process_tree(backend_proc)
        if frontend_proc:
            kill_process_tree(frontend_proc)
        print("✓ Servidores detenidos limpiamente.")

def cmd_backend():
    """Inicia únicamente el servidor backend FastAPI."""
    venv_python = get_venv_python()
    if not venv_python.exists():
        print("❌ Entorno virtual no encontrado. Ejecuta: python run.py setup")
        sys.exit(1)
    backend_port = find_available_port(8000)
    print(f"Iniciando Backend en http://localhost:{backend_port} (Docs: http://localhost:{backend_port}/docs)...")
    backend_cmd = [
        str(venv_python),
        "-m",
        "uvicorn",
        "src.api.main:app",
        "--host",
        "0.0.0.0",
        "--port",
        str(backend_port),
        "--reload",
    ]
    sys.exit(subprocess.call(backend_cmd, cwd=str(ROOT_DIR)))

def cmd_frontend():
    """Inicia únicamente el servidor frontend Next.js."""
    npm_cmd = get_npm_cmd()
    frontend_port = find_available_port(3000)
    print(f"Iniciando Frontend en http://localhost:{frontend_port}...")
    frontend_env = os.environ.copy()
    frontend_env["PORT"] = str(frontend_port)
    sys.exit(subprocess.call([npm_cmd, "run", "dev", "--", "-p", str(frontend_port)], cwd=str(FRONTEND_DIR), env=frontend_env))

def cmd_test():
    """Ejecuta los tests del backend con pytest."""
    venv_python = get_venv_python()
    if not venv_python.exists():
        print("❌ Entorno virtual no encontrado. Ejecuta: python run.py setup")
        sys.exit(1)
    sys.exit(subprocess.call([str(venv_python), "-m", "pytest"], cwd=str(ROOT_DIR)))

def main():
    if len(sys.argv) < 2 or sys.argv[1] in ("-h", "--help", "help"):
        print("Uso: python run.py <comando>")
        print("\nComandos disponibles:")
        print("  setup (o install) - Instala todas las dependencias (Python + Node.js)")
        print("  dev               - Inicia ambos servidores (Backend :8000 y Frontend :3000)")
        print("  backend           - Inicia únicamente el backend FastAPI")
        print("  frontend          - Inicia únicamente el frontend Next.js")
        print("  test              - Ejecuta las pruebas unitarias con pytest")
        sys.exit(0)

    cmd = sys.argv[1].lower()
    if cmd in ("setup", "install"):
        cmd_setup()
    elif cmd == "dev":
        cmd_dev()
    elif cmd == "backend":
        cmd_backend()
    elif cmd == "frontend":
        cmd_frontend()
    elif cmd == "test":
        cmd_test()
    else:
        print(f"Comando desconocido: '{cmd}'. Ejecuta 'python run.py --help' para ver opciones.")
        sys.exit(1)

if __name__ == "__main__":
    main()
