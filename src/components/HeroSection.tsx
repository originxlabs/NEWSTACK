import { motion } from "framer-motion";
import { ArrowRight, Activity, Clock, Shield, Layers, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate, Link } from "react-router-dom";

export function HeroSection() {
  const navigate = useNavigate();

  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <section className="relative pt-24 pb-16 px-4 gradient-hero-bg">
      <div className="container mx-auto max-w-5xl">
        {/* Positioning Statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          {/* Time & Status */}
          <div className="flex items-center justify-center gap-4 mb-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{currentTime}</span>
            </div>
            <span className="text-border">•</span>
            <span>{currentDate}</span>
            <span className="text-border">•</span>
            <Badge variant="outline" className="text-[10px] h-5 gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
              <Activity className="w-2.5 h-2.5" />
              LIVE
            </Badge>
          </div>

          {/* Main Headline */}
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight mb-4 text-balance">
            <span className="text-foreground">Your </span>
            <span className="gradient-text">Daily Reality</span>
            <span className="text-foreground"> Briefing</span>
          </h1>

          {/* Subtitle */}
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            An open, neutral intelligence layer built from public sources.
            <br className="hidden sm:block" />
            No opinions. No paywalls. Just verified facts from multiple perspectives.
          </p>

          {/* Trust Indicators Strip - Clickable Sources */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mb-10"
          >
            <Link 
              to="/news?filter=sources"
              className="flex items-center gap-2 text-sm hover:text-primary transition-colors group"
            >
              <Layers className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
              <span className="font-semibold text-foreground group-hover:text-primary">170+</span>
              <span className="text-muted-foreground group-hover:text-primary">Verified Sources</span>
              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Stat icon={<Shield className="w-4 h-4" />} value="100%" label="Open Access" />
            <Stat icon={<Activity className="w-4 h-4" />} value="15min" label="Update Cycle" />
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Button 
              size="lg" 
              className="min-w-[200px] gap-2 shadow-sm"
              onClick={() => navigate("/news")}
            >
              Explore Today's Intelligence
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="min-w-[200px]"
              onClick={() => navigate("/world")}
            >
              View Global Pulse
            </Button>
          </motion.div>
        </motion.div>

        {/* Supporting Line */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-center"
        >
          <p className="text-xs text-muted-foreground/70 max-w-lg mx-auto">
            Stories are clustered from multiple independent sources, scored for credibility,
            and presented without editorial interpretation.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="text-muted-foreground">{icon}</div>
      <span className="font-semibold text-foreground">{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
