
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Database, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

interface DataPreviewPanelProps {
  endpoints: {
    tiraToDB: string;
    loadFileHistorico: string;
    cpToDB: string;
    readFileGestion: string;
    procesarAgente: string;
  };
  onDataLoaded?: (data: any[]) => void;
}

interface GestionData {
  _id: string;
  [key: string]: any; // Para permitir jsonX dinámico
}

const DataPreviewPanel = ({ endpoints, onDataLoaded }: DataPreviewPanelProps) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<GestionData[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  
  const handleLoadData = async () => {
    setLoading(true);
    try {
      console.log('Iniciando solicitud al endpoint...');
      const response = await fetch('http://localhost:5678/webhook/01e6ec94-185e-480d-9f09-514dda724681');
      
      if (!response.ok) {
        throw new Error(`Error en la respuesta: ${response.status} ${response.statusText}`);
      }
      
      const responseData = await response.json();
      console.log('Datos recibidos:', responseData);
      
      // Verificar si la respuesta es un array o un objeto
      const rawData = Array.isArray(responseData) ? responseData : [responseData];
      console.log('Array preparado para procesar:', rawData);
      console.log('Cantidad de registros:', rawData.length);
      
      // Procesar cada elemento para extraer los datos del jsonX
      const processedData: GestionData[] = [];
      const uniqueColumns = new Set<string>();
      
      for (const item of rawData) {
        if (!item || typeof item !== 'object' || !item._id) continue;
        
        // Encontrar la primera clave que comience con "json"
        const jsonKey = Object.keys(item).find(key => key.startsWith('json'));
        
        if (jsonKey && item[jsonKey] && typeof item[jsonKey] === 'object') {
          // Obtener todas las columnas
          Object.keys(item[jsonKey]).forEach(key => uniqueColumns.add(key));
          
          // Agregar el elemento procesado
          processedData.push({
            _id: item._id,
            jsonData: item[jsonKey] // Almacenamos los datos bajo una clave común
          });
        }
      }
      
      console.log('Registros válidos procesados:', processedData.length);
      
      if (processedData.length === 0) {
        throw new Error('No se encontraron registros con el formato esperado');
      }
      
      setColumns(Array.from(uniqueColumns));
      setData(processedData);
      setCurrentPage(1); // Reiniciar a la primera página al cargar nuevos datos
      
      if (onDataLoaded) {
        // Transformar datos al formato esperado
        const transformedData = processedData.map(item => item.jsonData);
        onDataLoaded(transformedData);
      }
      
      toast.success(`Se han cargado ${processedData.length} registros correctamente`);
      
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error(`Error al cargar datos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      
      // Limpiar estado en caso de error
      setData([]);
      setColumns([]);
    } finally {
      setLoading(false);
    }
  };

  // Lógica de paginación
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    // Limitar el número de páginas mostradas para evitar sobrecarga visual
    const maxVisiblePages = 5;
    const pageNumbers = [];
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Ajustar startPage si estamos cerca del final
    startPage = Math.max(1, endPage - maxVisiblePages + 1);

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="cursor-pointer"
              aria-disabled={currentPage === 1}
            />
          </PaginationItem>
          
          {startPage > 1 && (
            <PaginationItem>
              <PaginationLink
                onClick={() => setCurrentPage(1)}
                className="cursor-pointer"
              >
                1
              </PaginationLink>
            </PaginationItem>
          )}
          
          {startPage > 2 && (
            <PaginationItem>
              <span className="px-2">...</span>
            </PaginationItem>
          )}
          
          {pageNumbers.map(page => (
            <PaginationItem key={page}>
              <PaginationLink
                onClick={() => setCurrentPage(page)}
                isActive={currentPage === page}
                className="cursor-pointer"
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}
          
          {endPage < totalPages - 1 && (
            <PaginationItem>
              <span className="px-2">...</span>
            </PaginationItem>
          )}
          
          {endPage < totalPages && (
            <PaginationItem>
              <PaginationLink
                onClick={() => setCurrentPage(totalPages)}
                className="cursor-pointer"
              >
                {totalPages}
              </PaginationLink>
            </PaginationItem>
          )}
          
          <PaginationItem>
            <PaginationNext 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="cursor-pointer"
              aria-disabled={currentPage === totalPages}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <Card className="bg-blue-900/20 border-blue-800/30 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-blue-100 flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-400" />
          Previsualización de Datos
        </CardTitle>
        <CardDescription className="text-blue-300">
          Vista previa de la planilla de gestión
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Button 
              onClick={handleLoadData} 
              disabled={loading} 
              className="bg-blue-700 hover:bg-blue-600 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cargando datos...
                </>
              ) : (
                'Cargar planilla de gestión'
              )}
            </Button>

            {data.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-blue-300">Registros por página:</span>
                <Select
                  value={String(itemsPerPage)}
                  onValueChange={(value) => {
                    setItemsPerPage(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[80px] bg-blue-900/40 border-blue-700/50">
                    <SelectValue placeholder="15" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {data.length > 0 ? (
            <>
              <div className="overflow-auto max-h-[500px] border border-blue-800/30 rounded-md">
                <Table className="bg-blue-950/40">
                  <TableHeader>
                    <TableRow className="hover:bg-blue-900/50">
                      {columns.map((column) => (
                        <TableHead key={column} className="text-blue-300">
                          {column}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentData.map((item, index) => (
                      <TableRow key={item._id || index} className="hover:bg-blue-900/50 border-blue-800/30">
                        {columns.map((column) => (
                          <TableCell key={`${item._id || index}-${column}`} className="text-blue-100">
                            {item.jsonData && item.jsonData[column] !== undefined ? 
                              String(item.jsonData[column]) : 
                              '-'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="flex justify-between items-center py-4">
                <div className="text-sm text-blue-300">
                  Mostrando {Math.min(data.length, 1) + startIndex} - {Math.min(endIndex, data.length)} de {data.length} registros
                </div>
                {renderPagination()}
              </div>
            </>
          ) : (
            <p className="text-center py-4 text-blue-400">No hay datos para mostrar</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DataPreviewPanel;
