'use client';

import React, { useEffect, useState } from 'react';

interface FireworksAnimationProps {
  isActive: boolean;
  duration?: number;
  onComplete?: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

const FireworksAnimation: React.FC<FireworksAnimationProps> = ({ 
  isActive, 
  duration = 3000,
  onComplete 
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [animationId, setAnimationId] = useState<number | null>(null);
  const [particleIdCounter, setParticleIdCounter] = useState(0);

  const colors = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
    '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43'
  ];

  const createParticle = (x: number, y: number, id: number): Particle => ({
    id,
    x,
    y,
    vx: (Math.random() - 0.5) * 8,
    vy: (Math.random() - 0.5) * 8 - 2,
    life: 1,
    maxLife: 1,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * 4 + 2
  });

  const createFirework = (x: number, y: number) => {
    const newParticles: Particle[] = [];
    const particleCount = 15 + Math.random() * 10;
    
    setParticleIdCounter(prevCounter => {
      for (let i = 0; i < particleCount; i++) {
        newParticles.push(createParticle(x, y, prevCounter + i));
      }
      return prevCounter + particleCount;
    });
    
    setParticles(prev => [...prev, ...newParticles]);
  };

  const animate = () => {
    setParticles(prevParticles => {
      const updatedParticles = prevParticles
        .map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          vy: particle.vy + 0.1, // gravity
          life: particle.life - 0.02,
          vx: particle.vx * 0.99, // air resistance
          vy: particle.vy * 0.99
        }))
        .filter(particle => particle.life > 0);
      
      return updatedParticles;
    });
  };

  useEffect(() => {
    if (isActive) {
      // Reset particle counter when starting new animation
      setParticleIdCounter(0);
      
      // Create initial fireworks
      const fireworks = [
        { x: 20, y: 30 },
        { x: 50, y: 25 },
        { x: 80, y: 35 },
        { x: 30, y: 60 },
        { x: 70, y: 55 }
      ];

      fireworks.forEach((firework, index) => {
        setTimeout(() => {
          createFirework(firework.x, firework.y);
        }, index * 200);
      });

      // Start animation loop
      const id = requestAnimationFrame(function animateLoop() {
        animate();
        if (Date.now() - startTime < duration) {
          setAnimationId(requestAnimationFrame(animateLoop));
        } else {
          onComplete?.();
        }
      });
      
      setAnimationId(id);
      const startTime = Date.now();

      // Auto cleanup after duration
      const timeout = setTimeout(() => {
        setParticles([]);
        onComplete?.();
      }, duration);

      return () => {
        clearTimeout(timeout);
        if (id) {
          cancelAnimationFrame(id);
        }
      };
    } else {
      setParticles([]);
      if (animationId) {
        cancelAnimationFrame(animationId);
        setAnimationId(null);
      }
    }
  }, [isActive, duration, onComplete]);

  if (!isActive || particles.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <svg 
        className="w-full h-full" 
        viewBox="0 0 100 100" 
        preserveAspectRatio="xMidYMid meet"
      >
        {particles.map(particle => (
          <circle
            key={particle.id}
            cx={particle.x}
            cy={particle.y}
            r={particle.size * particle.life}
            fill={particle.color}
            opacity={particle.life}
            className="transition-all duration-100"
          />
        ))}
      </svg>
      
      {/* Additional sparkle effects */}
      <div className="absolute inset-0">
        {particles.slice(0, 5).map(particle => (
          <div
            key={`sparkle-${particle.id}`}
            className="absolute w-1 h-1 bg-yellow-300 rounded-full animate-ping"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${Math.random() * 0.5}s`,
              animationDuration: `${0.5 + Math.random() * 0.5}s`
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default FireworksAnimation;
