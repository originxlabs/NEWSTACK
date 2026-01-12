import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, TrendingUp, Globe2, Newspaper, Radio, 
  Languages, Building2, ChevronRight, RefreshCw,
  Search, Filter, BarChart3, ArrowLeft, Clock,
  Users, Zap, ChevronDown, Volume2, Globe, Layers,
  CheckCircle2, AlertCircle, Loader2, ExternalLink
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { NewsCard, NewsItem } from "@/components/NewsCard";
import { IngestionPipelineViewer } from "@/components/IngestionPipelineViewer";
import { ActiveFeedsPanel } from "@/components/ActiveFeedsPanel";
import { DistrictDrilldown } from "@/components/DistrictDrilldown";
import { StateFlagBadge } from "@/components/StateFlagBadge";
import { 
  getStateConfig, 
  getLanguageConfig, 
  LANGUAGE_CONFIG,
  type StateConfig 
} from "@/lib/india-states-config";

interface Story {
  id: string;
  headline: string;
  summary: string | null;
  category: string | null;
  city: string | null;
  state: string | null;
  district: string | null;
  image_url: string | null;
  first_published_at: string;
  source_count: number | null;
  original_headline: string | null;
  original_summary: string | null;
  original_language: string | null;
  confidence_level: string | null;
}

interface Feed {
  id: string;
  name: string;
  url: string;
  language: string | null;
  category: string | null;
  publisher: string | null;
  last_fetched_at: string | null;
  reliability_tier: string | null;
}

export default function StatePage() {
  const { stateId } = useParams<{ stateId: string }>();
  const navigate = useNavigate();
  const [stories, setStories] = useState<Story[]>([]);
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Get state config from centralized config
  const stateConfig = stateId ? getStateConfig(stateId) : undefined;
  const stateName = stateConfig?.name || stateId?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "State";

  // Fetch stories for this state
  const fetchStories = useCallback(async () => {
    if (!stateId) return;
    
    setIsLoading(true);
    try {
      const cutoff = new Date();
      cutoff.setHours(cutoff.getHours() - 72); // Last 72 hours

      // Build query based on state name patterns
      const stateNameNormalized = stateName.toLowerCase();
      
      let query = supabase
        .from("stories")
        .select(`
          id,
          headline,
          summary,
          category,
          city,
          state,
          district,
          image_url,
          first_published_at,
          source_count,
          original_headline,
          original_summary,
          original_language,
          confidence_level
        `)
        .eq("country_code", "IN")
        .gte("first_published_at", cutoff.toISOString())
        .order("first_published_at", { ascending: false })
        .limit(100);

      // Filter by state name
      query = query.or(`state.ilike.%${stateNameNormalized}%,city.ilike.%${stateNameNormalized}%`);

      // Also match cities if state config exists
      if (stateConfig?.cities) {
        const cityFilters = stateConfig.cities
          .map(city => `city.ilike.%${city}%`)
          .join(",");
        query = query.or(cityFilters);
      }

      const { data, error } = await query;

      if (error) throw error;
      setStories(data || []);
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Error fetching stories:", error);
    } finally {
      setIsLoading(false);
    }
  }, [stateId, stateName, stateConfig]);

  // Fetch RSS feeds for this state
  const fetchFeeds = useCallback(async () => {
    if (!stateConfig) return;

    try {
      // Get feeds that match state languages or are India-wide
      const { data, error } = await supabase
        .from("rss_feeds")
        .select("*")
        .eq("country_code", "IN")
        .eq("is_active", true)
        .order("reliability_tier", { ascending: true });

      if (error) throw error;

      // Filter feeds by language preference
      const filteredFeeds = (data || []).filter(feed => {
        const feedLang = feed.language?.toLowerCase() || "en";
        return stateConfig.languages.includes(feedLang) || feedLang === "en";
      });

      setFeeds(filteredFeeds);
    } catch (error) {
      console.error("Error fetching feeds:", error);
    }
  }, [stateConfig]);

  useEffect(() => {
    fetchStories();
    fetchFeeds();
  }, [fetchStories, fetchFeeds]);

  // Filter and sort stories - regional language first
  const filteredStories = useMemo(() => {
    let result = [...stories];

    // Filter by city
    if (selectedCity !== "all") {
      result = result.filter(s => 
        s.city?.toLowerCase().includes(selectedCity.toLowerCase())
      );
    }

    // Filter by district
    if (selectedDistrict !== "all") {
      result = result.filter(s => 
        s.district?.toLowerCase().includes(selectedDistrict.toLowerCase())
      );
    }

    // Filter by language
    if (selectedLanguage !== "all") {
      if (selectedLanguage === "regional") {
        // Only stories with original language content
        result = result.filter(s => s.original_language && s.original_language !== "en");
      } else {
        result = result.filter(s => 
          s.original_language === selectedLanguage || 
          (selectedLanguage === "en" && !s.original_language)
        );
      }
    }

    // Filter by category
    if (selectedCategory !== "all") {
      result = result.filter(s => 
        s.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.headline.toLowerCase().includes(query) ||
        s.summary?.toLowerCase().includes(query) ||
        s.original_headline?.toLowerCase().includes(query)
      );
    }

    // Sort: Regional language stories first, then by date
    result.sort((a, b) => {
      // Prioritize regional language content
      const aHasRegional = a.original_language && a.original_language !== "en";
      const bHasRegional = b.original_language && b.original_language !== "en";
      
      if (aHasRegional && !bHasRegional) return -1;
      if (!aHasRegional && bHasRegional) return 1;
      
      // Then sort by date
      return new Date(b.first_published_at).getTime() - new Date(a.first_published_at).getTime();
    });

    return result;
  }, [stories, selectedCity, selectedDistrict, selectedLanguage, selectedCategory, searchQuery]);

  // Get unique values for filters
  const uniqueCities = useMemo(() => {
    const cities = new Set<string>();
    stories.forEach(s => {
      if (s.city) cities.add(s.city);
    });
    return Array.from(cities).sort();
  }, [stories]);

  const uniqueDistricts = useMemo(() => {
    const districts = new Set<string>();
    stories.forEach(s => {
      if (s.district) districts.add(s.district);
    });
    return Array.from(districts).sort();
  }, [stories]);

  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>();
    stories.forEach(s => {
      if (s.category) categories.add(s.category);
    });
    return Array.from(categories).sort();
  }, [stories]);

  // Language stats
  const languageStats = useMemo(() => {
    const stats: Record<string, number> = { en: 0 };
    stories.forEach(s => {
      const lang = s.original_language || "en";
      stats[lang] = (stats[lang] || 0) + 1;
    });
    return stats;
  }, [stories]);

  // Transform story to NewsItem
  const transformStory = (story: Story): NewsItem => {
    const publishedDate = new Date(story.first_published_at);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60));
    const timestamp = diffHours < 1 ? "Just now" : diffHours < 24 ? `${diffHours}h ago` : `${Math.floor(diffHours / 24)}d ago`;

    return {
      id: story.id,
      headline: story.headline,
      summary: story.summary || "",
      topic: story.category || "Local",
      sentiment: "neutral",
      trustScore: story.confidence_level === "high" ? 95 : story.confidence_level === "medium" ? 80 : 70,
      source: "Local Sources",
      timestamp,
      publishedAt: story.first_published_at,
      imageUrl: story.image_url || undefined,
      countryCode: "IN",
      isGlobal: false,
      sourceCount: story.source_count || 1,
      locationRelevance: "Local",
      original_headline: story.original_headline,
      original_summary: story.original_summary,
      original_language: story.original_language,
    };
  };

  // Get primary regional language
  const primaryRegionalLang = stateConfig?.languages[0] || "en";
  const langConfig = LANGUAGE_CONFIG[primaryRegionalLang];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        {/* Back navigation */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/india")}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to India
        </Button>

        {/* State Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <StateFlagBadge stateId={stateId || ""} size="xl" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{stateName} News</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {stateConfig?.capital || "Capital"} • 
                <span className="flex items-center gap-1">
                  <Languages className="w-4 h-4" />
                  {langConfig?.native || "Regional"} first
                </span>
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="text-2xl font-bold text-primary">{stories.length}</div>
              <div className="text-xs text-muted-foreground">Total Stories</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-emerald-600">
                {languageStats[primaryRegionalLang] || 0}
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <span className={cn("w-2 h-2 rounded-full", langConfig?.color || "bg-primary")} />
                {langConfig?.native || "Regional"} Stories
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-blue-600">{feeds.length}</div>
              <div className="text-xs text-muted-foreground">Active Feeds</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-amber-600">{uniqueCities.length}</div>
              <div className="text-xs text-muted-foreground">Cities Covered</div>
            </Card>
          </div>
        </div>

        {/* Ingestion Pipeline */}
        <IngestionPipelineViewer 
          onIngestionComplete={fetchStories}
          className="mb-6"
        />

        {/* Filters */}
        <Card className="mb-6 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={`Search ${stateName} news...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Languages</SelectItem>
                <SelectItem value="regional">
                  <span className="flex items-center gap-2">
                    🌐 Regional First
                  </span>
                </SelectItem>
                {stateConfig?.languages.map(lang => (
                  <SelectItem key={lang} value={lang}>
                    <span className="flex items-center gap-2">
                      <span className={cn("w-2 h-2 rounded-full", LANGUAGE_CONFIG[lang]?.color)} />
                      {LANGUAGE_CONFIG[lang]?.native || lang}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {uniqueCities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {uniqueCategories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchStories}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
              Refresh
            </Button>
          </div>

          {/* Language pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            {Object.entries(languageStats).map(([lang, count]) => {
              const config = LANGUAGE_CONFIG[lang];
              return (
                <Badge
                  key={lang}
                  variant="outline"
                  className={cn(
                    "cursor-pointer transition-colors",
                    selectedLanguage === lang 
                      ? `${config?.color} text-white border-transparent` 
                      : "hover:bg-muted"
                  )}
                  onClick={() => setSelectedLanguage(selectedLanguage === lang ? "all" : lang)}
                >
                  {config?.native || lang} ({count})
                </Badge>
              );
            })}
          </div>
        </Card>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* News Feed */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredStories.length === 0 ? (
              <Card className="p-12 text-center">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No stories found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery 
                    ? `No results for "${searchQuery}"`
                    : `No recent news from ${stateName}`}
                </p>
                <Button onClick={fetchStories}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Regional language stories section */}
                {filteredStories.some(s => s.original_language && s.original_language !== "en") && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Badge className={cn(langConfig?.color, "text-white")}>
                        {langConfig?.native} News
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Regional language stories shown first
                      </span>
                    </div>
                  </div>
                )}

                {filteredStories.map((story, index) => (
                  <NewsCard
                    key={story.id}
                    news={transformStory(story)}
                    index={index}
                    onClick={() => navigate(`/news/${story.id}`)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* District Drilldown */}
            {stateConfig?.districts && stateConfig.districts.length > 0 && (
              <DistrictDrilldown
                stateId={stateId || ""}
                stateName={stateName}
                stateCode={stateConfig.code}
                stateColor={stateConfig.color}
                districts={stateConfig.districts}
                stories={stories}
                onDistrictSelect={setSelectedDistrict}
                selectedDistrict={selectedDistrict}
              />
            )}

            {/* Active Feeds */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Radio className="w-4 h-4 text-primary" />
                  Active Sources ({feeds.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
                {feeds.slice(0, 15).map(feed => {
                  const feedLang = feed.language || "en";
                  const feedConfig = LANGUAGE_CONFIG[feedLang];
                  return (
                    <div
                      key={feed.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={cn("w-2 h-2 rounded-full flex-shrink-0", feedConfig?.color || "bg-gray-500")} />
                        <span className="text-sm truncate">{feed.name}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] flex-shrink-0">
                        {feedConfig?.native || feedLang}
                      </Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Cities */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  Cities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {uniqueCities.slice(0, 10).map(city => {
                  const count = stories.filter(s => s.city === city).length;
                  return (
                    <button
                      key={city}
                      onClick={() => setSelectedCity(selectedCity === city ? "all" : city)}
                      className={cn(
                        "w-full flex items-center justify-between p-2 rounded-lg transition-colors text-left",
                        selectedCity === city ? "bg-primary/10 text-primary" : "hover:bg-muted/50"
                      )}
                    >
                      <span className="text-sm">{city}</span>
                      <Badge variant="secondary" className="text-xs">{count}</Badge>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
