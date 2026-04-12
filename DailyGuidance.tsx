import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Star, Quote } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const DailyGuidance: React.FC<{ angelName: string }> = ({ angelName }) => {
  const [guidance, setGuidance] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGuidance = async () => {
      const today = new Date().toLocaleDateString();
      const storageKey = `daily_guidance_${angelName}`;
      const cachedData = localStorage.getItem(storageKey);

      if (cachedData) {
        try {
          const { message, date } = JSON.parse(cachedData);
          if (date === today) {
            setGuidance(message);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error("Error parsing cached guidance", e);
        }
      }

      try {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Provide a short, poetic, and spiritual daily guidance message (max 30 words) from ${angelName} to a seeker. Focus on hope and inner strength.`,
        });
        const newMessage = response.text || "Your path is illuminated by the stars. Walk with courage.";
        setGuidance(newMessage);
        localStorage.setItem(storageKey, JSON.stringify({ message: newMessage, date: today }));
      } catch (error) {
        setGuidance("Your path is illuminated by the stars. Walk with courage.");
      } finally {
        setLoading(false);
      }
    };
    fetchGuidance();
  }, [angelName]);

  return (
    <div className="celestial-glow-panel p-8 mt-12 max-w-2xl mx-auto w-full text-center relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-50" />
      <div className="flex justify-center mb-4">
        <Star className="text-yellow-500 w-6 h-6 animate-pulse" />
      </div>
      <h2 className="elegant-heading text-2xl golden-text mb-6">Daily Guidance</h2>
      
      {loading ? (
        <div className="flex justify-center py-4">
          <div className="w-8 h-8 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative"
        >
          <Quote className="absolute -top-4 -left-2 text-white/10 w-12 h-12" />
          <p className="text-xl text-slate-300 italic font-serif leading-relaxed">
            {guidance}
          </p>
          <Quote className="absolute -bottom-4 -right-2 text-white/10 w-12 h-12 rotate-180" />
        </motion.div>
      )}
      
      <p className="mt-8 text-xs text-slate-500 uppercase tracking-widest">
        Received at {new Date().toLocaleDateString()}
      </p>
    </div>
  );
};
