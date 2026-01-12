import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, TrendingUp, Globe2, Newspaper, Languages,
  Building2, ChevronRight, ChevronDown, ChevronUp, RefreshCw,
  Search, Filter, Clock, Users, Flag, Home, Layers,
  CheckCircle2, AlertCircle, Loader2, ExternalLink, Volume2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { NewsCard, NewsItem } from "@/components/NewsCard";
import { BreadcrumbNav, BreadcrumbItem } from "@/components/BreadcrumbNav";
import { RealtimeNewsIndicator, RealtimeStatusDot } from "@/components/RealtimeNewsIndicator";
import { IngestionPipelineViewer } from "@/components/IngestionPipelineViewer";
import { IngestionTimelineChart } from "@/components/IngestionTimelineChart";
import { AutoRefreshTimer } from "@/components/AutoRefreshTimer";
import { AudioPlaylistPlayer } from "@/components/AudioPlaylistPlayer";
import { 
  getCountryLanguages,
  getLanguageName,
  COUNTRY_LANGUAGES,
  getCountryProvinces,
  getAdministrativeTerm,
  COUNTRY_PROVINCES,
  getCountryMetadata,
  COUNTRY_METADATA,
} from "@/lib/world-countries-config";
import { WeatherAQIWidget } from "@/components/weather/WeatherAQIWidget";
import {
  getCountryByCode,
  getContinentById,
  COUNTRY_TO_CONTINENT,
  Country,
  State,
} from "@/lib/geo-hierarchy";

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
  country_code: string | null;
  is_global: boolean | null;
}

interface WorldCountryDashboardProps {
  countryCode: string;
  countryName: string;
  countryFlag: string;
}

// Language display configuration
const LANGUAGE_DISPLAY: Record<string, { name: string; native: string }> = {
  en: { name: "English", native: "English" },
  de: { name: "German", native: "Deutsch" },
  fr: { name: "French", native: "Français" },
  es: { name: "Spanish", native: "Español" },
  it: { name: "Italian", native: "Italiano" },
  pt: { name: "Portuguese", native: "Português" },
  nl: { name: "Dutch", native: "Nederlands" },
  ru: { name: "Russian", native: "Русский" },
  zh: { name: "Chinese", native: "中文" },
  ja: { name: "Japanese", native: "日本語" },
  ko: { name: "Korean", native: "한국어" },
  ar: { name: "Arabic", native: "العربية" },
  hi: { name: "Hindi", native: "हिन्दी" },
  bn: { name: "Bengali", native: "বাংলা" },
  ta: { name: "Tamil", native: "தமிழ்" },
  te: { name: "Telugu", native: "తెలుగు" },
  ur: { name: "Urdu", native: "اردو" },
  th: { name: "Thai", native: "ไทย" },
  vi: { name: "Vietnamese", native: "Tiếng Việt" },
  id: { name: "Indonesian", native: "Bahasa Indonesia" },
  ms: { name: "Malay", native: "Bahasa Melayu" },
  tr: { name: "Turkish", native: "Türkçe" },
  pl: { name: "Polish", native: "Polski" },
  uk: { name: "Ukrainian", native: "Українська" },
  sv: { name: "Swedish", native: "Svenska" },
  no: { name: "Norwegian", native: "Norsk" },
  da: { name: "Danish", native: "Dansk" },
  fi: { name: "Finnish", native: "Suomi" },
};

export function WorldCountryDashboard({ countryCode, countryName, countryFlag }: WorldCountryDashboardProps) {
  const navigate = useNavigate();
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedState, setSelectedState] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
  const [selectedTier, setSelectedTier] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [showIngestion, setShowIngestion] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);

  const upperCountryCode = countryCode.toUpperCase();
  const countryFromGeo = getCountryByCode(upperCountryCode);
  const continentId = COUNTRY_TO_CONTINENT[upperCountryCode];
  const continent = continentId ? getContinentById(continentId) : null;
  const countryLanguages = getCountryLanguages(upperCountryCode);

  // Fetch stories for this country
  const fetchStories = useCallback(async () => {
    setIsLoading(true);
    try {
      const cutoff = new Date();
      cutoff.setHours(cutoff.getHours() - 72); // Last 72 hours

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
          confidence_level,
          country_code,
          is_global
        `)
        .eq("country_code", upperCountryCode)
        .gte("first_published_at", cutoff.toISOString())
        .order("first_published_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      setStories(data || []);
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Error fetching stories:", error);
    } finally {
      setIsLoading(false);
    }
  }, [upperCountryCode]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  // Filter stories
  const filteredStories = useMemo(() => {
    let result = [...stories];

    if (selectedState !== "all") {
      result = result.filter(s => 
        s.state?.toLowerCase().includes(selectedState.toLowerCase()) ||
        s.city?.toLowerCase().includes(selectedState.toLowerCase())
      );
    }

    if (selectedCity !== "all") {
      result = result.filter(s => 
        s.city?.toLowerCase().includes(selectedCity.toLowerCase())
      );
    }

    if (selectedCategory !== "all") {
      result = result.filter(s => 
        s.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (selectedLanguage !== "all") {
      result = result.filter(s => 
        s.original_language?.toLowerCase() === selectedLanguage.toLowerCase()
      );
    }

    if (selectedTier !== "all") {
      if (selectedTier === "local") {
        result = result.filter(s => !s.is_global && (s.city || s.state));
      } else if (selectedTier === "national") {
        result = result.filter(s => !s.is_global && !s.city && !s.state);
      } else if (selectedTier === "global") {
        result = result.filter(s => s.is_global);
      }
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.headline.toLowerCase().includes(query) ||
        s.summary?.toLowerCase().includes(query) ||
        s.original_headline?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [stories, selectedState, selectedCity, selectedCategory, selectedLanguage, selectedTier, searchQuery]);

  // Get unique values for filters
  const uniqueStates = useMemo(() => {
    const states = new Set<string>();
    stories.forEach(s => {
      if (s.state) states.add(s.state);
    });
    return Array.from(states).sort();
  }, [stories]);

  const uniqueCities = useMemo(() => {
    const cities = new Set<string>();
    stories.forEach(s => {
      if (s.city) cities.add(s.city);
    });
    return Array.from(cities).sort();
  }, [stories]);

  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>();
    stories.forEach(s => {
      if (s.category) categories.add(s.category);
    });
    return Array.from(categories).sort();
  }, [stories]);

  const uniqueLanguages = useMemo(() => {
    const languages = new Set<string>();
    stories.forEach(s => {
      if (s.original_language) languages.add(s.original_language);
    });
    return Array.from(languages).sort();
  }, [stories]);

  // Count stories by tier
  const tierCounts = useMemo(() => {
    const local = stories.filter(s => !s.is_global && (s.city || s.state)).length;
    const national = stories.filter(s => !s.is_global && !s.city && !s.state).length;
    const global = stories.filter(s => s.is_global).length;
    return { local, national, global };
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
      topic: story.category || "News",
      sentiment: "neutral",
      trustScore: story.confidence_level === "high" ? 95 : story.confidence_level === "medium" ? 80 : 70,
      source: story.is_global ? "Global Media" : "Local Sources",
      timestamp,
      publishedAt: story.first_published_at,
      imageUrl: story.image_url || undefined,
      countryCode: story.country_code || upperCountryCode,
      isGlobal: story.is_global || false,
      sourceCount: story.source_count || 1,
      locationRelevance: story.is_global ? "Global" : "Local",
      original_headline: story.original_headline,
      original_summary: story.original_summary,
      original_language: story.original_language,
    };
  };

  // Breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    { id: "home", label: "Home", path: "/", type: "home" },
    { id: "world", label: "World", path: "/world", type: "home", icon: <Globe2 className="w-3.5 h-3.5" /> },
    ...(continent ? [{ id: continent.id, label: continent.name, type: "continent" as const }] : []),
    { id: upperCountryCode, label: countryName, type: "country", icon: <span>{countryFlag}</span> },
    ...(selectedState !== "all" ? [{ id: selectedState, label: selectedState, type: "state" as const }] : []),
    ...(selectedCity !== "all" ? [{ id: selectedCity, label: selectedCity, type: "city" as const }] : []),
  ];

  // Prepare playlist items
  const playlistItems = useMemo(() => {
    return filteredStories.slice(0, 20).map(story => ({
      id: story.id,
      headline: story.headline,
      original_headline: story.original_headline || undefined,
      original_language: story.original_language || undefined,
      source: story.is_global ? "Global" : "Local",
    }));
  }, [filteredStories]);

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <BreadcrumbNav
        items={breadcrumbItems}
        onNavigate={(item) => {
          if (item.type === "country") {
            setSelectedState("all");
            setSelectedCity("all");
          } else if (item.type === "state") {
            setSelectedCity("all");
          }
        }}
        onGoBack={() => {
          if (selectedCity !== "all") {
            setSelectedCity("all");
          } else if (selectedState !== "all") {
            setSelectedState("all");
          } else {
            navigate("/world");
          }
        }}
      />

      {/* Country Header */}
      {(() => {
        const metadata = getCountryMetadata(upperCountryCode);
        return (
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-4xl">
              {countryFlag}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold">{countryName}</h1>
                <RealtimeStatusDot />
              </div>
              <p className="text-muted-foreground flex items-center gap-2 flex-wrap text-sm">
                <span className="flex items-center gap-1">
                  <Globe2 className="w-4 h-4" />
                  {metadata?.continent || continent?.name || "World"}
                </span>
                <span className="flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  Capital: {metadata?.capital || "N/A"}
                </span>
                {metadata?.currency && (
                  <span className="flex items-center gap-1">
                    <span className="text-lg font-semibold">{metadata.currencySymbol || "$"}</span>
                    {metadata.currency}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Newspaper className="w-4 h-4" />
                  {stories.length} stories
                </span>
                {countryLanguages.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Languages className="w-4 h-4" />
                    {countryLanguages.slice(0, 3).map(l => l.nativeName).join(", ")}
                  </span>
                )}
              </p>
            </div>
            <AutoRefreshTimer
              onRefresh={fetchStories}
              intervalMinutes={5}
            />
          </div>
        );
      })()}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-primary">{stories.length}</div>
          <div className="text-xs text-muted-foreground">Total Stories</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">{tierCounts.local}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Local News
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-emerald-600">{tierCounts.national}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Flag className="w-3 h-3" /> National
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-purple-600">{tierCounts.global}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Globe2 className="w-3 h-3" /> Global Coverage
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-amber-600">{uniqueStates.length}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Building2 className="w-3 h-3" /> Regions
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-rose-600">{uniqueLanguages.length}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Languages className="w-3 h-3" /> Languages
          </div>
        </Card>
      </div>

      {/* Language Badges */}
      {uniqueLanguages.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {uniqueLanguages.map(lang => {
            const langInfo = LANGUAGE_DISPLAY[lang] || { name: lang, native: lang };
            const count = stories.filter(s => s.original_language === lang).length;
            return (
              <Badge
                key={lang}
                variant={selectedLanguage === lang ? "default" : "outline"}
                className="cursor-pointer gap-1"
                onClick={() => setSelectedLanguage(selectedLanguage === lang ? "all" : lang)}
              >
                {langInfo.native} <span className="text-muted-foreground">({count})</span>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Tier Filter Badges */}
      <div className="flex flex-wrap gap-2">
        <Badge
          variant={selectedTier === "all" ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setSelectedTier("all")}
        >
          All ({stories.length})
        </Badge>
        <Badge
          variant={selectedTier === "local" ? "default" : "outline"}
          className="cursor-pointer gap-1"
          onClick={() => setSelectedTier("local")}
        >
          <MapPin className="w-3 h-3" /> Local ({tierCounts.local})
        </Badge>
        <Badge
          variant={selectedTier === "national" ? "default" : "outline"}
          className="cursor-pointer gap-1"
          onClick={() => setSelectedTier("national")}
        >
          <Flag className="w-3 h-3" /> National ({tierCounts.national})
        </Badge>
        <Badge
          variant={selectedTier === "global" ? "default" : "outline"}
          className="cursor-pointer gap-1"
          onClick={() => setSelectedTier("global")}
        >
          <Globe2 className="w-3 h-3" /> Global ({tierCounts.global})
        </Badge>
      </div>

      {/* Ingestion Pipeline - Collapsible */}
      <Collapsible open={showIngestion} onOpenChange={setShowIngestion}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-primary" />
                  Manual RSS Ingestion
                </CardTitle>
                {showIngestion ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <IngestionPipelineViewer 
                onIngestionComplete={fetchStories}
              />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 24-Hour Activity Chart - Collapsible */}
      <IngestionTimelineChart />

      {/* Audio Playlist */}
      {playlistItems.length > 0 && showPlaylist && (
        <Card>
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-primary" />
                Audio Playlist ({playlistItems.length} stories)
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowPlaylist(false)}>
                <ChevronUp className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <AudioPlaylistPlayer 
              items={playlistItems} 
              isOpen={showPlaylist}
              onClose={() => setShowPlaylist(false)}
            />
          </CardContent>
        </Card>
      )}
      
      {playlistItems.length > 0 && !showPlaylist && (
        <Button variant="outline" onClick={() => setShowPlaylist(true)} className="gap-2">
          <Volume2 className="w-4 h-4" />
          Open Audio Playlist ({playlistItems.length} stories)
        </Button>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${countryName} news...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {uniqueStates.length > 0 && (
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="State/Region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                {uniqueStates.map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {uniqueCities.length > 0 && (
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
          )}

          {uniqueCategories.length > 0 && (
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
          )}

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
      </Card>

      {/* Content Grid */}
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
                  : `No recent news from ${countryName}`}
              </p>
              <div className="flex flex-col gap-2 items-center">
                <Button onClick={fetchStories}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Button variant="outline" onClick={() => setShowIngestion(true)}>
                  Run Manual Ingestion
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredStories.map((story, index) => (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex gap-4">
                      {story.image_url && (
                        <img
                          src={story.image_url}
                          alt=""
                          className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 
                            className="font-semibold line-clamp-2 cursor-pointer hover:text-primary"
                            onClick={() => navigate(`/news/${story.id}`)}
                          >
                            {story.headline}
                          </h3>
                          <div className="flex-shrink-0 flex items-center gap-1">
                            {story.is_global ? (
                              <Badge variant="secondary" className="text-[10px] gap-1">
                                <Globe2 className="w-3 h-3" /> Global
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] gap-1">
                                <MapPin className="w-3 h-3" /> Local
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {story.original_headline && story.original_language && story.original_language !== "en" && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-1 italic">
                            {story.original_headline}
                          </p>
                        )}
                        
                        {story.summary && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {story.summary}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                          {story.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {story.city}
                            </span>
                          )}
                          {story.state && (
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" /> {story.state}
                            </span>
                          )}
                          {story.category && (
                            <Badge variant="outline" className="text-[10px]">{story.category}</Badge>
                          )}
                          {story.original_language && (
                            <Badge variant="secondary" className="text-[10px]">
                              {LANGUAGE_DISPLAY[story.original_language]?.native || story.original_language}
                            </Badge>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(story.first_published_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Weather & AQI for Capital */}
          {(() => {
            const metadata = getCountryMetadata(upperCountryCode);
            if (metadata?.capitalCoordinates) {
              return (
                <WeatherAQIWidget
                  lat={metadata.capitalCoordinates.lat}
                  lng={metadata.capitalCoordinates.lng}
                  cityName={metadata.capital}
                  showAQI={true}
                  compact={false}
                />
              );
            }
            return null;
          })()}

          {/* Provinces/States with Flags */}
          {(() => {
            const provinces = getCountryProvinces(upperCountryCode);
            if (provinces.length > 0) {
              return (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Flag className="w-4 h-4 text-primary" />
                      {getAdministrativeTerm(upperCountryCode).plural} ({provinces.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 max-h-[350px] overflow-y-auto">
                    {provinces.map(province => {
                      const count = stories.filter(s => 
                        province.majorCities?.some(city => 
                          s.city?.toLowerCase().includes(city.toLowerCase())
                        ) || s.state?.toLowerCase().includes(province.name.toLowerCase())
                      ).length;
                      
                      return (
                        <button
                          key={province.id}
                          onClick={() => navigate(`/world/${countryCode.toLowerCase()}/${province.id}`)}
                          className={cn(
                            "w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-sm transition-colors hover:bg-muted group"
                          )}
                        >
                          <span className="text-lg flex-shrink-0">
                            {province.flagEmoji || province.flag || "🏛️"}
                          </span>
                          <div className="flex-1 text-left min-w-0">
                            <div className="font-medium truncate">{province.name}</div>
                            {province.capital && (
                              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Building2 className="w-2.5 h-2.5" />
                                {province.capital}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {count > 0 && (
                              <Badge variant="secondary" className="text-[10px]">{count}</Badge>
                            )}
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </button>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            }
            return null;
          })()}

          {/* Regions/States from stories - FILTERED BY COUNTRY */}
          {uniqueStates.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  {countryName} Regions ({uniqueStates.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 max-h-[300px] overflow-y-auto">
                {uniqueStates.slice(0, 15).map(state => {
                  const count = stories.filter(s => s.state === state).length;
                  return (
                    <button
                      key={state}
                      onClick={() => setSelectedState(selectedState === state ? "all" : state)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors",
                        selectedState === state 
                          ? "bg-primary text-primary-foreground" 
                          : "hover:bg-muted"
                      )}
                    >
                      <span className="truncate">{state}</span>
                      <Badge variant="secondary" className="text-[10px]">{count}</Badge>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Cities - FILTERED BY COUNTRY */}
          {uniqueCities.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  {countryName} Cities ({uniqueCities.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 max-h-[250px] overflow-y-auto">
                {uniqueCities.slice(0, 12).map(city => {
                  const count = stories.filter(s => s.city === city).length;
                  return (
                    <button
                      key={city}
                      onClick={() => setSelectedCity(selectedCity === city ? "all" : city)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors",
                        selectedCity === city 
                          ? "bg-primary text-primary-foreground" 
                          : "hover:bg-muted"
                      )}
                    >
                      <span className="truncate">{city}</span>
                      <Badge variant="secondary" className="text-[10px]">{count}</Badge>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Categories */}
          {uniqueCategories.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  Categories ({uniqueCategories.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1">
                {uniqueCategories.map(cat => {
                  const count = stories.filter(s => s.category === cat).length;
                  return (
                    <Badge
                      key={cat}
                      variant={selectedCategory === cat ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => setSelectedCategory(selectedCategory === cat ? "all" : cat)}
                    >
                      {cat} ({count})
                    </Badge>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
