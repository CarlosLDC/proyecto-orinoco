#!/usr/bin/env bash

# Colores para la salida
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Validar entorno virtual
if [ ! -f ".venv/bin/uvicorn" ]; then
    echo -e "${RED}❌ Entorno virtual no configurado o uvicorn ausente.${NC}"
    echo -e "Ejecuta primero: ${BLUE}make install${NC} o ${BLUE}./setup.sh${NC}"
    exit 1
fi

# Validar node_modules en frontend
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${RED}❌ Dependencias de frontend no instaladas.${NC}"
    echo -e "Ejecuta primero: ${BLUE}make install${NC} o ${BLUE}./setup.sh${NC}"
    exit 1
fi

# Avisos si los puertos ya están ocupados
if lsof -i :8000 >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Aviso: El puerto 8000 ya está en uso. Si tienes otra instancia del backend corriendo, ciérrala primero.${NC}"
fi

if lsof -i :3000 >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Aviso: El puerto 3000 ya está en uso. Si tienes otra instancia de Next.js corriendo, ciérrala primero.${NC}"
fi

echo -e "${BLUE}==============================================${NC}"
echo -e "${BLUE}  🌊 Proyecto Orinoco - Levantando Servidores ${NC}"
echo -e "${BLUE}==============================================${NC}"
echo -e "  🌐 Backend API:  ${CYAN}http://localhost:8000${NC} (Docs: ${CYAN}http://localhost:8000/docs${NC})"
echo -e "  💻 Frontend Web: ${GREEN}http://localhost:3000${NC}"
echo -e "  Presiona ${YELLOW}Ctrl + C${NC} para detener ambos servidores."
echo -e "${BLUE}==============================================${NC}\n"

# 1. Iniciar Backend FastAPI
./.venv/bin/uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Breve pausa para orden en los logs iniciales
sleep 1

# 2. Iniciar Frontend Next.js
(cd frontend && npm run dev) &
FRONTEND_PID=$!

# Limpieza ordenada de procesos al salir o presionar Ctrl+C
cleanup() {
    trap - SIGINT SIGTERM EXIT
    echo -e "\n${YELLOW}🛑 Deteniendo servidores de Proyecto Orinoco...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    wait $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# Esperar a que terminen los procesos
wait $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
