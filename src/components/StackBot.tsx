import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Newspaper, Clock, 
  Radio, Loader2, RefreshCw,
  AlertCircle, Shield, FileText, Zap, TrendingUp, Globe, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

interface LatestStory {
  id: string;
  headline: string;
  summary: string | null;
  source_count: number | null;
  first_published_at: string;
  category: string | null;
  confidence_level: string | null;
  story_state: string | null;
  state: string | null;
  country_code: string | null;
  is_global: boolean | null;
}

interface LatestSource {
  id: string;
  source_name: string;
  published_at: string;
  story_headline?: string;
  reliability_tier?: string | null;
}

// Determine confidence from source count
function getConfidence(sourceCount: number | null): { level: "low" | "medium" | "high"; label: string } {
  if (!sourceCount || sourceCount < 2) return { level: "low", label: "Unverified" };
  if (sourceCount < 4) return { level: "medium", label: "Developing" };
  return { level: "high", label: "Verified" };
}

const confidenceColors = {
  low: "text-amber-600 bg-amber-500/10 border-amber-500/20",
  medium: "text-blue-600 bg-blue-500/10 border-blue-500/20",
  high: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
};

export function StackBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"breaking" | "verified" | "sources">("breaking");
  const [stories, setStories] = useState<LatestStory[]>([]);
  const [sources, setSources] = useState<LatestSource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const navigate = useNavigate();

  // Check if on mobile PWA - hide StackBot on mobile to avoid clutter
  const isMobileView = typeof window !== "undefined" && window.innerWidth < 768;
  const isPWA = typeof window !== "undefined" && (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch latest stories - prioritize verified (3+ sources) and breaking news
      const { data: storiesData } = await supabase
        .from("stories")
        .select("id, headline, summary, source_count, first_published_at, category, confidence_level, story_state, state, country_code, is_global")
        .order("source_count", { ascending: false })
        .order("first_published_at", { ascending: false })
        .limit(30);

      if (storiesData) {
        // Sort: Breaking first, then verified (3+ sources), then by time
        const sorted = [...storiesData].sort((a, b) => {
          const aPublished = new Date(a.first_published_at);
          const bPublished = new Date(b.first_published_at);
          const now = new Date();
          const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
          
          // Breaking = published within 2 hours AND has 2+ sources
          const aIsBreaking = aPublished >= twoHoursAgo && (a.source_count || 1) >= 2;
          const bIsBreaking = bPublished >= twoHoursAgo && (b.source_count || 1) >= 2;
          
          // Verified = 3+ sources
          const aIsVerified = (a.source_count || 1) >= 3;
          const bIsVerified = (b.source_count || 1) >= 3;
          
          // Priority: Breaking > Verified > Others
          if (aIsBreaking && !bIsBreaking) return -1;
          if (bIsBreaking && !aIsBreaking) return 1;
          if (aIsVerified && !bIsVerified) return -1;
          if (bIsVerified && !aIsVerified) return 1;
          
          // Then by source count, then by time
          if ((b.source_count || 1) !== (a.source_count || 1)) {
            return (b.source_count || 1) - (a.source_count || 1);
          }
          return bPublished.getTime() - aPublished.getTime();
        });
        
        setStories(sorted);
      }

      // Fetch latest sources with story info and reliability tier
      const { data: sourcesData } = await supabase
        .from("story_sources")
        .select(`
          id,
          source_name,
          published_at,
          reliability_tier,
          stories:story_id (headline)
        `)
        .order("published_at", { ascending: false })
        .limit(20);

      if (sourcesData) {
        setSources(sourcesData.map((s: any) => ({
          ...s,
          story_headline: s.stories?.headline
        })));
      }
      
      setLastRefreshed(new Date());
    } catch (error) {
      console.error("Error fetching StackBot data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, fetchData]);

  // Auto-refresh every minute when open
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(fetchData, 60 * 1000);
    return () => clearInterval(interval);
  }, [isOpen, fetchData]);

  const handleStoryClick = (storyId: string) => {
    setIsOpen(false);
    navigate(`/news/${storyId}`);
  };

  // Filter stories by tab
  const breakingStories = stories.filter(s => {
    const published = new Date(s.first_published_at);
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    return published >= twoHoursAgo;
  }).slice(0, 10);

  const verifiedStories = stories.filter(s => (s.source_count || 1) >= 3).slice(0, 10);

  // Don't render on mobile PWA to avoid overlap with bottom nav
  if (isMobileView && isPWA) {
    return null;
  }

  return (
    <>
      {/* Floating Button - Pulsing when there are breaking stories */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: "spring", damping: 15 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              className="relative"
            >
              <Radio className="w-6 h-6" />
              <motion.span
                className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-border bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-display font-semibold text-base flex items-center gap-2">
                    <Zap className="w-4 h-4 text-red-500" />
                    Live Intelligence
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Breaking & verified news from 170+ sources
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={fetchData}
                  disabled={isLoading}
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>

              {/* Last updated */}
              <p className="text-[10px] text-muted-foreground">
                Updated {formatDistanceToNow(lastRefreshed, { addSuffix: true })}
              </p>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="grid grid-cols-3 mx-3 mt-3">
                <TabsTrigger value="breaking" className="text-xs gap-1">
                  <Zap className="w-3 h-3" />
                  Breaking
                  {breakingStories.length > 0 && (
                    <Badge variant="destructive" className="h-4 px-1 text-[10px]">
                      {breakingStories.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="verified" className="text-xs gap-1">
                  <Shield className="w-3 h-3" />
                  Verified
                  {verifiedStories.length > 0 && (
                    <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                      {verifiedStories.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="sources" className="text-xs gap-1">
                  <Newspaper className="w-3 h-3" />
                  Sources
                </TabsTrigger>
              </TabsList>

              {/* Content */}
              <ScrollArea className="h-[350px]">
                <TabsContent value="breaking" className="p-3 mt-0">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : breakingStories.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No breaking news right now</p>
                      <p className="text-xs mt-1">Check back soon for updates</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {breakingStories.map((story) => (
                        <StoryCard 
                          key={story.id} 
                          story={story} 
                          onClick={() => handleStoryClick(story.id)}
                          isBreaking
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="verified" className="p-3 mt-0">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : verifiedStories.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No verified stories yet</p>
                      <p className="text-xs mt-1">Verified = 3+ independent sources</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {verifiedStories.map((story) => (
                        <StoryCard 
                          key={story.id} 
                          story={story} 
                          onClick={() => handleStoryClick(story.id)}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="sources" className="p-3 mt-0">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : sources.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Newspaper className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No sources available yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sources.map((source) => (
                        <div
                          key={source.id}
                          className="p-3 rounded-lg bg-muted/30 border border-border/50"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">
                              {source.source_name.charAt(0)}
                            </div>
                            <span className="font-medium text-sm text-foreground truncate flex-1">
                              {source.source_name}
                            </span>
                            {source.reliability_tier === "tier1" && (
                              <Badge variant="outline" className="text-[10px] h-4 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                Tier 1
                              </Badge>
                            )}
                          </div>
                          {source.story_headline && (
                            <p className="text-xs text-muted-foreground line-clamp-1 pl-8">
                              {source.story_headline}
                            </p>
                          )}
                          <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground pl-8">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(source.published_at), { addSuffix: true })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </ScrollArea>
            </Tabs>

            {/* Footer */}
            <div className="p-3 border-t border-border bg-muted/20">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-xs gap-2"
                onClick={() => {
                  setIsOpen(false);
                  navigate("/news");
                }}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                View all news on NEWStack
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Story card component for StackBot
function StoryCard({ 
  story, 
  onClick, 
  isBreaking = false 
}: { 
  story: LatestStory; 
  onClick: () => void;
  isBreaking?: boolean;
}) {
  const confidence = getConfidence(story.source_count);
  const isVerified = (story.source_count || 1) >= 3;
  
  // Location display
  const location = story.state || (story.is_global ? "Global" : story.country_code || null);

  return (
    <motion.div
      className="p-3 rounded-lg bg-muted/30 border border-border/50 cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
    >
      {/* Badges row */}
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        {isBreaking && (
          <Badge variant="destructive" className="text-[10px] h-4 gap-0.5">
            <Zap className="w-2.5 h-2.5" />
            Breaking
          </Badge>
        )}
        {isVerified && (
          <Badge className={`text-[10px] h-4 gap-0.5 ${confidenceColors.high}`}>
            <Shield className="w-2.5 h-2.5" />
            Verified
          </Badge>
        )}
        {location && (
          <Badge variant="outline" className="text-[10px] h-4 gap-0.5">
            {story.is_global ? <Globe className="w-2.5 h-2.5" /> : <MapPin className="w-2.5 h-2.5" />}
            {location}
          </Badge>
        )}
      </div>
      
      {/* Headline */}
      <h4 className="font-medium text-sm line-clamp-2 text-foreground mb-2">
        {story.headline}
      </h4>
      
      {/* Metadata line */}
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
        <span className={`font-medium ${confidenceColors[confidence.level].split(' ')[0]}`}>
          {confidence.label}
        </span>
        <span>·</span>
        <span>{story.source_count || 1} {(story.source_count || 1) === 1 ? 'source' : 'sources'}</span>
        <span>·</span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDistanceToNow(new Date(story.first_published_at), { addSuffix: false })}
        </span>
      </div>
    </motion.div>
  );
}
