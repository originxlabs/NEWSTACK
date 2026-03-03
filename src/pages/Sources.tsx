import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Radio, Shield, ShieldCheck, ShieldAlert, 
  Clock, Globe, RefreshCw, AlertCircle, CheckCircle2,
  TrendingUp, Search, Plus, Edit2, Trash2, Power, PowerOff,
  ExternalLink, Save, X, Loader2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useNewsroomRole } from "@/hooks/use-newsroom-role";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface RSSFeed {
  id: string;
  name: string;
  url: string;
  publisher: string | null;
  category: string | null;
  country_code: string | null;
  reliability_tier: string | null;
  is_active: boolean;
  last_fetched_at: string | null;
  fetch_interval_minutes: number | null;
}

interface FeedWithStats extends RSSFeed {
  storyCount: number;
  recentStories: number;
  healthStatus: "healthy" | "warning" | "error";
}

interface FeedFormData {
  name: string;
  url: string;
  publisher: string;
  category: string;
  country_code: string;
  reliability_tier: string;
  is_active: boolean;
}

const tierConfig: Record<string, { label: string; color: string; icon: React.ReactNode; description: string }> = {
  tier_1: {
    label: "Tier 1",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    icon: <ShieldCheck className="h-4 w-4" />,
    description: "Primary news agencies (Reuters, AP, AFP, PTI) - highest reliability"
  },
  tier_2: {
    label: "Tier 2",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    icon: <Shield className="h-4 w-4" />,
    description: "Major broadcasters & quality newspapers - very reliable"
  },
  tier_3: {
    label: "Tier 3",
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    icon: <ShieldAlert className="h-4 w-4" />,
    description: "Regional & specialty sources - reliable for specific topics"
  },
};

const categoryColors: Record<string, string> = {
  world: "bg-purple-500/10 text-purple-600",
  politics: "bg-red-500/10 text-red-600",
  business: "bg-emerald-500/10 text-emerald-600",
  finance: "bg-blue-500/10 text-blue-600",
  tech: "bg-cyan-500/10 text-cyan-600",
  sports: "bg-orange-500/10 text-orange-600",
  entertainment: "bg-pink-500/10 text-pink-600",
  health: "bg-green-500/10 text-green-600",
  science: "bg-indigo-500/10 text-indigo-600",
};

const countryFlags: Record<string, string> = {
  US: "🇺🇸", GB: "🇬🇧", IN: "🇮🇳", AU: "🇦🇺", CA: "🇨🇦", DE: "🇩🇪", FR: "🇫🇷",
  CN: "🇨🇳", JP: "🇯🇵", SG: "🇸🇬", QA: "🇶🇦", IT: "🇮🇹", NL: "🇳🇱", KR: "🇰🇷",
};

const defaultCategories = ["world", "politics", "business", "finance", "tech", "sports", "entertainment", "health", "science"];
const defaultCountries = ["US", "GB", "IN", "AU", "CA", "DE", "FR", "CN", "JP", "SG", "QA", "IT"];

export default function Sources() {
  const queryClient = useQueryClient();
  const { isOwnerOrSuperadmin, loading: roleLoading } = useNewsroomRole();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFeed, setSelectedFeed] = useState<RSSFeed | null>(null);
  const [formData, setFormData] = useState<FeedFormData>({
    name: "",
    url: "",
    publisher: "",
    category: "world",
    country_code: "US",
    reliability_tier: "tier_2",
    is_active: true,
  });

  // Fetch RSS feeds
  const { data: feeds, isLoading: feedsLoading, refetch } = useQuery({
    queryKey: ["rss-feeds"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rss_feeds")
        .select("*")
        .order("reliability_tier", { ascending: true })
        .order("name", { ascending: true });
      
      if (error) throw error;
      return data as RSSFeed[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch story counts per source
  const { data: storyCounts } = useQuery({
    queryKey: ["source-story-counts"],
    queryFn: async () => {
      const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const cutoff7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from("story_sources")
        .select("source_name, created_at")
        .gte("created_at", cutoff7d);
      
      if (error) throw error;
      
      const counts: Record<string, { total: number; recent: number }> = {};
      for (const source of data || []) {
        const name = source.source_name.toLowerCase();
        if (!counts[name]) {
          counts[name] = { total: 0, recent: 0 };
        }
        counts[name].total++;
        if (new Date(source.created_at) >= new Date(cutoff24h)) {
          counts[name].recent++;
        }
      }
      return counts;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Mutations
  const addFeedMutation = useMutation({
    mutationFn: async (data: FeedFormData) => {
      const { error } = await supabase.from("rss_feeds").insert({
        name: data.name,
        url: data.url,
        publisher: data.publisher || null,
        category: data.category,
        country_code: data.country_code,
        reliability_tier: data.reliability_tier,
        is_active: data.is_active,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rss-feeds"] });
      setIsAddModalOpen(false);
      resetForm();
      toast.success("RSS feed added successfully");
    },
    onError: (error) => {
      toast.error(`Failed to add feed: ${error.message}`);
    },
  });

  const updateFeedMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FeedFormData> }) => {
      const { error } = await supabase.from("rss_feeds").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rss-feeds"] });
      setIsEditModalOpen(false);
      setSelectedFeed(null);
      resetForm();
      toast.success("RSS feed updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update feed: ${error.message}`);
    },
  });

  const deleteFeedMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("rss_feeds").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rss-feeds"] });
      setIsDeleteDialogOpen(false);
      setSelectedFeed(null);
      toast.success("RSS feed deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete feed: ${error.message}`);
    },
  });

  const toggleFeedMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("rss_feeds").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rss-feeds"] });
      toast.success("Feed status updated");
    },
    onError: (error) => {
      toast.error(`Failed to toggle feed: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      url: "",
      publisher: "",
      category: "world",
      country_code: "US",
      reliability_tier: "tier_2",
      is_active: true,
    });
  };

  const handleEdit = (feed: RSSFeed) => {
    setSelectedFeed(feed);
    setFormData({
      name: feed.name,
      url: feed.url,
      publisher: feed.publisher || "",
      category: feed.category || "world",
      country_code: feed.country_code || "US",
      reliability_tier: feed.reliability_tier || "tier_2",
      is_active: feed.is_active,
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (feed: RSSFeed) => {
    setSelectedFeed(feed);
    setIsDeleteDialogOpen(true);
  };

  // Enrich feeds with stats
  const enrichedFeeds = useMemo<FeedWithStats[]>(() => {
    if (!feeds) return [];
    
    return feeds.map(feed => {
      const feedName = feed.name.toLowerCase();
      const publisherName = feed.publisher?.toLowerCase() || "";
      
      let storyCount = 0;
      let recentStories = 0;
      
      if (storyCounts) {
        const variations = [feedName, publisherName, feedName.replace(/\s+/g, "")];
        for (const [sourceName, counts] of Object.entries(storyCounts)) {
          if (variations.some(v => sourceName.includes(v) || v.includes(sourceName))) {
            storyCount += counts.total;
            recentStories += counts.recent;
          }
        }
      }
      
      let healthStatus: "healthy" | "warning" | "error" = "healthy";
      if (!feed.is_active) {
        healthStatus = "error";
      } else if (!feed.last_fetched_at) {
        healthStatus = "warning";
      } else {
        const lastFetch = new Date(feed.last_fetched_at);
        const hoursSince = (Date.now() - lastFetch.getTime()) / (1000 * 60 * 60);
        if (hoursSince > 24) {
          healthStatus = "error";
        } else if (hoursSince > 6) {
          healthStatus = "warning";
        }
      }
      
      return { ...feed, storyCount, recentStories, healthStatus };
    });
  }, [feeds, storyCounts]);

  // Filter feeds
  const filteredFeeds = useMemo(() => {
    return enrichedFeeds.filter(feed => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!feed.name.toLowerCase().includes(query) && 
            !feed.publisher?.toLowerCase().includes(query) &&
            !feed.category?.toLowerCase().includes(query)) {
          return false;
        }
      }
      if (tierFilter !== "all" && feed.reliability_tier !== tierFilter) return false;
      if (categoryFilter !== "all" && feed.category !== categoryFilter) return false;
      if (statusFilter !== "all") {
        if (statusFilter === "active" && !feed.is_active) return false;
        if (statusFilter === "inactive" && feed.is_active) return false;
        if (statusFilter === "healthy" && feed.healthStatus !== "healthy") return false;
        if (statusFilter === "warning" && feed.healthStatus !== "warning") return false;
        if (statusFilter === "error" && feed.healthStatus !== "error") return false;
      }
      return true;
    });
  }, [enrichedFeeds, searchQuery, tierFilter, categoryFilter, statusFilter]);

  // Stats summary
  const stats = useMemo(() => {
    const total = enrichedFeeds.length;
    const active = enrichedFeeds.filter(f => f.is_active).length;
    const healthy = enrichedFeeds.filter(f => f.healthStatus === "healthy").length;
    const tier1 = enrichedFeeds.filter(f => f.reliability_tier === "tier_1").length;
    const tier2 = enrichedFeeds.filter(f => f.reliability_tier === "tier_2").length;
    const tier3 = enrichedFeeds.filter(f => f.reliability_tier === "tier_3").length;
    const totalStories = enrichedFeeds.reduce((acc, f) => acc + f.storyCount, 0);
    const recentStories = enrichedFeeds.reduce((acc, f) => acc + f.recentStories, 0);
    
    return { total, active, healthy, tier1, tier2, tier3, totalStories, recentStories };
  }, [enrichedFeeds]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    enrichedFeeds.forEach(f => f.category && cats.add(f.category));
    return Array.from(cats).sort();
  }, [enrichedFeeds]);

  // Form modal component
  const FeedFormModal = ({ isOpen, onClose, isEdit }: { isOpen: boolean; onClose: () => void; isEdit: boolean }) => (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit RSS Feed" : "Add New RSS Feed"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the feed configuration below." : "Add a new RSS feed source to track."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Feed Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., BBC World"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="url">RSS URL *</Label>
            <Input
              id="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://feeds.example.com/rss"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="publisher">Publisher</Label>
            <Input
              id="publisher"
              value={formData.publisher}
              onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
              placeholder="e.g., BBC"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {defaultCategories.map(cat => (
                    <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label>Country</Label>
              <Select value={formData.country_code} onValueChange={(v) => setFormData({ ...formData, country_code: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {defaultCountries.map(code => (
                    <SelectItem key={code} value={code}>
                      {countryFlags[code] || "🌍"} {code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label>Reliability Tier</Label>
            <Select value={formData.reliability_tier} onValueChange={(v) => setFormData({ ...formData, reliability_tier: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(tierConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      {config.icon}
                      {config.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Active</Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => {
              if (isEdit && selectedFeed) {
                updateFeedMutation.mutate({ id: selectedFeed.id, data: formData });
              } else {
                addFeedMutation.mutate(formData);
              }
            }}
            disabled={!formData.name || !formData.url || addFeedMutation.isPending || updateFeedMutation.isPending}
          >
            {(addFeedMutation.isPending || updateFeedMutation.isPending) && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            <Save className="h-4 w-4 mr-2" />
            {isEdit ? "Update" : "Add Feed"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 p-6 sm:p-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Radio className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Source Explorer</h1>
                <p className="text-muted-foreground text-sm">
                  {isOwnerOrSuperadmin 
                    ? "Manage RSS sources with reliability tiers and health status"
                    : "All tracked RSS sources powering our news intelligence"
                  }
                </p>
              </div>
            </div>
            
            {isOwnerOrSuperadmin && !roleLoading && (
              <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Source
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Sources</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Radio className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {stats.active} active
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Health Status</p>
                  <p className="text-2xl font-bold text-emerald-600">{stats.healthy}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-emerald-500/30" />
              </div>
              <Progress 
                value={stats.total > 0 ? (stats.healthy / stats.total) * 100 : 0} 
                className="mt-2 h-1.5" 
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Stories (7d)</p>
                  <p className="text-2xl font-bold">{stats.totalStories.toLocaleString()}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500/30" />
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {stats.recentStories} in last 24h
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">By Tier</p>
                  <div className="flex gap-2 mt-1">
                    <Badge className={tierConfig.tier_1.color}>{stats.tier1}</Badge>
                    <Badge className={tierConfig.tier_2.color}>{stats.tier2}</Badge>
                    <Badge className={tierConfig.tier_3.color}>{stats.tier3}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tier Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {Object.entries(tierConfig).map(([key, config]) => (
            <div key={key} className="flex items-start gap-2 p-3 rounded-lg border bg-card">
              <Badge className={cn("flex items-center gap-1", config.color)}>
                {config.icon}
                {config.label}
              </Badge>
              <p className="text-xs text-muted-foreground">{config.description}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="tier_1">Tier 1</SelectItem>
              <SelectItem value="tier_2">Tier 2</SelectItem>
              <SelectItem value="tier_3">Tier 3</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="healthy">Healthy</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Results count */}
        <div className="mb-4 text-sm text-muted-foreground">
          Showing {filteredFeeds.length} of {enrichedFeeds.length} sources
        </div>

        {/* Sources Grid */}
        {feedsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4 h-40" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFeeds.map((feed) => (
              <motion.div
                key={feed.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Card className={cn(
                  "h-full transition-all hover:shadow-md",
                  feed.healthStatus === "error" && "border-red-500/30",
                  feed.healthStatus === "warning" && "border-amber-500/30"
                )}>
                  <CardContent className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {feed.country_code && (
                          <span className="text-lg flex-shrink-0">
                            {countryFlags[feed.country_code] || "🌍"}
                          </span>
                        )}
                        <div className="min-w-0">
                          <h3 className="font-medium text-sm line-clamp-1">{feed.name}</h3>
                          {feed.publisher && (
                            <p className="text-xs text-muted-foreground truncate">{feed.publisher}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Owner actions */}
                        {isOwnerOrSuperadmin && !roleLoading && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => toggleFeedMutation.mutate({ id: feed.id, is_active: !feed.is_active })}
                            >
                              {feed.is_active ? (
                                <Power className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <PowerOff className="h-3.5 w-3.5 text-red-500" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleEdit(feed)}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-500 hover:text-red-600"
                              onClick={() => handleDelete(feed)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        
                        {/* Health indicator */}
                        <div className={cn(
                          "h-2.5 w-2.5 rounded-full flex-shrink-0",
                          feed.healthStatus === "healthy" && "bg-emerald-500",
                          feed.healthStatus === "warning" && "bg-amber-500",
                          feed.healthStatus === "error" && "bg-red-500"
                        )} />
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {feed.reliability_tier && tierConfig[feed.reliability_tier] && (
                        <Badge className={cn("text-[10px]", tierConfig[feed.reliability_tier].color)}>
                          {tierConfig[feed.reliability_tier].icon}
                          <span className="ml-1">{tierConfig[feed.reliability_tier].label}</span>
                        </Badge>
                      )}
                      
                      {feed.category && (
                        <Badge 
                          variant="outline" 
                          className={cn("text-[10px] capitalize", categoryColors[feed.category] || "")}
                        >
                          {feed.category}
                        </Badge>
                      )}
                      
                      {!feed.is_active && (
                        <Badge variant="outline" className="text-[10px] text-red-500 border-red-500/30">
                          Inactive
                        </Badge>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <TrendingUp className="h-3 w-3" />
                        <span>{feed.storyCount} stories (7d)</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{feed.recentStories} today</span>
                      </div>
                    </div>

                    {/* Last fetched */}
                    <div className="mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <RefreshCw className="h-3 w-3" />
                        {feed.last_fetched_at ? (
                          <span>
                            {formatDistanceToNow(new Date(feed.last_fetched_at), { addSuffix: true })}
                          </span>
                        ) : (
                          <span className="text-amber-500">Never fetched</span>
                        )}
                      </div>
                      
                      <a
                        href={feed.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {filteredFeeds.length === 0 && !feedsLoading && (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="font-medium mb-1">No sources found</h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters or search query
            </p>
          </div>
        )}
      </main>

      {/* Modals - Only rendered for owners */}
      {isOwnerOrSuperadmin && (
        <>
          <FeedFormModal 
            isOpen={isAddModalOpen} 
            onClose={() => { setIsAddModalOpen(false); resetForm(); }} 
            isEdit={false} 
          />
          
          <FeedFormModal 
            isOpen={isEditModalOpen} 
            onClose={() => { setIsEditModalOpen(false); setSelectedFeed(null); resetForm(); }} 
            isEdit={true} 
          />
          
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete RSS Feed</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{selectedFeed?.name}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => selectedFeed && deleteFeedMutation.mutate(selectedFeed.id)}
                  className="bg-red-500 hover:bg-red-600"
                >
                  {deleteFeedMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}
