import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Loader2, TrendingUp, Clock, Sparkles, AlertCircle, RefreshCw, Star, Moon, Flame, Tv } from "lucide-react";
import { NewsCard, NewsItem } from "./NewsCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useInfiniteNews, NewsArticle } from "@/hooks/use-news";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useAuth } from "@/contexts/AuthContext";

type FeedType = "recent" | "trending" | "foryou" | "entertainment" | "horoscope";

const feedTabs: { id: FeedType; name: string; icon: React.ReactNode; description: string }[] = [
  { id: "recent", name: "Recent", icon: <Clock className="w-4 h-4" />, description: "Latest news first" },
  { id: "trending", name: "Trending", icon: <Flame className="w-4 h-4" />, description: "What's hot now" },
  { id: "foryou", name: "For You", icon: <Sparkles className="w-4 h-4" />, description: "Personalized" },
  { id: "entertainment", name: "Entertainment", icon: <Tv className="w-4 h-4" />, description: "Movies, Music, Celebs" },
  { id: "horoscope", name: "Horoscope", icon: <Moon className="w-4 h-4" />, description: "Daily predictions" },
];

const topics = [
  { slug: "all", name: "All" },
  { slug: "ai", name: "AI" },
  { slug: "business", name: "Business" },
  { slug: "finance", name: "Finance" },
  { slug: "politics", name: "Politics" },
  { slug: "sports", name: "Sports" },
  { slug: "health", name: "Health" },
  { slug: "tech", name: "Tech" },
  { slug: "climate", name: "Climate" },
  { slug: "startups", name: "Startups" },
];

// Transform API article to NewsItem format
function transformArticle(article: NewsArticle, feedType: FeedType): NewsItem {
  const publishedDate = new Date(article.published_at);
  const now = new Date();
  const diffHours = Math.floor((now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60));
  const timestamp = diffHours < 1 ? "Just now" : diffHours < 24 ? `${diffHours}h ago` : `${Math.floor(diffHours / 24)}d ago`;

  return {
    id: article.id,
    headline: article.headline,
    summary: article.summary || article.ai_analysis || "",
    content: article.content,
    topic: article.topic_slug || "world",
    sentiment: article.sentiment || "neutral",
    trustScore: article.trust_score || 85,
    source: article.source_name || "Unknown",
    sourceUrl: article.source_url || undefined,
    sourceIcon: article.source_logo || undefined,
    timestamp,
    imageUrl: article.image_url || undefined,
    whyMatters: article.why_matters || "This story provides insights into developments that could impact global trends.",
    countryCode: article.country_code || undefined,
    isGlobal: article.is_global,
    isBreaking: diffHours < 2 && feedType === "recent",
    isTrending: feedType === "trending",
  };
}

// Horoscope data generator
const zodiacSigns = [
  { name: "Aries", emoji: "♈", dates: "Mar 21 - Apr 19" },
  { name: "Taurus", emoji: "♉", dates: "Apr 20 - May 20" },
  { name: "Gemini", emoji: "♊", dates: "May 21 - Jun 20" },
  { name: "Cancer", emoji: "♋", dates: "Jun 21 - Jul 22" },
  { name: "Leo", emoji: "♌", dates: "Jul 23 - Aug 22" },
  { name: "Virgo", emoji: "♍", dates: "Aug 23 - Sep 22" },
  { name: "Libra", emoji: "♎", dates: "Sep 23 - Oct 22" },
  { name: "Scorpio", emoji: "♏", dates: "Oct 23 - Nov 21" },
  { name: "Sagittarius", emoji: "♐", dates: "Nov 22 - Dec 21" },
  { name: "Capricorn", emoji: "♑", dates: "Dec 22 - Jan 19" },
  { name: "Aquarius", emoji: "♒", dates: "Jan 20 - Feb 18" },
  { name: "Pisces", emoji: "♓", dates: "Feb 19 - Mar 20" },
];

const horoscopePredictions = [
  "Today brings exciting opportunities. Stay open to unexpected encounters.",
  "Financial decisions require careful thought. Trust your intuition.",
  "Romance is in the air. Express your feelings openly.",
  "Career prospects look bright. A mentor may offer guidance.",
  "Health matters need attention. Focus on self-care today.",
  "Creative energy flows. Channel it into meaningful projects.",
];

function generateHoroscopes(): NewsItem[] {
  return zodiacSigns.map((sign, i) => ({
    id: `horoscope-${sign.name}`,
    headline: `${sign.emoji} ${sign.name} - Daily Horoscope`,
    summary: horoscopePredictions[i % horoscopePredictions.length],
    topic: "horoscope",
    sentiment: "positive" as const,
    trustScore: 75,
    source: "NEWSTACK Astrology",
    timestamp: "Today",
    whyMatters: `Based on planetary alignments for ${sign.name} (${sign.dates}).`,
  }));
}

export function NewsFeed() {
  const { country, language } = usePreferences();
  const { user } = useAuth();
  const [feedType, setFeedType] = useState<FeedType>("recent");
  const [selectedTopic, setSelectedTopic] = useState("all");
  const loaderRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Swipe handling for mobile
  const x = useMotionValue(0);
  const currentTabIndex = feedTabs.findIndex(t => t.id === feedType);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x > threshold && currentTabIndex > 0) {
      setFeedType(feedTabs[currentTabIndex - 1].id);
    } else if (info.offset.x < -threshold && currentTabIndex < feedTabs.length - 1) {
      setFeedType(feedTabs[currentTabIndex + 1].id);
    }
  };

  // Build query params based on feed type
  const queryParams = useMemo(() => {
    let topic = selectedTopic !== "all" ? selectedTopic : undefined;
    
    // Override topic for special feeds
    if (feedType === "entertainment") {
      topic = "entertainment";
    }
    
    return {
      country: country?.code,
      language: language?.code === "en" ? "eng" : language?.code,
      topic,
      pageSize: 15,
      sortBy: feedType === "recent" ? "published_at" : feedType === "trending" ? "views_count" : undefined,
    };
  }, [country?.code, language?.code, selectedTopic, feedType]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteNews(queryParams);

  // Transform articles
  const newsItems = useMemo(() => {
    if (!data?.pages) return [];
    
    let items = data.pages.flatMap((page) => page.articles.map(a => transformArticle(a, feedType)));
    
    // Sort based on feed type
    if (feedType === "trending") {
      items = [...items].sort((a, b) => (b.trustScore || 0) - (a.trustScore || 0));
    } else if (feedType === "foryou" && user) {
      // Shuffle for personalized feel (in production, use user preferences)
      items = [...items].sort(() => Math.random() - 0.5);
    }
    
    return items;
  }, [data, feedType, user]);

  // Special content for horoscope feed
  const horoscopes = useMemo(() => {
    if (feedType === "horoscope") {
      return generateHoroscopes();
    }
    return [];
  }, [feedType]);

  const displayNews = feedType === "horoscope" ? horoscopes : newsItems;

  // Filter by topic (only for non-special feeds)
  const filteredNews = useMemo(() => {
    if (feedType === "entertainment" || feedType === "horoscope") {
      return displayNews;
    }
    return selectedTopic === "all" ? displayNews : displayNews.filter(n => n.topic.toLowerCase() === selectedTopic);
  }, [displayNews, selectedTopic, feedType]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage && feedType !== "horoscope") {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, feedType]);

  return (
    <section className="py-12 sm:py-20 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Section header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold mb-1">Your Feed</h2>
              <p className="text-sm text-muted-foreground">
                {country ? `${country.flag_emoji} ${country.name} & World` : "AI-curated stories"}
              </p>
            </div>
          </div>

          {/* Feed Type Tabs - Swipeable on mobile */}
          <div className="relative mb-4">
            <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
              {feedTabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={feedType === tab.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setFeedType(tab.id)}
                  className="flex-shrink-0 gap-2 snap-start"
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.name}</span>
                  <span className="sm:hidden">{tab.name}</span>
                </Button>
              ))}
            </div>
            
            {/* Active tab indicator */}
            <motion.div
              className="absolute bottom-0 h-0.5 bg-primary rounded-full"
              layoutId="feedTabIndicator"
              transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
            />
          </div>

          {/* Topic filters - Hidden for special feeds */}
          {feedType !== "entertainment" && feedType !== "horoscope" && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {topics.map((topic) => (
                <Button
                  key={topic.slug}
                  variant={selectedTopic === topic.slug ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedTopic(topic.slug)}
                  className="flex-shrink-0 text-xs h-8"
                >
                  {topic.name}
                </Button>
              ))}
            </div>
          )}

          {/* Feed description */}
          <div className="mt-3 flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {feedTabs.find(t => t.id === feedType)?.description}
            </Badge>
            {feedType === "foryou" && !user && (
              <Badge variant="secondary" className="text-xs">
                Sign in for personalized feed
              </Badge>
            )}
          </div>
        </motion.div>

        {/* Error state */}
        {isError && feedType !== "horoscope" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="font-display text-xl font-semibold mb-2">Failed to load news</h3>
            <p className="text-muted-foreground mb-4">
              {error instanceof Error ? error.message : "Please try again later"}
            </p>
            <Button onClick={() => refetch()} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          </motion.div>
        )}

        {/* Loading state */}
        {isLoading && feedType !== "horoscope" && (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="glass-card rounded-xl h-48 animate-pulse" />
            ))}
          </div>
        )}

        {/* News cards with swipe gesture */}
        {!isLoading && (
          <motion.div
            ref={containerRef}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
            style={{ x }}
            className="space-y-4 touch-pan-y"
          >
            <AnimatePresence mode="wait">
              {filteredNews.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <NewsCard news={item} index={index} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* No results */}
        {!isLoading && filteredNews.length === 0 && !isError && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No news found. Try selecting a different category.</p>
          </div>
        )}

        {/* Loading indicator */}
        <div ref={loaderRef} className="py-8 flex justify-center">
          {isFetchingNextPage && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading more...</span>
            </div>
          )}
          {!hasNextPage && filteredNews.length > 0 && feedType !== "horoscope" && (
            <p className="text-muted-foreground text-sm">You've reached the end.</p>
          )}
        </div>
      </div>
    </section>
  );
}
