import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Brain, Loader2, Play, X, Check, InfoIcon, DownloadIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { utils, writeFile } from 'xlsx';

interface AgentExecutionPanelProps {
  endpoints: {
    tiraToDB: string;
    loadFileHistorico: string;
    cpToDB: string;
    readFileGestion: string;
    procesarAgente: string;
  };
  selectedItem?: any;
}

const AgentExecutionPanel = ({ endpoints, selectedItem }: AgentExecutionPanelProps) => {
  const [selectedAtmCode, setSelectedAtmCode] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentItem, setCurrentItem] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [processedAtms, setProcessedAtms] = useState<any[]>([]);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  const [processStartTime, setProcessStartTime] = useState<number | null>(null);
  const [currentProcessTime, setCurrentProcessTime] = useState<number>(0);
  const [currentItemStartTime, setCurrentItemStartTime] = useState<number | null>(null);
  const [currentItemProcessTime, setCurrentItemProcessTime] = useState<number>(0);

  const [availableData, setAvailableData] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const processingRef = React.useRef({
    isExecuting: false,
    currentIndex: 0
  });

  const currentItemProcessTimeRef = useRef<number>(0);

  useEffect(() => {
    if (selectedItem) {
      const code = selectedItem["CÓDIGO"] || selectedItem["CODIGO"];
      if (code) {
        console.log("Estableciendo ATM seleccionado:", code);
        setSelectedAtmCode(code.toString());
      }
    }
  }, [selectedItem]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isExecuting && processStartTime) {
      timer = setInterval(() => {
        setCurrentProcessTime(Date.now() - processStartTime);
      }, 100);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isExecuting, processStartTime]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isExecuting && currentItemStartTime) {
      timer = setInterval(() => {
        const newTime = Date.now() - currentItemStartTime;
        setCurrentItemProcessTime(newTime);
        currentItemProcessTimeRef.current = newTime;
      }, 100);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isExecuting, currentItemStartTime]);

  useEffect(() => {
    processingRef.current = {
      isExecuting,
      currentIndex: currentItem
    };
  }, [isExecuting, currentItem]);

  const fetchAvailableData = async () => {
    setIsLoadingData(true);
    try {
      const response = await fetch('http://localhost:5678/webhook/01e6ec94-185e-480d-9f09-514dda724681');

      if (!response.ok) {
        throw new Error(`Error en la respuesta: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log('Datos recibidos para procesamiento:', responseData);

      const rawData = Array.isArray(responseData) ? responseData : [responseData];
      console.log('Array preparado para procesar:', rawData);
      console.log('Cantidad de registros:', rawData.length);

      const processedData: any[] = [];

      for (const item of rawData) {
        if (!item || typeof item !== 'object' || !item._id) continue;

        const jsonKey = Object.keys(item).find(key => key.startsWith('json'));

        if (jsonKey && item[jsonKey] && typeof item[jsonKey] === 'object') {
          processedData.push({
            _id: item._id,
            jsonKey: jsonKey,
            jsonData: item[jsonKey],
            originalItem: item
          });
        }
      }

      console.log('Registros válidos procesados:', processedData.length);

      if (processedData.length === 0) {
        throw new Error('No se encontraron registros con el formato esperado');
      }

      const filteredData = processedData.filter(item => {
        const jsonData = item.jsonData;
        return (jsonData["ESTADO"] === "SOBRANTE" && jsonData["REMANENTES"] !== 0) ||
               jsonData["ESTADO"] === "FALTANTE";
      });

      console.log('Registros filtrados según criterios de categorización:', filteredData.length);

      const sobrantes = filteredData.filter(item =>
        item.jsonData["ESTADO"] === "SOBRANTE" ||
        (item.jsonData["SOBRANTE"] && item.jsonData["SOBRANTE"] !== " ")
      );

      const faltantes = filteredData.filter(item =>
        item.jsonData["ESTADO"] === "FALTANTE" ||
        (item.jsonData["FALTANTE"] && item.jsonData["FALTANTE"] !== " ")
      );

      console.log(`Datos filtrados: ${sobrantes.length} sobrantes, ${faltantes.length} faltantes`);

      setAvailableData(filteredData);

      toast.success(`Se han cargado ${filteredData.length} registros para procesar`);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error(`Error al cargar datos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      setAvailableData([]);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleStart = async () => {
    console.log("Iniciando procesamiento");
    setIsExecuting(true);
    setProgress(0);
    setProcessedAtms([]);
    setProcessStartTime(Date.now());

    if (selectedAtmCode) {
      console.log(`Procesando un solo ATM: ${selectedAtmCode}`);
      setTotalItems(1);
      setCurrentItem(0);
      await processSelectedItem();
    } else {
      console.log(`Procesando todos los ATMs: ${availableData.length} disponibles`);
      setTotalItems(availableData.length);
      setCurrentItem(0);

      if (availableData.length > 0) {
        processingRef.current.isExecuting = true;
        await processItemsSequentially(0);
      } else {
        toast.error("No hay ATMs disponibles para procesar");
        setIsExecuting(false);
        setProcessStartTime(null);
      }
    }
  };

  const processSelectedItem = async () => {
    if (isExecuting) return;

    let itemToProcess: any = null;

    if (selectedItem) {
      itemToProcess = {
        jsonData: selectedItem,
        originalItem: { _id: selectedItem._id || "custom" }
      };
    } else if (selectedAtmCode) {
      itemToProcess = availableData.find(item =>
        String(item.jsonData["CÓDIGO"]) === selectedAtmCode ||
        String(item.jsonData["CODIGO"]) === selectedAtmCode
      );

      if (!itemToProcess) {
        toast.error(`No se encontró el ATM con código ${selectedAtmCode}`);
        return;
      }
    }

    if (!itemToProcess) {
      toast.error("No se ha seleccionado ningún ATM para procesar");
      return;
    }

    setIsExecuting(true);
    setCurrentItemStartTime(Date.now());
    setProgress(25);

    try {
      const processedId = itemToProcess.originalItem._id;

      if (processedAtms.some(atm => atm.metadata._id === processedId)) {
        console.log(`ATM ${processedId} ya fue procesado`);
        return;
      }

      const response = await fetch(endpoints.procesarAgente, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemToProcess.originalItem)
      });

      if (!response.ok) {
        throw new Error(`Error en la respuesta: ${response.status} ${response.statusText}`);
      }

      const responseText = await response.text();
      let result;

      try {
        result = JSON.parse(responseText);
        localStorage.setItem(`agentResponse_${processedId}`, responseText);
      } catch (e) {
        throw new Error('La respuesta del servidor no es un JSON válido');
      }

      setProgress(100);
      setCurrentItem(1);

      const processedResult = {
        originalData: itemToProcess.jsonData,
        agentResponse: result,
        metadata: {
          processed: true,
          timestamp: new Date().toLocaleTimeString(),
          processTime: currentItemProcessTimeRef.current,
          _id: processedId
        }
      };

      setProcessedAtms(prev => {
        const exists = prev.some(item => item.metadata._id === processedId);
        if (exists) return prev;
        return [processedResult];
      });

      toast.success(`Procesamiento de ${itemToProcess.jsonData["NOMBRE CAJERO"] || itemToProcess.jsonData["CÓDIGO"]} completado`);
    } catch (error) {
      toast.error(`Error al procesar el ATM: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsExecuting(false);
      setProcessStartTime(null);
      setCurrentItemStartTime(null);
    }
  };

  const processItemsSequentially = async (currentIndex: number) => {
    if (currentIndex >= availableData.length || !processingRef.current.isExecuting) {
      setIsExecuting(false);
      setProcessStartTime(null);
      setCurrentItemStartTime(null);

      if (processingRef.current.isExecuting && currentIndex >= availableData.length) {
        toast.success('Procesamiento completado de todos los ATMs');
      }
      return;
    }

    const currentItem = availableData[currentIndex];
    const currentId = currentItem.originalItem._id;

    if (processedAtms.some(atm => atm.metadata._id === currentId)) {
      processItemsSequentially(currentIndex + 1);
      return;
    }

    setCurrentItem(currentIndex + 1);
    setProgress(Math.round(((currentIndex + 1) / availableData.length) * 100));
    setCurrentItemStartTime(Date.now());

    try {
      const response = await fetch(endpoints.procesarAgente, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentItem.originalItem)
      });

      if (!response.ok) {
        throw new Error(`Error en la respuesta: ${response.status} ${response.statusText}`);
      }

      const responseText = await response.text();
      let result;

      try {
        result = JSON.parse(responseText);
        localStorage.setItem(`agentResponse_${currentId}`, responseText);
      } catch (e) {
        throw new Error('La respuesta del servidor no es un JSON válido');
      }

      const itemProcessTime = Date.now() - currentItemStartTime!;
      const processedResult = {
        originalData: currentItem.jsonData,
        agentResponse: result,
        metadata: {
          processed: true,
          timestamp: new Date().toLocaleTimeString(),
          processTime: currentItemProcessTimeRef.current,
          _id: currentId
        }
      };

      setProcessedAtms(prev => {
        const exists = prev.some(item => item.metadata._id === currentId);
        if (exists) return prev;
        return [...prev, processedResult];
      });

      const atmName = currentItem.jsonData["NOMBRE CAJERO"] || currentItem.jsonData["CÓDIGO"];
      toast.success(`ATM ${atmName} (${currentIndex + 1}/${availableData.length}) procesado correctamente`);

      await new Promise(resolve => setTimeout(resolve, 1000));

      if (processingRef.current.isExecuting) {
        processItemsSequentially(currentIndex + 1);
      }
    } catch (error) {
      toast.error(`Error en ATM ${currentIndex + 1}: ${error instanceof Error ? error.message : 'Error desconocido'}`);

      await new Promise(resolve => setTimeout(resolve, 1000));
      if (processingRef.current.isExecuting) {
        processItemsSequentially(currentIndex + 1);
      }
    }
  };

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatProcessTime = (ms: number): string => {
    if (ms < 1000) {
      return `${ms}ms`;
    } else {
      const seconds = (ms / 1000).toFixed(1);
      return `${seconds}s`;
    }
  };

  const renderAtmOptions = () => {
    const options = availableData.map(item => ({
      value: String(item.jsonData["CÓDIGO"] || item.jsonData["CODIGO"]),
      label: `${item.jsonData["CÓDIGO"] || item.jsonData["CODIGO"]} - ${item.jsonData["NOMBRE CAJERO"] || "ATM"}`
    }));

    return options.map(option => (
      <SelectItem key={option.value} value={option.value}>
        {option.label}
      </SelectItem>
    ));
  };

  const handleViewResult = (result: any) => {
    setSelectedResult(result);
    setIsDetailsDialogOpen(true);
  };

  const renderDynamicResultContent = (result: any) => {
    if (!result) return null;

    const agentData = result.agentResponse || {};
    const explanation = agentData.EXPLICACIÓN;

    let explanationContent = {
      motivo: '',
      regla_aplicada: '',
      campos_modificados: []
    };

    if (explanation) {
      if (typeof explanation === 'object') {
        explanationContent = explanation;
      } else if (typeof explanation === 'string') {
        try {
          explanationContent = JSON.parse(explanation);
        } catch (e) {
          explanationContent.motivo = explanation;
        }
      }
    }

    return (
      <div className="space-y-4">
        <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-2">
            <Brain className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-purple-300 mb-1">Explicación del Agente</h4>
              <p className="text-sm text-purple-200">
                {explanationContent.motivo || "Sin explicación disponible"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Datos Originales */}
          <div>
            <h5 className="text-sm font-medium text-blue-300 mb-2">Datos Originales</h5>
            {[
              "CÓDIGO FONDO", "CIUDAD", "CÓDIGO", "NOMBRE CAJERO", "FECHA",
              "CONTADORES", "CONTABILIDAD", "REMANENTES", "PROVISIONES",
              "DIFERENCIA", "ESTADO", "TIPO DIFERENCIA", "SOBRANTE", "FALTANTE",
              "FECHA INICIO CICLO", "FECHA FIN CICLO", "RATIFICAR Y GRABAR DIFERENCIA",
              "JUSTIFICACIÓN", "NUEVO ESTADO", "VALOR A CRUZAR PARCIAL", "OBSERVACIÓN",
              "TIRA TRXN", "RESPONSABLE", "CUPO", "DIFERENCIA EN CUPO", "TDV"
            ].map((key) => {
              const value = result.originalData?.[key];
              const exists = result.originalData?.hasOwnProperty(key);
              const isModified = explanationContent.campos_modificados?.includes(key);

              return (
                <div key={key} className={`flex justify-between p-1 ${
                  isModified ? 'bg-blue-900/30 rounded border border-yellow-500/20' : ''
                }`}>
                  <span className="text-xs text-blue-400">{key}</span>
                  <span className={`text-xs font-mono ${
                    !exists ? 'line-through text-blue-400/50' :
                    isModified ? 'line-through text-blue-400/70' :
                    key === 'SOBRANTE' ? 'text-green-400' :
                    key === 'FALTANTE' ? 'text-red-400' :
                    'text-blue-200'
                  }`}>
                    {exists ? String(value || '-') : '-'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Datos del Agente */}
          <div>
            <h5 className="text-sm font-medium text-blue-300 mb-2">Resultado del Agente</h5>
            {[
              "CÓDIGO FONDO", "CIUDAD", "CÓDIGO", "NOMBRE CAJERO", "FECHA",
              "CONTADORES", "CONTABILIDAD", "REMANENTES", "PROVISIONES",
              "DIFERENCIA", "ESTADO", "TIPO DIFERENCIA", "SOBRANTE", "FALTANTE",
              "FECHA INICIO CICLO", "FECHA FIN CICLO", "RATIFICAR Y GRABAR DIFERENCIA",
              "JUSTIFICACIÓN", "NUEVO ESTADO", "VALOR A CRUZAR PARCIAL", "OBSERVACIÓN",
              "TIRA TRXN", "RESPONSABLE", "CUPO", "DIFERENCIA EN CUPO", "TDV"
            ].map((key) => {
              if (key === 'EXPLICACIÓN') return null;

              const value = agentData[key];
              const exists = agentData.hasOwnProperty(key);
              const isModified = explanationContent.campos_modificados?.includes(key);
              const isNewField = !result.originalData?.hasOwnProperty(key) && exists;
              const forceModified = [
                'JUSTIFICACIÓN',
                'RATIFICAR Y GRABAR DIFERENCIA',
                'NUEVO ESTADO',
                'OBSERVACIÓN'
              ].includes(key);

              return (
                <div key={key} className={`flex justify-between p-1 ${
                  (isModified || isNewField || forceModified) ? 'bg-blue-900/30 rounded border border-yellow-500/20' : ''
                }`}>
                  <span className="text-xs text-blue-400 flex items-center gap-1">
                    {key}
                    {(isModified || isNewField || forceModified) && exists && (
                      <Badge variant="outline" className="bg-yellow-900/30 text-yellow-200 text-[10px] px-1">
                        {isNewField ? 'Nuevo' : 'Modificado'}
                      </Badge>
                    )}
                  </span>
                  <span className={`text-xs font-mono ${
                    !exists ? 'line-through text-blue-400/50' :
                    key === 'SOBRANTE' ? 'text-green-400' :
                    key === 'FALTANTE' ? 'text-red-400' :
                    (isModified || isNewField || forceModified) ? 'text-yellow-300 font-medium' :
                    'text-blue-200'
                  }`}>
                    {exists ? String(value || '-') : '-'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 border-t border-blue-800/30 pt-4">
          <div className="space-y-3">
            {explanationContent.regla_aplicada && (
              <div className="text-xs">
                <span className="text-blue-400">Regla Aplicada: </span>
                <Badge variant="outline" className="bg-blue-900/30 text-blue-200 border-blue-500/30">
                  {explanationContent.regla_aplicada}
                </Badge>
              </div>
            )}

            {explanationContent.campos_modificados?.length > 0 && (
              <div>
                <span className="text-xs text-blue-400 block mb-1">Campos Modificados:</span>
                <div className="flex flex-wrap gap-1">
                  {explanationContent.campos_modificados.map((field: string) => (
                    <Badge
                      key={field}
                      className="bg-yellow-900/30 text-yellow-200 border-yellow-500/30 text-xs"
                    >
                      {field}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const handleExportToExcel = () => {
    if (!processedAtms.length) {
      toast.error('No hay resultados para exportar');
      return;
    }

    // Preparar los datos para el Excel
    const excelData = processedAtms.map(atm => {
      const originalData = atm.originalData || {};
      const agentData = atm.agentResponse || {};
      const explanation = typeof agentData.EXPLICACIÓN === 'object'
        ? agentData.EXPLICACIÓN
        : { motivo: agentData.EXPLICACIÓN };

        console.log(agentData);
      return {
        'CÓDIGO FONDO': agentData['CÓDIGO FONDO'] || originalData['CÓDIGO FONDO'] || '-',
        'CIUDAD': agentData['CIUDAD'] || originalData['CIUDAD'] || '-',
        'CÓDIGO': agentData['CÓDIGO'] || originalData['CÓDIGO'] || '-',
        'NOMBRE CAJERO': agentData['NOMBRE CAJERO'] || originalData['NOMBRE CAJERO'] || '-',
        'FECHA': agentData['FECHA'] || originalData['FECHA'] || '-',
        'CONTADORES': agentData['CONTADORES'] || originalData['CONTADORES'] || '-',
        'CONTABILIDAD': agentData['CONTABILIDAD'] || originalData['CONTABILIDAD'] || '-',
        'REMANENTES': agentData['REMANENTES'] || originalData['REMANENTES'] || '-',
        'PROVISIONES': agentData['PROVISIONES'] || originalData['PROVISIONES'] || '-',
        'DIFERENCIA': agentData['DIFERENCIA'] || originalData['DIFERENCIA'] || '-',
        'ESTADO': originalData['ESTADO'] || '-',
        'TIPO DIFERENCIA': agentData['TIPO DIFERENCIA'] || originalData['TIPO DIFERENCIA'] || '-',
        'SOBRANTE': agentData['SOBRANTE'] || originalData['SOBRANTE'] || '-',
        'FALTANTE': agentData['FALTANTE'] || originalData['FALTANTE'] || '-',
        'FECHA INICIO CICLO': agentData['FECHA INICIO CICLO'] || originalData['FECHA INICIO CICLO'] || '-',
        'FECHA FIN CICLO': agentData['FECHA FIN CICLO'] || originalData['FECHA FIN CICLO'] || '-',
        'RATIFICAR Y GRABAR DIFERENCIA': agentData['RATIFICAR Y GRABAR DIFERENCIA'] || originalData['RATIFICAR Y GRABAR DIFERENCIA'] || '-',
        'JUSTIFICACIÓN': agentData['JUSTIFICACIÓN'] || originalData['JUSTIFICACIÓN'] || '-',
        'NUEVO ESTADO': agentData['NUEVO ESTADO'] || '-',
        'VALOR A CRUZAR PARCIAL': agentData['VALOR A CRUZAR PARCIAL'] || originalData['VALOR A CRUZAR PARCIAL'] || '-',
        'OBSERVACIÓN': agentData['OBSERVACIÓN'] || originalData['OBSERVACIÓN'] || '-',
        'TIRA TRXN': agentData['TIRA TRXN'] || originalData['TIRA TRXN'] || '-',
        'RESPONSABLE': agentData['RESPONSABLE'] || originalData['RESPONSABLE'] || '-',
        'CUPO': agentData['CUPO'] || originalData['CUPO'] || '-',
        'DIFERENCIA EN CUPO': agentData['DIFERENCIA EN CUPO'] || originalData['DIFERENCIA EN CUPO'] || '-',
        'TDV': agentData['TDV'] || originalData['TDV'] || '-',
        // Información adicional
        'REGLA APLICADA': explanation.regla_aplicada || '-',
        'MOTIVO': explanation.motivo || '-',
        'CAMPOS MODIFICADOS': Array.isArray(explanation.campos_modificados)
          ? explanation.campos_modificados.join(', ')
          : '-',
        'TIEMPO DE PROCESO': formatProcessTime(atm.metadata.processTime) || '-',
        'HORA DE PROCESO': atm.metadata.timestamp || '-'
      };
    });

    // Crear el libro de Excel
    const ws = utils.json_to_sheet(excelData);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Resultados');

    // Ajustar el ancho de las columnas
    const columnWidths = Object.keys(excelData[0]).map(key => ({
      wch: Math.max(key.length, 15)
    }));
    ws['!cols'] = columnWidths;

    // Generar el archivo
    const fecha = new Date().toISOString().split('T')[0];
    writeFile(wb, `Resultados_Procesamiento_ATMs_${fecha}.xlsx`);

    toast.success('Archivo Excel generado correctamente');
  };

  return (
    <div className="grid gap-6">
      <Card className="bg-blue-900/20 border-blue-800/30 backdrop-blur-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-blue-100 flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-400" />
                Ejecución del Agente de IA
              </CardTitle>
              <CardDescription className="text-blue-300">
                Configure y ejecute el agente de IA para procesar documentos
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="bg-blue-900/40 border-blue-700/40 text-blue-300 hover:text-blue-200"
              onClick={fetchAvailableData}
              disabled={isLoadingData}
            >
              <Loader2 className={`h-4 w-4 ${isLoadingData ? 'animate-spin' : ''}`} />
              <span className="ml-2">Actualizar ATMs</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Card className="bg-blue-950/50 border border-blue-800/30 p-4">
            <h3 className="text-lg font-medium text-blue-200 mb-4">Configuración de Ejecución</h3>

            {selectedItem && (
              <div className="mb-6 p-4 bg-blue-900/30 border border-blue-700/30 rounded-lg">
                <h4 className="text-md font-medium text-blue-200 mb-2">ATM Seleccionado para Evaluación</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <span className="block text-xs text-blue-400">CÓDIGO</span>
                    <span className="block text-blue-100 font-mono">{selectedItem["CÓDIGO"] || selectedItem["CODIGO"] || "-"}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-blue-400">NOMBRE CAJERO</span>
                    <span className="block text-blue-100">{selectedItem["NOMBRE CAJERO"] || selectedItem["NOMBRE_CAJERO"] || "-"}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-blue-400">CIUDAD</span>
                    <span className="block text-blue-100">{selectedItem["CIUDAD"] || "-"}</span>
                  </div>
                  {selectedItem["SOBRANTE"] && (
                    <div>
                      <span className="block text-xs text-blue-400">SOBRANTE</span>
                      <span className="block text-green-400 font-mono">{selectedItem["SOBRANTE"]}</span>
                    </div>
                  )}
                  {selectedItem["FALTANTE"] && (
                    <div>
                      <span className="block text-xs text-blue-400">FALTANTE</span>
                      <span className="block text-red-400 font-mono">{selectedItem["FALTANTE"]}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-blue-300 mb-2">Seleccione modo de ejecución:</label>
                <div className="flex gap-4">
                  <Button
                    variant={selectedAtmCode ? 'outline' : 'default'}
                    className={`flex gap-2 ${selectedAtmCode ? 'bg-blue-900/40 border-blue-700/40 text-blue-200' : 'bg-blue-600 hover:bg-blue-700'}`}
                    onClick={() => setSelectedAtmCode('')}
                  >
                    Procesar Todos
                  </Button>
                  {!selectedItem && (
                    <div className="flex-1">
                      <Select onValueChange={setSelectedAtmCode} value={selectedAtmCode}>
                        <SelectTrigger className="w-full bg-blue-900/40 border-blue-700/40 text-blue-100">
                          <SelectValue placeholder="Seleccione un ATM específico" />
                        </SelectTrigger>
                        <SelectContent className="bg-blue-950 border-blue-800 text-blue-100">
                          {isLoadingData ? (
                            <div className="p-2 flex items-center justify-center">
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Cargando ATMs...
                            </div>
                          ) : availableData.length > 0 ? (
                            renderAtmOptions()
                          ) : (
                            <div className="p-2 text-center text-blue-300">
                              No hay ATMs disponibles
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6">
              {isExecuting && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-blue-400 mb-2">
                    <span>Procesando: {currentItem} de {totalItems} ATMs</span>
                    <span className="font-mono">{formatTime(currentProcessTime)}</span>
                  </div>
                  <Progress value={progress} className="h-2 bg-blue-900" />

                  <div className="mt-2 text-xs text-blue-400 text-right">
                    Tiempo del ATM actual: <span className="font-mono">{formatTime(currentItemProcessTime)}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button
                  className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
                  disabled={isExecuting || (!selectedAtmCode && availableData.length === 0 && !selectedItem)}
                  onClick={handleStart}
                >
                  {isExecuting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      {selectedAtmCode || selectedItem ? 'Procesar ATM' : 'Procesar Todos'}
                    </>
                  )}
                </Button>

                {isExecuting && (
                  <Button
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => {
                      setIsExecuting(false);
                      processingRef.current.isExecuting = false;
                      setProcessStartTime(null);
                      setCurrentItemStartTime(null);
                      toast.info('Procesamiento cancelado');
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {processedAtms.length > 0 && (
            <Card className="bg-blue-950/50 border border-blue-800/30 overflow-hidden">
              <div className="flex justify-between items-center p-4">
                <h3 className="text-lg font-medium text-blue-200">Resultados del Procesamiento</h3>
                <Badge className="bg-blue-700">{processedAtms.length}</Badge>
              </div>
              <div className="border-t border-blue-800/30">
                <div className="overflow-auto max-h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-blue-900/50">
                        <TableHead className="text-blue-300">CÓDIGO</TableHead>
                        <TableHead className="text-blue-300">NOMBRE CAJERO</TableHead>
                        <TableHead className="text-blue-300">CIUDAD</TableHead>
                        <TableHead className="text-blue-300">ESTADO</TableHead>
                        <TableHead className="text-blue-300">TIEMPO</TableHead>
                        <TableHead className="text-blue-300 text-right">ACCIÓN</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processedAtms.map((item, index) => (
                        <TableRow key={index} className="hover:bg-blue-900/50 border-blue-800/30">
                          <TableCell className="text-blue-100 font-mono">
                            {item.originalData["CÓDIGO"] || item.originalData["CODIGO"] || "-"}
                          </TableCell>
                          <TableCell className="text-blue-100">
                            {item.originalData["NOMBRE CAJERO"] || item.originalData["NOMBRE_CAJERO"] || "-"}
                          </TableCell>
                          <TableCell className="text-blue-100">
                            {item.originalData["CIUDAD"] || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${
                              item.originalData["ESTADO"] === "SOBRANTE" ? "bg-green-600/80" :
                              item.originalData["ESTADO"] === "FALTANTE" ? "bg-red-600/80" :
                              "bg-blue-600/80"
                            }`}>
                              {item.originalData["ESTADO"] || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-blue-300 text-xs font-mono">
                            {item.metadata.processTime ? formatProcessTime(item.metadata.processTime) : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-blue-900/50 border-blue-700/50 hover:bg-blue-800/50 text-blue-300"
                              onClick={() => handleViewResult(item)}
                            >
                              Ver Resultado
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </Card>
          )}

          <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
            <DialogContent className="bg-blue-950 border border-blue-800 text-blue-100 max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-blue-200">
                  Resultado Detallado - ATM {selectedResult?.["CÓDIGO"] || selectedResult?.["CODIGO"]}
                </DialogTitle>
                <DialogDescription className="text-blue-400">
                  {selectedResult?.["NOMBRE CAJERO"] || ""} - {selectedResult?.["CIUDAD"] || ""}
                </DialogDescription>
              </DialogHeader>
              {selectedResult && renderDynamicResultContent(selectedResult)}
              <DialogFooter className="border-t border-blue-800/30 pt-4 mt-4">
                <Button
                  variant="outline"
                  className="bg-blue-800 hover:bg-blue-700 border-blue-600"
                  onClick={() => setIsDetailsDialogOpen(false)}
                >
                  Cerrar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {!isExecuting && processedAtms.length === 0 && (
            <div className="text-center py-12 px-4 bg-blue-950/30 rounded-lg border border-blue-800/30">
              <Brain className="mx-auto h-12 w-12 text-purple-500/60 mb-4" />
              <h3 className="text-lg font-medium text-blue-300 mb-2">
                {selectedItem
                  ? "ATM seleccionado listo para procesamiento"
                  : "Agente de IA listo para ejecutarse"}
              </h3>
              <p className="text-blue-400 max-w-md mx-auto mb-6">
                {selectedItem
                  ? `Configure el modo de procesamiento deseado para analizar el ATM ${selectedItem["NOMBRE CAJERO"] || selectedItem["CÓDIGO"] || "seleccionado"}.`
                  : "Configure el modo de procesamiento deseado y ejecute el agente para analizar y procesar los documentos."}
              </p>
              <Button
                className="bg-purple-600 hover:bg-purple-700 text-white"
                disabled={(!selectedAtmCode && !selectedItem) ||
                         (availableData.length === 0 && !selectedItem)}
                onClick={handleStart}
              >
                Iniciar Procesamiento
              </Button>
            </div>
          )}

          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-blue-100">Configuración de Ejecución</h3>
            {processedAtms.length > 0 && !isExecuting && (
              <Button
                onClick={handleExportToExcel}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <DownloadIcon className="w-4 h-4 mr-2" />
                Exportar Resultados
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentExecutionPanel;
