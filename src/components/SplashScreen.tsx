import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NLogoSquare } from "./NLogo";
import { useSplashPrefetch } from "@/hooks/use-splash-prefetch";
import { Database, RefreshCw, CheckCircle2, AlertCircle, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SplashScreenProps {
  onComplete?: () => void;
  duration?: number;
  countryCode?: string;
}

// Floating particle component with enhanced animation
function FloatingParticle({ delay, size, x, y }: { delay: number; size: number; x: number; y: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: [0, 0.8, 0],
        scale: [0.5, 1.2, 0.5],
        y: [y, y - 120, y - 240],
        x: [x, x + Math.sin(delay * 2) * 40, x + Math.sin(delay * 2) * 60],
      }}
      transition={{ 
        duration: 2.5,
        delay: delay * 0.1,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className="absolute rounded-full bg-primary/40"
      style={{ width: size, height: size, left: `${x}%`, top: `${y}%` }}
    />
  );
}

// Orbiting dot component
function OrbitingDot({ delay, radius, duration }: { delay: number; radius: number; duration: number }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration, repeat: Infinity, ease: "linear", delay }}
      className="absolute inset-0"
      style={{ width: radius * 2, height: radius * 2, left: `calc(50% - ${radius}px)`, top: `calc(50% - ${radius}px)` }}
    >
      <motion.div
        className="absolute w-2 h-2 rounded-full bg-primary/60"
        style={{ top: 0, left: '50%', transform: 'translateX(-50%)' }}
        animate={{ scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1, repeat: Infinity, delay }}
      />
    </motion.div>
  );
}

export function SplashScreen({ onComplete, duration = 1800, countryCode }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const { prefetch, status, progress, storiesCount } = useSplashPrefetch();
  const [prefetchComplete, setPrefetchComplete] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return true;
  });
  const [animationPhase, setAnimationPhase] = useState(0);

  // Toggle theme function
  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    
    if (newIsDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  // Animation phases
  useEffect(() => {
    const timers = [
      setTimeout(() => setAnimationPhase(1), 200),
      setTimeout(() => setAnimationPhase(2), 500),
      setTimeout(() => setAnimationPhase(3), 800),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // Start prefetch immediately when splash screen mounts
  useEffect(() => {
    const startPrefetch = async () => {
      try {
        await prefetch(countryCode);
        setPrefetchComplete(true);
      } catch (err) {
        console.error("Prefetch failed:", err);
        setPrefetchComplete(true);
      }
    };
    
    startPrefetch();
  }, [prefetch, countryCode]);

  // Complete splash screen after both prefetch and minimum duration
  useEffect(() => {
    const minDurationTimer = setTimeout(() => {
      if (prefetchComplete) {
        setIsVisible(false);
        onComplete?.();
      }
    }, duration);

    return () => clearTimeout(minDurationTimer);
  }, [duration, onComplete, prefetchComplete]);

  useEffect(() => {
    if (prefetchComplete) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, Math.max(0, duration - 500));
    }
  }, [prefetchComplete, duration, onComplete]);

  const getStatusText = () => {
    switch (status) {
      case "checking":
        return "Initializing...";
      case "cached":
        return `${storiesCount} stories ready`;
      case "fetching":
        return "Loading news...";
      case "complete":
        return `${storiesCount} stories ready`;
      case "error":
        return "Loading...";
      default:
        return "Starting...";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "checking":
      case "fetching":
        return <RefreshCw className="w-3 h-3 animate-spin" />;
      case "cached":
      case "complete":
        return <CheckCircle2 className="w-3 h-3 text-emerald-500" />;
      case "error":
        return <AlertCircle className="w-3 h-3 text-amber-500" />;
      default:
        return <Database className="w-3 h-3" />;
    }
  };

  // Generate particles
  const particles = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    delay: i * 0.12,
    size: Math.random() * 8 + 4,
    x: Math.random() * 100,
    y: Math.random() * 100 + 50,
  }));

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background overflow-hidden"
        >
          {/* Theme Toggle - Top Right */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="absolute top-4 right-4 z-20"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="relative overflow-hidden bg-background/50 backdrop-blur-sm border border-border/50 hover:bg-background/80"
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              <Sun className={`h-4 w-4 transition-all duration-300 ${isDark ? "rotate-90 scale-0" : "rotate-0 scale-100"}`} />
              <Moon className={`absolute h-4 w-4 transition-all duration-300 ${isDark ? "rotate-0 scale-100" : "-rotate-90 scale-0"}`} />
            </Button>
          </motion.div>

          {/* Animated Background */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Primary glow orb - larger and more prominent */}
            <motion.div
              animate={{ 
                scale: [1, 1.8, 1],
                opacity: [0.2, 0.35, 0.2],
                rotate: [0, 180, 360]
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-gradient-to-br from-primary/40 via-primary/15 to-transparent blur-3xl"
            />
            
            {/* Secondary glow orb */}
            <motion.div
              animate={{ 
                scale: [1.3, 1, 1.3],
                opacity: [0.15, 0.25, 0.15],
                rotate: [360, 180, 0]
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-1/3 left-1/3 w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-primary/25 via-violet-500/15 to-transparent blur-3xl"
            />

            {/* Accent glow - emerald */}
            <motion.div
              animate={{ 
                scale: [1, 1.4, 1],
                opacity: [0.08, 0.2, 0.08]
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute top-1/2 right-1/4 w-[450px] h-[450px] rounded-full bg-gradient-to-l from-emerald-500/20 to-transparent blur-3xl"
            />

            {/* Floating particles */}
            {particles.map((p) => (
              <FloatingParticle key={p.id} {...p} />
            ))}

            {/* Grid overlay */}
            <div 
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: `linear-gradient(hsl(var(--primary) / 0.15) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.15) 1px, transparent 1px)`,
                backgroundSize: '40px 40px'
              }}
            />
          </div>

          {/* Main Content */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 250, 
              damping: 20,
              delay: 0.05 
            }}
            className="relative z-10 flex flex-col items-center"
          >
            {/* Logo Container - Prominent N animation */}
            <div className="relative mb-6">
              {/* Orbiting dots */}
              <OrbitingDot delay={0} radius={80} duration={8} />
              <OrbitingDot delay={2} radius={90} duration={12} />
              <OrbitingDot delay={4} radius={100} duration={16} />

              {/* Rotating ring - dashed */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute w-36 h-36 sm:w-44 sm:h-44"
                style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
              >
                <div className="w-full h-full rounded-full border-2 border-dashed border-primary/30" />
              </motion.div>

              {/* Counter-rotating ring - dotted */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute w-40 h-40 sm:w-48 sm:h-48"
                style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
              >
                <div className="w-full h-full rounded-full border border-dotted border-primary/20" />
              </motion.div>
              
              {/* N Logo - Large and prominent with enhanced animation */}
              <motion.div
                initial={{ scale: 0.3, opacity: 0, rotateY: -180 }}
                animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                transition={{ 
                  type: "spring",
                  stiffness: 180,
                  damping: 15,
                  delay: 0.15
                }}
                className="relative w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center"
              >
                {/* Background glow for the N - pulsing */}
                <motion.div 
                  animate={{ 
                    boxShadow: [
                      '0 0 50px hsl(var(--primary) / 0.4)',
                      '0 0 100px hsl(var(--primary) / 0.6)',
                      '0 0 50px hsl(var(--primary) / 0.4)'
                    ],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute inset-4 bg-primary/15 rounded-3xl blur-xl" 
                />
                
                {/* The N Logo with glow effect */}
                <motion.div 
                  className="relative z-10 text-foreground"
                  animate={{ 
                    filter: [
                      'drop-shadow(0 0 15px hsl(var(--primary) / 0.4))',
                      'drop-shadow(0 0 30px hsl(var(--primary) / 0.6))',
                      'drop-shadow(0 0 15px hsl(var(--primary) / 0.4))'
                    ]
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <NLogoSquare size={130} animate themeAware />
                </motion.div>
              </motion.div>
              
              {/* Glow Ring 1 - Pulsing outward */}
              <motion.div
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.6, 0, 0.6]
                }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="absolute inset-0 rounded-3xl border-2 border-primary/60"
              />
              
              {/* Glow Ring 2 - Offset timing */}
              <motion.div
                animate={{ 
                  scale: [1, 1.7, 1],
                  opacity: [0.4, 0, 0.4]
                }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                className="absolute inset-0 rounded-3xl border border-primary/40"
              />
              
              {/* Glow Ring 3 - Furthest */}
              <motion.div
                animate={{ 
                  scale: [1, 1.9, 1],
                  opacity: [0.2, 0, 0.2]
                }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0.8 }}
                className="absolute inset-0 rounded-3xl border border-primary/20"
              />
            </div>

            {/* Wordmark with gradient - staggered animation */}
            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="text-4xl sm:text-5xl font-bold font-display mb-2"
            >
              <motion.span 
                className="inline-block bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.3 }}
              >
                NEW
              </motion.span>
              <motion.span 
                className="inline-block bg-gradient-to-r from-primary via-primary to-primary/80 bg-clip-text text-transparent"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: 0.3 }}
              >
                STACK
              </motion.span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="text-sm sm:text-base text-muted-foreground mb-3"
            >
              Global News Intelligence
            </motion.p>

            {/* Prefetch Status */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: animationPhase >= 2 ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2 text-xs text-muted-foreground mb-3"
            >
              {getStatusIcon()}
              <span>{getStatusText()}</span>
            </motion.div>

            {/* Loading Animation - Enhanced wave bars */}
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: animationPhase >= 1 ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex gap-1.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      scaleY: [1, 3, 1],
                      backgroundColor: ['hsl(var(--primary))', 'hsl(var(--primary) / 0.5)', 'hsl(var(--primary))']
                    }}
                    transition={{ 
                      duration: 0.5, 
                      repeat: Infinity, 
                      delay: i * 0.08,
                      ease: "easeInOut"
                    }}
                    className="w-1.5 h-6 rounded-full bg-primary origin-center"
                  />
                ))}
              </div>
            </motion.div>

            {/* Progress Bar - Enhanced with glow */}
            <motion.div 
              className="relative w-52 sm:w-64 h-1.5 bg-muted rounded-full mt-5 overflow-hidden"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: '100%' }}
              transition={{ delay: 0.8, duration: 0.3 }}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-primary via-primary/90 to-primary rounded-full relative"
                initial={{ width: "0%" }}
                animate={{ width: `${Math.max(progress, 15)}%` }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                />
              </motion.div>
              
              {/* Glow under progress bar */}
              <motion.div
                className="absolute -bottom-2 left-0 h-4 bg-primary/30 blur-md rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: `${Math.max(progress, 15)}%` }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              />
            </motion.div>

            {/* Powered By */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: animationPhase >= 3 ? 1 : 0, y: animationPhase >= 3 ? 0 : 15 }}
              transition={{ duration: 0.4 }}
              className="mt-8 sm:mt-10 text-center"
            >
              <p className="text-[10px] sm:text-xs text-muted-foreground/50 uppercase tracking-wider mb-1">
                Powered by
              </p>
              <motion.p 
                className="text-xs sm:text-sm font-semibold text-foreground/60"
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                CROPXON INNOVATIONS
              </motion.p>
            </motion.div>
          </motion.div>

          {/* Bottom decoration lines */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 0.4, scaleX: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent"
          />
          
          {/* Top decoration line */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 0.3, scaleX: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook to manage splash screen state - NO CACHING
export function useSplashScreen() {
  const [showSplash, setShowSplash] = useState(true);

  // Always show splash on mount - no caching
  useEffect(() => {
    setShowSplash(true);
  }, []);

  const hideSplash = () => setShowSplash(false);
  const triggerSplash = () => setShowSplash(true);

  return { showSplash, hideSplash, triggerSplash };
}