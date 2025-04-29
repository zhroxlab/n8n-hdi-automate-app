# HDI AI Flow

## Descripción General

HDI AI Flow es un sistema inteligente de evaluación de diferencias en cajeros automáticos desarrollado por HDI Colombia. Esta aplicación web proporciona capacidades avanzadas de análisis para operaciones de cajeros automáticos (ATM) con un solo clic.

## Características

- Evaluación inteligente de diferencias en cajeros automáticos
- Capacidades avanzadas de análisis
- Interfaz fácil de usar
- Procesamiento en tiempo real
- Seguimiento visual del progreso

## Tecnologías Utilizadas

Este proyecto está construido con tecnologías web modernas:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:
- Node.js y npm - [instalar con nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

## Primeros Pasos

Sigue estos pasos para configurar el proyecto localmente:

```sh
# Clonar el repositorio
git clone <repository-url>

# Navegar al directorio del proyecto
cd app_hdi_frontend

# Instalar dependencias
npm install

# Iniciar el servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:5173` por defecto.

## Uso

1. Inicia la aplicación en tu navegador web
2. Haz clic en el botón "Iniciar" para comenzar el proceso de evaluación
3. Sigue las instrucciones en pantalla para completar el análisis de diferencias del cajero automático
4. Visualiza los resultados en el área de visualización proporcionada

## Desarrollo

Para contribuir al proyecto:

1. Crea una nueva rama para tu funcionalidad
2. Realiza tus cambios
3. Envía una solicitud de integración (pull request)

## Soporte

Para soporte y consultas, por favor contacta al equipo de desarrollo de HDI Colombia.

---

Desarrollado con ❤️ por HDI Colombia

## HDI Automation

### Descripción
Aplicación para automatización de procesos en HDI Colombia.

### Ahora con soporte para Electron!
Esta aplicación ahora puede ejecutarse como una aplicación de escritorio nativa utilizando Electron.

### Requisitos
- Node.js 16.x o superior
- npm 8.x o superior

### Instalación

```bash
# Instalar dependencias
npm install
```

### Ejecución en modo desarrollo

```bash
# Ejecutar en modo desarrollo web
npm run dev

# Ejecutar en modo desarrollo con Electron
npm run electron:dev
# O usar el script helper
./run-electron.sh
```

### Construcción para producción

```bash
# Construcción web
npm run build

# Construcción para aplicación de escritorio (Electron)
npm run electron:build
```

### Creación de instaladores

```bash
# Generar instaladores para la plataforma actual
npm run electron:make
```

### Estructura del proyecto
```
frontend/
├── electron/               # Configuración y archivos para Electron
│   ├── main.cjs            # Punto de entrada para Electron (CommonJS)
│   └── preload.cjs         # Script de precarga para comunicación segura (CommonJS)
├── src/
│   ├── components/         # Componentes reutilizables
│   │   └── electron/       # Componentes específicos para Electron
│   ├── hooks/              # Custom hooks
│   │   └── useElectron.ts  # Hook para interactuar con Electron
│   ├── pages/              # Páginas de la aplicación
│   ├── utils/              # Utilidades
│   │   └── electronUtils.ts # Utilidades específicas para Electron
│   ├── App.tsx             # Componente principal de la aplicación
│   └── main.tsx            # Punto de entrada de React
├── index.html              # HTML principal
├── package.json            # Dependencias y scripts
└── run-electron.sh         # Script helper para ejecutar en modo Electron
```

### Características de Electron
- **Barra de título personalizada**: Con controles para minimizar, maximizar y cerrar
- **Acceso a APIs del sistema**: A través del preload.cjs y el hook useElectron
- **Construcción de instaladores**: Para Windows, macOS y Linux

### Notas sobre la implementación de Electron
- Los archivos de Electron utilizan la extensión `.cjs` (CommonJS) para ser compatibles con el `"type": "module"` definido en package.json
- Esta configuración permite que el proyecto funcione tanto en modo web como en modo Electron sin conflictos
