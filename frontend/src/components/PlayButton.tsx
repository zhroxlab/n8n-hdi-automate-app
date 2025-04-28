
import { Play, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface PlayButtonProps {
  onClick: () => void;
  isLoading: boolean;
}

const PlayButton: React.FC<PlayButtonProps> = ({ onClick, isLoading }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <button
      className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 
        ${isHovered ? 'bg-ai-blue' : 'bg-ai-darkBlue'} 
        shadow-[0_0_15px_rgba(14,165,233,0.5)] hover:shadow-[0_0_25px_rgba(14,165,233,0.7)]`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      ) : (
        <Play className="w-8 h-8 text-white ml-1" fill="white" />
      )}
      <div className={`absolute inset-0 rounded-full border border-ai-blue opacity-30 transition-transform duration-500 ${isHovered ? 'scale-110' : 'scale-100'}`}></div>
    </button>
  );
};

export default PlayButton;
