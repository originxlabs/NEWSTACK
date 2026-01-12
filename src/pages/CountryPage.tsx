import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, TrendingUp, Globe2, Newspaper, Radio, 
  Languages, Building2, ChevronRight, RefreshCw,
  Search, Filter, BarChart3, Clock,
  Users, Zap, ChevronDown, Volume2, Globe, Layers,
  CheckCircle2, AlertCircle, Loader2, ExternalLink, Home
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
import { BreadcrumbNav, BreadcrumbItem } from "@/components/BreadcrumbNav";
import { 
  GEO_HIERARCHY,
  getCountryByCode,
  getContinentById,
  COUNTRY_TO_CONTINENT,
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
}

// Country flag/info database
const COUNTRY_INFO: Record<string, { name: string; flag: string; languages: string[]; currency?: string }> = {
  US: { name: "United States", flag: "🇺🇸", languages: ["en"] },
  GB: { name: "United Kingdom", flag: "🇬🇧", languages: ["en"] },
  IN: { name: "India", flag: "🇮🇳", languages: ["hi", "en", "ta", "te", "kn", "ml", "mr", "gu", "pa", "bn", "or"] },
  CN: { name: "China", flag: "🇨🇳", languages: ["zh"] },
  JP: { name: "Japan", flag: "🇯🇵", languages: ["ja"] },
  DE: { name: "Germany", flag: "🇩🇪", languages: ["de"] },
  FR: { name: "France", flag: "🇫🇷", languages: ["fr"] },
  AU: { name: "Australia", flag: "🇦🇺", languages: ["en"] },
  CA: { name: "Canada", flag: "🇨🇦", languages: ["en", "fr"] },
  BR: { name: "Brazil", flag: "🇧🇷", languages: ["pt"] },
  RU: { name: "Russia", flag: "🇷🇺", languages: ["ru"] },
  IT: { name: "Italy", flag: "🇮🇹", languages: ["it"] },
  ES: { name: "Spain", flag: "🇪🇸", languages: ["es"] },
  MX: { name: "Mexico", flag: "🇲🇽", languages: ["es"] },
  KR: { name: "South Korea", flag: "🇰🇷", languages: ["ko"] },
  ID: { name: "Indonesia", flag: "🇮🇩", languages: ["id"] },
  NL: { name: "Netherlands", flag: "🇳🇱", languages: ["nl"] },
  SA: { name: "Saudi Arabia", flag: "🇸🇦", languages: ["ar"] },
  AE: { name: "UAE", flag: "🇦🇪", languages: ["ar", "en"] },
  SG: { name: "Singapore", flag: "🇸🇬", languages: ["en", "zh", "ms", "ta"] },
  ZA: { name: "South Africa", flag: "🇿🇦", languages: ["en", "af", "zu"] },
  NG: { name: "Nigeria", flag: "🇳🇬", languages: ["en"] },
  EG: { name: "Egypt", flag: "🇪🇬", languages: ["ar"] },
  PK: { name: "Pakistan", flag: "🇵🇰", languages: ["ur", "en"] },
  BD: { name: "Bangladesh", flag: "🇧🇩", languages: ["bn"] },
  VN: { name: "Vietnam", flag: "🇻🇳", languages: ["vi"] },
  TH: { name: "Thailand", flag: "🇹🇭", languages: ["th"] },
  MY: { name: "Malaysia", flag: "🇲🇾", languages: ["ms", "en"] },
  PH: { name: "Philippines", flag: "🇵🇭", languages: ["tl", "en"] },
};

export default function CountryPage() {
  const { countryCode } = useParams<{ countryCode: string }>();
  const navigate = useNavigate();
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedState, setSelectedState] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const upperCountryCode = countryCode?.toUpperCase() || "";
  const countryInfo = COUNTRY_INFO[upperCountryCode];
  const countryFromGeo = getCountryByCode(upperCountryCode);
  const continentId = COUNTRY_TO_CONTINENT[upperCountryCode];
  const continent = continentId ? getContinentById(continentId) : null;
  
  const countryName = countryInfo?.name || countryFromGeo?.name || countryCode || "Country";
  const countryFlag = countryInfo?.flag || countryFromGeo?.flag || "🌍";

  // Fetch stories for this country
  const fetchStories = useCallback(async () => {
    if (!countryCode) return;
    
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
          country_code
        `)
        .eq("country_code", upperCountryCode)
        .gte("first_published_at", cutoff.toISOString())
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
  }, [countryCode, upperCountryCode]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  // Filter stories
  const filteredStories = useMemo(() => {
    let result = [...stories];

    if (selectedState !== "all") {
      result = result.filter(s => 
        s.state?.toLowerCase().includes(selectedState.toLowerCase())
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

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.headline.toLowerCase().includes(query) ||
        s.summary?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [stories, selectedState, selectedCity, selectedCategory, searchQuery]);

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
      source: "Local Sources",
      timestamp,
      publishedAt: story.first_published_at,
      imageUrl: story.image_url || undefined,
      countryCode: story.country_code || upperCountryCode,
      isGlobal: false,
      sourceCount: story.source_count || 1,
      locationRelevance: "Local",
      original_headline: story.original_headline,
      original_summary: story.original_summary,
      original_language: story.original_language,
    };
  };

  // Breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    { id: "home", label: "Home", path: "/", type: "home" },
    { id: "world", label: "World", path: "/world", type: "home", icon: <Globe className="w-3.5 h-3.5" /> },
    ...(continent ? [{ id: continent.id, label: continent.name, type: "continent" as const }] : []),
    { id: upperCountryCode, label: countryName, type: "country", icon: <span>{countryFlag}</span> },
    ...(selectedState !== "all" ? [{ id: selectedState, label: selectedState, type: "state" as const }] : []),
    ...(selectedCity !== "all" ? [{ id: selectedCity, label: selectedCity, type: "city" as const }] : []),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        {/* Breadcrumb Navigation */}
        <BreadcrumbNav
          items={breadcrumbItems}
          onNavigate={(item, index) => {
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
          className="mb-6"
        />

        {/* Country Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-4xl">
              {countryFlag}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{countryName} News</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {continent?.name || "World"} • 
                <span className="flex items-center gap-1">
                  <Newspaper className="w-4 h-4" />
                  {stories.length} stories
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
              <div className="text-2xl font-bold text-emerald-600">{uniqueStates.length}</div>
              <div className="text-xs text-muted-foreground">States/Regions</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-blue-600">{uniqueCities.length}</div>
              <div className="text-xs text-muted-foreground">Cities</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-amber-600">{uniqueCategories.length}</div>
              <div className="text-xs text-muted-foreground">Categories</div>
            </Card>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6 p-4">
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

            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="State/Region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {uniqueStates.map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
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
                    : `No recent news from ${countryName}`}
                </p>
                <Button onClick={fetchStories}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
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
            {/* States/Regions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  States/Regions ({uniqueStates.length})
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
                        "w-full flex items-center justify-between p-2 rounded-lg transition-colors text-left",
                        selectedState === state ? "bg-primary/10 text-primary" : "hover:bg-muted/50"
                      )}
                    >
                      <span className="text-sm truncate">{state}</span>
                      <Badge variant="secondary" className="text-xs">{count}</Badge>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Cities */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Cities ({uniqueCities.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 max-h-[300px] overflow-y-auto">
                {uniqueCities.slice(0, 15).map(city => {
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
                      <span className="text-sm truncate">{city}</span>
                      <Badge variant="secondary" className="text-xs">{count}</Badge>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Categories */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {uniqueCategories.map(cat => {
                  const count = stories.filter(s => s.category === cat).length;
                  return (
                    <Badge
                      key={cat}
                      variant={selectedCategory === cat ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setSelectedCategory(selectedCategory === cat ? "all" : cat)}
                    >
                      {cat} ({count})
                    </Badge>
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
