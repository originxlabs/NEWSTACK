import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { useInfiniteNews } from "@/hooks/use-news";
import { usePreferences } from "@/contexts/PreferencesContext";
import { SwipeNewsCard } from "./SwipeNewsCard";
import { PullToRefresh } from "./PullToRefresh";
import { Loader2, Wifi, WifiOff } from "lucide-react";
import type { NewsItem } from "@/components/NewsCard";

interface SwipeNewsFeedProps {
  className?: string;
}

export function SwipeNewsFeed({ className = "" }: SwipeNewsFeedProps) {
  const { country, language } = usePreferences();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const queryParams = {
    country: country?.code || "us",
    language: language?.code || "en",
    pageSize: 20,
    feedType: "trending" as const,
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteNews(queryParams);

  // Transform articles to NewsItem format
  const newsItems: NewsItem[] = data?.pages.flatMap((page) => 
    page.articles.map((article) => ({
      id: article.id || crypto.randomUUID(),
      headline: article.headline,
      summary: article.summary || "",
      content: article.content,
      topic: article.topic_slug || "world",
      sentiment: (article.sentiment as "positive" | "neutral" | "negative") || "neutral",
      trustScore: article.trust_score || 85,
      source: article.source_name || "Unknown",
      sourceUrl: article.source_url,
      sourceIcon: article.source_logo,
      timestamp: formatTimestamp(article.published_at),
      publishedAt: article.published_at,
      imageUrl: article.image_url,
      whyMatters: article.why_matters,
      countryCode: article.country_code,
      isGlobal: article.is_global,
      isBreaking: false,
      isTrending: true,
      sourceCount: article.source_count,
    }))
  ) || [];

  // Prefetch next page when near the end
  useEffect(() => {
    if (currentIndex >= newsItems.length - 5 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [currentIndex, newsItems.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleSwipe = useCallback((direction: "up" | "down") => {
    if (direction === "up" && currentIndex < newsItems.length - 1) {
      setDirection(1);
      setCurrentIndex((prev) => prev + 1);
    } else if (direction === "down" && currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex, newsItems.length]);

  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    const velocity = 500;

    if (info.offset.y < -threshold || info.velocity.y < -velocity) {
      handleSwipe("up");
    } else if (info.offset.y > threshold || info.velocity.y > velocity) {
      handleSwipe("down");
    }
  }, [handleSwipe]);

  const handleRefresh = async () => {
    setCurrentIndex(0);
    await refetch();
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "k") {
        handleSwipe("down");
      } else if (e.key === "ArrowDown" || e.key === "j" || e.key === " ") {
        handleSwipe("up");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSwipe]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-4"
        >
          <span className="text-2xl font-bold text-primary-foreground font-display">N</span>
        </motion.div>
        <h2 className="text-xl font-display font-bold mb-2">NEWSTACK</h2>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading stories...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background p-6">
        <WifiOff className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Connection Error</h2>
        <p className="text-muted-foreground text-center mb-4">
          Unable to load news. Please check your connection and try again.
        </p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-full"
        >
          Retry
        </button>
      </div>
    );
  }

  if (newsItems.length === 0) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background p-6">
        <Wifi className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Stories Available</h2>
        <p className="text-muted-foreground text-center">
          Check back later for the latest news.
        </p>
      </div>
    );
  }

  const currentNews = newsItems[currentIndex];

  return (
    <PullToRefresh onRefresh={handleRefresh} className={`fixed inset-0 ${className}`}>
      <div 
        ref={containerRef}
        className="h-full w-full overflow-hidden touch-pan-y"
      >
        {/* Progress indicator */}
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-muted">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / newsItems.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Story counter */}
        <div className="fixed top-3 right-4 z-50 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1">
          <span className="text-xs text-white font-medium">
            {currentIndex + 1} / {newsItems.length}
          </span>
        </div>

        {/* Swipe container */}
        <motion.div
          className="h-full w-full relative"
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
        >
          <AnimatePresence mode="wait" custom={direction}>
            <SwipeNewsCard
              key={currentNews.id}
              news={currentNews}
              isActive={true}
              onSwipeUp={() => handleSwipe("up")}
              onSwipeDown={() => handleSwipe("down")}
              hasNext={currentIndex < newsItems.length - 1}
              hasPrev={currentIndex > 0}
            />
          </AnimatePresence>
        </motion.div>

        {/* Loading more indicator */}
        {isFetchingNextPage && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50">
            <div className="bg-black/40 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span className="text-xs text-white">Loading more...</span>
            </div>
          </div>
        )}
      </div>
    </PullToRefresh>
  );
}

function formatTimestamp(date?: string): string {
  if (!date) return "Just now";
  
  const now = new Date();
  const published = new Date(date);
  const diffMs = now.getTime() - published.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return published.toLocaleDateString();
}
