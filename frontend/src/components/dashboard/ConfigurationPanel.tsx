import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Check, Database, File, FolderOpen, Settings, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import useElectron from '@/hooks/useElectron';

interface ConfigurationPanelProps {
  configStatus: {
    tirasConfigured: boolean;
    historicoConfigured: boolean;
    cpConfigured: boolean;
    gestionConfigured: boolean;
    dbConfigured: boolean;
  };
  setConfigStatus: React.Dispatch<React.SetStateAction<{
    tirasConfigured: boolean;
    historicoConfigured: boolean;
    cpConfigured: boolean;
    gestionConfigured: boolean;
    dbConfigured: boolean;
  }>>;
}

// Categorías para agrupar tipos de archivos similares
const FILE_CATEGORIES = {
  TIRA: 'tira',
  HISTORICO: 'historico',
  CP: 'cp',
  GESTION: 'gestion'
};

const ConfigurationPanel = ({ configStatus, setConfigStatus }: ConfigurationPanelProps) => {
  const [configs, setConfigs] = useState({
    tiraNcrPath: '',
    tiraDieboldPath: '',
    historicoPath: '',
    cpPath: '',
    gestionPath: '',
    dbUrl: 'mongodb://localhost:27017',
    dbUser: 'zhrox',
    dbPassword: 'admin',
  });

  // Referencias para los inputs de archivo ocultos
  const tiraNcrFileRef = useRef<HTMLInputElement>(null);
  const tiraDieboldFileRef = useRef<HTMLInputElement>(null);
  const historicoFileRef = useRef<HTMLInputElement>(null);
  const cpFileRef = useRef<HTMLInputElement>(null);
  const gestionFileRef = useRef<HTMLInputElement>(null);

  // Hook para usar Electron
  const { isElectron, openFileDialog, platform, normalizePath, preparePathForApi } = useElectron();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfigs(prev => ({ ...prev, [name]: value }));
  };

  // Manejador para cuando se selecciona un archivo
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, configKey: string) => {
    const file = e.target.files?.[0];
    if (file) {
      // En un entorno web, solo tenemos acceso al nombre del archivo por seguridad
      // En aplicaciones de escritorio (como Electron), esto podría ser diferente
      const filePath = file.name; // Usamos solo el nombre del archivo
      setConfigs(prev => ({ ...prev, [configKey]: filePath }));
      toast.info(`Archivo seleccionado: ${file.name}`);
    }
  };

  // Función para abrir el selector de archivos (usando Electron si está disponible)
  const openFilePicker = async (fileRef: React.RefObject<HTMLInputElement>, configKey: string, extensions: string[] = [], category: string = FILE_CATEGORIES.TIRA) => {
    if (isElectron) {
      // Si estamos en Electron, usamos el diálogo nativo que nos da la ruta completa
      const filePath = await openFileDialog({
        filters: [
          { name: 'Archivos', extensions }
        ],
        title: 'Seleccionar archivo',
        buttonLabel: 'Seleccionar',
        category // Usar la categoría para recordar la ruta
      });

      if (filePath) {
        // Normalizar la ruta según el sistema operativo antes de guardarlas
        const normalizedPath = normalizePath(filePath);
        setConfigs(prev => ({ ...prev, [configKey]: normalizedPath }));
        toast.info(`Archivo seleccionado: ${normalizedPath}`);
      }
    } else {
      // En entorno web, usamos la referencia al input file
      fileRef.current?.click();
    }
  };

  const validateAndSave = (configType: keyof typeof configStatus) => {
    // Validación basada en el tipo de configuración
    switch (configType) {
      case 'tirasConfigured':
        if (configs.tiraNcrPath && configs.tiraDieboldPath) {
          setConfigStatus(prev => ({ ...prev, [configType]: true }));
          toast.success('Configuración de tiras guardada correctamente');
          // También almacenamos en localStorage o sessionStorage para persistencia
          // Preparar las rutas para API antes de guardarlas
          localStorage.setItem('tiraNcrPath', configs.tiraNcrPath);
          localStorage.setItem('tiraNcrPathApi', preparePathForApi(configs.tiraNcrPath));
          localStorage.setItem('tiraDieboldPath', configs.tiraDieboldPath);
          localStorage.setItem('tiraDieboldPathApi', preparePathForApi(configs.tiraDieboldPath));
        } else {
          toast.error('Por favor complete las rutas de los archivos de tiras');
        }
        break;
      case 'historicoConfigured':
        if (configs.historicoPath) {
          setConfigStatus(prev => ({ ...prev, [configType]: true }));
          toast.success('Configuración del histórico guardada correctamente');
          localStorage.setItem('historicoPath', configs.historicoPath);
          localStorage.setItem('historicoPathApi', preparePathForApi(configs.historicoPath));
        } else {
          toast.error('Por favor ingrese la ruta del archivo histórico');
        }
        break;
      case 'cpConfigured':
        if (configs.cpPath) {
          setConfigStatus(prev => ({ ...prev, [configType]: true }));
          toast.success('Configuración de CP guardada correctamente');
          localStorage.setItem('cpPath', configs.cpPath);
          localStorage.setItem('cpPathApi', preparePathForApi(configs.cpPath));
        } else {
          toast.error('Por favor ingrese la ruta del archivo CP');
        }
        break;
      case 'gestionConfigured':
        if (configs.gestionPath) {
          setConfigStatus(prev => ({ ...prev, [configType]: true }));
          toast.success('Configuración de gestión guardada correctamente');
          localStorage.setItem('gestionPath', configs.gestionPath);
          localStorage.setItem('gestionPathApi', preparePathForApi(configs.gestionPath));
        } else {
          toast.error('Por favor ingrese la ruta del archivo de gestión');
        }
        break;
      case 'dbConfigured':
        if (configs.dbUrl) {
          setConfigStatus(prev => ({ ...prev, [configType]: true }));
          toast.success('Configuración de base de datos guardada correctamente');
          localStorage.setItem('dbUrl', configs.dbUrl);
          localStorage.setItem('dbUser', configs.dbUser);
          localStorage.setItem('dbPassword', configs.dbPassword);
        } else {
          toast.error('Por favor ingrese la URL de la base de datos');
        }
        break;
    }
  };

  // Obtiene una versión de la ruta para mostrar al usuario (más amigable)
  const getDisplayPath = (path: string): string => {
    if (!path) return '';

    // Mostrar la última parte de la ruta si es muy larga
    if (path.length > 40) {
      const parts = path.split(/[\/\\]/);
      const fileName = parts[parts.length - 1];
      return `.../${fileName}`;
    }

    return path;
  };

  // Cargar configuraciones guardadas al iniciar
  useEffect(() => {
    const tiraNcrPath = localStorage.getItem('tiraNcrPath') || '';
    const tiraDieboldPath = localStorage.getItem('tiraDieboldPath') || '';
    const historicoPath = localStorage.getItem('historicoPath') || '';
    const cpPath = localStorage.getItem('cpPath') || '';
    const gestionPath = localStorage.getItem('gestionPath') || '';
    const dbUrl = localStorage.getItem('dbUrl') || 'mongodb://localhost:27017';
    const dbUser = localStorage.getItem('dbUser') || 'zhrox';
    const dbPassword = localStorage.getItem('dbPassword') || 'admin';

    setConfigs({
      tiraNcrPath,
      tiraDieboldPath,
      historicoPath,
      cpPath,
      gestionPath,
      dbUrl,
      dbUser,
      dbPassword
    });
  }, []);

  return (
    <div className="grid gap-6">
      <Card className="bg-blue-900/20 border-blue-800/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-blue-100 flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-400" />
            Configuración de rutas de archivos
          </CardTitle>
          <CardDescription className="text-blue-300">Configure las rutas de los archivos necesarios para el funcionamiento del sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 p-4 rounded-lg bg-blue-950/50 border border-blue-800/30">
            <h3 className="text-lg font-medium flex items-center gap-2 text-blue-200">
              <File className="h-5 w-5 text-blue-400" />
              Documentos de Tira
              {configStatus.tirasConfigured ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : (
                <X className="h-5 w-5 text-red-500" />
              )}
            </h3>
            <div className="grid gap-3">
              {/* Input oculto para selección de archivo NCR (solo para web) */}
              <input
                type="file"
                ref={tiraNcrFileRef}
                className="hidden"
                onChange={(e) => handleFileSelect(e, 'tiraNcrPath')}
                accept=".rpt"
              />

              <div className="grid gap-2">
                <Label htmlFor="tiraNcrPath" className="text-blue-300">Ruta del archivo de tira NCR</Label>
                <div className="flex gap-2">
                  <Input
                    id="tiraNcrPath"
                    name="tiraNcrPath"
                    value={getDisplayPath(configs.tiraNcrPath)}
                    onChange={handleChange}
                    placeholder="./data/_scripts/code-data-tira-to-db/pull-tira/archivo_ncr.rpt"
                    className="bg-blue-900/30 border-blue-700/30 text-blue-100 placeholder:text-blue-500"
                    title={configs.tiraNcrPath} // Mostrar la ruta completa en el tooltip
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0 bg-blue-900/50 border-blue-700/50 hover:bg-blue-800/50"
                    onClick={() => openFilePicker(tiraNcrFileRef, 'tiraNcrPath', ['rpt'], FILE_CATEGORIES.TIRA)}
                    title="Buscar archivo de tira NCR"
                  >
                    <FolderOpen className="h-4 w-4 text-blue-300" />
                  </Button>
                </div>
              </div>

              {/* Input oculto para selección de archivo Diebold (solo para web) */}
              <input
                type="file"
                ref={tiraDieboldFileRef}
                className="hidden"
                onChange={(e) => handleFileSelect(e, 'tiraDieboldPath')}
                accept=".rpt"
              />

              <div className="grid gap-2">
                <Label htmlFor="tiraDieboldPath" className="text-blue-300">Ruta del archivo de tira Diebold</Label>
                <div className="flex gap-2">
                  <Input
                    id="tiraDieboldPath"
                    name="tiraDieboldPath"
                    value={getDisplayPath(configs.tiraDieboldPath)}
                    onChange={handleChange}
                    placeholder="./data/_scripts/code-data-tira-to-db/pull-tira/archivo_die.rpt"
                    className="bg-blue-900/30 border-blue-700/30 text-blue-100 placeholder:text-blue-500"
                    title={configs.tiraDieboldPath} // Mostrar la ruta completa en el tooltip
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0 bg-blue-900/50 border-blue-700/50 hover:bg-blue-800/50"
                    onClick={() => openFilePicker(tiraDieboldFileRef, 'tiraDieboldPath', ['rpt'], FILE_CATEGORIES.TIRA)}
                    title="Buscar archivo de tira Diebold"
                  >
                    <FolderOpen className="h-4 w-4 text-blue-300" />
                  </Button>
                </div>
              </div>
              <Button
                onClick={() => validateAndSave('tirasConfigured')}
                className="mt-2 bg-blue-700 hover:bg-blue-600 text-white"
                variant="default"
                disabled={configStatus.tirasConfigured}
              >
                Guardar configuración de tiras
              </Button>
            </div>
          </div>

          <div className="space-y-4 p-4 rounded-lg bg-blue-950/50 border border-blue-800/30">
            <h3 className="text-lg font-medium flex items-center gap-2 text-blue-200">
              <File className="h-5 w-5 text-blue-400" />
              Documento Histórico
              {configStatus.historicoConfigured ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : (
                <X className="h-5 w-5 text-red-500" />
              )}
            </h3>
            <div className="grid gap-2">
              {/* Input oculto para selección de archivo histórico (solo para web) */}
              <input
                type="file"
                ref={historicoFileRef}
                className="hidden"
                onChange={(e) => handleFileSelect(e, 'historicoPath')}
                accept=".xlsx,.xls"
              />

              <Label htmlFor="historicoPath" className="text-blue-300">Ruta del archivo histórico</Label>
              <div className="flex gap-2">
                <Input
                  id="historicoPath"
                  name="historicoPath"
                  value={getDisplayPath(configs.historicoPath)}
                  onChange={handleChange}
                  placeholder="./data/_historico/HISTORICO.xlsx"
                  className="bg-blue-900/30 border-blue-700/30 text-blue-100 placeholder:text-blue-500"
                  title={configs.historicoPath} // Mostrar la ruta completa en el tooltip
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 bg-blue-900/50 border-blue-700/50 hover:bg-blue-800/50"
                  onClick={() => openFilePicker(historicoFileRef, 'historicoPath', ['xlsx', 'xls'], FILE_CATEGORIES.HISTORICO)}
                  title="Buscar archivo histórico"
                >
                  <FolderOpen className="h-4 w-4 text-blue-300" />
                </Button>
              </div>
              <Button
                onClick={() => validateAndSave('historicoConfigured')}
                className="mt-2 bg-blue-700 hover:bg-blue-600 text-white"
                variant="default"
                disabled={configStatus.historicoConfigured}
              >
                Guardar configuración histórico
              </Button>
            </div>
          </div>

          <div className="space-y-4 p-4 rounded-lg bg-blue-950/50 border border-blue-800/30">
            <h3 className="text-lg font-medium flex items-center gap-2 text-blue-200">
              <File className="h-5 w-5 text-blue-400" />
              Documento CP
              {configStatus.cpConfigured ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : (
                <X className="h-5 w-5 text-red-500" />
              )}
            </h3>
            <div className="grid gap-2">
              {/* Input oculto para selección de archivo CP (solo para web) */}
              <input
                type="file"
                ref={cpFileRef}
                className="hidden"
                onChange={(e) => handleFileSelect(e, 'cpPath')}
                accept=".xlsx,.xls"
              />

              <Label htmlFor="cpPath" className="text-blue-300">Ruta del archivo CP</Label>
              <div className="flex gap-2">
                <Input
                  id="cpPath"
                  name="cpPath"
                  value={getDisplayPath(configs.cpPath)}
                  onChange={handleChange}
                  placeholder="./data/_cp/cp.xlsx"
                  className="bg-blue-900/30 border-blue-700/30 text-blue-100 placeholder:text-blue-500"
                  title={configs.cpPath} // Mostrar la ruta completa en el tooltip
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 bg-blue-900/50 border-blue-700/50 hover:bg-blue-800/50"
                  onClick={() => openFilePicker(cpFileRef, 'cpPath', ['xlsx', 'xls'], FILE_CATEGORIES.CP)}
                  title="Buscar archivo CP"
                >
                  <FolderOpen className="h-4 w-4 text-blue-300" />
                </Button>
              </div>
              <Button
                onClick={() => validateAndSave('cpConfigured')}
                className="mt-2 bg-blue-700 hover:bg-blue-600 text-white"
                variant="default"
                disabled={configStatus.cpConfigured}
              >
                Guardar configuración CP
              </Button>
            </div>
          </div>

          <div className="space-y-4 p-4 rounded-lg bg-blue-950/50 border border-blue-800/30">
            <h3 className="text-lg font-medium flex items-center gap-2 text-blue-200">
              <File className="h-5 w-5 text-blue-400" />
              Documento de Gestión
              {configStatus.gestionConfigured ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : (
                <X className="h-5 w-5 text-red-500" />
              )}
            </h3>
            <div className="grid gap-2">
              {/* Input oculto para selección de archivo gestión (solo para web) */}
              <input
                type="file"
                ref={gestionFileRef}
                className="hidden"
                onChange={(e) => handleFileSelect(e, 'gestionPath')}
                accept=".xlsx,.xls"
              />

              <Label htmlFor="gestionPath" className="text-blue-300">Ruta del archivo de gestión</Label>
              <div className="flex gap-2">
                <Input
                  id="gestionPath"
                  name="gestionPath"
                  value={getDisplayPath(configs.gestionPath)}
                  onChange={handleChange}
                  placeholder="./data/_gestion/PlanillaGestion5Reglas.xlsx"
                  className="bg-blue-900/30 border-blue-700/30 text-blue-100 placeholder:text-blue-500"
                  title={configs.gestionPath} // Mostrar la ruta completa en el tooltip
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 bg-blue-900/50 border-blue-700/50 hover:bg-blue-800/50"
                  onClick={() => openFilePicker(gestionFileRef, 'gestionPath', ['xlsx', 'xls'], FILE_CATEGORIES.GESTION)}
                  title="Buscar archivo de gestión"
                >
                  <FolderOpen className="h-4 w-4 text-blue-300" />
                </Button>
              </div>
              <Button
                onClick={() => validateAndSave('gestionConfigured')}
                className="mt-2 bg-blue-700 hover:bg-blue-600 text-white"
                variant="default"
                disabled={configStatus.gestionConfigured}
              >
                Guardar configuración gestión
              </Button>
            </div>
          </div>

          <div className="space-y-4 p-4 rounded-lg bg-blue-950/50 border border-blue-800/30">
            <h3 className="text-lg font-medium flex items-center gap-2 text-blue-200">
              <Database className="h-5 w-5 text-blue-400" />
              Configuración de Base de Datos
              {configStatus.dbConfigured ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : (
                <X className="h-5 w-5 text-red-500" />
              )}
            </h3>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dbUrl" className="text-blue-300">URL de conexión</Label>
                <Input
                  id="dbUrl"
                  name="dbUrl"
                  value={configs.dbUrl}
                  onChange={handleChange}
                  placeholder="mongodb://localhost:27017"
                  className="bg-blue-900/30 border-blue-700/30 text-blue-100 placeholder:text-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="dbUser" className="text-blue-300">Usuario</Label>
                  <Input
                    id="dbUser"
                    name="dbUser"
                    value={configs.dbUser}
                    onChange={handleChange}
                    placeholder="admin"
                    className="bg-blue-900/30 border-blue-700/30 text-blue-100 placeholder:text-blue-500"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dbPassword" className="text-blue-300">Contraseña</Label>
                  <Input
                    id="dbPassword"
                    name="dbPassword"
                    type="password"
                    value={configs.dbPassword}
                    onChange={handleChange}
                    placeholder="******"
                    className="bg-blue-900/30 border-blue-700/30 text-blue-100 placeholder:text-blue-500"
                  />
                </div>
              </div>
              <Button
                onClick={() => validateAndSave('dbConfigured')}
                className="mt-2 w-full bg-blue-700 hover:bg-blue-600 text-white"
                variant="default"
                disabled={configStatus.dbConfigured}
              >
                Guardar configuración de base de datos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfigurationPanel;
