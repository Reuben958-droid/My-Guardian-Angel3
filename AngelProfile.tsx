import React from 'react';
import { motion } from 'motion/react';
import { Angel } from '../types';
import { cn } from './utils';

interface AngelProfileProps {
  angel: Angel;
  userTraits: string[];
}

export const AngelProfile: React.FC<AngelProfileProps> = ({ angel, userTraits }) => {
  return (
    <div className="relative flex flex-col items-center pt-12 pb-8 px-4">
      {/* Profile Picture */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="relative z-10 mb-8"
      >
        {/* Outer Halo */}
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -inset-12 bg-yellow-500/20 rounded-full blur-3xl"
        />
        
        {/* Inner Glow */}
        <div className="relative w-56 h-56 md:w-72 md:h-72 rounded-full overflow-hidden border-4 border-yellow-500/50 shadow-[0_0_80px_rgba(234,179,8,0.6)]">
          <img
            src={angel.image}
            alt={angel.name}
            className="w-full h-full object-cover scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent" />
        </div>

        {/* Rotating Sacred Geometry */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute -inset-6 border-2 border-yellow-500/30 rounded-full border-dashed"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute -inset-10 border border-yellow-500/10 rounded-full"
        />
      </motion.div>

      {/* Energy Type */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="relative mb-4"
      >
        <motion.div
          animate={{ 
            opacity: [0.4, 0.8, 0.4],
            scale: [1, 1.05, 1]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full"
        />
        <div className="relative px-8 py-2 rounded-full bg-yellow-500/20 border-2 border-yellow-500/50 text-yellow-300 text-sm font-black tracking-[0.4em] uppercase shadow-[0_0_30px_rgba(234,179,8,0.4)]">
          <span className="drop-shadow-[0_0_15px_rgba(234,179,8,1)] drop-shadow-[0_0_30px_rgba(234,179,8,0.8)] drop-shadow-[0_0_45px_rgba(234,179,8,0.4)]">
            {angel.energyType}
          </span>
        </div>
      </motion.div>

      {/* Name and Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="text-center relative z-20 py-8 w-full"
      >
        <div className="absolute inset-0 bg-radial-gradient from-slate-950/60 via-slate-950/20 to-transparent blur-2xl -z-10" />
        <h1 className="elegant-heading text-5xl md:text-7xl golden-text mb-2 drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
          {angel.name}
        </h1>
        <p className="text-xl md:text-2xl text-white italic font-serif drop-shadow-[0_0_15px_rgba(234,179,8,0.8)] drop-shadow-[0_0_30px_rgba(234,179,8,0.4)]">
          {angel.title}
        </p>
      </motion.div>

      {/* Why this angel chose you */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="mt-12 max-w-4xl w-full celestial-glow-panel p-8 md:p-12"
      >
        <h2 className="elegant-heading text-3xl golden-text mb-8 text-center">
          Why {angel.name} Chose You
        </h2>
        <ul className="space-y-6">
          {userTraits.map((trait, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.5 + index * 0.2 }}
              className="flex items-start gap-4"
            >
              <span className="text-yellow-500 mt-1 text-xl">✦</span>
              <p className="text-slate-300 text-lg md:text-xl leading-relaxed">
                Your affinity for <span className="text-yellow-200 font-medium">{trait}</span> resonates with the divine frequency of this guardian.
              </p>
            </motion.li>
          ))}
          <motion.li
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2.2 }}
            className="flex items-start gap-4"
          >
            <span className="text-yellow-500 mt-1 text-xl">✦</span>
            <p className="text-slate-300 text-lg md:text-xl leading-relaxed">
              Your soul seeks the specific guidance and protection that only {angel.name} can provide at this stage of your journey.
            </p>
          </motion.li>
        </ul>
      </motion.div>

      {/* Biography */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
        className="mt-8 max-w-4xl w-full celestial-glow-panel p-8 md:p-12"
      >
        <h2 className="elegant-heading text-3xl golden-text mb-6">The Divine Essence</h2>
        <p className="text-slate-300 text-lg md:text-xl leading-relaxed first-letter:text-5xl first-letter:font-serif first-letter:mr-3 first-letter:float-left first-letter:text-yellow-500">
          {angel.bio}
        </p>
      </motion.div>
    </div>
  );
};
