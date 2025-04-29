// Importaciones necesarias de Electron
const { app, BrowserWindow, ipcMain, globalShortcut, dialog } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

// Mantén una referencia global del objeto window para evitar que la ventana se cierre automáticamente
let mainWindow;

function createWindow() {
  // Crear la ventana del navegador
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // Precargar script para comunicación entre procesos
      preload: path.join(__dirname, 'preload.cjs'),
      // Habilitar WebSecurity
      webSecurity: true,
      // Habilitar la integración con Node.js y Chrome para habilitar APIs adicionales
      additionalArguments: ['--enable-features=ScrollableTabStrip,ImpulseScrollAnimations'],
    },
    // Personaliza la apariencia para que se vea más nativa
    backgroundColor: '#0f172a', // Color oscuro para combinar con el tema de la app
    show: false, // No mostrar hasta que esté listo para evitar parpadeos
    // Usar controles nativos del sistema (con frame)
    frame: true,
    // Aplicar autohide a la barra de menú
    autoHideMenuBar: false,
    // Permitir que la ventana sea redimensionable
    resizable: true,
    // Establecer tamaños mínimos
    minWidth: 800,
    minHeight: 600,
    // Título de la ventana
    title: 'HDI Automation',
  });

  // Cargar la aplicación
  if (isDev) {
    // En desarrollo, conectar con el servidor de desarrollo de Vite
    mainWindow.loadURL('http://localhost:8080');
    // Abrir DevTools
    mainWindow.webContents.openDevTools();
  } else {
    // En producción, cargar el archivo HTML compilado
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Configurar WebContents para permitir correctamente la navegación y el scroll
  mainWindow.webContents.on('did-finish-load', () => {
    // Permitir el scroll con la rueda del mouse
    mainWindow.webContents.setVisualZoomLevelLimits(1, 3);

    // Script para habilitar el scroll en la página
    mainWindow.webContents.executeJavaScript(`
      document.body.style.overflow = 'auto';

      // Función para habilitar el scroll suave
      document.querySelectorAll('div').forEach(div => {
        if (getComputedStyle(div).overflow === 'hidden') {
          div.style.overflow = 'auto';
        }
      });
    `);
  });

  // Registrar atajos de teclado
  globalShortcut.register('CommandOrControl+F5', () => {
    mainWindow.reload();
  });

  // Mostrar la ventana cuando esté lista para evitar parpadeos
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Manejar el cierre de la ventana
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Este método se llamará cuando Electron haya terminado la inicialización
app.whenReady().then(() => {
  createWindow();

  // Registro de handlers para APIs expuestas
  setupIpcHandlers();

  // Desregistrar atajos de teclado al cerrar la aplicación
  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
  });
});

// Configurar handlers para IPC
function setupIpcHandlers() {
  // Manejar eventos IPC para obtener versión
  ipcMain.handle('app:getVersion', () => {
    return app.getVersion();
  });

  // Manejar eventos IPC para abrir selector de archivos
  ipcMain.handle('dialog:openFile', async (event, options) => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: options.filters || [],
      title: options.title || 'Seleccionar archivo',
      defaultPath: options.defaultPath || app.getPath('documents'),
      buttonLabel: options.buttonLabel || 'Seleccionar'
    });

    if (canceled) {
      return null;
    } else {
      return filePaths[0]; // Retorna la ruta completa del archivo seleccionado
    }
  });
}

// Salir cuando todas las ventanas estén cerradas, excepto en macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // En macOS, recrear la ventana cuando se hace clic en el icono del dock
  if (mainWindow === null) {
    createWindow();
  }
});
