import { useState, useRef, useCallback, ReactNode } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
  disabled?: boolean;
}

export function PullToRefresh({ children, onRefresh, className = "", disabled = false }: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useMotionValue(0);
  const pullDistance = useRef(0);
  const isAtTop = useRef(true);
  
  const THRESHOLD = 100;
  const MAX_PULL = 130;

  const opacity = useTransform(currentY, [0, THRESHOLD], [0, 1]);
  const scale = useTransform(currentY, [0, THRESHOLD], [0.5, 1]);
  const rotate = useTransform(currentY, [0, THRESHOLD], [0, 360]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isRefreshing || disabled) return;
    // Only allow pull refresh if we're at the very top
    isAtTop.current = true;
    startY.current = e.touches[0].clientY;
    pullDistance.current = 0;
  }, [isRefreshing, disabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isRefreshing || disabled || !isAtTop.current) return;

    const delta = e.touches[0].clientY - startY.current;
    
    // Only activate pull-to-refresh for significant downward swipes from the top
    if (delta > 0 && delta > 20) {
      pullDistance.current = Math.min(delta * 0.4, MAX_PULL);
      currentY.set(pullDistance.current);
      
      // Prevent default to stop scroll
      if (pullDistance.current > 10) {
        e.preventDefault();
      }
    }
  }, [isRefreshing, disabled, currentY]);

  const handleTouchEnd = useCallback(async () => {
    if (isRefreshing || disabled) return;

    if (pullDistance.current >= THRESHOLD) {
      setIsRefreshing(true);
      setShowSplash(true);
      
      // Keep splash visible for at least 1.2 seconds
      const minSplashTime = new Promise(resolve => setTimeout(resolve, 1200));
      
      try {
        await Promise.all([onRefresh(), minSplashTime]);
      } finally {
        setShowSplash(false);
        setTimeout(() => {
          setIsRefreshing(false);
        }, 200);
      }
    }

    pullDistance.current = 0;
    currentY.set(0);
  }, [isRefreshing, disabled, onRefresh, currentY]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Pull indicator */}
      <motion.div 
        className="absolute top-0 left-0 right-0 flex flex-col items-center justify-center z-50 pointer-events-none"
        style={{ 
          height: currentY,
          opacity,
        }}
      >
        <motion.div
          style={{ scale, rotate }}
          className="w-12 h-12 rounded-full bg-primary/20 backdrop-blur-sm flex items-center justify-center shadow-lg border border-primary/30"
        >
          <RefreshCw className="w-6 h-6 text-primary" />
        </motion.div>
        <motion.p 
          className="text-xs text-foreground/70 mt-2 font-medium"
          style={{ opacity }}
        >
          {pullDistance.current >= THRESHOLD ? "Release to refresh" : "Pull to refresh"}
        </motion.p>
      </motion.div>

      {/* Splash Screen */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/5"
          >
            {/* Background glow */}
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute w-64 h-64 rounded-full bg-primary/20 blur-3xl"
            />

            {/* Logo Animation */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 250, 
                damping: 15,
              }}
              className="flex flex-col items-center relative z-10"
            >
              {/* Animated Logo */}
              <motion.div
                animate={{ 
                  rotateY: [0, 360],
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity, 
                  ease: "easeInOut"
                }}
                className="relative mb-5"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-xl shadow-primary/30">
                  <span className="text-2xl font-bold text-primary-foreground font-display">N</span>
                </div>
                {/* Pulse ring */}
                <motion.div
                  animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="absolute inset-0 rounded-2xl border-2 border-primary"
                />
              </motion.div>

              {/* Text */}
              <motion.h1
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-xl font-bold font-display text-foreground mb-1"
              >
                NEWSTACK
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-xs text-muted-foreground mb-4"
              >
                Refreshing stories...
              </motion.p>

              {/* Loading animation */}
              <motion.div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{ 
                      duration: 0.6, 
                      repeat: Infinity, 
                      delay: i * 0.12 
                    }}
                    className="w-2 h-2 rounded-full bg-primary"
                  />
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content - pass through touch events when not pulling */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="h-full"
      >
        <motion.div
          style={{ y: currentY }}
          className="h-full"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}