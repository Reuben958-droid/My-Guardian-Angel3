import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ChevronRight, ArrowLeft, Heart, Wind, User, LogOut } from 'lucide-react';

import { CelestialBackground } from './CelestialBackground';
import { AngelProfile } from './AngelProfile';
import { PrayerWall } from './PrayerWall';
import { AngelNumberCalculator } from './AngelNumberCalculator';
import { MeditationPlayer } from './MeditationPlayer';
import { DailyGuidance } from './DailyGuidance';
import { ErrorBoundary } from './ErrorBoundary';
import { AuthModal } from './AuthModal';

import { auth, onAuthStateChanged, signOut } from './firebase';
import { ANGELS, QUIZ_QUESTIONS, Angel } from './types';
import { User as FirebaseUser } from 'firebase/auth';
import { cn } from './lib/utils';

type AppState = 'landing' | 'quiz' | 'revelation' | 'results';

export default function App() {
  const [state, setState] = useState<AppState>('landing');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [selectedAngel, setSelectedAngel] = useState<Angel | null>(null);
  const [activeSidebarFeature, setActiveSidebarFeature] = useState<'meditation' | 'prayer' | 'calculator' | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  const handleStartQuiz = () => {
    setState('quiz');
    setCurrentQuestionIndex(0);
    setAnswers([]);
  };

  const handleAnswer = (trait: string) => {
    const newAnswers = [...answers, trait];
    setAnswers(newAnswers);

    if (currentQuestionIndex < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Calculate result
      const traitCounts: Record<string, number> = {};
      newAnswers.forEach(t => {
        traitCounts[t] = (traitCounts[t] || 0) + 1;
      });

      // Find angel that matches the most traits
      const bestAngel = ANGELS.reduce((prev, curr) => {
        const prevScore = prev.traits.filter(t => traitCounts[t]).length;
        const currScore = curr.traits.filter(t => traitCounts[t]).length;
        return currScore > prevScore ? curr : prev;
      });

      setSelectedAngel(bestAngel);
      setState('revelation');
    }
  };

  const handleEnterSanctuary = () => {
    setState('results');
    setActiveSidebarFeature(null); // Do not open features automatically
  };

  const userTraits = useMemo(() => {
    return Array.from(new Set(answers));
  }, [answers]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen relative overflow-x-hidden flex flex-col">
      <CelestialBackground 
        imageUrl={
          state === 'results' 
            ? "https://res.cloudinary.com/dxrnp3289/image/upload/v1775317577/ElevenLabs_image_topaz-image-upscale_2026-04-04T15_45_16_ui19ee.png" 
            : state === 'revelation'
            ? "https://res.cloudinary.com/dxrnp3289/image/upload/v1775319205/ElevenLabs_image_topaz-image-upscale_2026-04-04T16_12_04_rh40px.png"
            : undefined
        } 
      />

      <AnimatePresence mode="wait">
        {state === 'landing' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center flex-1 text-center px-4"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="mb-8"
            >
              <Sparkles className="text-yellow-500 w-16 h-16" />
            </motion.div>
            <h1 className="elegant-heading text-6xl md:text-8xl golden-text mb-6">
              Discover your guardian angel
            </h1>
            <p className="text-xl md:text-2xl golden-text max-w-2xl mb-12 italic font-serif">
              "Every soul is accompanied by an invisible guardian. Discover the divine presence that walks beside you."
            </p>
            <button
              onClick={handleStartQuiz}
              className="group relative px-12 py-5 bg-transparent overflow-hidden rounded-full border border-yellow-500/50 hover:border-yellow-500 transition-all duration-500"
            >
              <div className="absolute inset-0 bg-yellow-500/10 group-hover:bg-yellow-500/20 transition-colors" />
              <span className="relative z-10 text-yellow-500 font-medium tracking-widest uppercase flex items-center gap-3">
                Begin Your Journey <ChevronRight className="group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </motion.div>
        )}

        {state === 'quiz' && (
          <motion.div
            key="quiz"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-3xl mx-auto pt-24 px-4 pb-12 flex-1"
          >
            <div className="mb-12">
              <div className="flex justify-between items-center mb-4">
                <span className="text-yellow-500/60 text-sm uppercase tracking-widest">
                  Step {currentQuestionIndex + 1} of {QUIZ_QUESTIONS.length}
                </span>
                <div className="flex gap-1">
                  {QUIZ_QUESTIONS.map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-1 w-8 rounded-full transition-colors duration-500",
                        i <= currentQuestionIndex ? "bg-yellow-500" : "bg-white/10"
                      )}
                    />
                  ))}
                </div>
              </div>
              <h2 className="elegant-heading text-3xl md:text-4xl golden-text leading-tight">
                {QUIZ_QUESTIONS[currentQuestionIndex].text}
              </h2>
            </div>

            <div className="grid gap-4">
              {QUIZ_QUESTIONS[currentQuestionIndex].options.map((option, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => handleAnswer(option.trait)}
                  className="group relative p-6 text-left glowing-golden-border"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg text-slate-300 group-hover:text-white transition-colors">
                      {option.text}
                    </span>
                    <div className="w-6 h-6 rounded-full border border-white/20 group-hover:border-yellow-500 flex items-center justify-center transition-colors">
                      <div className="w-2 h-2 rounded-full bg-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {state === 'revelation' && selectedAngel && (
          <motion.div
            key="revelation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-start pt-20 md:pt-32 flex-1 text-center px-4 relative"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="relative mb-6"
            >
              {/* Outer Halo */}
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -inset-16 bg-yellow-500/20 rounded-full blur-[100px]"
              />

              <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-4 border-yellow-500/50 shadow-[0_0_100px_rgba(234,179,8,0.7)]">
                <img
                  src={selectedAngel.image}
                  alt={selectedAngel.name}
                  className="w-full h-full object-cover scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent" />
              </div>

              {/* Rotating Sacred Geometry */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-8 border-2 border-yellow-500/30 rounded-full border-dashed"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-12 border border-yellow-500/10 rounded-full"
              />
            </motion.div>

            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 1 }}
              className="relative z-20 pt-8 pb-2 w-full max-w-2xl mx-auto"
            >
              <div className="absolute inset-0 bg-radial-gradient from-slate-950/60 via-slate-950/20 to-transparent blur-2xl -z-10" />
              <h2 className="text-2xl text-yellow-500/70 uppercase tracking-[0.3em] mb-4 font-light drop-shadow-md">
                Your Guardian is Revealed
              </h2>
              <h1 className="elegant-heading text-6xl md:text-8xl golden-text mb-4 drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
                {selectedAngel.name}
              </h1>
              <p className="text-xl md:text-2xl text-slate-200 italic font-serif mb-6 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {selectedAngel.title}
              </p>
            </motion.div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
              onClick={handleEnterSanctuary}
              className="group relative px-12 py-5 bg-transparent overflow-hidden rounded-full border border-yellow-500/50 hover:border-yellow-500 transition-all duration-500"
            >
              <div className="absolute inset-0 bg-yellow-500/10 group-hover:bg-yellow-500/20 transition-colors" />
              <span className="relative z-10 text-yellow-500 font-medium tracking-widest uppercase flex items-center gap-3">
                Enter the Sanctuary <ChevronRight className="group-hover:translate-x-1 transition-transform" />
              </span>
            </motion.button>
          </motion.div>
        )}

        {state === 'results' && selectedAngel && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col relative"
          >
            {/* Floating Side Navigation Bar */}
            <aside className="fixed bottom-6 left-1/2 -translate-x-1/2 lg:translate-x-0 lg:left-8 lg:top-1/2 lg:-translate-y-1/2 lg:bottom-auto z-[110] glass-panel p-4 lg:py-8 flex flex-row lg:flex-col items-center gap-6 lg:gap-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-[2.5rem] border-yellow-500/20">
              <div className="hidden lg:block mb-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="text-yellow-500/40 w-8 h-8" />
                </motion.div>
              </div>
              
              <div className="flex flex-row lg:flex-col gap-6">
                <button
                  onClick={() => setActiveSidebarFeature(null)}
                  className={cn(
                    "p-4 rounded-2xl transition-all duration-500 celestial-icon-glow group relative",
                    !activeSidebarFeature ? "bg-yellow-500/20 active-icon-glow" : "text-slate-500 hover:text-yellow-400"
                  )}
                  title="Guardian Angel Profile"
                >
                  <User size={32} />
                  {!activeSidebarFeature && (
                    <motion.div
                      layoutId="active-nav"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 lg:w-1 lg:h-8 lg:-left-1 lg:top-1/2 lg:-translate-y-1/2 bg-yellow-500 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.8)]"
                    />
                  )}
                </button>

                <button
                  onClick={() => {
                    if (user) {
                      setActiveSidebarFeature(activeSidebarFeature === 'meditation' ? null : 'meditation');
                    } else {
                      setIsAuthModalOpen(true);
                    }
                  }}
                  className={cn(
                    "p-4 rounded-2xl transition-all duration-500 celestial-icon-glow group relative",
                    activeSidebarFeature === 'meditation' ? "bg-yellow-500/20 active-icon-glow" : "text-slate-500 hover:text-yellow-400"
                  )}
                >
                  <Wind size={32} />
                  {activeSidebarFeature === 'meditation' && (
                    <motion.div
                      layoutId="active-nav"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 lg:w-1 lg:h-8 lg:-left-1 lg:top-1/2 lg:-translate-y-1/2 bg-yellow-500 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.8)]"
                    />
                  )}
                </button>

                <button
                  onClick={() => setActiveSidebarFeature(activeSidebarFeature === 'prayer' ? null : 'prayer')}
                  className={cn(
                    "p-4 rounded-2xl transition-all duration-500 celestial-icon-glow group relative",
                    activeSidebarFeature === 'prayer' ? "bg-yellow-500/20 active-icon-glow" : "text-slate-500 hover:text-yellow-400"
                  )}
                  title="Wall of Light"
                >
                  <Sparkles size={32} />
                  {activeSidebarFeature === 'prayer' && (
                    <motion.div
                      layoutId="active-nav"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 lg:w-1 lg:h-8 lg:-left-1 lg:top-1/2 lg:-translate-y-1/2 bg-yellow-500 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.8)]"
                    />
                  )}
                </button>

                <button
                  onClick={() => setActiveSidebarFeature(activeSidebarFeature === 'calculator' ? null : 'calculator')}
                  className={cn(
                    "p-4 rounded-2xl transition-all duration-500 celestial-icon-glow group relative",
                    activeSidebarFeature === 'calculator' ? "bg-yellow-500/20 active-icon-glow" : "text-slate-500 hover:text-yellow-400"
                  )}
                  title="Angel Number Calculator"
                >
                  <div className="relative">
                    <Sparkles size={32} />
                    <span className="absolute -top-1 -right-1 text-[10px] font-bold bg-yellow-500 text-slate-950 px-1 rounded-sm">#</span>
                  </div>
                  {activeSidebarFeature === 'calculator' && (
                    <motion.div
                      layoutId="active-nav"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 lg:w-1 lg:h-8 lg:-left-1 lg:top-1/2 lg:-translate-y-1/2 bg-yellow-500 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.8)]"
                    />
                  )}
                </button>
              </div>

              <div className="lg:mt-auto flex flex-col items-center gap-6">
                {user ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 rounded-full border border-yellow-500/30 overflow-hidden shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full bg-yellow-500/20 flex items-center justify-center text-yellow-500 font-bold">
                          {user.displayName?.charAt(0) || user.email?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="p-3 text-slate-600 hover:text-red-400 transition-all duration-300 hover:scale-110"
                      title="Sign Out"
                    >
                      <LogOut size={20} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="p-4 text-slate-600 hover:text-yellow-500 transition-all duration-300 celestial-icon-glow"
                    title="Sign In"
                  >
                    <User size={28} />
                  </button>
                )}
              </div>
            </aside>

            {/* Full Screen Feature Panel */}
            <AnimatePresence>
              {activeSidebarFeature && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-2xl"
                >
                  {activeSidebarFeature === 'meditation' && (
                    <img 
                      src="https://res.cloudinary.com/dxrnp3289/image/upload/v1775317577/ElevenLabs_image_topaz-image-upscale_2026-04-04T15_45_16_ui19ee.png" 
                      alt="Meditation Background" 
                      className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  {activeSidebarFeature === 'prayer' ? (
                    <PrayerWall onClose={() => setActiveSidebarFeature(null)} />
                  ) : activeSidebarFeature === 'calculator' ? (
                    <AngelNumberCalculator onClose={() => setActiveSidebarFeature(null)} />
                  ) : (
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      transition={{ type: "spring", damping: 25, stiffness: 200 }}
                      className="max-w-4xl w-full relative"
                    >
                      <div className="relative z-10">
                        <div className="text-center mb-12">
                          <motion.div
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                          >
                            <h2 className="elegant-heading text-4xl md:text-6xl golden-text uppercase tracking-[0.2em] mb-4">
                              Inner Peace
                            </h2>
                            <div className="h-px w-32 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent mx-auto" />
                          </motion.div>
                        </div>

                        <motion.div
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.4 }}
                          className="celestial-glow-panel-interactive p-8 md:p-12"
                        >
                          <MeditationPlayer angelName={selectedAngel.name} />
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto h-screen scroll-smooth lg:pl-24 relative">
              {/* Angel Status Indicator (Absolute to top of page) */}
              <AnimatePresence>
                {!activeSidebarFeature && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="absolute top-8 right-8 z-[120] flex items-center gap-3 px-4 py-2 bg-slate-950/40 backdrop-blur-md border border-yellow-500/30 rounded-full shadow-[0_0_20px_rgba(234,179,8,0.2)]"
                  >
                    <div className="relative flex items-center justify-center">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                      <div className="absolute inset-0 w-2 h-2 bg-yellow-500 rounded-full animate-ping opacity-75" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-yellow-500/80">
                      Angel Status: <span className="text-white">Active</span>
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="max-w-full mx-auto px-6 py-12">
                <div className="flex flex-col gap-12 items-center">
                  {/* Angel Profile (Full Width Showcase) */}
                  <div className="w-full max-w-5xl">
                    <AngelProfile 
                      angel={selectedAngel} 
                      userTraits={userTraits} 
                    />
                  </div>
                  
                  {/* Daily Guidance & Sanctuary Features (Stacked) */}
                  <div className="w-full max-w-5xl space-y-12">
                    <DailyGuidance angelName={selectedAngel.name} />
                    
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="celestial-glow-panel p-8 md:p-12 space-y-6"
                    >
                      <div className="flex items-center gap-6">
                        <div className="p-4 bg-yellow-500/10 rounded-2xl">
                          <Sparkles className="text-yellow-500 w-8 h-8" />
                        </div>
                        <div>
                          <h3 className="elegant-heading text-3xl golden-text">Sanctuary Wisdom</h3>
                          <p className="text-slate-400">Explore the tools of the Divine Sanctuary</p>
                        </div>
                      </div>
                      
                      <div className="h-px w-full bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent" />
                      
                      <div className="space-y-4">
                        <p className="text-slate-400 text-lg leading-relaxed mb-6">
                          Explore the sanctuary tools in the navigation bar to deepen your journey:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="flex items-center gap-4 text-slate-300">
                            <div className="w-2 h-2 rounded-full bg-yellow-500" />
                            <span className="text-lg">Voice Guided Meditation</span>
                          </div>
                          <div className="flex items-center gap-4 text-slate-300">
                            <div className="w-2 h-2 rounded-full bg-yellow-500" />
                            <span className="text-lg">Wall of Light</span>
                          </div>
                          <div className="flex items-center gap-4 text-slate-300">
                            <div className="w-2 h-2 rounded-full bg-yellow-500" />
                            <span className="text-lg">Angel Number Calculator</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </main>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />

      {/* Footer */}
      <footer className="py-12 text-center text-white text-sm">
        <p>2026 Discover Your Guardian Angel-Guided By Divine Light</p>
      </footer>
    </div>
    </ErrorBoundary>
  );
}
