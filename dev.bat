@echo off
setlocal
cd /d "%~dp0"

echo =======================================================
echo   Proyecto Orinoco - Servidores en Windows
echo =======================================================

where py >nul 2>nul
if %errorlevel% equ 0 (
    py -3 run.py dev %*
    goto end
)

where python >nul 2>nul
if %errorlevel% equ 0 (
    python run.py dev %*
    goto end
)

echo [ERROR] No se encontro Python instalado en el sistema.
pause
exit /b 1

:end
exit /b %errorlevel%
