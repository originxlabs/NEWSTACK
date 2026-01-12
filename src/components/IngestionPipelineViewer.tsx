import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rss,
  FileText,
  Code,
  Hash,
  FileCode,
  CheckCircle2,
  Brain,
  GitMerge,
  Layers,
  Gauge,
  Clock,
  Database,
  Monitor,
  Loader2,
  XCircle,
  Timer,
  ToggleLeft,
  ToggleRight,
  Play,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type PipelineStep = {
  id: string;
  name: string;
  icon: React.ReactNode;
  status: "pending" | "running" | "completed" | "error";
  count?: number;
  duration?: number;
};

const PIPELINE_STEPS: Omit<PipelineStep, "status">[] = [
  { id: "fetch", name: "RSS Feed", icon: <Rss className="w-4 h-4" /> },
  { id: "extract", name: "Extract", icon: <FileText className="w-4 h-4" /> },
  { id: "strip", name: "Strip CDATA", icon: <Code className="w-4 h-4" /> },
  { id: "decode", name: "Decode", icon: <Hash className="w-4 h-4" /> },
  { id: "validate", name: "Validate", icon: <CheckCircle2 className="w-4 h-4" /> },
  { id: "classify", name: "Classify", icon: <Brain className="w-4 h-4" /> },
  { id: "dedupe", name: "Deduplicate", icon: <GitMerge className="w-4 h-4" /> },
  { id: "cluster", name: "Cluster", icon: <Layers className="w-4 h-4" /> },
  { id: "score", name: "Score", icon: <Gauge className="w-4 h-4" /> },
  { id: "persist", name: "Persist", icon: <Database className="w-4 h-4" /> },
  { id: "complete", name: "Complete", icon: <Monitor className="w-4 h-4" /> },
];

interface IngestionPipelineViewerProps {
  onIngestionComplete?: () => void;
  autoRefreshInterval?: number; // in ms, 0 to disable
  showAutoRefreshControls?: boolean;
  className?: string;
}

export function IngestionPipelineViewer({
  onIngestionComplete,
  autoRefreshInterval = 15 * 60 * 1000, // Default 15 minutes
  showAutoRefreshControls = true,
  className,
}: IngestionPipelineViewerProps) {
  const [steps, setSteps] = useState<PipelineStep[]>(
    PIPELINE_STEPS.map((s) => ({ ...s, status: "pending" as const }))
  );
  const [isRunning, setIsRunning] = useState(false);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(autoRefreshInterval > 0);
  const [nextRefreshIn, setNextRefreshIn] = useState<number>(autoRefreshInterval / 1000);
  const [stats, setStats] = useState({
    feedsProcessed: 0,
    storiesCreated: 0,
    storiesMerged: 0,
    totalDuration: 0,
  });

  // Reset pipeline to initial state
  const resetPipeline = useCallback(() => {
    setSteps(PIPELINE_STEPS.map((s) => ({ ...s, status: "pending" as const })));
    setStats({ feedsProcessed: 0, storiesCreated: 0, storiesMerged: 0, totalDuration: 0 });
  }, []);

  // Simulate step progression with realistic timing
  const simulateStepProgress = useCallback(async (stepId: string, duration: number) => {
    // Set current step to running
    setSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, status: "running" as const } : s))
    );

    // Wait for simulated duration
    await new Promise((resolve) => setTimeout(resolve, duration));

    // Set step to completed
    setSteps((prev) =>
      prev.map((s) =>
        s.id === stepId ? { ...s, status: "completed" as const, duration } : s
      )
    );
  }, []);

  // Run the ingestion with visual pipeline
  const runIngestion = useCallback(async () => {
    if (isRunning) return;

    setIsRunning(true);
    resetPipeline();
    const startTime = Date.now();

    toast.loading("Starting ingestion pipeline...", { id: "ingestion-pipeline" });

    try {
      // Step 1: Fetch RSS Feeds
      await simulateStepProgress("fetch", 500);

      // Step 2: Extract fields
      await simulateStepProgress("extract", 400);

      // Step 3: Strip CDATA
      await simulateStepProgress("strip", 300);

      // Step 4: Decode entities
      await simulateStepProgress("decode", 300);

      // Step 5: Validate text
      await simulateStepProgress("validate", 400);

      // Step 6: Classify - set to running before API call
      setSteps((prev) =>
        prev.map((s) => (s.id === "classify" ? { ...s, status: "running" as const } : s))
      );

      // Now actually call the edge function
      const { data, error } = await supabase.functions.invoke("ingest-rss", {
        body: {},
      });

      if (error) {
        console.error("Ingestion API error:", error);
        // Mark classify as error since that's where we're at
        setSteps((prev) =>
          prev.map((s) => (s.id === "classify" ? { ...s, status: "error" as const } : s))
        );
        throw new Error(error.message || "Ingestion failed");
      }

      // Continue with remaining steps based on response
      // Step 6: Classify - complete
      setSteps((prev) =>
        prev.map((s) =>
          s.id === "classify" ? { ...s, status: "completed" as const, duration: 600 } : s
        )
      );
      setStats((prev) => ({
        ...prev,
        feedsProcessed: data?.stats?.feedsProcessed || data?.feedsProcessed || 0,
      }));

      // Step 7: Deduplicate
      await simulateStepProgress("dedupe", 500);
      setStats((prev) => ({
        ...prev,
        storiesMerged: data?.stats?.storiesMerged || data?.storiesMerged || 0,
      }));

      // Step 8: Cluster into stories
      await simulateStepProgress("cluster", 400);

      // Step 9: Score confidence
      await simulateStepProgress("score", 300);

      // Step 10: Persist to database
      await simulateStepProgress("persist", 500);
      setStats((prev) => ({
        ...prev,
        storiesCreated: data?.stats?.storiesCreated || data?.storiesCreated || 0,
      }));

      // Step 11: Complete
      await simulateStepProgress("complete", 200);

      const totalDuration = Date.now() - startTime;
      setStats((prev) => ({ ...prev, totalDuration }));
      setCurrentRunId(data?.runId || null);

      const feedsProcessed = data?.stats?.feedsProcessed || data?.feedsProcessed || 0;
      const storiesCreated = data?.stats?.storiesCreated || data?.storiesCreated || 0;

      toast.success("Ingestion complete!", {
        id: "ingestion-pipeline",
        description: `${feedsProcessed} feeds → ${storiesCreated} new stories`,
      });

      onIngestionComplete?.();
    } catch (err) {
      console.error("Ingestion error:", err);

      // Mark current running step as error
      setSteps((prev) =>
        prev.map((s) => (s.status === "running" ? { ...s, status: "error" as const } : s))
      );

      toast.error("Ingestion failed", {
        id: "ingestion-pipeline",
        description: err instanceof Error ? err.message : "Unknown error - check console for details",
      });
    } finally {
      setIsRunning(false);
    }
  }, [isRunning, resetPipeline, simulateStepProgress, onIngestionComplete]);

  // Auto-refresh polling with countdown
  useEffect(() => {
    if (!autoRefreshEnabled || autoRefreshInterval <= 0) return;

    // Reset countdown when auto-refresh starts or after an ingestion
    setNextRefreshIn(autoRefreshInterval / 1000);

    const countdownInterval = setInterval(() => {
      setNextRefreshIn((prev) => {
        if (prev <= 1) {
          if (!isRunning) {
            runIngestion();
          }
          return autoRefreshInterval / 1000;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [autoRefreshEnabled, autoRefreshInterval, isRunning, runIngestion]);

  const getStepColor = (status: PipelineStep["status"]) => {
    switch (status) {
      case "completed":
        return "bg-emerald-500 text-white border-emerald-600";
      case "running":
        return "bg-blue-500 text-white border-blue-600 animate-pulse";
      case "error":
        return "bg-red-500 text-white border-red-600";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getConnectorColor = (prevStatus: PipelineStep["status"]) => {
    switch (prevStatus) {
      case "completed":
        return "bg-emerald-500";
      case "running":
        return "bg-blue-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-border";
    }
  };

  const completedSteps = steps.filter((s) => s.status === "completed").length;
  const progressPercent = (completedSteps / steps.length) * 100;

  return (
    <Card className={cn("border-border/50 overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Rss className="w-4 h-4 text-primary" />
            RSS Processing Pipeline
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Auto-refresh toggle */}
            {showAutoRefreshControls && (
              <button
                onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors",
                  autoRefreshEnabled
                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                    : "bg-muted text-muted-foreground border border-border"
                )}
              >
                {autoRefreshEnabled ? (
                  <ToggleRight className="w-3.5 h-3.5" />
                ) : (
                  <ToggleLeft className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">Auto</span>
                {autoRefreshEnabled && !isRunning && (
                  <span className="flex items-center gap-0.5 text-[10px]">
                    <Timer className="w-3 h-3" />
                    {Math.floor(nextRefreshIn / 60)}:{String(nextRefreshIn % 60).padStart(2, "0")}
                  </span>
                )}
              </button>
            )}
            {isRunning && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <Loader2 className="w-3 h-3 animate-spin" />
                Processing...
              </Badge>
            )}
            <Button
              size="sm"
              onClick={runIngestion}
              disabled={isRunning}
              className="gap-1.5 h-8"
            >
              {isRunning ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              {isRunning ? "Running..." : "Fetch News"}
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <Progress value={progressPercent} className="h-2" />
          <div className="flex items-center justify-between mt-1 text-[10px] text-muted-foreground">
            <span>{completedSteps} of {steps.length} steps</span>
            {stats.totalDuration > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {(stats.totalDuration / 1000).toFixed(1)}s
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Pipeline visualization - horizontal scrollable */}
        <div className="overflow-x-auto pb-2 -mx-4 px-4">
          <div className="flex items-center gap-0 min-w-max py-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                {/* Step box */}
                <motion.div
                  initial={{ scale: 0.9, opacity: 0.5 }}
                  animate={{
                    scale: step.status === "running" ? 1.05 : 1,
                    opacity: step.status === "pending" ? 0.6 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "flex flex-col items-center justify-center",
                    "w-16 sm:w-20 h-16 sm:h-20 rounded-xl border-2 transition-all duration-300",
                    "shadow-sm hover:shadow-md cursor-default",
                    getStepColor(step.status)
                  )}
                >
                  <div className="mb-1">
                    {step.status === "running" ? (
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    ) : step.status === "error" ? (
                      <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-medium text-center leading-tight px-1">
                    {step.name}
                  </span>
                  {step.count !== undefined && step.count > 0 && (
                    <span className="text-[8px] opacity-75">({step.count})</span>
                  )}
                </motion.div>

                {/* Connector arrow */}
                {index < steps.length - 1 && (
                  <div className="flex items-center mx-0.5 sm:mx-1">
                    <div
                      className={cn(
                        "w-4 sm:w-6 h-0.5 transition-colors duration-300",
                        getConnectorColor(step.status)
                      )}
                    />
                    <div
                      className={cn(
                        "w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] transition-colors duration-300",
                        step.status === "completed"
                          ? "border-l-emerald-500"
                          : step.status === "running"
                          ? "border-l-blue-500"
                          : step.status === "error"
                          ? "border-l-red-500"
                          : "border-l-border"
                      )}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <AnimatePresence>
          {(stats.feedsProcessed > 0 || stats.storiesCreated > 0 || stats.storiesMerged > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-border/50"
            >
              <Badge variant="outline" className="gap-1.5 text-xs bg-blue-500/10 text-blue-600 border-blue-500/20">
                <Rss className="w-3 h-3" />
                {stats.feedsProcessed} feeds
              </Badge>
              <Badge variant="outline" className="gap-1.5 text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                <FileText className="w-3 h-3" />
                +{stats.storiesCreated} new
              </Badge>
              {stats.storiesMerged > 0 && (
                <Badge variant="outline" className="gap-1.5 text-xs bg-purple-500/10 text-purple-600 border-purple-500/20">
                  <GitMerge className="w-3 h-3" />
                  {stats.storiesMerged} merged
                </Badge>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
