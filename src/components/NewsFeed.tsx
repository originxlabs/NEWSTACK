import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, TrendingUp, Clock, Sparkles, AlertCircle, RefreshCw, 
  Flame, Globe, MapPin, Filter, ChevronDown, X, Headphones, MessageSquare
} from "lucide-react";
import { NewsCard, NewsItem } from "./NewsCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useInfiniteNews, NewsArticle } from "@/hooks/use-news";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useAuth } from "@/contexts/AuthContext";
import { TrendingNewsBanner } from "./TrendingNewsBanner";
import { ArticleDetailPanel } from "./ArticleDetailPanel";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type FeedType = "recent" | "trending" | "foryou" | "local" | "world";
type SortType = "latest" | "sources" | "discussed" | "audio" | "relevance";

const feedTabs: { id: FeedType; name: string; icon: React.ReactNode; description: string }[] = [
  { id: "recent", name: "Recent", icon: <Clock className="w-4 h-4" />, description: "Latest news first" },
  { id: "trending", name: "Trending", icon: <Flame className="w-4 h-4" />, description: "What's hot now" },
  { id: "foryou", name: "For You", icon: <Sparkles className="w-4 h-4" />, description: "Personalized" },
  { id: "local", name: "Local", icon: <MapPin className="w-4 h-4" />, description: "Near you" },
  { id: "world", name: "World", icon: <Globe className="w-4 h-4" />, description: "Global news" },
];

const categories = [
  { slug: "all", name: "All" },
  { slug: "ai", name: "AI" },
  { slug: "business", name: "Business" },
  { slug: "finance", name: "Finance" },
  { slug: "politics", name: "Politics" },
  { slug: "startups", name: "Startups" },
  { slug: "tech", name: "Tech" },
  { slug: "climate", name: "Climate" },
  { slug: "health", name: "Health" },
  { slug: "sports", name: "Sports" },
  { slug: "entertainment", name: "Entertainment" },
  { slug: "science", name: "Science" },
];

const sortOptions: { id: SortType; name: string; icon: React.ReactNode }[] = [
  { id: "latest", name: "Latest first", icon: <Clock className="w-4 h-4" /> },
  { id: "sources", name: "Most sources", icon: <TrendingUp className="w-4 h-4" /> },
  { id: "discussed", name: "Most discussed", icon: <MessageSquare className="w-4 h-4" /> },
  { id: "audio", name: "Audio available", icon: <Headphones className="w-4 h-4" /> },
  { id: "relevance", name: "Local relevance", icon: <MapPin className="w-4 h-4" /> },
];

function transformArticle(article: NewsArticle, feedType: FeedType): NewsItem {
  const publishedDate = new Date(article.published_at);
  const now = new Date();
  const diffHours = Math.floor((now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60));
  const timestamp = diffHours < 1 ? "Just now" : diffHours < 24 ? `${diffHours}h ago` : `${Math.floor(diffHours / 24)}d ago`;

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
    imageUrl: article.image_url || undefined,
    whyMatters: article.why_matters || "This story provides insights into developments that could impact global trends.",
    countryCode: article.country_code || undefined,
    isGlobal: article.is_global,
    isBreaking: diffHours < 2 && feedType === "recent",
    isTrending: feedType === "trending" || (article.source_count && article.source_count >= 2),
    sourceCount: article.source_count,
    locationRelevance,
  };
}

export function NewsFeed() {
  const { country, language } = usePreferences();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [feedType, setFeedType] = useState<FeedType>("recent");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["all"]);
  const [sortBy, setSortBy] = useState<SortType>("latest");
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Build query params based on feed type
  const queryParams = useMemo(() => {
    let topic = selectedCategories.includes("all") ? undefined : selectedCategories[0];
    
    const apiFeedType = feedType === "recent" || feedType === "trending" || feedType === "foryou" 
      ? feedType 
      : "recent";
    
    return {
      country: feedType === "local" ? country?.code : undefined,
      language: language?.code === "en" ? "eng" : language?.code,
      topic,
      pageSize: 15,
      feedType: apiFeedType as "recent" | "trending" | "foryou",
    };
  }, [country?.code, language?.code, selectedCategories, feedType]);

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
    
    // Apply sorting
    switch (sortBy) {
      case "sources":
        items = [...items].sort((a, b) => (b.sourceCount || 0) - (a.sourceCount || 0));
        break;
      case "relevance":
        items = [...items].sort((a, b) => {
          const order = { Local: 3, Country: 2, Global: 1 };
          return (order[b.locationRelevance || "Global"] || 0) - (order[a.locationRelevance || "Global"] || 0);
        });
        break;
      case "discussed":
        // Shuffle for now - in production would sort by comment count
        items = [...items].sort(() => Math.random() - 0.5);
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
  }, [data, feedType, sortBy]);

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
  const toggleCategory = (slug: string) => {
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
  };

  // Handle article click
  const handleArticleClick = (article: NewsItem) => {
    setSelectedArticle(article);
    setIsPanelOpen(true);
  };

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <section id="news-feed" className="py-8 sm:py-12 px-4">
      <div className="container mx-auto">
        <div className={`flex gap-6 ${!isMobile && isPanelOpen ? "max-w-7xl" : "max-w-4xl"} mx-auto`}>
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

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold mb-1">Your News</h2>
                  <p className="text-sm text-muted-foreground">
                    {country ? `${country.flag_emoji} ${country.name} & World` : "AI-curated stories"}
                  </p>
                </div>

                {/* Sort Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Filter className="w-4 h-4" />
                      <span className="hidden sm:inline">Sort</span>
                      <ChevronDown className="w-3 h-3" />
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
              </div>

              {/* Feed Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-hide mb-4">
                {feedTabs.map((tab) => (
                  <Button
                    key={tab.id}
                    variant={feedType === tab.id ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setFeedType(tab.id)}
                    className="flex-shrink-0 gap-2"
                  >
                    {tab.icon}
                    <span className="hidden sm:inline">{tab.name}</span>
                    <span className="sm:hidden">{tab.name}</span>
                  </Button>
                ))}
              </div>

              {/* Category Filters */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map((category) => {
                  const isSelected = selectedCategories.includes(category.slug);
                  return (
                    <Button
                      key={category.slug}
                      variant={isSelected ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => toggleCategory(category.slug)}
                      className="flex-shrink-0 text-xs h-8 gap-1"
                    >
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

              {/* Active filters */}
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  {feedTabs.find(t => t.id === feedType)?.description}
                </Badge>
                {sortBy !== "latest" && (
                  <Badge variant="secondary" className="text-xs">
                    {sortOptions.find(s => s.id === sortBy)?.name}
                  </Badge>
                )}
                {feedType === "foryou" && !user && (
                  <Badge variant="secondary" className="text-xs">
                    Sign in for personalized feed
                  </Badge>
                )}
              </div>
            </motion.div>

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
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="glass-card rounded-xl h-48 animate-pulse" />
                ))}
              </div>
            )}

            {/* News Cards */}
            {!isLoading && (
              <div className="space-y-4">
                <AnimatePresence mode="wait">
                  {filteredNews.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <NewsCard 
                        news={item} 
                        index={index} 
                        onClick={() => handleArticleClick(item)}
                        isActive={selectedArticle?.id === item.id && isPanelOpen}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* No Results */}
            {!isLoading && filteredNews.length === 0 && !isError && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No news found. Try selecting a different category.</p>
              </div>
            )}

            {/* Loading More */}
            <div ref={loaderRef} className="py-8 flex justify-center">
              {isFetchingNextPage && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Loading more...</span>
                </div>
              )}
              {!hasNextPage && filteredNews.length > 0 && (
                <p className="text-muted-foreground text-sm">You've reached the end.</p>
              )}
            </div>
          </div>

          {/* Desktop: Inline panel space holder */}
          {!isMobile && isPanelOpen && (
            <div className="hidden lg:block w-[520px] flex-shrink-0" />
          )}
        </div>
      </div>

      {/* Article Detail Panel */}
      <ArticleDetailPanel
        article={selectedArticle}
        isOpen={isPanelOpen}
        onClose={() => {
          setIsPanelOpen(false);
          setSelectedArticle(null);
        }}
      />
    </section>
  );
}
