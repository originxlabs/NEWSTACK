import { useState, useEffect, useMemo, useCallback } from "react";
import { formatDistanceToNow, subHours } from "date-fns";
import { 
  Activity, RefreshCw, AlertTriangle, CheckCircle2, 
  XCircle, Pause, Play, TrendingUp, TrendingDown,
  Loader2, BarChart3, Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FeedHealth {
  id: string;
  name: string;
  url: string;
  is_active: boolean | null;
  reliability_tier: string | null;
  last_fetched_at: string | null;
  error_count: number;
  total_fetch_count: number;
  avg_stories_per_fetch: number;
  health_score: number;
  last_error_at: string | null;
  last_error_message: string | null;
}

interface Recommendation {
  feedId: string;
  feedName: string;
  type: "pause" | "investigate" | "boost";
  reason: string;
  severity: "high" | "medium" | "low";
}

export function FeedHealthScorer({ className }: { className?: string }) {
  const [feeds, setFeeds] = useState<FeedHealth[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPausing, setIsPausing] = useState<string | null>(null);

  const fetchFeeds = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("rss_feeds")
        .select("id,name,url,is_active,reliability_tier,last_fetched_at,error_count,total_fetch_count,avg_stories_per_fetch,health_score,last_error_at,last_error_message")
        .order("health_score", { ascending: true });

      if (error) throw error;
      setFeeds((data || []) as unknown as FeedHealth[]);
    } catch (err) {
      console.error("[FeedHealthScorer] fetch failed:", err);
      toast.error("Failed to load feed health data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeeds();
  }, [fetchFeeds]);

  // Calculate recommendations
  const recommendations = useMemo<Recommendation[]>(() => {
    const recs: Recommendation[] = [];

    for (const feed of feeds) {
      if (!feed.is_active) continue;

      const errorRate = feed.total_fetch_count > 0 
        ? (feed.error_count / feed.total_fetch_count) * 100 
        : 0;
      const healthScore = feed.health_score || 100;
      const avgStories = feed.avg_stories_per_fetch || 0;

      // High error rate - recommend pausing
      if (errorRate > 50 && feed.total_fetch_count >= 5) {
        recs.push({
          feedId: feed.id,
          feedName: feed.name,
          type: "pause",
          reason: `${errorRate.toFixed(0)}% error rate (${feed.error_count}/${feed.total_fetch_count} fetches)`,
          severity: "high",
        });
      }
      // Recent errors - recommend investigation
      else if (feed.last_error_at && new Date(feed.last_error_at) > subHours(new Date(), 6)) {
        recs.push({
          feedId: feed.id,
          feedName: feed.name,
          type: "investigate",
          reason: feed.last_error_message || "Recent fetch error",
          severity: "medium",
        });
      }
      // Low health score but recoverable
      else if (healthScore < 50 && healthScore > 20) {
        recs.push({
          feedId: feed.id,
          feedName: feed.name,
          type: "investigate",
          reason: `Health score dropped to ${healthScore}%`,
          severity: "medium",
        });
      }
      // Very low health - pause
      else if (healthScore <= 20) {
        recs.push({
          feedId: feed.id,
          feedName: feed.name,
          type: "pause",
          reason: `Critical health score: ${healthScore}%`,
          severity: "high",
        });
      }
      // High performing - boost priority
      else if (healthScore >= 95 && avgStories > 5) {
        recs.push({
          feedId: feed.id,
          feedName: feed.name,
          type: "boost",
          reason: `Excellent performance: ${avgStories.toFixed(1)} avg stories, ${healthScore}% health`,
          severity: "low",
        });
      }
    }

    return recs.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }, [feeds]);

  const toggleFeedActive = async (feedId: string, currentActive: boolean) => {
    setIsPausing(feedId);
    try {
      const { error } = await supabase
        .from("rss_feeds")
        .update({ is_active: !currentActive })
        .eq("id", feedId);

      if (error) throw error;
      toast.success(currentActive ? "Feed paused" : "Feed activated");
      await fetchFeeds();
    } catch (err) {
      console.error("Failed to toggle feed:", err);
      toast.error("Failed to update feed status");
    } finally {
      setIsPausing(null);
    }
  };

  const stats = useMemo(() => {
    const active = feeds.filter((f) => f.is_active).length;
    const healthy = feeds.filter((f) => (f.health_score || 100) >= 80).length;
    const warning = feeds.filter((f) => (f.health_score || 100) >= 50 && (f.health_score || 100) < 80).length;
    const critical = feeds.filter((f) => (f.health_score || 100) < 50).length;
    const avgHealth = feeds.length > 0 
      ? feeds.reduce((sum, f) => sum + (f.health_score || 100), 0) / feeds.length 
      : 100;

    return { active, healthy, warning, critical, avgHealth };
  }, [feeds]);

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 bg-emerald-50";
    if (score >= 50) return "text-amber-600 bg-amber-50";
    return "text-red-600 bg-red-50";
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Feed Health Scorer
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchFeeds}
            disabled={isLoading}
            className="h-7 w-7 p-0"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Overall Health */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Health</span>
            <span className="font-medium">{stats.avgHealth.toFixed(0)}%</span>
          </div>
          <Progress 
            value={stats.avgHealth} 
            className={cn(
              "h-2",
              stats.avgHealth >= 80 ? "[&>div]:bg-emerald-500" :
              stats.avgHealth >= 50 ? "[&>div]:bg-amber-500" : "[&>div]:bg-red-500"
            )} 
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
            <div className="text-lg font-bold text-emerald-600">{stats.healthy}</div>
            <div className="text-[10px] text-muted-foreground">Healthy</div>
          </div>
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
            <div className="text-lg font-bold text-amber-600">{stats.warning}</div>
            <div className="text-[10px] text-muted-foreground">Warning</div>
          </div>
          <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
            <div className="text-lg font-bold text-red-600">{stats.critical}</div>
            <div className="text-[10px] text-muted-foreground">Critical</div>
          </div>
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <div className="text-lg font-bold text-blue-600">{stats.active}</div>
            <div className="text-[10px] text-muted-foreground">Active</div>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Recommendations</p>
            <ScrollArea className="h-40">
              <div className="space-y-2">
                {recommendations.slice(0, 10).map((rec, idx) => (
                  <div
                    key={`${rec.feedId}-${idx}`}
                    className={cn(
                      "p-2 rounded-lg border text-xs",
                      rec.severity === "high" && "border-red-200 bg-red-50 dark:bg-red-900/20",
                      rec.severity === "medium" && "border-amber-200 bg-amber-50 dark:bg-amber-900/20",
                      rec.severity === "low" && "border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {rec.type === "pause" && <Pause className="w-3 h-3 text-red-500" />}
                        {rec.type === "investigate" && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                        {rec.type === "boost" && <TrendingUp className="w-3 h-3 text-emerald-500" />}
                        <span className="font-medium">{rec.feedName}</span>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9px]",
                          rec.type === "pause" && "text-red-600",
                          rec.type === "investigate" && "text-amber-600",
                          rec.type === "boost" && "text-emerald-600"
                        )}
                      >
                        {rec.type}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mt-1 truncate">{rec.reason}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Feed List with Toggle */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Feed Status</p>
          <ScrollArea className="h-48">
            <div className="space-y-1">
              {feeds.slice(0, 20).map((feed) => (
                <div
                  key={feed.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {(feed.health_score || 100) >= 80 ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                    ) : (feed.health_score || 100) >= 50 ? (
                      <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-3 h-3 text-red-500 flex-shrink-0" />
                    )}
                    <span className="text-xs truncate">{feed.name}</span>
                    <Badge className={cn("text-[9px]", getHealthColor(feed.health_score || 100))}>
                      {feed.health_score || 100}%
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {isPausing === feed.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Switch
                        checked={feed.is_active || false}
                        onCheckedChange={() => toggleFeedActive(feed.id, feed.is_active || false)}
                        className="scale-75"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
