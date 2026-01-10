import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, TrendingUp, Loader2, ChevronRight, RefreshCw, Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePreferences } from "@/contexts/PreferencesContext";
import { ArticleDetailPanel } from "./ArticleDetailPanel";
import { NewsItem } from "./NewsCard";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface LocalTrendingStory {
  id: string;
  headline: string;
  summary: string;
  image_url: string | null;
  source_name: string;
  source_count: number;
  published_at: string;
  category: string;
  trend_score: number;
}

interface TrendingNearYouProps {
  className?: string;
}

export function TrendingNearYou({ className = "" }: TrendingNearYouProps) {
  const { country } = usePreferences();
  const [stories, setStories] = useState<LocalTrendingStory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  
  const sectionRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Fetch trending stories for user's location
  const fetchTrendingStories = useCallback(async (pageNum: number, reset = false) => {
    if (!country?.code) return;
    
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${SUPABASE_URL}/functions/v1/get-stories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({
          feedType: "trending",
          country: country.code,
          page: pageNum,
          pageSize: 6,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch trending stories");
      }

      const data = await response.json();
      const newStories = data.articles || [];
      
      setStories(prev => reset ? newStories : [...prev, ...newStories]);
      setHasMore(newStories.length === 6);
      setHasLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stories");
    } finally {
      setIsLoading(false);
    }
  }, [country?.code]);

  // Lazy load when section comes into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasLoaded && !isLoading) {
          fetchTrendingStories(1, true);
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [hasLoaded, isLoading, fetchTrendingStories]);

  // Infinite scroll for loading more
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && hasLoaded) {
          setPage(prev => {
            const nextPage = prev + 1;
            fetchTrendingStories(nextPage);
            return nextPage;
          });
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoading, hasLoaded, fetchTrendingStories]);

  // Re-fetch when country changes
  useEffect(() => {
    if (country?.code && hasLoaded) {
      setPage(1);
      fetchTrendingStories(1, true);
    }
  }, [country?.code]);

  const handleStoryClick = (story: LocalTrendingStory) => {
    const newsItem: NewsItem = {
      id: story.id,
      headline: story.headline,
      summary: story.summary,
      topic: story.category || "world",
      sentiment: "neutral",
      trustScore: 85,
      source: story.source_name,
      timestamp: getTimeAgo(story.published_at),
      imageUrl: story.image_url || undefined,
      sourceCount: story.source_count,
      isTrending: true,
      locationRelevance: "Local",
    };
    setSelectedArticle(newsItem);
    setIsPanelOpen(true);
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  if (!country) return null;

  return (
    <>
      <section 
        ref={sectionRef} 
        className={`py-8 sm:py-12 px-4 ${className}`}
      >
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-6"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-red-500">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-bold flex items-center gap-2">
                  Trending Near You
                  <Badge variant="secondary" className="text-xs font-normal">
                    <MapPin className="w-3 h-3 mr-1" />
                    {country.flag_emoji} {country.name}
                  </Badge>
                </h2>
                <p className="text-sm text-muted-foreground">
                  What's hot in your area right now
                </p>
              </div>
            </div>
            {hasLoaded && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPage(1);
                  fetchTrendingStories(1, true);
                }}
                disabled={isLoading}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            )}
          </motion.div>

          {/* Error State */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => fetchTrendingStories(1, true)} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
            </motion.div>
          )}

          {/* Loading Skeleton */}
          {isLoading && !hasLoaded && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-40 w-full" />
                  <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Stories Grid */}
          {hasLoaded && stories.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {stories.map((story, index) => (
                  <motion.div
                    key={story.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    layout
                  >
                    <Card
                      className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 h-full"
                      onClick={() => handleStoryClick(story)}
                    >
                      {/* Image */}
                      {story.image_url && (
                        <div className="relative h-40 overflow-hidden">
                          <img
                            src={story.image_url}
                            alt={story.headline}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                          
                          {/* Badges */}
                          <div className="absolute top-3 left-3 flex gap-2">
                            <Badge className="bg-orange-500 text-white border-0 text-xs">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              Trending
                            </Badge>
                            {story.source_count > 1 && (
                              <Badge variant="secondary" className="text-xs bg-background/80 backdrop-blur-sm">
                                {story.source_count} sources
                              </Badge>
                            )}
                          </div>

                          {/* Category on image */}
                          <div className="absolute bottom-3 left-3">
                            <Badge variant="outline" className="text-xs bg-background/80 backdrop-blur-sm border-0">
                              {story.category || "General"}
                            </Badge>
                          </div>
                        </div>
                      )}

                      <CardContent className="p-4">
                        <h3 className="font-display font-semibold text-sm sm:text-base line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                          {story.headline}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                          {story.summary}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="truncate max-w-[120px]">{story.source_name}</span>
                          <span>{getTimeAgo(story.published_at)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* No Stories */}
          {hasLoaded && stories.length === 0 && !error && (
            <div className="text-center py-12">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display text-lg font-semibold mb-2">No local trends yet</h3>
              <p className="text-muted-foreground text-sm">
                We're still gathering trending stories from {country.name}
              </p>
            </div>
          )}

          {/* Load More Trigger */}
          <div ref={loadMoreRef} className="py-6 flex justify-center">
            {isLoading && hasLoaded && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading more...</span>
              </div>
            )}
            {!hasMore && stories.length > 0 && (
              <p className="text-muted-foreground text-sm">No more trending stories</p>
            )}
          </div>

          {/* View All Button */}
          {hasLoaded && stories.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center mt-4"
            >
              <Button variant="outline" className="gap-2">
                View All Local News
                <ChevronRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </div>
      </section>

      {/* Article Detail Panel */}
      <ArticleDetailPanel
        article={selectedArticle}
        isOpen={isPanelOpen}
        onClose={() => {
          setIsPanelOpen(false);
          setSelectedArticle(null);
        }}
      />
    </>
  );
}
