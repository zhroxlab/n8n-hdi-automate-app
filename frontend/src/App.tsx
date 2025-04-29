import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AgentEvaluator from "./pages/AgentEvaluator";
import Dashboard from "./pages/Dashboard";
import useElectron from "./hooks/useElectron";
import { useEffect } from "react";

const queryClient = new QueryClient();

const App = () => {
  // Verificamos si estamos en Electron
  const { isElectron } = useElectron();

  useEffect(() => {
    // Aplicar clase al body para Electron
    if (isElectron) {
      document.body.classList.add('electron-body');
    }

    // Establecer el título de la ventana
    document.title = 'HDI Automation';
  }, [isElectron]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className={isElectron ? 'electron-container' : ''}>
          {/* Contenido de la aplicación */}
          <div className="main-content">
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/agente/task_evaluate_differences" element={<AgentEvaluator />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </div>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
