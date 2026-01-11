import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, Clock, RefreshCw, 
  Layers, Grid3X3, List, Radio, 
  Shield, Zap, CheckCircle2, TrendingUp,
  Filter, ChevronDown
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { NewsCard, NewsItem } from "@/components/NewsCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

type SignalType = "all" | "breaking" | "developing" | "stabilized";
type ViewMode = "stream" | "clusters";

const signalFilters: { id: SignalType; name: string; icon: React.ReactNode }[] = [
  { id: "all", name: "All", icon: <Radio className="w-3 h-3" /> },
  { id: "breaking", name: "Breaking", icon: <Zap className="w-3 h-3" /> },
  { id: "developing", name: "Developing", icon: <RefreshCw className="w-3 h-3" /> },
  { id: "stabilized", name: "Verified", icon: <CheckCircle2 className="w-3 h-3" /> },
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
  
  const [signalFilter, setSignalFilter] = useState<SignalType>("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("stream");
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
      
      <main className="pt-14 pb-12">
        {/* Page Header */}
        <section className="border-b border-border/50 bg-muted/20">
          <div className="container mx-auto max-w-6xl px-4 py-6 sm:py-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                  <Radio className="w-2.5 h-2.5" />
                  LIVE
                </Badge>
                <span className="text-[11px] text-muted-foreground">
                  {format(lastRefreshed, "h:mm a")}
                </span>
              </div>
              
              <h1 className="font-display text-xl sm:text-2xl font-semibold text-foreground mb-1">
                Signal Stream
              </h1>
              <p className="text-muted-foreground text-sm max-w-xl">
                Real-time news from 66+ verified sources
              </p>

              {/* Stats row */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-4 text-xs sm:text-sm">
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

        {/* Controls */}
        <section className="sticky top-14 z-30 border-b border-border/50 bg-background/95 backdrop-blur-sm">
          <div className="container mx-auto max-w-6xl px-4 py-2.5">
            <div className="flex items-center justify-between gap-4">
              {/* Signal Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                {signalFilters.map(filter => (
                  <Button
                    key={filter.id}
                    variant={signalFilter === filter.id ? "secondary" : "ghost"}
                    size="sm"
                    className="gap-1.5 flex-shrink-0 h-7 text-xs px-2.5"
                    onClick={() => setSignalFilter(filter.id)}
                  >
                    {filter.icon}
                    <span className="hidden sm:inline">{filter.name}</span>
                  </Button>
                ))}
              </div>

              {/* Right controls */}
              <div className="flex items-center gap-2">
                {/* 3+ sources toggle */}
                <div className="hidden sm:flex items-center gap-1.5 text-xs">
                  <span className="text-muted-foreground">3+ sources</span>
                  <Switch
                    checked={multiSourceOnly}
                    onCheckedChange={setMultiSourceOnly}
                    className="scale-75"
                  />
                </div>

                {/* View Toggle */}
                <div className="flex items-center border rounded-md p-0.5">
                  <Button
                    variant={viewMode === "stream" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-6 px-2"
                    onClick={() => setViewMode("stream")}
                  >
                    <List className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant={viewMode === "clusters" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-6 px-2"
                    onClick={() => setViewMode("clusters")}
                  >
                    <Grid3X3 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {/* Refresh */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto scrollbar-hide pb-0.5">
              {categories.map(cat => (
                <Button
                  key={cat.slug}
                  variant={selectedCategory === cat.slug ? "secondary" : "ghost"}
                  size="sm"
                  className="flex-shrink-0 h-6 text-[11px] px-2"
                  onClick={() => setSelectedCategory(cat.slug)}
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-4 sm:py-6">
          <div className="container mx-auto max-w-6xl px-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : viewMode === "clusters" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {storyClusters.map((cluster, i) => (
                  <motion.div
                    key={cluster.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
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
              <div className="space-y-3">
                {newsItems.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.015 }}
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
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
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
