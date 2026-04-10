@echo off
title Configuracion Firebase - Douglas CONSBA
color 0A

echo.
echo  ========================================
echo    Configuracion automatica Firebase
echo    Douglas CONSBA
echo  ========================================
echo.
echo  Paso 1: Iniciando sesion en Google/Firebase...
echo  (Se abrira el navegador, acepta el acceso)
echo.

SET PATH=%PATH%;C:\Users\%USERNAME%\AppData\Roaming\npm;C:\Program Files\nodejs

call firebase login

echo.
echo  ========================================
echo  Paso 2: Ejecutando configuracion...
echo  ========================================
echo.

node auto-setup.js

echo.
pause
