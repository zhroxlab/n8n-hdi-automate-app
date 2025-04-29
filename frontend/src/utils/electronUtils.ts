/**
 * Detecta si la aplicación se está ejecutando en Electron
 */
export const isRunningInElectron = (): boolean => {
  return window.electron !== undefined;
};

/**
 * Aplica la clase 'electron-app' al elemento HTML si estamos en Electron
 */
export const applyElectronClass = (): void => {
  if (isRunningInElectron()) {
    document.documentElement.classList.add('electron-app');
  }
};

/**
 * Establece el título de la ventana de Electron
 * @param title - El título a establecer
 */
export const setWindowTitle = (title: string): void => {
  if (isRunningInElectron()) {
    document.title = title;
  }
};
