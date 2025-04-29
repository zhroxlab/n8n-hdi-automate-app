import axios from 'axios';

// Definir la URL base para la API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Configuración del cliente axios
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Tipos de respuesta para las diferentes operaciones
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Funciones para las operaciones de la API

// Procesar archivos de tira
export const processTiraFiles = async (ncrPathApi: string, dieboldPathApi: string): Promise<ApiResponse<any>> => {
  try {
    const response = await apiClient.post('/process-tira', {
      ncrPath: ncrPathApi,
      dieboldPath: dieboldPathApi,
    });
    return response.data;
  } catch (error) {
    console.error('Error al procesar archivos de tira:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al procesar archivos de tira',
    };
  }
};

// Procesar archivo histórico
export const processHistoricoFile = async (historicoPathApi: string): Promise<ApiResponse<any>> => {
  try {
    const response = await apiClient.post('/process-historico', {
      historicoPath: historicoPathApi,
    });
    return response.data;
  } catch (error) {
    console.error('Error al procesar archivo histórico:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al procesar archivo histórico',
    };
  }
};

// Procesar archivo CP
export const processCpFile = async (cpPathApi: string): Promise<ApiResponse<any>> => {
  try {
    const response = await apiClient.post('/process-cp', {
      cpPath: cpPathApi,
    });
    return response.data;
  } catch (error) {
    console.error('Error al procesar archivo CP:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al procesar archivo CP',
    };
  }
};

// Procesar archivo de gestión
export const processGestionFile = async (gestionPathApi: string): Promise<ApiResponse<any>> => {
  try {
    const response = await apiClient.post('/process-gestion', {
      gestionPath: gestionPathApi,
    });
    return response.data;
  } catch (error) {
    console.error('Error al procesar archivo de gestión:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al procesar archivo de gestión',
    };
  }
};

// Obtener estadísticas
export const getStats = async (): Promise<ApiResponse<any>> => {
  try {
    const response = await apiClient.get('/stats');
    return response.data;
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al obtener estadísticas',
    };
  }
};

// Verificar conexión con la base de datos
export const checkDbConnection = async (
  dbUrl: string,
  dbUser: string,
  dbPassword: string
): Promise<ApiResponse<boolean>> => {
  try {
    const response = await apiClient.post('/check-db-connection', {
      dbUrl,
      dbUser,
      dbPassword,
    });
    return response.data;
  } catch (error) {
    console.error('Error al verificar conexión con la base de datos:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al verificar conexión con la base de datos',
    };
  }
};

// Ejecutar proceso completo
export const runFullProcess = async (): Promise<ApiResponse<any>> => {
  try {
    // Obtener las rutas preparadas para API del localStorage
    const ncrPathApi = localStorage.getItem('tiraNcrPathApi') || '';
    const dieboldPathApi = localStorage.getItem('tiraDieboldPathApi') || '';
    const historicoPathApi = localStorage.getItem('historicoPathApi') || '';
    const cpPathApi = localStorage.getItem('cpPathApi') || '';
    const gestionPathApi = localStorage.getItem('gestionPathApi') || '';

    const response = await apiClient.post('/run-full-process', {
      ncrPath: ncrPathApi,
      dieboldPath: dieboldPathApi,
      historicoPath: historicoPathApi,
      cpPath: cpPathApi,
      gestionPath: gestionPathApi,
    });
    return response.data;
  } catch (error) {
    console.error('Error al ejecutar proceso completo:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al ejecutar proceso completo',
    };
  }
};

export default {
  processTiraFiles,
  processHistoricoFile,
  processCpFile,
  processGestionFile,
  getStats,
  checkDbConnection,
  runFullProcess,
};
