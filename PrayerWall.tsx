import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Heart, Shield, Compass, Flower, Flame, X, Send, Leaf, LogOut, Users, User, Share2, BarChart3, Trophy, Stars, Orbit, Sun } from 'lucide-react';
import { cn } from './utils';
import { db, auth, onAuthStateChanged, handleFirestoreError, OperationType } from './firebase';
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
  lightCount: number;
  isCandleLit?: boolean;
  createdAt: number;
  x: number; // horizontal position %
  y: number; // vertical starting position %
  size: number; // bubble size
  duration: number; // drift duration
  userId: string;
}

export const PrayerWall: React.FC = () => {
  const [prayers, setPrayers] = useState<PrayerBubble[]>([]);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [viewMode, setViewMode] = useState<'community' | 'sanctuary'>('community');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isReflecting, setIsReflecting] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
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

useEffect(() => {
  if (!db) return;

  const q = query(
    collection(db, 'prayers'),
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const loadedPrayers = snapshot.docs.map((doc) => {
        const data = doc.data();

        const token =
          ENERGY_TOKENS.find((t) => t.id === data.tokenId) ||
          ENERGY_TOKENS[0];

        return {
          id: doc.id,
          text: data.text,
          token,
          candles: data.candles || 0,
          lightCount: data.lightCount || 0,
          isCandleLit: data.isCandleLit,
          createdAt: data.createdAt,
          x: data.x,
          y: data.y,
          size: data.size,
          duration: data.duration,
          userId: data.userId,
        } as PrayerBubble;
      });

      setPrayers(loadedPrayers);
    },
    (error) => {
      console.error(error);
      handleFirestoreError(error, OperationType.LIST, 'prayers');
    }
  );

  return () => unsubscribe();
}, [db]);

  const myPrayers = useMemo(() => {
    if (!user) return [];
    return prayers.filter(p => p.userId === user.uid);
  }, [prayers, user]);

  const totalLightReceived = useMemo(() => {
    return myPrayers.reduce((sum, p) => sum + p.lightCount, 0);
  }, [myPrayers]);

  const lightIntensity = useMemo(() => {
    if (totalLightReceived === 0) return 'faint';
    if (totalLightReceived < 10) return 'flicker';
    if (totalLightReceived < 50) return 'radiant';
    return 'constellation';
  }, [totalLightReceived]);

  const mostLitPrayer = useMemo(() => {
    if (myPrayers.length === 0) return null;
    return [...myPrayers].sort((a, b) => b.lightCount - a.lightCount)[0];
  }, [myPrayers]);

  const constellationStars = useMemo(() => {
    return myPrayers.map((prayer, i) => ({
      id: prayer.id,
      x: 30 + (Math.random() * 40),
      y: 30 + (Math.random() * 40),
      size: 2 + (prayer.lightCount * 0.5),
      glow: 10 + prayer.lightCount,
      delay: i * 0.2
    }));
  }, [myPrayers]);

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
      lightCount: 0,
      isCandleLit,
      createdAt: Date.now(),
      x: Math.random() * 80 + 10,
      y: 110,
      size: Math.random() * 40 + 140,
      duration: 30,
      userId: user?.uid || 'anonymous',
    };

    try {
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

  const sendLight = async (id: string) => {
    try {
      const prayerRef = doc(db, 'prayers', id);
      await updateDoc(prayerRef, {
        lightCount: increment(1)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `prayers/${id}`);
    }
  };

  return (
    <div className={cn(
      "fixed inset-0 z-[100] flex flex-col items-center transition-all duration-700",
      viewMode === 'sanctuary' ? "overflow-y-auto custom-scrollbar" : "overflow-hidden"
    )}>
      {/* Background Image */}
      <div 
        className="fixed inset-0 bg-cover bg-center transition-opacity duration-1000"
        style={{ 
          backgroundImage: `url('https://res.cloudinary.com/dxrnp3289/image/upload/v1775499103/ElevenLabs_image_topaz-image-upscale_2026-04-06T18_09_52_o7cca5.png')`,
          filter: isFormOpen || isReflecting || isShareModalOpen ? 'brightness(0.1) blur(12px)' : 'brightness(0.4)'
        }}
      />

      {/* Toggle Header */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[130] flex flex-col items-center gap-4">
        <div className="flex bg-slate-950/40 backdrop-blur-xl rounded-full p-1.5 border border-yellow-500/20 shadow-[0_0_30px_rgba(0,0,0,0.3)]">
          <button
            onClick={() => setViewMode('community')}
            className={cn(
              "flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all duration-500",
              viewMode === 'community' 
                ? "bg-yellow-500 text-slate-950 shadow-[0_0_20px_rgba(234,179,8,0.4)]" 
                : "text-slate-400 hover:text-white"
            )}
          >
            <Users size={16} />
            Community
          </button>
          <button
            onClick={() => setViewMode('sanctuary')}
            className={cn(
              "flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all duration-500",
              viewMode === 'sanctuary' 
                ? "bg-yellow-500 text-slate-950 shadow-[0_0_20px_rgba(234,179,8,0.4)]" 
                : "text-slate-400 hover:text-white"
            )}
          >
            <User size={16} />
            My Sanctuary
          </button>
        </div>
      </div>

      {/* Community View */}
      <AnimatePresence mode="wait">
        {viewMode === 'community' && (
          <motion.div
            key="community"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {/* Breathing Wall of Bubbles */}
            <div ref={wallRef} className="absolute inset-0 pointer-events-none">
              <AnimatePresence>
                {prayers.slice(0, 15).map((prayer) => (
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
                      ease: "easeInOut",
                      x: { duration: prayer.duration / 2, repeat: Infinity, ease: "easeInOut" },
                      opacity: { times: [0, 0.15, 0.85, 1] }
                    }}
                    className="absolute pointer-events-auto"
                    style={{ width: prayer.size }}
                  >
                    <motion.div
                      whileHover="hover"
                      initial="initial"
                      animate="animate"
                      variants={{
                        initial: { scale: 1, boxShadow: '0 0 40px rgba(234,179,8,0.1)' },
                        animate: { 
                          scale: [1, 1.02, 0.98, 1.01, 1],
                          boxShadow: [
                            '0 0 40px rgba(234,179,8,0.1)',
                            '0 0 50px rgba(234,179,8,0.2)',
                            '0 0 40px rgba(234,179,8,0.1)'
                          ]
                        },
                        hover: { 
                          scale: 1.1, 
                          boxShadow: '0 0 80px rgba(234,179,8,0.6), 0 0 120px rgba(234,179,8,0.3)',
                          transition: { duration: 0.4, ease: "easeOut" }
                        }
                      }}
                      onClick={() => sendLight(prayer.id)}
                      className="relative p-8 rounded-t-full rounded-b-[40%] flex flex-col items-center justify-center text-center cursor-pointer border border-yellow-500/20 backdrop-blur-xl group overflow-hidden"
                      style={{ 
                        background: 'radial-gradient(circle at 50% 100%, rgba(234,179,8,0.15) 0%, rgba(15,23,42,0.9) 80%)',
                      }}
                    >
                      <motion.div
                        variants={{
                          initial: { opacity: 0, scale: 0.8 },
                          hover: { opacity: 0.4, scale: 1.4 }
                        }}
                        className="absolute inset-0 bg-yellow-400/10 blur-3xl rounded-full pointer-events-none"
                      />
                      
                      <div className={cn("mb-3 relative z-20 scale-125", prayer.token.color)}>
                        {prayer.token.icon}
                      </div>
                      
                      <p className="text-sm text-slate-100 line-clamp-4 italic px-3 relative z-20 leading-relaxed drop-shadow-sm">
                        "{prayer.text}"
                      </p>

                      <div className="mt-4 flex items-center gap-2 relative z-20">
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-500/10 rounded-full border border-yellow-500/20">
                          <Sparkles size={12} className="text-yellow-500" />
                          <span className="text-[10px] font-bold text-yellow-500">{prayer.lightCount}</span>
                        </div>
                      </div>
                      
                      {/* Celestial Pulse effect on click */}
                      <motion.div
                        initial={false}
                        animate={{ scale: [1, 1.5, 1], opacity: [0, 0.4, 0] }}
                        transition={{ duration: 0.6 }}
                        key={prayer.lightCount}
                        className="absolute inset-0 rounded-t-full rounded-b-[40%] bg-yellow-400/20 pointer-events-none"
                      />
                    </motion.div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Action Button */}
            {!isFormOpen && !isReflecting && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setIsFormOpen(true)}
                className="absolute bottom-12 left-1/2 -translate-x-1/2 px-8 py-4 bg-yellow-600/80 hover:bg-yellow-500 text-white rounded-full font-medium tracking-widest uppercase flex items-center gap-3 backdrop-blur-md border border-yellow-500/30 transition-all hover:scale-105 shadow-[0_0_30px_rgba(234,179,8,0.3)]"
              >
                <Sparkles size={20} />
                Release a Prayer
              </motion.button>
            )}
          </motion.div>
        )}

        {/* My Sanctuary View */}
        {viewMode === 'sanctuary' && (
          <motion.div
            key="sanctuary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative w-full min-h-screen flex flex-col items-center p-6 pt-32 pb-32 overflow-visible"
          >
            {/* Constellation Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
              <AnimatePresence>
                {constellationStars.map((star, i) => (
                  <motion.div
                    key={`star-${star.id}`}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ 
                      opacity: [0.2, 0.5, 0.2],
                      scale: [1, 1.2, 1],
                      x: Math.sin(i) * 20,
                      y: Math.cos(i) * 20
                    }}
                    transition={{ 
                      duration: 4 + Math.random() * 4, 
                      repeat: Infinity,
                      delay: star.delay
                    }}
                    className="absolute rounded-full bg-yellow-400/20 blur-[2px]"
                    style={{
                      left: `${star.x}%`,
                      top: `${star.y}%`,
                      width: star.size,
                      height: star.size,
                      boxShadow: `0 0 ${star.glow}px rgba(234,179,8,0.4)`
                    }}
                  />
                ))}
              </AnimatePresence>
              
              {/* Connecting Lines (SVG) */}
              <svg className="absolute inset-0 w-full h-full opacity-10">
                {constellationStars.length > 1 && constellationStars.slice(0, -1).map((star, i) => {
                  const nextStar = constellationStars[i + 1];
                  return (
                    <motion.line
                      key={`line-${star.id}`}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 2, delay: i * 0.3 }}
                      x1={`${star.x}%`}
                      y1={`${star.y}%`}
                      x2={`${nextStar.x}%`}
                      y2={`${nextStar.y}%`}
                      stroke="rgba(234,179,8,0.3)"
                      strokeWidth="0.5"
                    />
                  );
                })}
              </svg>
            </div>

            <div className="max-w-5xl w-full flex flex-col gap-16 relative z-10">
              {/* Centrepiece Header */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <motion.div 
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="lg:col-span-2 glass-panel p-10 flex flex-col md:flex-row items-center justify-between relative overflow-hidden group border-yellow-500/10"
                >
                  <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left">
                    <p className="text-slate-400 uppercase tracking-[0.4em] text-[10px] mb-4 opacity-60">Your Living Light</p>
                    <div className="relative mb-4">
                      <motion.h2 
                        key={totalLightReceived}
                        initial={{ scale: 1.2, filter: 'brightness(2)' }}
                        animate={{ scale: 1, filter: 'brightness(1)' }}
                        className="text-5xl md:text-7xl golden-text font-serif italic tracking-tighter"
                      >
                        {totalLightReceived.toLocaleString()}
                      </motion.h2>
                      
                      {/* Pulsing Glow based on intensity */}
                      <motion.div
                        animate={{ 
                          scale: lightIntensity === 'faint' ? [1, 1.1, 1] : [1, 1.3, 1],
                          opacity: lightIntensity === 'faint' ? [0.1, 0.2, 0.1] : [0.2, 0.5, 0.2]
                        }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className={cn(
                          "absolute -inset-8 rounded-full blur-3xl pointer-events-none",
                          lightIntensity === 'faint' ? "bg-yellow-500/10" : 
                          lightIntensity === 'flicker' ? "bg-yellow-500/20" :
                          lightIntensity === 'radiant' ? "bg-yellow-400/30" : "bg-yellow-300/40"
                        )}
                      />
                    </div>
                    
                    <p className="text-slate-400 text-sm italic max-w-xs leading-relaxed">
                      {totalLightReceived === 0 
                        ? "Your light is waiting to be shared with the world."
                        : "Your light is growing. Each blessing is a soul touched by your presence."}
                    </p>
                  </div>

                  <div className="mt-8 md:mt-0 relative z-10 flex flex-col items-center gap-6">
                    <div className="relative group">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                        className="absolute -inset-4 border border-yellow-500/10 rounded-full border-dashed"
                      />
                      <button
                        onClick={() => setIsShareModalOpen(true)}
                        className="relative p-6 bg-slate-950/50 hover:bg-yellow-500/10 text-yellow-500 rounded-full transition-all border border-yellow-500/20 group-hover:scale-110 group-hover:border-yellow-500/40 shadow-[0_0_20px_rgba(234,179,8,0.1)]"
                      >
                        <Share2 size={28} />
                        <motion.div
                          animate={{ opacity: [0, 1, 0], scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute inset-0 bg-yellow-500/5 rounded-full blur-md"
                        />
                      </button>
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.3em] text-yellow-500/60 font-medium">Send your light outward</span>
                  </div>

                  {/* Background Evolving Visual */}
                  <div className="absolute top-0 right-0 w-96 h-96 pointer-events-none">
                    <motion.div
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: 360
                      }}
                      transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                      className={cn(
                        "absolute top-0 right-0 w-full h-full rounded-full blur-[100px] -mr-48 -mt-48 transition-colors duration-1000",
                        lightIntensity === 'faint' ? "bg-yellow-500/5" : 
                        lightIntensity === 'flicker' ? "bg-yellow-500/10" :
                        lightIntensity === 'radiant' ? "bg-yellow-400/20" : "bg-yellow-300/30"
                      )}
                    />
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="glass-panel p-10 flex flex-col justify-center items-center text-center relative overflow-hidden border-yellow-500/10"
                >
                  <Orbit className="text-yellow-500/30 w-12 h-12 mb-6 animate-pulse" />
                  <p className="text-slate-400 uppercase tracking-[0.4em] text-[10px] mb-3 opacity-60">Prayers released</p>
                  <p className="text-5xl text-white font-serif italic">{myPrayers.length}</p>
                  <p className="text-[9px] text-slate-500 mt-4 uppercase tracking-widest">Into the sanctuary</p>
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent" />
                </motion.div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                {/* Prayer List */}
                <div className="lg:col-span-3 flex flex-col gap-8">
                  <div className="flex items-center justify-between px-4">
                    <h3 className="text-slate-400 uppercase tracking-[0.4em] text-[10px] opacity-60">Your Personal Intentions</h3>
                    {mostLitPrayer && (
                      <div className="flex items-center gap-2 text-yellow-500/40 text-[10px] uppercase tracking-[0.2em] font-medium">
                        <Stars size={12} />
                        Most Resonated
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-8 pb-20">
                    {myPrayers.length === 0 ? (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center text-center p-16 glass-panel border-dashed border-slate-800/50 bg-slate-950/20"
                      >
                        <div className="relative mb-8">
                          <motion.div
                            animate={{ 
                              scale: [1, 1.2, 1],
                              opacity: [0.3, 0.6, 0.3]
                            }}
                            transition={{ duration: 4, repeat: Infinity }}
                            className="absolute inset-0 bg-yellow-500/20 blur-2xl rounded-full"
                          />
                          <div className="relative p-8 bg-slate-900/40 rounded-full border border-yellow-500/10">
                            <Sun className="text-yellow-500/40 w-16 h-16" />
                          </div>
                        </div>
                        <h4 className="text-xl text-slate-200 font-serif italic mb-4">Your sanctuary awaits your first light</h4>
                        <p className="text-slate-500 text-sm max-w-xs mx-auto mb-10 leading-relaxed italic">
                          Release a prayer into the community wall to begin building your celestial sky.
                        </p>
                        <button 
                          onClick={() => setViewMode('community')}
                          className="group relative px-10 py-4 overflow-hidden rounded-full transition-all"
                        >
                          <div className="absolute inset-0 bg-yellow-500/10 group-hover:bg-yellow-500/20 transition-colors" />
                          <span className="relative text-yellow-500 text-xs uppercase tracking-[0.3em] font-medium">Release your first prayer</span>
                        </button>
                      </motion.div>
                    ) : (
                      myPrayers.map((prayer, index) => (
                        <motion.div
                          key={prayer.id}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: index * 0.05, duration: 0.8 }}
                          className={cn(
                            "glass-panel p-8 flex items-center justify-between group transition-all duration-700 hover:bg-white/5",
                            prayer.id === mostLitPrayer?.id ? "border-yellow-500/30 bg-yellow-500/5" : "border-white/5"
                          )}
                        >
                          <div className="flex items-center gap-8 flex-1">
                            <div className={cn("p-4 rounded-2xl bg-slate-950/50 border border-white/5 transition-transform duration-500 group-hover:scale-110", prayer.token.color)}>
                              {prayer.token.icon}
                            </div>
                            <div className="flex-1">
                              <p className="text-slate-200 italic text-lg leading-relaxed line-clamp-1 group-hover:line-clamp-none transition-all duration-700">
                                "{prayer.text}"
                              </p>
                              <div className="flex items-center gap-4 mt-3">
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                                  {new Date(prayer.createdAt).toLocaleDateString()}
                                </p>
                                {prayer.id === mostLitPrayer?.id && (
                                  <span className="text-[8px] text-yellow-500/60 uppercase tracking-widest bg-yellow-500/10 px-2 py-0.5 rounded-full">Radiant</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-6 ml-10">
                            <div className="flex flex-col items-end text-right">
                              {prayer.lightCount > 0 && (
                                <div className="flex items-center gap-3">
                                  <motion.div
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                  >
                                    <Sparkles size={16} className="text-yellow-500" />
                                  </motion.div>
                                  <span className="text-3xl font-serif text-white tracking-tighter">{prayer.lightCount}</span>
                                </div>
                              )}
                              <p className={cn(
                                "text-[8px] uppercase tracking-[0.2em] text-slate-500 mt-1 max-w-[140px]",
                                prayer.lightCount === 0 ? "opacity-40" : "text-yellow-500/60"
                              )}>
                                {prayer.lightCount === 0 
                                  ? "No responses yet your light is still travelling" 
                                  : "Your prayer touched someone"}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="hidden lg:flex flex-col gap-8">
                  <div className="sticky top-32 space-y-8">
                    <h3 className="text-slate-400 uppercase tracking-[0.4em] text-[10px] px-4 opacity-60">Moments of connection</h3>
                    <div className="glass-panel p-8 space-y-8 bg-slate-950/20 border-white/5">
                      {myPrayers.some(p => p.lightCount > 0) ? (
                        myPrayers
                          .filter(p => p.lightCount > 0)
                          .sort((a, b) => b.createdAt - a.createdAt)
                          .slice(0, 6)
                          .map((p, i) => (
                            <motion.div 
                              key={p.id}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1, duration: 0.8 }}
                              className="flex items-start gap-5 group"
                            >
                              <div className="mt-1 p-2.5 bg-yellow-500/5 rounded-full border border-yellow-500/10 group-hover:bg-yellow-500/10 transition-colors">
                                <Flame size={14} className="text-yellow-500/60" />
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs text-slate-300 font-medium">Your light reached another soul</p>
                                <p className="text-[10px] text-slate-500 italic line-clamp-1 opacity-60 group-hover:opacity-100 transition-opacity">"{p.text}"</p>
                                <p className="text-[8px] text-slate-600 uppercase tracking-widest pt-1">Just now</p>
                              </div>
                            </motion.div>
                          ))
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center opacity-30 py-12">
                          <Stars size={32} className="text-slate-600 mb-6" />
                          <p className="text-[10px] uppercase tracking-[0.4em] text-slate-500">Waiting for resonance</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Sanctuary Message */}
                    <div className="p-6 text-center">
                      <p className="text-[10px] text-slate-600 italic tracking-widest uppercase">
                        "You are seen. Your prayers matter."
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {isShareModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="max-w-md w-full space-y-8"
            >
              {/* Share Card */}
              <div className="relative p-12 rounded-[3rem] bg-slate-950 border border-yellow-500/30 overflow-hidden text-center shadow-[0_0_100px_rgba(234,179,8,0.2)]">
                <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/10 to-transparent pointer-events-none" />
                
                {/* Background Constellation for Share Card */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                  {[...Array(12)].map((_, i) => (
                    <div 
                      key={i}
                      className="absolute w-1 h-1 bg-yellow-500 rounded-full blur-[1px]"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                      }}
                    />
                  ))}
                </div>

                <div className="relative z-10 space-y-8">
                  <div className="flex justify-center">
                    <div className="p-6 bg-yellow-500/10 rounded-full relative">
                      <Sparkles className="text-yellow-500 w-12 h-12" />
                      <motion.div 
                        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="absolute inset-0 bg-yellow-500/20 blur-2xl rounded-full"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-slate-400 uppercase tracking-[0.4em] text-[10px]">My Divine Light</h4>
                    <p className="text-6xl golden-text font-serif italic tracking-tighter">
                      {totalLightReceived}
                    </p>
                    <p className="text-slate-500 uppercase tracking-[0.3em] text-[10px]">Blessings Received</p>
                  </div>

                  <div className="h-px w-24 mx-auto bg-yellow-500/20" />

                  <p className="text-slate-300 font-serif italic text-lg leading-relaxed">
                    "This prayer has been heard. The sanctuary resonates with your presence."
                  </p>

                  <div className="pt-4">
                    <p className="text-[10px] text-yellow-500/40 uppercase tracking-[0.4em]">Divine Sanctuary</p>
                  </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-full border-[20px] border-yellow-500/5 pointer-events-none rounded-[3rem]" />
              </div>

              <div className="flex flex-col gap-4">
                <button
                  onClick={() => {
                    alert("Your Light Card is ready for sharing. Take a screenshot to spread the light!");
                  }}
                  className="w-full py-5 bg-yellow-600 hover:bg-yellow-500 text-white rounded-full font-medium tracking-[0.3em] uppercase transition-all flex items-center justify-center gap-3 shadow-[0_10px_40px_rgba(202,138,4,0.3)] hover:scale-[1.02]"
                >
                  <Share2 size={18} />
                  Share My Light
                </button>
                <button
                  onClick={() => setIsShareModalOpen(false)}
                  className="w-full py-4 text-slate-400 hover:text-white transition-all uppercase tracking-widest text-xs"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <button 
                onClick={() => setIsFormOpen(false)}
                className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>

              <h2 className="elegant-heading text-3xl golden-text text-center mb-8">
                Release your intention
              </h2>

              <form onSubmit={handleRelease} className="space-y-8">
                <div className="relative">
                  <textarea
                    value={newPrayerText}
                    onChange={(e) => setNewPrayerText(e.target.value)}
                    onMouseMove={handleMouseMove}
                    placeholder="What would you like to share with the angels?"
                    className={cn(
                      "w-full bg-slate-950/80 border rounded-2xl p-6 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 min-h-[180px] resize-none font-serif italic text-lg relative z-10 transition-all duration-500",
                      isCandleLit ? "border-yellow-500/50 focus:ring-yellow-500" : "border-yellow-500/20 focus:ring-yellow-500/50"
                    )}
                  />
                  
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
