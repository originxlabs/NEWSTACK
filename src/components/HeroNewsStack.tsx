import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import { Clock, ExternalLink, RefreshCw, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

interface NewsItem {
  id: string;
  headline: string;
  summary?: string;
  topic?: string;
  imageUrl?: string | null;
  publishedAt?: string;
  sourceCount?: number;
}

interface HeroNewsStackProps {
  articles: NewsItem[];
  isLoading?: boolean;
}

const TOPIC_COLORS: Record<string, string> = {
  world: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  politics: "bg-purple-500/15 text-purple-400 border-purple-500/25",
  technology: "bg-cyan-500/15 text-cyan-400 border-cyan-500/25",
  business: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  science: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  health: "bg-rose-500/15 text-rose-400 border-rose-500/25",
  sports: "bg-orange-500/15 text-orange-400 border-orange-500/25",
  entertainment: "bg-pink-500/15 text-pink-400 border-pink-500/25",
};

function topicClass(topic?: string) {
  if (!topic) return "bg-muted text-muted-foreground border-border";
  return TOPIC_COLORS[topic.toLowerCase()] ?? "bg-muted text-muted-foreground border-border";
}

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&q=80",
  "https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=600&q=80",
  "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=600&q=80",
  "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=600&q=80",
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80",
];

export function HeroNewsStack({ articles, isLoading }: HeroNewsStackProps) {
  const navigate = useNavigate();
  const stackRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [nextRefresh, setNextRefresh] = useState(4 * 60 * 60); // 4 hours in seconds
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = Math.min(articles.length, 20);

  // Countdown timer
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setNextRefresh((s) => (s <= 1 ? 4 * 60 * 60 : s - 1));
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  // Auto-advance cards every 5 seconds
  useEffect(() => {
    if (total === 0) return;
    autoPlayRef.current = setInterval(() => {
      setActiveIdx((i) => (i + 1) % total);
    }, 5000);
    return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); };
  }, [total]);

  // GSAP stack animation whenever activeIdx changes
  useEffect(() => {
    if (!stackRef.current || total === 0) return;
    const cards = stackRef.current.querySelectorAll<HTMLElement>(".stack-card");
    
    cards.forEach((card, i) => {
      const offset = i - activeIdx;
      const absOffset = Math.abs(offset);
      const visible = absOffset <= 3;

      gsap.to(card, {
        opacity: visible ? 1 - absOffset * 0.22 : 0,
        y: offset * 14,
        scale: 1 - absOffset * 0.04,
        rotateX: offset * 2,
        zIndex: total - absOffset,
        duration: 0.45,
        ease: "power3.out",
        pointerEvents: offset === 0 ? "all" : "none",
      });
    });
  }, [activeIdx, total]);

  // Entrance animation
  useEffect(() => {
    if (!stackRef.current || isLoading || total === 0) return;
    const cards = stackRef.current.querySelectorAll<HTMLElement>(".stack-card");
    gsap.fromTo(
      cards,
      { opacity: 0, y: 60, scale: 0.92 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        stagger: 0.06,
        ease: "power3.out",
        onComplete: () => {
          // Re-apply stack positions after entrance
          cards.forEach((card, i) => {
            const offset = i - activeIdx;
            const absOffset = Math.abs(offset);
            gsap.set(card, {
              opacity: Math.abs(offset) <= 3 ? 1 - absOffset * 0.22 : 0,
              y: offset * 14,
              scale: 1 - absOffset * 0.04,
              zIndex: total - absOffset,
            });
          });
        },
      }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, total]);

  const handleCardClick = useCallback((id: string) => {
    navigate(`/news?story=${id}`);
  }, [navigate]);

  const goNext = () => setActiveIdx((i) => (i + 1) % total);
  const goPrev = () => setActiveIdx((i) => (i - 1 + total) % total);

  const formatCountdown = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}h ${m.toString().padStart(2, "0")}m ${sec.toString().padStart(2, "0")}s`;
  };

  if (isLoading) {
    return (
      <div className="relative w-full max-w-sm mx-auto mt-8 h-[360px] flex items-center justify-center">
        <div className="absolute inset-0 rounded-2xl border border-border/50 bg-card animate-pulse" />
        <div className="text-muted-foreground text-sm font-mono">Loading world news…</div>
      </div>
    );
  }

  if (total === 0) return null;

  const active = articles[activeIdx];
  const imgSrc = active.imageUrl || FALLBACK_IMAGES[activeIdx % FALLBACK_IMAGES.length];

  return (
    <div className="flex flex-col items-center gap-4 mt-10 w-full">
      {/* Header row */}
      <div className="flex items-center justify-between w-full max-w-sm">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            World Top Stories
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
          <RefreshCw className="w-3 h-3" />
          {formatCountdown(nextRefresh)}
        </div>
      </div>

      {/* Card stack */}
      <div
        ref={stackRef}
        className="relative w-full max-w-sm"
        style={{ height: 360, perspective: "900px" }}
      >
        {articles.slice(0, 20).map((article, i) => {
          const img = article.imageUrl || FALLBACK_IMAGES[i % FALLBACK_IMAGES.length];
          return (
            <div
              key={article.id}
              className="stack-card absolute inset-0 rounded-2xl overflow-hidden border border-border/60 bg-card cursor-pointer shadow-lg group"
              style={{ transformOrigin: "center top" }}
              onClick={() => handleCardClick(article.id)}
            >
              {/* Image */}
              <div className="relative h-44 overflow-hidden">
                <img
                  src={img}
                  alt={article.headline}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = FALLBACK_IMAGES[i % FALLBACK_IMAGES.length];
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                {/* Topic badge */}
                {article.topic && (
                  <Badge
                    variant="outline"
                    className={`absolute top-3 left-3 text-[10px] h-5 px-2 capitalize font-mono ${topicClass(article.topic)}`}
                  >
                    {article.topic}
                  </Badge>
                )}
                {/* Card index */}
                <span className="absolute top-3 right-3 text-[10px] font-mono text-white/70 bg-black/40 px-1.5 py-0.5 rounded">
                  {i + 1} / {total}
                </span>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-sm font-semibold text-foreground leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {article.headline}
                </h3>
                {article.summary && (
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">
                    {article.summary}
                  </p>
                )}
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {article.publishedAt
                      ? formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })
                      : "Recently"}
                  </div>
                  <div className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink className="w-3 h-3" />
                    <span>Read</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Nav controls */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={goPrev} className="h-7 px-3 text-xs">
          ← Prev
        </Button>
        {/* Dots */}
        <div className="flex gap-1">
          {Array.from({ length: Math.min(total, 8) }).map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === activeIdx % Math.min(total, 8)
                  ? "bg-primary w-4"
                  : "bg-muted-foreground/40"
              }`}
            />
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={goNext} className="h-7 px-3 text-xs">
          Next →
        </Button>
      </div>

      <p className="text-[10px] font-mono text-muted-foreground/50 text-center">
        {activeIdx + 1} of {total} stories · auto-advances every 5s
      </p>
    </div>
  );
}
