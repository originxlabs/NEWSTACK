import { motion, useScroll, useTransform } from "framer-motion";
import { Play, Sparkles, ArrowRight, Zap, Globe, Headphones, Newspaper, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useRef } from "react";

const words = ["News", "Summaries", "Insights", "Audio", "Local"];

const floatingIcons = [
  { Icon: Globe, delay: 0, x: -120, y: -80 },
  { Icon: Newspaper, delay: 0.5, x: 150, y: -60 },
  { Icon: Headphones, delay: 1, x: -100, y: 100 },
  { Icon: TrendingUp, delay: 1.5, x: 130, y: 80 },
];

export function HeroSection() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const handleGetNews = () => {
    navigate("/news");
  };

  const handlePlayBriefing = () => {
    navigate("/listen");
  };

  return (
    <section 
      ref={containerRef}
      className="relative min-h-[90vh] sm:min-h-screen flex items-center justify-center overflow-hidden gradient-hero-bg px-4"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Primary glow */}
        <motion.div 
          className="absolute top-1/4 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-primary/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 20, 0],
            y: [0, -20, 0],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Secondary glow */}
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-56 sm:w-80 h-56 sm:h-80 bg-accent/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
            x: [0, -30, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        
        {/* Center glow */}
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-primary/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Floating particles */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/40 rounded-full"
            style={{
              left: `${10 + (i * 6)}%`,
              top: `${20 + (i % 4) * 20}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.8, 0.2],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 3 + (i % 3),
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Grid pattern overlay */}
      <motion.div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
        animate={{ opacity: [0.02, 0.04, 0.02] }}
        transition={{ duration: 4, repeat: Infinity }}
      />

      {/* Floating icons */}
      <div className="absolute inset-0 hidden lg:block">
        {floatingIcons.map(({ Icon, delay, x, y: yPos }, index) => (
          <motion.div
            key={index}
            className="absolute top-1/2 left-1/2 w-14 h-14 rounded-2xl glass-card flex items-center justify-center shadow-lg"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0.7, 1, 0.7],
              scale: 1,
              x: x,
              y: [yPos, yPos - 15, yPos],
            }}
            transition={{
              opacity: { duration: 3, repeat: Infinity, ease: "easeInOut" },
              scale: { duration: 0.6, delay: delay, type: "spring", stiffness: 200 },
              x: { duration: 0.6, delay: delay, type: "spring", stiffness: 200 },
              y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay },
            }}
          >
            <Icon className="w-7 h-7 text-primary" />
          </motion.div>
        ))}
      </div>

      <motion.div style={{ y, opacity }} className="container mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center max-w-5xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness: 200 }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full glass-card mb-8"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-4 h-4 text-primary" />
            </motion.div>
            <span className="text-sm font-medium text-foreground">Trusted Global Intelligence</span>
          </motion.div>

          {/* Main headline with animated words */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]"
          >
            <motion.span 
              className="text-foreground dark:text-white inline-block mr-4"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5, type: "spring" }}
            >
              Real-Time
            </motion.span>
            <AnimatedWords words={words} />
          </motion.h1>

          {/* Brand line */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-display font-medium mb-6"
          >
            <motion.span 
              className="text-foreground dark:text-white inline-block"
              whileHover={{ scale: 1.02 }}
            >
              NEW
            </motion.span>
            <motion.span 
              className="gradient-text font-bold inline-block"
              whileHover={{ scale: 1.02 }}
            >
              STACK
            </motion.span>
            <motion.span 
              className="text-muted-foreground hidden sm:inline-block ml-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              — The World. In Real Time.
            </motion.span>
          </motion.div>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 px-4 leading-relaxed"
          >
            The best news app with trusted sources, audio listening, trending topics, 
            and place-based intelligence. No paywalls — just quality journalism.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Button 
                variant="hero" 
                size="xl" 
                className="w-full sm:w-auto group shadow-lg shadow-primary/20"
                onClick={handleGetNews}
              >
                <Sparkles className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                Get Personalized News
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Button 
                variant="heroOutline" 
                size="xl" 
                className="w-full sm:w-auto group"
                onClick={handlePlayBriefing}
              >
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Play className="w-5 h-5 mr-2" />
                </motion.div>
                Play Today's Briefing
              </Button>
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="flex items-center justify-center gap-8 sm:gap-12 mt-14 pt-8 border-t border-border/30"
          >
            {[
              { value: "307+", label: "Stories/Day" },
              { value: "20+", label: "Sources" },
              { value: "50", label: "Audio Plays" },
              { value: "∞", label: "Reading" },
            ].map((stat, index) => (
              <motion.div 
                key={index} 
                className="text-center group cursor-default"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + index * 0.1, duration: 0.4, type: "spring" }}
                whileHover={{ y: -3 }}
              >
                <motion.div 
                  className="text-2xl sm:text-3xl font-display font-bold text-foreground"
                  animate={index === 0 ? { opacity: [1, 0.7, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {stat.value}
                </motion.div>
                <div className="text-xs sm:text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2 cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => {
            const newsSection = document.getElementById("news-feed");
            if (newsSection) {
              newsSection.scrollIntoView({ behavior: "smooth" });
            }
          }}
        >
          <motion.div 
            className="w-1.5 h-2.5 rounded-full bg-primary"
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}

function AnimatedWords({ words }: { words: string[] }) {
  return (
    <span className="relative inline-block min-w-[160px] sm:min-w-[220px] md:min-w-[300px] text-left h-[1.2em] align-bottom">
      {words.map((word, index) => (
        <motion.span
          key={word}
          className="absolute left-0 top-0 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent font-bold whitespace-nowrap"
          style={{ backgroundSize: "200% 100%" }}
          initial={{ opacity: 0, y: 40, scale: 0.9 }}
          animate={{
            opacity: [0, 1, 1, 0],
            y: [40, 0, 0, -40],
            scale: [0.9, 1, 1, 0.9],
            backgroundPosition: ["0% 50%", "100% 50%", "100% 50%", "0% 50%"],
          }}
          transition={{
            duration: 2.5,
            delay: index * 2.5,
            repeat: Infinity,
            repeatDelay: (words.length - 1) * 2.5,
            times: [0, 0.2, 0.8, 1],
            ease: "easeInOut",
          }}
        >
          {word}
        </motion.span>
      ))}
      <span className="invisible font-bold">{words.reduce((a, b) => a.length > b.length ? a : b)}</span>
    </span>
  );
}
