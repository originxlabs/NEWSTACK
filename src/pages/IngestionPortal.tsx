import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Rss, Play, RefreshCw, CheckCircle2, Clock, 
  AlertTriangle, Loader2, Shield, Radio, BarChart3,
  Activity, TrendingUp, Layers, MapPin
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IngestionRunHistory } from "@/components/IngestionRunHistory";
import { IngestionTimelineChart } from "@/components/IngestionTimelineChart";
import { IngestionAccessModal } from "@/components/IngestionAccessModal";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getStateName, getStatesForDropdown } from "@/hooks/use-feed-states";
import { useAuth } from "@/contexts/AuthContext";
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
}

export default function IngestionPortal() {
  const AUTO_INTERVAL_MINUTES = 15;
  const AUTO_INTERVAL_MS = AUTO_INTERVAL_MINUTES * 60 * 1000;
  const STATUS_POLL_INTERVAL_MS = 120000;

  const { user } = useAuth();
  const { isAdmin } = useNewsroomRole();
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [accessUserId, setAccessUserId] = useState<string | null>(null);
  const [latestRun, setLatestRun] = useState<IngestionRun | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTriggering, setIsTriggering] = useState(false);
  const [lastStatusSyncAt, setLastStatusSyncAt] = useState<Date | null>(null);
  const [selectedState, setSelectedState] = useState<string>("all");
  const [sessionTimeLeft, setSessionTimeLeft] = useState<number | null>(null);

  const stateOptions = getStatesForDropdown();
  const allowlistedAdminEmails = ((import.meta.env.VITE_INGESTION_ADMIN_EMAILS as string | undefined) || "hello@abhishekpanda.com")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  const userEmail = (user?.email || "").toLowerCase();
  const isAllowlistedAdminEmail = !!userEmail && allowlistedAdminEmails.includes(userEmail);
  const canManualIngest = !!user && isAdmin && isAllowlistedAdminEmail;
  const missingGateReason = !user
    ? "Sign in with Enterprise Sign In first."
    : !isAdmin
      ? "Your account is signed in but does not have newsroom admin privileges."
      : !isAllowlistedAdminEmail
        ? "Your signed-in account is not in the ingestion admin allowlist."
        : null;

  // Check for existing verified session
  useEffect(() => {
    const checkSession = () => {
      const storedUserId = localStorage.getItem("ingestion_access_user_id");
      const storedExpiry = localStorage.getItem("ingestion_access_expiry");
      
      if (!canManualIngest) {
        localStorage.removeItem("ingestion_access_user_id");
        localStorage.removeItem("ingestion_access_expiry");
        setAccessUserId(null);
        setSessionTimeLeft(null);
        return;
      }

      if (storedUserId && storedExpiry && canManualIngest) {
        const expiry = new Date(storedExpiry);
        const now = new Date();
        if (expiry > now) {
          setAccessUserId(storedUserId);
          // Calculate time left in seconds
          const timeLeftMs = expiry.getTime() - now.getTime();
          setSessionTimeLeft(Math.floor(timeLeftMs / 1000));
        } else {
          // Session expired - clear it
          localStorage.removeItem("ingestion_access_user_id");
          localStorage.removeItem("ingestion_access_expiry");
          setAccessUserId(null);
          setSessionTimeLeft(null);
        }
      } else {
        setAccessUserId(null);
        setSessionTimeLeft(null);
      }
    };

    // Check immediately
    checkSession();

    // Update every second to show countdown
    const interval = setInterval(checkSession, 1000);

    return () => clearInterval(interval);
  }, [canManualIngest]);

  const fetchLatestRun = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("ingestion_runs")
        .select("id,started_at,completed_at,status,total_feeds_processed,total_stories_created,total_stories_merged,error_message")
        .order("started_at", { ascending: false })
        .limit(1);

      if (error) throw error;
      setLatestRun((data?.[0] as IngestionRun) || null);
      setLastStatusSyncAt(new Date());
    } catch (err) {
      console.error("Failed to fetch latest run:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLatestRun();

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchLatestRun();
      }
    }, STATUS_POLL_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, [fetchLatestRun]);

  const latestStartedAt = latestRun?.started_at ? new Date(latestRun.started_at) : null;
  const nextAutoRefreshAt = latestStartedAt ? new Date(latestStartedAt.getTime() + AUTO_INTERVAL_MS) : null;
  const autoModeLabel = latestStartedAt
    ? `Next auto run ${formatDistanceToNow(nextAutoRefreshAt as Date, { addSuffix: true })}`
    : "Waiting for first scheduler run";

  const handleAccessSuccess = (userId: string) => {
    if (!canManualIngest) return;
    setAccessUserId(userId);
    // Store with 15-minute expiry
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 15);
    localStorage.setItem("ingestion_access_user_id", userId);
    localStorage.setItem("ingestion_access_expiry", expiry.toISOString());
  };

  const triggerIngestion = async () => {
    if (!canManualIngest) {
      toast.error("Only allowlisted newsroom admins can trigger ingestion.");
      return;
    }

    if (!accessUserId) {
      setIsAccessModalOpen(true);
      return;
    }

    setIsTriggering(true);
    try {
      // Log the user trigger
      await supabase.from("ingestion_user_logs").insert({
        access_user_id: accessUserId,
        trigger_type: "manual",
        user_agent: navigator.userAgent,
      });

      // Update total ingestions count
      await supabase
        .from("ingestion_access_users")
        .update({
          last_ingestion_at: new Date().toISOString(),
          total_ingestions: supabase.rpc ? undefined : 1, // Increment would need RPC
        })
        .eq("id", accessUserId);

      // Trigger ingestion with optional state filter
      const { data, error } = await supabase.functions.invoke("ingest-rss", {
        body: { 
          trigger: "manual", 
          accessUserId,
          stateId: selectedState === "all" ? undefined : selectedState,
        },
      });

      if (error) {
        // Check if it's an auth/session error
        const errorMessage = error.message || "";
        if (errorMessage.includes("expired") || errorMessage.includes("401") || errorMessage.includes("Session")) {
          // Clear expired session
          localStorage.removeItem("ingestion_access_user_id");
          localStorage.removeItem("ingestion_access_expiry");
          setAccessUserId(null);
          toast.error("Session expired (15 min limit). Please re-verify.", {
            description: "Your access has expired. Click 'Verify Access' to continue.",
          });
          setIsAccessModalOpen(true);
          return;
        }
        throw error;
      }

      const stateLabel = selectedState === "all" ? "All India" : getStateName(selectedState);
      toast.success(`Ingestion pipeline started for ${stateLabel}!`, {
        description: `Run ID: ${data?.runId || "unknown"}`,
      });

      await fetchLatestRun();
    } catch (err: any) {
      console.error("Failed to trigger ingestion:", err);
      // Handle session expiry from response body
      if (err?.context?.body) {
        try {
          const body = JSON.parse(err.context.body);
          if (body.error === "Session expired" || body.error === "Authentication required") {
            localStorage.removeItem("ingestion_access_user_id");
            localStorage.removeItem("ingestion_access_expiry");
            setAccessUserId(null);
            toast.error(body.message || "Session expired. Please re-verify.");
            setIsAccessModalOpen(true);
            return;
          }
        } catch {}
      }
      toast.error("Failed to trigger ingestion");
    } finally {
      setIsTriggering(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case "running":
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case "failed":
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Header />
      
      <div className="h-14" />

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Rss className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">RSS Ingestion Portal</h1>
            <Badge variant="outline" className="text-emerald-600 border-emerald-500/30">
              <Radio className="w-3 h-3 mr-1 animate-pulse" />
              Auto Mode • Every 15 min
            </Badge>
          </div>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Trigger news ingestion, monitor pipeline status, and view real-time activity.
            Manual triggers are restricted to allowlisted admin accounts.
          </p>
        </div>

        {/* Access Status */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <Shield className={cn("w-5 h-5", accessUserId ? "text-emerald-500" : "text-muted-foreground")} />
                <div>
                  <p className="font-medium">
                    {!canManualIngest
                      ? "Admin Access Required"
                      : accessUserId
                        ? "Access Verified"
                        : "Authentication Required"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {!canManualIngest
                      ? missingGateReason
                      : accessUserId 
                      ? sessionTimeLeft !== null 
                        ? `Session expires in ${Math.floor(sessionTimeLeft / 60)}:${String(sessionTimeLeft % 60).padStart(2, '0')}`
                        : "You can trigger ingestion runs"
                      : "Verify your email to run the pipeline (15 min access)"}
                  </p>
                </div>
              </div>
              {canManualIngest && !accessUserId && (
                <Button onClick={() => setIsAccessModalOpen(true)}>
                  <Shield className="w-4 h-4 mr-2" />
                  Verify Access
                </Button>
              )}
              {canManualIngest && accessUserId && sessionTimeLeft !== null && sessionTimeLeft < 300 && (
                <Button variant="outline" size="sm" onClick={() => setIsAccessModalOpen(true)}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Extend Session
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">How Admin Activation Works</CardTitle>
            <CardDescription>
              Enterprise Sign In is required, but it is not the only gate.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              1. Sign in using <span className="font-medium text-foreground">Enterprise Sign In</span>.
            </p>
            <p>
              2. Your account must have newsroom admin privileges (owner/superadmin/admin role).
            </p>
            <p>
              3. Your email must be allowlisted in <code>VITE_INGESTION_ADMIN_EMAILS</code>.
            </p>
            <p>
              4. Click <span className="font-medium text-foreground">Verify Access</span> and complete the QR/email verification.
            </p>
            <p>
              5. Verification opens a guarded session for <span className="font-medium text-foreground">15 minutes</span>, then re-verification is required.
            </p>
          </CardContent>
        </Card>

        {/* Latest Run Status */}
        {latestRun && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Latest Run
                </CardTitle>
                <Badge
                  variant={
                    latestRun.status === "completed" ? "default" :
                    latestRun.status === "running" ? "secondary" :
                    latestRun.status === "failed" ? "destructive" : "outline"
                  }
                >
                  {getStatusIcon(latestRun.status)}
                  <span className="ml-1">{latestRun.status}</span>
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-2">
                <Badge variant="outline" className="text-[10px]">
                  Auto Scheduler: Active (15 min)
                </Badge>
                <span>
                  Last refreshed {formatDistanceToNow(new Date(latestRun.started_at), { addSuffix: true })}
                </span>
                <span>•</span>
                <span>{autoModeLabel}</span>
                {lastStatusSyncAt && (
                  <>
                    <span>•</span>
                    <span>Status synced {formatDistanceToNow(lastStatusSyncAt, { addSuffix: true })}</span>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
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
                    {latestRun.started_at ? formatDistanceToNow(new Date(latestRun.started_at), { addSuffix: true }) : "-"}
                  </div>
                  <div className="text-xs text-muted-foreground">Started</div>
                </div>
              </div>

              {latestRun.error_message && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 mb-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-destructive">{latestRun.error_message}</p>
                  </div>
                </div>
              )}

              {/* State Selection */}
              <div className="mb-4">
                <label className="text-sm font-medium mb-2 block">Select State/Region</label>
                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger className="w-full">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <SelectValue placeholder="All India (National feeds)" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50 max-h-[300px]">
                    <SelectItem value="all">All India (National feeds)</SelectItem>
                    {stateOptions.slice(1).map((state) => (
                      <SelectItem key={state.id} value={state.id}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedState && selectedState !== "all" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Will ingest feeds mapped to {getStateName(selectedState)}
                  </p>
                )}
              </div>

              <Button
                onClick={triggerIngestion}
                disabled={!canManualIngest || isTriggering || latestRun.status === "running"}
                className="w-full"
              >
                {isTriggering ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                {!canManualIngest
                  ? "Admin Access Required"
                  : accessUserId 
                  ? `Trigger Ingestion${selectedState && selectedState !== "all" ? ` for ${getStateName(selectedState)}` : ''}`
                  : "Verify & Trigger Ingestion"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 24-Hour Activity Chart */}
        <IngestionTimelineChart defaultExpanded={true} />

        {/* Run History */}
        <IngestionRunHistory defaultCollapsed={false} maxRuns={10} />
      </main>

      <Footer />

      {/* Access Modal */}
      <IngestionAccessModal
        isOpen={isAccessModalOpen && canManualIngest}
        onClose={() => setIsAccessModalOpen(false)}
        onSuccess={handleAccessSuccess}
      />
    </div>
  );
}
