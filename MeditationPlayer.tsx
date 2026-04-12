import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Play, Pause, Wind } from 'lucide-react';
import { cn } from '../lib/utils';

export const MeditationPlayer: React.FC<{ angelName: string }> = ({ angelName }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    return () => {
      if (bgAudioRef.current) {
        bgAudioRef.current.pause();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const toggleMeditation = () => {
    if (isPlaying) {
      if (bgAudioRef.current) {
        bgAudioRef.current.pause();
        bgAudioRef.current.currentTime = 0;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setIsPlaying(false);
    } else {
      if (bgAudioRef.current) {
        bgAudioRef.current.play();
        // Stop background audio after 10 minutes
        timeoutRef.current = setTimeout(() => {
          if (bgAudioRef.current) {
            bgAudioRef.current.pause();
            bgAudioRef.current.currentTime = 0;
          }
          setIsPlaying(false);
        }, 10 * 60 * 1000);
      }
      setIsPlaying(true);
    }
  };

  return (
    <div className="w-full text-center">
      <audio 
        ref={bgAudioRef} 
        src="https://res.cloudinary.com/dxrnp3289/video/upload/v1775483583/0406_1_jfppui.mp3" 
        loop 
      />
      <div className="flex justify-center mb-4">
        <div className="p-3 rounded-full bg-yellow-500/10 border border-yellow-500/30">
          <Wind className="text-yellow-500 w-6 h-6" />
        </div>
      </div>
      <h2 className="elegant-heading text-xl golden-text mb-1">10 Minute Divine Meditation</h2>
      <p className="text-slate-400 mb-6 text-sm italic">Celestial Soundscape</p>
      
      <button
        onClick={toggleMeditation}
        className={cn(
          "relative group flex items-center gap-3 mx-auto px-6 py-3 rounded-full transition-all duration-300 text-sm",
          "bg-yellow-600 hover:bg-yellow-500 hover:scale-105"
        )}
      >
        {isPlaying ? (
          <Pause size={16} fill="white" />
        ) : (
          <Play size={16} fill="white" />
        )}
        <span className="font-medium text-white">
          {isPlaying ? "Pause" : "Begin 10 Minute Meditation"}
        </span>
      </button>
    </div>
  );
};
