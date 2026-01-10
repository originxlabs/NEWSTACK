import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { 
  Loader2, TrendingUp, Clock, Sparkles, AlertCircle, RefreshCw, 
  Flame, Globe, MapPin, Filter, ChevronDown, X, Calendar, Newspaper,
  Grid3X3, List, LayoutGrid, Search, SlidersHorizontal, Zap, Scale,
  Radio, Rss, History
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { NewsCard, NewsItem } from "@/components/NewsCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useInfiniteNews, NewsArticle } from "@/hooks/use-news";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useAuth } from "@/contexts/AuthContext";
import { TrendingNewsBanner } from "@/components/TrendingNewsBanner";
import { ArticleDetailPanel } from "@/components/ArticleDetailPanel";
import { ArticleComparison } from "@/components/ArticleComparison";
import { StoryTimeline } from "@/components/StoryTimeline";
import { useIsMobile } from "@/hooks/use-mobile";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, isToday, isYesterday, parseISO, startOfDay, endOfDay } from "date-fns";

type FeedType = "recent" | "trending" | "foryou" | "local" | "world";
type SortType = "latest" | "oldest" | "sources" | "discussed" | "relevance";
type ViewMode = "list" | "grid" | "compact";

const feedTabs: { id: FeedType; name: string; icon: React.ReactNode; description: string }[] = [
  { id: "recent", name: "Latest", icon: <Clock className="w-4 h-4" />, description: "Newest stories first" },
  { id: "trending", name: "Trending", icon: <Flame className="w-4 h-4" />, description: "What's hot now" },
  { id: "foryou", name: "For You", icon: <Sparkles className="w-4 h-4" />, description: "Personalized feed" },
  { id: "local", name: "Local", icon: <MapPin className="w-4 h-4" />, description: "Near you" },
  { id: "world", name: "World", icon: <Globe className="w-4 h-4" />, description: "Global news" },
];

const categories = [
  { slug: "all", name: "All Categories", icon: "📰" },
  { slug: "ai", name: "AI", icon: "🤖" },
  { slug: "business", name: "Business", icon: "💼" },
  { slug: "finance", name: "Finance", icon: "💰" },
  { slug: "politics", name: "Politics", icon: "🏛️" },
  { slug: "startups", name: "Startups", icon: "🚀" },
  { slug: "tech", name: "Technology", icon: "💻" },
  { slug: "climate", name: "Climate", icon: "🌍" },
  { slug: "health", name: "Health", icon: "🏥" },
  { slug: "sports", name: "Sports", icon: "⚽" },
  { slug: "entertainment", name: "Entertainment", icon: "🎬" },
  { slug: "science", name: "Science", icon: "🔬" },
];

const sortOptions: { id: SortType; name: string; icon: React.ReactNode }[] = [
  { id: "latest", name: "Newest First", icon: <Clock className="w-4 h-4" /> },
  { id: "oldest", name: "Oldest First", icon: <Clock className="w-4 h-4 rotate-180" /> },
  { id: "sources", name: "Most Sources", icon: <TrendingUp className="w-4 h-4" /> },
  { id: "relevance", name: "Most Relevant", icon: <MapPin className="w-4 h-4" /> },
];

const sourceFilters = [
  { id: "all", name: "All Sources" },
  { id: "bbc", name: "BBC News" },
  { id: "reuters", name: "Reuters" },
  { id: "guardian", name: "The Guardian" },
  { id: "nytimes", name: "New York Times" },
  { id: "washpost", name: "Washington Post" },
  { id: "techcrunch", name: "TechCrunch" },
  { id: "bloomberg", name: "Bloomberg" },
  { id: "ndtv", name: "NDTV" },
  { id: "hindustan", name: "Hindustan Times" },
];

function formatDateLabel(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE, MMM d, yyyy");
}

function transformArticle(article: NewsArticle, feedType: FeedType): NewsItem {
  const publishedDate = new Date(article.published_at);
  const now = new Date();
  const diffHours = Math.floor((now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((now.getTime() - publishedDate.getTime()) / (1000 * 60));
  
  let timestamp: string;
  if (diffMinutes < 1) {
    timestamp = "Just now";
  } else if (diffMinutes < 60) {
    timestamp = `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    timestamp = `${diffHours}h ago`;
  } else {
    const days = Math.floor(diffHours / 24);
    timestamp = days === 1 ? "1 day ago" : `${days} days ago`;
  }

  const locationRelevance = (article as any).location_relevance || 
    (article.is_global ? "Global" : "Country") as "Local" | "Country" | "Global";

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
    publishedAt: article.published_at,
    imageUrl: article.image_url || undefined,
    whyMatters: article.why_matters || "This story provides insights into developments that could impact global trends.",
    countryCode: article.country_code || undefined,
    isGlobal: article.is_global,
    isBreaking: diffMinutes < 30 && feedType === "recent",
    isTrending: feedType === "trending" || (article.source_count && article.source_count >= 2),
    sourceCount: article.source_count,
    locationRelevance,
  };
}

export default function News() {
  const { country, language } = usePreferences();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  const [feedType, setFeedType] = useState<FeedType>("recent");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["all"]);
  const [sortBy, setSortBy] = useState<SortType>("latest");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isVisible, setIsVisible] = useState(false);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [comparisonStory, setComparisonStory] = useState<{ headline: string; id?: string } | null>(null);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [timelineStory, setTimelineStory] = useState<{ id: string; headline: string } | null>(null);
  
  const loaderRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 50]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);

  // Lazy loading trigger
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Build query params based on feed type - now includes source filter for API
  const queryParams = useMemo(() => {
    let topic = selectedCategories.includes("all") ? undefined : selectedCategories[0];
    
    const apiFeedType = feedType === "recent" || feedType === "trending" || feedType === "foryou" 
      ? feedType 
      : "recent";
    
    // Map source filter ID to source name for API
    const sourceNameMap: Record<string, string> = {
      bbc: "BBC",
      reuters: "Reuters",
      guardian: "Guardian",
      nytimes: "New York Times",
      washpost: "Washington Post",
      techcrunch: "TechCrunch",
      bloomberg: "Bloomberg",
      ndtv: "NDTV",
      hindustan: "Hindustan Times",
    };
    
    return {
      country: feedType === "local" ? country?.code : undefined,
      language: language?.code === "en" ? "eng" : language?.code,
      topic,
      pageSize: 20,
      feedType: apiFeedType as "recent" | "trending" | "foryou",
      query: searchQuery || undefined,
      source: selectedSource !== "all" ? sourceNameMap[selectedSource] || selectedSource : undefined,
      dateFrom: selectedDate ? startOfDay(selectedDate).toISOString() : undefined,
      dateTo: selectedDate ? endOfDay(selectedDate).toISOString() : undefined,
    };
  }, [country?.code, language?.code, selectedCategories, feedType, searchQuery, selectedSource, selectedDate]);

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

  // Transform and sort articles
  const newsItems = useMemo(() => {
    if (!data?.pages) return [];
    
    let items = data.pages.flatMap((page) => page.articles.map(a => transformArticle(a, feedType)));

    // Note: Source and date filtering is now done server-side via API params
    // Client-side filtering is kept as fallback for cached data
    if (selectedDate) {
      const start = startOfDay(selectedDate);
      const end = endOfDay(selectedDate);
      items = items.filter(item => {
        if (!item.publishedAt) return false;
        const itemDate = parseISO(item.publishedAt);
        return itemDate >= start && itemDate <= end;
      });
    }
    
    // Apply sorting
    switch (sortBy) {
      case "oldest":
        items = [...items].sort((a, b) => {
          if (!a.publishedAt || !b.publishedAt) return 0;
          return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
        });
        break;
      case "sources":
        items = [...items].sort((a, b) => (b.sourceCount || 0) - (a.sourceCount || 0));
        break;
      case "relevance":
        items = [...items].sort((a, b) => {
          const order = { Local: 3, Country: 2, Global: 1 };
          return (order[b.locationRelevance || "Global"] || 0) - (order[a.locationRelevance || "Global"] || 0);
        });
        break;
      default:
        break;
    }

    // Filter by feed type
    if (feedType === "world") {
      items = items.filter(item => item.isGlobal || item.locationRelevance === "Global");
    } else if (feedType === "local") {
      items = items.filter(item => item.locationRelevance === "Local" || item.locationRelevance === "Country");
    }
    
    return items;
  }, [data, feedType, sortBy, selectedSource, selectedDate]);

  // Group articles by date
  const groupedByDate = useMemo(() => {
    const groups: Record<string, NewsItem[]> = {};
    newsItems.forEach(item => {
      if (!item.publishedAt) return;
      const dateKey = format(parseISO(item.publishedAt), "yyyy-MM-dd");
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(item);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [newsItems]);

  // Get trending stories for banner
  const trendingStories = useMemo(() => {
    if (feedType !== "recent") return [];
    return newsItems
      .filter(item => item.sourceCount && item.sourceCount > 1)
      .slice(0, 3)
      .map(item => ({
        id: item.id,
        headline: item.headline,
        summary: item.summary,
        source: item.source,
        sourceUrl: item.sourceUrl,
        timestamp: item.timestamp,
        imageUrl: item.imageUrl,
        sourceCount: item.sourceCount,
      }));
  }, [newsItems, feedType]);

  // Filter by categories
  const filteredNews = useMemo(() => {
    if (selectedCategories.includes("all")) return newsItems;
    return newsItems.filter(n => selectedCategories.includes(n.topic.toLowerCase()));
  }, [newsItems, selectedCategories]);

  // Toggle category selection
  const toggleCategory = useCallback((slug: string) => {
    if (slug === "all") {
      setSelectedCategories(["all"]);
    } else {
      setSelectedCategories(prev => {
        const withoutAll = prev.filter(c => c !== "all");
        if (prev.includes(slug)) {
          const newSelection = withoutAll.filter(c => c !== slug);
          return newSelection.length === 0 ? ["all"] : newSelection;
        }
        return [...withoutAll, slug];
      });
    }
  }, []);

  // Handle article click
  const handleArticleClick = useCallback((article: NewsItem) => {
    setSelectedArticle(article);
    setIsPanelOpen(true);
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSelectedCategories(["all"]);
    setSortBy("latest");
    setSelectedSource("all");
    setSelectedDate(undefined);
    setSearchQuery("");
  }, []);

  const hasActiveFilters = !selectedCategories.includes("all") || sortBy !== "latest" || selectedSource !== "all" || selectedDate || searchQuery;

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-12" ref={containerRef}>
        {/* Hero Banner with Dynamic Animations */}
        <motion.section 
          ref={heroRef}
          style={{ y: heroY, opacity: heroOpacity }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative bg-gradient-to-br from-primary/5 via-background to-accent/5 border-b border-border/50 overflow-hidden"
        >
          {/* Animated Background Elements */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Glowing orbs */}
            <motion.div
              className="absolute top-10 left-1/4 w-32 h-32 bg-primary/10 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute bottom-10 right-1/4 w-40 h-40 bg-accent/10 rounded-full blur-3xl"
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
            
            {/* Floating particles */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 bg-primary/40 rounded-full"
                style={{
                  left: `${10 + (i * 8)}%`,
                  top: `${20 + (i % 3) * 25}%`,
                }}
                animate={{
                  y: [0, -15, 0],
                  opacity: [0.2, 0.8, 0.2],
                  scale: [0.8, 1.2, 0.8],
                }}
                transition={{
                  duration: 2 + (i % 3),
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut",
                }}
              />
            ))}

            {/* Animated grid lines */}
            <motion.div
              className="absolute inset-0 opacity-[0.02]"
              style={{
                backgroundImage: `linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)`,
                backgroundSize: '60px 60px'
              }}
              animate={{
                opacity: [0.02, 0.04, 0.02],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </div>

          <div className="container mx-auto px-4 py-10 md:py-16 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              {/* Live Badge with pulse */}
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.1, type: "spring", damping: 20 }}
                className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full glass-card mb-6"
              >
                <motion.div
                  className="flex items-center gap-2"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Radio className="w-4 h-4 text-green-500" />
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                </motion.div>
                <span className="text-sm font-medium text-foreground">Live from 20+ verified sources</span>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                  <Rss className="w-4 h-4 text-primary" />
                </motion.div>
              </motion.div>
              
              {/* Main Headline with letter spacing animation */}
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, type: "spring", damping: 20 }}
                className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight"
              >
                <motion.span 
                  className="text-foreground inline-block mr-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Your
                </motion.span>
                <motion.span 
                  className="text-foreground inline-block mr-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  Daily
                </motion.span>
                <br className="sm:hidden" />
                <motion.span 
                  className="gradient-text inline-block relative"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", damping: 15 }}
                >
                  News Hub
                  <motion.span
                    className="absolute -right-6 -top-2"
                    animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Zap className="w-5 h-5 text-yellow-500" />
                  </motion.span>
                </motion.span>
              </motion.h1>
              
              {/* Subtitle with staggered words */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-muted-foreground text-base md:text-lg lg:text-xl max-w-2xl mx-auto mb-8 leading-relaxed"
              >
                Curated news from{" "}
                <motion.span 
                  className="text-foreground font-medium"
                  whileHover={{ color: "hsl(var(--primary))" }}
                >
                  BBC, Reuters, The Guardian, NYT
                </motion.span>
                {" "}and more — with AI summaries, audio listening, and real-time updates.
              </motion.p>

              {/* Search Bar with animated focus */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="max-w-xl mx-auto relative group"
              >
                <motion.div
                  className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  type="text"
                  placeholder="Search news, topics, or sources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 h-14 text-base rounded-full bg-background/80 backdrop-blur-sm border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                />
              </motion.div>

              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex items-center justify-center gap-6 mt-8"
              >
                {[
                  { icon: Newspaper, label: "300+ Daily", color: "text-primary" },
                  { icon: Globe, label: "20+ Sources", color: "text-accent" },
                  { icon: Sparkles, label: "AI Powered", color: "text-yellow-500" },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                    whileHover={{ scale: 1.05 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                  >
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                    <span>{stat.label}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Filters Bar */}
        <section className="sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50">
          <div className="container mx-auto px-4 py-3">
            <div className="flex flex-col gap-3">
              {/* Feed Type Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {feedTabs.map((tab) => (
                  <Button
                    key={tab.id}
                    variant={feedType === tab.id ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setFeedType(tab.id)}
                    className="flex-shrink-0 gap-2"
                  >
                    {tab.icon}
                    {tab.name}
                  </Button>
                ))}
                
                <div className="ml-auto flex items-center gap-2">
                  {/* Date Picker */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Calendar className="w-4 h-4" />
                        <span className="hidden sm:inline">
                          {selectedDate ? format(selectedDate, "MMM d") : "Date"}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <CalendarComponent
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                      />
                      {selectedDate && (
                        <div className="p-2 border-t">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full"
                            onClick={() => setSelectedDate(undefined)}
                          >
                            Clear Date
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>

                  {/* Source Filter */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Globe className="w-4 h-4" />
                        <span className="hidden sm:inline">Source</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Filter by Source</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {sourceFilters.map((source) => (
                        <DropdownMenuItem
                          key={source.id}
                          onClick={() => setSelectedSource(source.id)}
                          className={selectedSource === source.id ? "bg-accent" : ""}
                        >
                          {source.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Sort */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <SlidersHorizontal className="w-4 h-4" />
                        <span className="hidden sm:inline">Sort</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {sortOptions.map((option) => (
                        <DropdownMenuItem
                          key={option.id}
                          onClick={() => setSortBy(option.id)}
                          className={sortBy === option.id ? "bg-accent" : ""}
                        >
                          {option.icon}
                          <span className="ml-2">{option.name}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* View Mode */}
                  <div className="hidden md:flex items-center border rounded-lg overflow-hidden">
                    <Button
                      variant={viewMode === "list" ? "secondary" : "ghost"}
                      size="sm"
                      className="rounded-none h-8"
                      onClick={() => setViewMode("list")}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === "grid" ? "secondary" : "ghost"}
                      size="sm"
                      className="rounded-none h-8"
                      onClick={() => setViewMode("grid")}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === "compact" ? "secondary" : "ghost"}
                      size="sm"
                      className="rounded-none h-8"
                      onClick={() => setViewMode("compact")}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {categories.map((category) => {
                  const isSelected = selectedCategories.includes(category.slug);
                  return (
                    <Button
                      key={category.slug}
                      variant={isSelected ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => toggleCategory(category.slug)}
                      className="flex-shrink-0 text-xs h-8 gap-1.5"
                    >
                      <span>{category.icon}</span>
                      {category.name}
                      {isSelected && category.slug !== "all" && (
                        <X className="w-3 h-3 ml-1" onClick={(e) => {
                          e.stopPropagation();
                          toggleCategory(category.slug);
                        }} />
                      )}
                    </Button>
                  );
                })}
              </div>

              {/* Active Filters Summary */}
              {hasActiveFilters && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground">Active filters:</span>
                  {!selectedCategories.includes("all") && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedCategories.length} categories
                    </Badge>
                  )}
                  {sortBy !== "latest" && (
                    <Badge variant="secondary" className="text-xs">
                      {sortOptions.find(s => s.id === sortBy)?.name}
                    </Badge>
                  )}
                  {selectedSource !== "all" && (
                    <Badge variant="secondary" className="text-xs">
                      {sourceFilters.find(s => s.id === selectedSource)?.name}
                    </Badge>
                  )}
                  {selectedDate && (
                    <Badge variant="secondary" className="text-xs">
                      {format(selectedDate, "MMM d, yyyy")}
                    </Badge>
                  )}
                  {searchQuery && (
                    <Badge variant="secondary" className="text-xs">
                      "{searchQuery}"
                    </Badge>
                  )}
                  <Button variant="ghost" size="sm" className="text-xs h-6" onClick={clearFilters}>
                    Clear all
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-6 px-4">
          <div className="container mx-auto">
            <div className={`flex gap-6 ${!isMobile && isPanelOpen ? "max-w-7xl" : "max-w-5xl"} mx-auto`}>
              {/* Main Feed */}
              <div className={`flex-1 min-w-0 ${!isMobile && isPanelOpen ? "max-w-[calc(100%-520px)]" : ""}`}>
                {/* Trending Banner */}
                {feedType === "recent" && trendingStories.length > 0 && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6"
                  >
                    <TrendingNewsBanner stories={trendingStories} />
                  </motion.div>
                )}

                {/* Results Count */}
                {!isLoading && filteredNews.length > 0 && (
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {filteredNews.length} stories
                      {country && ` • ${country.flag_emoji} ${country.name} & World`}
                    </p>
                  </div>
                )}

                {/* Error State */}
                {isError && (
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

                {/* Loading State */}
                {isLoading && (
                  <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-4"}>
                    {[...Array(6)].map((_, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass-card rounded-xl h-48 animate-pulse" 
                      />
                    ))}
                  </div>
                )}

                {/* News Cards - Grouped by Date */}
                {!isLoading && isVisible && (
                  <div className="space-y-8">
                    {groupedByDate.map(([dateKey, articles], groupIndex) => (
                      <motion.div
                        key={dateKey}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: groupIndex * 0.1 }}
                      >
                        {/* Date Header */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                            <Calendar className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium text-primary">
                              {formatDateLabel(dateKey)}
                            </span>
                          </div>
                          <div className="flex-1 h-px bg-border" />
                          <span className="text-xs text-muted-foreground">
                            {articles.length} {articles.length === 1 ? "story" : "stories"}
                          </span>
                        </div>

                        {/* Articles Grid/List */}
                        <div className={
                          viewMode === "grid" 
                            ? "grid grid-cols-1 md:grid-cols-2 gap-4" 
                            : viewMode === "compact"
                            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
                            : "space-y-4"
                        }>
                          <AnimatePresence mode="popLayout">
                            {articles.map((item, index) => (
                              <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: index * 0.03 }}
                                layout
                              >
                                <NewsCard 
                                  news={item} 
                                  index={index} 
                                  onClick={() => handleArticleClick(item)}
                                  isActive={selectedArticle?.id === item.id && isPanelOpen}
                                  compact={viewMode === "compact"}
                                />
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* No Results */}
                {!isLoading && filteredNews.length === 0 && !isError && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16"
                  >
                    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                      <Newspaper className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-display text-lg font-semibold mb-2">No news found</h3>
                    <p className="text-muted-foreground mb-4">Try adjusting your filters or search query.</p>
                    <Button variant="outline" onClick={clearFilters}>
                      Clear all filters
                    </Button>
                  </motion.div>
                )}

                {/* Loading More */}
                <div ref={loaderRef} className="py-8 flex justify-center">
                  {isFetchingNextPage && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2 text-muted-foreground"
                    >
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Loading more stories...</span>
                    </motion.div>
                  )}
                  {!hasNextPage && filteredNews.length > 0 && (
                    <p className="text-muted-foreground text-sm">You've reached the end. Check back soon for more news.</p>
                  )}
                </div>
              </div>

              {/* Desktop: Inline panel space holder */}
              {!isMobile && isPanelOpen && (
                <div className="hidden lg:block w-[520px] flex-shrink-0" />
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Article Detail Panel */}
      <ArticleDetailPanel
        article={selectedArticle}
        isOpen={isPanelOpen}
        onClose={() => {
          setIsPanelOpen(false);
          setSelectedArticle(null);
        }}
        onCompare={(headline, id) => {
          setComparisonStory({ headline, id });
          setComparisonOpen(true);
        }}
        onViewTimeline={(id, headline) => {
          setTimelineStory({ id, headline });
          setTimelineOpen(true);
        }}
      />

      {/* Article Comparison Modal */}
      <ArticleComparison
        storyHeadline={comparisonStory?.headline || ""}
        storyId={comparisonStory?.id}
        isOpen={comparisonOpen}
        onClose={() => {
          setComparisonOpen(false);
          setComparisonStory(null);
        }}
      />

      {/* Story Timeline Modal */}
      <StoryTimeline
        storyId={timelineStory?.id || ""}
        headline={timelineStory?.headline || ""}
        isOpen={timelineOpen}
        onClose={() => {
          setTimelineOpen(false);
          setTimelineStory(null);
        }}
      />
    </div>
  );
}