
import React, { useEffect, useRef, useState } from 'react';

interface CircularAnimationProps {
  isActive: boolean;
}

const CircularAnimation: React.FC<CircularAnimationProps> = ({ isActive }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Handle timer logic
  useEffect(() => {
    let timerInterval: number | null = null;
    
    if (isActive) {
      // Reset timer when starting
      setElapsedTime(0);
      
      // Start timer
      timerInterval = window.setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else if (elapsedTime === 0) {
      // Only reset timer if we're stopping and haven't tracked any time
      setElapsedTime(0);
    }
    
    // Clean up interval on unmount or when isActive changes
    return () => {
      if (timerInterval !== null) {
        clearInterval(timerInterval);
      }
    };
  }, [isActive]);
  
  // Animation particles effect
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const centerX = container.offsetWidth / 2;
    const centerY = container.offsetHeight / 2;
    const radius = Math.min(centerX, centerY) * 0.8;
    
    // Remove any existing particles
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    
    // Only create particles if animation is active
    if (isActive) {
      // Create outer circle particles
      for (let i = 0; i < 100; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = radius * (0.8 + Math.random() * 0.2);
        
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;
        
        const particle = document.createElement('div');
        particle.className = 'globe-particle';
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.opacity = (0.3 + Math.random() * 0.7).toString();
        particle.style.width = `${1 + Math.random() * 2}px`;
        particle.style.height = particle.style.width;
        
        // Add random animation delay
        particle.style.animation = `particle-flow ${2 + Math.random() * 3}s ease-in-out infinite`;
        particle.style.animationDelay = `${Math.random() * 2}s`;
        
        container.appendChild(particle);
      }
      
      // Create some random particles for the interior
      for (let i = 0; i < 50; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = radius * Math.random() * 0.7;
        
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;
        
        const particle = document.createElement('div');
        particle.className = 'globe-particle';
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.opacity = (0.1 + Math.random() * 0.5).toString();
        particle.style.width = `${1 + Math.random() * 1.5}px`;
        particle.style.height = particle.style.width;
        
        container.appendChild(particle);
      }
    }
  }, [isActive]);
  
  return (
    <div className="relative w-64 h-64 mx-auto">
      <div 
        ref={containerRef} 
        className={`absolute inset-0 rounded-full ${isActive ? 'animate-rotate-globe' : ''}`}
      ></div>
      <div className={`absolute inset-0 rounded-full border border-ai-blue opacity-20 ${isActive ? 'animate-pulse-glow' : ''}`}></div>
      <div className={`absolute inset-4 rounded-full border border-ai-blue opacity-10 ${isActive ? 'animate-pulse-glow' : ''}`}></div>
      
      {/* Timer counter with glass effect */}
      {(isActive || elapsedTime > 0) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="glass-effect px-5 py-2 rounded-xl shadow-lg backdrop-blur-md border border-ai-blue/30">
            <span className="text-ai-blue font-mono text-4xl font-bold text-glow animate-pulse-slow">
              {elapsedTime}s
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CircularAnimation;
