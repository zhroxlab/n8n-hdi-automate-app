import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { applyElectronClass } from './utils/electronUtils.ts'

// Aplicar la clase 'electron-app' si estamos en Electron
applyElectronClass();

createRoot(document.getElementById("root")!).render(<App />);
