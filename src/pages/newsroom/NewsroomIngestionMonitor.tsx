import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, RefreshCw, CheckCircle2, XCircle, Clock, 
  AlertTriangle, Rss, Play, RotateCcw, Filter,
  Loader2, Shield, Radio, ExternalLink, ChevronDown, ChevronUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNewsroomRole } from "@/hooks/use-newsroom-role";

interface IngestionRun {
  id: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  total_feeds_processed: number | null;
  total_stories_created: number | null;
  total_stories_merged: number | null;
  error_message: string | null;
  error_step: string | null;
}

interface FeedFetchResult {
  id: string;
  ingestion_run_id: string;
  feed_id: string;
  feed_name: string;
  status: string;
  stories_fetched: number;
  stories_inserted: number;
  error_message: string | null;
  duration_ms: number | null;
  created_at: string;
}

interface FeedWithHealth {
  id: string;
  name: string;
  url: string;
  state_id: string | null;
  reliability_tier: string | null;
  is_active: boolean | null;
  last_fetched_at: string | null;
  error_count: number;
  total_fetch_count: number;
  avg_stories_per_fetch: number;
  health_score: number;
  last_error_at: string | null;
  last_error_message: string | null;
}

export default function NewsroomIngestionMonitor() {
  const { isOwnerOrSuperadmin, loading: roleLoading } = useNewsroomRole();
  const [latestRun, setLatestRun] = useState<IngestionRun | null>(null);
  const [feedResults, setFeedResults] = useState<FeedFetchResult[]>([]);
  const [feeds, setFeeds] = useState<FeedWithHealth[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetriggering, setIsRetriggering] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [errorsExpanded, setErrorsExpanded] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [runsRes, feedsRes] = await Promise.all([
        supabase
          .from("ingestion_runs")
          .select("*")
          .order("started_at", { ascending: false })
          .limit(1),
        supabase
          .from("rss_feeds")
          .select("id,name,url,state_id,reliability_tier,is_active,last_fetched_at,error_count,total_fetch_count,avg_stories_per_fetch,health_score,last_error_at,last_error_message")
          .eq("is_active", true)
          .order("health_score", { ascending: true }),
      ]);

      if (runsRes.error) throw runsRes.error;
      if (feedsRes.error) throw feedsRes.error;

      const run = runsRes.data?.[0] as IngestionRun | undefined;
      setLatestRun(run || null);

      // Fetch feed results for latest run if exists
      if (run) {
        const { data: results, error: resultsErr } = await supabase
          .from("feed_fetch_results")
          .select("*")
          .eq("ingestion_run_id", run.id)
          .order("created_at", { ascending: true });

        if (!resultsErr) {
          setFeedResults((results || []) as FeedFetchResult[]);
        }
      }

      setFeeds((feedsRes.data || []) as unknown as FeedWithHealth[]);
    } catch (err) {
      console.error("Failed to fetch ingestion monitor data:", err);
      toast.error("Failed to load ingestion data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Real-time subscription
    const channel = supabase
      .channel("ingestion-monitor")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ingestion_runs" },
        () => fetchData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "feed_fetch_results" },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const retriggerFeed = async (feedId: string, feedName: string) => {
    setIsRetriggering(feedId);
    try {
      const { error } = await supabase.functions.invoke("ingest-rss", {
        body: { trigger: "manual", feedId },
      });

      if (error) throw error;
      toast.success(`Re-triggered ingestion for ${feedName}`);
      await fetchData();
    } catch (err) {
      console.error("Failed to retrigger feed:", err);
      toast.error(`Failed to retrigger ${feedName}`);
    } finally {
      setIsRetriggering(null);
    }
  };

  const filteredFeeds = feeds.filter((f) => {
    const matchesSearch = !searchQuery || 
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.url.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesErrors = !showErrors || (f.error_count || 0) > 0;
    return matchesSearch && matchesErrors;
  });

  const errorFeeds = feeds.filter((f) => (f.error_count || 0) > 0);
  const healthyFeeds = feeds.filter((f) => (f.health_score || 100) >= 80);

  if (roleLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isOwnerOrSuperadmin) {
    return (
      <div className="p-8">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-destructive" />
              <div>
                <h3 className="font-semibold">Access Denied</h3>
                <p className="text-sm text-muted-foreground">
                  Only Owner and Superadmin can access the Ingestion Monitor.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            Ingestion Monitor
          </h1>
          <p className="text-muted-foreground text-sm">
            Real-time feed status, per-feed results, and error breakdown
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={isLoading}
        >
          <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Latest Run Status */}
      {latestRun && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Radio className="w-4 h-4 text-primary" />
                Latest Run Status
              </CardTitle>
              <Badge
                variant={
                  latestRun.status === "completed" ? "default" :
                  latestRun.status === "running" ? "secondary" :
                  latestRun.status === "failed" ? "destructive" : "outline"
                }
              >
                {latestRun.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <div className="text-2xl font-bold">{latestRun.total_feeds_processed || 0}</div>
                <div className="text-xs text-muted-foreground">Feeds Processed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-600">{latestRun.total_stories_created || 0}</div>
                <div className="text-xs text-muted-foreground">Stories Created</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{latestRun.total_stories_merged || 0}</div>
                <div className="text-xs text-muted-foreground">Stories Merged</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {latestRun.completed_at
                    ? formatDistanceToNow(new Date(latestRun.started_at), { addSuffix: false })
                    : "Running..."}
                </div>
                <div className="text-xs text-muted-foreground">Duration</div>
              </div>
            </div>

            {latestRun.error_message && (
              <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-destructive">Error in {latestRun.error_step || "pipeline"}</p>
                    <p className="text-xs text-muted-foreground">{latestRun.error_message}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error Breakdown */}
      {errorFeeds.length > 0 && (
        <Collapsible open={errorsExpanded} onOpenChange={setErrorsExpanded}>
          <Card className="border-amber-500/30">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2 text-amber-600">
                    <AlertTriangle className="w-4 h-4" />
                    Error Breakdown ({errorFeeds.length} feeds)
                  </CardTitle>
                  {errorsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {errorFeeds.map((feed) => (
                      <div
                        key={feed.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/30"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{feed.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{feed.url}</div>
                          {feed.last_error_message && (
                            <div className="text-xs text-red-500 mt-1 truncate">{feed.last_error_message}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Badge variant="destructive" className="text-[10px]">
                            {feed.error_count} errors
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => retriggerFeed(feed.id, feed.name)}
                            disabled={isRetriggering === feed.id}
                          >
                            {isRetriggering === feed.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <RotateCcw className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Per-Feed Results */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Rss className="w-4 h-4 text-primary" />
              All Feeds ({filteredFeeds.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search feeds..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48"
              />
              <Button
                variant={showErrors ? "secondary" : "outline"}
                size="sm"
                onClick={() => setShowErrors(!showErrors)}
              >
                <Filter className="w-3 h-3 mr-1" />
                Errors Only
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : filteredFeeds.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Rss className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No feeds found</p>
            </div>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {filteredFeeds.map((feed) => (
                    <motion.div
                      key={feed.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{feed.name}</span>
                          {feed.state_id && (
                            <Badge variant="outline" className="text-[10px]">
                              {feed.state_id}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-[10px]">
                            {feed.reliability_tier || "unknown"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <span className="truncate max-w-[200px]">{feed.url}</span>
                          <span>Avg: {(feed.avg_stories_per_fetch || 0).toFixed(1)} stories</span>
                          {feed.last_fetched_at && (
                            <span>Last: {formatDistanceToNow(new Date(feed.last_fetched_at), { addSuffix: true })}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">Health:</span>
                            <Badge
                              variant={(feed.health_score || 100) >= 80 ? "default" : (feed.health_score || 100) >= 50 ? "secondary" : "destructive"}
                              className="text-[10px]"
                            >
                              {feed.health_score || 100}%
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => retriggerFeed(feed.id, feed.name)}
                          disabled={isRetriggering === feed.id}
                        >
                          {isRetriggering === feed.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Play className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Health Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-emerald-600">{healthyFeeds.length}</p>
            <p className="text-xs text-muted-foreground">Healthy Feeds (≥80%)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-amber-600">{errorFeeds.length}</p>
            <p className="text-xs text-muted-foreground">Feeds with Errors</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Rss className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold">{feeds.length}</p>
            <p className="text-xs text-muted-foreground">Total Active Feeds</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
