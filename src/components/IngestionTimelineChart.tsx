import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from "recharts";
import {
  Activity,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Zap,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { format, subHours, differenceInMinutes } from "date-fns";

interface IngestionRun {
  id: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  total_feeds_processed: number | null;
  total_stories_created: number | null;
  total_stories_merged: number | null;
}

interface HourlyData {
  hour: string;
  hourLabel: string;
  completed: number;
  failed: number;
  running: number;
  storiesCreated: number;
  storiesMerged: number;
  feedsProcessed: number;
  successRate: number;
}

interface IngestionTimelineChartProps {
  className?: string;
  defaultExpanded?: boolean;
}

export function IngestionTimelineChart({ 
  className,
  defaultExpanded = false,
}: IngestionTimelineChartProps) {
  const [runs, setRuns] = useState<IngestionRun[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [stats, setStats] = useState({
    totalRuns: 0,
    successRate: 0,
    avgDuration: 0,
    totalStories: 0,
  });

  const fetchRuns = useCallback(async () => {
    setIsLoading(true);
    try {
      const cutoff = subHours(new Date(), 24);

      const { data, error } = await supabase
        .from("ingestion_runs")
        .select(
          "id,started_at,completed_at,status,total_feeds_processed,total_stories_created,total_stories_merged"
        )
        .gte("started_at", cutoff.toISOString())
        .order("started_at", { ascending: true });

      if (error) throw error;
      setRuns(data || []);

      // Process into hourly buckets
      const hourlyMap: Record<string, HourlyData> = {};
      const now = new Date();

      // Initialize 24 hourly buckets
      for (let i = 23; i >= 0; i--) {
        const hourStart = subHours(now, i);
        const hourKey = format(hourStart, "yyyy-MM-dd-HH");
        const hourLabel = format(hourStart, "HH:mm");
        hourlyMap[hourKey] = {
          hour: hourKey,
          hourLabel,
          completed: 0,
          failed: 0,
          running: 0,
          storiesCreated: 0,
          storiesMerged: 0,
          feedsProcessed: 0,
          successRate: 0,
        };
      }

      // Aggregate runs into hourly buckets
      let totalDurationMs = 0;
      let completedCount = 0;

      (data || []).forEach((run) => {
        const runTime = new Date(run.started_at);
        const hourKey = format(runTime, "yyyy-MM-dd-HH");

        if (!hourlyMap[hourKey]) return;

        if (run.status === "completed") {
          hourlyMap[hourKey].completed += 1;
          completedCount += 1;

          if (run.completed_at) {
            const duration =
              new Date(run.completed_at).getTime() - runTime.getTime();
            totalDurationMs += duration;
          }
        } else if (run.status === "failed" || run.status === "error") {
          hourlyMap[hourKey].failed += 1;
        } else if (run.status === "running") {
          hourlyMap[hourKey].running += 1;
        }

        hourlyMap[hourKey].storiesCreated += run.total_stories_created || 0;
        hourlyMap[hourKey].storiesMerged += run.total_stories_merged || 0;
        hourlyMap[hourKey].feedsProcessed += run.total_feeds_processed || 0;
      });

      // Calculate success rates per hour
      Object.values(hourlyMap).forEach((h) => {
        const total = h.completed + h.failed;
        h.successRate = total > 0 ? Math.round((h.completed / total) * 100) : 0;
      });

      const sortedHourly = Object.values(hourlyMap).sort((a, b) =>
        a.hour.localeCompare(b.hour)
      );

      setHourlyData(sortedHourly);

      // Calculate overall stats
      const totalRuns = (data || []).length;
      const failedRuns = (data || []).filter(
        (r) => r.status === "failed" || r.status === "error"
      ).length;
      const successRate =
        totalRuns > 0
          ? Math.round(((totalRuns - failedRuns) / totalRuns) * 100)
          : 0;
      const avgDuration =
        completedCount > 0
          ? Math.round(totalDurationMs / completedCount / 1000)
          : 0;
      const totalStories = (data || []).reduce(
        (sum, r) => sum + (r.total_stories_created || 0),
        0
      );

      setStats({
        totalRuns,
        successRate,
        avgDuration,
        totalStories,
      });
    } catch (err) {
      console.error("Error fetching ingestion runs:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel("ingestion-timeline-chart")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ingestion_runs" },
        () => {
          fetchRuns();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRuns]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload as HourlyData;

    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <div className="font-medium mb-2">{data.hourLabel}</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>Completed: {data.completed}</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="w-3 h-3 text-red-500" />
            <span>Failed: {data.failed}</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-3 h-3 text-blue-500" />
            <span>Running: {data.running}</span>
          </div>
          <div className="border-t border-border pt-1 mt-1">
            <span className="text-emerald-600">
              +{data.storiesCreated} stories created
            </span>
          </div>
          <div>
            <span className="text-purple-600">
              {data.storiesMerged} stories merged
            </span>
          </div>
          {data.successRate > 0 && (
            <div className="text-muted-foreground">
              Success rate: {data.successRate}%
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Activity className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-medium">
                  24-Hour Ingestion Activity
                </CardTitle>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            </CollapsibleTrigger>

            <div className="flex items-center gap-2">
              {/* Stats badges - always visible */}
              <Badge variant="outline" className="text-[10px] gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                {stats.successRate}% success
              </Badge>
              <Badge variant="outline" className="text-[10px] gap-1">
                <Clock className="w-3 h-3" />
                ~{stats.avgDuration}s avg
              </Badge>
              <Badge
                variant="outline"
                className="text-[10px] gap-1 bg-emerald-500/10 text-emerald-600"
              >
                +{stats.totalStories} stories
              </Badge>

              <Button
                variant="ghost"
                size="sm"
                onClick={fetchRuns}
                disabled={isLoading}
                className="h-7 w-7 p-0"
              >
                <RefreshCw
                  className={cn("w-3.5 h-3.5", isLoading && "animate-spin")}
                />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <AnimatePresence>
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CardContent className="pt-0">
                {isLoading && runs.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : hourlyData.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No ingestion data in last 24 hours</p>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="h-[200px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={hourlyData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="hsl(var(--border))"
                        />
                        <XAxis
                          dataKey="hourLabel"
                          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                          tickLine={false}
                          axisLine={false}
                          interval={3}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                          tickLine={false}
                          axisLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                          wrapperStyle={{ fontSize: 10 }}
                          iconSize={8}
                          verticalAlign="top"
                          height={24}
                        />
                        <Bar
                          dataKey="completed"
                          name="Completed"
                          fill="hsl(var(--chart-2))"
                          radius={[2, 2, 0, 0]}
                          stackId="status"
                        />
                        <Bar
                          dataKey="failed"
                          name="Failed"
                          fill="hsl(var(--destructive))"
                          radius={[2, 2, 0, 0]}
                          stackId="status"
                        />
                        <Bar
                          dataKey="running"
                          name="Running"
                          fill="hsl(var(--chart-1))"
                          radius={[2, 2, 0, 0]}
                          stackId="status"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </motion.div>
                )}
              </CardContent>
            </motion.div>
          </AnimatePresence>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
