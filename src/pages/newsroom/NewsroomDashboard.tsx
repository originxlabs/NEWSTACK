import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Zap, RefreshCw, AlertTriangle, CheckCircle2, 
  Layers, Clock, TrendingUp, BarChart3
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface DashboardStats {
  totalStories: number;
  breakingCount: number;
  developingCount: number;
  singleSourceCount: number;
  verifiedCount: number;
}

interface RecentStory {
  id: string;
  headline: string;
  source_count: number | null;
  first_published_at: string;
  category: string | null;
}

export default function NewsroomDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStories: 0,
    breakingCount: 0,
    developingCount: 0,
    singleSourceCount: 0,
    verifiedCount: 0,
  });
  const [recentStories, setRecentStories] = useState<RecentStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Fetch stories
        const { data: stories, error } = await supabase
          .from("stories")
          .select("id, headline, source_count, first_published_at, category, last_updated_at")
          .order("last_updated_at", { ascending: false })
          .limit(100);

        if (error) throw error;

        const now = Date.now();
        const thirtyMinutesAgo = now - 30 * 60 * 1000;
        const sixHoursAgo = now - 6 * 60 * 60 * 1000;

        // Calculate stats
        const breaking = stories?.filter(s => 
          new Date(s.last_updated_at).getTime() > thirtyMinutesAgo
        ).length || 0;

        const developing = stories?.filter(s => {
          const publishedTime = new Date(s.last_updated_at).getTime();
          return publishedTime <= thirtyMinutesAgo && publishedTime > sixHoursAgo;
        }).length || 0;

        const singleSource = stories?.filter(s => (s.source_count || 1) === 1).length || 0;
        const verified = stories?.filter(s => (s.source_count || 1) >= 3).length || 0;

        setStats({
          totalStories: stories?.length || 0,
          breakingCount: breaking,
          developingCount: developing,
          singleSourceCount: singleSource,
          verifiedCount: verified,
        });

        setRecentStories(stories?.slice(0, 10) || []);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const statCards = [
    { 
      label: "Total Stories", 
      value: stats.totalStories, 
      icon: Layers, 
      color: "text-primary" 
    },
    { 
      label: "Breaking Now", 
      value: stats.breakingCount, 
      icon: Zap, 
      color: "text-red-500" 
    },
    { 
      label: "Developing", 
      value: stats.developingCount, 
      icon: RefreshCw, 
      color: "text-amber-500" 
    },
    { 
      label: "Single Source", 
      value: stats.singleSourceCount, 
      icon: AlertTriangle, 
      color: "text-amber-600" 
    },
    { 
      label: "Verified (3+)", 
      value: stats.verifiedCount, 
      icon: CheckCircle2, 
      color: "text-emerald-500" 
    },
  ];

  return (
    <div className="p-6 sm:p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold mb-2">Newsroom Dashboard</h1>
        <p className="text-muted-foreground">
          Real-time overview of story intelligence and editorial status
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className={cn("w-5 h-5", stat.color)} />
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Stories */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Stories</CardTitle>
            <Button variant="ghost" size="sm">View All</Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {recentStories.map((story) => (
                  <div 
                    key={story.id} 
                    className="flex items-start justify-between gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{story.headline}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{story.source_count || 1} sources</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(story.first_published_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                    {story.category && (
                      <Badge variant="outline" className="text-[10px]">
                        {story.category}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Confidence Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-sm">High Confidence</span>
                </div>
                <span className="text-sm font-medium">{stats.verifiedCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm">Medium Confidence</span>
                </div>
                <span className="text-sm font-medium">
                  {stats.totalStories - stats.verifiedCount - stats.singleSourceCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-sm">Low Confidence</span>
                </div>
                <span className="text-sm font-medium">{stats.singleSourceCount}</span>
              </div>
            </div>

            {/* Visual bar */}
            <div className="mt-6 h-4 rounded-full bg-muted overflow-hidden flex">
              <div 
                className="bg-emerald-500 h-full transition-all"
                style={{ width: `${(stats.verifiedCount / Math.max(stats.totalStories, 1)) * 100}%` }}
              />
              <div 
                className="bg-blue-500 h-full transition-all"
                style={{ width: `${((stats.totalStories - stats.verifiedCount - stats.singleSourceCount) / Math.max(stats.totalStories, 1)) * 100}%` }}
              />
              <div 
                className="bg-amber-500 h-full transition-all"
                style={{ width: `${(stats.singleSourceCount / Math.max(stats.totalStories, 1)) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Log Preview */}
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <Button variant="ghost" size="sm">View Audit Log</Button>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Audit logging enabled</p>
            <p className="text-xs">All editorial actions are tracked</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
