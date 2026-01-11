import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Newspaper, Clock, 
  ChevronDown, ChevronUp, Radio, Loader2, RefreshCw,
  AlertCircle, Shield, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
}

interface LatestSource {
  id: string;
  source_name: string;
  published_at: string;
  story_headline?: string;
}

// Determine confidence from source count
function getConfidence(sourceCount: number | null): { level: "low" | "medium" | "high"; label: string } {
  if (!sourceCount || sourceCount < 2) return { level: "low", label: "Low" };
  if (sourceCount < 4) return { level: "medium", label: "Medium" };
  return { level: "high", label: "High" };
}

const confidenceColors = {
  low: "text-amber-600 bg-amber-500/10",
  medium: "text-blue-600 bg-blue-500/10",
  high: "text-emerald-600 bg-emerald-500/10",
};

export function StackBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"stories" | "sources">("stories");
  const [stories, setStories] = useState<LatestStory[]>([]);
  const [sources, setSources] = useState<LatestSource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedStory, setExpandedStory] = useState<string | null>(null);
  const navigate = useNavigate();

  // Check if on mobile PWA - hide StackBot on mobile to avoid clutter
  const isMobileView = typeof window !== "undefined" && window.innerWidth < 768;
  const isPWA = typeof window !== "undefined" && (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch latest stories
      const { data: storiesData } = await supabase
        .from("stories")
        .select("id, headline, summary, source_count, first_published_at, category")
        .order("first_published_at", { ascending: false })
        .limit(10);

      if (storiesData) {
        setStories(storiesData);
      }

      // Fetch latest sources with story info
      const { data: sourcesData } = await supabase
        .from("story_sources")
        .select(`
          id,
          source_name,
          published_at,
          stories:story_id (headline)
        `)
        .order("published_at", { ascending: false })
        .limit(15);

      if (sourcesData) {
        setSources(sourcesData.map((s: any) => ({
          ...s,
          story_headline: s.stories?.headline
        })));
      }
    } catch (error) {
      console.error("Error fetching StackBot data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const handleStoryClick = (storyId: string) => {
    setIsOpen(false);
    navigate(`/news/${storyId}`);
  };

  // Don't render on mobile PWA to avoid overlap with bottom nav
  if (isMobileView && isPWA) {
    return null;
  }

  return (
    <>
      {/* Floating Button - Simple, not draggable */}
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
                className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
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
            className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-3rem)] bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Header - Clean, minimal */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-display font-semibold text-base">Live Intelligence</h3>
                  <p className="text-xs text-muted-foreground">Updates from verified sources</p>
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

              {/* Tabs */}
              <div className="flex gap-2 mt-3">
                <Button
                  variant={activeTab === "stories" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("stories")}
                  className="flex-1 gap-1.5 h-8 text-xs"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Stories
                </Button>
                <Button
                  variant={activeTab === "sources" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("sources")}
                  className="flex-1 gap-1.5 h-8 text-xs"
                >
                  <Newspaper className="w-3.5 h-3.5" />
                  Sources
                </Button>
              </div>
            </div>

            {/* Content */}
            <ScrollArea className="h-[380px]">
              <div className="p-3">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : activeTab === "stories" ? (
                  <div className="space-y-2">
                    {stories.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Newspaper className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No stories available yet</p>
                      </div>
                    ) : (
                      stories.map((story) => {
                        const confidence = getConfidence(story.source_count);
                        const isSingleSource = !story.source_count || story.source_count === 1;
                        
                        return (
                          <motion.div
                            key={story.id}
                            className="p-3 rounded-lg bg-muted/30 border border-border/50 cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => handleStoryClick(story.id)}
                            whileHover={{ scale: 1.01 }}
                          >
                            {/* Single source badge */}
                            {isSingleSource && (
                              <Badge variant="outline" className="text-[10px] h-4 mb-2 gap-1 text-amber-600 border-amber-500/30 bg-amber-500/10">
                                <AlertCircle className="w-2.5 h-2.5" />
                                Single source
                              </Badge>
                            )}
                            
                            {/* Headline */}
                            <h4 className="font-medium text-sm line-clamp-2 text-foreground mb-2">
                              {story.headline}
                            </h4>
                            
                            {/* Metadata line: Confidence · Sources · Time */}
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                              <span className={`font-medium ${confidenceColors[confidence.level].split(' ')[0]}`}>
                                {confidence.label} confidence
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
                      })
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sources.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Newspaper className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No sources available yet</p>
                      </div>
                    ) : (
                      sources.map((source) => (
                        <div
                          key={source.id}
                          className="p-3 rounded-lg bg-muted/30 border border-border/50"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">
                              {source.source_name.charAt(0)}
                            </div>
                            <span className="font-medium text-sm text-foreground">
                              {source.source_name}
                            </span>
                            <Badge variant="outline" className="text-[10px] h-4 ml-auto">
                              Primary
                            </Badge>
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
                      ))
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Footer - Clean, trust-focused */}
            <div className="p-3 border-t border-border bg-muted/20">
              <p className="text-[11px] text-muted-foreground text-center">
                Live intelligence from verified public sources
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
