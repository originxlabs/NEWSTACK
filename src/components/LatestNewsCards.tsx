import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Clock, ArrowRight, TrendingUp, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

gsap.registerPlugin(ScrollTrigger);

interface NewsItem {
  id: string;
  headline: string;
  topic?: string;
  sourceCount?: number;
  publishedAt?: string;
  summary?: string;
  tags?: string[];
}

interface LatestNewsCardsProps {
  articles: NewsItem[];
  isLoading?: boolean;
}

const TOPIC_COLORS: Record<string, string> = {
  world: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  politics: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  technology: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  business: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  science: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  health: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  sports: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  entertainment: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  india: "bg-saffron/10 text-amber-400 border-amber-500/20",
};

function getTopicClass(topic?: string) {
  if (!topic) return "bg-muted text-muted-foreground border-border";
  return TOPIC_COLORS[topic.toLowerCase()] ?? "bg-muted text-muted-foreground border-border";
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3 animate-pulse">
      <div className="h-3 w-16 rounded bg-muted" />
      <div className="h-4 w-full rounded bg-muted" />
      <div className="h-4 w-4/5 rounded bg-muted" />
      <div className="h-3 w-24 rounded bg-muted" />
    </div>
  );
}

export function LatestNewsCards({ articles, isLoading }: LatestNewsCardsProps) {
  const navigate = useNavigate();
  const gridRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoading || !gridRef.current) return;

    const cards = gridRef.current.querySelectorAll(".news-card");

    // Header animation
    gsap.fromTo(
      headerRef.current,
      { opacity: 0, y: 24 },
      {
        opacity: 1,
        y: 0,
        duration: 0.55,
        ease: "power3.out",
        scrollTrigger: {
          trigger: headerRef.current,
          start: "top 85%",
          once: true,
        },
      }
    );

    // Stagger cards on scroll
    gsap.fromTo(
      cards,
      { opacity: 0, y: 36, scale: 0.97 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.5,
        stagger: 0.055,
        ease: "power3.out",
        scrollTrigger: {
          trigger: gridRef.current,
          start: "top 80%",
          once: true,
        },
      }
    );

    // Hover tilt effect on each card
    cards.forEach((card) => {
      const el = card as HTMLElement;
      const handleEnter = () => {
        gsap.to(el, { y: -4, scale: 1.015, duration: 0.25, ease: "power2.out" });
      };
      const handleLeave = () => {
        gsap.to(el, { y: 0, scale: 1, duration: 0.3, ease: "power2.inOut" });
      };
      el.addEventListener("mouseenter", handleEnter);
      el.addEventListener("mouseleave", handleLeave);
      return () => {
        el.removeEventListener("mouseenter", handleEnter);
        el.removeEventListener("mouseleave", handleLeave);
      };
    });

    return () => ScrollTrigger.getAll().forEach((st) => st.kill());
  }, [isLoading, articles]);

  return (
    <section className="py-14 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Section header */}
        <div ref={headerRef} className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Latest Stories
              </span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              Breaking Now
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time updates from 170+ verified sources
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 hidden sm:flex"
            onClick={() => navigate("/news")}
          >
            View all
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Cards grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {articles.slice(0, 20).map((article, idx) => (
              <button
                key={article.id}
                className="news-card group text-left rounded-xl border border-border/60 bg-card hover:border-primary/30 hover:bg-card/90 transition-colors duration-200 p-5 cursor-pointer shadow-sm relative overflow-hidden min-h-[218px] flex flex-col"
                onClick={() => navigate(`/news?story=${article.id}`)}
              >
                {/* Subtle gradient accent top */}
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-primary/0 via-primary/40 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Topic badge */}
                <div className="flex items-center justify-between mb-2.5">
                  {article.topic && (
                    <Badge
                      variant="outline"
                      className={`text-[10px] h-4.5 px-1.5 capitalize font-mono ${getTopicClass(article.topic)}`}
                    >
                      {article.topic}
                    </Badge>
                  )}
                  {idx < 3 && (
                    <span className="text-[9px] font-mono text-emerald-500 uppercase tracking-widest flex items-center gap-0.5">
                      <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse inline-block" />
                      new
                    </span>
                  )}
                </div>

                {/* Headline */}
                <h3 className="text-sm font-semibold text-foreground leading-snug mb-2.5 line-clamp-3 group-hover:text-primary transition-colors">
                  {article.headline}
                </h3>

                {article.tags && article.tags.length > 0 && (
                  <div className="mt-auto pt-3 flex flex-wrap gap-1.5">
                    {article.tags.slice(0, 3).map((tag) => (
                      <span
                        key={`${article.id}-${tag}`}
                        className="inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-3">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {article.publishedAt
                      ? formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })
                      : "Recently"}
                  </div>
                  {article.sourceCount && article.sourceCount > 1 && (
                    <div className="flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      {article.sourceCount} sources
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Mobile view-all */}
        <div className="flex justify-center mt-6 sm:hidden">
          <Button variant="outline" size="sm" onClick={() => navigate("/news")}>
            View all stories
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </section>
  );
}
