import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Shield, Rss, Activity, Users, CreditCard, Mail, 
  BarChart3, MousePointer2, Clock, AlertTriangle,
  Plus, Trash2, Edit, Check, X, Loader2, RefreshCw
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface RSSFeed {
  id: string;
  name: string;
  url: string;
  category: string | null;
  country_code: string | null;
  language: string | null;
  is_active: boolean | null;
  priority: number | null;
  last_fetched_at: string | null;
}

interface IngestionLog {
  id: string;
  feed_name: string | null;
  status: string;
  stories_fetched: number | null;
  stories_inserted: number | null;
  error_message: string | null;
  duration_ms: number | null;
  created_at: string;
}

interface CronJobLog {
  id: string;
  job_name: string;
  status: string;
  duration_ms: number | null;
  records_processed: number | null;
  error_message: string | null;
  created_at: string;
}

interface AnalyticsSummary {
  totalPageViews: number;
  uniqueSessions: number;
  totalClicks: number;
  newsletterSignups: number;
  totalDonations: number;
  donationAmount: number;
}

const Admin = () => {
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [rssFeeds, setRssFeeds] = useState<RSSFeed[]>([]);
  const [ingestionLogs, setIngestionLogs] = useState<IngestionLog[]>([]);
  const [cronLogs, setCronLogs] = useState<CronJobLog[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingFeed, setEditingFeed] = useState<string | null>(null);
  const [newFeed, setNewFeed] = useState({ name: "", url: "", category: "general", country_code: "IN", language: "en" });
  const [showAddFeed, setShowAddFeed] = useState(false);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      toast.error("Access denied. Admin privileges required.");
      navigate("/");
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchAllData();
    }
  }, [isAdmin]);

  const fetchAllData = async () => {
    setIsLoading(true);
    await Promise.all([
      fetchRSSFeeds(),
      fetchIngestionLogs(),
      fetchCronLogs(),
      fetchAnalytics(),
    ]);
    setIsLoading(false);
  };

  const fetchRSSFeeds = async () => {
    const { data, error } = await supabase
      .from("rss_feeds")
      .select("*")
      .order("priority", { ascending: true });
    
    if (!error && data) {
      setRssFeeds(data);
    }
  };

  const fetchIngestionLogs = async () => {
    const { data, error } = await supabase
      .from("rss_ingestion_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    
    if (!error && data) {
      setIngestionLogs(data);
    }
  };

  const fetchCronLogs = async () => {
    const { data, error } = await supabase
      .from("cron_job_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    
    if (!error && data) {
      setCronLogs(data);
    }
  };

  const fetchAnalytics = async () => {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const [pageViewsRes, clicksRes, newsletterRes, donationsRes] = await Promise.all([
      supabase.from("page_views").select("session_id", { count: "exact" }).gte("created_at", weekAgo.toISOString()),
      supabase.from("click_events").select("id", { count: "exact" }).gte("created_at", weekAgo.toISOString()),
      supabase.from("newsletter_subscribers").select("id", { count: "exact" }),
      supabase.from("donations").select("amount, status"),
    ]);

    const uniqueSessions = new Set(pageViewsRes.data?.map(p => p.session_id) || []).size;
    const completedDonations = donationsRes.data?.filter(d => d.status === "completed") || [];
    
    setAnalytics({
      totalPageViews: pageViewsRes.count || 0,
      uniqueSessions,
      totalClicks: clicksRes.count || 0,
      newsletterSignups: newsletterRes.count || 0,
      totalDonations: completedDonations.length,
      donationAmount: completedDonations.reduce((sum, d) => sum + (d.amount || 0), 0),
    });
  };

  const handleAddFeed = async () => {
    if (!newFeed.name || !newFeed.url) {
      toast.error("Name and URL are required");
      return;
    }

    const { error } = await supabase.from("rss_feeds").insert({
      name: newFeed.name,
      url: newFeed.url,
      category: newFeed.category,
      country_code: newFeed.country_code,
      language: newFeed.language,
      is_active: true,
      priority: 50,
    });

    if (error) {
      toast.error("Failed to add feed: " + error.message);
    } else {
      toast.success("Feed added successfully");
      setNewFeed({ name: "", url: "", category: "general", country_code: "IN", language: "en" });
      setShowAddFeed(false);
      fetchRSSFeeds();
    }
  };

  const handleToggleFeed = async (feedId: string, isActive: boolean) => {
    const { error } = await supabase
      .from("rss_feeds")
      .update({ is_active: isActive })
      .eq("id", feedId);

    if (error) {
      toast.error("Failed to update feed");
    } else {
      fetchRSSFeeds();
    }
  };

  const handleDeleteFeed = async (feedId: string) => {
    const { error } = await supabase.from("rss_feeds").delete().eq("id", feedId);

    if (error) {
      toast.error("Failed to delete feed");
    } else {
      toast.success("Feed deleted");
      fetchRSSFeeds();
    }
  };

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto max-w-7xl px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Shield className="h-8 w-8 text-primary" />
                <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
              </div>
              <p className="text-muted-foreground">Manage RSS feeds, monitor health, and view analytics</p>
            </div>
            <Button onClick={fetchAllData} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </motion.div>

          {/* Analytics Overview Cards */}
          {analytics && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8"
            >
              <Card className="p-4 text-center">
                <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{analytics.uniqueSessions}</p>
                <p className="text-xs text-muted-foreground">Sessions (7d)</p>
              </Card>
              <Card className="p-4 text-center">
                <BarChart3 className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold">{analytics.totalPageViews}</p>
                <p className="text-xs text-muted-foreground">Page Views</p>
              </Card>
              <Card className="p-4 text-center">
                <MousePointer2 className="h-6 w-6 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold">{analytics.totalClicks}</p>
                <p className="text-xs text-muted-foreground">Clicks</p>
              </Card>
              <Card className="p-4 text-center">
                <Mail className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                <p className="text-2xl font-bold">{analytics.newsletterSignups}</p>
                <p className="text-xs text-muted-foreground">Subscribers</p>
              </Card>
              <Card className="p-4 text-center">
                <CreditCard className="h-6 w-6 mx-auto mb-2 text-amber-500" />
                <p className="text-2xl font-bold">{analytics.totalDonations}</p>
                <p className="text-xs text-muted-foreground">Donations</p>
              </Card>
              <Card className="p-4 text-center">
                <CreditCard className="h-6 w-6 mx-auto mb-2 text-emerald-500" />
                <p className="text-2xl font-bold">₹{analytics.donationAmount}</p>
                <p className="text-xs text-muted-foreground">Total Raised</p>
              </Card>
            </motion.div>
          )}

          {/* Main Tabs */}
          <Tabs defaultValue="feeds" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
              <TabsTrigger value="feeds" className="gap-2">
                <Rss className="h-4 w-4" />
                RSS Feeds
              </TabsTrigger>
              <TabsTrigger value="health" className="gap-2">
                <Activity className="h-4 w-4" />
                Health
              </TabsTrigger>
              <TabsTrigger value="cron" className="gap-2">
                <Clock className="h-4 w-4" />
                Cron Jobs
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            {/* RSS Feeds Tab */}
            <TabsContent value="feeds" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">RSS Feed Sources ({rssFeeds.length})</h2>
                <Button onClick={() => setShowAddFeed(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Feed
                </Button>
              </div>

              {/* Add Feed Form */}
              {showAddFeed && (
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Add New RSS Feed</h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label>Feed Name</Label>
                      <Input
                        placeholder="e.g., BBC News"
                        value={newFeed.name}
                        onChange={(e) => setNewFeed({ ...newFeed, name: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>RSS URL</Label>
                      <Input
                        placeholder="https://feeds.example.com/rss"
                        value={newFeed.url}
                        onChange={(e) => setNewFeed({ ...newFeed, url: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Select value={newFeed.category} onValueChange={(v) => setNewFeed({ ...newFeed, category: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="sports">Sports</SelectItem>
                          <SelectItem value="entertainment">Entertainment</SelectItem>
                          <SelectItem value="science">Science</SelectItem>
                          <SelectItem value="health">Health</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Country</Label>
                      <Select value={newFeed.country_code} onValueChange={(v) => setNewFeed({ ...newFeed, country_code: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IN">India</SelectItem>
                          <SelectItem value="US">USA</SelectItem>
                          <SelectItem value="GB">UK</SelectItem>
                          <SelectItem value="GLOBAL">Global</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Language</Label>
                      <Select value={newFeed.language} onValueChange={(v) => setNewFeed({ ...newFeed, language: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="hi">Hindi</SelectItem>
                          <SelectItem value="ta">Tamil</SelectItem>
                          <SelectItem value="te">Telugu</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={handleAddFeed}>Save Feed</Button>
                    <Button variant="outline" onClick={() => setShowAddFeed(false)}>Cancel</Button>
                  </div>
                </Card>
              )}

              {/* Feeds List */}
              <div className="space-y-2">
                {rssFeeds.map((feed) => (
                  <Card key={feed.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{feed.name}</h3>
                          <Badge variant={feed.is_active ? "default" : "secondary"}>
                            {feed.is_active ? "Active" : "Inactive"}
                          </Badge>
                          {feed.category && (
                            <Badge variant="outline">{feed.category}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate max-w-xl mt-1">
                          {feed.url}
                        </p>
                        {feed.last_fetched_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Last fetched: {new Date(feed.last_fetched_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={feed.is_active || false}
                          onCheckedChange={(checked) => handleToggleFeed(feed.id, checked)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDeleteFeed(feed.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Health Monitoring Tab */}
            <TabsContent value="health" className="space-y-4">
              <h2 className="text-xl font-semibold">RSS Ingestion Health</h2>
              
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <Card className="p-4 text-center">
                  <p className="text-2xl font-bold text-green-500">
                    {ingestionLogs.filter(l => l.status === "success").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Successful</p>
                </Card>
                <Card className="p-4 text-center">
                  <p className="text-2xl font-bold text-amber-500">
                    {ingestionLogs.filter(l => l.status === "partial").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Partial</p>
                </Card>
                <Card className="p-4 text-center">
                  <p className="text-2xl font-bold text-red-500">
                    {ingestionLogs.filter(l => l.status === "error").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Errors</p>
                </Card>
              </div>

              {/* Ingestion Logs */}
              <div className="space-y-2">
                {ingestionLogs.map((log) => (
                  <Card key={log.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {log.status === "success" ? (
                          <Check className="h-5 w-5 text-green-500" />
                        ) : log.status === "error" ? (
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                        ) : (
                          <Activity className="h-5 w-5 text-amber-500" />
                        )}
                        <div>
                          <p className="font-medium">{log.feed_name || "Unknown Feed"}</p>
                          <p className="text-sm text-muted-foreground">
                            {log.stories_fetched} fetched, {log.stories_inserted} inserted
                            {log.duration_ms && ` • ${log.duration_ms}ms`}
                          </p>
                          {log.error_message && (
                            <p className="text-sm text-red-500 mt-1">{log.error_message}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                  </Card>
                ))}
                {ingestionLogs.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No ingestion logs yet</p>
                )}
              </div>
            </TabsContent>

            {/* Cron Jobs Tab */}
            <TabsContent value="cron" className="space-y-4">
              <h2 className="text-xl font-semibold">Cron Job Execution Logs</h2>
              
              <div className="space-y-2">
                {cronLogs.map((log) => (
                  <Card key={log.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {log.status === "success" ? (
                          <Check className="h-5 w-5 text-green-500" />
                        ) : log.status === "error" ? (
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                        ) : (
                          <Clock className="h-5 w-5 text-blue-500" />
                        )}
                        <div>
                          <p className="font-medium">{log.job_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {log.records_processed} records
                            {log.duration_ms && ` • ${log.duration_ms}ms`}
                          </p>
                          {log.error_message && (
                            <p className="text-sm text-red-500 mt-1">{log.error_message}</p>
                          )}
                        </div>
                      </div>
                      <Badge variant={
                        log.status === "success" ? "default" :
                        log.status === "error" ? "destructive" : "secondary"
                      }>
                        {log.status}
                      </Badge>
                    </div>
                  </Card>
                ))}
                {cronLogs.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No cron job logs yet</p>
                )}
              </div>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-4">
              <h2 className="text-xl font-semibold">Website Analytics</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Newsletter Popup Analytics */}
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Newsletter Popup Performance</h3>
                  <NewsletterPopupStats />
                </Card>

                {/* Top Pages */}
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Top Pages (7 days)</h3>
                  <TopPagesStats />
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

// Newsletter Popup Stats Component
function NewsletterPopupStats() {
  const [stats, setStats] = useState<{ event_type: string; count: number }[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const { data } = await supabase
        .from("newsletter_popup_events")
        .select("event_type");
      
      if (data) {
        const counts: Record<string, number> = {};
        data.forEach(row => {
          counts[row.event_type] = (counts[row.event_type] || 0) + 1;
        });
        setStats(Object.entries(counts).map(([event_type, count]) => ({ event_type, count })));
      }
    };
    fetchStats();
  }, []);

  const views = stats.find(s => s.event_type === "view")?.count || 0;
  const submits = stats.find(s => s.event_type === "submit")?.count || 0;
  const closes = stats.find(s => s.event_type === "close")?.count || 0;
  const conversionRate = views > 0 ? ((submits / views) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-3">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Views</span>
        <span className="font-medium">{views}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Closes</span>
        <span className="font-medium">{closes}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Submissions</span>
        <span className="font-medium text-green-500">{submits}</span>
      </div>
      <div className="flex justify-between border-t pt-3">
        <span className="text-muted-foreground">Conversion Rate</span>
        <span className="font-bold text-primary">{conversionRate}%</span>
      </div>
    </div>
  );
}

// Top Pages Stats Component
function TopPagesStats() {
  const [pages, setPages] = useState<{ page_path: string; count: number }[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const { data } = await supabase
        .from("page_views")
        .select("page_path")
        .gte("created_at", weekAgo.toISOString());
      
      if (data) {
        const counts: Record<string, number> = {};
        data.forEach(row => {
          counts[row.page_path] = (counts[row.page_path] || 0) + 1;
        });
        const sorted = Object.entries(counts)
          .map(([page_path, count]) => ({ page_path, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        setPages(sorted);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-2">
      {pages.map((page, i) => (
        <div key={page.page_path} className="flex justify-between items-center">
          <span className="text-sm truncate flex-1">{page.page_path}</span>
          <Badge variant="secondary">{page.count}</Badge>
        </div>
      ))}
      {pages.length === 0 && (
        <p className="text-sm text-muted-foreground">No page views tracked yet</p>
      )}
    </div>
  );
}

export default Admin;
