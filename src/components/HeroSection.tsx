import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ArrowRight, Activity, Clock, Shield, Layers, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate, Link } from "react-router-dom";

export function HeroSection() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const taglineRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!heroRef.current) return;

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    // Badge drops in
    tl.fromTo(
      badgeRef.current,
      { opacity: 0, y: -20, scale: 0.85 },
      { opacity: 1, y: 0, scale: 1, duration: 0.5 }
    );

    // Tagline/time strip fades
    tl.fromTo(
      taglineRef.current,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.45 },
      "-=0.2"
    );

    // Headline — split word by word
    if (headlineRef.current) {
      const words = headlineRef.current.querySelectorAll(".word");
      tl.fromTo(
        words,
        { opacity: 0, y: 40, skewY: 4 },
        { opacity: 1, y: 0, skewY: 0, duration: 0.55, stagger: 0.08 },
        "-=0.15"
      );
    }

    // Subtitle
    tl.fromTo(
      subtitleRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5 },
      "-=0.2"
    );

    // Stats strip
    if (statsRef.current) {
      const items = statsRef.current.querySelectorAll(".stat-item");
      tl.fromTo(
        items,
        { opacity: 0, y: 12, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.1 },
        "-=0.1"
      );
    }

    // CTA buttons
    if (ctaRef.current) {
      const btns = ctaRef.current.querySelectorAll("button, a");
      tl.fromTo(
        btns,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.1 },
        "-=0.1"
      );
    }

    // Floating glow pulse on bg
    gsap.to(".hero-glow", {
      scale: 1.08,
      opacity: 0.18,
      duration: 3.5,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });

    return () => {
      tl.kill();
      gsap.killTweensOf(".hero-glow");
    };
  }, []);

  return (
    <section ref={heroRef} className="relative pt-24 pb-16 px-4 overflow-hidden gradient-hero-bg">
      {/* Ambient background glow */}
      <div className="hero-glow absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="hero-glow absolute top-1/2 right-10 w-[300px] h-[300px] rounded-full bg-accent/8 blur-3xl pointer-events-none" style={{ animationDelay: "1s" }} />

      <div className="container mx-auto max-w-5xl relative z-10">
        {/* Live Badge */}
        <div ref={badgeRef} className="flex justify-center mb-5">
          <Badge
            variant="outline"
            className="text-[11px] h-6 gap-1.5 px-3 bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-mono tracking-widest uppercase"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
            Live Intelligence Feed
          </Badge>
        </div>

        {/* Time strip */}
        <div ref={taglineRef} className="flex items-center justify-center gap-4 mb-7 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-mono">{currentTime}</span>
          </div>
          <span className="text-border">•</span>
          <span>{currentDate}</span>
        </div>

        {/* Main Headline — word-split for GSAP */}
        <h1
          ref={headlineRef}
          className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-5 text-center leading-[1.1]"
        >
          <span className="word inline-block mr-3 text-foreground">Your</span>
          <span className="word inline-block mr-3 gradient-text">Daily</span>
          <span className="word inline-block mr-3 gradient-text">Reality</span>
          <br className="hidden sm:block" />
          <span className="word inline-block mr-3 text-foreground">Briefing</span>
        </h1>

        {/* Eyebrow typography line */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="h-px w-16 bg-border" />
          <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
            by OriginX Labs · Neutral · Verified · Open
          </span>
          <div className="h-px w-16 bg-border" />
        </div>

        {/* Subtitle */}
        <p
          ref={subtitleRef}
          className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto mb-9 leading-relaxed text-center"
        >
          An open, neutral intelligence layer built from public sources.
          <br className="hidden sm:block" />
          No opinions. No paywalls. Just verified facts from multiple perspectives.
        </p>

        {/* Trust Stats */}
        <div ref={statsRef} className="flex flex-wrap items-center justify-center gap-8 mb-10">
          <Link
            to="/news?filter=sources"
            className="stat-item flex items-center gap-2 text-sm hover:text-primary transition-colors group"
          >
            <Layers className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
            <span className="font-bold text-foreground group-hover:text-primary">170+</span>
            <span className="text-muted-foreground group-hover:text-primary">Verified Sources</span>
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
          <div className="stat-item flex items-center gap-2 text-sm">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <span className="font-bold text-foreground">100%</span>
            <span className="text-muted-foreground">Open Access</span>
          </div>
          <div className="stat-item flex items-center gap-2 text-sm">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <span className="font-bold text-foreground">15min</span>
            <span className="text-muted-foreground">Update Cycle</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div ref={ctaRef} className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            size="lg"
            className="min-w-[220px] gap-2 shadow-sm"
            onClick={() => navigate("/news")}
          >
            Explore Today's Intelligence
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="min-w-[220px]"
            onClick={() => navigate("/world")}
          >
            View Global Pulse
          </Button>
        </div>

        {/* Supporting note */}
        <p className="text-xs text-muted-foreground/60 text-center max-w-lg mx-auto mt-8 leading-relaxed">
          Stories are clustered from multiple independent sources, scored for credibility,
          and presented without editorial interpretation.
        </p>
      </div>
    </section>
  );
}
