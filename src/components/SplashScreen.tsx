import { useState, useEffect, useCallback } from "react";
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

// Floating particle component
function FloatingParticle({ delay, size, x, y }: { delay: number; size: number; x: number; y: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: [0, 0.6, 0],
        scale: [0.5, 1, 0.5],
        y: [y, y - 100, y - 200],
        x: [x, x + Math.sin(delay) * 30, x + Math.sin(delay) * 50],
      }}
      transition={{ 
        duration: 3,
        delay,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className="absolute rounded-full bg-primary/30"
      style={{ width: size, height: size, left: `${x}%`, top: `${y}%` }}
    />
  );
}

export function SplashScreen({ onComplete, duration = 2200, countryCode }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const { prefetch, status, progress, storiesCount } = useSplashPrefetch();
  const [prefetchComplete, setPrefetchComplete] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return true;
  });

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

  // Start prefetch immediately when splash screen mounts
  useEffect(() => {
    const startPrefetch = async () => {
      try {
        await prefetch(countryCode);
        setPrefetchComplete(true);
      } catch (err) {
        console.error("Prefetch failed:", err);
        setPrefetchComplete(true); // Continue even if prefetch fails
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

  // If prefetch completes before min duration, wait for timer
  // If min duration completes before prefetch, wait for prefetch
  useEffect(() => {
    if (prefetchComplete) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, Math.max(0, duration - 1800)); // Give some buffer time
    }
  }, [prefetchComplete, duration, onComplete]);

  const getStatusText = () => {
    switch (status) {
      case "checking":
        return "Checking cache...";
      case "cached":
        return `Loaded ${storiesCount} stories from cache`;
      case "fetching":
        return "Fetching latest news...";
      case "complete":
        return `${storiesCount} stories ready`;
      case "error":
        return "Loading from cache...";
      default:
        return "Initializing...";
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
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    delay: i * 0.15,
    size: Math.random() * 6 + 3,
    x: Math.random() * 100,
    y: Math.random() * 100 + 50,
  }));

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
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

          {/* Animated Background with Gradient Orbs */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Primary glow orb */}
            <motion.div
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.15, 0.25, 0.15],
                rotate: [0, 180, 360]
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-primary/30 via-primary/10 to-transparent blur-3xl"
            />
            
            {/* Secondary glow orb */}
            <motion.div
              animate={{ 
                scale: [1.2, 1, 1.2],
                opacity: [0.1, 0.2, 0.1],
                rotate: [360, 180, 0]
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-1/4 left-1/3 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-primary/20 via-violet-500/10 to-transparent blur-3xl"
            />

            {/* Accent glow */}
            <motion.div
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.05, 0.15, 0.05]
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute top-1/2 right-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-l from-emerald-500/15 to-transparent blur-3xl"
            />

            {/* Floating particles */}
            {particles.map((p) => (
              <FloatingParticle key={p.id} {...p} />
            ))}

            {/* Grid overlay */}
            <div 
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `linear-gradient(rgba(var(--primary) / 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--primary) / 0.1) 1px, transparent 1px)`,
                backgroundSize: '50px 50px'
              }}
            />
          </div>

          {/* Main Content */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 20,
              delay: 0.1 
            }}
            className="relative z-10 flex flex-col items-center"
          >
            {/* Logo Container - Prominent N animation */}
            <div className="relative mb-8">
              {/* Rotating ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 w-32 h-32 sm:w-40 sm:h-40 mx-auto"
                style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
              >
                <div className="w-full h-full rounded-full border border-dashed border-primary/20" />
              </motion.div>

              {/* Counter-rotating ring */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 w-36 h-36 sm:w-44 sm:h-44 mx-auto"
                style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
              >
                <div className="w-full h-full rounded-full border border-dotted border-primary/10" />
              </motion.div>
              
              {/* N Logo - Large and prominent with animated stacks */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0, rotateY: -90 }}
                animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                transition={{ 
                  type: "spring",
                  stiffness: 200,
                  damping: 12,
                  delay: 0.2
                }}
                className="relative w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center"
              >
                {/* Background glow for the N */}
                <motion.div 
                  animate={{ 
                    boxShadow: [
                      '0 0 40px rgba(var(--primary) / 0.3)',
                      '0 0 80px rgba(var(--primary) / 0.5)',
                      '0 0 40px rgba(var(--primary) / 0.3)'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-primary/10 rounded-3xl blur-xl" 
                />
                
                {/* The N Logo */}
                <motion.div 
                  className="relative z-10 text-foreground"
                  animate={{ 
                    filter: [
                      'drop-shadow(0 0 10px rgba(var(--primary) / 0.3))',
                      'drop-shadow(0 0 20px rgba(var(--primary) / 0.5))',
                      'drop-shadow(0 0 10px rgba(var(--primary) / 0.3))'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <NLogoSquare size={120} animate themeAware />
                </motion.div>
              </motion.div>
              
              {/* Glow Ring - Pulsing */}
              <motion.div
                animate={{ 
                  scale: [1, 1.4, 1],
                  opacity: [0.5, 0, 0.5]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 rounded-2xl sm:rounded-3xl border-2 border-primary/50"
              />
              
              {/* Second Glow Ring - Offset timing */}
              <motion.div
                animate={{ 
                  scale: [1, 1.6, 1],
                  opacity: [0.3, 0, 0.3]
                }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                className="absolute inset-0 rounded-2xl sm:rounded-3xl border border-primary/30"
              />
              
              {/* Outer Glow */}
              <motion.div
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-primary/20 blur-xl -z-10 scale-150"
              />
            </div>

            {/* Wordmark with gradient */}
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-3xl sm:text-4xl font-bold font-display mb-2"
            >
              <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                NEW
              </span>
              <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                STACK
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-sm sm:text-base text-muted-foreground mb-4"
            >
              Global News Intelligence
            </motion.p>

            {/* Prefetch Status */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65 }}
              className="flex items-center gap-2 text-xs text-muted-foreground mb-4"
            >
              {getStatusIcon()}
              <span>{getStatusText()}</span>
            </motion.div>

            {/* Loading Animation - Enhanced bars */}
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <div className="flex gap-1.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      scaleY: [1, 2.5, 1],
                      backgroundColor: ['hsl(var(--primary))', 'hsl(var(--primary) / 0.6)', 'hsl(var(--primary))']
                    }}
                    transition={{ 
                      duration: 0.6, 
                      repeat: Infinity, 
                      delay: i * 0.1,
                      ease: "easeInOut"
                    }}
                    className="w-1.5 h-5 rounded-full bg-primary"
                  />
                ))}
              </div>
            </motion.div>

            {/* Progress Bar - Enhanced with glow */}
            <motion.div 
              className="relative w-48 sm:w-56 h-1.5 bg-muted rounded-full mt-6 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary rounded-full relative"
                initial={{ width: "0%" }}
                animate={{ width: `${Math.max(progress, (Date.now() % 100))}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />
              </motion.div>
            </motion.div>

            {/* Powered By - Enhanced */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="mt-10 sm:mt-12 text-center"
            >
              <p className="text-[10px] sm:text-xs text-muted-foreground/60 uppercase tracking-wider mb-1">
                Powered by
              </p>
              <motion.p 
                className="text-xs sm:text-sm font-semibold text-foreground/70"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                CROPXON INNOVATIONS PVT LTD
              </motion.p>
            </motion.div>
          </motion.div>

          {/* Bottom decoration lines */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ delay: 1 }}
            className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook to manage splash screen state
export function useSplashScreen() {
  const [showSplash, setShowSplash] = useState(true);
  const [hasShownOnce, setHasShownOnce] = useState(false);

  useEffect(() => {
    // Check if this is a fresh page load
    const isPageRefresh = !sessionStorage.getItem("newstack_navigated");
    
    if (isPageRefresh) {
      setShowSplash(true);
      sessionStorage.setItem("newstack_navigated", "true");
    } else {
      setShowSplash(false);
    }
    
    setHasShownOnce(true);
  }, []);

  const hideSplash = () => setShowSplash(false);
  const triggerSplash = () => setShowSplash(true);

  return { showSplash, hideSplash, triggerSplash, hasShownOnce };
}