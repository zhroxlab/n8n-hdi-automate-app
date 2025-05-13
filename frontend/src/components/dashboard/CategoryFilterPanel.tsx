import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Filter, Loader2, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';

interface CategoryFilterPanelProps {
  setFilteredDataAvailable: React.Dispatch<React.SetStateAction<boolean>>;
  endpoints: {
    tiraToDB: string;
    loadFileHistorico: string;
    cpToDB: string;
    readFileGestion: string;
    procesarAgente: string;
  };
  initialData?: any[];
  onItemSelect?: (item: any) => void;
}

interface GestionDocument {
  _id?: string;
  [key: string]: any;
}

const CategoryFilterPanel = ({ setFilteredDataAvailable, endpoints, initialData = [], onItemSelect }: CategoryFilterPanelProps) => {
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [rawData, setRawData] = useState<GestionDocument[]>(initialData);
  const [filteredData, setFilteredData] = useState<{
    sobrantes: GestionDocument[],
    faltantes: GestionDocument[]
  } | null>(null);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  // Cuando cambian los initialData, actualizamos rawData
  useEffect(() => {
    if (initialData && initialData.length > 0) {
      setRawData(initialData);
      console.log("Datos iniciales recibidos en CategoryFilterPanel:", initialData);
      toast.info(`${initialData.length} registros listos para categorización`);
    }
  }, [initialData]);

  // Cargar los datos crudos de la colección gestion_document
  const fetchRawData = async () => {
    if (initialData && initialData.length > 0) {
      setRawData(initialData);
      toast.success(`Se han cargado ${initialData.length} registros desde la previsualización`);
      return;
    }

    setFetchingData(true);
    try {
      // En un entorno real, esto sería una llamada a un endpoint que consulta la base de datos
      const response = await fetch(`${endpoints.readFileGestion}/documents`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Error al obtener documentos: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data && Array.isArray(data.documents)) {
        setRawData(data.documents);
        console.log(`Se han cargado ${data.documents.length} documentos de la colección`);
        toast.success(`Se han cargado ${data.documents.length} documentos para categorización`);
      } else {
        throw new Error("El formato de la respuesta no es el esperado");
      }
    } catch (error) {
      console.error('Error al cargar documentos:', error);
      toast.error(`Error al cargar documentos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setFetchingData(false);
    }
  };

  // Aplicar filtros localmente sobre los datos ya cargados
  const handleExecuteFilter = () => {
    if (rawData.length === 0) {
      toast.error("No hay datos para filtrar. Cargue primero los documentos.");
      return;
    }

    setLoading(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress(prev => {
        const newValue = prev + 5;
        return newValue > 95 ? 95 : newValue;
      });
    }, 40);

    try {
      console.log("Aplicando filtros a los datos...");
      console.log("Datos a filtrar:", rawData);

      // Aplicar los filtros localmente
      const sobrantes = rawData.filter(item =>
        item.ESTADO === "SOBRANTE" &&
        item.REMANENTES !== undefined &&
        item.REMANENTES !== null
      ); // item.REMANENTES !== 0 &&

      const faltantes = rawData.filter(item =>
        item.ESTADO === "FALTANTE"
      );

      console.log(`Filtrado completo: ${sobrantes.length} sobrantes, ${faltantes.length} faltantes`);

      clearInterval(interval);
      setProgress(100);

      setFilteredData({
        sobrantes,
        faltantes
      });

      setFilteredDataAvailable(sobrantes.length > 0 || faltantes.length > 0);
      toast.success('Datos categorizados correctamente');

    } catch (error) {
      console.error('Error en categorización:', error);
      clearInterval(interval);
      setProgress(0);
      toast.error(`Error al categorizar datos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  // Handler for selecting an item
  const handleSelectItem = (item: GestionDocument) => {
    console.log("Item seleccionado para el agente:", item);
    toast.info(`Enviando datos de ${item["NOMBRE CAJERO"] || item["NOMBRE_CAJERO"] || "ATM"} al agente`);

    if (onItemSelect) {
      onItemSelect(item);
    } else {
      // Navigate to the agent evaluator page with selected item data
      navigate('/agente/task_evaluate_differences', {
        state: { selectedItem: item }
      });
    }
  };

  return (
    <Card className="bg-blue-900/20 border-blue-800/30 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-blue-100 flex items-center gap-2">
          <Filter className="h-5 w-5 text-blue-400" />
          Categorización de Datos
        </CardTitle>
        <CardDescription className="text-blue-300">
          Filtra los datos del documento de gestión en categorías de Sobrantes y Faltantes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Card className="bg-blue-950/50 border border-blue-800/30 p-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h3 className="text-lg font-medium text-blue-200 mb-1">Filtro de Categorización</h3>
              <p className="text-sm text-blue-400">
                Aplica los siguientes criterios:
              </p>
              <ul className="list-disc list-inside text-xs text-blue-300 mt-2">
                <li>ESTADO = "SOBRANTE" y REMANENTES != 0</li>
                <li>o ESTADO = "FALTANTE"</li>
              </ul>
              <div className="mt-2 text-xs text-blue-300">
                {rawData.length > 0 ? (
                  <p>Datos disponibles: {rawData.length} registros</p>
                ) : (
                  <p>No hay datos disponibles para filtrar</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={fetchRawData}
                disabled={fetchingData}
                className="bg-blue-800 hover:bg-blue-700 text-white flex items-center gap-2"
                variant="outline"
              >
                {fetchingData ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Recargar datos
                  </>
                )}
              </Button>
              <Button
                onClick={handleExecuteFilter}
                disabled={loading || rawData.length === 0}
                className="bg-blue-700 hover:bg-blue-600 text-white flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Filter className="h-4 w-4" />
                    Aplicar filtros
                  </>
                )}
              </Button>
            </div>
          </div>

          {loading && (
            <div className="mb-6">
              <Progress value={progress} className="h-2 mb-2 bg-blue-900" />
              <div className="flex justify-between text-xs text-blue-400">
                <span>Aplicando filtros...</span>
                <span>{progress}%</span>
              </div>
            </div>
          )}
        </Card>

        {filteredData && (
          <Tabs defaultValue="sobrantes" className="w-full">
            <TabsList className="w-full md:w-auto grid grid-cols-2 mb-6 bg-blue-950/50 backdrop-blur-sm border border-blue-800/30 p-1">
              <TabsTrigger value="sobrantes" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                Sobrantes <Badge className="ml-2 bg-blue-700">{filteredData.sobrantes.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="faltantes" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                Faltantes <Badge className="ml-2 bg-blue-700">{filteredData.faltantes.length}</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sobrantes">
              <div className="overflow-auto max-h-[500px] border border-blue-800/30 rounded-md">
                <Table className="bg-blue-950/40">
                  <TableHeader>
                    <TableRow className="hover:bg-blue-900/50">
                      <TableHead className="text-blue-300">CÓDIGO</TableHead>
                      <TableHead className="text-blue-300">CIUDAD</TableHead>
                      <TableHead className="text-blue-300">NOMBRE CAJERO</TableHead>
                      <TableHead className="text-blue-300">SOBRANTE</TableHead>
                      <TableHead className="text-blue-300">RESPONSABLE</TableHead>
                      <TableHead className="text-blue-300 text-right">ACCIÓN</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.sobrantes.map((item, index) => (
                      <TableRow key={index} className="hover:bg-blue-900/50 border-blue-800/30">
                        <TableCell className="text-blue-100 font-mono">{item["CÓDIGO"] || item["CODIGO"] || "-"}</TableCell>
                        <TableCell className="text-blue-100">{item["CIUDAD"] || "-"}</TableCell>
                        <TableCell className="text-blue-100">{item["NOMBRE CAJERO"] || item["NOMBRE_CAJERO"] || "-"}</TableCell>
                        <TableCell className="text-green-400 font-mono">{item["SOBRANTE"] || "-"}</TableCell>
                        <TableCell className="text-blue-100">{item["RESPONSABLE"] || "-"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-blue-900/50 border-blue-700/50 hover:bg-blue-800/50 text-blue-300"
                            onClick={() => handleSelectItem(item)}
                          >
                            Ver Detalle
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="faltantes">
              <div className="overflow-auto max-h-[500px] border border-blue-800/30 rounded-md">
                <Table className="bg-blue-950/40">
                  <TableHeader>
                    <TableRow className="hover:bg-blue-900/50">
                      <TableHead className="text-blue-300">CÓDIGO</TableHead>
                      <TableHead className="text-blue-300">CIUDAD</TableHead>
                      <TableHead className="text-blue-300">NOMBRE CAJERO</TableHead>
                      <TableHead className="text-blue-300">FALTANTE</TableHead>
                      <TableHead className="text-blue-300">RESPONSABLE</TableHead>
                      <TableHead className="text-blue-300 text-right">ACCIÓN</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.faltantes.map((item, index) => (
                      <TableRow key={index} className="hover:bg-blue-900/50 border-blue-800/30">
                        <TableCell className="text-blue-100 font-mono">{item["CÓDIGO"] || item["CODIGO"] || "-"}</TableCell>
                        <TableCell className="text-blue-100">{item["CIUDAD"] || "-"}</TableCell>
                        <TableCell className="text-blue-100">{item["NOMBRE CAJERO"] || item["NOMBRE_CAJERO"] || "-"}</TableCell>
                        <TableCell className="text-red-400 font-mono">{item["FALTANTE"] || "-"}</TableCell>
                        <TableCell className="text-blue-100">{item["RESPONSABLE"] || "-"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-blue-900/50 border-blue-700/50 hover:bg-blue-800/50 text-blue-300"
                            onClick={() => handleSelectItem(item)}
                          >
                            Ver Detalle
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {!filteredData && !loading && (
          <div className="text-center py-12 px-4 bg-blue-950/30 rounded-lg border border-blue-800/30">
            <Filter className="mx-auto h-12 w-12 text-blue-500/60 mb-4" />
            <h3 className="text-lg font-medium text-blue-300 mb-2">Sin categorización aplicada</h3>
            <p className="text-blue-400 max-w-md mx-auto mb-6">
              Ejecute la categorización para visualizar los resultados según los criterios definidos.
            </p>
            <Button
              onClick={handleExecuteFilter}
              disabled={loading || rawData.length === 0}
              className="bg-blue-700 hover:bg-blue-600 text-white"
            >
              Ejecutar Categorización
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CategoryFilterPanel;
