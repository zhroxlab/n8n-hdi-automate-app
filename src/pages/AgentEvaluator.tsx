import React, { useState, useEffect } from 'react';
import CircularAnimation from '../components/CircularAnimation';
import { toast } from "sonner";
import { Zap, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from 'react-router-dom';
import { endpoints } from '@/config/endpoints';

const AgentEvaluator = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [originalData, setOriginalData] = useState<any | null>(null);
  const [completed, setCompleted] = useState(false);
  const [isLoadingOriginal, setIsLoadingOriginal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const selectedItem = location.state?.selectedItem;

  useEffect(() => {
    if (selectedItem) {
      console.log("Item recibido desde la categorización:", selectedItem);
      setOriginalData({ data: [selectedItem] });
    }
    
    handleStartProcess();
    
    if (!selectedItem) {
      fetchOriginalData();
    }
  }, []);

  const fetchOriginalData = async () => {
    setIsLoadingOriginal(true);
    try {
      console.log(`Obteniendo datos originales desde ${endpoints.readFileGestion}/filtered`);
      
      const response = await fetch(`${endpoints.readFileGestion}/filtered`);
      
      if (!response.ok) {
        throw new Error(`Error al obtener datos originales: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json().catch(e => {
        console.warn("Respuesta no es JSON válido");
        return { success: false, error: "Formato de respuesta inválido" };
      });
      
      console.log('Datos originales recibidos:', data);
      
      setOriginalData(data);
    } catch (error) {
      console.error("Error cargando datos originales:", error);
      toast.error(`Error al cargar los datos originales: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsLoadingOriginal(false);
    }
  };

  const handleStartProcess = async () => {
    setIsProcessing(true);
    setResult(null);
    setCompleted(false);

    toast.info("Iniciando evaluación de diferencias", {
      icon: <Zap className="h-5 w-5 text-ai-blue" />,
    });

    try {
      console.log(`Realizando llamada al endpoint del agente: ${endpoints.procesarAgente}`);
      
      const payload = selectedItem ? { itemData: selectedItem } : {};
      
      console.log("Payload enviado al agente:", payload);
      console.log("Tipo de payload:", typeof payload);
      console.log("JSON.stringify del payload:", JSON.stringify(payload));
      
      const response = await fetch(endpoints.procesarAgente, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`Error en la evaluación: ${response.status} ${response.statusText}`);
      }
      
      const responseText = await response.text();
      console.log('Respuesta cruda del agente:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Resultado parseado de la evaluación del agente:', data);
        
        localStorage.setItem('agentResponse', responseText);
        
      } catch (e) {
        console.error('Error parseando la respuesta como JSON:', e);
        throw new Error('La respuesta del servidor no es un JSON válido');
      }
      
      console.log('Estructura completa de la respuesta:', data);
      
      if (data && data.data) {
        console.log('Estructura de data:', data);
        console.log('data.data existe:', data.data);
        
        if (data.data.EXPLICACIÓN) {
          console.log('EXPLICACIÓN encontrada:', data.data.EXPLICACIÓN);
          
          if (typeof data.data.EXPLICACIÓN === 'object') {
            console.log('EXPLICACIÓN es un objeto');
            console.log('motivo en EXPLICACIÓN:', data.data.EXPLICACIÓN.motivo);
            console.log('regla_aplicada:', data.data.EXPLICACIÓN.regla_aplicada);
            console.log('campos_modificados:', data.data.EXPLICACIÓN.campos_modificados);
          } else if (typeof data.data.EXPLICACIÓN === 'string') {
            console.log('EXPLICACIÓN es un string:', data.data.EXPLICACIÓN);
            try {
              const explObj = JSON.parse(data.data.EXPLICACIÓN);
              console.log('EXPLICACIÓN parseada como objeto:', explObj);
              console.log('motivo en EXPLICACIÓN parseada:', explObj.motivo);
            } catch (e) {
              console.log('EXPLICACIÓN no es un JSON parseable');
            }
          }
        } else {
          console.log('No se encontró campo EXPLICACIÓN en la respuesta');
        }
      }
      
      if (data && data.success === false) {
        throw new Error(data.error || "Error desconocido en el procesamiento del agente");
      }
      
      setResult(data);
      setCompleted(true);
      toast.success("Evaluación finalizada con éxito", {
        icon: <Zap className="h-5 w-5 text-ai-blue" />,
      });
    } catch (error) {
      console.error('Error en evaluación del agente:', error);
      toast.error(`Error al procesar la evaluación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setCompleted(false);
    navigate('/dashboard');
  };

  const formatExplanation = (result: any) => {
    if (!result) return "";
    
    console.log("formatExplanation - Input result:", result);
    
    const explanation = result.EXPLICACIÓN;
    console.log("formatExplanation - Explanation field:", explanation);
    
    if (!explanation) return "";
    
    if (typeof explanation === 'string') {
      try {
        const parsedExp = JSON.parse(explanation);
        console.log("formatExplanation - Parsed explanation from string:", parsedExp);
        return parsedExp.motivo || parsedExp["motivo"] || explanation;
      } catch (e) {
        console.log("formatExplanation - Explanation is plain string, not JSON");
        return explanation;
      }
    }
    
    if (typeof explanation === 'object' && explanation !== null) {
      console.log("formatExplanation - Explanation is object with motivo:", explanation.motivo);
      return explanation.motivo || explanation["motivo"] || "";
    }
    
    return "";
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 bg-ai-darker">
      <div className="max-w-4xl w-full text-center mb-8 animate-fade-in">
        <h1 className="text-4xl font-bold mb-2 text-white tracking-tight">
          <span className="text-ai-blue text-glow">Evaluación</span> de Diferencias
        </h1>
        <p className="text-gray-400 max-w-xl mx-auto">
          Sistema de evaluación automática para análisis de diferencias en cajeros automáticos.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center w-full max-w-4xl animate-fade-in">
        {isProcessing ? (
          <div className="mb-4">
            <CircularAnimation isActive={isProcessing} />
          </div>
        ) : (
          <Tabs defaultValue="processed" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="processed">Datos Procesados</TabsTrigger>
              <TabsTrigger value="original">Datos Originales</TabsTrigger>
            </TabsList>

            <TabsContent value="processed">
              {completed && result && (
                <div className="animate-fade-in w-full">
                  <div className="glass-effect rounded-lg p-6 border border-ai-blue/20">
                    <h3 className="text-xl font-semibold text-ai-blue mb-4 text-glow">Resultado del Análisis</h3>

                    {/* EXPLICACIÓN AL INICIO - SIEMPRE SE MUESTRA */}
                    <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-4 mb-6">
                      <h4 className="text-sm font-medium text-purple-300 mb-2">Explicación del Agente</h4>
                      <p className="text-sm text-purple-200 whitespace-pre-wrap">
                        {typeof result.data?.EXPLICACIÓN === 'object' && result.data?.EXPLICACIÓN?.motivo 
                          ? result.data.EXPLICACIÓN.motivo 
                          : formatExplanation(result.data) || "El agente ha procesado este ATM sin proporcionar explicación detallada."}
                      </p>
                    </div>

                    <div className="bg-ai-dark p-6 rounded overflow-auto text-white/90 max-h-[500px]">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <InfoField label="CÓDIGO FONDO" value={result.data["CÓDIGO FONDO"]} />
                          <InfoField label="CIUDAD" value={result.data["CIUDAD"]} />
                          <InfoField label="CÓDIGO" value={result.data["CÓDIGO"]} />
                          <InfoField label="NOMBRE CAJERO" value={result.data["NOMBRE CAJERO"]} />
                          <InfoField label="FECHA" value={result.data["FECHA"]} />
                          <InfoField label="CONTADORES" value={result.data[" CONTADORES "]} currency />
                          <InfoField label="CONTABILIDAD" value={result.data[" CONTABILIDAD "]} currency />
                          <InfoField label="REMANENTES" value={result.data[" REMANENTES "]} currency />
                          <InfoField label="PROVISIONES" value={result.data[" PROVISIONES "]} currency />
                          <InfoField label="DIFERENCIA" value={result.data[" DIFERENCIA "]} currency highlight />
                        </div>

                        <div>
                          <InfoField label="ESTADO" value={result.data[" ESTADO "]} />
                          <InfoField label="TIPO DIFERENCIA" value={result.data[" TIPO DIFERENCIA "]} />
                          <InfoField label="SOBRANTE" value={result.data[" SOBRANTE "]} currency />
                          <InfoField label="FECHA INICIO CICLO" value={result.data["FECHA INICIO CICLO"]} />
                          <InfoField label="FECHA FIN CICLO" value={result.data["FECHA FIN CICLO"]} />
                          <InfoField label="RATIFICAR Y GRABAR DIFERENCIA" value={result.data["RATIFICAR Y GRABAR DIFERENCIA"]} highlight />
                          <InfoField label="JUSTIFICACIÓN" value={result.data["JUSTIFICACIÓN"]} highlight />
                          <InfoField label="NUEVO ESTADO" value={result.data["NUEVO ESTADO"]} highlight />
                          <InfoField label="RESPONSABLE" value={result.data["RESPONSABLE"]} />
                          <InfoField label="TDV" value={result.data["TDV"]} />
                        </div>
                      </div>

                      {/* EXPLICACIÓN AL FINAL - TAMBIÉN SE MUESTRA */}
                      <div className="mt-6 p-4 bg-ai-darker/50 rounded border border-ai-blue/20">
                        <h4 className="text-ai-blue mb-2 font-semibold">EXPLICACIÓN</h4>
                        <p className="text-sm whitespace-pre-wrap">
                          {typeof result.data.EXPLICACIÓN === 'object' && result.data.EXPLICACIÓN?.motivo 
                            ? result.data.EXPLICACIÓN.motivo 
                            : formatExplanation(result.data) || "El agente ha procesado este ATM sin proporcionar explicación detallada."}
                        </p>
                      </div>

                      <div className="mt-4 p-4 bg-ai-darker/50 rounded border border-ai-blue/20">
                        <h4 className="text-ai-blue mb-2 font-semibold">OBSERVACIÓN</h4>
                        <p className="text-sm">{result.data["OBSERVACIÓN"] || "Sin observaciones"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="original">
              <div className="animate-fade-in w-full">
                <div className="glass-effect rounded-lg p-6 border border-ai-blue/20">
                  <h3 className="text-xl font-semibold text-ai-blue mb-4 text-glow">Datos Originales</h3>

                  {isLoadingOriginal ? (
                    <div className="flex justify-center py-8">
                      <CircularAnimation isActive={true} />
                    </div>
                  ) : originalData?.data?.length > 0 ? (
                    <div className="bg-ai-dark p-6 rounded overflow-auto text-white/90 max-h-[500px]">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <InfoField label="CÓDIGO FONDO" value={originalData.data[0]["CÓDIGO FONDO"]} />
                          <InfoField label="CIUDAD" value={originalData.data[0]["CIUDAD"]} />
                          <InfoField label="CÓDIGO" value={originalData.data[0]["CÓDIGO"]} />
                          <InfoField label="NOMBRE CAJERO" value={originalData.data[0]["NOMBRE CAJERO"]} />
                          <InfoField label="FECHA" value={originalData.data[0]["FECHA"]} />
                          <InfoField label="CONTADORES" value={originalData.data[0][" CONTADORES "]} currency />
                          <InfoField label="CONTABILIDAD" value={originalData.data[0][" CONTABILIDAD "]} currency />
                          <InfoField label="REMANENTES" value={originalData.data[0][" REMANENTES "]} currency />
                          <InfoField label="PROVISIONES" value={originalData.data[0][" PROVISIONES "]} currency />
                          <InfoField label="DIFERENCIA" value={originalData.data[0][" DIFERENCIA "]} currency />
                        </div>

                        <div>
                          <InfoField label="ESTADO" value={originalData.data[0][" ESTADO "]} />
                          <InfoField label="TIPO DIFERENCIA" value={originalData.data[0][" TIPO DIFERENCIA "]} />
                          <InfoField label="SOBRANTE" value={originalData.data[0][" SOBRANTE "]} currency />
                          <InfoField label="FECHA INICIO CICLO" value={originalData.data[0]["FECHA INICIO CICLO"]} />
                          <InfoField label="FECHA FIN CICLO" value={originalData.data[0]["FECHA FIN CICLO"]} />
                          <InfoField label="RATIFICAR Y GRABAR DIFERENCIA" value={originalData.data[0]["RATIFICAR Y GRABAR DIFERENCIA"]} />
                          <InfoField label="JUSTIFICACIÓN" value={originalData.data[0]["JUSTIFICACIÓN"]} />
                          <InfoField label="NUEVO ESTADO" value={originalData.data[0]["NUEVO ESTADO"]} />
                          <InfoField label="RESPONSABLE" value={originalData.data[0]["RESPONSABLE"]} />
                          <InfoField label="TDV" value={originalData.data[0]["TDV"]} />
                        </div>
                      </div>

                      <div className="mt-4 p-4 bg-ai-darker/50 rounded border border-ai-blue/20">
                        <h4 className="text-ai-blue mb-2 font-semibold">OBSERVACIÓN</h4>
                        <p className="text-sm">{originalData.data[0]["OBSERVACIÓN"]}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      No hay datos originales disponibles
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}

        <div className="mt-8 flex gap-4">
          {!isProcessing && (
            <>
              <Button
                onClick={handleStartProcess}
                className="bg-ai-blue hover:bg-ai-darkBlue text-white"
              >
                <Zap className="mr-2 h-4 w-4" /> Evaluar Nuevamente
              </Button>

              <Button
                onClick={handleReset}
                variant="outline"
                className="border-ai-blue text-ai-blue hover:bg-ai-blue/10"
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Volver al Dashboard
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const InfoField = ({
  label,
  value,
  currency = false,
  highlight = false
}: {
  label: string;
  value: any;
  currency?: boolean;
  highlight?: boolean;
}) => {
  const formattedValue = currency
    ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value)
    : value;

  return (
    <div className={`mb-2 p-2 rounded ${highlight ? 'bg-ai-blue/10' : ''}`}>
      <span className="text-gray-400 text-xs block">{label}</span>
      <span className={`font-mono ${highlight ? 'text-ai-blue font-semibold' : 'text-white'}`}>
        {formattedValue || "-"}
      </span>
    </div>
  );
};

export default AgentEvaluator;
