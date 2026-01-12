import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NLogoSquare } from "./NLogo";
import { useSplashPrefetch } from "@/hooks/use-splash-prefetch";
import { Database, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

interface SplashScreenProps {
  onComplete?: () => void;
  duration?: number;
  countryCode?: string;
}

export function SplashScreen({ onComplete, duration = 2200, countryCode }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const { prefetch, status, progress, storiesCount } = useSplashPrefetch();
  const [prefetchComplete, setPrefetchComplete] = useState(false);

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

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background"
        >
          {/* Animated Background */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.1, 0.2, 0.1]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/20 blur-3xl"
            />
            <motion.div
              animate={{ 
                scale: [1.2, 1, 1.2],
                opacity: [0.08, 0.15, 0.08]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] rounded-full bg-primary/15 blur-3xl"
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
            {/* Logo Container - No spinning, just stack animation */}
            <div className="relative mb-6">
              {/* N Logo - Animated stacks forming the complete N */}
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ 
                  type: "spring",
                  stiffness: 300,
                  damping: 15,
                  delay: 0.1
                }}
                className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center text-foreground"
              >
                <NLogoSquare size={80} animate />
              </motion.div>
              
              {/* Glow Ring */}
              <motion.div
                animate={{ 
                  scale: [1, 1.4, 1],
                  opacity: [0.5, 0, 0.5]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 rounded-2xl sm:rounded-3xl border-2 border-primary/50"
              />
              
              {/* Outer Glow */}
              <motion.div
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-primary/20 blur-xl -z-10 scale-150"
              />
            </div>

            {/* Wordmark */}
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-3xl sm:text-4xl font-bold font-display bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent mb-2"
            >
              NEWSTACK
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

            {/* Loading Animation */}
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      scaleY: [1, 2.5, 1],
                    }}
                    transition={{ 
                      duration: 0.6, 
                      repeat: Infinity, 
                      delay: i * 0.1,
                      ease: "easeInOut"
                    }}
                    className="w-1 h-4 rounded-full bg-primary"
                  />
                ))}
              </div>
            </motion.div>

            {/* Progress Bar - Combined */}
            <motion.div 
              className="w-48 sm:w-56 h-1.5 bg-muted rounded-full mt-6 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: `${Math.max(progress, (Date.now() % 100))}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </motion.div>

            {/* Powered By */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="mt-10 sm:mt-12 text-center"
            >
              <p className="text-[10px] sm:text-xs text-muted-foreground/60 uppercase tracking-wider mb-1">
                Powered by
              </p>
              <p className="text-xs sm:text-sm font-semibold text-foreground/60">
                CROPXON INNOVATIONS PVT LTD
              </p>
            </motion.div>
          </motion.div>
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
