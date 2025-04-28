
import React, { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, ChevronLeft, Bell, User } from "lucide-react";

interface DashboardHeaderProps {
  navigate: (path: string) => void;
}

const DashboardHeader = ({ navigate }: DashboardHeaderProps) => {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  // Update time every second
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-blue-950/80 border-b border-blue-800/30">
      <div className="container mx-auto flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden bg-blue-900/50 border-blue-700/50 hover:bg-blue-800/50">
                <Menu className="h-5 w-5 text-blue-300" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[240px] sm:w-[300px] bg-blue-950 border-blue-800/50">
              <nav className="flex flex-col gap-4 mt-8">
                <Button variant="ghost" onClick={() => navigate('/')} className="text-blue-300 hover:text-blue-100 hover:bg-blue-900/50">Inicio</Button>
                <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-blue-300 hover:text-blue-100 hover:bg-blue-900/50">Dashboard</Button>
              </nav>
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-xs font-bold text-blue-100">HDI</span>
            </div>
            <h1 className="font-bold text-xl md:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">HDI Automation</h1>
          </div>

          <div className="hidden md:flex">
            <Button variant="ghost" onClick={() => navigate('/')} className="text-blue-300 hover:text-blue-100 hover:bg-blue-900/50">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Inicio
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:block text-xs bg-blue-900/40 border border-blue-800/30 px-3 py-1.5 rounded-md font-mono text-blue-300">
            {currentTime} <span className="text-green-400 ml-1">[LIVE]</span>
          </div>

          <Button variant="outline" size="icon" className="bg-blue-900/50 border-blue-700/50 hover:bg-blue-800/50">
            <Bell className="h-4 w-4 text-blue-300" />
          </Button>

          <Button variant="outline" size="icon" className="bg-blue-900/50 border-blue-700/50 hover:bg-blue-800/50">
            <User className="h-4 w-4 text-blue-300" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
