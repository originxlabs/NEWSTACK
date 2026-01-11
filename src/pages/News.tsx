import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, TrendingUp, Clock, RefreshCw, Filter, 
  ChevronDown, Layers, Grid3X3, List, Search, 
  Radio, Shield, Zap, CheckCircle2, AlertTriangle
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { NewsCard, NewsItem } from "@/components/NewsCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useInfiniteNews, NewsArticle } from "@/hooks/use-news";
import { usePreferences } from "@/contexts/PreferencesContext";
import { ArticleDetailPanel } from "@/components/ArticleDetailPanel";
import { StoryCluster } from "@/components/intelligence";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { format, parseISO } from "date-fns";

type FeedType = "all" | "breaking" | "developing" | "stabilized";
type ViewMode = "signals" | "clusters";
type SortType = "latest" | "sources" | "confidence";

const signalFilters: { id: FeedType; name: string; icon: React.ReactNode; color: string }[] = [
  { id: "all", name: "All Signals", icon: <Radio className="w-4 h-4" />, color: "" },
  { id: "breaking", name: "Breaking", icon: <Zap className="w-4 h-4" />, color: "text-red-500" },
  { id: "developing", name: "Developing", icon: <RefreshCw className="w-4 h-4" />, color: "text-amber-500" },
  { id: "stabilized", name: "Stabilized", icon: <CheckCircle2 className="w-4 h-4" />, color: "text-emerald-500" },
];

const categories = [
  { slug: "all", name: "All", icon: "📰" },
  { slug: "politics", name: "Politics", icon: "🏛️" },
  { slug: "business", name: "Business", icon: "💼" },
  { slug: "tech", name: "Technology", icon: "💻" },
  { slug: "world", name: "World", icon: "🌍" },
  { slug: "health", name: "Health", icon: "🏥" },
  { slug: "climate", name: "Climate", icon: "🌱" },
  { slug: "science", name: "Science", icon: "🔬" },
];

function determineSignal(publishedAt?: string, sourceCount?: number): FeedType {
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

function transformArticle(article: NewsArticle): NewsItem {
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
    sentiment: article.sentiment || "neutral",
    trustScore: article.trust_score || 85,
    source: article.source_name || "Unknown",
    sourceUrl: article.source_url || undefined,
    timestamp,
    publishedAt: article.published_at,
    imageUrl: article.image_url || undefined,
    whyMatters: article.why_matters,
    sourceCount: article.source_count,
    isBreaking: diffMinutes < 30,
    isTrending: (article.source_count || 0) >= 3,
    sources: (article as any).sources || [],
  };
}

export default function News() {
  const { country, language } = usePreferences();
  const isMobile = useIsMobile();
  
  const [signalFilter, setSignalFilter] = useState<FeedType>("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("signals");
  const [sortBy, setSortBy] = useState<SortType>("latest");
  const [searchQuery, setSearchQuery] = useState("");
  const [multiSourceOnly, setMultiSourceOnly] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const loaderRef = useRef<HTMLDivElement>(null);

  const queryParams = useMemo(() => ({
    country: country?.code,
    language: language?.code === "en" ? "eng" : language?.code,
    topic: selectedCategory === "all" ? undefined : selectedCategory,
    pageSize: 20,
    feedType: "recent" as const,
    query: searchQuery || undefined,
  }), [country?.code, language?.code, selectedCategory, searchQuery]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteNews(queryParams);

  // Transform and filter articles
  const newsItems = useMemo(() => {
    if (!data?.pages) return [];
    
    let items = data.pages.flatMap(page => 
      page.articles.map(transformArticle)
    );

    // Filter by signal type
    if (signalFilter !== "all") {
      items = items.filter(item => {
        const signal = determineSignal(item.publishedAt, item.sourceCount);
        return signal === signalFilter;
      });
    }

    // Filter by multi-source
    if (multiSourceOnly) {
      items = items.filter(item => (item.sourceCount || 0) >= 3);
    }

    // Sort
    if (sortBy === "sources") {
      items.sort((a, b) => (b.sourceCount || 0) - (a.sourceCount || 0));
    } else if (sortBy === "confidence") {
      const confOrder = { high: 3, medium: 2, low: 1 };
      items.sort((a, b) => 
        confOrder[determineConfidence(b.sourceCount)] - confOrder[determineConfidence(a.sourceCount)]
      );
    }

    return items;
  }, [data, signalFilter, multiSourceOnly, sortBy]);

  // Create clusters for cluster view
  const storyClusters = useMemo(() => {
    return newsItems.slice(0, 12).map(item => ({
      id: item.id,
      headline: item.headline,
      summary: item.summary,
      sourceCount: item.sourceCount || 1,
      sources: item.sources || [],
      publishedAt: item.publishedAt,
      topic: item.topic,
      confidence: determineConfidence(item.sourceCount),
    }));
  }, [newsItems]);

  // Stats
  const stats = useMemo(() => {
    const total = newsItems.length;
    const breaking = newsItems.filter(i => determineSignal(i.publishedAt, i.sourceCount) === "breaking").length;
    const multiSource = newsItems.filter(i => (i.sourceCount || 0) >= 3).length;
    return { total, breaking, multiSource };
  }, [newsItems]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setLastRefreshed(new Date());
    setIsRefreshing(false);
  }, [refetch]);

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
      
      <main className="pt-20 pb-12">
        {/* Page Header */}
        <section className="border-b border-border/50 bg-muted/20">
          <div className="container mx-auto max-w-6xl px-4 py-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline" className="gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                  <Radio className="w-2.5 h-2.5" />
                  LIVE
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Last updated: {format(lastRefreshed, "h:mm a")}
                </span>
              </div>
              
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-foreground mb-2">
                Signal Stream
              </h1>
              <p className="text-muted-foreground max-w-2xl">
                Real-time news intelligence from 66+ verified sources. Stories are clustered, 
                scored for credibility, and labeled by signal type.
              </p>

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-6 mt-6 text-sm">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground font-medium">{stats.total}</span>
                  <span className="text-muted-foreground">stories</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-red-500" />
                  <span className="text-foreground font-medium">{stats.breaking}</span>
                  <span className="text-muted-foreground">breaking</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  <span className="text-foreground font-medium">{stats.multiSource}</span>
                  <span className="text-muted-foreground">multi-source</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Controls */}
        <section className="sticky top-16 z-30 border-b border-border/50 bg-background/95 backdrop-blur-sm">
          <div className="container mx-auto max-w-6xl px-4 py-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Signal Filters */}
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                {signalFilters.map(filter => (
                  <Button
                    key={filter.id}
                    variant={signalFilter === filter.id ? "default" : "outline"}
                    size="sm"
                    className={`gap-1.5 flex-shrink-0 ${filter.color}`}
                    onClick={() => setSignalFilter(filter.id)}
                  >
                    {filter.icon}
                    {filter.name}
                  </Button>
                ))}
              </div>

              {/* View Toggle & Filters */}
              <div className="flex items-center gap-3">
                {/* Multi-source toggle */}
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">3+ sources</span>
                  <Switch
                    checked={multiSourceOnly}
                    onCheckedChange={setMultiSourceOnly}
                  />
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center border rounded-lg p-0.5">
                  <Button
                    variant={viewMode === "signals" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setViewMode("signals")}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "clusters" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setViewMode("clusters")}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Refresh */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 mt-3 overflow-x-auto scrollbar-hide pb-1">
              {categories.map(cat => (
                <Button
                  key={cat.slug}
                  variant={selectedCategory === cat.slug ? "secondary" : "ghost"}
                  size="sm"
                  className="flex-shrink-0 gap-1 h-7 text-xs"
                  onClick={() => setSelectedCategory(cat.slug)}
                >
                  <span>{cat.icon}</span>
                  {cat.name}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-6">
          <div className="container mx-auto max-w-6xl px-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : viewMode === "clusters" ? (
              // Cluster View
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {storyClusters.map((cluster, i) => (
                  <motion.div
                    key={cluster.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <StoryCluster
                      {...cluster}
                      onReadMore={() => {
                        const item = newsItems.find(n => n.id === cluster.id);
                        if (item) {
                          setSelectedArticle(item);
                          setIsPanelOpen(true);
                        }
                      }}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              // Signal Stream View
              <div className="space-y-4">
                {newsItems.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                  >
                    <NewsCard
                      news={item}
                      index={i}
                      onClick={() => {
                        setSelectedArticle(item);
                        setIsPanelOpen(true);
                      }}
                    />
                  </motion.div>
                ))}
              </div>
            )}

            {/* Loader */}
            <div ref={loaderRef} className="py-8 flex justify-center">
              {isFetchingNextPage && (
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Article Detail Panel */}
      {selectedArticle && (
        <ArticleDetailPanel
          article={selectedArticle}
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
