
import React from 'react';

interface ResultDisplayProps {
  result: string | null;
  completed: boolean;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, completed }) => {
  if (!result) return null;
  
  console.log("ResultDisplay - Raw result received:", result);
  
  // Procesamiento del resultado
  let parsedResult = null;
  let explanation = '';
  
  try {
    // Si es un string, intentamos parsearlo
    parsedResult = typeof result === 'string' ? JSON.parse(result) : result;
    console.log("ResultDisplay - Parsed result:", parsedResult);
    
    // Manejar diferentes estructuras de datos posibles
    if (parsedResult) {
      // Si tenemos data.data, usamos ese objeto
      if (parsedResult.data && parsedResult.data.data) {
        parsedResult = parsedResult.data.data;
        console.log("ResultDisplay - Using data.data structure:", parsedResult);
      } 
      // Si tenemos solo data, usamos ese objeto
      else if (parsedResult.data) {
        parsedResult = parsedResult.data;
        console.log("ResultDisplay - Using data structure:", parsedResult);
      }
      // Si es un array, tomamos el primer elemento
      else if (Array.isArray(parsedResult) && parsedResult.length > 0) {
        parsedResult = parsedResult[0];
        console.log("ResultDisplay - Using first item from array:", parsedResult);
      }
      
      // Extraemos la explicación del objeto procesado
      if (parsedResult.EXPLICACIÓN) {
        const explField = parsedResult.EXPLICACIÓN;
        console.log("ResultDisplay - Found EXPLICACIÓN field:", explField);
        
        if (typeof explField === 'object' && explField !== null) {
          explanation = explField.motivo || '';
          console.log("ResultDisplay - Extracted motivo from object:", explanation);
        } else if (typeof explField === 'string') {
          explanation = explField;
          console.log("ResultDisplay - Using EXPLICACIÓN as string:", explanation);
          
          // Intentar parsear si es un string con formato JSON
          if (explanation.startsWith('{')) {
            try {
              const parsedExp = JSON.parse(explanation);
              explanation = parsedExp.motivo || explanation;
              console.log("ResultDisplay - Parsed explanation from string:", explanation);
            } catch (e) {
              console.log("ResultDisplay - Could not parse explanation string as JSON");
            }
          }
        }
      }
    }
  } catch (e) {
    console.error("ResultDisplay - Error processing result:", e);
    // Si hay un error al parsear, mostramos el resultado como está
    explanation = typeof result === 'string' ? result : JSON.stringify(result);
  }
  
  // Asegurarnos de tener una versión en string para mostrar del resultado completo
  const resultString = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
  
  return (
    <div className="animate-fade-in mt-8 w-full max-w-3xl">
      <div className="glass-effect rounded-lg p-6 border border-ai-blue/20">
        <h3 className="text-xl font-semibold text-ai-blue mb-2 text-glow">Resultado</h3>
        
        {/* Sección de explicación - siempre visible */}
        <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-medium text-purple-300 mb-1">Explicación del Agente</h4>
          <p className="text-sm text-purple-200 whitespace-pre-wrap">
            {explanation || "El agente ha procesado este ATM sin proporcionar una explicación detallada."}
          </p>
        </div>
        
        {/* Resultado completo formateado como JSON */}
        <div className="mt-4">
          <h4 className="text-sm font-medium text-ai-blue mb-1">Respuesta Completa</h4>
          <pre className="bg-ai-dark p-4 rounded overflow-auto text-white/90 text-sm font-mono max-h-96 whitespace-pre-wrap">
            {resultString}
          </pre>
        </div>
        
        <div className="mt-4">
          <div className="progress-indicator"></div>
          <div className="flex justify-between mt-2">
            <span className="text-xs uppercase text-ai-blue font-mono">
              {completed ? 'COMPLETADO' : 'PROCESANDO'}
            </span>
            <span className="text-xs text-ai-blue font-mono">
              {completed ? '100 %' : '...'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultDisplay;
