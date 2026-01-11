import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Loader2, Radio, RefreshCw, 
  Layers, Zap, Shield, 
  Grid3X3, List, Bell, ChevronDown, X, Globe
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useInfiniteNews, NewsArticle } from "@/hooks/use-news";
import { usePreferences } from "@/contexts/PreferencesContext";
import { StoryIntelligencePanel, StoryIntelligenceItem } from "@/components/news/StoryIntelligencePanel";
import { LeftContextPanel } from "@/components/news/LeftContextPanel";
import { RightTrustPanel } from "@/components/news/RightTrustPanel";
import { IntelligenceNewsCard, IntelligenceNewsItem } from "@/components/news/IntelligenceNewsCard";
import { ClusterCard } from "@/components/news/ClusterCard";
import { TimeBlockSection } from "@/components/news/TimeBlockSection";
import { NewsPageSkeleton } from "@/components/ui/skeleton-loaders";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLastViewed } from "@/hooks/use-last-viewed";
import { clusterStories, groupByTimeBlocks, StoryCluster, RawStory } from "@/lib/story-clustering";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

// Region name mapping
const REGION_NAMES: Record<string, string> = {
  "north-america": "North America",
  "europe": "Europe",
  "asia-pacific": "Asia Pacific",
  "middle-east": "Middle East",
  "africa": "Africa",
  "south-america": "South America",
};

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

// REMOVED: These functions are no longer used - story state comes from API/cluster
// Signal and confidence are calculated once at the cluster level, not per-component

function transformArticle(article: NewsArticle): RawStory {
  const publishedDate = new Date(article.published_at);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - publishedDate.getTime()) / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  
  let timestamp: string;
  if (diffMinutes < 1) timestamp = "Just now";
  else if (diffMinutes < 60) timestamp = `${diffMinutes}m ago`;
  else if (diffHours < 24) timestamp = `${diffHours}h ago`;
  else timestamp = `${Math.floor(diffHours / 24)}d ago`;

  // CRITICAL: Use source_count from API (which is calculated from actual fetched sources)
  const sourceCount = article.source_count || 1;
  const verifiedCount = (article as any).verified_source_count || 0;
  
  // Use story_state and confidence_level from API if available
  const storyState = (article as any).story_state || 
    (sourceCount === 1 ? "single-source" : 
     diffMinutes < 30 ? "breaking" : 
     sourceCount >= 4 ? "confirmed" : "developing");
  
  const confidenceLevel = (article as any).confidence_level ||
    (sourceCount === 1 ? "low" : sourceCount >= 4 ? "high" : "medium");

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
    // CRITICAL: These must be consistent everywhere
    sourceCount,
    trustScore: article.trust_score,
    sources: (article as any).sources,
    storyState: storyState as RawStory["storyState"],
    confidenceLevel: confidenceLevel as RawStory["confidenceLevel"],
    isSingleSource: sourceCount === 1,
    verifiedSourceCount: verifiedCount,
  };
}

function toIntelligenceNewsItem(story: RawStory): IntelligenceNewsItem {
  // CRITICAL: Use story-level data, not recalculate per component
  const signalMap: Record<string, IntelligenceNewsItem["signal"]> = {
    "single-source": "developing",
    "breaking": "breaking",
    "developing": "developing",
    "confirmed": "stabilized",
    "contradicted": "contradicted",
    "resolved": "resolved",
  };

  return {
    id: story.id,
    headline: story.headline,
    summary: story.summary,
    content: story.content,
    topic: story.topic,
    source: story.source,
    sourceUrl: story.sourceUrl,
    timestamp: story.timestamp,
    publishedAt: story.publishedAt,
    imageUrl: story.imageUrl,
    whyMatters: story.whyMatters,
    // CRITICAL: Use story-level source count (from cluster, not recalculated)
    sourceCount: story.sourceCount,
    trustScore: story.trustScore,
    isBreaking: story.storyState === "breaking",
    signal: signalMap[story.storyState || "developing"] || "developing",
    confidence: story.confidenceLevel || "low",
  };
}

export default function News() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { country, language } = usePreferences();
  const isMobile = useIsMobile();
  const { markAsViewed, checkForUpdates, getLastSessionTime } = useLastViewed();
  
  // Read region filter from URL
  const regionFilter = searchParams.get("region") || null;
  const regionName = regionFilter ? REGION_NAMES[regionFilter] : null;
  
  const [signalFilter, setSignalFilter] = useState<SignalType>("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [timeFilter, setTimeFilter] = useState("latest");
  const [viewMode, setViewMode] = useState<ViewMode>("stream");
  const [multiSourceOnly, setMultiSourceOnly] = useState(false);
  const [selectedStory, setSelectedStory] = useState<StoryIntelligenceItem | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadedBlocks, setLoadedBlocks] = useState(1); // Time-based pagination
  
  const lastSession = getLastSessionTime();

  const queryParams = useMemo(() => ({
    country: country?.code,
    language: language?.code === "en" ? "eng" : language?.code,
    topic: selectedCategory === "all" ? undefined : selectedCategory,
    region: regionFilter || undefined,
    pageSize: 100, // Load more for clustering - no artificial limit
    feedType: "recent" as const,
  }), [country?.code, language?.code, selectedCategory, regionFilter]);

  const {
    data,
    isLoading,
    refetch,
  } = useInfiniteNews(queryParams);

  // Clear region filter
  const clearRegionFilter = useCallback(() => {
    searchParams.delete("region");
    setSearchParams(searchParams);
  }, [searchParams, setSearchParams]);

  // Transform stories with consistent data from API
  const allStoriesRaw = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap(page => page.articles.map(transformArticle));
  }, [data]);

  // Cluster stories FIRST, then filter
  const allClusters = useMemo(() => {
    return clusterStories(allStoriesRaw, 0.45);
  }, [allStoriesRaw]);

  // DATA-DRIVEN FILTERING: Apply filters to clusters, not UI state
  const filteredClusters = useMemo(() => {
    let clusters = [...allClusters];

    // Filter by signal/state
    if (signalFilter !== "all") {
      clusters = clusters.filter(cluster => {
        if (signalFilter === "breaking") return cluster.signal === "breaking";
        if (signalFilter === "developing") return cluster.signal === "developing";
        if (signalFilter === "stabilized") return cluster.confidence === "high";
        return true;
      });
    }

    // Filter by multi-source (3+ sources)
    if (multiSourceOnly) {
      clusters = clusters.filter(cluster => cluster.sourceCount >= 3);
    }

    return clusters;
  }, [allClusters, signalFilter, multiSourceOnly]);

  // Get filtered stories from filtered clusters
  const allStories = useMemo(() => {
    // Return all stories from filtered clusters
    return filteredClusters.flatMap(cluster => cluster.stories);
  }, [filteredClusters]);

  // Use filtered clusters for time blocks
  const clusters = filteredClusters;

  // Group by time blocks for pagination - use filtered data
  const timeBlocks = useMemo(() => {
    return groupByTimeBlocks(allStories, clusters);
  }, [allStories, clusters]);

  // Check for updates on viewed stories - use story-level state
  const storyUpdatesMap = useMemo(() => {
    const map = new Map<string, { type: string; message: string }[]>();
    allStories.forEach(item => {
      // Use story-level state from cluster, not recalculate
      const signal = item.storyState || "developing";
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
  }, [allStories, checkForUpdates]);

  const updatedStoriesCount = storyUpdatesMap.size;

  const stats = useMemo(() => {
    const total = allStories.length;
    // Use cluster-level signal, not recalculate
    const breaking = clusters.filter(c => c.signal === "breaking").length;
    const multiSource = clusters.filter(c => c.sourceCount >= 3).length;
    const totalClusters = clusters.length;
    return { total, breaking, multiSource, totalClusters };
  }, [allStories, clusters]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setLastRefreshed(new Date());
    setIsRefreshing(false);
  }, [refetch]);

  const handleResetFilters = useCallback(() => {
    setSelectedCategory("all");
    setTimeFilter("latest");
    setViewMode("stream");
    setSignalFilter("all");
    setMultiSourceOnly(false);
  }, []);

  const handleArticleClick = useCallback((item: RawStory) => {
    // Use story-level state from cluster
    const signal = item.storyState || "developing";
    markAsViewed(item.id, {
      headline: item.headline,
      sourceCount: item.sourceCount || 1,
      signal,
    });
    setSelectedStory({
      id: item.id,
      headline: item.headline,
      summary: item.summary,
      content: item.content,
      topic: item.topic,
      source: item.source,
      sourceUrl: item.sourceUrl,
      timestamp: item.timestamp,
      publishedAt: item.publishedAt,
      imageUrl: item.imageUrl,
      whyMatters: item.whyMatters,
      sourceCount: item.sourceCount,
      sources: item.sources,
    });
    setIsPanelOpen(true);
  }, [markAsViewed]);

  const handleClusterClick = useCallback((cluster: StoryCluster) => {
    handleArticleClick(cluster.representativeStory);
  }, [handleArticleClick]);

  const handleViewFullPage = useCallback((storyId: string) => {
    setIsPanelOpen(false);
    navigate(`/news/${storyId}`);
  }, [navigate]);

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

              {/* Region Filter Badge */}
              {regionName && (
                <div className="flex items-center gap-2 mt-3">
                  <Badge 
                    variant="secondary" 
                    className="gap-1.5 pr-1 bg-primary/10 text-primary border-primary/20"
                  >
                    <Globe className="w-3 h-3" />
                    {regionName}
                    <button 
                      onClick={clearRegionFilter}
                      className="ml-1 p-0.5 rounded hover:bg-primary/20 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                </div>
              )}
              
              <h1 className="font-display text-xl sm:text-2xl font-semibold text-foreground mb-1 mt-2">
                {regionName ? `${regionName} Intelligence` : "Intelligence Stream"}
              </h1>
              <p className="text-muted-foreground text-sm max-w-xl">
                {regionName 
                  ? `Stories from ${regionName} updated in the last 48 hours`
                  : "Stories updated in the last 48 hours from 170+ verified sources"
                }
              </p>

              {/* Last session info */}
              {lastSession && (
                <p className="text-[11px] text-muted-foreground mt-2">
                  Last visit: {formatDistanceToNow(lastSession, { addSuffix: true })}
                </p>
              )}

              {/* Stats row - time-based, not count-based */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-3 text-xs sm:text-sm">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="font-medium">{stats.totalClusters}</span>
                  <span className="text-muted-foreground">story clusters</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-red-500" />
                  <span className="font-medium">{stats.breaking}</span>
                  <span className="text-muted-foreground">breaking</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="font-medium">{stats.multiSource}</span>
                  <span className="text-muted-foreground">verified (3+ sources)</span>
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
                  onResetFilters={handleResetFilters}
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

                  {/* Time-based paginated content (NO INFINITE SCROLL) */}
                  {viewMode === "clusters" ? (
                    <div className="space-y-2">
                      {timeBlocks.slice(0, loadedBlocks).map((block, blockIndex) => (
                        <TimeBlockSection
                          key={block.id}
                          label={block.label}
                          id={block.id}
                          count={block.clusters.length}
                          isFirst={blockIndex === 0}
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {block.clusters.map((cluster) => (
                              <ClusterCard
                                key={cluster.id}
                                cluster={cluster}
                                onClick={() => handleClusterClick(cluster)}
                                showUpdateBadge={storyUpdatesMap.has(cluster.id)}
                              />
                            ))}
                          </div>
                        </TimeBlockSection>
                      ))}
                      
                      {/* Load older updates button */}
                      {loadedBlocks < timeBlocks.length && (
                        <div className="pt-4 flex justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => setLoadedBlocks(prev => prev + 1)}
                          >
                            <ChevronDown className="w-4 h-4" />
                            Load older updates
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {timeBlocks.slice(0, loadedBlocks).map((block, blockIndex) => (
                        <TimeBlockSection
                          key={block.id}
                          label={block.label}
                          id={block.id}
                          count={block.stories.length}
                          isFirst={blockIndex === 0}
                        >
                          <div className="space-y-3">
                            {block.stories.map((story, i) => {
                              const updates = storyUpdatesMap.get(story.id);
                              return (
                                <div key={story.id} className="relative">
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
                                    news={toIntelligenceNewsItem(story)}
                                    index={i}
                                    onClick={() => handleArticleClick(story)}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </TimeBlockSection>
                      ))}
                      
                      {/* Load older updates button */}
                      {loadedBlocks < timeBlocks.length && (
                        <div className="pt-4 flex justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => setLoadedBlocks(prev => prev + 1)}
                          >
                            <ChevronDown className="w-4 h-4" />
                            Load older updates
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Empty state */}
                  {allStories.length === 0 && !isLoading && (
                    <div className="py-16 text-center">
                      <Layers className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No stories found</h3>
                      <p className="text-sm text-muted-foreground">
                        Try adjusting your filters or check back later
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={handleResetFilters}
                      >
                        Reset filters
                      </Button>
                    </div>
                  )}
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

      {/* Story Intelligence Panel */}
      <StoryIntelligencePanel
        story={selectedStory}
        isOpen={isPanelOpen}
        onClose={() => {
          setIsPanelOpen(false);
          setSelectedStory(null);
        }}
        onViewFullPage={handleViewFullPage}
      />

      <Footer />
    </div>
  );
}
