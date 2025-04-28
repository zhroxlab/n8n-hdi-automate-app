// Configuration file for API endpoints
// Last updated: 2025-04-16
// Fixed to use real n8n endpoints

export const endpoints = {
  // Endpoint para cargar tiras NCR y Diebold
  tiraToDB: "http://localhost:5678/webhook/app_hdi_tiraToDB",
  
  // Endpoint para cargar el histórico
  loadFileHistorico: "http://localhost:5678/webhook/app_hdi_loadFileHistorico",
  
  // Endpoint para cargar el archivo CP
  cpToDB: "http://localhost:5678/webhook/app_hdi_cpToDB",
  
  // Endpoint para leer el archivo de gestión
  readFileGestion: "http://localhost:5678/webhook/app_hdi_readFile",
  
  // Updated agent processing endpoint
  procesarAgente: "http://localhost:5678/webhook/app_hdi_agMain3"
};

// MongoDB connection details
export const mongoConfig = {
  url: "mongodb://localhost:27017",
  user: "zhrox",
  password: "admin",
  dbName: "db_app_hdi"
};
