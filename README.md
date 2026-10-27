# Orinoco HydroForecast — Frontend (Next.js)

Plataforma interactiva de monitoreo, análisis hidrodinámico de propagación de onda y pronóstico multimodelo de series temporales (cota en m s.n.m.) para las 4 estaciones del Río Orinoco:
1. **Puerto Ayacucho** (`puerto_ayacucho`)
2. **Caicara del Orinoco** (`caicara`)
3. **Ciudad Bolívar** (`ciudad_bolivar`)
4. **Palúa** (`palua`)

## Ejecución Rápida

1. **Iniciar el Backend FastAPI** (en `/home/carlos/proyecto-orinoco-backend`, puerto `8000`):
   ```bash
   cd /home/carlos/proyecto-orinoco-backend
   ./.venv/bin/uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload
   ```

2. **Iniciar el Frontend Next.js** (en `/home/carlos/proyecto-orinoco-frontend`, puerto `3000`):
   ```bash
   cd /home/carlos/proyecto-orinoco-frontend
   npm run dev
   ```

3. Abrir en el navegador: **`http://localhost:3000`**
