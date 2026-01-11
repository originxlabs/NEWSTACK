import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Activity, CheckCircle2, AlertTriangle, XCircle, 
  RefreshCw, Clock, Database, Globe, MapPin, Newspaper,
  Zap, TrendingUp, Server
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface EndpointHealth {
  endpoint: string;
  status: "healthy" | "degraded" | "down";
  latency_ms: number;
  last_checked: string;
  error?: string;
}

interface SystemHealth {
  overall_status: "healthy" | "degraded" | "down";
  uptime_percentage: number;
  endpoints: EndpointHealth[];
  database: {
    status: "healthy" | "degraded" | "down";
    latency_ms: number;
    story_count: number;
    last_ingestion: string | null;
  };
  checked_at: string;
}

const ENDPOINT_ICONS: Record<string, typeof Activity> = {
  "/v1/news": Newspaper,
  "/v1/world": Globe,
  "/v1/places": MapPin,
  "/ingestion": Zap,
};

export default function NewsroomApiHealth() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  async function fetchHealth() {
    try {
      const { data, error } = await supabase.functions.invoke("api-health");
      
      if (error) {
        console.error("Health check error:", error);
        setHealth({
          overall_status: "down",
          uptime_percentage: 0,
          endpoints: [],
          database: {
            status: "down",
            latency_ms: 0,
            story_count: 0,
            last_ingestion: null
          },
          checked_at: new Date().toISOString()
        });
      } else {
        setHealth(data);
      }
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Failed to fetch health:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    fetchHealth();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (autoRefresh) {
        fetchHealth();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchHealth();
  };

  const getStatusColor = (status: "healthy" | "degraded" | "down") => {
    switch (status) {
      case "healthy":
        return "text-emerald-500";
      case "degraded":
        return "text-amber-500";
      case "down":
        return "text-red-500";
    }
  };

  const getStatusBg = (status: "healthy" | "degraded" | "down") => {
    switch (status) {
      case "healthy":
        return "bg-emerald-500/10 border-emerald-500/30";
      case "degraded":
        return "bg-amber-500/10 border-amber-500/30";
      case "down":
        return "bg-red-500/10 border-red-500/30";
    }
  };

  const getStatusIcon = (status: "healthy" | "degraded" | "down") => {
    switch (status) {
      case "healthy":
        return CheckCircle2;
      case "degraded":
        return AlertTriangle;
      case "down":
        return XCircle;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 sm:p-8 max-w-7xl">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const StatusIcon = health ? getStatusIcon(health.overall_status) : XCircle;

  return (
    <div className="p-6 sm:p-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold mb-2 flex items-center gap-3">
            <Server className="w-6 h-6" />
            API Health Monitor
          </h1>
          <p className="text-muted-foreground">
            Real-time status of NEWSTACK Intelligence API endpoints
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(autoRefresh && "border-emerald-500/50")}
          >
            {autoRefresh ? (
              <>
                <Activity className="w-4 h-4 mr-2 text-emerald-500" />
                Live
              </>
            ) : (
              <>
                <Activity className="w-4 h-4 mr-2" />
                Paused
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Card className={cn("border-2", health && getStatusBg(health.overall_status))}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center",
                  health?.overall_status === "healthy" && "bg-emerald-500/20",
                  health?.overall_status === "degraded" && "bg-amber-500/20",
                  health?.overall_status === "down" && "bg-red-500/20"
                )}>
                  <StatusIcon className={cn("w-8 h-8", health && getStatusColor(health.overall_status))} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold capitalize">
                    {health?.overall_status || "Unknown"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Overall System Status
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{health?.uptime_percentage || 0}%</div>
                <p className="text-sm text-muted-foreground">Uptime</p>
              </div>
            </div>
            <div className="mt-4">
              <Progress value={health?.uptime_percentage || 0} className="h-2" />
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Last checked: {formatDistanceToNow(lastRefresh, { addSuffix: true })}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Endpoints Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {health?.endpoints.map((endpoint, idx) => {
          const Icon = ENDPOINT_ICONS[endpoint.endpoint] || Activity;
          const StatusIcon = getStatusIcon(endpoint.status);
          
          return (
            <motion.div
              key={endpoint.endpoint}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className={cn("relative overflow-hidden", getStatusBg(endpoint.status))}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <Icon className="w-5 h-5 text-muted-foreground" />
                    <StatusIcon className={cn("w-5 h-5", getStatusColor(endpoint.status))} />
                  </div>
                  <h3 className="font-mono text-sm font-medium mb-1">{endpoint.endpoint}</h3>
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant="outline" 
                      className={cn("capitalize", getStatusColor(endpoint.status))}
                    >
                      {endpoint.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {endpoint.latency_ms}ms
                    </span>
                  </div>
                  {endpoint.error && (
                    <p className="text-xs text-red-500 mt-2 truncate">{endpoint.error}</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Database & System Info */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="w-5 h-5" />
              Database Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge 
                  variant="outline" 
                  className={cn("capitalize", health?.database && getStatusColor(health.database.status))}
                >
                  {health?.database.status || "unknown"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Latency</span>
                <span className="font-mono text-sm">{health?.database.latency_ms || 0}ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Stories in Database</span>
                <span className="font-medium">{health?.database.story_count?.toLocaleString() || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last Ingestion</span>
                <span className="text-sm">
                  {health?.database.last_ingestion 
                    ? formatDistanceToNow(new Date(health.database.last_ingestion), { addSuffix: true })
                    : "Never"
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              API Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Healthy Endpoints</span>
                <span className="font-medium text-emerald-500">
                  {health?.endpoints.filter(e => e.status === "healthy").length || 0} / {health?.endpoints.length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Degraded Endpoints</span>
                <span className="font-medium text-amber-500">
                  {health?.endpoints.filter(e => e.status === "degraded").length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Down Endpoints</span>
                <span className="font-medium text-red-500">
                  {health?.endpoints.filter(e => e.status === "down").length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg Response Time</span>
                <span className="font-mono text-sm">
                  {health?.endpoints.length 
                    ? Math.round(health.endpoints.reduce((sum, e) => sum + e.latency_ms, 0) / health.endpoints.length)
                    : 0
                  }ms
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Documentation Link */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium mb-1">NEWSTACK Intelligence API</h3>
              <p className="text-sm text-muted-foreground">
                View full API documentation and test endpoints
              </p>
            </div>
            <Button variant="outline" asChild>
              <a href="/api" target="_blank">
                View API Docs
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
