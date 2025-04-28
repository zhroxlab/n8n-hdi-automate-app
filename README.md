# HDI Automation

Aplicación de automatización para HDI que combina un frontend en React con servicios de automatización n8n.

## Requisitos Previos

- Node.js (versión 18 o superior)
- npm (incluido con Node.js)
- MongoDB instalado y ejecutándose localmente o una conexión a MongoDB Atlas

## Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/zhroxlab/n8n-hdi-automate-app.git
cd n8n-hdi-automate-app
```

2. Instala las dependencias:
```bash
npm install
```



## Estructura del Proyecto

- `src/`: Código fuente del frontend
  - `components/`: Componentes React reutilizables
  - `pages/`: Páginas de la aplicación
  - `hooks/`: Custom hooks de React
  - `lib/`: Utilidades y funciones auxiliares
- `data/`: Directorio para almacenar archivos de datos
  - `FlujosJson/`: Flujos de trabajo de n8n
  - `_cp/`: Datos de control de procesos
  - `_gestion/`: Archivos de gestión
  - `_historico/`: Datos históricos
  - `_scripts/`: Scripts de migración y utilidades
  - `_tools/`: Herramientas y calculadoras

## Scripts Disponibles

### Frontend
- `npm run dev`: Inicia el servidor de desarrollo

### n8n

- `npx n8n`: Inicia el servidor de n8n

## Tecnologías Principales

### Frontend
- React 18
- Vite
- TypeScript
- Tailwind CSS
- Radix UI
- React Query

### Backend y Automatización
- n8n: Plataforma de automatización de flujos de trabajo
- MongoDB: Base de datos
- XLSX: Manejo de archivos Excel

## Licencia

Este proyecto es privado y su uso está restringido a HDI Colombia.
