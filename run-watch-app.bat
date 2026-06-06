@echo off
title Watch Authenticator (local) - manten esta ventana abierta
cd /d "C:\Users\Yuri\Documents\watch-authenticator\apps\web"
echo ===============================================================
echo   WATCH AUTHENTICATOR - servidor local
echo.
echo   Manten esta ventana ABIERTA mientras usas la app.
echo   Para cerrar la app: cierra esta ventana (o pulsa Ctrl+C).
echo   El navegador se abrira solo en unos segundos...
echo ===============================================================
echo.
start "" /b powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep 9; Start-Process 'http://localhost:3000'"
call npx next dev
echo.
echo La app se ha detenido. Pulsa una tecla para cerrar.
pause >nul
