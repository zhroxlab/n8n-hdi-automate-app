import React, { useState, useEffect } from 'react';
import { Button, Progress, Alert, Card, CardBody, CardHeader, CardTitle, CardFooter } from 'reactstrap';
import { FaPlay, FaStop, FaSync, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';

// Importar funciones de la API
import { runFullProcess } from '../../lib/api';
import useElectron from '../../hooks/useElectron';

// Definir los tipos para los estados de procesamiento
interface ProcessStatus {
  isRunning: boolean;
  progress: number;
  status: string;
  error: string | null;
  results: any | null;
}

const ProcessingComponent: React.FC = () => {
  // Estado para controlar el proceso
  const [processStatus, setProcessStatus] = useState<ProcessStatus>({
    isRunning: false,
    progress: 0,
    status: 'Esperando para iniciar el proceso',
    error: null,
    results: null,
  });

  // Obtener funciones y propiedades de Electron
  const { isElectron, invoke, on } = useElectron();

  useEffect(() => {
    // Si estamos en Electron, configurar listeners para actualizaciones de progreso
    if (isElectron) {
      on('process:progress', (progress: number) => {
        setProcessStatus(prev => ({
          ...prev,
          progress,
        }));
      });

      on('process:status', (status: string) => {
        setProcessStatus(prev => ({
          ...prev,
          status,
        }));
      });

      on('process:complete', (results: any) => {
        setProcessStatus(prev => ({
          ...prev,
          isRunning: false,
          progress: 100,
          status: 'Proceso completado con éxito',
          results,
        }));
        toast.success('Proceso completado con éxito');
      });

      on('process:error', (error: string) => {
        setProcessStatus(prev => ({
          ...prev,
          isRunning: false,
          error,
          status: 'Error durante el procesamiento',
        }));
        toast.error(`Error: ${error}`);
      });
    }

    // Cleanup de los listeners
    return () => {
      // En una implementación real, aquí deberíamos remover los listeners
    };
  }, [isElectron, on]);

  // Función para iniciar el proceso
  const startProcess = async () => {
    try {
      // Verificar si hay algún proceso en ejecución
      if (processStatus.isRunning) {
        toast.warning('Ya hay un proceso en ejecución');
        return;
      }

      // Actualizar el estado para indicar que el proceso ha iniciado
      setProcessStatus({
        isRunning: true,
        progress: 0,
        status: 'Iniciando proceso...',
        error: null,
        results: null,
      });

      // Si estamos en Electron, usar IPC para comunicarse con el backend
      if (isElectron) {
        invoke('process:start')
          .catch(error => {
            console.error('Error al iniciar el proceso:', error);
            setProcessStatus(prev => ({
              ...prev,
              isRunning: false,
              error: error.message || 'Error desconocido al iniciar el proceso',
              status: 'Error al iniciar el proceso',
            }));
            toast.error('Error al iniciar el proceso');
          });
      } else {
        // Versión web: usar la API
        const response = await runFullProcess();

        if (response.success) {
          setProcessStatus({
            isRunning: false,
            progress: 100,
            status: 'Proceso completado con éxito',
            error: null,
            results: response.data,
          });
          toast.success('Proceso completado con éxito');
        } else {
          setProcessStatus({
            isRunning: false,
            progress: 0,
            status: 'Error durante el procesamiento',
            error: response.error || 'Error desconocido',
            results: null,
          });
          toast.error(`Error: ${response.error}`);
        }
      }
    } catch (error) {
      console.error('Error en el proceso:', error);
      setProcessStatus({
        isRunning: false,
        progress: 0,
        status: 'Error durante el procesamiento',
        error: error instanceof Error ? error.message : 'Error desconocido',
        results: null,
      });
      toast.error('Error durante el procesamiento');
    }
  };

  // Función para detener el proceso
  const stopProcess = () => {
    if (!processStatus.isRunning) {
      toast.warning('No hay ningún proceso en ejecución');
      return;
    }

    // Si estamos en Electron, usar IPC para detener el proceso
    if (isElectron) {
      invoke('process:stop')
        .then(() => {
          setProcessStatus(prev => ({
            ...prev,
            isRunning: false,
            status: 'Proceso detenido por el usuario',
          }));
          toast.info('Proceso detenido por el usuario');
        })
        .catch(error => {
          console.error('Error al detener el proceso:', error);
          toast.error('Error al detener el proceso');
        });
    } else {
      // Versión web: actualizar el estado
      setProcessStatus(prev => ({
        ...prev,
        isRunning: false,
        status: 'Proceso detenido por el usuario',
      }));
      toast.info('Proceso detenido por el usuario');
    }
  };

  // Función para reiniciar el estado
  const resetProcess = () => {
    if (processStatus.isRunning) {
      toast.warning('No se puede reiniciar mientras hay un proceso en ejecución');
      return;
    }

    setProcessStatus({
      isRunning: false,
      progress: 0,
      status: 'Esperando para iniciar el proceso',
      error: null,
      results: null,
    });
    toast.info('Estado reiniciado');
  };

  // Renderizar el componente
  return (
    <Card className="mb-4 shadow">
      <CardHeader className="bg-primary text-white">
        <CardTitle tag="h5" className="mb-0">
          <FaPlay className="me-2" /> Procesamiento de Datos
        </CardTitle>
      </CardHeader>
      <CardBody>
        {/* Barra de progreso */}
        <div className="mb-3">
          <div className="d-flex justify-content-between mb-1">
            <span>Progreso: {processStatus.progress}%</span>
            <span>Estado: {processStatus.status}</span>
          </div>
          <Progress
            value={processStatus.progress}
            color={processStatus.error ? 'danger' : processStatus.progress === 100 ? 'success' : 'primary'}
            className="mb-3"
          />
        </div>

        {/* Mensaje de error */}
        {processStatus.error && (
          <Alert color="danger" className="mb-3">
            <FaTimesCircle className="me-2" />
            Error: {processStatus.error}
          </Alert>
        )}

        {/* Mensaje de éxito */}
        {processStatus.progress === 100 && !processStatus.error && (
          <Alert color="success" className="mb-3">
            <FaCheckCircle className="me-2" />
            Proceso completado correctamente
          </Alert>
        )}

        {/* Botones de acción */}
        <div className="d-flex justify-content-between">
          <Button
            color="success"
            onClick={startProcess}
            disabled={processStatus.isRunning}
            className="me-2"
          >
            <FaPlay className="me-1" /> Iniciar
          </Button>
          <Button
            color="danger"
            onClick={stopProcess}
            disabled={!processStatus.isRunning}
            className="me-2"
          >
            <FaStop className="me-1" /> Detener
          </Button>
          <Button
            color="secondary"
            onClick={resetProcess}
            disabled={processStatus.isRunning}
          >
            <FaSync className="me-1" /> Reiniciar
          </Button>
        </div>
      </CardBody>
      <CardFooter className="text-muted">
        <small>
          Los resultados se almacenarán en la base de datos configurada
        </small>
      </CardFooter>
    </Card>
  );
};

export default ProcessingComponent;
