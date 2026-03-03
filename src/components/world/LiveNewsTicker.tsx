import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Globe, Radio, ChevronRight, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useUserLocation } from "@/hooks/use-user-location";

interface TickerStory {
  id: string;
  headline: string;
  country_code: string | null;
  city: string | null;
  created_at: string;
  isNew?: boolean;
}

interface LiveNewsTickerProps {
  maxItems?: number;
  className?: string;
}

export function LiveNewsTicker({ maxItems = 5, className }: LiveNewsTickerProps) {
  const navigate = useNavigate();
  const userLocation = useUserLocation();
  const [stories, setStories] = useState<TickerStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [newStoryCount, setNewStoryCount] = useState(0);

  // Fetch initial stories from user's location
  const fetchLocalStories = useCallback(async () => {
    setIsLoading(true);
    try {
      const cutoff = new Date();
      cutoff.setHours(cutoff.getHours() - 48);

      let query = supabase
        .from("stories")
        .select("id, headline, country_code, city, created_at")
        .gte("created_at", cutoff.toISOString())
        .order("created_at", { ascending: false })
        .limit(maxItems * 2);

      // Filter by user's location if available
      if (userLocation.hasPermission && userLocation.country) {
        query = query.eq("country_code", userLocation.country.code.toUpperCase());
      }

      const { data, error } = await query;

      if (error) {
        console.error("Failed to fetch ticker stories:", error);
        return;
      }

      setStories(data?.slice(0, maxItems) || []);
    } catch (err) {
      console.error("Ticker fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [maxItems, userLocation.hasPermission, userLocation.country]);

  // Initial fetch
  useEffect(() => {
    fetchLocalStories();
  }, [fetchLocalStories]);

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel("live-ticker")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "stories",
        },
        (payload) => {
          const newStory = payload.new as TickerStory;
          
          // Check if story matches user's location
          if (userLocation.hasPermission && userLocation.country) {
            if (newStory.country_code?.toUpperCase() !== userLocation.country.code.toUpperCase()) {
              return; // Skip stories from other countries
            }
          }

          console.log("[LiveTicker] New story:", newStory.headline);
          
          // Add to beginning with animation flag
          setStories(prev => [{
            ...newStory,
            isNew: true,
          }, ...prev.slice(0, maxItems - 1)]);
          
          setNewStoryCount(prev => prev + 1);

          // Clear the "new" flag after animation
          setTimeout(() => {
            setStories(prev => prev.map(s => 
              s.id === newStory.id ? { ...s, isNew: false } : s
            ));
          }, 5000);
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [maxItems, userLocation.hasPermission, userLocation.country]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const handleStoryClick = (story: TickerStory) => {
    navigate(`/story/${story.id}`);
  };

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center py-4", className)}>
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading updates...</span>
      </div>
    );
  }

  if (stories.length === 0) {
    return null;
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Radio className="w-4 h-4 text-primary" />
            {isConnected && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </div>
          <span className="text-sm font-medium">Live Updates</span>
          {userLocation.hasPermission && userLocation.country && (
            <Badge variant="secondary" className="text-[10px] gap-1">
              {userLocation.country.flag} {userLocation.country.name}
            </Badge>
          )}
        </div>
        {newStoryCount > 0 && (
          <Badge variant="default" className="text-[10px] bg-primary">
            +{newStoryCount} new
          </Badge>
        )}
      </div>

      {/* Stories List */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {stories.map((story, index) => (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: "auto" }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              transition={{ 
                duration: 0.3, 
                delay: index * 0.05,
                layout: { duration: 0.2 }
              }}
              layout
              onClick={() => handleStoryClick(story)}
              className={cn(
                "group cursor-pointer p-3 rounded-lg border transition-all",
                story.isNew
                  ? "bg-primary/10 border-primary/30 shadow-sm"
                  : "bg-muted/30 border-border/50 hover:bg-muted/50"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {story.isNew ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-primary animate-pulse" />
                  ) : (
                    <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={cn(
                    "text-sm font-medium line-clamp-2 transition-colors",
                    story.isNew ? "text-primary" : "text-foreground group-hover:text-primary"
                  )}>
                    {story.headline}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-muted-foreground">
                      {formatTime(story.created_at)}
                    </span>
                    {story.city && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-[10px] text-muted-foreground truncate">
                          {story.city}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* View All Button */}
      <Button
        variant="ghost"
        size="sm"
        className="w-full mt-3 text-xs"
        onClick={() => {
          if (userLocation.hasPermission && userLocation.country) {
            navigate(`/news?country=${userLocation.country.code}`);
          } else {
            navigate("/news");
          }
        }}
      >
        View All Stories
        <ChevronRight className="w-3.5 h-3.5 ml-1" />
      </Button>
    </div>
  );
}
