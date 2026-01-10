import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquare, X, Newspaper, TrendingUp, Clock, ExternalLink, 
  ChevronDown, ChevronUp, Sparkles, Radio, Loader2, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface LatestStory {
  id: string;
  headline: string;
  summary: string | null;
  source_count: number | null;
  first_published_at: string;
  category: string | null;
  image_url: string | null;
}

interface LatestSource {
  id: string;
  source_name: string;
  source_url: string;
  published_at: string;
  story_headline?: string;
}

export function StackBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"stories" | "sources">("stories");
  const [stories, setStories] = useState<LatestStory[]>([]);
  const [sources, setSources] = useState<LatestSource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedStory, setExpandedStory] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch latest stories
      const { data: storiesData } = await supabase
        .from("stories")
        .select("id, headline, summary, source_count, first_published_at, category, image_url")
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
          source_url,
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

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
        whileHover={{ scale: 1.1 }}
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
              <Newspaper className="w-6 h-6" />
              <motion.span
                className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"
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
            className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-3rem)] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-border bg-gradient-to-r from-primary/10 to-accent/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="w-5 h-5 text-primary" />
                  </motion.div>
                  <h3 className="font-display font-semibold text-lg">StackBot</h3>
                </div>
                <div className="flex items-center gap-2">
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
              </div>
              
              {/* Live indicator */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Radio className="w-3 h-3 text-green-500" />
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span>Live updates from NewsStack</span>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mt-3">
                <Button
                  variant={activeTab === "stories" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("stories")}
                  className="flex-1 gap-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  Stories
                </Button>
                <Button
                  variant={activeTab === "sources" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("sources")}
                  className="flex-1 gap-2"
                >
                  <Newspaper className="w-4 h-4" />
                  Sources
                </Button>
              </div>
            </div>

            {/* Content */}
            <ScrollArea className="h-[400px]">
              <div className="p-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : activeTab === "stories" ? (
                  <div className="space-y-3">
                    {stories.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Newspaper className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No stories available yet</p>
                      </div>
                    ) : (
                      stories.map((story) => (
                        <motion.div
                          key={story.id}
                          className="p-3 rounded-lg bg-muted/30 border border-border/50 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => setExpandedStory(expandedStory === story.id ? null : story.id)}
                          whileHover={{ scale: 1.01 }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm line-clamp-2 text-foreground">
                                {story.headline}
                              </h4>
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span>
                                  {formatDistanceToNow(new Date(story.first_published_at), { addSuffix: true })}
                                </span>
                                {story.source_count && story.source_count > 1 && (
                                  <>
                                    <span>•</span>
                                    <Badge variant="secondary" className="text-[10px] h-4">
                                      {story.source_count} sources
                                    </Badge>
                                  </>
                                )}
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
                              {expandedStory === story.id ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                          
                          <AnimatePresence>
                            {expandedStory === story.id && story.summary && (
                              <motion.p
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border/50 overflow-hidden"
                              >
                                {story.summary}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sources.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Newspaper className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No sources available yet</p>
                      </div>
                    ) : (
                      sources.map((source) => (
                        <motion.a
                          key={source.id}
                          href={source.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors group"
                          whileHover={{ scale: 1.01 }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                                {source.source_name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <span className="font-medium text-sm text-foreground">
                                  {source.source_name}
                                </span>
                                <div className="text-xs text-muted-foreground truncate">
                                  {source.story_headline || "News update"}
                                </div>
                              </div>
                            </div>
                            <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                          </div>
                          <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(source.published_at), { addSuffix: true })}
                          </div>
                        </motion.a>
                      ))
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="p-3 border-t border-border bg-muted/30">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Powered by NewsStack</span>
                <Badge variant="outline" className="text-[10px]">
                  {stories.length} stories • {sources.length} sources
                </Badge>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
