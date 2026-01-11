import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Plus, Edit2, Trash2, RefreshCw, Search, Filter,
  CheckCircle2, XCircle, Globe, Rss, Shield, Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNewsroomRole } from "@/hooks/use-newsroom-role";

interface RSSFeed {
  id: string;
  name: string;
  url: string;
  category: string | null;
  country_code: string | null;
  language: string | null;
  source_type: string | null;
  reliability_tier: string | null;
  fetch_interval_minutes: number | null;
  priority: number | null;
  is_active: boolean;
  last_fetched_at: string | null;
  created_at: string;
}

const CATEGORIES = [
  "AI", "Business", "Finance", "Politics", "Startups", "Technology",
  "Climate", "Health", "Sports", "Entertainment", "Science", "World", "India", "Local"
];

const RELIABILITY_TIERS = [
  { value: "tier_1", label: "Tier 1 (Primary)", description: "Original reporting sources" },
  { value: "tier_2", label: "Tier 2 (Secondary)", description: "Wire services, reputable outlets" },
  { value: "tier_3", label: "Tier 3 (Tertiary)", description: "Aggregators, blogs" },
];

const SOURCE_TYPES = [
  { value: "primary", label: "Primary" },
  { value: "secondary", label: "Secondary" },
  { value: "aggregator", label: "Aggregator" },
  { value: "opinion", label: "Opinion" },
];

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "IN", name: "India" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "JP", name: "Japan" },
  { code: "CN", name: "China" },
  { code: "BR", name: "Brazil" },
];

const emptyFeed: Partial<RSSFeed> = {
  name: "",
  url: "",
  category: "World",
  country_code: "US",
  language: "en",
  source_type: "secondary",
  reliability_tier: "tier_2",
  fetch_interval_minutes: 30,
  priority: 50,
  is_active: true,
};

export default function NewsroomFeeds() {
  const { isOwnerOrSuperadmin, loading: roleLoading } = useNewsroomRole();
  const [feeds, setFeeds] = useState<RSSFeed[]>([]);
  const [filteredFeeds, setFilteredFeeds] = useState<RSSFeed[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTier, setFilterTier] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFeed, setEditingFeed] = useState<Partial<RSSFeed>>(emptyFeed);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [feedToDelete, setFeedToDelete] = useState<RSSFeed | null>(null);

  // Fetch feeds
  const fetchFeeds = async () => {
    try {
      const { data, error } = await supabase
        .from("rss_feeds")
        .select("*")
        .order("reliability_tier", { ascending: true })
        .order("priority", { ascending: false });

      if (error) throw error;
      setFeeds(data || []);
    } catch (err) {
      console.error("Failed to fetch feeds:", err);
      toast.error("Failed to load RSS feeds");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeds();
  }, []);

  // Filter feeds
  useEffect(() => {
    let result = feeds;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        f => f.name.toLowerCase().includes(query) || 
             f.url.toLowerCase().includes(query)
      );
    }

    if (filterTier !== "all") {
      result = result.filter(f => f.reliability_tier === filterTier);
    }

    if (filterCategory !== "all") {
      result = result.filter(f => f.category === filterCategory);
    }

    setFilteredFeeds(result);
  }, [feeds, searchQuery, filterTier, filterCategory]);

  // Open add dialog
  const handleAdd = () => {
    setEditingFeed(emptyFeed);
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  // Open edit dialog
  const handleEdit = (feed: RSSFeed) => {
    setEditingFeed(feed);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  // Save feed
  const handleSave = async () => {
    if (!editingFeed.name || !editingFeed.url) {
      toast.error("Name and URL are required");
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing && editingFeed.id) {
        const { error } = await supabase
          .from("rss_feeds")
          .update({
            name: editingFeed.name,
            url: editingFeed.url,
            category: editingFeed.category,
            country_code: editingFeed.country_code,
            language: editingFeed.language,
            source_type: editingFeed.source_type,
            reliability_tier: editingFeed.reliability_tier,
            fetch_interval_minutes: editingFeed.fetch_interval_minutes,
            priority: editingFeed.priority,
            is_active: editingFeed.is_active,
          })
          .eq("id", editingFeed.id);

        if (error) throw error;
        toast.success("Feed updated successfully");
      } else {
        const { error } = await supabase
          .from("rss_feeds")
          .insert({
            name: editingFeed.name,
            url: editingFeed.url,
            category: editingFeed.category,
            country_code: editingFeed.country_code,
            language: editingFeed.language,
            source_type: editingFeed.source_type,
            reliability_tier: editingFeed.reliability_tier,
            fetch_interval_minutes: editingFeed.fetch_interval_minutes,
            priority: editingFeed.priority,
            is_active: editingFeed.is_active ?? true,
          });

        if (error) throw error;
        toast.success("Feed created successfully");
      }

      setIsDialogOpen(false);
      fetchFeeds();
    } catch (err) {
      console.error("Failed to save feed:", err);
      toast.error("Failed to save feed");
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle feed active status
  const handleToggleActive = async (feed: RSSFeed) => {
    try {
      const { error } = await supabase
        .from("rss_feeds")
        .update({ is_active: !feed.is_active })
        .eq("id", feed.id);

      if (error) throw error;
      
      setFeeds(feeds.map(f => 
        f.id === feed.id ? { ...f, is_active: !f.is_active } : f
      ));
      
      toast.success(`Feed ${!feed.is_active ? "activated" : "deactivated"}`);
    } catch (err) {
      console.error("Failed to toggle feed:", err);
      toast.error("Failed to update feed status");
    }
  };

  // Delete feed
  const handleDelete = async () => {
    if (!feedToDelete) return;

    try {
      const { error } = await supabase
        .from("rss_feeds")
        .delete()
        .eq("id", feedToDelete.id);

      if (error) throw error;
      
      setFeeds(feeds.filter(f => f.id !== feedToDelete.id));
      toast.success("Feed deleted successfully");
    } catch (err) {
      console.error("Failed to delete feed:", err);
      toast.error("Failed to delete feed");
    } finally {
      setDeleteDialogOpen(false);
      setFeedToDelete(null);
    }
  };

  // Access check
  if (roleLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Checking access...</div>
      </div>
    );
  }

  if (!isOwnerOrSuperadmin) {
    return (
      <div className="p-8">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-destructive" />
              <div>
                <h3 className="font-semibold">Access Denied</h3>
                <p className="text-sm text-muted-foreground">
                  Only Owner and Superadmin can manage RSS feeds.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getTierBadge = (tier: string | null) => {
    switch (tier) {
      case "tier_1":
        return <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">T1</Badge>;
      case "tier_2":
        return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">T2</Badge>;
      case "tier_3":
        return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">T3</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold mb-2">RSS Feed Management</h1>
          <p className="text-muted-foreground">
            Add, edit, and manage RSS sources with reliability tiers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchFeeds} disabled={isLoading}>
            <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Add Feed
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{feeds.length}</p>
            <p className="text-xs text-muted-foreground">Total Feeds</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-emerald-500">
              {feeds.filter(f => f.is_active).length}
            </p>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-blue-500">
              {feeds.filter(f => f.reliability_tier === "tier_1").length}
            </p>
            <p className="text-xs text-muted-foreground">Tier 1 Sources</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-amber-500">
              {feeds.filter(f => f.reliability_tier === "tier_3").length}
            </p>
            <p className="text-xs text-muted-foreground">Tier 3 Sources</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search feeds..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={filterTier} onValueChange={setFilterTier}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            <SelectItem value="tier_1">Tier 1</SelectItem>
            <SelectItem value="tier_2">Tier 2</SelectItem>
            <SelectItem value="tier_3">Tier 3</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Feeds List */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : filteredFeeds.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Rss className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No RSS feeds found</p>
              <Button variant="outline" className="mt-4" onClick={handleAdd}>
                Add your first feed
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFeeds.map((feed, idx) => (
                <motion.div
                  key={feed.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border transition-colors",
                    feed.is_active ? "bg-card" : "bg-muted/30 opacity-60"
                  )}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {feed.is_active ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-muted-foreground" />
                      )}
                      {getTierBadge(feed.reliability_tier)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{feed.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{feed.url}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline">{feed.category || "General"}</Badge>
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {feed.country_code || "US"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {feed.fetch_interval_minutes || 30}m
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={feed.is_active}
                        onCheckedChange={() => handleToggleActive(feed)}
                      />
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(feed)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          setFeedToDelete(feed);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Feed" : "Add New Feed"}</DialogTitle>
            <DialogDescription>
              Configure the RSS feed source with reliability tier and fetch settings.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Feed Name *</Label>
                <Input
                  id="name"
                  value={editingFeed.name || ""}
                  onChange={(e) => setEditingFeed({ ...editingFeed, name: e.target.value })}
                  placeholder="e.g., Reuters Technology"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="url">RSS URL *</Label>
                <Input
                  id="url"
                  value={editingFeed.url || ""}
                  onChange={(e) => setEditingFeed({ ...editingFeed, url: e.target.value })}
                  placeholder="https://example.com/rss/feed.xml"
                />
              </div>

              <div>
                <Label htmlFor="tier">Reliability Tier</Label>
                <Select
                  value={editingFeed.reliability_tier || "tier_2"}
                  onValueChange={(v) => setEditingFeed({ ...editingFeed, reliability_tier: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RELIABILITY_TIERS.map(tier => (
                      <SelectItem key={tier.value} value={tier.value}>
                        {tier.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="source_type">Source Type</Label>
                <Select
                  value={editingFeed.source_type || "secondary"}
                  onValueChange={(v) => setEditingFeed({ ...editingFeed, source_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCE_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={editingFeed.category || "World"}
                  onValueChange={(v) => setEditingFeed({ ...editingFeed, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="country">Country</Label>
                <Select
                  value={editingFeed.country_code || "US"}
                  onValueChange={(v) => setEditingFeed({ ...editingFeed, country_code: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map(country => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="interval">Fetch Interval (minutes)</Label>
                <Input
                  id="interval"
                  type="number"
                  min={5}
                  max={1440}
                  value={editingFeed.fetch_interval_minutes || 30}
                  onChange={(e) => setEditingFeed({ 
                    ...editingFeed, 
                    fetch_interval_minutes: parseInt(e.target.value) || 30 
                  })}
                />
              </div>

              <div>
                <Label htmlFor="priority">Priority (1-100)</Label>
                <Input
                  id="priority"
                  type="number"
                  min={1}
                  max={100}
                  value={editingFeed.priority || 50}
                  onChange={(e) => setEditingFeed({ 
                    ...editingFeed, 
                    priority: parseInt(e.target.value) || 50 
                  })}
                />
              </div>

              <div className="col-span-2 flex items-center gap-2">
                <Switch
                  id="active"
                  checked={editingFeed.is_active ?? true}
                  onCheckedChange={(v) => setEditingFeed({ ...editingFeed, is_active: v })}
                />
                <Label htmlFor="active">Feed is active</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : isEditing ? "Update Feed" : "Create Feed"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Feed</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{feedToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}