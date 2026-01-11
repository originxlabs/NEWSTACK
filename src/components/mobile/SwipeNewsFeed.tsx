import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInfiniteNews } from "@/hooks/use-news";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useOfflineCache } from "@/hooks/use-offline-cache";
import { useCategoryPreferences } from "@/hooks/use-category-preferences";
import { useHaptic } from "@/hooks/use-haptic";
import { SwipeNewsCard } from "./SwipeNewsCard";
import { NLogoSquare } from "@/components/NLogo";
import { 
  Loader2, Wifi, WifiOff, ChevronLeft, ChevronRight, RefreshCw, Settings,
  Home, Newspaper, Headphones, MapPin, User, MoreHorizontal, CloudOff, Cloud
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import type { NewsItem } from "@/components/NewsCard";

interface SwipeNewsFeedProps {
  className?: string;
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  isDragging: boolean;
  direction: "horizontal" | "vertical" | null;
}

export function SwipeNewsFeed({ className = "" }: SwipeNewsFeedProps) {
  const { country, language } = usePreferences();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<"up" | "down">("up");
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [showCategoryHint, setShowCategoryHint] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const categoryContainerRef = useRef<HTMLDivElement>(null);
  const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const touchRef = useRef<TouchState>({
    startX: 0,
    startY: 0,
    startTime: 0,
    isDragging: false,
    direction: null,
  });
  
  const { 
    cachedStories, 
    isOffline, 
    cacheStories, 
    hasCachedStories,
    isSyncing,
    cachedCount
  } = useOfflineCache();
  
  const location = useLocation();

  const { enabledCategories, isLoaded: categoriesLoaded } = useCategoryPreferences();
  const { trigger: haptic } = useHaptic();
  const hapticEnabled = localStorage.getItem("newstack_haptic_enabled") !== "false";

  const currentCategory = enabledCategories[categoryIndex] || enabledCategories[0];
  
  const queryParams = {
    country: country?.code || "us",
    language: language?.code || "en",
    pageSize: 50, // Increased from 20 to 50
    feedType: "trending" as const,
    topic: currentCategory?.id === "all" ? undefined : currentCategory?.id,
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
    const timer = setTimeout(() => setShowCategoryHint(false), 4000);
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

  const goToNext = useCallback(() => {
    if (currentIndex < displayItems.length - 1 && !isAnimating) {
      setIsAnimating(true);
      setSlideDirection("up");
      setCurrentIndex((prev) => prev + 1);
      if (hapticEnabled) haptic("light");
      setTimeout(() => setIsAnimating(false), 300);
    }
  }, [currentIndex, displayItems.length, isAnimating, hapticEnabled, haptic]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0 && !isAnimating) {
      setIsAnimating(true);
      setSlideDirection("down");
      setCurrentIndex((prev) => prev - 1);
      if (hapticEnabled) haptic("light");
      setTimeout(() => setIsAnimating(false), 300);
    }
  }, [currentIndex, isAnimating, hapticEnabled, haptic]);

  const goToNextCategory = useCallback(() => {
    if (categoryIndex < enabledCategories.length - 1 && !isAnimating) {
      setCategoryIndex((prev) => prev + 1);
      if (hapticEnabled) haptic("medium");
    }
  }, [categoryIndex, enabledCategories.length, isAnimating, hapticEnabled, haptic]);

  const goToPrevCategory = useCallback(() => {
    if (categoryIndex > 0 && !isAnimating) {
      setCategoryIndex((prev) => prev - 1);
      if (hapticEnabled) haptic("medium");
    }
  }, [categoryIndex, isAnimating, hapticEnabled, haptic]);

  // Native touch handling for instant swipe response
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Don't start tracking if we're at the top and pulling down
    const touch = e.touches[0];
    touchRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      isDragging: true,
      direction: null,
    };
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchRef.current.isDragging) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchRef.current.startX;
    const deltaY = touch.clientY - touchRef.current.startY;
    
    // Lock direction on first significant move (very low threshold for instant response)
    if (!touchRef.current.direction) {
      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        // Prioritize vertical swipe for news navigation
        touchRef.current.direction = Math.abs(deltaY) >= Math.abs(deltaX) ? "vertical" : "horizontal";
      }
    }
    
    // Prevent default scrolling for vertical swipes to enable smooth card transitions
    if (touchRef.current.direction === "vertical") {
      e.preventDefault();
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchRef.current.isDragging) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchRef.current.startX;
    const deltaY = touch.clientY - touchRef.current.startY;
    const deltaTime = Date.now() - touchRef.current.startTime;
    
    // Calculate velocity for quick swipes
    const velocityX = Math.abs(deltaX) / deltaTime;
    const velocityY = Math.abs(deltaY) / deltaTime;
    
    // Faster, more responsive thresholds
    const minSwipeDistance = 30;
    const minVelocity = 0.15;
    
    // Determine swipe based on direction lock
    if (touchRef.current.direction === "vertical") {
      const isQuickSwipe = velocityY > minVelocity;
      const isFarEnough = Math.abs(deltaY) > minSwipeDistance;
      
      if (isQuickSwipe || isFarEnough) {
        if (deltaY < 0) {
          // Swipe up - go to next
          goToNext();
        } else {
          // Swipe down - go to previous
          goToPrev();
        }
      }
    } else if (touchRef.current.direction === "horizontal") {
      const isQuickSwipe = velocityX > minVelocity;
      const isFarEnough = Math.abs(deltaX) > minSwipeDistance;
      
      if (isQuickSwipe || isFarEnough) {
        if (deltaX < 0) {
          goToNextCategory();
        } else {
          goToPrevCategory();
        }
      }
    }
    
    touchRef.current.isDragging = false;
    touchRef.current.direction = null;
  }, [goToNext, goToPrev, goToNextCategory, goToPrevCategory]);

  const handleRefresh = useCallback(async () => {
    setCurrentIndex(0);
    await refetch();
    setLastRefreshed(new Date());
  }, [refetch]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
    
    const performAutoRefresh = async () => {
      if (!isOffline && !isLoading && !isFetchingNextPage) {
        setIsAutoRefreshing(true);
        try {
          await refetch();
          setLastRefreshed(new Date());
        } finally {
          setIsAutoRefreshing(false);
        }
      }
    };

    autoRefreshIntervalRef.current = setInterval(performAutoRefresh, AUTO_REFRESH_INTERVAL);

    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
    };
  }, [isOffline, isLoading, isFetchingNextPage, refetch]);

  // Format last refreshed time
  const getLastRefreshedText = () => {
    const now = new Date();
    const diffMs = now.getTime() - lastRefreshed.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 60) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    return lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "k") {
        goToPrev();
      } else if (e.key === "ArrowDown" || e.key === "j" || e.key === " ") {
        e.preventDefault();
        goToNext();
      } else if (e.key === "ArrowLeft") {
        goToPrevCategory();
      } else if (e.key === "ArrowRight") {
        goToNextCategory();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNext, goToPrev, goToNextCategory, goToPrevCategory]);

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

  if (!categoriesLoaded || (isLoading && !hasCachedStories)) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/20 blur-3xl"
          />
          <motion.div
            animate={{ 
              scale: [1.2, 1, 1.2],
              opacity: [0.1, 0.15, 0.1]
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-primary/15 blur-3xl"
          />
        </div>

        {/* Main Content */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="relative z-10 flex flex-col items-center"
        >
          {/* Animated N Logo */}
          <motion.div
            animate={{ 
              rotateY: [0, 360],
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut",
              repeatDelay: 0.5
            }}
            className="relative mb-6 text-foreground"
            style={{ perspective: 1000 }}
          >
            <NLogoSquare size={72} />
            {/* Glow ring */}
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-2xl border-2 border-primary/50"
            />
          </motion.div>

          {/* Brand Name */}
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold font-display bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-2"
          >
            NEWSTACK
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-sm text-muted-foreground mb-6"
          >
            Global News Intelligence
          </motion.p>

          {/* Loading Indicator */}
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex gap-1">
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    scaleY: [1, 2, 1],
                    backgroundColor: ["hsl(var(--primary))", "hsl(var(--primary) / 0.5)", "hsl(var(--primary))"]
                  }}
                  transition={{ 
                    duration: 0.8, 
                    repeat: Infinity, 
                    delay: i * 0.15,
                    ease: "easeInOut"
                  }}
                  className="w-1 h-4 rounded-full bg-primary"
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">Loading stories...</span>
          </motion.div>

          {/* Progress bar */}
          <motion.div 
            className="w-48 h-1 bg-muted rounded-full mt-6 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </motion.div>
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

  // Slide animation variants
  const slideVariants = {
    enter: (direction: "up" | "down") => ({
      y: direction === "up" ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      y: 0,
      opacity: 1,
    },
    exit: (direction: "up" | "down") => ({
      y: direction === "up" ? "-100%" : "100%",
      opacity: 0,
    }),
  };

  return (
    <div className={`fixed inset-0 ${className}`}>
      {/* Main swipe container */}
      <div 
        ref={containerRef}
        className="h-full w-full overflow-hidden select-none"
        style={{ touchAction: "none" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Offline/Sync indicator - hide count */}
        <AnimatePresence>
          {(isOffline || isSyncing) && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-1 left-1/2 -translate-x-1/2 z-50 backdrop-blur-md rounded-full px-4 py-1.5 flex items-center gap-2 shadow-lg ${
                isSyncing 
                  ? "bg-primary/90" 
                  : "bg-amber-500/90"
              }`}
            >
              {isSyncing ? (
                <>
                  <Cloud className="w-3.5 h-3.5 text-white animate-pulse" />
                  <span className="text-xs text-white font-medium">Syncing...</span>
                </>
              ) : (
                <>
                  <CloudOff className="w-3.5 h-3.5 text-white" />
                  <span className="text-xs text-white font-medium">Offline Mode</span>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress indicator */}
        <div className="fixed top-0 left-0 right-0 z-40 h-1 bg-muted">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / displayItems.length) * 100}%` }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          />
        </div>

        {/* Category bar */}
        <div className="fixed top-2 left-0 right-0 z-40 px-2 safe-area-top">
          <div className="flex items-center gap-2">
            <div 
              ref={categoryContainerRef}
              className="flex-1 flex gap-2 overflow-x-auto scrollbar-hide py-1"
            >
              {enabledCategories.map((cat, idx) => {
                const Icon = cat.icon;
                const isActive = idx === categoryIndex;
                return (
                  <motion.button
                    key={cat.id}
                    onClick={() => {
                      setCategoryIndex(idx);
                      if (hapticEnabled) haptic("light");
                    }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                      isActive 
                        ? "bg-primary text-primary-foreground shadow-lg scale-105" 
                        : "bg-black/40 backdrop-blur-sm text-white/80 active:bg-black/60"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {cat.name}
                  </motion.button>
                );
              })}
            </div>
            
            {/* More menu button with Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  className="flex-shrink-0 w-9 h-9 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white shadow-lg border border-white/10"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </motion.button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 bg-background/95 backdrop-blur-xl">
                <div className="flex flex-col gap-1 mt-6">
                  <Link
                    to="/world"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Wifi className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <span className="font-medium">World News</span>
                      <p className="text-xs text-muted-foreground">Global headlines</p>
                    </div>
                  </Link>
                  <Link
                    to="/topics"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Newspaper className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <span className="font-medium">Topics</span>
                      <p className="text-xs text-muted-foreground">Browse by category</p>
                    </div>
                  </Link>
                  <Link
                    to="/saved"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Newspaper className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <span className="font-medium">Saved Articles</span>
                      <p className="text-xs text-muted-foreground">Your bookmarks</p>
                    </div>
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Settings className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <span className="font-medium">Settings</span>
                      <p className="text-xs text-muted-foreground">Preferences & more</p>
                    </div>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
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

        {/* Refresh button only - no story count for cleaner native look */}
        <div className="fixed top-12 right-3 z-40">
          <motion.button 
            onClick={handleRefresh}
            disabled={isAutoRefreshing}
            className="bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-md active:bg-black/60"
            whileTap={{ scale: 0.95 }}
            animate={isAutoRefreshing ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 0.5, repeat: isAutoRefreshing ? Infinity : 0 }}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-white/90 ${isAutoRefreshing ? 'animate-spin' : ''}`} />
            <span className="text-xs text-white/90 font-medium">
              {isAutoRefreshing ? 'Refreshing' : getLastRefreshedText()}
            </span>
          </motion.button>
        </div>


        {/* Swipe container with native-like animations */}
        <div className="h-full w-full relative">
          <AnimatePresence mode="popLayout" custom={slideDirection}>
            <motion.div
              key={`${currentCategory?.id}-${currentNews.id}`}
              custom={slideDirection}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 35,
                mass: 0.8,
              }}
              className="absolute inset-0"
            >
              <SwipeNewsCard
                news={currentNews}
                isActive={true}
                onSwipeUp={goToNext}
                onSwipeDown={goToPrev}
                hasNext={currentIndex < displayItems.length - 1}
                hasPrev={currentIndex > 0}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Loading more indicator - positioned above bottom nav */}
        {isFetchingNextPage && (
          <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-40">
            <div className="bg-black/70 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2 shadow-lg">
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span className="text-xs text-white font-medium">Loading more...</span>
            </div>
          </div>
        )}

        {/* Bottom Navigation Bar - Fixed with proper safe area */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/98 backdrop-blur-xl border-t border-border/50">
          <div className="flex items-center justify-around py-2 px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            {[
              { path: "/", icon: Home, label: "Home" },
              { path: "/news", icon: Newspaper, label: "News" },
              { path: "/listen", icon: Headphones, label: "Listen" },
              { path: "/places", icon: MapPin, label: "Places" },
              { path: "/profile", icon: User, label: "Profile" },
            ].map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path === "/" && location.pathname === "/news") ||
                (item.path === "/news" && location.pathname === "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex flex-col items-center gap-0.5 flex-1 py-1"
                >
                  <motion.div
                    whileTap={{ scale: 0.85 }}
                    className={`p-2 rounded-2xl transition-all duration-200 ${
                      isActive 
                        ? "bg-primary/15 shadow-sm" 
                        : "active:bg-muted"
                    }`}
                  >
                    <Icon className={`w-5 h-5 transition-colors ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`} />
                  </motion.div>
                  <span className={`text-[10px] font-medium transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
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
