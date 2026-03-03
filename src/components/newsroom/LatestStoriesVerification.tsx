import { useState, useEffect, useMemo } from "react";
import { format, formatDistanceToNow, startOfDay } from "date-fns";
import { 
  CheckCircle2, AlertCircle, ExternalLink, RefreshCw, 
  Shield, Eye, Layers, Clock, TrendingUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface StoryWithSources {
  id: string;
  headline: string;
  summary: string | null;
  category: string | null;
  state: string | null;
  city: string | null;
  source_count: number | null;
  verified_source_count: number | null;
  confidence_level: string | null;
  story_state: string | null;
  first_published_at: string;
  sources: {
    id: string;
    source_name: string;
    source_url: string;
    is_primary_reporting: boolean | null;
    reliability_tier: string | null;
  }[];
}

export function LatestStoriesVerification({ className }: { className?: string }) {
  const [stories, setStories] = useState<StoryWithSources[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStory, setSelectedStory] = useState<string | null>(null);

  const fetchStories = async () => {
    setIsLoading(true);
    try {
      const todayStart = startOfDay(new Date()).toISOString();

      // Fetch today's stories
      const { data: storyData, error: storyErr } = await supabase
        .from("stories")
        .select(`
          id,
          headline,
          summary,
          category,
          state,
          city,
          source_count,
          verified_source_count,
          confidence_level,
          story_state,
          first_published_at
        `)
        .gte("first_published_at", todayStart)
        .order("first_published_at", { ascending: false })
        .limit(50);

      if (storyErr) throw storyErr;

      // Fetch sources for these stories
      const storyIds = (storyData || []).map((s) => s.id);
      const { data: sourceData, error: sourceErr } = await supabase
        .from("story_sources")
        .select("id,story_id,source_name,source_url,is_primary_reporting,reliability_tier")
        .in("story_id", storyIds);

      if (sourceErr) throw sourceErr;

      // Merge sources into stories
      const sourcesByStory = new Map<string, typeof sourceData>();
      for (const src of sourceData || []) {
        const existing = sourcesByStory.get(src.story_id) || [];
        existing.push(src);
        sourcesByStory.set(src.story_id, existing);
      }

      const enriched = (storyData || []).map((s) => ({
        ...s,
        sources: sourcesByStory.get(s.id) || [],
      })) as StoryWithSources[];

      setStories(enriched);
    } catch (err) {
      console.error("[LatestStoriesVerification] fetch failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const stats = useMemo(() => {
    const highConfidence = stories.filter((s) => s.confidence_level === "high").length;
    const mediumConfidence = stories.filter((s) => s.confidence_level === "medium").length;
    const lowConfidence = stories.filter((s) => s.confidence_level === "low" || !s.confidence_level).length;
    const multiSource = stories.filter((s) => (s.source_count || 0) > 1).length;
    const singleSource = stories.filter((s) => (s.source_count || 0) <= 1).length;

    return { highConfidence, mediumConfidence, lowConfidence, multiSource, singleSource };
  }, [stories]);

  const getConfidenceColor = (level: string | null) => {
    switch (level) {
      case "high":
        return "text-emerald-600 bg-emerald-50 border-emerald-200";
      case "medium":
        return "text-amber-600 bg-amber-50 border-amber-200";
      default:
        return "text-red-600 bg-red-50 border-red-200";
    }
  };

  const selectedStoryData = stories.find((s) => s.id === selectedStory);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Latest Stories Verification
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchStories}
            disabled={isLoading}
            className="h-7 w-7 p-0"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Stats Row */}
        <div className="grid grid-cols-5 gap-2 text-center">
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
            <div className="text-lg font-bold text-emerald-600">{stats.highConfidence}</div>
            <div className="text-[10px] text-muted-foreground">High</div>
          </div>
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
            <div className="text-lg font-bold text-amber-600">{stats.mediumConfidence}</div>
            <div className="text-[10px] text-muted-foreground">Medium</div>
          </div>
          <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
            <div className="text-lg font-bold text-red-600">{stats.lowConfidence}</div>
            <div className="text-[10px] text-muted-foreground">Low</div>
          </div>
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <div className="text-lg font-bold text-blue-600">{stats.multiSource}</div>
            <div className="text-[10px] text-muted-foreground">Multi-Src</div>
          </div>
          <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-900/20">
            <div className="text-lg font-bold text-gray-600">{stats.singleSource}</div>
            <div className="text-[10px] text-muted-foreground">Single-Src</div>
          </div>
        </div>

        <Separator />

        {/* Story List */}
        <ScrollArea className="h-80">
          {stories.length === 0 && !isLoading ? (
            <div className="text-sm text-muted-foreground py-6 text-center">
              No stories from today yet — click refresh.
            </div>
          ) : (
            <div className="space-y-2">
              {stories.map((story) => (
                <div
                  key={story.id}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-all",
                    selectedStory === story.id
                      ? "border-primary bg-primary/5"
                      : "border-border/50 hover:bg-muted/50"
                  )}
                  onClick={() => setSelectedStory(selectedStory === story.id ? null : story.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-2">{story.headline}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-[10px]">
                          {story.category || "Uncategorized"}
                        </Badge>
                        {story.state && (
                          <Badge variant="outline" className="text-[10px]">
                            {story.state}
                          </Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(story.first_published_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className={cn("text-[10px]", getConfidenceColor(story.confidence_level))}>
                        {story.confidence_level || "low"}
                      </Badge>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Layers className="w-3 h-3" />
                        {story.source_count || 0} sources
                      </div>
                    </div>
                  </div>

                  {/* Expanded Source Details */}
                  {selectedStory === story.id && story.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Sources:</p>
                      {story.sources.map((src) => (
                        <div
                          key={src.id}
                          className="flex items-center justify-between text-xs p-2 rounded bg-muted/50"
                        >
                          <div className="flex items-center gap-2">
                            {src.is_primary_reporting ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <AlertCircle className="w-3 h-3 text-amber-500" />
                            )}
                            <span className="font-medium">{src.source_name}</span>
                            {src.reliability_tier && (
                              <Badge variant="outline" className="text-[9px]">
                                {src.reliability_tier}
                              </Badge>
                            )}
                          </div>
                          <a
                            href={src.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
