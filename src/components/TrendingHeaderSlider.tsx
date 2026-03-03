import { useEffect, useMemo, useRef, useState } from "react";
import { Flame, Loader2, Shuffle, MoveHorizontal, Infinity as InfinityIcon, Clock3, Sparkles } from "lucide-react";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { Observer } from "gsap/Observer";
import { useNews } from "@/hooks/use-news";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

gsap.registerPlugin(Flip, Observer);

type SliderMode = "swipe" | "infinite" | "flip";

function formatAgeLabel(timestamp: string) {
  const created = new Date(timestamp).getTime();
  if (!created) return "Now";
  const diffMs = Date.now() - created;
  const mins = Math.max(1, Math.floor(diffMs / 60000));
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

interface TrendingCard {
  id: string;
  headline: string;
  imageUrl: string | null;
  topic: string;
  sourceCount: number;
  publishedAt: string;
}

export function TrendingHeaderSlider({
  className,
  defaultMode = "swipe",
}: {
  className?: string;
  defaultMode?: SliderMode;
}) {
  const { data, isLoading } = useNews({
    feedType: "trending",
    pageSize: 100,
    sortBy: "latest",
  });

  const cards = useMemo<TrendingCard[]>(() => {
    const rows = data?.articles || [];
    return rows.slice(0, 100).map((item) => ({
      id: item.id,
      headline: item.headline,
      imageUrl: item.image_url,
      topic: item.topic_slug || "General",
      sourceCount: item.source_count || 1,
      publishedAt: item.published_at,
    }));
  }, [data?.articles]);

  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [mode, setMode] = useState<SliderMode>(defaultMode);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const infiniteTweenRef = useRef<gsap.core.Tween | null>(null);
  const flipTimerRef = useRef<number | null>(null);
  const autoTimerRef = useRef<number | null>(null);
  const observerRef = useRef<Observer | null>(null);
  const introTweenRef = useRef<gsap.core.Tween | null>(null);

  const effectiveMode: SliderMode = isTouchDevice ? "swipe" : mode;
  const extendedCards = useMemo(() => {
    if (effectiveMode === "infinite") {
      return [...cards, ...cards];
    }
    return cards;
  }, [cards, effectiveMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const query = window.matchMedia("(max-width: 1023px)");
    const apply = () => setIsTouchDevice(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    setActiveIndex(0);
    activeIndexRef.current = 0;
  }, [effectiveMode, cards.length]);

  useEffect(() => {
    if (!trackRef.current || !containerRef.current || !cards.length) return;

    const trackEl = trackRef.current;
    const containerEl = containerRef.current;
    const cardEl = trackEl.querySelector<HTMLElement>("[data-trend-card]");
    const cardWidth = cardEl?.offsetWidth || 280;
    const gap = 12;
    const step = cardWidth + gap;
    const maxIndex = Math.max(0, cards.length - 1);

    infiniteTweenRef.current?.kill();
    infiniteTweenRef.current = null;
    observerRef.current?.kill();
    observerRef.current = null;
    if (flipTimerRef.current) {
      window.clearInterval(flipTimerRef.current);
      flipTimerRef.current = null;
    }
    if (autoTimerRef.current) {
      window.clearInterval(autoTimerRef.current);
      autoTimerRef.current = null;
    }

    if (effectiveMode === "infinite") {
      const singleWidth = step * cards.length;
      gsap.set(trackEl, { x: 0 });
      infiniteTweenRef.current = gsap.to(trackEl, {
        x: -singleWidth,
        ease: "none",
        duration: Math.max(20, cards.length * 1.6),
        repeat: -1,
        modifiers: {
          x: gsap.utils.unitize((value) => {
            const raw = parseFloat(value);
            return raw % singleWidth;
          }),
        },
      });
      return;
    }

    if (effectiveMode === "flip") {
      flipTimerRef.current = window.setInterval(() => {
        const nodes = Array.from(trackEl.querySelectorAll<HTMLElement>("[data-trend-card]"));
        if (nodes.length < 2) return;
        const state = Flip.getState(nodes);
        trackEl.appendChild(nodes[0]);
        Flip.from(state, {
          duration: 0.75,
          ease: "power2.inOut",
          absolute: true,
          stagger: 0.012,
        });
      }, 2600);
      return;
    }

    const goTo = (nextIndex: number) => {
      const wrapped = gsap.utils.wrap(0, maxIndex + 1, nextIndex);
      activeIndexRef.current = wrapped;
      setActiveIndex(wrapped);
      gsap.to(trackEl, {
        x: -wrapped * step,
        duration: 0.45,
        ease: "power3.out",
      });
    };

    gsap.set(trackEl, { x: 0 });
    observerRef.current = Observer.create({
      target: containerEl,
      type: "wheel,touch,pointer",
      wheelSpeed: -1,
      tolerance: 9,
      onLeft: () => goTo(activeIndexRef.current + 1),
      onRight: () => goTo(activeIndexRef.current - 1),
      preventDefault: true,
    });

    autoTimerRef.current = window.setInterval(() => {
      goTo(activeIndexRef.current + 1);
    }, 3300);

    return () => {
      observerRef.current?.kill();
      observerRef.current = null;
      if (autoTimerRef.current) {
        window.clearInterval(autoTimerRef.current);
        autoTimerRef.current = null;
      }
    };
  }, [effectiveMode, cards.length]);

  useEffect(() => {
    if (!trackRef.current || !cards.length) return;
    const nodes = Array.from(trackRef.current.querySelectorAll<HTMLElement>("[data-trend-card]")).slice(0, 12);
    introTweenRef.current?.kill();
    introTweenRef.current = gsap.fromTo(
      nodes,
      { autoAlpha: 0, y: 18, scale: 0.98 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.55, ease: "power2.out", stagger: 0.045 },
    );

    return () => {
      introTweenRef.current?.kill();
      introTweenRef.current = null;
    };
  }, [effectiveMode, cards.length]);

  if (isLoading) {
    return (
      <div className={cn("rounded-xl border border-border/60 bg-background/90 p-4", className)}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading top 100 trending topics...
        </div>
      </div>
    );
  }

  if (!cards.length) {
    return (
      <div className={cn("rounded-xl border border-border/60 bg-background/90 p-4 text-sm text-muted-foreground", className)}>
        Trending stream unavailable right now.
      </div>
    );
  }

  return (
    <section className={cn("rounded-2xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-lg", className)}>
      <header className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <Flame className="h-4 w-4 text-orange-500 animate-pulse" />
          <p className="text-sm font-semibold truncate">Trending Pulse</p>
          <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-medium">Top 100</span>
          {effectiveMode === "swipe" && (
            <span className="hidden sm:inline rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
              #{activeIndex + 1}
            </span>
          )}
        </div>
        <div className="hidden lg:flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setMode("swipe")}
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] transition-colors",
              mode === "swipe" ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted",
            )}
          >
            <MoveHorizontal className="h-3.5 w-3.5" />
            Swipe
          </button>
          <button
            type="button"
            onClick={() => setMode("infinite")}
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] transition-colors",
              mode === "infinite" ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted",
            )}
          >
            <InfinityIcon className="h-3.5 w-3.5" />
            Auto
          </button>
          <button
            type="button"
            onClick={() => setMode("flip")}
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] transition-colors",
              mode === "flip" ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted",
            )}
          >
            <Shuffle className="h-3.5 w-3.5" />
            FLIP
          </button>
        </div>
      </header>

      <div ref={containerRef} className="overflow-hidden px-4 py-4 touch-pan-y min-h-[288px] sm:min-h-[340px]">
        <div ref={trackRef} className="flex gap-4 will-change-transform select-none pb-1">
          {extendedCards.map((item, idx) => (
            <Link
              key={`${item.id}-${idx}`}
              to={`/news/${item.id}`}
              data-trend-card
              className="group shrink-0 w-[290px] sm:w-[360px] xl:w-[420px] rounded-2xl border border-border/60 bg-card/90 overflow-hidden transition-transform hover:scale-[1.01] shadow-sm"
            >
              <div className="h-36 sm:h-44 w-full bg-muted relative overflow-hidden">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.headline}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-full w-full grid place-items-center text-muted-foreground">
                    <Sparkles className="h-5 w-5" />
                  </div>
                )}
                <span className="absolute left-2 top-2 rounded-full bg-black/55 text-white px-2 py-0.5 text-[10px] capitalize">
                  {item.topic.replace(/[-_]/g, " ")}
                </span>
              </div>
              <div className="p-3.5">
                <h3 className="text-sm sm:text-base font-semibold leading-snug line-clamp-3 group-hover:text-primary transition-colors">
                  {item.headline}
                </h3>
                <div className="mt-2.5 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{item.sourceCount} sources</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="h-3 w-3" />
                    {formatAgeLabel(item.publishedAt)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
