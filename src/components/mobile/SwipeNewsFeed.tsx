import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { useInfiniteNews } from "@/hooks/use-news";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useOfflineCache } from "@/hooks/use-offline-cache";
import { SwipeNewsCard } from "./SwipeNewsCard";
import { PullToRefresh } from "./PullToRefresh";
import { 
  Loader2, Wifi, WifiOff, ChevronLeft, ChevronRight, 
  Briefcase, Cpu, Globe, Trophy, TrendingUp, Heart, Film, Leaf, Rocket, FlaskConical, Landmark
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { NewsItem } from "@/components/NewsCard";

interface SwipeNewsFeedProps {
  className?: string;
}

const CATEGORIES = [
  { id: "all", name: "All", icon: TrendingUp },
  { id: "business", name: "Business", icon: Briefcase },
  { id: "tech", name: "Tech", icon: Cpu },
  { id: "world", name: "World", icon: Globe },
  { id: "sports", name: "Sports", icon: Trophy },
  { id: "health", name: "Health", icon: Heart },
  { id: "entertainment", name: "Entertainment", icon: Film },
  { id: "climate", name: "Climate", icon: Leaf },
  { id: "startups", name: "Startups", icon: Rocket },
  { id: "science", name: "Science", icon: FlaskConical },
  { id: "politics", name: "Politics", icon: Landmark },
];

export function SwipeNewsFeed({ className = "" }: SwipeNewsFeedProps) {
  const { country, language } = usePreferences();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [showCategoryHint, setShowCategoryHint] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const categoryContainerRef = useRef<HTMLDivElement>(null);
  
  const { 
    cachedStories, 
    isOffline, 
    cacheStories, 
    hasCachedStories 
  } = useOfflineCache();

  const currentCategory = CATEGORIES[categoryIndex];
  
  const queryParams = {
    country: country?.code || "us",
    language: language?.code || "en",
    pageSize: 20,
    feedType: "trending" as const,
    topic: currentCategory.id === "all" ? undefined : currentCategory.id,
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

  // Use offline cache when offline
  const displayItems = isOffline && hasCachedStories ? cachedStories : newsItems;

  // Cache stories when they load (only when online)
  useEffect(() => {
    if (!isOffline && newsItems.length > 0) {
      cacheStories(newsItems);
    }
  }, [newsItems, isOffline, cacheStories]);

  // Hide category hint after a few seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowCategoryHint(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Reset story index when category changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [categoryIndex]);

  // Prefetch next page when near the end
  useEffect(() => {
    if (currentIndex >= displayItems.length - 5 && hasNextPage && !isFetchingNextPage && !isOffline) {
      fetchNextPage();
    }
  }, [currentIndex, displayItems.length, hasNextPage, isFetchingNextPage, fetchNextPage, isOffline]);

  const handleVerticalSwipe = useCallback((swipeDirection: "up" | "down") => {
    if (swipeDirection === "up" && currentIndex < displayItems.length - 1) {
      setDirection(1);
      setCurrentIndex((prev) => prev + 1);
    } else if (swipeDirection === "down" && currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex, displayItems.length]);

  const handleCategorySwipe = useCallback((swipeDirection: "left" | "right") => {
    if (swipeDirection === "left" && categoryIndex < CATEGORIES.length - 1) {
      setCategoryIndex((prev) => prev + 1);
    } else if (swipeDirection === "right" && categoryIndex > 0) {
      setCategoryIndex((prev) => prev - 1);
    }
  }, [categoryIndex]);

  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    const velocity = 500;

    // Vertical swipe (up/down) - change story
    if (Math.abs(info.offset.y) > Math.abs(info.offset.x)) {
      if (info.offset.y < -threshold || info.velocity.y < -velocity) {
        handleVerticalSwipe("up");
      } else if (info.offset.y > threshold || info.velocity.y > velocity) {
        handleVerticalSwipe("down");
      }
    } 
    // Horizontal swipe (left/right) - change category
    else {
      if (info.offset.x < -threshold || info.velocity.x < -velocity) {
        handleCategorySwipe("left");
      } else if (info.offset.x > threshold || info.velocity.x > velocity) {
        handleCategorySwipe("right");
      }
    }
  }, [handleVerticalSwipe, handleCategorySwipe]);

  const handleRefresh = async () => {
    setCurrentIndex(0);
    await refetch();
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "k") {
        handleVerticalSwipe("down");
      } else if (e.key === "ArrowDown" || e.key === "j" || e.key === " ") {
        handleVerticalSwipe("up");
      } else if (e.key === "ArrowLeft") {
        handleCategorySwipe("right");
      } else if (e.key === "ArrowRight") {
        handleCategorySwipe("left");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleVerticalSwipe, handleCategorySwipe]);

  // Scroll category into view
  useEffect(() => {
    if (categoryContainerRef.current) {
      const container = categoryContainerRef.current;
      const activeButton = container.children[categoryIndex] as HTMLElement;
      if (activeButton) {
        activeButton.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }
  }, [categoryIndex]);

  if (isLoading && !hasCachedStories) {
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

  if (isError && !hasCachedStories) {
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

  if (displayItems.length === 0) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background p-6">
        <Wifi className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Stories Available</h2>
        <p className="text-muted-foreground text-center">
          {isOffline ? "You're offline. Connect to load new stories." : "Check back later for the latest news."}
        </p>
      </div>
    );
  }

  const currentNews = displayItems[currentIndex];

  return (
    <PullToRefresh onRefresh={handleRefresh} className={`fixed inset-0 ${className}`}>
      <div 
        ref={containerRef}
        className="h-full w-full overflow-hidden"
      >
        {/* Offline indicator */}
        <AnimatePresence>
          {isOffline && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-1 left-1/2 -translate-x-1/2 z-50 bg-amber-500/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-2"
            >
              <WifiOff className="w-3 h-3 text-white" />
              <span className="text-xs text-white font-medium">Offline Mode</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress indicator */}
        <div className="fixed top-0 left-0 right-0 z-40 h-1 bg-muted">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / displayItems.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Category bar */}
        <div className="fixed top-2 left-0 right-0 z-40 px-2">
          <div 
            ref={categoryContainerRef}
            className="flex gap-2 overflow-x-auto scrollbar-hide py-1"
          >
            {CATEGORIES.map((cat, idx) => {
              const Icon = cat.icon;
              const isActive = idx === categoryIndex;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategoryIndex(idx)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-lg" 
                      : "bg-black/40 backdrop-blur-sm text-white/80 hover:bg-black/60"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cat.name}
                </button>
              );
            })}
          </div>
          
          {/* Swipe hint */}
          <AnimatePresence>
            {showCategoryHint && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute top-full left-1/2 -translate-x-1/2 mt-2 flex items-center gap-2 text-xs text-white/60"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Swipe left/right for categories</span>
                <ChevronRight className="w-4 h-4" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Story counter */}
        <div className="fixed top-12 right-3 z-40 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1">
          <span className="text-xs text-white font-medium">
            {currentIndex + 1} / {displayItems.length}
          </span>
        </div>

        {/* Category navigation arrows (visible on screen edges) */}
        {categoryIndex > 0 && (
          <button
            onClick={() => handleCategorySwipe("right")}
            className="fixed left-2 top-1/2 -translate-y-1/2 z-40 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white/70 hover:bg-black/50"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        {categoryIndex < CATEGORIES.length - 1 && (
          <button
            onClick={() => handleCategorySwipe("left")}
            className="fixed right-2 top-1/2 -translate-y-1/2 z-40 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white/70 hover:bg-black/50"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Swipe container */}
        <motion.div
          className="h-full w-full relative touch-pan-y"
          drag
          dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
        >
          <AnimatePresence mode="wait" custom={direction}>
            <SwipeNewsCard
              key={`${currentCategory.id}-${currentNews.id}`}
              news={currentNews}
              isActive={true}
              onSwipeUp={() => handleVerticalSwipe("up")}
              onSwipeDown={() => handleVerticalSwipe("down")}
              hasNext={currentIndex < displayItems.length - 1}
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
