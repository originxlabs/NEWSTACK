import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Rss,
  Database,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";

interface IngestionRun {
  id: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  total_feeds_processed: number | null;
  total_stories_created: number | null;
  total_stories_merged: number | null;
  error_message: string | null;
}

interface RssFeed {
  id: string;
  name: string;
  url: string;
  language: string | null;
  last_fetched_at: string | null;
  is_active: boolean;
}

interface IngestionStatusPanelProps {
  className?: string;
  compact?: boolean;
}

export function IngestionStatusPanel({ className, compact = false }: IngestionStatusPanelProps) {
  const [latestRun, setLatestRun] = useState<IngestionRun | null>(null);
  const [feeds, setFeeds] = useState<RssFeed[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [runResult, feedsResult] = await Promise.all([
        supabase
          .from("ingestion_runs")
          .select("*")
          .order("started_at", { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from("rss_feeds")
          .select("id, name, url, language, last_fetched_at, is_active")
          .eq("country_code", "IN")
          .eq("is_active", true)
          .order("last_fetched_at", { ascending: false, nullsFirst: false })
          .limit(20),
      ]);

      if (runResult.data) {
        setLatestRun(runResult.data as IngestionRun);
      }
      if (feedsResult.data) {
        setFeeds(feedsResult.data as RssFeed[]);
      }
    } catch (err) {
      console.error("Failed to fetch ingestion status:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "running":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case "failed":
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-amber-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "success":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "running":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "failed":
      case "error":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      default:
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    }
  };

  if (isLoading && !latestRun) {
    return (
      <Card className={cn("border-border/50", className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading ingestion status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2 text-xs", className)}>
        {latestRun && (
          <>
            {getStatusIcon(latestRun.status)}
            <span className="text-muted-foreground">
              Last run: {formatDistanceToNow(new Date(latestRun.started_at), { addSuffix: true })}
            </span>
            {latestRun.total_stories_created && latestRun.total_stories_created > 0 && (
              <Badge variant="outline" className="text-[10px] h-5">
                +{latestRun.total_stories_created} stories
              </Badge>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <Card className={cn("border-border/50", className)}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors p-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Database className="w-4 h-4" />
                Ingestion Status
              </CardTitle>
              <div className="flex items-center gap-2">
                {latestRun && (
                  <Badge variant="outline" className={cn("text-xs", getStatusColor(latestRun.status))}>
                    {getStatusIcon(latestRun.status)}
                    <span className="ml-1 capitalize">{latestRun.status}</span>
                  </Badge>
                )}
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            {/* Quick stats */}
            {latestRun && (
              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                <span>
                  {formatDistanceToNow(new Date(latestRun.started_at), { addSuffix: true })}
                </span>
                {latestRun.total_feeds_processed !== null && (
                  <span>{latestRun.total_feeds_processed} feeds</span>
                )}
                {latestRun.total_stories_created !== null && (
                  <span className="text-emerald-600">+{latestRun.total_stories_created} new</span>
                )}
                {latestRun.total_stories_merged !== null && latestRun.total_stories_merged > 0 && (
                  <span className="text-blue-600">{latestRun.total_stories_merged} merged</span>
                )}
              </div>
            )}
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 px-4">
            {/* Error message if failed */}
            {latestRun?.error_message && (
              <div className="mb-4 p-3 rounded-md bg-red-500/10 border border-red-500/20 text-xs text-red-600">
                <strong>Error:</strong> {latestRun.error_message}
              </div>
            )}
            
            {/* Feeds list */}
            <div className="space-y-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Rss className="w-3 h-3" />
                  Recent Feed Activity ({feeds.length} feeds)
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => fetchData()}
                  disabled={isLoading}
                >
                  <RefreshCw className={cn("w-3 h-3 mr-1", isLoading && "animate-spin")} />
                  Refresh
                </Button>
              </div>
              
              <div className="max-h-48 overflow-y-auto space-y-1">
                {feeds.map((feed) => (
                  <div
                    key={feed.id}
                    className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="truncate font-medium" title={feed.name}>
                        {feed.name}
                      </span>
                      {feed.language && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1 flex-shrink-0">
                          {feed.language.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      {feed.last_fetched_at ? (
                        <span className="text-muted-foreground" title={format(new Date(feed.last_fetched_at), "PPpp")}>
                          {formatDistanceToNow(new Date(feed.last_fetched_at), { addSuffix: true })}
                        </span>
                      ) : (
                        <span className="text-amber-500">Never fetched</span>
                      )}
                      <a
                        href={feed.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                        title={feed.url}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
