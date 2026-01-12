import { useState, useEffect, useCallback, useMemo } from "react";
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
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { audioFeedback } from "@/lib/audio-feedback";

type RunTrigger = "manual" | "auto";

type FetchedStory = {
  id: string;
  headline: string;
  first_published_at: string;
  created_at: string;
};

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
  const [lastTrigger, setLastTrigger] = useState<RunTrigger>("manual");
  const [lastRunNote, setLastRunNote] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<FetchedStory[]>([]);
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

  const eligibleFeedsPreflight = useCallback(async () => {
    // Client-side preflight: avoid calling the backend function if nothing is eligible.
    const { data: feeds, error } = await supabase
      .from("rss_feeds")
      .select("id,last_fetched_at,fetch_interval_minutes")
      .eq("is_active", true);

    if (error) throw error;

    const now = Date.now();
    const eligible = (feeds || []).filter((f) => {
      const intervalMin = f.fetch_interval_minutes ?? 15;
      if (!f.last_fetched_at) return true;
      const last = new Date(f.last_fetched_at).getTime();
      return now - last >= intervalMin * 60 * 1000;
    });

    return {
      eligibleCount: eligible.length,
      totalCount: (feeds || []).length,
    };
  }, []);

  const fetchNewStoriesSince = useCallback(async (sinceIso: string) => {
    const { data, error } = await supabase
      .from("stories")
      .select("id,headline,first_published_at,created_at")
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) throw error;
    setLastFetched((data || []) as FetchedStory[]);
  }, []);

  // Run the ingestion with visual pipeline
  const runIngestion = useCallback(
    async (trigger: RunTrigger = "manual") => {
      if (isRunning) return;

      setLastTrigger(trigger);
      setLastRunNote(null);
      setLastFetched([]);

      // Check rate limiting
      const { blocked, remainingMs, reason } = checkRateLimit();
      if (blocked) {
        const waitTime = Math.ceil(remainingMs / 60000);
        toast.error(`Please wait ${waitTime} minute${waitTime > 1 ? "s" : ""} before trying again`, {
          description:
            reason === "success"
              ? "Pipeline completed successfully. Rate limit applies to prevent overload."
              : "Pipeline failed recently. Please wait before retrying.",
        });
        return;
      }

      setIsRunning(true);
      setIsExpanded(true); // Auto-expand when running
      resetPipeline();
      const startTime = Date.now();
      const startedAtIso = new Date().toISOString();

      toast.loading("Starting ingestion pipeline...", { id: "ingestion-pipeline" });

      try {
        // Preflight: if no feeds are eligible, skip the backend call entirely.
        const preflight = await eligibleFeedsPreflight();
        if (preflight.totalCount > 0 && preflight.eligibleCount === 0) {
          const { count: existingCount } = await supabase
            .from("stories")
            .select("id", { count: "exact", head: true })
            .gte("first_published_at", new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString());

          const note = existingCount && existingCount > 0
            ? "All RSS feeds are up to date."
            : "No news available right now.";

          setLastStatus("success");
          setLastRunNote(note);
          localStorage.setItem(RATE_LIMIT_KEY, Date.now().toString());

          toast.success(note, {
            id: "ingestion-pipeline",
            description: "Will auto-check again in ~15 minutes.",
          });

          audioFeedback.playSuccess();
          onIngestionComplete?.();
          return;
        }

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
        setSteps((prev) => prev.map((s) => (s.id === "classify" ? { ...s, status: "running" as const } : s)));
        updateProgress(5.5);

        // Now actually call the backend function
        const { data, error } = await supabase.functions.invoke("ingest-rss", {
          body: { trigger },
        });

        if (error) {
          console.error("Ingestion API error:", error);
          setSteps((prev) => prev.map((s) => (s.id === "classify" ? { ...s, status: "error" as const } : s)));
          throw new Error(error.message || "Ingestion failed");
        }

        // Continue with remaining steps based on response
        // Step 6: Classify - complete
        setSteps((prev) =>
          prev.map((s) => (s.id === "classify" ? { ...s, status: "completed" as const, duration: 600 } : s))
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
        const storiesMerged = data?.stats?.storiesMerged || data?.storiesMerged || 0;

        // Fetch the actual stories that were inserted/updated during this run (best-effort)
        await fetchNewStoriesSince(startedAtIso);

        const noNewNews = feedsProcessed > 0 && storiesCreated === 0 && storiesMerged === 0;
        const note = noNewNews ? "No new news right now." : null;
        setLastRunNote(note);

        toast.success(noNewNews ? "No new news right now" : "Ingestion complete!", {
          id: "ingestion-pipeline",
          description: noNewNews
            ? "Will auto-check again in ~15 minutes."
            : `${feedsProcessed} feeds → ${storiesCreated} new stories`,
        });

        audioFeedback.playSuccess();

        // Save success timestamp for rate limiting
        localStorage.setItem(RATE_LIMIT_KEY, Date.now().toString());
        setLastStatus("success");

        onIngestionComplete?.();
      } catch (err) {
        console.error("Ingestion error:", err);

        setSteps((prev) => prev.map((s) => (s.status === "running" ? { ...s, status: "error" as const } : s)));

        audioFeedback.playError();

        localStorage.setItem(RATE_LIMIT_FAILURE_KEY, Date.now().toString());
        setLastStatus("error");

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
    },
    [
      isRunning,
      checkRateLimit,
      resetPipeline,
      simulateStepProgress,
      updateProgress,
      onIngestionComplete,
      eligibleFeedsPreflight,
      fetchNewStoriesSince,
    ]
  );

  // Auto-refresh polling with countdown
  useEffect(() => {
    if (!autoRefreshEnabled || autoRefreshInterval <= 0) return;

    setNextRefreshIn(autoRefreshInterval / 1000);

    const countdownInterval = setInterval(() => {
      setNextRefreshIn((prev) => {
        if (prev <= 1) {
          if (!isRunning && cooldownRemaining === 0) {
            runIngestion("auto");
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
                onClick={() => runIngestion("manual")}
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
                {isRunning
                  ? `${progressPercent}%`
                  : cooldownRemaining > 0
                    ? formatCooldown(cooldownRemaining)
                    : "Fetch News"}
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
            <TooltipProvider>
              {/* Pipeline visualization - horizontal scrollable */}
              <div className="overflow-x-auto pb-2 -mx-4 px-4">
                <div className="flex items-center gap-0 min-w-max py-4">
                  {steps.map((step, index) => {
                    const tooltipTitle = `${step.name}`;
                    const tooltipStatus = step.status.charAt(0).toUpperCase() + step.status.slice(1);
                    const tooltipDuration = step.duration ? `${(step.duration / 1000).toFixed(1)}s` : null;
                    const tooltipCount = step.count ? `${step.count}` : null;

                    return (
                      <div key={step.id} className="flex items-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
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
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[260px]">
                            <div className="space-y-1">
                              <p className="text-xs font-medium">{tooltipTitle}</p>
                              <p className="text-[11px] text-muted-foreground">Status: {tooltipStatus}</p>
                              {tooltipDuration && (
                                <p className="text-[11px] text-muted-foreground">Duration: {tooltipDuration}</p>
                              )}
                              {tooltipCount && (
                                <p className="text-[11px] text-muted-foreground">Count: {tooltipCount}</p>
                              )}
                              {step.id === "fetch" && lastRunNote && (
                                <p className="text-[11px] text-muted-foreground">{lastRunNote}</p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>

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
                    );
                  })}
                </div>
              </div>

              {/* Run note (covers "no new news" / "up to date") */}
              <AnimatePresence>
                {lastRunNote && lastStatus === "success" && !isRunning && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-2 p-3 rounded-lg border border-border/50 bg-muted/30"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px]">
                            {lastTrigger === "manual" ? "Manual" : "Auto"}
                          </Badge>
                          <p className="text-xs font-medium">{lastRunNote}</p>
                        </div>
                        <p className="text-[11px] text-muted-foreground">Next check in ~15 minutes.</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Stats row */}
              <AnimatePresence>
                {(stats.feedsProcessed > 0 || stats.storiesCreated > 0 || stats.storiesMerged > 0) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-border/50"
                  >
                    <Badge variant="outline" className="gap-1.5 text-xs">
                      <Rss className="w-3 h-3" />
                      {stats.feedsProcessed} feeds
                    </Badge>
                    <Badge variant="outline" className="gap-1.5 text-xs">
                      <FileText className="w-3 h-3" />
                      +{stats.storiesCreated} new
                    </Badge>
                    {stats.storiesMerged > 0 && (
                      <Badge variant="outline" className="gap-1.5 text-xs">
                        <GitMerge className="w-3 h-3" />
                        {stats.storiesMerged} merged
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-[10px]">
                      {lastTrigger === "manual" ? "Manual" : "Auto"}
                    </Badge>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Newly fetched stories list */}
              <AnimatePresence>
                {lastFetched.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium">Just fetched</p>
                      <Badge variant="outline" className="text-[10px]">
                        {lastTrigger === "manual" ? "Manual" : "Auto"}
                      </Badge>
                    </div>
                    <div className="mt-2 space-y-2">
                      {lastFetched.map((s) => {
                        const published = new Date(s.first_published_at);
                        return (
                          <div
                            key={s.id}
                            className="rounded-lg border border-border/50 bg-background/40 px-3 py-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-medium leading-snug">{s.headline}</p>
                              <Badge variant="secondary" className="text-[10px]">
                                {lastTrigger === "manual" ? "Manual" : "Auto"}
                              </Badge>
                            </div>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              Published: {published.toLocaleString()}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </TooltipProvider>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
