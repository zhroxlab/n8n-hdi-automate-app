# HDI Automate

## Tecnologías

### Frontend
- React 18
- Vite
- TypeScript
- TailwindCSS
- Electron (para versión de escritorio)
- Radix UI (componentes accesibles)
- React Router
- React Query

### Backend
- Node.js
- MongoDB
- n8n (para automatización de flujos)

## Inicio rápido

### Desarrollo del Frontend

```bash
# Navegar a la carpeta frontend
cd frontend

# Instalar dependencias
npm install

# Iniciar el servidor de desarrollo
npm run dev
```

El frontend estará disponible en `http://localhost:5173`.

### Desarrollo con Electron

```bash
# En la carpeta frontend
npm run electron:dev
```

### Construir aplicación de escritorio

```bash
# En la carpeta frontend
npm run electron:build
```

### Iniciar backend (n8n)

```bash
# En la carpeta raíz
npm install
npm run start-n8n
```

El servidor n8n estará disponible en `http://localhost:5678`.

## Normalización de rutas

El proyecto utiliza un sistema de normalización de rutas para manejar archivos en diferentes sistemas operativos:

- `normalizePath`: Convierte rutas según el SO (Windows o Unix)
- `encodePathForApi`: Codifica rutas para uso seguro en APIs y URLs

Ejemplo:
```typescript
import { normalizePath, encodePathForApi } from '@/hooks/useElectron';

// Normalizar ruta según SO
const normalizedPath = normalizePath('/ruta/archivo.xlsx');

// Preparar para API
const apiPath = encodePathForApi(normalizedPath);
```

## Estructura de archivos

```
frontend/
├── src/                 # Código fuente
│   ├── components/      # Componentes React
│   ├── hooks/           # Hooks personalizados
│   ├── lib/             # Utilidades y API
│   ├── styles/          # Estilos CSS
│   └── App.tsx          # Componente principal
├── electron/            # Archivos para Electron
└── public/              # Archivos estáticos
```
