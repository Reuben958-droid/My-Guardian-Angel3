import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  ChevronRight, 
  ArrowLeft, 
  Heart, 
  Wind, 
  Calendar, 
  Phone, 
  Share2, 
  RefreshCw,
  Lightbulb,
  Shield,
  Star,
  Check,
  Copy
} from 'lucide-react';
import { cn } from '../lib/utils';
import { ANGEL_NUMBERS, DEFAULT_MEANINGS, AngelNumberData } from '../constants/angelNumbers';

interface AngelNumberCalculatorProps {
  onClose: () => void;
}

export const AngelNumberCalculator: React.FC<AngelNumberCalculatorProps> = ({ onClose }) => {
  const [inputValue, setInputValue] = useState('');
  const [result, setResult] = useState<AngelNumberData | null>(null);
  const [displayedNumber, setDisplayedNumber] = useState('');
  const [isRevealing, setIsRevealing] = useState(false);
  const [showShareFeedback, setShowShareFeedback] = useState(false);

  const reduceNumber = (numStr: string): number => {
    let sum = numStr.split('').reduce((acc, char) => {
      const digit = parseInt(char, 10);
      return isNaN(digit) ? acc : acc + digit;
    }, 0);
    
    while (sum > 9) {
      sum = sum.toString().split('').reduce((acc, char) => acc + parseInt(char, 10), 0);
    }
    
    return sum;
  };

  const handleReveal = () => {
    if (!inputValue.trim()) return;
    
    setIsRevealing(true);
    
    // Simulate a magical delay
    setTimeout(() => {
      const cleanValue = inputValue.replace(/\D/g, '');
      let data = ANGEL_NUMBERS[cleanValue];
      
      if (!data) {
        const reduced = reduceNumber(cleanValue);
        data = DEFAULT_MEANINGS[reduced] || DEFAULT_MEANINGS[1];
      }
      
      setResult(data);
      setDisplayedNumber(cleanValue);
      setIsRevealing(false);
    }, 1500);
  };

  const handleQuickFill = (type: 'birth' | 'today' | 'phone') => {
    let value = '';
    if (type === 'birth') {
      // Placeholder for birth date logic - in a real app this might come from user profile
      value = '19900101';
    } else if (type === 'today') {
      const today = new Date();
      value = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    } else if (type === 'phone') {
      value = '5550123';
    }
    setInputValue(value);
  };

  const handleReset = () => {
    setResult(null);
    setInputValue('');
    setDisplayedNumber('');
    setShowShareFeedback(false);
  };

  const handleShare = async () => {
    if (!result) return;

    const shareData = {
      title: `Angel Number ${displayedNumber}: ${result.title}`,
      text: `I discovered the meaning of Angel Number ${displayedNumber}: "${result.title}". Discover yours at Celestial Sanctuary.`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback to clipboard
        const shareText = `✨ Angel Number ${displayedNumber}: ${result.title} ✨\n\n${result.message}\n\n🙏 Daily Affirmation: ${result.affirmation}\n\nDiscover your message at Celestial Sanctuary.`;
        await navigator.clipboard.writeText(shareText);
        setShowShareFeedback(true);
        setTimeout(() => setShowShareFeedback(false), 3000);
      }
    } catch (err) {
      // User might have cancelled share
      console.log('Share cancelled or failed:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-hidden bg-slate-950">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src="https://res.cloudinary.com/dxrnp3289/image/upload/v1775317577/ElevenLabs_image_topaz-image-upscale_2026-04-04T15_45_16_ui19ee.png" 
          alt="Celestial Background" 
          className="absolute inset-0 w-full h-full object-cover opacity-60"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Main Content Container */}
      <div className="relative w-full h-full flex flex-col items-center justify-center p-6 overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-8 left-8 text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-2 group"
        >
          <ArrowLeft className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium uppercase tracking-widest">Back to Sanctuary</span>
        </button>

        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="input-section"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl w-full text-center space-y-12"
            >
              {/* Hero Header */}
              <div className="space-y-4">
                <motion.h1 
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="elegant-heading text-4xl md:text-6xl golden-text leading-tight"
                >
                  Discover the Meaning of Your Angel Number
                </motion.h1>
                <motion.p 
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-slate-500 text-lg md:text-xl italic font-serif"
                >
                  Enter any number and receive a personal message from the angels.
                </motion.p>
              </div>

              {/* Input Section */}
              <div className="space-y-8">
                <div className="relative group max-w-lg mx-auto">
                  {/* Outer Glow Aura */}
                  <motion.div
                    animate={{ 
                      opacity: inputValue ? [0.2, 0.4, 0.2] : [0.1, 0.2, 0.1],
                      scale: inputValue ? [1, 1.02, 1] : [1, 1.01, 1]
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -inset-4 bg-yellow-500/20 blur-2xl rounded-[2.5rem] pointer-events-none"
                  />
                  
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value.replace(/\D/g, ''))}
                    placeholder="111..."
                    className={cn(
                      "relative w-full bg-white/10 backdrop-blur-xl border-2 rounded-[2rem] text-center text-5xl md:text-7xl font-light tracking-[0.2em] py-8 text-slate-800 placeholder:text-slate-300 transition-all duration-500 outline-none",
                      inputValue 
                        ? "border-yellow-500/60 shadow-[0_0_40px_rgba(234,179,8,0.3)]" 
                        : "border-yellow-500/20 shadow-[0_0_20px_rgba(234,179,8,0.1)]",
                      "focus:border-yellow-500 focus:shadow-[0_0_60px_rgba(234,179,8,0.5)]"
                    )}
                  />
                </div>

                {/* Quick-fill Buttons */}
                <div className="flex flex-wrap justify-center gap-4">
                  {[
                    { label: 'My Birth Date', type: 'birth', icon: Calendar },
                    { label: 'Today’s Date', type: 'today', icon: RefreshCw },
                    { label: 'My Phone Number', type: 'phone', icon: Phone },
                  ].map((btn) => (
                    <button
                      key={btn.type}
                      onClick={() => handleQuickFill(btn.type as any)}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 border border-slate-200 text-slate-600 hover:bg-sky-50 hover:border-sky-200 hover:text-sky-600 transition-all text-sm font-medium"
                    >
                      <btn.icon size={16} />
                      {btn.label}
                    </button>
                  ))}
                </div>

                {/* Reveal Button */}
                <button
                  onClick={handleReveal}
                  disabled={!inputValue || isRevealing}
                  className={cn(
                    "relative group px-12 py-5 bg-yellow-600 rounded-full text-white font-medium tracking-[0.2em] uppercase transition-all duration-500 overflow-hidden shadow-[0_10px_30px_rgba(202,138,4,0.3)]",
                    isRevealing ? "opacity-80 cursor-not-allowed" : "hover:bg-yellow-500 hover:scale-105 hover:shadow-[0_20px_40px_rgba(202,138,4,0.4)]"
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <span className="relative flex items-center justify-center gap-3">
                    {isRevealing ? (
                      <>
                        <RefreshCw className="animate-spin" size={20} />
                        Consulting the Heavens...
                      </>
                    ) : (
                      <>
                        <Sparkles size={20} />
                        Reveal My Angel Message
                      </>
                    )}
                  </span>
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="result-section"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-5xl w-full space-y-12 py-12"
            >
              {/* Result Header */}
              <div className="text-center space-y-6">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", damping: 15 }}
                  className="inline-block"
                >
                  <h2 className="text-7xl md:text-9xl font-light tracking-[0.3em] golden-text drop-shadow-[0_0_20px_rgba(234,179,8,0.4)]">
                    {displayedNumber}
                  </h2>
                </motion.div>
                
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-4"
                >
                  <div className="flex justify-center mb-4">
                    <motion.div
                      animate={{ 
                        scale: [1, 1.1, 1],
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{ duration: 4, repeat: Infinity }}
                    >
                      <Wind className="text-sky-400 w-12 h-12" />
                    </motion.div>
                  </div>
                  <h3 className="elegant-heading text-3xl md:text-5xl text-slate-800">
                    {result.title}
                  </h3>
                </motion.div>
              </div>

              {/* Personalized Message */}
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="max-w-3xl mx-auto text-center"
              >
                <p className="text-slate-600 text-lg md:text-xl leading-relaxed font-serif italic">
                  {result.message}
                </p>
              </motion.div>

              {/* Wisdom Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { title: "How to work with this number", content: result.howToWork, icon: Lightbulb, color: "bg-yellow-50 text-yellow-700 border-yellow-100" },
                  { title: "Your Guardian Angel", content: result.relationToAngel, icon: Shield, color: "bg-sky-50 text-sky-700 border-sky-100" },
                  { title: "Daily Affirmation", content: result.affirmation, icon: Star, color: "bg-purple-50 text-purple-700 border-purple-100" },
                ].map((card, idx) => (
                  <motion.div
                    key={card.title}
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.7 + idx * 0.1 }}
                    className={cn(
                      "p-8 rounded-[2rem] border shadow-sm space-y-4 flex flex-col items-center text-center",
                      card.color
                    )}
                  >
                    <div className="p-3 rounded-2xl bg-white/80 shadow-sm">
                      <card.icon size={24} />
                    </div>
                    <h4 className="font-bold tracking-wider uppercase text-xs">{card.title}</h4>
                    <p className="text-sm leading-relaxed opacity-90">{card.content}</p>
                  </motion.div>
                ))}
              </div>

              {/* Result Actions */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="flex flex-wrap justify-center gap-6 pt-8"
              >
                <button 
                  onClick={handleShare}
                  className="flex items-center gap-3 px-8 py-4 bg-white border border-slate-200 rounded-2xl text-slate-700 font-medium hover:bg-slate-50 transition-all shadow-sm relative overflow-hidden"
                >
                  <AnimatePresence mode="wait">
                    {showShareFeedback ? (
                      <motion.div
                        key="check"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        className="flex items-center gap-3 text-green-600"
                      >
                        <Check size={20} />
                        Message Copied!
                      </motion.div>
                    ) : (
                      <motion.div
                        key="share"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        className="flex items-center gap-3"
                      >
                        <Share2 size={20} />
                        Share this Message
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
                <button 
                  onClick={handleReset}
                  className="flex items-center gap-3 px-8 py-4 text-yellow-600 font-medium hover:text-yellow-700 transition-all"
                >
                  <RefreshCw size={20} />
                  Try Another Number
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
