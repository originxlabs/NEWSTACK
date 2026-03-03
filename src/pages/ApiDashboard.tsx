import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format, subDays, parseISO } from "date-fns";
import {
  Activity, TrendingUp, AlertTriangle, Clock, Key,
  BarChart3, RefreshCw, Calendar, Shield, Zap, ArrowLeft,
  CheckCircle, XCircle, Copy, Eye, EyeOff, ExternalLink
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface ApiKeyData {
  id: string;
  api_key: string;
  customer_name: string;
  customer_email: string;
  plan: string;
  is_active: boolean;
  is_sandbox: boolean;
  requests_limit: number;
  requests_used: number;
  rate_limit_per_second: number;
  allowed_endpoints: string[] | null;
  expires_at: string | null;
  last_used_at: string | null;
  created_at: string;
}

interface UsageLog {
  id: string;
  endpoint: string;
  method: string;
  status_code: number | null;
  response_time_ms: number | null;
  created_at: string;
}

const PLAN_LIMITS = {
  sandbox: { requests: 1000, rate: 2, label: "Sandbox", color: "text-muted-foreground" },
  starter: { requests: 100000, rate: 10, label: "Starter", color: "text-blue-500" },
  pro: { requests: 1000000, rate: 50, label: "Pro", color: "text-purple-500" },
  enterprise: { requests: Infinity, rate: 200, label: "Enterprise", color: "text-amber-500" },
};

export default function ApiDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const apiKeyParam = searchParams.get("key");
  
  const [apiKeyInput, setApiKeyInput] = useState(apiKeyParam || "");
  const [activeApiKey, setActiveApiKey] = useState<string | null>(apiKeyParam);
  const [showApiKey, setShowApiKey] = useState(false);
  const [timeRange, setTimeRange] = useState("7d");

  // Calculate date range
  const dateRange = useMemo(() => {
    const end = new Date();
    let start: Date;
    switch (timeRange) {
      case "24h": start = subDays(end, 1); break;
      case "7d": start = subDays(end, 7); break;
      case "30d": start = subDays(end, 30); break;
      default: start = subDays(end, 7);
    }
    return { start, end };
  }, [timeRange]);

  // Fetch API key details
  const { data: apiKeyData, isLoading: keyLoading, error: keyError, refetch: refetchKey } = useQuery({
    queryKey: ["customer-api-key", activeApiKey],
    queryFn: async () => {
      if (!activeApiKey) return null;
      
      const { data, error } = await supabase
        .from("api_keys")
        .select("*")
        .eq("api_key", activeApiKey)
        .single();
      
      if (error) throw error;
      return data as ApiKeyData;
    },
    enabled: !!activeApiKey,
    retry: false,
  });

  // Fetch usage logs for this API key
  const { data: usageLogs, isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ["customer-usage-logs", apiKeyData?.id, timeRange],
    queryFn: async () => {
      if (!apiKeyData?.id) return [];
      
      const { data, error } = await supabase
        .from("api_key_usage_logs")
        .select("*")
        .eq("api_key_id", apiKeyData.id)
        .gte("created_at", dateRange.start.toISOString())
        .lte("created_at", dateRange.end.toISOString())
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      return data as UsageLog[];
    },
    enabled: !!apiKeyData?.id,
    refetchInterval: 60000,
  });

  // Calculate analytics
  const analytics = useMemo(() => {
    if (!usageLogs || usageLogs.length === 0) {
      return {
        totalRequests: 0,
        successRate: 100,
        avgResponseTime: 0,
        requestsOverTime: [],
        endpointBreakdown: [],
        recentRequests: [],
      };
    }

    const totalRequests = usageLogs.length;
    const successfulRequests = usageLogs.filter(l => l.status_code && l.status_code < 400).length;
    const successRate = Math.round((successfulRequests / totalRequests) * 100);

    const responseTimes = usageLogs
      .map(l => l.response_time_ms)
      .filter((t): t is number => t !== null);
    const avgResponseTime = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;

    // Group by day
    const groupedByTime: Record<string, number> = {};
    usageLogs.forEach(log => {
      const key = format(parseISO(log.created_at), timeRange === "24h" ? "HH:00" : "MMM dd");
      groupedByTime[key] = (groupedByTime[key] || 0) + 1;
    });

    const requestsOverTime = Object.entries(groupedByTime).map(([time, count]) => ({
      time,
      requests: count,
    }));

    // Endpoint breakdown
    const endpointCounts: Record<string, { count: number; success: number }> = {};
    usageLogs.forEach(log => {
      const endpoint = log.endpoint.split("?")[0];
      if (!endpointCounts[endpoint]) {
        endpointCounts[endpoint] = { count: 0, success: 0 };
      }
      endpointCounts[endpoint].count++;
      if (log.status_code && log.status_code < 400) {
        endpointCounts[endpoint].success++;
      }
    });

    const endpointBreakdown = Object.entries(endpointCounts)
      .map(([endpoint, data]) => ({
        endpoint,
        count: data.count,
        successRate: Math.round((data.success / data.count) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    // Recent requests
    const recentRequests = [...usageLogs]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);

    return {
      totalRequests,
      successRate,
      avgResponseTime,
      requestsOverTime,
      endpointBreakdown,
      recentRequests,
    };
  }, [usageLogs, timeRange]);

  const handleLookup = () => {
    if (!apiKeyInput.trim()) {
      toast.error("Please enter an API key");
      return;
    }
    setActiveApiKey(apiKeyInput.trim());
  };

  const handleRefresh = () => {
    refetchKey();
    refetchLogs();
    toast.success("Data refreshed");
  };

  const copyApiKey = () => {
    if (apiKeyData?.api_key) {
      navigator.clipboard.writeText(apiKeyData.api_key);
      toast.success("API key copied to clipboard");
    }
  };

  const planInfo = apiKeyData ? PLAN_LIMITS[apiKeyData.plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.sandbox : null;
  const usagePercentage = apiKeyData && planInfo 
    ? Math.min(100, (apiKeyData.requests_used / planInfo.requests) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-14 pb-12">
        <div className="container mx-auto max-w-6xl px-4 py-8">
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            className="mb-6 gap-2"
            onClick={() => navigate("/api")}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to API Documentation
          </Button>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
              <Key className="w-7 h-7 text-primary" />
              API Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              View your API usage, quota, and request history
            </p>
          </div>

          {/* API Key Lookup */}
          {!apiKeyData && (
            <Card className="max-w-md mb-8">
              <CardHeader>
                <CardTitle className="text-lg">Enter Your API Key</CardTitle>
                <CardDescription>
                  Look up your API key to view usage statistics and quota
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="api-key">API Key</Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="nsk_xxxxxxxxxxxxxxxx"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                  />
                </div>
                <Button onClick={handleLookup} disabled={keyLoading} className="w-full">
                  {keyLoading ? "Looking up..." : "View Dashboard"}
                </Button>
                {keyError && (
                  <p className="text-sm text-destructive">
                    API key not found. Please check and try again.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Dashboard Content */}
          {apiKeyData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Key Info Header */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-semibold">{apiKeyData.customer_name}</h2>
                        <Badge 
                          variant={apiKeyData.is_active ? "default" : "destructive"}
                          className={cn(
                            apiKeyData.is_active && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          )}
                        >
                          {apiKeyData.is_active ? "Active" : "Inactive"}
                        </Badge>
                        {apiKeyData.is_sandbox && (
                          <Badge variant="outline">Sandbox</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{apiKeyData.customer_email}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={cn("text-sm", planInfo?.color)}>
                        {planInfo?.label || apiKeyData.plan}
                      </Badge>
                      <Button variant="outline" size="sm" onClick={handleRefresh}>
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* API Key display */}
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Key className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <code className="text-sm font-mono truncate">
                        {showApiKey ? apiKeyData.api_key : "•".repeat(32)}
                      </code>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={copyApiKey}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Usage Overview */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Quota Usage */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Quota Used</span>
                      <Zap className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-2xl font-bold">
                      {apiKeyData.requests_used.toLocaleString()}
                      <span className="text-sm font-normal text-muted-foreground">
                        {" "}/ {planInfo?.requests === Infinity ? "∞" : planInfo?.requests.toLocaleString()}
                      </span>
                    </p>
                    <Progress value={usagePercentage} className="mt-2 h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {usagePercentage.toFixed(1)}% used
                    </p>
                  </CardContent>
                </Card>

                {/* Rate Limit */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Rate Limit</span>
                      <Activity className="w-4 h-4 text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold">
                      {apiKeyData.rate_limit_per_second}
                      <span className="text-sm font-normal text-muted-foreground"> req/s</span>
                    </p>
                  </CardContent>
                </Card>

                {/* Success Rate */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Success Rate</span>
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                    </div>
                    {logsLoading ? (
                      <Skeleton className="h-8 w-20" />
                    ) : (
                      <p className="text-2xl font-bold text-emerald-500">
                        {analytics.successRate}%
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Avg Response */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Avg Response</span>
                      <Clock className="w-4 h-4 text-amber-500" />
                    </div>
                    {logsLoading ? (
                      <Skeleton className="h-8 w-20" />
                    ) : (
                      <p className="text-2xl font-bold">
                        {analytics.avgResponseTime}
                        <span className="text-sm font-normal text-muted-foreground">ms</span>
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Time Range Selector */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Usage History</h3>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-36">
                    <Calendar className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">Last 24 hours</SelectItem>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Charts */}
              <Tabs defaultValue="timeline" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
                  <TabsTrigger value="requests">Recent Requests</TabsTrigger>
                </TabsList>

                <TabsContent value="timeline">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Requests Over Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {logsLoading ? (
                        <Skeleton className="h-64 w-full" />
                      ) : analytics.requestsOverTime.length > 0 ? (
                        <ResponsiveContainer width="100%" height={256}>
                          <AreaChart data={analytics.requestsOverTime}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "hsl(var(--popover))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px",
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey="requests"
                              stroke="hsl(var(--primary))"
                              fill="hsl(var(--primary) / 0.2)"
                              strokeWidth={2}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-64 flex items-center justify-center text-muted-foreground">
                          No requests in selected period
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="endpoints">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Endpoint Usage</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {logsLoading ? (
                        <Skeleton className="h-64 w-full" />
                      ) : analytics.endpointBreakdown.length > 0 ? (
                        <div className="space-y-3">
                          {analytics.endpointBreakdown.map((ep) => (
                            <div key={ep.endpoint} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                              <div>
                                <code className="text-sm font-mono">{ep.endpoint}</code>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-[10px]">
                                    {ep.count} requests
                                  </Badge>
                                  <Badge 
                                    variant="outline" 
                                    className={cn(
                                      "text-[10px]",
                                      ep.successRate >= 95 
                                        ? "bg-emerald-500/10 text-emerald-600" 
                                        : ep.successRate >= 80
                                        ? "bg-amber-500/10 text-amber-600"
                                        : "bg-red-500/10 text-red-600"
                                    )}
                                  >
                                    {ep.successRate}% success
                                  </Badge>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-mono text-lg font-semibold">{ep.count}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="h-64 flex items-center justify-center text-muted-foreground">
                          No endpoint data available
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="requests">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Recent Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {logsLoading ? (
                        <div className="space-y-2">
                          {[1, 2, 3, 4, 5].map(i => (
                            <Skeleton key={i} className="h-12 w-full" />
                          ))}
                        </div>
                      ) : analytics.recentRequests.length > 0 ? (
                        <div className="space-y-2">
                          {analytics.recentRequests.map((req) => (
                            <div 
                              key={req.id} 
                              className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                {req.status_code && req.status_code < 400 ? (
                                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-500" />
                                )}
                                <div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-[10px] font-mono">
                                      {req.method}
                                    </Badge>
                                    <code className="text-xs font-mono truncate max-w-xs">
                                      {req.endpoint}
                                    </code>
                                  </div>
                                  <p className="text-[11px] text-muted-foreground mt-0.5">
                                    {format(parseISO(req.created_at), "MMM dd, HH:mm:ss")}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right flex items-center gap-3">
                                <Badge 
                                  variant="outline"
                                  className={cn(
                                    "font-mono",
                                    req.status_code && req.status_code < 400
                                      ? "bg-emerald-500/10 text-emerald-600"
                                      : "bg-red-500/10 text-red-600"
                                  )}
                                >
                                  {req.status_code || "---"}
                                </Badge>
                                {req.response_time_ms && (
                                  <span className="text-xs text-muted-foreground font-mono">
                                    {req.response_time_ms}ms
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-12 text-center text-muted-foreground">
                          No recent requests
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* API Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">API Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Created</span>
                      <p className="font-medium">{format(parseISO(apiKeyData.created_at), "MMM dd, yyyy")}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Last Used</span>
                      <p className="font-medium">
                        {apiKeyData.last_used_at 
                          ? format(parseISO(apiKeyData.last_used_at), "MMM dd, HH:mm")
                          : "Never"
                        }
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Expires</span>
                      <p className="font-medium">
                        {apiKeyData.expires_at 
                          ? format(parseISO(apiKeyData.expires_at), "MMM dd, yyyy")
                          : "Never"
                        }
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Allowed Endpoints</span>
                      <p className="font-medium">
                        {apiKeyData.allowed_endpoints?.length 
                          ? apiKeyData.allowed_endpoints.join(", ")
                          : "All endpoints"
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Help */}
              <div className="text-center py-6 text-sm text-muted-foreground">
                Need help? Contact{" "}
                <a href="mailto:support@newstack.live" className="text-primary hover:underline">
                  support@newstack.live
                </a>
                {" "}or view the{" "}
                <Button variant="link" className="p-0 h-auto" onClick={() => navigate("/api")}>
                  API documentation
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
