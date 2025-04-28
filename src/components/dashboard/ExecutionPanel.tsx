
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Check, Loader2, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { mongoConfig } from '@/config/endpoints';

interface ExecutionPanelProps {
  executionStatus: {
    tirasLoaded: boolean;
    historicoLoaded: boolean;
    cpLoaded: boolean;
    gestionLoaded: boolean;
  };
  setExecutionStatus: React.Dispatch<React.SetStateAction<{
    tirasLoaded: boolean;
    historicoLoaded: boolean;
    cpLoaded: boolean;
    gestionLoaded: boolean;
  }>>;
  endpoints: {
    tiraToDB: string;
    loadFileHistorico: string;
    cpToDB: string;
    readFileGestion: string;
    procesarAgente: string;
  };
}

const ExecutionPanel = ({ executionStatus, setExecutionStatus, endpoints }: ExecutionPanelProps) => {
  const [loading, setLoading] = useState({
    tiras: false,
    historico: false,
    cp: false,
    gestion: false
  });
  
  const [progress, setProgress] = useState({
    tiras: 0,
    historico: 0,
    cp: 0,
    gestion: 0
  });
  
  // Rutas de los archivos configurados por el usuario
  const [filePaths, setFilePaths] = useState({
    rutaNCR: "",
    rutaDiebold: "",
    pathHistorico: "",
    rutaCP: "",
    pathGestion: ""
  });

  // Cargar las rutas guardadas al iniciar
  useEffect(() => {
    const rutaNCR = localStorage.getItem('tiraNcrPath') || "";
    const rutaDiebold = localStorage.getItem('tiraDieboldPath') || "";
    const pathHistorico = localStorage.getItem('historicoPath') || "";
    const rutaCP = localStorage.getItem('cpPath') || "";
    const pathGestion = localStorage.getItem('gestionPath') || "";
    
    setFilePaths({
      rutaNCR,
      rutaDiebold,
      pathHistorico,
      rutaCP,
      pathGestion
    });
  }, []);

  const executeApiCall = async (type: keyof typeof executionStatus, endpoint: string) => {
    const loadingKey = type.replace('Loaded', '') as keyof typeof loading;
    
    setLoading(prev => ({ ...prev, [loadingKey]: true }));
    setProgress(prev => ({ ...prev, [loadingKey]: 0 }));
    
    const interval = setInterval(() => {
      setProgress(prev => {
        const newValue = prev[loadingKey] + 2;
        return { ...prev, [loadingKey]: newValue > 90 ? 90 : newValue };
      });
    }, 20);
    
    try {
      console.log(`Llamando al endpoint n8n: ${endpoint}`);
      
      let requestBody = {};
      
      switch(type) {
        case 'tirasLoaded':
          if (!filePaths.rutaNCR || !filePaths.rutaDiebold) {
            throw new Error("Las rutas de los archivos de tira no están configuradas");
          }
          requestBody = {
            rutaNCR: filePaths.rutaNCR,
            rutaDiebold: filePaths.rutaDiebold
          };
          break;
        case 'historicoLoaded':
          if (!filePaths.pathHistorico) {
            throw new Error("La ruta del archivo histórico no está configurada");
          }
          requestBody = {
            pathPython: "./data/_scripts/migrar_excel_mongo.py", // Ruta fija
            pathExcel: filePaths.pathHistorico,
            connectionStringMongo: mongoConfig.url,
            nombreDB: mongoConfig.dbName,
            nombreColection: "historico_atms",
            lote: "10000"
          };
          break;
        case 'cpLoaded':
          if (!filePaths.rutaCP) {
            throw new Error("La ruta del archivo CP no está configurada");
          }
          requestBody = {
            rutaCP: filePaths.rutaCP
          };
          break;
        case 'gestionLoaded':
          if (!filePaths.pathGestion) {
            throw new Error("La ruta del archivo de gestión no está configurada");
          }
          requestBody = {
            pathGestion: filePaths.pathGestion
          };
          break;
      }
      
      console.log(`Cuerpo de la solicitud:`, requestBody);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        throw new Error(`Error en la llamada a ${endpoint}: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json().catch(e => {
        console.log("La respuesta no es JSON válido, retornando texto plano");
        return { success: true, message: "Operación completada" };
      });
      
      console.log(`Respuesta del endpoint ${endpoint}:`, data);
      
      clearInterval(interval);
      setProgress(prev => ({ ...prev, [loadingKey]: 100 }));
      
      setTimeout(() => {
        setLoading(prev => ({ ...prev, [loadingKey]: false }));
        setExecutionStatus(prev => ({ ...prev, [type]: true }));
        
        const outputMessage = data.output || "Completado exitosamente";
        toast.success(`Carga de ${loadingKey} completada: ${outputMessage}`);
      }, 500);
      
    } catch (error) {
      console.error(`Error al llamar ${endpoint}:`, error);
      clearInterval(interval);
      setProgress(prev => ({ ...prev, [loadingKey]: 0 }));
      setLoading(prev => ({ ...prev, [loadingKey]: false }));
      toast.error(`Error en la carga de ${loadingKey}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  return (
    <div className="grid gap-6">
      <Card className="bg-blue-900/20 border-blue-800/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-blue-100 flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-400" />
            Ejecución de cargas a la base de datos
          </CardTitle>
          <CardDescription className="text-blue-300">
            Ejecute la carga de los diferentes archivos configurados a la base de datos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-blue-950/50 border-blue-800/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-blue-200">
                  Cargar Documento de Tiras
                  {executionStatus.tirasLoaded && (
                    <Check className="h-5 w-5 text-green-500" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-400 mb-4">
                  Carga los documentos de tira NCR y Diebold a la base de datos.
                </p>
                <div className="text-xs text-blue-300 mb-4">
                  <p>Ruta NCR: {filePaths.rutaNCR || "No configurada"}</p>
                  <p>Ruta Diebold: {filePaths.rutaDiebold || "No configurada"}</p>
                </div>
                {loading.tiras && (
                  <div className="mb-4">
                    <Progress value={progress.tiras} className="h-2 mb-2 bg-blue-900" />
                    <div className="flex justify-between text-xs text-blue-400">
                      <span>Procesando...</span>
                      <span>{progress.tiras}%</span>
                    </div>
                  </div>
                )}
                <Button 
                  onClick={() => executeApiCall('tirasLoaded', endpoints.tiraToDB)}
                  disabled={loading.tiras || executionStatus.tirasLoaded || !filePaths.rutaNCR || !filePaths.rutaDiebold}
                  className="w-full bg-blue-700 hover:bg-blue-600 text-white"
                  variant="default"
                >
                  {loading.tiras ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cargando...
                    </>
                  ) : (
                    'Ejecutar carga'
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-blue-950/50 border-blue-800/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-blue-200">
                  Cargar Documento Histórico
                  {executionStatus.historicoLoaded && (
                    <Check className="h-5 w-5 text-green-500" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-400 mb-4">
                  Carga el documento histórico a la base de datos.
                </p>
                <div className="text-xs text-blue-300 mb-4">
                  <p>Ruta del histórico: {filePaths.pathHistorico || "No configurada"}</p>
                </div>
                {loading.historico && (
                  <div className="mb-4">
                    <Progress value={progress.historico} className="h-2 mb-2 bg-blue-900" />
                    <div className="flex justify-between text-xs text-blue-400">
                      <span>Procesando...</span>
                      <span>{progress.historico}%</span>
                    </div>
                  </div>
                )}
                <Button 
                  onClick={() => executeApiCall('historicoLoaded', endpoints.loadFileHistorico)}
                  disabled={loading.historico || executionStatus.historicoLoaded || !filePaths.pathHistorico}
                  className="w-full bg-blue-700 hover:bg-blue-600 text-white"
                  variant="default"
                >
                  {loading.historico ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cargando...
                    </>
                  ) : (
                    'Ejecutar carga'
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-blue-950/50 border-blue-800/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-blue-200">
                  Cargar Documento CP
                  {executionStatus.cpLoaded && (
                    <Check className="h-5 w-5 text-green-500" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-400 mb-4">
                  Carga el documento CP (Cajeros en Producción) a la base de datos.
                </p>
                <div className="text-xs text-blue-300 mb-4">
                  <p>Ruta CP: {filePaths.rutaCP || "No configurada"}</p>
                </div>
                {loading.cp && (
                  <div className="mb-4">
                    <Progress value={progress.cp} className="h-2 mb-2 bg-blue-900" />
                    <div className="flex justify-between text-xs text-blue-400">
                      <span>Procesando...</span>
                      <span>{progress.cp}%</span>
                    </div>
                  </div>
                )}
                <Button 
                  onClick={() => executeApiCall('cpLoaded', endpoints.cpToDB)}
                  disabled={loading.cp || executionStatus.cpLoaded || !filePaths.rutaCP}
                  className="w-full bg-blue-700 hover:bg-blue-600 text-white"
                  variant="default"
                >
                  {loading.cp ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cargando...
                    </>
                  ) : (
                    'Ejecutar carga'
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-blue-950/50 border-blue-800/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-blue-200">
                  Cargar Documento de Gestión
                  {executionStatus.gestionLoaded && (
                    <Check className="h-5 w-5 text-green-500" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-400 mb-4">
                  Carga el documento de gestión a la base de datos.
                </p>
                <div className="text-xs text-blue-300 mb-4">
                  <p>Ruta de Gestión: {filePaths.pathGestion || "No configurada"}</p>
                </div>
                {loading.gestion && (
                  <div className="mb-4">
                    <Progress value={progress.gestion} className="h-2 mb-2 bg-blue-900" />
                    <div className="flex justify-between text-xs text-blue-400">
                      <span>Procesando...</span>
                      <span>{progress.gestion}%</span>
                    </div>
                  </div>
                )}
                <Button 
                  onClick={() => executeApiCall('gestionLoaded', endpoints.readFileGestion)}
                  disabled={loading.gestion || executionStatus.gestionLoaded || !filePaths.pathGestion}
                  className="w-full bg-blue-700 hover:bg-blue-600 text-white"
                  variant="default"
                >
                  {loading.gestion ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cargando...
                    </>
                  ) : (
                    'Ejecutar carga'
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-blue-400">
            Todos los archivos deben ser cargados para avanzar a la siguiente etapa.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ExecutionPanel;
