
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-ai-darker px-4">
      <div className="text-center glass-effect p-12 rounded-lg border border-ai-blue/20 animate-fade-in">
        <h1 className="text-6xl font-bold mb-4 text-ai-blue text-glow">404</h1>
        <p className="text-xl text-white/90 mb-8">Página no encontrada</p>
        <a href="/" className="text-ai-blue hover:text-ai-glow transition-colors px-6 py-3 rounded-md border border-ai-blue/30 hover:border-ai-blue/50 hover:shadow-[0_0_15px_rgba(14,165,233,0.3)]">
          Volver al inicio
        </a>
      </div>
    </div>
  );
};

export default NotFound;
