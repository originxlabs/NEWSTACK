import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Database,
  Loader2,
  Rss,
  Play,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { OwnerOnlyGuard } from "@/components/newsroom/OwnerOnlyGuard";

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

interface RssIngestionLog {
  id: string;
  created_at: string;
  feed_id: string | null;
  feed_name: string | null;
  feed_url: string | null;
  status: string;
  stories_fetched: number | null;
  stories_inserted: number | null;
  duration_ms: number | null;
  error_message: string | null;
}

export default function NewsroomIngestionStatus() {
  const [runs, setRuns] = useState<IngestionRun[]>([]);
  const [logs, setLogs] = useState<RssIngestionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState<string | null>(null);
  const [isTriggering, setIsTriggering] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [runsResult, logsResult] = await Promise.all([
        supabase
          .from("ingestion_runs")
          .select("*")
          .order("started_at", { ascending: false })
          .limit(20),
        supabase
          .from("rss_ingestion_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      if (runsResult.error) throw runsResult.error;
      if (logsResult.error) throw logsResult.error;

      setRuns((runsResult.data || []) as IngestionRun[]);
      setLogs((logsResult.data || []) as RssIngestionLog[]);
    } catch (err) {
      console.error("Failed to fetch ingestion data:", err);
      toast.error("Failed to load ingestion data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const triggerIngestion = async () => {
    setIsTriggering(true);
    try {
      const { data, error } = await supabase.functions.invoke("ingest-rss");
      if (error) throw error;

      toast.success("Ingestion pipeline started", {
        description: `Run ID: ${data.runId}`,
      });
      await fetchData();
    } catch (err) {
      console.error("Failed to trigger ingestion:", err);
      toast.error("Failed to trigger ingestion");
    } finally {
      setIsTriggering(false);
    }
  };

  const retryFeed = async (feedId: string, feedName: string) => {
    if (!feedId) {
      toast.error("Cannot retry: no feed ID");
      return;
    }

    setIsRetrying(feedId);
    try {
      // Trigger ingestion for specific feed
      const { data, error } = await supabase.functions.invoke("ingest-rss", {
        body: { feedIds: [feedId] },
      });

      if (error) throw error;

      toast.success(`Retrying feed: ${feedName}`);
      await fetchData();
    } catch (err) {
      console.error("Failed to retry feed:", err);
      toast.error(`Failed to retry feed: ${feedName}`);
    } finally {
      setIsRetrying(null);
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      success: "default",
      running: "secondary",
      failed: "destructive",
      error: "destructive",
      partial: "outline",
    };

    return (
      <Badge variant={variants[status] || "outline"} className="text-xs">
        {status === "completed" || status === "success" ? (
          <CheckCircle2 className="w-3 h-3 mr-1" />
        ) : status === "running" ? (
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
        ) : status === "failed" || status === "error" ? (
          <XCircle className="w-3 h-3 mr-1" />
        ) : (
          <Clock className="w-3 h-3 mr-1" />
        )}
        {status}
      </Badge>
    );
  };

  return (
    <OwnerOnlyGuard requireOwner pageName="Ingestion Status">
      <div className="p-6 sm:p-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold mb-2">Ingestion Status</h1>
            <p className="text-muted-foreground">
              Monitor ingestion runs and RSS feed logs with retry capabilities
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={isLoading}
            >
              <RefreshCw
                className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")}
              />
              Refresh
            </Button>
            <Button onClick={triggerIngestion} disabled={isTriggering}>
              {isTriggering ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Trigger Ingestion
            </Button>
          </div>
        </div>

        {/* Ingestion Runs */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="w-5 h-5" />
              Recent Ingestion Runs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : runs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No ingestion runs yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Started</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Feeds</TableHead>
                    <TableHead>Stories Created</TableHead>
                    <TableHead>Merged</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runs.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell className="text-sm">
                        {formatDistanceToNow(new Date(run.started_at), {
                          addSuffix: true,
                        })}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={run.status} />
                      </TableCell>
                      <TableCell>{run.total_feeds_processed || 0}</TableCell>
                      <TableCell>{run.total_stories_created || 0}</TableCell>
                      <TableCell>{run.total_stories_merged || 0}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {run.completed_at
                          ? formatDistanceToNow(new Date(run.started_at), {
                              addSuffix: false,
                            })
                          : "Running..."}
                      </TableCell>
                      <TableCell>
                        {run.error_message && (
                          <span
                            className="text-xs text-destructive truncate max-w-[200px] block"
                            title={run.error_message}
                          >
                            {run.error_step}: {run.error_message.slice(0, 50)}...
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* RSS Feed Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Rss className="w-5 h-5" />
              RSS Feed Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-10 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Rss className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No RSS ingestion logs yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Feed</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Fetched</TableHead>
                    <TableHead>Inserted</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Error</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), "MMM d, HH:mm")}
                      </TableCell>
                      <TableCell
                        className="text-sm truncate max-w-[150px]"
                        title={log.feed_url || undefined}
                      >
                        {log.feed_name || log.feed_url?.slice(0, 30) || "Unknown"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={log.status} />
                      </TableCell>
                      <TableCell>{log.stories_fetched || 0}</TableCell>
                      <TableCell>{log.stories_inserted || 0}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {log.duration_ms ? `${log.duration_ms}ms` : "-"}
                      </TableCell>
                      <TableCell>
                        {log.error_message && (
                          <span
                            className="text-xs text-destructive truncate max-w-[150px] block"
                            title={log.error_message}
                          >
                            {log.error_message.slice(0, 40)}...
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {(log.status === "failed" || log.status === "error") &&
                          log.feed_id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() =>
                                retryFeed(log.feed_id!, log.feed_name || "Feed")
                              }
                              disabled={isRetrying === log.feed_id}
                            >
                              {isRetrying === log.feed_id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <RotateCcw className="w-3 h-3 mr-1" />
                              )}
                              Retry
                            </Button>
                          )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </OwnerOnlyGuard>
  );
}
