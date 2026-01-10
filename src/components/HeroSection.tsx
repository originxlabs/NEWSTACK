import { motion, useScroll, useTransform } from "framer-motion";
import { Play, Sparkles, ArrowRight, Zap, Globe, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useRef } from "react";

const words = ["News", "Summaries", "Insights", "Audio", "Local"];

const floatingIcons = [
  { Icon: Globe, delay: 0, x: -120, y: -80 },
  { Icon: Zap, delay: 0.5, x: 150, y: -60 },
  { Icon: Headphones, delay: 1, x: -100, y: 100 },
  { Icon: Sparkles, delay: 1.5, x: 130, y: 80 },
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
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Floating icons */}
      <div className="absolute inset-0 hidden lg:block">
        {floatingIcons.map(({ Icon, delay, x, y: yPos }, index) => (
          <motion.div
            key={index}
            className="absolute top-1/2 left-1/2 w-12 h-12 rounded-xl glass-card flex items-center justify-center"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0.6, 1, 0.6],
              scale: 1,
              x: x,
              y: [yPos, yPos - 10, yPos],
            }}
            transition={{
              opacity: { duration: 3, repeat: Infinity, ease: "easeInOut" },
              scale: { duration: 0.5, delay: delay },
              x: { duration: 0.5, delay: delay },
              y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay },
            }}
          >
            <Icon className="w-6 h-6 text-primary" />
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
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full glass-card mb-6 sm:mb-8"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-4 h-4 text-primary" />
            </motion.div>
            <span className="text-xs sm:text-sm font-medium text-foreground">AI-Powered Global Intelligence</span>
            <motion.span 
              className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-semibold"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              FREE
            </motion.span>
          </motion.div>

          {/* Main headline with animated word */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight mb-4 sm:mb-6 leading-tight"
          >
            <motion.span 
              className="text-foreground dark:text-white inline-block"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              Free AI{" "}
            </motion.span>
            <AnimatedWords words={words} />
          </motion.h1>

          {/* Brand line */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-display font-medium mb-4"
          >
            <motion.span 
              className="text-foreground dark:text-white inline-block"
              whileHover={{ scale: 1.05 }}
            >
              NEW
            </motion.span>
            <motion.span 
              className="gradient-text font-bold inline-block"
              whileHover={{ scale: 1.05 }}
            >
              STACK
            </motion.span>
            <motion.span 
              className="text-muted-foreground hidden sm:inline-block ml-2"
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
            className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 sm:mb-12 px-4"
          >
            The best free AI news app with trusted sources, audio listening, trending topics, 
            and place-based intelligence. No paywalls — just quality journalism.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                variant="hero" 
                size="xl" 
                className="w-full sm:w-auto group"
                onClick={handleGetNews}
              >
                <Sparkles className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                Get Personalized News
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                variant="heroOutline" 
                size="xl" 
                className="w-full sm:w-auto group"
                onClick={handlePlayBriefing}
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
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
            className="flex items-center justify-center gap-6 sm:gap-8 md:gap-12 mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-border/30"
          >
            {[
              { value: "307+", label: "Stories/Day" },
              { value: "20+", label: "Sources" },
              { value: "50", label: "Free Audio" },
              { value: "∞", label: "Free Reading" },
            ].map((stat, index) => (
              <motion.div 
                key={index} 
                className="text-center group cursor-default"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + index * 0.1, duration: 0.4 }}
                whileHover={{ y: -2 }}
              >
                <motion.div 
                  className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-foreground"
                  animate={index === 0 ? { 
                    opacity: [1, 0.7, 1],
                  } : {}}
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
        className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-5 h-8 sm:w-6 sm:h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-1.5 sm:p-2 cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => {
            const newsSection = document.getElementById("news-feed");
            if (newsSection) {
              newsSection.scrollIntoView({ behavior: "smooth" });
            }
          }}
        >
          <motion.div 
            className="w-1 h-2 sm:w-1.5 sm:h-2.5 rounded-full bg-primary"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}

function AnimatedWords({ words }: { words: string[] }) {
  return (
    <span className="relative inline-block min-w-[140px] sm:min-w-[200px] md:min-w-[280px] text-left h-[1.2em]">
      {words.map((word, index) => (
        <motion.span
          key={word}
          className="absolute left-0 top-0 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent font-bold"
          style={{
            backgroundSize: "200% 100%",
          }}
          initial={{ opacity: 0, y: 30, scale: 0.9, rotateX: -90 }}
          animate={{
            opacity: [0, 1, 1, 0],
            y: [30, 0, 0, -30],
            scale: [0.9, 1, 1, 0.9],
            rotateX: [-90, 0, 0, 90],
            backgroundPosition: ["0% 50%", "100% 50%", "100% 50%", "0% 50%"],
          }}
          transition={{
            duration: 2.5,
            delay: index * 2.5,
            repeat: Infinity,
            repeatDelay: (words.length - 1) * 2.5,
            times: [0, 0.15, 0.85, 1],
            ease: "easeInOut",
          }}
        >
          {word}
        </motion.span>
      ))}
      {/* Placeholder for layout - ensures proper height */}
      <span className="invisible font-bold">{words.reduce((a, b) => a.length > b.length ? a : b)}</span>
    </span>
  );
}