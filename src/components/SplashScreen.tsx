import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSplashPrefetch } from "@/hooks/use-splash-prefetch";
import { Database, RefreshCw, CheckCircle2, AlertCircle, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SplashScreenProps {
  onComplete?: () => void;
  duration?: number;
  countryCode?: string;
}

// Single animated N Logo - the only logo animation used
function AnimatedNLogo({ size = 120, onAnimationComplete }: { size?: number; onAnimationComplete?: () => void }) {
  // The 7 paths representing the N-style stacked logo
  const paths = [
    // Middle center bar (the main horizontal connector)
    { d: "M547.000000,338.976440 C531.335510,338.966034 516.168518,338.789490 501.007477,339.011597 C493.135956,339.126892 487.312561,336.257080 482.807465,329.759766 C479.034668,324.318512 474.605591,319.332275 469.194611,314.374878 C469.194611,319.730164 469.234467,325.085846 469.184509,330.440674 C469.122162,337.125641 467.588348,338.813934 460.964844,338.860260 C443.967926,338.979156 426.969788,339.020111 409.972626,338.958466 C403.014404,338.933228 401.681305,337.393311 401.665985,330.255615 C401.647003,321.423523 401.659882,312.591370 401.660400,303.759247 C401.661041,292.979919 402.623016,292.003632 413.230652,292.007812 C438.727112,292.017914 464.223541,292.033997 489.720001,292.036682 C530.880981,292.041016 572.041931,292.035950 613.202881,292.036194 C623.578003,292.036255 625.050415,293.523560 625.032227,303.871338 C625.017639,312.203461 625.080383,320.535950 625.024841,328.867706 C624.970154,337.070465 623.148438,338.902832 614.991272,338.919312 C592.494263,338.964752 569.997070,338.960327 547.000000,338.976440 z", delay: 0 },
    // Top left block with diagonal
    { d: "M517.394409,277.307831 C481.473724,277.308350 445.981293,277.312775 410.488831,277.304474 C402.596893,277.302612 401.683624,276.362793 401.666626,268.306030 C401.648010,259.474609 401.617126,250.642960 401.661133,241.811752 C401.705811,232.841217 406.345184,227.281906 415.134583,227.144699 C434.790588,226.837845 454.457642,226.920853 474.115204,227.199493 C481.651337,227.306320 487.582886,230.809418 492.204041,237.133942 C500.948090,249.101044 510.211273,260.688110 519.198608,272.478882 C520.744202,274.506561 523.572754,277.217041 517.394409,277.307831 z", delay: 0.1 },
    // Top right block with diagonal
    { d: "M613.884949,277.300903 C606.246277,277.299164 599.089844,277.319977 591.933716,277.286774 C586.424927,277.261200 582.237000,275.094788 578.815674,270.514740 C569.555847,258.118958 559.912476,246.010193 550.474487,233.746582 C547.257080,229.565887 547.970154,227.578049 553.362915,227.277542 C561.327087,226.833771 569.328674,227.032959 577.314453,227.013367 C588.464905,226.985992 599.615723,226.962799 610.765930,227.024734 C620.843933,227.080704 625.096008,231.367065 625.096436,241.301819 C625.096863,249.789474 625.097473,258.277161 625.072021,266.764771 C625.043884,276.139069 623.886719,277.264740 613.884949,277.300903 z", delay: 0.2 },
    // Middle left block
    { d: "M401.659119,363.141418 C401.742218,354.497833 402.521606,353.679688 410.434021,353.672791 C427.080078,353.658234 443.726196,353.651184 460.372223,353.671906 C467.877075,353.681274 469.229950,354.995667 469.251556,362.299164 C469.280151,371.953735 469.309601,381.609100 469.219208,391.263000 C469.166473,396.894623 467.302032,398.887817 461.732086,398.916687 C444.254730,399.007294 426.776062,399.012421 409.298981,398.895142 C403.145996,398.853821 401.691650,397.194916 401.667816,391.088226 C401.632111,381.933014 401.658966,372.777588 401.659119,363.141418 z", delay: 0.3 },
    // Middle right block with diagonal
    { d: "M613.885010,353.666199 C623.783936,353.697998 625.002441,354.892578 625.029419,364.270416 C625.053772,372.761688 625.118225,381.254089 625.011475,389.744049 C624.923462,396.742310 622.944580,398.852997 616.126465,398.880402 C592.983887,398.973450 569.840820,398.961334 546.698059,398.913788 C541.506836,398.903107 536.842285,397.386688 533.451721,393.116364 C524.136963,381.384827 514.816162,369.658051 505.524109,357.908539 C504.828705,357.029236 503.981201,356.111664 504.746063,353.666565 C540.733032,353.666565 577.068298,353.666565 613.885010,353.666199 z", delay: 0.4 },
    // Bottom left block
    { d: "M412.103790,413.639404 C428.733215,413.649506 444.878143,413.643372 461.022980,413.679810 C467.812500,413.695129 469.219971,415.112457 469.241150,421.882874 C469.270264,431.203552 469.290588,440.524567 469.238770,449.845062 C469.201630,456.529510 467.534546,458.263336 461.076874,458.277802 C443.766968,458.316620 426.456818,458.315399 409.146912,458.276642 C403.264252,458.263458 401.730316,456.746826 401.688263,450.904846 C401.622375,441.750977 401.660767,432.596313 401.663727,423.441986 C401.666718,414.125946 402.113953,413.690216 412.103790,413.639404 z", delay: 0.5 },
    // Bottom right block with diagonal
    { d: "M618.579102,458.278625 C609.472595,458.291565 600.824951,458.267303 592.177551,458.298889 C586.794067,458.318542 582.764343,456.139618 579.465393,451.781464 C571.538635,441.309723 563.317139,431.061157 555.223694,420.715424 C553.821838,418.923431 552.109863,417.290863 551.768860,414.955322 C553.183655,413.164124 554.982239,413.692749 556.536743,413.689606 C576.825073,413.648651 597.113708,413.645996 617.402039,413.694336 C622.888916,413.707397 624.974976,415.661835 625.051758,421.183868 C625.188049,430.993500 625.136719,440.806793 625.059570,450.617767 C625.028137,454.619354 623.813843,457.898468 618.579102,458.278625 z", delay: 0.6 }
  ];

  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="relative"
    >
      {/* Pulsing glow behind the logo */}
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 bg-primary/20 rounded-3xl blur-3xl"
        style={{ width: size * 1.5, height: size * 1.5, left: -size * 0.25, top: -size * 0.25 }}
      />

      {/* The SVG N Logo with staggered block animations */}
      <svg
        viewBox="300 150 450 400"
        width={size}
        height={size}
        className="relative z-10"
        preserveAspectRatio="xMidYMid meet"
      >
        {paths.map((path, idx) => (
          <motion.path
            key={idx}
            d={path.d}
            fill="currentColor"
            initial={{ 
              opacity: 0, 
              scale: 0.5,
              y: idx < 3 ? -30 : idx > 4 ? 30 : 0,
              x: idx % 2 === 0 ? -20 : 20
            }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              y: 0,
              x: 0
            }}
            transition={{
              delay: path.delay,
              duration: 0.5,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
            onAnimationComplete={idx === paths.length - 1 ? onAnimationComplete : undefined}
          />
        ))}
      </svg>

      {/* Subtle shimmer overlay */}
      <motion.div
        className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1, ease: "easeInOut" }}
        />
      </motion.div>
    </motion.div>
  );
}

// Animated letter component for wordmark
function AnimatedLetter({ 
  letter, 
  delay, 
  isPrimary = false 
}: { 
  letter: string; 
  delay: number; 
  isPrimary?: boolean;
}) {
  return (
    <motion.span
      initial={{ 
        opacity: 0, 
        y: 30,
        rotateX: -90,
        scale: 0.5
      }}
      animate={{ 
        opacity: 1, 
        y: 0,
        rotateX: 0,
        scale: 1
      }}
      transition={{
        delay,
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      className={cn(
        "inline-block",
        isPrimary ? "text-primary" : "text-foreground"
      )}
      style={{ transformOrigin: "bottom center" }}
    >
      {letter}
    </motion.span>
  );
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
      }}
      transition={{ 
        duration: 3,
        delay: delay * 0.15,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className="absolute rounded-full bg-primary/30"
      style={{ width: size, height: size, left: `${x}%`, top: `${y}%` }}
    />
  );
}

export function SplashScreen({ onComplete, duration = 2500, countryCode }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const { prefetch, status, progress, storiesCount } = useSplashPrefetch();
  const [prefetchComplete, setPrefetchComplete] = useState(false);
  const [logoAnimationComplete, setLogoAnimationComplete] = useState(false);
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
      }, Math.max(0, duration - 300));
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
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    delay: i * 0.2,
    size: Math.random() * 6 + 3,
    x: Math.random() * 100,
    y: Math.random() * 50 + 50,
  }));

  // Wordmark letters with their delays (starting after logo animation)
  const wordmarkBaseDelay = 0.9; // Start after N logo assembles
  const letterDelay = 0.06; // Delay between each letter
  
  const newLetters = "NEW".split("").map((letter, i) => ({
    letter,
    delay: wordmarkBaseDelay + i * letterDelay,
    isPrimary: false
  }));
  
  const stackLetters = "STACK".split("").map((letter, i) => ({
    letter,
    delay: wordmarkBaseDelay + (3 + i) * letterDelay,
    isPrimary: true
  }));

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
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
              <Sun className={cn("h-4 w-4 transition-all duration-300", isDark ? "rotate-90 scale-0" : "rotate-0 scale-100")} />
              <Moon className={cn("absolute h-4 w-4 transition-all duration-300", isDark ? "rotate-0 scale-100" : "-rotate-90 scale-0")} />
            </Button>
          </motion.div>

          {/* Animated Background */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Primary glow orb */}
            <motion.div
              animate={{ 
                scale: [1, 1.4, 1],
                opacity: [0.15, 0.25, 0.15],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-primary/30 via-primary/10 to-transparent blur-3xl"
            />

            {/* Floating particles */}
            {particles.map((p) => (
              <FloatingParticle key={p.id} {...p} />
            ))}

            {/* Subtle grid */}
            <div 
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `linear-gradient(hsl(var(--primary) / 0.2) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.2) 1px, transparent 1px)`,
                backgroundSize: '50px 50px'
              }}
            />
          </div>

          {/* Main Content */}
          <motion.div
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="relative z-10 flex flex-col items-center text-foreground"
          >
            {/* Single N Logo Animation */}
            <div className="mb-8">
              <AnimatedNLogo 
                size={140} 
                onAnimationComplete={() => setLogoAnimationComplete(true)} 
              />
            </div>

            {/* Wordmark with letter-by-letter animation */}
            <h1 className="text-4xl sm:text-5xl font-bold font-display mb-2 flex" style={{ perspective: "500px" }}>
              {newLetters.map((item, i) => (
                <AnimatedLetter 
                  key={`new-${i}`} 
                  letter={item.letter} 
                  delay={item.delay}
                  isPrimary={item.isPrimary}
                />
              ))}
              {stackLetters.map((item, i) => (
                <AnimatedLetter 
                  key={`stack-${i}`} 
                  letter={item.letter} 
                  delay={item.delay}
                  isPrimary={item.isPrimary}
                />
              ))}
            </h1>
            
            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.4 }}
              className="text-sm sm:text-base text-muted-foreground mb-4"
            >
              Global News Intelligence
            </motion.p>

            {/* Prefetch Status */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.7 }}
              className="flex items-center gap-2 text-xs text-muted-foreground mb-4"
            >
              {getStatusIcon()}
              <span>{getStatusText()}</span>
            </motion.div>

            {/* Loading bars */}
            <motion.div 
              className="flex items-center gap-1.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3 }}
            >
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  animate={{ scaleY: [1, 2.5, 1] }}
                  transition={{ 
                    duration: 0.6, 
                    repeat: Infinity, 
                    delay: i * 0.1,
                    ease: "easeInOut"
                  }}
                  className="w-1 h-5 rounded-full bg-primary origin-center"
                />
              ))}
            </motion.div>

            {/* Progress Bar */}
            <motion.div 
              className="relative w-48 sm:w-56 h-1 bg-muted rounded-full mt-5 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.6 }}
            >
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: `${Math.max(progress, 10)}%` }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              />
            </motion.div>

            {/* Powered By */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.9 }}
              className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-24"
            >
              <p className="text-xs text-muted-foreground/60">
                Powered by{" "}
                <span className="font-medium text-muted-foreground/80">Cropxon Innovations</span>
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook to control splash screen visibility
export function useSplashScreen() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Always show splash on mount (no caching)
    setShowSplash(true);
  }, []);

  const hideSplash = () => setShowSplash(false);

  return { showSplash, hideSplash };
}
