import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface CelestialBackgroundProps {
  imageUrl?: string;
}

export const CelestialBackground: React.FC<CelestialBackgroundProps> = ({ imageUrl }) => {
  const [stars, setStars] = useState<{ id: number; x: number; y: number; size: number; duration: string }[]>([]);

  useEffect(() => {
    const newStars = Array.from({ length: 100 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      duration: `${Math.random() * 3 + 2}s`
    }));
    setStars(newStars);
  }, []);

  return (
    <div 
      className="celestial-bg transition-all duration-1000"
      style={imageUrl ? {
        backgroundImage: `linear-gradient(rgba(2, 6, 23, 0.7), rgba(2, 6, 23, 0.7)), url(${imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      } : {}}
    >
      {stars.map((star) => (
        <div
          key={star.id}
          className="star"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            '--duration': star.duration
          } as any}
        />
      ))}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20" />
    </div>
  );
};
