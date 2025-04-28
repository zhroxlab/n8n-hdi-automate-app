# HDI Automate

Este proyecto está dividido en dos partes independientes para evitar conflictos de sistemas de módulos:

1. **Scripts y Backend (carpeta raíz)**: Utiliza CommonJS para scripts de procesamiento de datos y servidor n8n.
2. **Frontend (carpeta frontend)**: Utiliza ESM para la aplicación React.

## Requisitos Previos

- Node.js v18 o superior
- npm v8 o superior
- MongoDB instalado y ejecutándose (localhost:27017)
- Git

## Instalación y Configuración Inicial

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/hdi_automate.git
cd hdi_automate
```

### 2. Configurar el Backend (Scripts y n8n)

```bash
# Instalar dependencias en la raíz (solo MongoDB, n8n y xlsx)
npm install
```

Verificar que el archivo `package.json` en la raíz tenga `"type": "commonjs"` y solo las dependencias necesarias:

```json
{
  "name": "hdi-scripts",
  "version": "1.0.0",
  "type": "commonjs",
  "scripts": {
    "start-n8n": "npx n8n"
  },
  "dependencies": {
    "mongodb": "^6.16.0",
    "n8n": "^1.88.0",
    "xlsx": "^0.20.2"
  }
}
```

### 3. Configurar el Frontend

```bash
# Navegar a la carpeta frontend
cd frontend

# Instalar dependencias del frontend
npm install
```

Verificar que el archivo `frontend/package.json` tenga `"type": "module"`.

## Estructura del Proyecto

```
hdi_automate/
│
├── data/                       # Datos y scripts
│   ├── _scripts/               # Scripts de procesamiento
│   │   ├── code-data-cp-to-db/    # Script para cargar CP a MongoDB
│   │   └── code-data-gestion-to-db/ # Script para cargar gestión a MongoDB
│   │
│   ├── _gestion/               # Archivos Excel de gestión
│   ├── _cp/                    # Archivos Excel de CP
│   └── ...                     # Otros directorios de datos
│
├── frontend/                   # Aplicación React/Vite
│   ├── src/                    # Código fuente del frontend
│   │   ├── components/         # Componentes reutilizables
│   │   ├── config/             # Configuración (endpoints, etc.)
│   │   └── ...                 # Otros archivos del frontend
│   │
│   ├── package.json            # Dependencias del frontend (ESM)
│   ├── vite.config.ts          # Configuración de Vite
│   └── tsconfig.json           # Configuración de TypeScript
│
├── package.json                # Dependencias scripts/n8n (CommonJS)
└── README.md                   # Este archivo
```

## Ejecución

### 1. Iniciar n8n (Backend)

```bash
# En la carpeta raíz
npm run start-n8n
```

El servidor n8n se iniciará en `http://localhost:5678`. Accede a esta URL para ver la interfaz de n8n.

### 2. Iniciar el Frontend

```bash
# En una nueva terminal, navega a la carpeta frontend
cd frontend

# Inicia el servidor de desarrollo
npm run dev
```

El frontend estará disponible en `http://localhost:8080`.

## Uso de Endpoints

Los endpoints disponibles para integración entre el frontend y n8n son:

| Endpoint | Método | Descripción | Parámetros |
|----------|--------|-------------|------------|
| `/webhook/app_hdi_readFile` | POST | Carga un archivo de gestión | `{ "pathGestion": "./ruta/archivo.xlsx" }` |
| `/webhook/app_hdi_readFile/documents` | GET | Obtiene documentos de gestión | - |
| `/webhook/app_hdi_cpToDB` | POST | Carga archivo CP | `{ "rutaCP": "./ruta/archivo.xlsx" }` |
| `/webhook/app_hdi_tiraToDB` | POST | Carga archivos de tiras | `{ "rutaNCR": "./ruta/ncr.xlsx", "rutaDiebold": "./ruta/diebold.xlsx" }` |
| `/webhook/app_hdi_loadFileHistorico` | POST | Carga archivo histórico | `{ "pathExcel": "./ruta/archivo.xlsx", ... }` |

## Flujo de Trabajo Típico

1. Inicia el servidor n8n
2. Inicia el servidor de desarrollo del frontend
3. Configura las rutas de los archivos en la interfaz del frontend
4. Ejecuta las cargas de datos a través de la interfaz
5. Visualiza y procesa los resultados

## Directrices para Desarrolladores

### Modificación de Scripts (CommonJS)

Los scripts en `data/_scripts/` utilizan CommonJS y están configurados para procesar archivos Excel y cargarlos en MongoDB. Si necesitas modificar estos scripts:

1. Mantén la sintaxis CommonJS (`require()` en lugar de `import`)
2. Utiliza rutas absolutas o funciones como `path.resolve()`
3. Mantén las funciones de normalización existentes para limpieza de datos

### Modificación del Frontend (ESM)

El frontend utiliza ESM y React. Al modificar el frontend:

1. Utiliza la sintaxis ESM (`import` en lugar de `require()`)
2. Mantén los componentes en carpetas organizadas
3. Las rutas de importación deben usar el alias `@/` (ej. `import Button from '@/components/ui/button'`)


## Mantenimiento

- **Actualización de dependencias**: Actualiza las dependencias por separado para el backend y el frontend
- **Logs**: Revisa los logs de n8n y del frontend para detectar problemas
