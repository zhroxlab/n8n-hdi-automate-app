#!/bin/bash

# Instalar dependencias si es necesario
if [ ! -d "node_modules" ]; then
  echo "Instalando dependencias..."
  npm install
fi

# Comprobar si hay cambios en package.json
if [ "$(git diff --name-only package.json)" != "" ]; then
  echo "Se detectaron cambios en package.json, instalando dependencias..."
  npm install
fi

# Ejecutar en modo desarrollo con Electron
echo "Iniciando aplicación en modo Electron..."
npm run electron:dev
