// Preload script para manejar la comunicación segura entre procesos
const { contextBridge, ipcRenderer } = require('electron');

// Expone funciones seguras al proceso de renderizado
contextBridge.exposeInMainWorld('electron', {
  // Funciones para comunicación con el proceso principal
  invoke: (channel, data) => {
    // Lista blanca de canales permitidos
    const validChannels = [
      'app:getVersion',
      'dialog:openFile',
      // Añadir aquí los canales que necesite tu aplicación
    ];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, data);
    }
  },
  on: (channel, func) => {
    // Lista blanca de canales permitidos
    const validChannels = [
      'app:update-available',
      // Añadir aquí los canales que necesite tu aplicación
    ];
    if (validChannels.includes(channel)) {
      // Elimina los listeners existentes para evitar duplicados
      ipcRenderer.removeAllListeners(channel);
      // Añadir nuevo listener
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  // Obtener información del sistema operativo
  platform: process.platform
});

// Puedes añadir otras APIs nativas de Node.js que necesites aquí
