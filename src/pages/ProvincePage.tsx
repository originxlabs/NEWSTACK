import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  MapPin, Globe2, Newspaper, Languages, Building2, ChevronRight,
  ChevronDown, ChevronUp, RefreshCw, Search, Flag, Home, Layers,
  Navigation, Cloud, Thermometer, Wind, Users
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { NewsCard, NewsItem } from "@/components/NewsCard";
import { BreadcrumbNav, BreadcrumbItem } from "@/components/BreadcrumbNav";
import { RealtimeStatusDot } from "@/components/RealtimeNewsIndicator";
import { AutoRefreshTimer } from "@/components/AutoRefreshTimer";
import { AudioPlaylistPlayer } from "@/components/AudioPlaylistPlayer";
import { WeatherWidget } from "@/components/weather/WeatherWidget";
import { PageLoader } from "@/components/PageLoader";
import { getCountryProvinces, getProvince, getCountryLanguages, getAdministrativeTerm, COUNTRY_PROVINCES } from "@/lib/world-countries-config";
import { getCountryByCode, getContinentById, COUNTRY_TO_CONTINENT } from "@/lib/geo-hierarchy";

// Country info database
const COUNTRY_INFO: Record<string, { name: string; flag: string; capital: string }> = {
  US: { name: "United States", flag: "🇺🇸", capital: "Washington D.C." },
  GB: { name: "United Kingdom", flag: "🇬🇧", capital: "London" },
  IN: { name: "India", flag: "🇮🇳", capital: "New Delhi" },
  CN: { name: "China", flag: "🇨🇳", capital: "Beijing" },
  JP: { name: "Japan", flag: "🇯🇵", capital: "Tokyo" },
  DE: { name: "Germany", flag: "🇩🇪", capital: "Berlin" },
  FR: { name: "France", flag: "🇫🇷", capital: "Paris" },
  AU: { name: "Australia", flag: "🇦🇺", capital: "Canberra" },
  CA: { name: "Canada", flag: "🇨🇦", capital: "Ottawa" },
  BR: { name: "Brazil", flag: "🇧🇷", capital: "Brasília" },
  RU: { name: "Russia", flag: "🇷🇺", capital: "Moscow" },
  IT: { name: "Italy", flag: "🇮🇹", capital: "Rome" },
  ES: { name: "Spain", flag: "🇪🇸", capital: "Madrid" },
  MX: { name: "Mexico", flag: "🇲🇽", capital: "Mexico City" },
  KR: { name: "South Korea", flag: "🇰🇷", capital: "Seoul" },
  PK: { name: "Pakistan", flag: "🇵🇰", capital: "Islamabad" },
};

interface Story {
  id: string;
  headline: string;
  summary: string | null;
  category: string | null;
  city: string | null;
  state: string | null;
  image_url: string | null;
  first_published_at: string;
  source_count: number | null;
  original_headline: string | null;
  original_language: string | null;
  confidence_level: string | null;
  country_code: string | null;
  is_global: boolean | null;
}

export default function ProvincePage() {
  const { countryCode, provinceId } = useParams<{ countryCode: string; provinceId: string }>();
  const navigate = useNavigate();
  
  const upperCountryCode = countryCode?.toUpperCase() || "";
  const countryInfo = COUNTRY_INFO[upperCountryCode];
  const countryFromGeo = getCountryByCode(upperCountryCode);
  const province = getProvince(upperCountryCode, provinceId || "");
  const continentId = COUNTRY_TO_CONTINENT[upperCountryCode];
  const continent = continentId ? getContinentById(continentId) : null;
  
  const countryName = countryInfo?.name || countryFromGeo?.name || "Country";
  const countryFlag = countryInfo?.flag || countryFromGeo?.flag || "🌍";
  
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showPlaylist, setShowPlaylist] = useState(false);

  // Fetch stories for this province
  const fetchStories = useCallback(async () => {
    if (!province) return;
    
    setIsLoading(true);
    try {
      const cutoff = new Date();
      cutoff.setHours(cutoff.getHours() - 72);

      // Search for stories matching the province name or its cities
      const cityNames = province.majorCities || [];
      
      const { data, error } = await supabase
        .from("stories")
        .select(`
          id, headline, summary, category, city, state, image_url,
          first_published_at, source_count, original_headline,
          original_language, confidence_level, country_code, is_global
        `)
        .eq("country_code", upperCountryCode)
        .gte("first_published_at", cutoff.toISOString())
        .order("first_published_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      // Filter to stories mentioning this province or its cities
      const provinceStories = (data || []).filter(story => {
        const storyCity = story.city?.toLowerCase() || "";
        const storyState = story.state?.toLowerCase() || "";
        const provinceName = province.name.toLowerCase();
        
        // Match province name or any major city
        return storyState.includes(provinceName) || 
               storyCity.includes(provinceName) ||
               cityNames.some(city => storyCity.includes(city.toLowerCase()));
      });

      setStories(provinceStories);
    } catch (error) {
      console.error("Error fetching stories:", error);
    } finally {
      setIsLoading(false);
    }
  }, [province, upperCountryCode]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  // Filter stories
  const filteredStories = useMemo(() => {
    let result = [...stories];

    if (selectedCity !== "all") {
      result = result.filter(s => 
        s.city?.toLowerCase().includes(selectedCity.toLowerCase())
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.headline.toLowerCase().includes(query) ||
        s.summary?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [stories, selectedCity, searchQuery]);

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
      trustScore: story.confidence_level === "high" ? 95 : 80,
      source: story.is_global ? "Global Media" : "Local Sources",
      timestamp,
      publishedAt: story.first_published_at,
      imageUrl: story.image_url || undefined,
      countryCode: story.country_code || upperCountryCode,
      isGlobal: story.is_global || false,
      sourceCount: story.source_count || 1,
      locationRelevance: story.is_global ? "Global" : "Local",
      original_headline: story.original_headline,
      original_language: story.original_language,
    };
  };

  if (!province) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <Header />
        <div className="h-14" />
        <main className="container mx-auto px-4 py-12 text-center">
          <Globe2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Province Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The requested province could not be found.
          </p>
          <Button onClick={() => navigate(`/world/${countryCode}`)}>
            Back to {countryName}
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  // Breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    { id: "home", label: "Home", path: "/", type: "home" },
    { id: "world", label: "World", path: "/world", type: "home", icon: <Globe2 className="w-3.5 h-3.5" /> },
    ...(continent ? [{ id: continent.id, label: continent.name, type: "continent" as const }] : []),
    { id: upperCountryCode, label: countryName, path: `/world/${countryCode}`, type: "country" as const, icon: <span>{countryFlag}</span> },
    { id: province.id, label: province.name, type: "state" as const, icon: <span>{province.flagEmoji || province.flag || "🏛️"}</span> },
  ];

  // Playlist items
  const playlistItems = filteredStories.slice(0, 15).map(story => ({
    id: story.id,
    headline: story.headline,
    original_headline: story.original_headline || undefined,
    original_language: story.original_language || undefined,
    source: story.is_global ? "Global" : "Local",
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Header />
      <div className="h-14" />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Breadcrumb */}
        <BreadcrumbNav
          items={breadcrumbItems}
          onNavigate={(item) => {
            if (item.path) navigate(item.path);
          }}
          onGoBack={() => navigate(`/world/${countryCode}`)}
        />

        {/* Province Header */}
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-4xl border border-border/50">
            {province.flagEmoji || province.flag || "🏛️"}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold">{province.name}</h1>
              <RealtimeStatusDot />
              <Badge variant="outline" className="text-xs">
                {countryFlag} {countryName}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
              {province.capital && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-amber-500" />
                  Capital: <span className="font-medium text-foreground">{province.capital}</span>
                </span>
              )}
              {province.population && (
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  {(province.population / 1000000).toFixed(1)}M people
                </span>
              )}
              {province.area && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {province.area.toLocaleString()} km²
                </span>
              )}
            </div>
          </div>
          <AutoRefreshTimer onRefresh={fetchStories} intervalMinutes={5} />
        </div>

        {/* Weather Widget for Capital */}
        {province.capitalCoordinates && (
          <WeatherWidget 
            lat={province.capitalCoordinates.lat}
            lng={province.capitalCoordinates.lng}
            cityName={province.capital || province.name}
          />
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-2xl font-bold text-primary">{stories.length}</div>
            <div className="text-xs text-muted-foreground">Total Stories</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-blue-600">{province.majorCities?.length || 0}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Building2 className="w-3 h-3" /> Major Cities
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-emerald-600">
              {stories.filter(s => !s.is_global).length}
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Local News
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {stories.filter(s => s.is_global).length}
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Globe2 className="w-3 h-3" /> Global Coverage
            </div>
          </Card>
        </div>

        {/* Major Cities Grid */}
        {province.majorCities && province.majorCities.length > 0 && (
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                Major Cities
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={selectedCity === "all" ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedCity("all")}
                >
                  All Cities
                </Badge>
                {province.majorCities.map(city => {
                  const cityStories = stories.filter(s => 
                    s.city?.toLowerCase().includes(city.toLowerCase())
                  ).length;
                  const isCapital = city === province.capital;
                  
                  return (
                    <Badge
                      key={city}
                      variant={selectedCity === city ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer gap-1",
                        isCapital && "border-amber-500/50 bg-amber-500/10"
                      )}
                      onClick={() => setSelectedCity(selectedCity === city ? "all" : city)}
                    >
                      {isCapital && <Building2 className="w-3 h-3 text-amber-500" />}
                      {city}
                      {cityStories > 0 && (
                        <span className="text-muted-foreground">({cityStories})</span>
                      )}
                    </Badge>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Audio Playlist */}
        {playlistItems.length > 0 && (
          <Collapsible open={showPlaylist} onOpenChange={setShowPlaylist}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      🎧 Audio News Playlist ({playlistItems.length} stories)
                    </CardTitle>
                    {showPlaylist ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  {showPlaylist && (
                    <AudioPlaylistPlayer
                      items={playlistItems.map(item => ({
                        id: item.id,
                        headline: item.headline,
                        originalHeadline: item.original_headline,
                        originalLanguage: item.original_language,
                        source: item.source,
                      }))}
                      isOpen={showPlaylist}
                      onClose={() => setShowPlaylist(false)}
                    />
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={`Search news in ${province.name}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-muted/50 rounded-lg animate-pulse" />
            ))
          ) : filteredStories.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Newspaper className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">No stories found</h3>
              <p className="text-sm text-muted-foreground">
                No news stories are currently available for {province.name}.
              </p>
            </div>
          ) : (
            filteredStories.map((story, idx) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <NewsCard news={transformStory(story)} index={idx} />
              </motion.div>
            ))
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
