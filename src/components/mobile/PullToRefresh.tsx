import { useState, useRef, useCallback, ReactNode } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
}

export function PullToRefresh({ children, onRefresh, className = "" }: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useMotionValue(0);
  const pullDistance = useRef(0);
  
  const THRESHOLD = 120;
  const MAX_PULL = 150;

  const opacity = useTransform(currentY, [0, THRESHOLD], [0, 1]);
  const scale = useTransform(currentY, [0, THRESHOLD], [0.5, 1]);
  const rotate = useTransform(currentY, [0, THRESHOLD], [0, 360]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isRefreshing) return;
    const scrollTop = containerRef.current?.scrollTop || 0;
    if (scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
    }
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isRefreshing) return;
    const scrollTop = containerRef.current?.scrollTop || 0;
    if (scrollTop > 0) return;

    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) {
      pullDistance.current = Math.min(delta * 0.5, MAX_PULL);
      currentY.set(pullDistance.current);
    }
  }, [isRefreshing, currentY]);

  const handleTouchEnd = useCallback(async () => {
    if (isRefreshing) return;

    if (pullDistance.current >= THRESHOLD) {
      setIsRefreshing(true);
      setShowSplash(true);
      
      // Keep splash visible for at least 1.5 seconds
      const minSplashTime = new Promise(resolve => setTimeout(resolve, 1500));
      
      try {
        await Promise.all([onRefresh(), minSplashTime]);
      } finally {
        setShowSplash(false);
        setTimeout(() => {
          setIsRefreshing(false);
        }, 300);
      }
    }

    pullDistance.current = 0;
    currentY.set(0);
  }, [isRefreshing, onRefresh, currentY]);

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
          className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center"
        >
          <RefreshCw className="w-5 h-5 text-primary" />
        </motion.div>
        <motion.p 
          className="text-xs text-muted-foreground mt-2"
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
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
          >
            {/* Logo Animation */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 200, 
                damping: 15,
                duration: 0.6 
              }}
              className="flex flex-col items-center"
            >
              {/* Animated Logo */}
              <motion.div
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.1, 1],
                }}
                transition={{ 
                  rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                  scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
                }}
                className="relative mb-6"
              >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                  <span className="text-3xl font-bold text-primary-foreground font-display">N</span>
                </div>
                {/* Glow effect */}
                <motion.div
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute inset-0 rounded-2xl bg-primary/30 blur-xl -z-10"
                />
              </motion.div>

              {/* Text */}
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold font-display gradient-text mb-2"
              >
                NEWSTACK
              </motion.h1>

              {/* Loading dots */}
              <motion.div className="flex gap-1.5 mt-4">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      y: [0, -8, 0],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{ 
                      duration: 0.6, 
                      repeat: Infinity, 
                      delay: i * 0.15 
                    }}
                    className="w-2 h-2 rounded-full bg-primary"
                  />
                ))}
              </motion.div>

              {/* Powered by text */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-xs text-muted-foreground mt-8"
              >
                Powered by
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-sm font-semibold text-foreground/70"
              >
                CROPXON INNOVATIONS PVT LTD
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <motion.div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ y: currentY }}
        className="h-full overflow-y-auto"
      >
        {children}
      </motion.div>
    </div>
  );
}
