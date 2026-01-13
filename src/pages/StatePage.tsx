import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, TrendingUp, Globe2, Newspaper, Radio, 
  Languages, Building2, ChevronRight, RefreshCw,
  Search, Filter, BarChart3, ArrowLeft, Clock,
  Users, Zap, ChevronDown, Volume2, Globe, Layers,
  CheckCircle2, AlertCircle, Loader2, ExternalLink, Home,
  Sparkles
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
import { WeatherAQIWidget } from "@/components/weather/WeatherAQIWidget";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { NewsCard, NewsItem } from "@/components/NewsCard";
import { IngestionPipelineViewer } from "@/components/IngestionPipelineViewer";
import { ActiveFeedsPanel } from "@/components/ActiveFeedsPanel";
import { DistrictDrilldown } from "@/components/DistrictDrilldown";
import { CityDrilldown } from "@/components/CityDrilldown";
import { StateFlagBadge } from "@/components/StateFlagBadge";
import { BreadcrumbNav } from "@/components/BreadcrumbNav";
import { RealtimeNewsIndicator, RealtimeStatusDot } from "@/components/RealtimeNewsIndicator";
import { AutoRefreshTimer } from "@/components/AutoRefreshTimer";
import { 
  getStateConfig, 
  LANGUAGE_CONFIG,
} from "@/lib/india-states-config";
import { inferDistrictFromText, normalizeLanguageCode, type InferredDistrictResult } from "@/lib/story-geo";
import { IngestionRunHistory } from "@/components/IngestionRunHistory";
import { IngestionTimelineChart } from "@/components/IngestionTimelineChart";
import { usePersonalizedFeed } from "@/hooks/use-personalized-feed";

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

interface EnrichedStory extends Story {
  inferredDistrict?: InferredDistrictResult;
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
  const [feedType, setFeedType] = useState<"all" | "foryou">("all");
  
  const { trackRead, personalizeStories, topCategories, topStates } = usePersonalizedFeed();
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

      // Build proper OR filter for state matching
      // State names in DB: "Delhi", "Odisha", "Karnataka", etc.
      const stateNameNormalized = stateName.toLowerCase();
      
      // Build combined OR filter for state AND city matching
      const filters: string[] = [
        `state.ilike.%${stateNameNormalized}%`,
        `city.ilike.%${stateNameNormalized}%`
      ];
      
      // Add city-specific filters from config
      if (stateConfig?.cities) {
        stateConfig.cities.forEach(city => {
          filters.push(`city.ilike.%${city}%`);
        });
      }

      const { data, error } = await supabase
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
        .or(filters.join(","))
        .order("first_published_at", { ascending: false })
        .limit(100);

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

  // Create a derived dataset with:
  // - normalized original_language (e.g. "ta-IN" -> "ta")
  // - inferred district when DB district is missing (with confidence)
  const enrichedStories: EnrichedStory[] = useMemo(() => {
    return stories.map((s) => {
      const normalizedLang = normalizeLanguageCode(s.original_language) || null;
      const inferredResult = stateConfig?.districts?.length
        ? inferDistrictFromText(s, stateConfig.districts)
        : null;

      return {
        ...s,
        original_language: normalizedLang,
        district: s.district || inferredResult?.district || null,
        inferredDistrict: !s.district ? inferredResult : undefined,
      };
    });
  }, [stories, stateConfig?.districts]);

  // Filter and sort stories - regional language first
  const filteredStories = useMemo(() => {
    let result = [...enrichedStories];

    // Filter by city
    if (selectedCity !== "all") {
      result = result.filter((s) => s.city?.toLowerCase().includes(selectedCity.toLowerCase()));
    }

    // Filter by district (inferred + stored)
    if (selectedDistrict !== "all") {
      result = result.filter((s) => s.district?.toLowerCase().includes(selectedDistrict.toLowerCase()));
    }

    // Filter by language (normalized)
    if (selectedLanguage !== "all") {
      if (selectedLanguage === "regional") {
        // Only stories with non-English original language content
        result = result.filter((s) => s.original_language && s.original_language !== "en");
      } else if (selectedLanguage === "en") {
        // Treat null/undefined as English
        result = result.filter((s) => !s.original_language || s.original_language === "en");
      } else {
        result = result.filter((s) => s.original_language === selectedLanguage);
      }
    }

    // Filter by category
    if (selectedCategory !== "all") {
      result = result.filter((s) => s.category?.toLowerCase() === selectedCategory.toLowerCase());
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.headline.toLowerCase().includes(query) ||
          s.summary?.toLowerCase().includes(query) ||
          s.original_headline?.toLowerCase().includes(query)
      );
    }

    // Sort: Regional language stories first, then by date
    result.sort((a, b) => {
      const aHasRegional = a.original_language && a.original_language !== "en";
      const bHasRegional = b.original_language && b.original_language !== "en";

      if (aHasRegional && !bHasRegional) return -1;
      if (!aHasRegional && bHasRegional) return 1;

      return new Date(b.first_published_at).getTime() - new Date(a.first_published_at).getTime();
    });

    return result;
  }, [enrichedStories, selectedCity, selectedDistrict, selectedLanguage, selectedCategory, searchQuery]);

  // Apply personalization if "For You" feed is selected
  const displayStories = useMemo(() => {
    if (feedType === "foryou") {
      return personalizeStories(filteredStories);
    }
    return filteredStories;
  }, [filteredStories, feedType, personalizeStories]);

  // Get unique values for filters
  const uniqueCities = useMemo(() => {
    const cities = new Set<string>();
    enrichedStories.forEach((s) => {
      if (s.city) cities.add(s.city);
    });
    return Array.from(cities).sort();
  }, [enrichedStories]);

  const uniqueDistricts = useMemo(() => {
    const districts = new Set<string>();
    enrichedStories.forEach((s) => {
      if (s.district) districts.add(s.district);
    });
    return Array.from(districts).sort();
  }, [enrichedStories]);

  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>();
    enrichedStories.forEach((s) => {
      if (s.category) categories.add(s.category);
    });
    return Array.from(categories).sort();
  }, [enrichedStories]);

  // Language stats (normalized)
  const languageStats = useMemo(() => {
    const stats: Record<string, number> = { en: 0 };
    enrichedStories.forEach((s) => {
      const lang = s.original_language || "en";
      stats[lang] = (stats[lang] || 0) + 1;
    });
    return stats;
  }, [enrichedStories]);

  // Transform story to NewsItem
  const transformStory = (story: EnrichedStory): NewsItem => {
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
      
      {/* Spacer for fixed header */}
      <div className="h-14" />
      
      {/* Breadcrumb Navigation - Sticky below header */}
      <div className="sticky top-14 z-40 bg-background/98 backdrop-blur-md border-b border-border/40">
        <div className="container mx-auto px-4">
          <BreadcrumbNav
            items={[
              { id: "home", label: "Home", path: "/", type: "home" },
              { id: "india", label: "India", path: "/india", type: "country", icon: <span>🇮🇳</span> },
              { id: stateId || "state", label: stateName, type: "state" },
              ...(selectedDistrict !== "all" ? [{ id: selectedDistrict, label: selectedDistrict, type: "district" as const }] : []),
              ...(selectedCity !== "all" ? [{ id: selectedCity, label: selectedCity, type: "city" as const }] : []),
            ]}
            onNavigate={(item, index) => {
              if (item.type === "state") {
                setSelectedDistrict("all");
                setSelectedCity("all");
              } else if (item.type === "district") {
                setSelectedCity("all");
              }
            }}
            onGoBack={() => {
              if (selectedCity !== "all") {
                setSelectedCity("all");
              } else if (selectedDistrict !== "all") {
                setSelectedDistrict("all");
              } else {
                navigate("/india");
              }
            }}
          />
        </div>
      </div>
      
      {/* Real-time news indicator */}
      <RealtimeNewsIndicator 
        onRefresh={fetchStories} 
        variant="bar"
      />
      
      <main className="container mx-auto px-4 py-6">

        {/* State Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <StateFlagBadge stateId={stateId || ""} size="xl" />
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold">{stateName} News</h1>
                <RealtimeStatusDot />
              </div>
              <p className="text-muted-foreground flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {stateConfig?.capital || "Capital"}
                </span>
                <span>•</span>
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
                {Object.entries(languageStats).filter(([lang]) => lang !== "en").reduce((sum, [, count]) => sum + count, 0)}
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <span className={cn("w-2 h-2 rounded-full", langConfig?.color || "bg-primary")} />
                Regional Language Stories
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

          {/* Auto-refresh timer and Refresh News button */}
          <div className="flex items-center justify-between mb-4 gap-3">
            <AutoRefreshTimer
              intervalMinutes={5}
              onRefresh={async () => {
                await fetchStories();
              }}
              className="flex-1"
            />
            
            {/* Refresh News Button - Triggers async ingestion */}
            <Button
              variant="default"
              size="sm"
              onClick={async () => {
                setIsLoading(true);
                toast.loading(`Refreshing ${stateName} news...`, { id: "refresh-news" });
                try {
                  // Trigger ingestion for this specific state in the background
                  supabase.functions.invoke("ingest-rss", {
                    body: { 
                      trigger: "manual",
                      stateId: stateId, // Filter ingestion to this state only
                    },
                  }).then(() => {
                    toast.success(`Ingestion triggered for ${stateName}`, { id: "ingestion-bg" });
                  }).catch(console.error);
                  
                  // Immediately refresh stories from database
                  await fetchStories();
                  toast.success(`${stateName} news feed refreshed!`, { id: "refresh-news" });
                } catch (error) {
                  toast.error("Failed to refresh news", { id: "refresh-news" });
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
              Refresh {stateName} News
            </Button>
            
            {/* Feed type toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={feedType === "all" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFeedType("all")}
                className="gap-1.5 h-7 text-xs"
              >
                <Globe className="w-3 h-3" />
                All News
              </Button>
              <Button
                variant={feedType === "foryou" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFeedType("foryou")}
                className="gap-1.5 h-7 text-xs"
              >
                <Sparkles className="w-3 h-3" />
                For You
              </Button>
            </div>
          </div>
        </div>

        {/* Ingestion Pipeline */}
        <IngestionPipelineViewer 
          onIngestionComplete={fetchStories}
          className="mb-4"
        />

        {/* Timeline Chart */}
        <IngestionTimelineChart className="mb-4" />

        {/* Run History */}
        <IngestionRunHistory className="mb-6" />

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
              onClick={async () => {
                setIsLoading(true);
                toast.loading("Refreshing...", { id: "filter-refresh" });
                try {
                  // Trigger ingestion in background
                  supabase.functions.invoke("ingest-rss", {
                    body: { trigger: "manual" },
                  }).catch(console.error);
                  // Refresh stories immediately
                  await fetchStories();
                  toast.success("Refreshed!", { id: "filter-refresh" });
                } catch (error) {
                  toast.error("Failed to refresh", { id: "filter-refresh" });
                } finally {
                  setIsLoading(false);
                }
              }}
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
            ) : displayStories.length === 0 ? (
              <Card className="p-12 text-center">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No stories found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery 
                    ? `No results for "${searchQuery}"`
                    : feedType === "foryou" 
                      ? "Read some stories to get personalized recommendations"
                      : `No recent news from ${stateName}`}
                </p>
                <Button onClick={fetchStories}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* For You explanation */}
                {feedType === "foryou" && topCategories.length > 0 && (
                  <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-primary">Personalized for you</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Based on your reading history: {topCategories.slice(0, 3).join(", ")}
                      {topStates.length > 0 && ` • ${topStates.slice(0, 2).join(", ")}`}
                    </p>
                  </div>
                )}

                {/* Regional language stories section */}
                {displayStories.some(s => s.original_language && s.original_language !== "en") && feedType === "all" && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Badge className={cn(langConfig?.color, "text-white")}>
                        {langConfig?.native || "Regional"} News
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Regional language stories shown first
                      </span>
                    </div>
                  </div>
                )}

                {displayStories.map((story, index) => (
                  <NewsCard
                    key={story.id}
                    news={transformStory(story)}
                    index={index}
                    onClick={() => {
                      // Track the read for personalization
                      trackRead({
                        id: story.id,
                        category: story.category,
                        state: story.state,
                        original_language: story.original_language,
                        source: "Local Sources",
                      });
                      navigate(`/news/${story.id}`);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Weather & AQI Widget */}
            {stateConfig?.capitalCoordinates && (
              <WeatherAQIWidget
                lat={stateConfig.capitalCoordinates.lat}
                lng={stateConfig.capitalCoordinates.lng}
                cityName={stateConfig.capital}
                showAQI={true}
              />
            )}
            {/* District Drilldown */}
            {stateConfig?.districts && stateConfig.districts.length > 0 && (
              <DistrictDrilldown
                stateId={stateId || ""}
                stateName={stateName}
                stateCode={stateConfig.code}
                stateColor={stateConfig.color}
                districts={stateConfig.districts}
                stories={enrichedStories}
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
