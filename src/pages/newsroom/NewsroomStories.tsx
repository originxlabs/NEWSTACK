import { useState, useEffect } from "react";
import { 
  Search, Filter, ChevronDown, ExternalLink, 
  AlertTriangle, CheckCircle2, RefreshCw, Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Story {
  id: string;
  headline: string;
  summary: string | null;
  category: string | null;
  source_count: number | null;
  first_published_at: string;
  last_updated_at: string;
}

function getStoryState(story: Story) {
  const sourceCount = story.source_count || 1;
  const ageMs = Date.now() - new Date(story.last_updated_at).getTime();
  const ageMinutes = ageMs / (1000 * 60);

  if (sourceCount === 1) return { label: "Single Source", color: "text-amber-600 bg-amber-500/10", icon: AlertTriangle };
  if (ageMinutes < 30) return { label: "Breaking", color: "text-red-600 bg-red-500/10", icon: RefreshCw };
  if (sourceCount >= 3) return { label: "Verified", color: "text-emerald-600 bg-emerald-500/10", icon: CheckCircle2 };
  return { label: "Developing", color: "text-blue-600 bg-blue-500/10", icon: RefreshCw };
}

export default function NewsroomStories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");

  useEffect(() => {
    async function fetchStories() {
      try {
        const { data, error } = await supabase
          .from("stories")
          .select("*")
          .order("last_updated_at", { ascending: false })
          .limit(200);

        if (error) throw error;
        setStories(data || []);
      } catch (err) {
        console.error("Failed to fetch stories:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStories();
  }, []);

  const filteredStories = stories.filter((story) => {
    const matchesSearch = story.headline.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || story.category?.toLowerCase() === categoryFilter;
    
    if (stateFilter !== "all") {
      const state = getStoryState(story);
      if (stateFilter === "single-source" && state.label !== "Single Source") return false;
      if (stateFilter === "verified" && state.label !== "Verified") return false;
      if (stateFilter === "developing" && !["Developing", "Breaking"].includes(state.label)) return false;
    }
    
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(stories.map(s => s.category).filter(Boolean))];

  return (
    <div className="p-6 sm:p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold mb-2">Story Control</h1>
        <p className="text-muted-foreground">
          Manage story timelines, confidence, and editorial status
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search stories..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat!.toLowerCase()}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={stateFilter} onValueChange={setStateFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                <SelectItem value="single-source">Single Source</SelectItem>
                <SelectItem value="developing">Developing</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stories List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">
            Stories ({filteredStories.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredStories.map((story) => {
                const state = getStoryState(story);
                const StateIcon = state.icon;
                
                return (
                  <div
                    key={story.id}
                    className="p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium line-clamp-1 mb-1">
                          {story.headline}
                        </h3>
                        {story.summary && (
                          <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                            {story.summary}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{story.source_count || 1} sources</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(story.last_updated_at), { addSuffix: true })}
                          </span>
                          {story.category && (
                            <>
                              <span>•</span>
                              <Badge variant="outline" className="text-[10px]">
                                {story.category}
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                      <Badge className={cn("gap-1.5 shrink-0", state.color)}>
                        <StateIcon className="w-3 h-3" />
                        {state.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}

              {filteredStories.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No stories match your filters</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
