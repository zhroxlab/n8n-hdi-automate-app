
import React from 'react';

interface StatusRingsProps {
  configStatus: {
    tirasConfigured: boolean;
    historicoConfigured: boolean;
    cpConfigured: boolean;
    gestionConfigured: boolean;
    dbConfigured: boolean;
  };
  executionStatus: {
    tirasLoaded: boolean;
    historicoLoaded: boolean;
    cpLoaded: boolean;
    gestionLoaded: boolean;
  };
  filteredDataAvailable: boolean;
}

const StatusRings = ({ configStatus, executionStatus, filteredDataAvailable }: StatusRingsProps) => {
  const ringSize = 300; // Size of the main ring
  const centerX = ringSize / 2;
  const centerY = ringSize / 2;
  
  // Calculate metrics based on statuses
  const configuredCount = Object.values(configStatus).filter(Boolean).length;
  const configPercentage = (configuredCount / Object.values(configStatus).length) * 100;
  
  const loadedCount = Object.values(executionStatus).filter(Boolean).length;
  const loadedPercentage = (loadedCount / Object.values(executionStatus).length) * 100;
  
  // The dashboard value to display in the center (example)
  const dashValue = Math.round((configPercentage + loadedPercentage) / 2);
  
  return (
    <div className="border border-blue-800/30 bg-blue-900/20 rounded-lg p-4 backdrop-blur-sm flex items-center justify-center">
      <div className="relative" style={{ width: ringSize, height: ringSize }}>
        {/* Background ring */}
        <svg width={ringSize} height={ringSize} className="absolute top-0 left-0">
          <circle
            cx={centerX}
            cy={centerY}
            r={ringSize * 0.45}
            fill="none"
            strokeWidth="2"
            stroke="rgba(59, 130, 246, 0.2)"
          />
          
          {/* Dotted ring */}
          <circle
            cx={centerX}
            cy={centerY}
            r={ringSize * 0.35}
            fill="none"
            strokeWidth="2"
            stroke="rgba(59, 130, 246, 0.2)"
            strokeDasharray="4 4"
          />
          
          {/* Main progress ring */}
          <circle
            cx={centerX}
            cy={centerY}
            r={ringSize * 0.45}
            fill="none"
            strokeWidth="6"
            stroke="rgba(59, 130, 246, 0.8)"
            strokeDasharray={`${2 * Math.PI * ringSize * 0.45 * (dashValue / 100)} ${2 * Math.PI * ringSize * 0.45 * (1 - dashValue / 100)}`}
            strokeDashoffset={(2 * Math.PI * ringSize * 0.45) * 0.25}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        
        {/* Central text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="text-5xl font-bold text-blue-100">{dashValue}</div>
          <div className="text-blue-400 text-lg opacity-70">% completado</div>
        </div>
        
        {/* Status indicators around the circle */}
        <div className="absolute" style={{ top: '5%', left: '50%', transform: 'translateX(-50%)' }}>
          <StatusIndicator 
            label="Configurado"
            value={`${configPercentage.toFixed(0)}%`}
            active={configPercentage > 0}
            complete={configPercentage === 100}
          />
        </div>
        <div className="absolute" style={{ top: '50%', right: '5%', transform: 'translateY(-50%)' }}>
          <StatusIndicator 
            label="Datos Cargados"
            value={`${loadedPercentage.toFixed(0)}%`}
            active={loadedPercentage > 0}
            complete={loadedPercentage === 100}
          />
        </div>
        <div className="absolute" style={{ bottom: '5%', left: '50%', transform: 'translateX(-50%)' }}>
          <StatusIndicator 
            label="Filtrado"
            value={filteredDataAvailable ? "Listo" : "Pendiente"}
            active={filteredDataAvailable}
            complete={filteredDataAvailable}
          />
        </div>
        <div className="absolute" style={{ top: '50%', left: '5%', transform: 'translateY(-50%)' }}>
          <StatusIndicator 
            label="Sistema"
            value="Online"
            active={true}
            complete={true}
          />
        </div>
      </div>
    </div>
  );
};

interface StatusIndicatorProps {
  label: string;
  value: string;
  active: boolean;
  complete: boolean;
}

const StatusIndicator = ({ label, value, active, complete }: StatusIndicatorProps) => {
  return (
    <div className="flex items-center gap-2">
      <div 
        className={`h-3 w-3 rounded-full transition-colors duration-300 ${
          complete ? 'bg-green-500' : active ? 'bg-yellow-500' : 'bg-red-500'
        }`}
      />
      <div className="text-xs">
        <div className="text-blue-300">{label}</div>
        <div className={`font-mono ${
          complete ? 'text-green-400' : active ? 'text-yellow-400' : 'text-red-400'
        }`}>{value}</div>
      </div>
    </div>
  );
};

export default StatusRings;
