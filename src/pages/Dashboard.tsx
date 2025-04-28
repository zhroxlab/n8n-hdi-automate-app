import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ConfigurationPanel from '@/components/dashboard/ConfigurationPanel';
import ExecutionPanel from '@/components/dashboard/ExecutionPanel';
import DataPreviewPanel from '@/components/dashboard/DataPreviewPanel';
import CategoryFilterPanel from '@/components/dashboard/CategoryFilterPanel';
import AgentExecutionPanel from '@/components/dashboard/AgentExecutionPanel';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Settings, Zap, Database, Filter, Brain } from "lucide-react";
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatusRings from '@/components/dashboard/StatusRings';
import { Progress } from "@/components/ui/progress";
import { endpoints } from '@/config/endpoints';

const Dashboard = () => {
  const [configStatus, setConfigStatus] = useState({
    tirasConfigured: false,
    historicoConfigured: false,
    cpConfigured: false,
    gestionConfigured: false,
    dbConfigured: false
  });
  
  const [executionStatus, setExecutionStatus] = useState({
    tirasLoaded: false,
    historicoLoaded: false,
    cpLoaded: false,
    gestionLoaded: false
  });

  const [activeTab, setActiveTab] = useState("configuration");
  const [filteredDataAvailable, setFilteredDataAvailable] = useState(false);
  const [systemProgress, setSystemProgress] = useState(0);
  const [gestionData, setGestionData] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const navigate = useNavigate();

  const allConfigured = Object.values(configStatus).every(status => status);
  const allLoaded = Object.values(executionStatus).every(status => status);

  useEffect(() => {
    let progress = 0;
    
    if (allConfigured) progress += 25;
    
    const loadedCount = Object.values(executionStatus).filter(Boolean).length;
    progress += (loadedCount / 4) * 25;
    
    if (filteredDataAvailable) progress += 25;
    
    setSystemProgress(progress);
  }, [configStatus, executionStatus, filteredDataAvailable, allConfigured]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleDataLoaded = (data: any[]) => {
    setGestionData(data);
    console.log("Datos cargados en Dashboard:", data);
    if (data.length > 0) {
      setExecutionStatus(prev => ({...prev, gestionLoaded: true}));
    }
  };

  const handleItemSelect = (item: any) => {
    console.log("Item seleccionado en Dashboard:", item);
    setSelectedItem(item);
    setActiveTab("agent");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-950 to-slate-900 text-blue-50">
      <div className="fixed inset-0 bg-[url('/lovable-uploads/3f22f33b-89b1-4131-87e0-178f69f35eed.png')] opacity-10 bg-cover bg-center pointer-events-none"></div>
      
      <DashboardHeader navigate={navigate} />

      <div className="container mx-auto px-4 pt-6 pb-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="col-span-2">
            <StatusRings 
              configStatus={configStatus} 
              executionStatus={executionStatus} 
              filteredDataAvailable={filteredDataAvailable} 
            />
          </div>
          <div className="border border-blue-800/30 bg-blue-900/20 rounded-lg p-4 backdrop-blur-sm">
            <h3 className="text-lg font-medium text-blue-200 mb-2">Estado del Sistema</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-blue-300">Progreso General</span>
                  <span className="text-xs text-blue-300">{systemProgress.toFixed(0)}%</span>
                </div>
                <Progress value={systemProgress} className="h-2 bg-blue-900" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-md bg-blue-900/40 border border-blue-800/30">
                  <p className="text-xs text-blue-400">Configuración</p>
                  <p className="text-lg font-mono">
                    {allConfigured ? (
                      <span className="text-green-400">Completo</span>
                    ) : (
                      <span className="text-yellow-400">Pendiente</span>
                    )}
                  </p>
                </div>
                <div className="p-3 rounded-md bg-blue-900/40 border border-blue-800/30">
                  <p className="text-xs text-blue-400">Ejecución</p>
                  <p className="text-lg font-mono">
                    {allLoaded ? (
                      <span className="text-green-400">Completo</span>
                    ) : (
                      <span className="text-yellow-400">En progreso</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <Tabs 
          value={activeTab} 
          onValueChange={handleTabChange} 
          className="w-full"
        >
          <div className="relative">
            <div className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-600/50 to-transparent -top-4"></div>
            <TabsList className="w-full md:w-auto grid grid-cols-5 mb-8 bg-blue-950/50 backdrop-blur-sm border border-blue-800/30 p-1">
              <TabsTrigger 
                value="configuration" 
                className="flex gap-2 items-center data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden md:inline">Configuración</span>
              </TabsTrigger>
              <TabsTrigger 
                value="execution" 
                className="flex gap-2 items-center data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <Zap className="h-4 w-4" />
                <span className="hidden md:inline">Ejecución</span>
              </TabsTrigger>
              <TabsTrigger 
                value="preview" 
                className="flex gap-2 items-center data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <Database className="h-4 w-4" />
                <span className="hidden md:inline">Previsualización</span>
              </TabsTrigger>
              <TabsTrigger 
                value="filter" 
                className="flex gap-2 items-center data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <Filter className="h-4 w-4" />
                <span className="hidden md:inline">Categorización</span>
              </TabsTrigger>
              <TabsTrigger 
                value="agent" 
                className="flex gap-2 items-center data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <Brain className="h-4 w-4" />
                <span className="hidden md:inline">Agente</span>
              </TabsTrigger>
            </TabsList>
            <div className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-600/50 to-transparent -bottom-4"></div>
          </div>
          
          <TabsContent value="configuration" className="space-y-4">
            <ConfigurationPanel 
              configStatus={configStatus} 
              setConfigStatus={setConfigStatus}
            />
          </TabsContent>
          
          <TabsContent value="execution" className="space-y-4">
            <ExecutionPanel 
              executionStatus={executionStatus} 
              setExecutionStatus={setExecutionStatus}
              endpoints={endpoints}
            />
          </TabsContent>
          
          <TabsContent value="preview" className="space-y-4">
            <DataPreviewPanel 
              endpoints={endpoints} 
              onDataLoaded={handleDataLoaded}
            />
          </TabsContent>
          
          <TabsContent value="filter" className="space-y-4">
            <CategoryFilterPanel 
              setFilteredDataAvailable={setFilteredDataAvailable} 
              endpoints={endpoints}
              initialData={gestionData}
              onItemSelect={handleItemSelect}
            />
          </TabsContent>
          
          <TabsContent value="agent" className="space-y-4">
            <AgentExecutionPanel 
              endpoints={endpoints}
              selectedItem={selectedItem}
            />
          </TabsContent>
        </Tabs>
      </div>
      
      <footer className="fixed bottom-0 left-0 right-0 p-4 text-center text-blue-400 text-sm border-t border-blue-800/30 bg-blue-950/80 backdrop-blur-md">
        <p>En desarrollo por HDI Colombia</p>
      </footer>
    </div>
  );
};

export default Dashboard;
