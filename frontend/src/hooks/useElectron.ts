import { useEffect, useState } from 'react';
import path from 'path';

// Definir una interfaz para la API de Electron
interface ElectronAPI {
  invoke: (channel: string, data?: any) => Promise<any>;
  on: (channel: string, callback: (...args: any[]) => void) => void;
  platform: string;
}

// Interfaz para opciones de selección de archivos
interface OpenFileOptions {
  filters?: { name: string; extensions: string[] }[];
  title?: string;
  defaultPath?: string;
  buttonLabel?: string;
  category?: string; // Categoría para agrupar tipos de archivos similares
}

// Declarar la variable global window con la propiedad electron
declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}

// Mantener el seguimiento de las últimas rutas usadas globalmente
const lastUsedPaths: Record<string, string> = {};

/**
 * Normaliza una ruta para que sea compatible con diferentes sistemas operativos
 * @param filePath Ruta del archivo a normalizar
 * @param platform Plataforma del sistema operativo (win32, darwin, linux)
 * @returns Ruta normalizada
 */
export const normalizePath = (filePath: string, platform?: string): string => {
  if (!filePath) return '';

  try {
    // Convertir las barras según la plataforma
    let normalizedPath = filePath;

    // Para Windows, asegurar rutas con barras invertidas
    if (platform === 'win32') {
      // Convertir todas las barras a barras invertidas
      normalizedPath = normalizedPath.replace(/\//g, '\\');

      // Si no es una ruta absoluta (no comienza con letra de unidad), asegurar que tenga la forma correcta
      if (!/^[a-zA-Z]:\\/.test(normalizedPath) && !normalizedPath.startsWith('\\\\')) {
        // Es una ruta relativa, mantenerla tal cual
      }
    } else {
      // Para sistemas Unix (macOS/Linux), usar barras normales
      normalizedPath = normalizedPath.replace(/\\/g, '/');
    }

    // Escapar los espacios en la ruta para el consumo por API
    normalizedPath = normalizedPath.replace(/ /g, '\\ ');

    return normalizedPath;
  } catch (error) {
    console.error('Error al normalizar ruta:', error);
    return filePath; // Devolver la ruta original si hay error
  }
};

/**
 * Codifica una ruta para su uso seguro en URL o API
 * @param filePath Ruta del archivo a codificar
 * @returns Ruta codificada
 */
export const encodePathForApi = (filePath: string): string => {
  if (!filePath) return '';

  try {
    // Primero normalizar según la plataforma
    const platform = window.electron?.platform ||
                    (navigator.platform.toLowerCase().includes('win') ? 'win32' : 'darwin');
    let normalizedPath = normalizePath(filePath, platform);

    // Eliminar cualquier escape previo para evitar doble escape
    normalizedPath = normalizedPath.replace(/\\\s/g, ' ');

    // Para APIs, es más seguro codificar completamente la ruta para URI
    // Esto maneja espacios y caracteres especiales
    return encodeURIComponent(normalizedPath);
  } catch (error) {
    console.error('Error al codificar ruta para API:', error);
    return encodeURIComponent(filePath); // Codificar la ruta original si hay error
  }
};

/**
 * Hook para usar Electron en React
 * @returns Un objeto con funciones y propiedades para interactuar con Electron
 */
export const useElectron = () => {
  // Determinar si estamos ejecutando en Electron
  const [isElectron, setIsElectron] = useState(false);
  const [appVersion, setAppVersion] = useState<string | null>(null);
  const [platform, setPlatform] = useState<string | null>(null);

  useEffect(() => {
    // Comprobar si estamos en Electron
    const isRunningInElectron = window.electron !== undefined;
    setIsElectron(isRunningInElectron);

    if (isRunningInElectron && window.electron) {
      // Guardar la plataforma
      setPlatform(window.electron.platform);

      // Obtener la versión de la aplicación
      window.electron.invoke('app:getVersion')
        .then(version => {
          setAppVersion(version);
        })
        .catch(error => {
          console.error('Error al obtener la versión de la aplicación:', error);
        });
    }

    // Cargar las últimas rutas utilizadas desde localStorage
    try {
      const savedPaths = localStorage.getItem('lastUsedPaths');
      if (savedPaths) {
        Object.assign(lastUsedPaths, JSON.parse(savedPaths));
      }
    } catch (error) {
      console.error('Error al cargar las rutas guardadas:', error);
    }
  }, []);

  /**
   * Guarda la última ruta utilizada para una categoría específica
   * @param path Ruta completa del archivo
   * @param category Categoría del archivo (opcional)
   */
  const saveLastUsedPath = (path: string, category: string = 'default') => {
    try {
      if (!path) return;

      // Extraer el directorio de la ruta del archivo
      const separator = platform === 'win32' ? '\\' : '/';
      const parts = path.split(/[\/\\]/);
      const directoryPath = parts.slice(0, -1).join(separator);

      if (directoryPath) {
        // Guardar la ruta por categoría
        lastUsedPaths[category] = directoryPath;

        // Persistir en localStorage
        localStorage.setItem('lastUsedPaths', JSON.stringify(lastUsedPaths));
      }
    } catch (error) {
      console.error('Error al guardar la ruta:', error);
    }
  };

  /**
   * Obtiene la última ruta utilizada para una categoría específica
   * @param category Categoría del archivo
   * @returns La última ruta utilizada o null si no hay
   */
  const getLastUsedPath = (category: string = 'default'): string | null => {
    return lastUsedPaths[category] || null;
  };

  /**
   * Abre un diálogo para seleccionar un archivo y retorna la ruta completa
   * @param options Opciones de configuración para el diálogo
   * @returns Promise con la ruta del archivo seleccionado o null si se cancela
   */
  const openFileDialog = async (options: OpenFileOptions = {}): Promise<string | null> => {
    if (isElectron && window.electron) {
      try {
        // Usar la última ruta de la categoría específica si existe
        const category = options.category || 'default';
        const lastPath = getLastUsedPath(category);

        const dialogOptions = {
          ...options,
          defaultPath: options.defaultPath || lastPath || undefined
        };

        const filePath = await window.electron.invoke('dialog:openFile', dialogOptions);

        // Si se seleccionó un archivo, guardar la ruta
        if (filePath) {
          saveLastUsedPath(filePath, category);
        }

        return filePath;
      } catch (error) {
        console.error('Error al abrir el diálogo de selección de archivo:', error);
        return null;
      }
    }

    // Si no estamos en Electron, usamos el selector de archivos nativo del navegador
    // pero esto solo dará el nombre del archivo, no la ruta completa por seguridad
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';

      // Aplicar filtros si están disponibles
      if (options.filters) {
        const extensions = options.filters.flatMap(filter =>
          filter.extensions.map(ext => `.${ext}`)
        );
        input.accept = extensions.join(',');
      }

      input.onchange = (e) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        resolve(file ? file.name : null);
      };

      input.click();
    });
  };

  /**
   * Prepara una ruta de archivo para usarla con las APIs
   * @param filePath Ruta del archivo a preparar
   * @returns Ruta preparada para APIs
   */
  const preparePathForApi = (filePath: string): string => {
    if (!filePath) return '';
    return encodePathForApi(filePath);
  };

  return {
    isElectron,
    appVersion,
    platform,
    // Función para seleccionar archivos
    openFileDialog,
    // Funciones para manejo de rutas
    getLastUsedPath,
    saveLastUsedPath,
    normalizePath: (filePath: string) => normalizePath(filePath, platform || undefined),
    preparePathForApi,
    // Funciones seguras para IPC
    invoke: (channel: string, data?: any) => {
      if (isElectron && window.electron) {
        return window.electron.invoke(channel, data);
      }
      return Promise.reject(new Error('Electron no está disponible'));
    },
    on: (channel: string, callback: (...args: any[]) => void) => {
      if (isElectron && window.electron) {
        window.electron.on(channel, callback);
      }
    }
  };
};

export default useElectron;
