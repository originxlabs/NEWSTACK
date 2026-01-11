import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  Play, RefreshCw, CheckCircle2, XCircle, Clock, 
  AlertTriangle, Database, Filter, Trash2,
  ArrowRight, Loader2, Rss, FileCheck, Tag, GitMerge, Save, Shield, Radio
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNewsroomRole } from "@/hooks/use-newsroom-role";

interface IngestionRun {
  id: string;
  started_at: string;
  completed_at: string | null;
  status: "running" | "completed" | "failed" | "partial";
  step_fetch_feeds: string;
  step_fetch_feeds_count: number;
  step_normalize: string;
  step_normalize_count: number;
  step_validate: string;
  step_validate_rejected: number;
  step_classify: string;
  step_classify_count: number;
  step_dedupe: string;
  step_dedupe_merged: number;
  step_store: string;
  step_store_created: number;
  step_cleanup: string;
  step_cleanup_deleted: number;
  tier1_feeds: number;
  tier2_feeds: number;
  tier3_feeds: number;
  error_message: string | null;
  error_step: string | null;
  total_feeds_processed: number;
  total_stories_created: number;
  total_stories_merged: number;
}

const PIPELINE_STEPS = [
  { key: "fetch_feeds", label: "Fetch Feeds", icon: Rss, description: "Fetching RSS feeds from sources" },
  { key: "normalize", label: "Normalize", icon: FileCheck, description: "Stripping HTML, decoding entities" },
  { key: "validate", label: "Validate", icon: Filter, description: "Rejecting malformed content" },
  { key: "classify", label: "Classify", icon: Tag, description: "Categorizing stories" },
  { key: "dedupe", label: "Dedupe", icon: GitMerge, description: "Merging duplicate stories" },
  { key: "store", label: "Store", icon: Save, description: "Saving to database" },
  { key: "cleanup", label: "Cleanup", icon: Trash2, description: "Removing old stories" },
];

function getStepStatus(run: IngestionRun | null, stepKey: string): "pending" | "running" | "completed" | "failed" {
  if (!run) return "pending";
  const value = run[`step_${stepKey}` as keyof IngestionRun];
  if (typeof value === "string") {
    return value as "pending" | "running" | "completed" | "failed";
  }
  return "pending";
}

function getStepCount(run: IngestionRun | null, stepKey: string): number {
  if (!run) return 0;
  const countKey = stepKey === "fetch_feeds" ? "step_fetch_feeds_count" 
    : stepKey === "validate" ? "step_validate_rejected"
    : stepKey === "dedupe" ? "step_dedupe_merged"
    : stepKey === "store" ? "step_store_created"
    : stepKey === "cleanup" ? "step_cleanup_deleted"
    : `step_${stepKey}_count`;
  
  const value = run[countKey as keyof IngestionRun];
  return typeof value === "number" ? value : 0;
}

function getStepLabel(stepKey: string): string {
  switch (stepKey) {
    case "fetch_feeds": return "feeds";
    case "normalize": return "items";
    case "validate": return "rejected";
    case "classify": return "classified";
    case "dedupe": return "merged";
    case "store": return "created";
    case "cleanup": return "deleted";
    default: return "";
  }
}

export default function NewsroomIngestion() {
  const { isOwnerOrSuperadmin, loading: roleLoading } = useNewsroomRole();
  const [runs, setRuns] = useState<IngestionRun[]>([]);
  const [currentRun, setCurrentRun] = useState<IngestionRun | null>(null);
  const [isTriggering, setIsTriggering] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRealtime, setIsRealtime] = useState(false);

  // Fetch ingestion runs
  const fetchRuns = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("ingestion_runs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      
      const typedData = data as unknown as IngestionRun[];
      setRuns(typedData || []);
      
      // Set current run if one is running
      const running = typedData?.find(r => r.status === "running");
      if (running) {
        setCurrentRun(running);
      } else if (typedData && typedData.length > 0) {
        setCurrentRun(typedData[0]);
      }
    } catch (err) {
      console.error("Failed to fetch ingestion runs:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Real-time subscription for ingestion runs
  useEffect(() => {
    fetchRuns();

    // Subscribe to real-time updates on ingestion_runs table
    const channel = supabase
      .channel('ingestion-runs-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ingestion_runs',
        },
        (payload) => {
          console.log('Realtime update:', payload);
          setIsRealtime(true);
          
          if (payload.eventType === 'INSERT') {
            const newRun = payload.new as unknown as IngestionRun;
            setRuns(prev => [newRun, ...prev].slice(0, 20));
            setCurrentRun(newRun);
            toast.info("New ingestion run started");
          } else if (payload.eventType === 'UPDATE') {
            const updatedRun = payload.new as unknown as IngestionRun;
            setRuns(prev => prev.map(r => r.id === updatedRun.id ? updatedRun : r));
            if (currentRun?.id === updatedRun.id) {
              setCurrentRun(updatedRun);
            }
            
            // Show toast on completion
            if (updatedRun.status === 'completed' && currentRun?.status === 'running') {
              toast.success("Ingestion completed!", {
                description: `Created ${updatedRun.total_stories_created} stories, merged ${updatedRun.total_stories_merged}`,
              });
            } else if (updatedRun.status === 'failed') {
              toast.error("Ingestion failed", {
                description: updatedRun.error_message || "Unknown error",
              });
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          setIsRealtime(true);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Trigger new ingestion run
  const triggerIngestion = async () => {
    setIsTriggering(true);
    try {
      const { data, error } = await supabase.functions.invoke("ingest-rss");
      
      if (error) throw error;
      
      toast.success("Ingestion pipeline started", {
        description: `Run ID: ${data.runId}`,
      });
      
      // Real-time will handle the update, but fetch for immediate feedback
      await fetchRuns();
    } catch (err) {
      console.error("Failed to trigger ingestion:", err);
      toast.error("Failed to trigger ingestion", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsTriggering(false);
    }
  };

  // Calculate progress percentage
  const getProgress = (run: IngestionRun | null): number => {
    if (!run) return 0;
    let completed = 0;
    PIPELINE_STEPS.forEach(step => {
      const status = getStepStatus(run, step.key);
      if (status === "completed") completed++;
    });
    return (completed / PIPELINE_STEPS.length) * 100;
  };

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "running":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  // Access check
  if (roleLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Checking access...</div>
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
                  Only Owner and Superadmin can access the ingestion pipeline.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="font-display text-2xl font-bold">Ingestion Pipeline</h1>
            {isRealtime && (
              <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">
                <Radio className="w-3 h-3 mr-1 animate-pulse" />
                Live
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            Monitor and trigger RSS feed ingestion with real-time step tracking
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRuns}
            disabled={isLoading}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
          <Button
            onClick={triggerIngestion}
            disabled={isTriggering || currentRun?.status === "running"}
          >
            {isTriggering ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            Trigger Ingestion
          </Button>
        </div>
      </div>

      {/* Pipeline Flow Diagram */}
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Pipeline Steps</CardTitle>
          {currentRun && (
            <Badge
              variant={
                currentRun.status === "completed" ? "default" :
                currentRun.status === "running" ? "secondary" :
                currentRun.status === "failed" ? "destructive" : "outline"
              }
            >
              {currentRun.status.toUpperCase()}
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {/* Progress bar */}
          {currentRun && (
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{Math.round(getProgress(currentRun))}%</span>
              </div>
              <Progress value={getProgress(currentRun)} className="h-2" />
            </div>
          )}

          {/* Pipeline steps flow */}
          <div className="flex flex-wrap items-center gap-2">
            {PIPELINE_STEPS.map((step, idx) => {
              const status = getStepStatus(currentRun, step.key);
              const count = getStepCount(currentRun, step.key);
              const label = getStepLabel(step.key);

              return (
                <div key={step.key} className="flex items-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className={cn(
                      "flex flex-col items-center p-4 rounded-lg border transition-colors min-w-[120px]",
                      status === "completed" && "border-emerald-500/50 bg-emerald-500/5",
                      status === "running" && "border-blue-500/50 bg-blue-500/5",
                      status === "failed" && "border-red-500/50 bg-red-500/5",
                      status === "pending" && "border-border bg-muted/30"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <step.icon className={cn(
                        "w-5 h-5",
                        status === "completed" && "text-emerald-500",
                        status === "running" && "text-blue-500",
                        status === "failed" && "text-red-500",
                        status === "pending" && "text-muted-foreground"
                      )} />
                      <StatusIcon status={status} />
                    </div>
                    <span className="text-sm font-medium">{step.label}</span>
                    {count > 0 && (
                      <span className="text-xs text-muted-foreground mt-1">
                        {count} {label}
                      </span>
                    )}
                  </motion.div>
                  
                  {idx < PIPELINE_STEPS.length - 1 && (
                    <ArrowRight className="w-4 h-4 mx-2 text-muted-foreground" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Error display */}
          {currentRun?.error_message && (
            <div className="mt-6 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">Error in {currentRun.error_step || "pipeline"}</p>
                  <p className="text-sm text-muted-foreground mt-1">{currentRun.error_message}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {currentRun && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Rss className="w-5 h-5 text-primary" />
              </div>
              <p className="text-2xl font-bold">{currentRun.total_feeds_processed || 0}</p>
              <p className="text-xs text-muted-foreground">Feeds Processed</p>
              <div className="flex gap-1 mt-2">
                <Badge variant="outline" className="text-[10px]">T1: {currentRun.tier1_feeds || 0}</Badge>
                <Badge variant="outline" className="text-[10px]">T2: {currentRun.tier2_feeds || 0}</Badge>
                <Badge variant="outline" className="text-[10px]">T3: {currentRun.tier3_feeds || 0}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Save className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold">{currentRun.total_stories_created || 0}</p>
              <p className="text-xs text-muted-foreground">Stories Created</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <GitMerge className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-2xl font-bold">{currentRun.total_stories_merged || 0}</p>
              <p className="text-xs text-muted-foreground">Stories Merged</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">
                {currentRun.completed_at 
                  ? formatDistanceToNow(new Date(currentRun.started_at), { addSuffix: false })
                  : "Running..."}
              </p>
              <p className="text-xs text-muted-foreground">Duration</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Runs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Runs</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : runs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No ingestion runs yet</p>
              <p className="text-xs">Trigger an ingestion to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {runs.map((run) => (
                <motion.div
                  key={run.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors",
                    currentRun?.id === run.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                  )}
                  onClick={() => setCurrentRun(run)}
                >
                  <div className="flex items-center gap-4">
                    <Badge
                      variant={
                        run.status === "completed" ? "default" :
                        run.status === "running" ? "secondary" :
                        run.status === "failed" ? "destructive" : "outline"
                      }
                      className="min-w-[80px] justify-center"
                    >
                      {run.status === "running" && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                      {run.status}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">
                        {format(new Date(run.started_at), "MMM d, yyyy HH:mm:ss")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {run.total_stories_created || 0} created • {run.total_stories_merged || 0} merged
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{run.total_feeds_processed || 0} feeds</span>
                    <span>
                      {run.completed_at 
                        ? formatDistanceToNow(new Date(run.started_at), { addSuffix: true })
                        : "In progress..."}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}