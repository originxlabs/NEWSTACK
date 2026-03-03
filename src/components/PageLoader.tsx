import { motion, AnimatePresence } from "framer-motion";
import { NLogoSquare } from "./NLogo";

interface PageLoaderProps {
  isLoading: boolean;
  message?: string;
}

export function PageLoader({ isLoading, message = "Loading..." }: PageLoaderProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9998] flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm"
        >
          {/* Background Glow */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.1, 0.2, 0.1]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-primary/20 blur-3xl"
            />
          </div>

          {/* N Logo Animation */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 20 
            }}
            className="relative z-10"
          >
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
              {/* Background glow for the N */}
              <div className="absolute inset-0 bg-primary/10 rounded-2xl blur-xl" />
              
              {/* The N Logo */}
              <div className="relative z-10 text-foreground">
                <NLogoSquare size={80} animate themeAware />
              </div>

              {/* Glow Ring */}
              <motion.div
                animate={{ 
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 0, 0.5]
                }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="absolute inset-0 rounded-2xl border-2 border-primary/50"
              />
            </div>

            {/* Loading Text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-4 text-sm text-muted-foreground text-center"
            >
              {message}
            </motion.p>

            {/* Loading Dots */}
            <div className="flex items-center justify-center gap-1 mt-3">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{ 
                    duration: 0.8, 
                    repeat: Infinity, 
                    delay: i * 0.15,
                    ease: "easeInOut"
                  }}
                  className="w-1.5 h-1.5 rounded-full bg-primary"
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook to track navigation loading state
import { useState, useEffect, useTransition } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export function useNavigationLoader() {
  const [isNavigating, setIsNavigating] = useState(false);
  const [isPending, startTransition] = useTransition();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Reset loading state when location changes
    setIsNavigating(false);
  }, [location.pathname]);

  const navigateWithLoader = (to: string, options?: { replace?: boolean }) => {
    setIsNavigating(true);
    startTransition(() => {
      navigate(to, options);
    });
  };

  return {
    isNavigating: isNavigating || isPending,
    navigateWithLoader,
    setIsNavigating,
  };
}
