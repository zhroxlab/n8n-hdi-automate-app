# Automate App

Este proyecto es una aplicación de automatización que utiliza n8n para crear flujos de trabajo automatizados, con integración de MongoDB para el almacenamiento de datos y soporte para archivos Excel.

## Requisitos Previos

- Node.js (versión 14 o superior)
- npm (incluido con Node.js)
- MongoDB instalado y ejecutándose localmente o una conexión a MongoDB Atlas

## Instalación

1. Clona el repositorio:
```bash
git clone [URL_DEL_REPOSITORIO]
cd automate_app
```

2. Instala las dependencias:
```bash
npm install
```

3. Instala n8n globalmente (opcional, pero recomendado):
```bash
npm install n8n -g
```

## Configuración

1. Asegúrate de que MongoDB esté ejecutándose en tu sistema local o configura la conexión a MongoDB Atlas.

2. Para iniciar n8n, puedes usar cualquiera de estos métodos:

   a. Usando n8n instalado globalmente:
   ```bash
   n8n start
   ```

   b. Usando el script de n8n en node_modules:
   ```bash
   ./node_modules/.bin/n8n start
   ```

3. Una vez iniciado, n8n estará disponible en:
   - http://localhost:5678

## Estructura del Proyecto

- `data/`: Directorio para almacenar archivos de datos
- `node_modules/`: Dependencias del proyecto

## Dependencias Principales

- n8n: ^1.85.4 - Plataforma de automatización de flujos de trabajo
- mongodb: ^6.15.0 - Cliente de MongoDB para Node.js
- xlsx: ^0.20.2 - Biblioteca para manejo de archivos Excel

## Uso

1. Inicia n8n siguiendo las instrucciones de configuración
2. Accede a la interfaz web de n8n en http://localhost:5678
3. Crea tus flujos de trabajo utilizando los nodos disponibles
4. Utiliza los nodos de MongoDB para interactuar con tu base de datos
5. Usa los nodos de Excel para procesar archivos .xlsx

## Desarrollo

El proyecto utiliza:
- Lefthook para git hooks
- Turbo para optimización de build
- Configuraciones de VS Code para desarrollo

## Contribución

1. Haz fork del repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia ISC.
