
import { useState } from 'react';
import CircularAnimation from '../components/CircularAnimation';
import PlayButton from '../components/PlayButton';
import ResultDisplay from '../components/ResultDisplay';
import { toast } from "sonner";
import { Brain, Globe, Zap, BarChart, Database, ChevronRight, Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

const Index = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const navigate = useNavigate();

  const handleExecute = async () => {
    // Navigate to the agent evaluator page
    navigate('/agente/task_evaluate_differences');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 bg-gradient-to-b from-blue-950 to-slate-900">
      <div className="fixed inset-0 bg-[url('/lovable-uploads/3f22f33b-89b1-4131-87e0-178f69f35eed.png')] opacity-10 bg-cover bg-center pointer-events-none"></div>

      <div className="max-w-4xl w-full text-center mb-8 animate-fade-in relative z-10">
        <Badge className="mb-4 bg-blue-800/50 text-blue-300 py-1 px-3 rounded-full text-xs font-normal">
          v0.0.1 Beta
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400">
          HDI Automation
        </h1>
        <p className="text-blue-300 max-w-xl mx-auto">
          Evaluador inteligente de diferencias en cajeros automáticos. Análisis avanzado con un solo clic.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center w-full max-w-3xl animate-fade-in relative z-10">
        <div className="mb-4 animate-float relative">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-xl"></div>
          <CircularAnimation isActive={isProcessing} />
        </div>

        <div className="mt-12 flex flex-col md:flex-row gap-4">
          <Button
            onClick={handleExecute}
            className="text-base px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white flex items-center gap-2 group"
          >
            <Brain className="h-5 w-5" />
            Ejecutar Agente IA
            <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="text-base px-8 py-6 border-blue-700/50 bg-blue-900/20 hover:bg-blue-800/30 text-blue-300 hover:text-blue-100 flex items-center gap-2"
          >
            <BarChart className="h-5 w-5" />
            Dashboard
          </Button>
        </div>

        <ResultDisplay result={result} completed={completed} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl w-full relative z-10">
        <Card className="bg-blue-900/10 border-blue-800/30 p-6">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center mb-4">
            <Database className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-medium text-blue-200 mb-2">Carga de Datos</h3>
          <p className="text-sm text-blue-400">Importa datos desde múltiples fuentes y formatos con procesamiento automático.</p>
        </Card>

        <Card className="bg-blue-900/10 border-blue-800/30 p-6">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-600 to-cyan-400 flex items-center justify-center mb-4">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-medium text-blue-200 mb-2">Análisis IA</h3>
          <p className="text-sm text-blue-400">Análisis avanzado con inteligencia artificial para detectar patrones y anomalías.</p>
        </Card>

        <Card className="bg-blue-900/10 border-blue-800/30 p-6">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center mb-4">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-medium text-blue-200 mb-2">Procesamiento</h3>
          <p className="text-sm text-blue-400">Ejecuta reglas de negocio complejas y automatiza decisiones basadas en datos.</p>
        </Card>
      </div>

      <footer className="mt-auto pt-12 text-center text-blue-500/80 text-sm animate-fade-in relative z-10">
        <p>En desarrollo por HDI Colombia</p>
      </footer>
    </div>
  );
};

export default Index;
