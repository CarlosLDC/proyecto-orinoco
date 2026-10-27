.PHONY: help install dev backend frontend test clean

help:
	@echo "Comandos disponibles en Proyecto Orinoco:"
	@echo "  make install  - Instala todas las dependencias (Backend Python venv + Frontend npm)"
	@echo "  make dev      - Inicia ambos servidores en paralelo (FastAPI en :8000 y Next.js en :3000)"
	@echo "  make backend  - Inicia únicamente el servidor backend FastAPI"
	@echo "  make frontend - Inicia únicamente el servidor frontend Next.js"
	@echo "  make test     - Ejecuta las pruebas del backend con pytest"
	@echo "  make clean    - Elimina archivos temporales y caches"

install:
	@python3 run.py setup

dev:
	@python3 run.py dev

backend:
	@python3 run.py backend

frontend:
	@python3 run.py frontend

test:
	@python3 run.py test

clean:
	@rm -rf __pycache__ .pytest_cache frontend/.next .venv/lib/*/site-packages/**/__pycache__
