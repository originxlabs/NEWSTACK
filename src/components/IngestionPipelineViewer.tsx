import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rss,
  FileText,
  Code,
  Hash,
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
  ChevronDown,
  ChevronUp,
  Volume2,
  VolumeX,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { audioFeedback } from "@/lib/audio-feedback";

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

// Rate limiting keys
const RATE_LIMIT_KEY = "pipeline_last_success";
const RATE_LIMIT_FAILURE_KEY = "pipeline_last_failure";
const SUCCESS_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes
const FAILURE_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

interface IngestionPipelineViewerProps {
  onIngestionComplete?: () => void;
  autoRefreshInterval?: number; // in ms, 0 to disable
  showAutoRefreshControls?: boolean;
  defaultCollapsed?: boolean;
  className?: string;
}

export function IngestionPipelineViewer({
  onIngestionComplete,
  autoRefreshInterval = 15 * 60 * 1000, // Default 15 minutes
  showAutoRefreshControls = true,
  defaultCollapsed = true,
  className,
}: IngestionPipelineViewerProps) {
  const [steps, setSteps] = useState<PipelineStep[]>(
    PIPELINE_STEPS.map((s) => ({ ...s, status: "pending" as const }))
  );
  const [isRunning, setIsRunning] = useState(false);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(autoRefreshInterval > 0);
  const [nextRefreshIn, setNextRefreshIn] = useState<number>(autoRefreshInterval / 1000);
  const [isExpanded, setIsExpanded] = useState(!defaultCollapsed);
  const [isMuted, setIsMuted] = useState(audioFeedback.isMuted);
  const [progressPercent, setProgressPercent] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [lastStatus, setLastStatus] = useState<"success" | "error" | null>(null);
  const [stats, setStats] = useState({
    feedsProcessed: 0,
    storiesCreated: 0,
    storiesMerged: 0,
    totalDuration: 0,
  });

  // Check rate limiting
  const checkRateLimit = useCallback(() => {
    const lastSuccess = localStorage.getItem(RATE_LIMIT_KEY);
    const lastFailure = localStorage.getItem(RATE_LIMIT_FAILURE_KEY);
    
    if (lastSuccess) {
      const elapsed = Date.now() - parseInt(lastSuccess, 10);
      if (elapsed < SUCCESS_COOLDOWN_MS) {
        return { blocked: true, remainingMs: SUCCESS_COOLDOWN_MS - elapsed, reason: "success" };
      }
    }
    
    if (lastFailure) {
      const elapsed = Date.now() - parseInt(lastFailure, 10);
      if (elapsed < FAILURE_COOLDOWN_MS) {
        return { blocked: true, remainingMs: FAILURE_COOLDOWN_MS - elapsed, reason: "failure" };
      }
    }
    
    return { blocked: false, remainingMs: 0, reason: null };
  }, []);

  // Update cooldown timer
  useEffect(() => {
    const interval = setInterval(() => {
      const { blocked, remainingMs } = checkRateLimit();
      if (blocked) {
        setCooldownRemaining(Math.ceil(remainingMs / 1000));
      } else {
        setCooldownRemaining(0);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [checkRateLimit]);

  // Sync mute state with audioFeedback
  useEffect(() => {
    const unsubscribe = audioFeedback.subscribe(() => {
      setIsMuted(audioFeedback.isMuted);
    });
    return unsubscribe;
  }, []);

  const toggleMute = useCallback(() => {
    audioFeedback.toggleMute();
  }, []);

  // Reset pipeline to initial state
  const resetPipeline = useCallback(() => {
    setSteps(PIPELINE_STEPS.map((s) => ({ ...s, status: "pending" as const })));
    setStats({ feedsProcessed: 0, storiesCreated: 0, storiesMerged: 0, totalDuration: 0 });
    setProgressPercent(0);
    setErrorMessage(null);
    setLastStatus(null);
  }, []);

  // Update progress based on completed steps
  const updateProgress = useCallback((completedCount: number, total: number = PIPELINE_STEPS.length) => {
    const percent = Math.round((completedCount / total) * 100);
    setProgressPercent(percent);
  }, []);

  // Simulate step progression with realistic timing
  const simulateStepProgress = useCallback(async (stepId: string, duration: number, stepIndex: number) => {
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
    
    updateProgress(stepIndex + 1);
  }, [updateProgress]);

  // Format cooldown time
  const formatCooldown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Run the ingestion with visual pipeline
  const runIngestion = useCallback(async () => {
    if (isRunning) return;

    // Check rate limiting
    const { blocked, remainingMs, reason } = checkRateLimit();
    if (blocked) {
      const waitTime = Math.ceil(remainingMs / 60000);
      toast.error(`Please wait ${waitTime} minute${waitTime > 1 ? 's' : ''} before trying again`, {
        description: reason === "success" 
          ? "Pipeline completed successfully. Rate limit applies to prevent overload."
          : "Pipeline failed recently. Please wait before retrying.",
      });
      return;
    }

    setIsRunning(true);
    setIsExpanded(true); // Auto-expand when running
    resetPipeline();
    const startTime = Date.now();

    toast.loading("Starting ingestion pipeline...", { id: "ingestion-pipeline" });

    try {
      // Step 1: Fetch RSS Feeds
      await simulateStepProgress("fetch", 500, 0);

      // Step 2: Extract fields
      await simulateStepProgress("extract", 400, 1);

      // Step 3: Strip CDATA
      await simulateStepProgress("strip", 300, 2);

      // Step 4: Decode entities
      await simulateStepProgress("decode", 300, 3);

      // Step 5: Validate text
      await simulateStepProgress("validate", 400, 4);

      // Step 6: Classify - set to running before API call
      setSteps((prev) =>
        prev.map((s) => (s.id === "classify" ? { ...s, status: "running" as const } : s))
      );
      updateProgress(5.5);

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
      updateProgress(6);
      setStats((prev) => ({
        ...prev,
        feedsProcessed: data?.stats?.feedsProcessed || data?.feedsProcessed || 0,
      }));

      // Step 7: Deduplicate
      await simulateStepProgress("dedupe", 500, 6);
      setStats((prev) => ({
        ...prev,
        storiesMerged: data?.stats?.storiesMerged || data?.storiesMerged || 0,
      }));

      // Step 8: Cluster into stories
      await simulateStepProgress("cluster", 400, 7);

      // Step 9: Score confidence
      await simulateStepProgress("score", 300, 8);

      // Step 10: Persist to database
      await simulateStepProgress("persist", 500, 9);
      setStats((prev) => ({
        ...prev,
        storiesCreated: data?.stats?.storiesCreated || data?.storiesCreated || 0,
      }));

      // Step 11: Complete
      await simulateStepProgress("complete", 200, 10);

      const totalDuration = Date.now() - startTime;
      setStats((prev) => ({ ...prev, totalDuration }));
      setCurrentRunId(data?.runId || null);

      const feedsProcessed = data?.stats?.feedsProcessed || data?.feedsProcessed || 0;
      const storiesCreated = data?.stats?.storiesCreated || data?.storiesCreated || 0;

      toast.success("Ingestion complete!", {
        id: "ingestion-pipeline",
        description: `${feedsProcessed} feeds → ${storiesCreated} new stories`,
      });

      // Play success sound
      audioFeedback.playSuccess();
      
      // Save success timestamp for rate limiting
      localStorage.setItem(RATE_LIMIT_KEY, Date.now().toString());
      setLastStatus("success");

      onIngestionComplete?.();
    } catch (err) {
      console.error("Ingestion error:", err);

      // Mark current running step as error
      setSteps((prev) =>
        prev.map((s) => (s.status === "running" ? { ...s, status: "error" as const } : s))
      );

      // Play error sound
      audioFeedback.playError();
      
      // Save failure timestamp for rate limiting
      localStorage.setItem(RATE_LIMIT_FAILURE_KEY, Date.now().toString());
      setLastStatus("error");

      // Set user-friendly error message
      const errorMsg = err instanceof Error ? err.message : "Unknown error occurred";
      let friendlyMessage = "Failed to fetch news. ";
      
      if (errorMsg.includes("timeout") || errorMsg.includes("network")) {
        friendlyMessage += "Network issue detected. Check your connection and try again in 5 minutes.";
      } else if (errorMsg.includes("rate") || errorMsg.includes("limit")) {
        friendlyMessage += "Too many requests. Please wait 5 minutes before trying again.";
      } else if (errorMsg.includes("connection closed")) {
        friendlyMessage += "Connection was interrupted. The operation may have completed on the server.";
      } else {
        friendlyMessage += "An unexpected error occurred. Please try again in 5 minutes.";
      }
      
      setErrorMessage(friendlyMessage);

      toast.error("Ingestion failed", {
        id: "ingestion-pipeline",
        description: friendlyMessage,
      });
    } finally {
      setIsRunning(false);
    }
  }, [isRunning, resetPipeline, simulateStepProgress, onIngestionComplete, checkRateLimit, updateProgress]);

  // Auto-refresh polling with countdown
  useEffect(() => {
    if (!autoRefreshEnabled || autoRefreshInterval <= 0) return;

    // Reset countdown when auto-refresh starts or after an ingestion
    setNextRefreshIn(autoRefreshInterval / 1000);

    const countdownInterval = setInterval(() => {
      setNextRefreshIn((prev) => {
        if (prev <= 1) {
          if (!isRunning && cooldownRemaining === 0) {
            runIngestion();
          }
          return autoRefreshInterval / 1000;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [autoRefreshEnabled, autoRefreshInterval, isRunning, runIngestion, cooldownRemaining]);

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
  const displayPercent = isRunning ? progressPercent : (completedSteps / steps.length) * 100;

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card className={cn("border-border/50 overflow-hidden", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-2 hover:text-primary transition-colors text-left">
                <Rss className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm font-medium">RSS Processing Pipeline</span>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
                {!isExpanded && stats.totalDuration > 0 && (
                  <Badge variant="outline" className="text-[10px] ml-2">
                    Last: {stats.feedsProcessed} feeds, {stats.storiesCreated} stories
                  </Badge>
                )}
              </button>
            </CollapsibleTrigger>
            
            {/* Top-right progress indicator when running */}
            <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
              {isRunning && (
                <div className="flex items-center gap-2 bg-blue-500/10 rounded-full px-3 py-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  <span className="text-xs font-medium text-blue-600">{progressPercent}%</span>
                </div>
              )}
              
              {/* Cooldown indicator */}
              {cooldownRemaining > 0 && !isRunning && (
                <Badge variant="outline" className="gap-1 text-xs bg-amber-500/10 text-amber-600 border-amber-500/20">
                  <Timer className="w-3 h-3" />
                  Wait {formatCooldown(cooldownRemaining)}
                </Badge>
              )}
              
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
                  {autoRefreshEnabled && !isRunning && cooldownRemaining === 0 && (
                    <span className="flex items-center gap-0.5 text-[10px]">
                      <Timer className="w-3 h-3" />
                      {Math.floor(nextRefreshIn / 60)}:{String(nextRefreshIn % 60).padStart(2, "0")}
                    </span>
                  )}
                </button>
              )}
              
              {/* Sound toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={toggleMute}
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-md transition-colors",
                      isMuted
                        ? "bg-muted text-muted-foreground hover:bg-muted/80"
                        : "bg-primary/10 text-primary hover:bg-primary/20"
                    )}
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isMuted ? "Unmute sounds" : "Mute sounds"}</p>
                </TooltipContent>
              </Tooltip>
              
              <Button
                size="sm"
                onClick={runIngestion}
                disabled={isRunning || cooldownRemaining > 0}
                className="gap-1.5 h-8"
              >
                {isRunning ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : cooldownRemaining > 0 ? (
                  <Timer className="w-3.5 h-3.5" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
                {isRunning ? `${progressPercent}%` : cooldownRemaining > 0 ? formatCooldown(cooldownRemaining) : "Fetch News"}
              </Button>
            </div>
          </div>

          {/* Progress bar - always visible */}
          <div className="mt-3">
            <Progress value={displayPercent} className="h-2" />
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
          
          {/* Error message display */}
          <AnimatePresence>
            {errorMessage && lastStatus === "error" && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-red-600 font-medium">{errorMessage}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      You can try again in {formatCooldown(cooldownRemaining || 300)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setErrorMessage(null)}
                  >
                    <XCircle className="w-3 h-3" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardHeader>

        <CollapsibleContent>
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
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
