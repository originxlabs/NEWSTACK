import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format, subDays, parseISO, startOfDay, endOfDay } from "date-fns";
import {
  Activity, TrendingUp, AlertTriangle, Clock, BarChart3,
  Users, Globe, Zap, RefreshCw, Download, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
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
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

interface UsageLog {
  id: string;
  api_key_id: string;
  endpoint: string;
  method: string;
  status_code: number | null;
  response_time_ms: number | null;
  ip_address: string | null;
  created_at: string;
}

interface ApiKey {
  id: string;
  customer_name: string;
  customer_email: string;
  plan: string;
}

export default function NewsroomAnalytics() {
  const [timeRange, setTimeRange] = useState("7d");
  const [selectedApiKey, setSelectedApiKey] = useState<string>("all");

  // Calculate date range
  const dateRange = useMemo(() => {
    const end = new Date();
    let start: Date;
    switch (timeRange) {
      case "24h":
        start = subDays(end, 1);
        break;
      case "7d":
        start = subDays(end, 7);
        break;
      case "30d":
        start = subDays(end, 30);
        break;
      case "90d":
        start = subDays(end, 90);
        break;
      default:
        start = subDays(end, 7);
    }
    return { start, end };
  }, [timeRange]);

  // Fetch API keys
  const { data: apiKeys } = useQuery({
    queryKey: ["api-keys-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("api_keys")
        .select("id, customer_name, customer_email, plan")
        .order("customer_name");
      if (error) throw error;
      return data as ApiKey[];
    },
  });

  // Fetch usage logs
  const { data: usageLogs, isLoading, refetch } = useQuery({
    queryKey: ["api-usage-logs", timeRange, selectedApiKey],
    queryFn: async () => {
      let query = supabase
        .from("api_key_usage_logs")
        .select("*")
        .gte("created_at", dateRange.start.toISOString())
        .lte("created_at", dateRange.end.toISOString())
        .order("created_at", { ascending: true });

      if (selectedApiKey !== "all") {
        query = query.eq("api_key_id", selectedApiKey);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as UsageLog[];
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Calculate analytics from logs
  const analytics = useMemo(() => {
    if (!usageLogs || usageLogs.length === 0) {
      return {
        totalRequests: 0,
        successRate: 100,
        avgResponseTime: 0,
        errorRate: 0,
        requestsOverTime: [],
        endpointBreakdown: [],
        statusCodeBreakdown: [],
        topCustomers: [],
        hourlyDistribution: [],
      };
    }

    const totalRequests = usageLogs.length;
    const successfulRequests = usageLogs.filter(l => l.status_code && l.status_code < 400).length;
    const successRate = Math.round((successfulRequests / totalRequests) * 100);
    const errorRate = 100 - successRate;

    const responseTimes = usageLogs
      .map(l => l.response_time_ms)
      .filter((t): t is number => t !== null);
    const avgResponseTime = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;

    // Requests over time (group by day or hour based on time range)
    const timeGrouping = timeRange === "24h" ? "hour" : "day";
    const groupedByTime: Record<string, number> = {};
    
    usageLogs.forEach(log => {
      const date = parseISO(log.created_at);
      const key = timeGrouping === "hour"
        ? format(date, "HH:00")
        : format(date, "MMM dd");
      groupedByTime[key] = (groupedByTime[key] || 0) + 1;
    });

    const requestsOverTime = Object.entries(groupedByTime).map(([time, count]) => ({
      time,
      requests: count,
    }));

    // Endpoint breakdown
    const endpointCounts: Record<string, number> = {};
    usageLogs.forEach(log => {
      const endpoint = log.endpoint.split("?")[0]; // Remove query params
      endpointCounts[endpoint] = (endpointCounts[endpoint] || 0) + 1;
    });

    const endpointBreakdown = Object.entries(endpointCounts)
      .map(([endpoint, count]) => ({ endpoint, count, percentage: Math.round((count / totalRequests) * 100) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // Status code breakdown
    const statusCounts: Record<string, number> = {};
    usageLogs.forEach(log => {
      const status = log.status_code ? `${log.status_code}` : "Unknown";
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const statusCodeBreakdown = Object.entries(statusCounts)
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);

    // Top customers (by API key)
    const customerCounts: Record<string, number> = {};
    usageLogs.forEach(log => {
      customerCounts[log.api_key_id] = (customerCounts[log.api_key_id] || 0) + 1;
    });

    const topCustomers = Object.entries(customerCounts)
      .map(([apiKeyId, count]) => {
        const apiKey = apiKeys?.find(k => k.id === apiKeyId);
        return {
          apiKeyId,
          customerName: apiKey?.customer_name || "Unknown",
          plan: apiKey?.plan || "unknown",
          count,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Hourly distribution
    const hourlyCount: Record<number, number> = {};
    for (let i = 0; i < 24; i++) hourlyCount[i] = 0;
    
    usageLogs.forEach(log => {
      const hour = parseISO(log.created_at).getHours();
      hourlyCount[hour]++;
    });

    const hourlyDistribution = Object.entries(hourlyCount).map(([hour, count]) => ({
      hour: `${hour.padStart(2, "0")}:00`,
      requests: count,
    }));

    return {
      totalRequests,
      successRate,
      avgResponseTime,
      errorRate,
      requestsOverTime,
      endpointBreakdown,
      statusCodeBreakdown,
      topCustomers,
      hourlyDistribution,
    };
  }, [usageLogs, apiKeys, timeRange]);

  // Export data as CSV
  const exportCsv = () => {
    if (!usageLogs || usageLogs.length === 0) return;

    const headers = ["Timestamp", "Endpoint", "Method", "Status", "Response Time (ms)", "IP Address"];
    const rows = usageLogs.map(log => [
      log.created_at,
      log.endpoint,
      log.method,
      log.status_code?.toString() || "",
      log.response_time_ms?.toString() || "",
      log.ip_address || "",
    ]);

    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `api-usage-${timeRange}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            API Usage Analytics
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Monitor API requests, performance, and customer usage patterns
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedApiKey} onValueChange={setSelectedApiKey}>
            <SelectTrigger className="w-48">
              <Users className="w-4 h-4 mr-2" />
              <SelectValue placeholder="All customers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Customers</SelectItem>
              {apiKeys?.map(key => (
                <SelectItem key={key.id} value={key.id}>
                  {key.customer_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={exportCsv} disabled={!usageLogs?.length}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Requests</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{analytics.totalRequests.toLocaleString()}</p>
                )}
              </div>
              <div className="p-3 rounded-full bg-primary/10">
                <Activity className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-emerald-500">{analytics.successRate}%</p>
                )}
              </div>
              <div className="p-3 rounded-full bg-emerald-500/10">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{analytics.avgResponseTime}ms</p>
                )}
              </div>
              <div className="p-3 rounded-full bg-blue-500/10">
                <Clock className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Error Rate</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <p className={cn(
                    "text-2xl font-bold",
                    analytics.errorRate > 5 ? "text-red-500" : "text-muted-foreground"
                  )}>
                    {analytics.errorRate}%
                  </p>
                )}
              </div>
              <div className="p-3 rounded-full bg-red-500/10">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Requests Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Requests Over Time</CardTitle>
            <CardDescription>
              API request volume {timeRange === "24h" ? "by hour" : "by day"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : analytics.requestsOverTime.length > 0 ? (
              <ResponsiveContainer width="100%" height={256}>
                <AreaChart data={analytics.requestsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="time" className="text-xs" tick={{ fontSize: 10 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 10 }} />
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
                No data available for selected period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Endpoint Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Endpoint Breakdown</CardTitle>
            <CardDescription>Most requested API endpoints</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : analytics.endpointBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={256}>
                <BarChart data={analytics.endpointBreakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis
                    type="category"
                    dataKey="endpoint"
                    tick={{ fontSize: 10 }}
                    width={120}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Top Customers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Customers</CardTitle>
            <CardDescription>By API request volume</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : analytics.topCustomers.length > 0 ? (
              <div className="space-y-3">
                {analytics.topCustomers.map((customer, i) => (
                  <div
                    key={customer.apiKeyId}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{customer.customerName}</p>
                        <Badge variant="outline" className="text-[10px] mt-0.5">
                          {customer.plan}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-medium">{customer.count.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">requests</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                No customer data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Codes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status Codes</CardTitle>
            <CardDescription>Response status distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : analytics.statusCodeBreakdown.length > 0 ? (
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={analytics.statusCodeBreakdown}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      label={({ status, percent }) => `${status} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {analytics.statusCodeBreakdown.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hourly Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hourly Distribution</CardTitle>
            <CardDescription>Request volume by hour (UTC)</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={analytics.hourlyDistribution}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="hour"
                    tick={{ fontSize: 8 }}
                    interval={2}
                  />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="requests" fill="hsl(var(--primary) / 0.7)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
