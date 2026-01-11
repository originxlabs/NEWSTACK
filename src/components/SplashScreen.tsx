import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NLogoSquare } from "./NLogo";

interface SplashScreenProps {
  onComplete?: () => void;
  duration?: number;
}

export function SplashScreen({ onComplete, duration = 1800 }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

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
              className="text-sm sm:text-base text-muted-foreground mb-6"
            >
              Global News Intelligence
            </motion.p>

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

            {/* Progress Bar */}
            <motion.div 
              className="w-48 sm:w-56 h-1 bg-muted rounded-full mt-6 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: duration / 1000 - 0.3, ease: "easeInOut" }}
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
