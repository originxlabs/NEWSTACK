import { motion, useScroll, useTransform } from "framer-motion";
import { Play, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useRef } from "react";

const words = ["News", "Summaries", "Insights", "Audio", "Local"];

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
      {/* Simple gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />

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
