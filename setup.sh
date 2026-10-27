#!/usr/bin/env bash
set -e

# Colores para la salida
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}==============================================${NC}"
echo -e "${BLUE}  🌊 Proyecto Orinoco - Instalación Completa  ${NC}"
echo -e "${BLUE}==============================================${NC}"

# Verificar Python 3
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Error: python3 no está instalado en el sistema.${NC}"
    exit 1
fi

# Verificar Node / npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ Error: npm/Node.js no está instalado en el sistema.${NC}"
    exit 1
fi

# 1. Configuración del Backend (Python)
echo -e "\n${YELLOW}📦 [1/2] Configurando Backend y Entorno Virtual Python...${NC}"
if [ ! -d ".venv" ]; then
    echo "  Creando entorno virtual en .venv..."
    python3 -m venv .venv
else
    echo "  Entorno virtual existente detectado en .venv."
fi

echo "  Instalando dependencias de Python (requirements.txt)..."
./.venv/bin/pip install --upgrade pip
./.venv/bin/pip install -r requirements.txt
echo -e "${GREEN}✓ Dependencias de Python listas.${NC}"

# 2. Configuración del Frontend (Next.js)
echo -e "\n${YELLOW}📦 [2/2] Instalando dependencias del Frontend (npm install)...${NC}"
cd frontend
npm install
cd ..
echo -e "${GREEN}✓ Dependencias de Frontend listas.${NC}"

echo -e "\n${GREEN}==============================================${NC}"
echo -e "${GREEN}  ✅ ¡Instalación completada con éxito!       ${NC}"
echo -e "${GREEN}==============================================${NC}"
echo -e "Para levantar ambos servidores simultáneamente ejecuta:"
echo -e "  ${BLUE}make dev${NC}  o  ${BLUE}./dev.sh${NC}\n"
