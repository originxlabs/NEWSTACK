import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  History,
  CheckCircle2,
  XCircle,
  Clock,
  Rss,
  FileText,
  GitMerge,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  User,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

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

interface IngestionRunHistoryProps {
  className?: string;
  defaultCollapsed?: boolean;
  maxRuns?: number;
}

export function IngestionRunHistory({
  className,
  defaultCollapsed = false, // Default to expanded to show data
  maxRuns = 10,
}: IngestionRunHistoryProps) {
  const [runs, setRuns] = useState<IngestionRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(!defaultCollapsed);

  const fetchRuns = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("ingestion_runs")
        .select("id,started_at,completed_at,status,total_feeds_processed,total_stories_created,total_stories_merged,error_message")
        .order("started_at", { ascending: false })
        .limit(maxRuns);

      if (error) throw error;
      setRuns(data || []);
    } catch (err) {
      console.error("Error fetching ingestion runs:", err);
    } finally {
      setIsLoading(false);
    }
  }, [maxRuns]);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  // Subscribe to realtime updates with error handling
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupChannel = () => {
      channel = supabase
        .channel("ingestion-runs-history")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "ingestion_runs" },
          () => {
            fetchRuns();
          }
        )
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR") {
            console.warn("[IngestionRunHistory] Channel error, retrying...");
            setTimeout(() => {
              if (channel) supabase.removeChannel(channel);
              setupChannel();
            }, 3000);
          }
        });
    };

    setupChannel();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [fetchRuns]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
      case "failed":
      case "error":
        return <XCircle className="w-3.5 h-3.5 text-red-500" />;
      case "running":
        return <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "failed":
      case "error":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      case "running":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getDuration = (run: IngestionRun) => {
    if (!run.completed_at) return null;
    const start = new Date(run.started_at).getTime();
    const end = new Date(run.completed_at).getTime();
    const durationMs = end - start;
    return `${(durationMs / 1000).toFixed(1)}s`;
  };

  // Detect trigger type from timing patterns (heuristic)
  const getTriggerType = (run: IngestionRun, index: number, allRuns: IngestionRun[]) => {
    // First run is usually manual
    if (index === allRuns.length - 1) return "manual";
    
    // Check time difference from previous run
    const prevRun = allRuns[index + 1];
    if (!prevRun) return "manual";
    
    const timeDiff = new Date(run.started_at).getTime() - new Date(prevRun.started_at).getTime();
    const fifteenMinutes = 15 * 60 * 1000;
    
    // If close to 15 minutes, likely auto
    if (Math.abs(timeDiff - fifteenMinutes) < 2 * 60 * 1000) {
      return "auto";
    }
    
    return "manual";
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-2 hover:text-primary transition-colors text-left">
                <History className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm font-medium">Run History</span>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
                {!isExpanded && runs.length > 0 && (
                  <Badge variant="outline" className="text-[10px] ml-2">
                    {runs.length} runs
                  </Badge>
                )}
              </button>
            </CollapsibleTrigger>

            <Button
              variant="ghost"
              size="sm"
              onClick={fetchRuns}
              disabled={isLoading}
              className="h-7 w-7 p-0"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
            </Button>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {isLoading && runs.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : runs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No ingestion runs yet</p>
              </div>
            ) : (
              <ScrollArea className="h-[320px]">
                <div className="space-y-2 pr-3">
                  <AnimatePresence>
                    {runs.map((run, index) => {
                      const triggerType = getTriggerType(run, index, runs);
                      const duration = getDuration(run);
                      const noNewNews =
                        run.status === "completed" &&
                        (run.total_stories_created || 0) === 0 &&
                        (run.total_stories_merged || 0) === 0;

                      return (
                        <motion.div
                          key={run.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ delay: index * 0.03 }}
                          className={cn(
                            "p-3 rounded-lg border transition-colors",
                            run.status === "running"
                              ? "border-blue-500/30 bg-blue-500/5"
                              : "border-border/50 hover:bg-muted/30"
                          )}
                        >
                          {/* Header row */}
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(run.status)}
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(run.started_at), {
                                  addSuffix: true,
                                })}
                              </span>
                              {duration && (
                                <Badge variant="outline" className="text-[9px] h-4 px-1.5">
                                  <Clock className="w-2.5 h-2.5 mr-0.5" />
                                  {duration}
                                </Badge>
                              )}
                            </div>

                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-[9px] h-4 px-1.5 gap-0.5",
                                triggerType === "auto"
                                  ? "bg-purple-500/10 text-purple-600"
                                  : "bg-blue-500/10 text-blue-600"
                              )}
                            >
                              {triggerType === "auto" ? (
                                <Zap className="w-2.5 h-2.5" />
                              ) : (
                                <User className="w-2.5 h-2.5" />
                              )}
                              {triggerType === "auto" ? "Auto" : "Manual"}
                            </Badge>
                          </div>

                          {/* Stats row */}
                          <div className="flex flex-wrap items-center gap-2">
                            {run.total_feeds_processed !== null &&
                              run.total_feeds_processed > 0 && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] h-4 px-1.5 gap-0.5"
                                >
                                  <Rss className="w-2.5 h-2.5" />
                                  {run.total_feeds_processed} feeds
                                </Badge>
                              )}

                            {run.total_stories_created !== null &&
                              run.total_stories_created > 0 && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] h-4 px-1.5 gap-0.5 bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                >
                                  <FileText className="w-2.5 h-2.5" />
                                  +{run.total_stories_created} new
                                </Badge>
                              )}

                            {run.total_stories_merged !== null &&
                              run.total_stories_merged > 0 && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] h-4 px-1.5 gap-0.5 bg-purple-500/10 text-purple-600 border-purple-500/20"
                                >
                                  <GitMerge className="w-2.5 h-2.5" />
                                  {run.total_stories_merged} merged
                                </Badge>
                              )}

                            {noNewNews && (
                              <Badge
                                variant="outline"
                                className="text-[9px] h-4 px-1.5 bg-muted text-muted-foreground"
                              >
                                No new news
                              </Badge>
                            )}

                            {run.status === "failed" && run.error_message && (
                              <Badge
                                variant="outline"
                                className="text-[9px] h-4 px-1.5 bg-red-500/10 text-red-600 border-red-500/20 max-w-[200px] truncate"
                              >
                                {run.error_message.slice(0, 40)}
                                {run.error_message.length > 40 ? "..." : ""}
                              </Badge>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
