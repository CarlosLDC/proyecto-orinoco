@echo off
setlocal
cd /d "%~dp0"

echo =======================================================
echo   Proyecto Orinoco - Instalacion en Windows
echo =======================================================

where py >nul 2>nul
if %errorlevel% equ 0 (
    py -3 run.py setup %*
    goto end
)

where python >nul 2>nul
if %errorlevel% equ 0 (
    python run.py setup %*
    goto end
)

echo [ERROR] No se encontro Python instalado en el sistema.
echo Descargalo desde https://www.python.org/ (recuerda marcar "Add python.exe to PATH").
pause
exit /b 1

:end
exit /b %errorlevel%
