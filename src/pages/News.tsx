import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, Radio, RefreshCw, 
  Layers, Zap, Shield, Filter,
  Grid3X3, List, Bell
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useInfiniteNews, NewsArticle } from "@/hooks/use-news";
import { usePreferences } from "@/contexts/PreferencesContext";
import { ArticleDetailPanel } from "@/components/ArticleDetailPanel";
import { StoryCluster, UpdateBadge } from "@/components/intelligence";
import { LeftContextPanel } from "@/components/news/LeftContextPanel";
import { RightTrustPanel } from "@/components/news/RightTrustPanel";
import { IntelligenceNewsCard, IntelligenceNewsItem } from "@/components/news/IntelligenceNewsCard";
import { NewsPageSkeleton, NewsCardSkeleton, StoryClusterSkeleton } from "@/components/ui/skeleton-loaders";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLastViewed } from "@/hooks/use-last-viewed";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

type SignalType = "all" | "breaking" | "developing" | "stabilized";
type ViewMode = "stream" | "clusters";

const signalFilters: { id: SignalType; name: string; icon: React.ReactNode }[] = [
  { id: "all", name: "All", icon: <Radio className="w-3 h-3" /> },
  { id: "breaking", name: "Breaking", icon: <Zap className="w-3 h-3" /> },
  { id: "developing", name: "Developing", icon: <RefreshCw className="w-3 h-3" /> },
  { id: "stabilized", name: "Verified", icon: <Shield className="w-3 h-3" /> },
];

const categories = [
  { slug: "all", name: "All" },
  { slug: "politics", name: "Politics" },
  { slug: "business", name: "Business" },
  { slug: "tech", name: "Technology" },
  { slug: "world", name: "World" },
  { slug: "health", name: "Health" },
  { slug: "climate", name: "Climate" },
  { slug: "science", name: "Science" },
];

function determineSignal(publishedAt?: string, sourceCount?: number): SignalType {
  if (!publishedAt) return "developing";
  const ageMinutes = (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60);
  if (ageMinutes < 30) return "breaking";
  if (ageMinutes < 360 && (sourceCount || 1) >= 2) return "developing";
  if ((sourceCount || 1) >= 3) return "stabilized";
  return "developing";
}

function determineConfidence(sourceCount?: number): "low" | "medium" | "high" {
  if (!sourceCount || sourceCount < 2) return "low";
  if (sourceCount < 4) return "medium";
  return "high";
}

function transformArticle(article: NewsArticle): IntelligenceNewsItem {
  const publishedDate = new Date(article.published_at);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - publishedDate.getTime()) / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  
  let timestamp: string;
  if (diffMinutes < 1) timestamp = "Just now";
  else if (diffMinutes < 60) timestamp = `${diffMinutes}m ago`;
  else if (diffHours < 24) timestamp = `${diffHours}h ago`;
  else timestamp = `${Math.floor(diffHours / 24)}d ago`;

  return {
    id: article.id,
    headline: article.headline,
    summary: article.summary || article.ai_analysis || "",
    content: article.content,
    topic: article.topic_slug || "world",
    source: article.source_name || "Unknown",
    sourceUrl: article.source_url || undefined,
    timestamp,
    publishedAt: article.published_at,
    imageUrl: article.image_url || undefined,
    whyMatters: article.why_matters,
    sourceCount: article.source_count,
    trustScore: article.trust_score,
    isBreaking: diffMinutes < 30,
  };
}

export default function News() {
  const { country, language } = usePreferences();
  const isMobile = useIsMobile();
  const { markAsViewed, checkForUpdates, getLastSessionTime, wasViewed } = useLastViewed();
  
  const [signalFilter, setSignalFilter] = useState<SignalType>("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [timeFilter, setTimeFilter] = useState("latest");
  const [viewMode, setViewMode] = useState<ViewMode>("stream");
  const [multiSourceOnly, setMultiSourceOnly] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<IntelligenceNewsItem | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const loaderRef = useRef<HTMLDivElement>(null);
  const lastSession = getLastSessionTime();

  const queryParams = useMemo(() => ({
    country: country?.code,
    language: language?.code === "en" ? "eng" : language?.code,
    topic: selectedCategory === "all" ? undefined : selectedCategory,
    pageSize: 20,
    feedType: "recent" as const,
  }), [country?.code, language?.code, selectedCategory]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteNews(queryParams);

  const newsItems = useMemo(() => {
    if (!data?.pages) return [];
    
    let items = data.pages.flatMap(page => 
      page.articles.map(transformArticle)
    );

    if (signalFilter !== "all") {
      items = items.filter(item => {
        const signal = determineSignal(item.publishedAt, item.sourceCount);
        return signal === signalFilter;
      });
    }

    if (multiSourceOnly) {
      items = items.filter(item => (item.sourceCount || 0) >= 3);
    }

    return items;
  }, [data, signalFilter, multiSourceOnly]);

  // Check for updates on viewed stories
  const storyUpdatesMap = useMemo(() => {
    const map = new Map<string, { type: string; message: string }[]>();
    newsItems.forEach(item => {
      const signal = determineSignal(item.publishedAt, item.sourceCount);
      const updates = checkForUpdates(item.id, {
        headline: item.headline,
        sourceCount: item.sourceCount || 1,
        signal,
      });
      if (updates.length > 0) {
        map.set(item.id, updates.map(u => ({ type: u.type, message: u.message })));
      }
    });
    return map;
  }, [newsItems, checkForUpdates]);

  const updatedStoriesCount = storyUpdatesMap.size;

  const storyClusters = useMemo(() => {
    return newsItems.slice(0, 12).map(item => ({
      id: item.id,
      headline: item.headline,
      summary: item.summary,
      sourceCount: item.sourceCount || 1,
      sources: [],
      publishedAt: item.publishedAt,
      topic: item.topic,
      confidence: determineConfidence(item.sourceCount),
    }));
  }, [newsItems]);

  const stats = useMemo(() => {
    const total = newsItems.length;
    const breaking = newsItems.filter(i => determineSignal(i.publishedAt, i.sourceCount) === "breaking").length;
    const multiSource = newsItems.filter(i => (i.sourceCount || 0) >= 3).length;
    return { total, breaking, multiSource };
  }, [newsItems]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setLastRefreshed(new Date());
    setIsRefreshing(false);
  }, [refetch]);

  const handleArticleClick = useCallback((item: IntelligenceNewsItem) => {
    const signal = determineSignal(item.publishedAt, item.sourceCount);
    markAsViewed(item.id, {
      headline: item.headline,
      sourceCount: item.sourceCount || 1,
      signal,
    });
    setSelectedArticle(item);
    setIsPanelOpen(true);
  }, [markAsViewed]);

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

  // Transform for ArticleDetailPanel
  const selectedArticleForPanel = selectedArticle ? {
    ...selectedArticle,
    sentiment: "neutral" as const,
    trustScore: selectedArticle.trustScore || 85,
    sources: [],
  } : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-14 pb-12">
        {/* Page Header */}
        <section className="border-b border-border/50 bg-muted/20">
          <div className="container mx-auto max-w-7xl px-4 py-5 sm:py-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                  <Radio className="w-2.5 h-2.5" />
                  LIVE
                </Badge>
                <span className="text-[11px] text-muted-foreground">
                  Updated {format(lastRefreshed, "h:mm a")}
                </span>
                {updatedStoriesCount > 0 && (
                  <Badge variant="outline" className="gap-1 bg-primary/10 text-primary border-primary/20 text-[10px]">
                    <Bell className="w-2.5 h-2.5" />
                    {updatedStoriesCount} updated
                  </Badge>
                )}
              </div>
              
              <h1 className="font-display text-xl sm:text-2xl font-semibold text-foreground mb-1">
                Intelligence Stream
              </h1>
              <p className="text-muted-foreground text-sm max-w-xl">
                Real-time news intelligence from verified sources
              </p>

              {/* Last session info */}
              {lastSession && (
                <p className="text-[11px] text-muted-foreground mt-2">
                  Last visit: {formatDistanceToNow(lastSession, { addSuffix: true })}
                </p>
              )}

              {/* Stats row */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-3 text-xs sm:text-sm">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="font-medium">{stats.total}</span>
                  <span className="text-muted-foreground">stories</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-red-500" />
                  <span className="font-medium">{stats.breaking}</span>
                  <span className="text-muted-foreground">breaking</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="font-medium">{stats.multiSource}</span>
                  <span className="text-muted-foreground">verified</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Mobile Controls Bar */}
        <section className="sticky top-14 z-30 border-b border-border/50 bg-background/95 backdrop-blur-sm lg:hidden">
          <div className="container mx-auto max-w-7xl px-4 py-2">
            {/* Mobile Category Swiper */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
              {categories.map(cat => (
                <Button
                  key={cat.slug}
                  variant={selectedCategory === cat.slug ? "secondary" : "ghost"}
                  size="sm"
                  className="flex-shrink-0 h-7 text-xs px-2.5"
                  onClick={() => setSelectedCategory(cat.slug)}
                >
                  {cat.name}
                </Button>
              ))}
            </div>
            
            {/* Signal + View controls */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-1.5">
                {signalFilters.map(filter => (
                  <Button
                    key={filter.id}
                    variant={signalFilter === filter.id ? "secondary" : "ghost"}
                    size="sm"
                    className="h-6 text-[11px] px-2 gap-1"
                    onClick={() => setSignalFilter(filter.id)}
                  >
                    {filter.icon}
                    <span className="hidden xs:inline">{filter.name}</span>
                  </Button>
                ))}
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center border rounded-md p-0.5">
                  <Button
                    variant={viewMode === "stream" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-5 w-6 p-0"
                    onClick={() => setViewMode("stream")}
                  >
                    <List className="w-3 h-3" />
                  </Button>
                  <Button
                    variant={viewMode === "clusters" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-5 w-6 p-0"
                    onClick={() => setViewMode("clusters")}
                  >
                    <Grid3X3 className="w-3 h-3" />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* 3-Column Layout */}
        <section className="py-4 sm:py-6">
          <div className="container mx-auto max-w-7xl px-4">
            {isLoading ? (
              <NewsPageSkeleton />
            ) : (
              <div className="flex gap-6">
                {/* LEFT COLUMN - Context & Filters (Desktop only) */}
                <LeftContextPanel
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  timeFilter={timeFilter}
                  onTimeFilterChange={setTimeFilter}
                  viewAsClusters={viewMode === "clusters"}
                  onViewChange={(clusters) => setViewMode(clusters ? "clusters" : "stream")}
                />

                {/* CENTER COLUMN - Primary Intelligence Stream */}
                <div className="flex-1 min-w-0">
                  {/* Desktop Controls */}
                  <div className="hidden lg:flex items-center justify-between mb-4 pb-3 border-b border-border/50">
                    <div className="flex items-center gap-1.5">
                      {signalFilters.map(filter => (
                        <Button
                          key={filter.id}
                          variant={signalFilter === filter.id ? "secondary" : "ghost"}
                          size="sm"
                          className="gap-1.5 h-7 text-xs px-2.5"
                          onClick={() => setSignalFilter(filter.id)}
                        >
                          {filter.icon}
                          {filter.name}
                        </Button>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-muted-foreground">3+ sources</span>
                        <Switch
                          checked={multiSourceOnly}
                          onCheckedChange={setMultiSourceOnly}
                          className="scale-75"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                      >
                        <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
                      </Button>
                    </div>
                  </div>

                  {/* Content */}
                  {viewMode === "clusters" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {storyClusters.map((cluster, i) => (
                        <motion.div
                          key={cluster.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.02 }}
                        >
                          <div className="relative">
                            {storyUpdatesMap.has(cluster.id) && (
                              <div className="absolute -top-1 -right-1 z-10">
                                <UpdateBadge updateCount={storyUpdatesMap.get(cluster.id)?.length || 0} />
                              </div>
                            )}
                            <StoryCluster
                              {...cluster}
                              onReadMore={() => {
                                const item = newsItems.find(n => n.id === cluster.id);
                                if (item) handleArticleClick(item);
                              }}
                            />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {newsItems.map((item, i) => {
                        const updates = storyUpdatesMap.get(item.id);
                        return (
                          <div key={item.id} className="relative">
                            {updates && updates.length > 0 && (
                              <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-2 px-3 py-1.5 rounded-md bg-primary/5 border border-primary/20 flex items-center gap-2"
                              >
                                <Bell className="w-3 h-3 text-primary" />
                                <span className="text-[11px] text-primary font-medium">
                                  Updated since last view
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {updates[0].message}
                                </span>
                              </motion.div>
                            )}
                            <IntelligenceNewsCard
                              news={item}
                              index={i}
                              onClick={() => handleArticleClick(item)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Loader */}
                  <div ref={loaderRef} className="py-8 flex justify-center">
                    {isFetchingNextPage && (
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* RIGHT COLUMN - Trust & Signals Panel (Desktop only) */}
                <RightTrustPanel
                  totalSources={66}
                  primarySources={24}
                  secondarySources={42}
                  contradictionsDetected={stats.breaking > 0 ? 1 : 0}
                  emergingSignals={updatedStoriesCount > 0 ? [`${updatedStoriesCount} stories updated since your last visit`] : []}
                />
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Article Detail Panel */}
      {selectedArticleForPanel && (
        <ArticleDetailPanel
          article={selectedArticleForPanel}
          isOpen={isPanelOpen}
          onClose={() => {
            setIsPanelOpen(false);
            setSelectedArticle(null);
          }}
        />
      )}

      <Footer />
    </div>
  );
}
