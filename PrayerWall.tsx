import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Heart, Shield, Compass, Flower, Flame, X, Send, Leaf, LogOut } from 'lucide-react';
import { cn } from './utils';
import { db, auth, onAuthStateChanged, signOut, handleFirestoreError, OperationType } from '../firebase';
import { ErrorBoundary } from './ErrorBoundary';
import { AuthModal } from './AuthModal';
import { User as FirebaseUser } from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  updateDoc, 
  doc, 
  increment,
  where,
  getDocFromServer
} from 'firebase/firestore';

interface EnergyToken {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const ENERGY_TOKENS: EnergyToken[] = [
  { id: 'healing', label: 'Healing', icon: <Leaf className="w-4 h-4" />, color: 'text-emerald-400' },
  { id: 'strength', label: 'Strength', icon: <Shield className="w-4 h-4" />, color: 'text-yellow-500' },
  { id: 'gratitude', label: 'Gratitude', icon: <Flower className="w-4 h-4" />, color: 'text-pink-400' },
  { id: 'guidance', label: 'Guidance', icon: <Compass className="w-4 h-4" />, color: 'text-sky-400' },
];

interface PrayerBubble {
  id: string;
  text: string;
  token: EnergyToken;
  candles: number;
  isCandleLit?: boolean;
  createdAt: number;
  x: number; // horizontal position %
  y: number; // vertical starting position %
  size: number; // bubble size
  duration: number; // drift duration
  uid: string;
}

interface PrayerWallProps {
  onClose?: () => void;
}

export const PrayerWall: React.FC<PrayerWallProps> = ({ onClose }) => {
  const [prayers, setPrayers] = useState<PrayerBubble[]>([]);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'mine'>('all');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isReflecting, setIsReflecting] = useState(false);
  const [newPrayerText, setNewPrayerText] = useState('');
  const [isCandleLit, setIsCandleLit] = useState(false);
  const [selectedToken, setSelectedToken] = useState<EnergyToken>(ENERGY_TOKENS[0]);
  const [stardust, setStardust] = useState<{ x: number; y: number; id: number }[]>([]);
  
  const wallRef = useRef<HTMLDivElement>(null);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Connection test
  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. The client is offline.");
        }
      }
    };
    testConnection();
  }, []);

  // Real-time prayers from Firestore
  useEffect(() => {
    // Fetch the global wall to avoid index issues with uid + createdAt
    // We will filter client-side for "My Prayers"
    const q = query(
      collection(db, 'prayers'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedPrayers = snapshot.docs.map(doc => {
        const data = doc.data();
        const token = ENERGY_TOKENS.find(t => t.id === data.tokenId) || ENERGY_TOKENS[0];
        return {
          id: doc.id,
          text: data.text,
          token,
          candles: data.candles,
          isCandleLit: data.isCandleLit,
          createdAt: data.createdAt,
          x: data.x,
          y: data.y,
          size: data.size,
          duration: data.duration,
          uid: data.uid
        } as PrayerBubble;
      });
      setPrayers(loadedPrayers);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'prayers');
    });

    return () => unsubscribe();
  }, []);

  const displayedPrayers = useMemo(() => {
    if (viewMode === 'mine' && user) {
      return prayers.filter(p => p.uid === user.uid);
    }
    return prayers;
  }, [prayers, viewMode, user]);

  // Stardust effect
  const handleMouseMove = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const id = Date.now() + Math.random();
    setStardust(prev => [...prev.slice(-40), { x, y, id }]);
    
    setTimeout(() => {
      setStardust(prev => prev.filter(s => s.id !== id));
    }, 1000);
  };

  const handleRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrayerText.trim()) return;

    setIsReflecting(true);
    
    const prayerData = {
      text: newPrayerText,
      tokenId: selectedToken.id,
      candles: isCandleLit ? 1 : 0,
      isCandleLit,
      createdAt: Date.now(),
      x: Math.random() * 80 + 10,
      y: 110, // New prayers start from the bottom
      size: Math.random() * 40 + 140,
      duration: Math.random() * 10 + 25,
      uid: user?.uid || 'anonymous', // Fallback for safety, though rules require auth
    };

    try {
      if (!user) {
        setIsAuthModalOpen(true);
        setIsReflecting(false);
        return;
      }
      
      await addDoc(collection(db, 'prayers'), prayerData);
      
      setTimeout(() => {
        setNewPrayerText('');
        setIsCandleLit(false);
        setIsFormOpen(false);
        setIsReflecting(false);
      }, 2000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'prayers');
      setIsReflecting(false);
    }
  };

  const lightCandle = async (id: string) => {
    try {
      const prayerRef = doc(db, 'prayers', id);
      await updateDoc(prayerRef, {
        candles: increment(1)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `prayers/${id}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden flex flex-col items-center justify-center">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
        style={{ 
          backgroundImage: `url('https://res.cloudinary.com/dxrnp3289/image/upload/v1775499103/ElevenLabs_image_topaz-image-upscale_2026-04-06T18_09_52_o7cca5.png')`,
          filter: isFormOpen || isReflecting ? 'brightness(0.15) blur(8px)' : 'brightness(0.4)'
        }}
      />

      {/* Breathing Wall of Bubbles */}
      <div ref={wallRef} className="absolute inset-0 pointer-events-none">
        <AnimatePresence>
          {displayedPrayers.map((prayer) => (
            <motion.div
              key={prayer.id}
              initial={{ y: `${prayer.y}vh`, x: `${prayer.x}vw`, opacity: 0, scale: 0.8 }}
              animate={{ 
                y: '-20vh', 
                x: [`${prayer.x}vw`, `${prayer.x + (Math.random() * 10 - 5)}vw`, `${prayer.x}vw`],
                opacity: [0, 1, 1, 0],
                scale: [0.8, 1, 1, 0.9],
              }}
              transition={{ 
                duration: prayer.duration, 
                ease: "linear",
                x: { duration: prayer.duration / 2, repeat: Infinity, ease: "easeInOut" },
                opacity: { times: [0, 0.1, 0.8, 1] }
              }}
              className="absolute pointer-events-auto"
              style={{ width: prayer.size }}
            >
              <motion.div
                whileHover={{ scale: 1.1, boxShadow: '0 0 60px rgba(234,179,8,0.6)' }}
                animate={{ 
                  scale: [1, 1.02, 0.98, 1.01, 1],
                  opacity: [0.9, 1, 0.95, 1, 0.9],
                  rotate: [-0.5, 0.5, -0.3, 0.3, 0]
                }}
                transition={{ 
                  duration: 2 + Math.random(), 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                onClick={() => lightCandle(prayer.id)}
                className="relative p-8 rounded-t-full rounded-b-[40%] flex flex-col items-center justify-center text-center cursor-pointer border border-yellow-500/30 backdrop-blur-xl group overflow-hidden"
                style={{ 
                  background: 'radial-gradient(circle at 50% 100%, rgba(234,179,8,0.2) 0%, rgba(15,23,42,0.85) 80%)',
                  boxShadow: '0 0 40px rgba(234,179,8,0.2), inset 0 0 25px rgba(234,179,8,0.1)'
                }}
              >
                {/* Flame Aura */}
                <div className="absolute inset-0 bg-gradient-to-t from-orange-500/10 via-yellow-500/5 to-transparent opacity-40" />
                
                {/* Flickering Flame Tip */}
                <motion.div 
                  animate={{ 
                    height: ['30px', '45px', '35px'],
                    opacity: [0.7, 1, 0.8],
                    scaleX: [1, 1.1, 0.9, 1]
                  }}
                  transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-6 w-6 bg-gradient-to-t from-yellow-500 via-yellow-200 to-white rounded-full blur-[6px] z-10"
                />

                <div className={cn("mb-3 relative z-20 scale-125", prayer.token.color)}>
                  {prayer.token.icon}
                </div>
                
                <p className="text-sm text-slate-100 line-clamp-4 italic px-3 relative z-20 leading-relaxed drop-shadow-sm">
                  "{prayer.text}"
                  {prayer.isCandleLit && (
                    <motion.span
                      animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                      className="inline-block ml-2 align-middle"
                    >
                      <Flame size={14} className="text-yellow-400 fill-yellow-400/30" />
                    </motion.span>
                  )}
                </p>

                <div className="mt-4 flex items-center gap-1.5 relative z-20">
                  {Array.from({ length: Math.min(prayer.candles, 5) }).map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.2, 1] }}
                      transition={{ duration: 1 + Math.random(), repeat: Infinity }}
                    >
                      <Flame size={12} className="text-yellow-500 fill-yellow-500/20" />
                    </motion.div>
                  ))}
                  {prayer.candles > 5 && <span className="text-[10px] text-yellow-500 font-bold">+{prayer.candles - 5}</span>}
                </div>
                
                {/* Celestial Pulse effect on click */}
                <motion.div
                  initial={false}
                  animate={{ scale: [1, 1.5, 1], opacity: [0, 0.4, 0] }}
                  transition={{ duration: 0.6 }}
                  key={prayer.candles}
                  className="absolute inset-0 rounded-t-full rounded-b-[40%] bg-yellow-400/30 pointer-events-none"
                />
                
                {/* Shimmering Border */}
                <div className="absolute inset-0 border border-yellow-500/20 rounded-t-full rounded-b-[40%] pointer-events-none group-hover:border-yellow-500/50 transition-colors duration-500" />
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Floating Particles Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 40 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * 100 + 'vw', 
              y: Math.random() * 100 + 'vh',
              opacity: Math.random() * 0.5 + 0.2,
              scale: Math.random() * 1.5
            }}
            animate={{ 
              y: '-10vh',
              x: (Math.random() * 120 - 60) + 'vw'
            }}
            transition={{ 
              duration: Math.random() * 30 + 30, 
              repeat: Infinity, 
              ease: "linear",
              delay: Math.random() * -30 // Start at different points in the animation
            }}
            className="absolute w-1 h-1 bg-yellow-200 rounded-full blur-[1px]"
          />
        ))}
      </div>

      {/* Close Button */}
      {onClose && !isFormOpen && !isReflecting && (
        <div className="absolute top-8 right-8 z-[130] flex items-center gap-4">
          {/* View Toggle */}
          {user && (
            <div className="flex items-center gap-4">
              <div className="flex bg-white/10 backdrop-blur-md rounded-full p-1 border border-white/20">
                <button
                  onClick={() => setViewMode('all')}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-medium transition-all",
                    viewMode === 'all' ? "bg-yellow-500 text-slate-950 shadow-lg" : "text-slate-400 hover:text-white"
                  )}
                >
                  All Prayers
                </button>
                <button
                  onClick={() => setViewMode('mine')}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-medium transition-all",
                    viewMode === 'mine' ? "bg-yellow-500 text-slate-950 shadow-lg" : "text-slate-400 hover:text-white"
                  )}
                >
                  My Prayers
                </button>
              </div>
              <button
                onClick={() => signOut(auth)}
                className="p-2 text-slate-400 hover:text-red-400 transition-all hover:scale-110"
                title="Sign Out"
              >
                <LogOut size={20} />
              </button>
            </div>
          )}
          
          {!user && (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md border border-white/20 text-xs font-medium transition-all"
            >
              Sign in to see your prayers
            </button>
          )}

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={onClose}
            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md border border-white/20 transition-all hover:scale-110"
          >
            <X size={24} />
          </motion.button>
        </div>
      )}

      {/* Action Button */}
      {!isFormOpen && !isReflecting && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setIsFormOpen(true)}
          className="absolute bottom-12 px-8 py-4 bg-yellow-600/80 hover:bg-yellow-500 text-white rounded-full font-medium tracking-widest uppercase flex items-center gap-3 backdrop-blur-md border border-yellow-500/30 transition-all hover:scale-105 shadow-[0_0_30px_rgba(234,179,8,0.3)]"
        >
          <Sparkles size={20} />
          Prayer or request
        </motion.button>
      )}

      {/* Submission Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[110] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ 
                scale: 1, 
                y: 0,
                boxShadow: isCandleLit ? '0 0 100px rgba(234,179,8,0.4)' : '0 0 60px rgba(0,0,0,0.5)'
              }}
              exit={{ scale: 0.9, y: 20 }}
              className={cn(
                "max-w-xl w-full glass-panel p-8 md:p-12 relative transition-all duration-700 overflow-hidden",
                isCandleLit ? "border-yellow-500/60 bg-yellow-500/10" : "border-yellow-500/20"
              )}
            >
              {/* Form Background Glow */}
              <AnimatePresence>
                {isCandleLit && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-gradient-to-b from-yellow-500/5 to-transparent pointer-events-none"
                  />
                )}
              </AnimatePresence>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>

              <h2 className="elegant-heading text-3xl golden-text text-center mb-8">
                Prayer or request
              </h2>

              <form onSubmit={handleRelease} className="space-y-8">
                <div className="relative">
                  <textarea
                    value={newPrayerText}
                    onChange={(e) => setNewPrayerText(e.target.value)}
                    onMouseMove={handleMouseMove}
                    placeholder="Release your intention to the angels..."
                    className={cn(
                      "w-full bg-slate-950/80 border rounded-2xl p-6 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 min-h-[180px] resize-none font-serif italic text-lg relative z-10 transition-all duration-500",
                      isCandleLit ? "border-yellow-500/50 focus:ring-yellow-500" : "border-yellow-500/20 focus:ring-yellow-500/50"
                    )}
                  />
                  
                  {/* Candle Flame Animation in Textarea */}
                  <AnimatePresence>
                    {isCandleLit && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        className="absolute bottom-4 right-4 z-20 flex flex-col items-center"
                      >
                        <motion.div
                          animate={{ 
                            scale: [1, 1.1, 1],
                            opacity: [0.8, 1, 0.8],
                            y: [0, -2, 0]
                          }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="w-3 h-5 bg-gradient-to-t from-orange-500 via-yellow-400 to-transparent rounded-full blur-[2px]"
                        />
                        <div className="w-1 h-3 bg-slate-400 rounded-full mt-[-2px]" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Stardust Trail */}
                  {stardust.map(s => (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 1, scale: 1 }}
                      animate={{ opacity: 0, scale: 0, y: -20 }}
                      className="absolute w-1 h-1 bg-yellow-400 rounded-full pointer-events-none z-20"
                      style={{ left: s.x, top: s.y }}
                    />
                  ))}
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 text-center">Select your intention</p>
                  <div className="flex flex-wrap justify-center gap-3">
                    {ENERGY_TOKENS.map((token) => (
                      <button
                        key={token.id}
                        type="button"
                        onClick={() => setSelectedToken(token)}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 text-xs",
                          selectedToken.id === token.id 
                            ? "bg-yellow-500/20 border-yellow-500 text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]" 
                            : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"
                        )}
                      >
                        {token.icon}
                        {token.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Candle Toggle */}
                <div className={cn(
                  "flex items-center justify-between p-4 rounded-2xl border transition-all duration-500",
                  isCandleLit ? "bg-yellow-500/10 border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.2)]" : "bg-white/5 border-white/10"
                )}>
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-3 rounded-xl transition-all duration-500",
                      isCandleLit ? "bg-yellow-500 text-slate-950 scale-110 shadow-[0_0_15px_rgba(234,179,8,0.5)]" : "bg-white/10 text-slate-500"
                    )}>
                      <Flame size={24} className={cn(isCandleLit && "animate-pulse")} />
                    </div>
                    <div>
                      <p className={cn("text-sm font-bold transition-colors duration-500", isCandleLit ? "text-yellow-500" : "text-slate-300")}>
                        Light a candle
                      </p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest">Illuminate your intention</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCandleLit(!isCandleLit)}
                    className={cn(
                      "w-14 h-7 rounded-full relative transition-all duration-500",
                      isCandleLit ? "bg-yellow-500" : "bg-slate-800"
                    )}
                  >
                    <motion.div
                      animate={{ x: isCandleLit ? 30 : 4 }}
                      className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg flex items-center justify-center"
                    >
                      {isCandleLit && <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />}
                    </motion.div>
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-yellow-600 hover:bg-yellow-500 text-white rounded-full font-medium tracking-widest uppercase transition-all hover:scale-[1.02] shadow-[0_0_30px_rgba(234,179,8,0.2)] flex items-center justify-center gap-3"
                >
                  <Send size={18} />
                  Release to the Angels
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reflection Screen */}
      <AnimatePresence>
        {isReflecting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[120] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md"
          >
            <div className="max-w-2xl text-center space-y-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1 }}
                className="flex justify-center"
              >
                <div className="relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-8 border border-yellow-500/20 rounded-full border-dashed"
                  />
                  <Sparkles className="text-yellow-500 w-16 h-16" />
                  {isCandleLit && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                      className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center"
                    >
                      <motion.div
                        animate={{ 
                          scale: [1, 1.2, 1],
                          opacity: [0.8, 1, 0.8],
                          y: [0, -4, 0]
                        }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-4 h-7 bg-gradient-to-t from-orange-500 via-yellow-400 to-transparent rounded-full blur-[2px]"
                      />
                      <div className="w-1.5 h-4 bg-slate-400 rounded-full mt-[-2px]" />
                      <p className="text-[10px] text-yellow-500 uppercase tracking-widest mt-2">Candle Lit</p>
                    </motion.div>
                  )}
                </div>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 1 }}
                className="space-y-6"
              >
                <p className="text-2xl md:text-3xl text-slate-200 font-serif italic leading-relaxed">
                  "Your intention has been received. May you feel the warmth of wings surrounding you as your message joins the Wall of Light."
                </p>
                <p className="text-xl text-yellow-500/80 font-light tracking-widest uppercase">
                  Take a deep breath — you are not alone.
                </p>
              </motion.div>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3 }}
                onClick={() => {
                  setIsReflecting(false);
                  setIsFormOpen(false);
                }}
                className="px-12 py-4 border border-yellow-500/30 text-yellow-500 rounded-full hover:bg-yellow-500/10 transition-all uppercase tracking-widest text-sm"
              >
                Return to the Wall
              </motion.button>
            </div>
            
            {/* Dissolving Particles Animation */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 50 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    x: '50vw', 
                    y: '50vh',
                    scale: Math.random() * 2,
                    opacity: 1
                  }}
                  animate={{ 
                    x: (Math.random() * 100) + 'vw',
                    y: '-10vh',
                    opacity: 0,
                    scale: 0
                  }}
                  transition={{ 
                    duration: Math.random() * 2 + 1,
                    ease: "easeOut",
                    delay: Math.random() * 0.5
                  }}
                  className="absolute w-1 h-1 bg-yellow-400 rounded-full"
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  );
};
