import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  Globe, ChevronRight, ChevronLeft, MapPin, Building2, 
  Layers, RefreshCw, TrendingUp, TrendingDown,
  Minus, Wifi, WifiOff, Search, Navigation, Loader2, Radio
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { 
  GEO_HIERARCHY, 
  Continent, 
  Country, 
  State, 
  City, 
  Locality,
  getContinentById,
  getCountryById,
  COUNTRY_TO_CONTINENT,
  getGeoStats,
  SearchResult,
} from "@/lib/geo-hierarchy";
import { LocationSearch } from "@/components/world/LocationSearch";
import { useUserLocation } from "@/hooks/use-user-location";
import { LiveNewsTicker } from "@/components/world/LiveNewsTicker";

// Navigation levels
type DrillLevel = "world" | "continent" | "country" | "state" | "city" | "locality";

interface BreadcrumbItem {
  level: DrillLevel;
  id: string;
  name: string;
}

interface LocationStats {
  storyCount: number;
  trend: "up" | "down" | "stable";
  topHeadline?: string;
}

// Realtime connection state
function useRealtimeConnection() {
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    const channel = supabase
      .channel("world-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "stories" }, () => {})
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });
    
    return () => { supabase.removeChannel(channel); };
  }, []);
  
  return isConnected;
}

// Fetch stats for locations
function useLocationStats(level: DrillLevel, codes: string[]) {
  const [stats, setStats] = useState<Record<string, LocationStats>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchStats = useCallback(async () => {
    if (codes.length === 0) {
      setStats({});
      setIsLoading(false);
      return;
    }

    try {
      const cutoff = new Date();
      cutoff.setHours(cutoff.getHours() - 48);

      // Fetch stories grouped by country_code or city
      const { data, error } = await supabase
        .from("stories")
        .select("country_code, city, headline, created_at")
        .gte("created_at", cutoff.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      const statsMap: Record<string, LocationStats> = {};
      
      if (level === "world" || level === "continent") {
        // Group by continent
        const continentCounts: Record<string, { count: number; headline?: string }> = {};
        
        for (const story of data || []) {
          const continentId = story.country_code ? COUNTRY_TO_CONTINENT[story.country_code.toUpperCase()] : null;
          if (continentId && codes.includes(continentId)) {
            if (!continentCounts[continentId]) {
              continentCounts[continentId] = { count: 0, headline: story.headline };
            }
            continentCounts[continentId].count++;
          }
        }
        
        for (const id of codes) {
          statsMap[id] = {
            storyCount: continentCounts[id]?.count || 0,
            trend: (continentCounts[id]?.count || 0) > 50 ? "up" : "stable",
            topHeadline: continentCounts[id]?.headline,
          };
        }
      } else if (level === "country") {
        // Group by country
        const countryCounts: Record<string, { count: number; headline?: string }> = {};
        
        for (const story of data || []) {
          const code = story.country_code?.toUpperCase();
          if (code && codes.map(c => c.toUpperCase()).includes(code)) {
            if (!countryCounts[code]) {
              countryCounts[code] = { count: 0, headline: story.headline };
            }
            countryCounts[code].count++;
          }
        }
        
        for (const code of codes) {
          const upperCode = code.toUpperCase();
          statsMap[code] = {
            storyCount: countryCounts[upperCode]?.count || 0,
            trend: (countryCounts[upperCode]?.count || 0) > 20 ? "up" : "stable",
            topHeadline: countryCounts[upperCode]?.headline,
          };
        }
      } else {
        // For states/cities/localities, use a simpler count
        for (const code of codes) {
          const filtered = (data || []).filter(s => 
            s.city?.toLowerCase().includes(code.toLowerCase())
          );
          statsMap[code] = {
            storyCount: filtered.length,
            trend: "stable",
            topHeadline: filtered[0]?.headline,
          };
        }
      }

      setStats(statsMap);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to fetch location stats:", err);
    } finally {
      setIsLoading(false);
    }
  }, [level, codes]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [fetchStats]);

  return { stats, isLoading, lastUpdated, refetch: fetchStats };
}

// Trend icon component
function TrendIcon({ trend }: { trend: "up" | "down" | "stable" }) {
  if (trend === "up") return <TrendingUp className="h-3 w-3 text-red-500" />;
  if (trend === "down") return <TrendingDown className="h-3 w-3 text-emerald-500" />;
  return <Minus className="h-3 w-3 text-muted-foreground" />;
}

// Location card component
interface LocationCardProps {
  id: string;
  name: string;
  subtitle?: string;
  flag?: string;
  icon?: React.ReactNode;
  stats?: LocationStats;
  onClick: () => void;
  isCapital?: boolean;
  type?: string;
}

function LocationCard({ id, name, subtitle, flag, icon, stats, onClick, isCapital, type }: LocationCardProps) {
  const hasStories = (stats?.storyCount || 0) > 0;
  
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="cursor-pointer"
      onClick={onClick}
    >
      <Card className={cn(
        "h-full transition-all hover:shadow-md hover:border-primary/30",
        hasStories && "border-l-2 border-l-primary"
      )}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              {flag && <span className="text-xl">{flag}</span>}
              {icon}
              <div>
                <h3 className="font-medium text-sm flex items-center gap-1.5">
                  {name}
                  {isCapital && (
                    <Badge variant="outline" className="text-[9px] h-4 px-1 bg-amber-500/10 text-amber-600 border-amber-500/20">
                      Capital
                    </Badge>
                  )}
                </h3>
                {subtitle && (
                  <p className="text-[11px] text-muted-foreground">{subtitle}</p>
                )}
              </div>
            </div>
            {type && (
              <Badge variant="outline" className="text-[9px]">
                {type}
              </Badge>
            )}
          </div>
          
          {stats && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Layers className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm font-semibold">{stats.storyCount}</span>
                  <span className="text-[11px] text-muted-foreground">stories</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendIcon trend={stats.trend} />
                </div>
              </div>
              {stats.topHeadline && (
                <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2">
                  {stats.topHeadline}
                </p>
              )}
            </div>
          )}
          
          <div className="mt-3 flex items-center justify-end text-[10px] text-muted-foreground">
            <span>Drill down</span>
            <ChevronRight className="h-3 w-3 ml-0.5" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Breadcrumb navigation
function DrillBreadcrumb({ 
  items, 
  onNavigate 
}: { 
  items: BreadcrumbItem[]; 
  onNavigate: (level: DrillLevel, id?: string) => void;
}) {
  return (
    <div className="flex items-center gap-1 text-sm overflow-x-auto scrollbar-hide">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 gap-1 flex-shrink-0"
        onClick={() => onNavigate("world")}
      >
        <Globe className="h-3.5 w-3.5" />
        World
      </Button>
      
      {items.map((item, index) => (
        <div key={item.id} className="flex items-center">
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <Button
            variant={index === items.length - 1 ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2 flex-shrink-0"
            onClick={() => onNavigate(item.level, item.id)}
          >
            {item.name}
          </Button>
        </div>
      ))}
    </div>
  );
}

// Main World Page Component
export default function World() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isConnected = useRealtimeConnection();
  const userLocation = useUserLocation();
  const geoStats = useMemo(() => getGeoStats(), []);
  
  // Current drill-down state
  const [currentLevel, setCurrentLevel] = useState<DrillLevel>("world");
  const [selectedContinent, setSelectedContinent] = useState<Continent | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedState, setSelectedState] = useState<State | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [hasAutoDrilled, setHasAutoDrilled] = useState(false);

  // Auto-drill to user's location on first load
  useEffect(() => {
    if (!hasAutoDrilled && userLocation.hasPermission && userLocation.continent && userLocation.country) {
      setSelectedContinent(userLocation.continent);
      setSelectedCountry(userLocation.country);
      setCurrentLevel("country");
      setHasAutoDrilled(true);
    }
  }, [hasAutoDrilled, userLocation.hasPermission, userLocation.continent, userLocation.country]);

  // Handle search selection
  const handleSearchSelect = useCallback((result: SearchResult) => {
    setShowSearch(false);
    
    if (result.type === "continent" && result.id) {
      const continent = getContinentById(result.id);
      if (continent) {
        setSelectedContinent(continent);
        setSelectedCountry(null);
        setSelectedState(null);
        setSelectedCity(null);
        setCurrentLevel("continent");
      }
    } else if (result.type === "country" && result.continentId && result.countryCode) {
      const continent = getContinentById(result.continentId);
      const country = continent?.countries.find(c => c.code === result.countryCode);
      if (continent && country) {
        setSelectedContinent(continent);
        setSelectedCountry(country);
        setSelectedState(null);
        setSelectedCity(null);
        setCurrentLevel("country");
      }
    } else if (result.type === "state" && result.continentId && result.countryId && result.stateId) {
      const continent = getContinentById(result.continentId);
      const country = getCountryById(result.countryId);
      const state = country?.states.find(s => s.id === result.stateId);
      if (continent && country && state) {
        setSelectedContinent(continent);
        setSelectedCountry(country);
        setSelectedState(state);
        setSelectedCity(null);
        setCurrentLevel("state");
      }
    } else if (result.type === "city" && result.continentId && result.countryId && result.stateId && result.cityId) {
      const continent = getContinentById(result.continentId);
      const country = getCountryById(result.countryId);
      const state = country?.states.find(s => s.id === result.stateId);
      const city = state?.cities.find(c => c.id === result.cityId);
      if (continent && country && state && city) {
        setSelectedContinent(continent);
        setSelectedCountry(country);
        setSelectedState(state);
        setSelectedCity(city);
        setCurrentLevel("city");
      }
    } else if (result.type === "locality") {
      navigate(`/news?locality=${result.id}`);
    }
  }, [navigate]);

  // Detect location and auto-drill
  const handleDetectLocation = useCallback(() => {
    userLocation.refreshLocation();
    setHasAutoDrilled(false);
  }, [userLocation]);

  // Build breadcrumb items
  const breadcrumbItems = useMemo(() => {
    const items: BreadcrumbItem[] = [];
    if (selectedContinent) {
      items.push({ level: "continent", id: selectedContinent.id, name: selectedContinent.name });
    }
    if (selectedCountry) {
      items.push({ level: "country", id: selectedCountry.id, name: selectedCountry.name });
    }
    if (selectedState) {
      items.push({ level: "state", id: selectedState.id, name: selectedState.name });
    }
    if (selectedCity) {
      items.push({ level: "city", id: selectedCity.id, name: selectedCity.name });
    }
    return items;
  }, [selectedContinent, selectedCountry, selectedState, selectedCity]);

  // Get current items to display - show ALL continents including those with 0 countries
  const currentItems = useMemo(() => {
    if (currentLevel === "world") {
      // Show all 7 continents - Antarctica is included even with 0 countries
      return GEO_HIERARCHY;
    }
    if (currentLevel === "continent" && selectedContinent) {
      return selectedContinent.countries;
    }
    if (currentLevel === "country" && selectedCountry) {
      return selectedCountry.states;
    }
    if (currentLevel === "state" && selectedState) {
      return selectedState.cities;
    }
    if (currentLevel === "city" && selectedCity) {
      return selectedCity.localities;
    }
    return [];
  }, [currentLevel, selectedContinent, selectedCountry, selectedState, selectedCity]);

  // Get codes for stats
  const statsCodes = useMemo(() => {
    if (currentLevel === "world") {
      return GEO_HIERARCHY.filter(c => c.countries.length > 0).map(c => c.id);
    }
    if (currentLevel === "continent" && selectedContinent) {
      return selectedContinent.countries.map(c => c.code);
    }
    if (currentLevel === "country" && selectedCountry) {
      return selectedCountry.states.map(s => s.id);
    }
    return [];
  }, [currentLevel, selectedContinent, selectedCountry]);

  const { stats, isLoading, lastUpdated, refetch } = useLocationStats(
    currentLevel === "world" ? "world" : 
    currentLevel === "continent" ? "country" : 
    currentLevel,
    statsCodes
  );

  // Navigation handlers
  const handleDrillDown = useCallback((item: any) => {
    if (currentLevel === "world") {
      const continent = item as Continent;
      setSelectedContinent(continent);
      setCurrentLevel("continent");
    } else if (currentLevel === "continent") {
      const country = item as Country;
      setSelectedCountry(country);
      setCurrentLevel("country");
    } else if (currentLevel === "country") {
      const state = item as State;
      setSelectedState(state);
      setCurrentLevel("state");
    } else if (currentLevel === "state") {
      const city = item as City;
      setSelectedCity(city);
      setCurrentLevel("city");
    } else if (currentLevel === "city") {
      // Navigate to news with locality filter
      const locality = item as Locality;
      navigate(`/news?locality=${locality.id}`);
    }
  }, [currentLevel, navigate]);

  const handleBreadcrumbNavigate = useCallback((level: DrillLevel, id?: string) => {
    if (level === "world") {
      setSelectedContinent(null);
      setSelectedCountry(null);
      setSelectedState(null);
      setSelectedCity(null);
      setCurrentLevel("world");
    } else if (level === "continent") {
      setSelectedCountry(null);
      setSelectedState(null);
      setSelectedCity(null);
      setCurrentLevel("continent");
    } else if (level === "country") {
      setSelectedState(null);
      setSelectedCity(null);
      setCurrentLevel("country");
    } else if (level === "state") {
      setSelectedCity(null);
      setCurrentLevel("state");
    } else if (level === "city") {
      setCurrentLevel("city");
    }
  }, []);

  const handleViewNews = useCallback(() => {
    let params = new URLSearchParams();
    
    if (selectedContinent && !selectedCountry) {
      params.set("region", selectedContinent.id);
    } else if (selectedCountry) {
      params.set("country", selectedCountry.code);
    }
    if (selectedState) {
      params.set("state", selectedState.id);
    }
    if (selectedCity) {
      params.set("city", selectedCity.id);
    }
    
    navigate(`/news?${params.toString()}`);
  }, [selectedContinent, selectedCountry, selectedState, selectedCity, navigate]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  // Calculate totals
  const totalStories = useMemo(() => 
    Object.values(stats).reduce((sum, s) => sum + s.storyCount, 0),
  [stats]);

  const formatTime = (date: Date) => {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <main className="pt-14">
        {/* Page Header */}
        <section className="border-b border-border/50 bg-muted/20">
          <div className="container mx-auto max-w-6xl px-4 py-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Status Bar */}
              <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "gap-1 text-[10px]",
                      isConnected 
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                    )}
                  >
                    {isConnected ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
                    {isConnected ? "LIVE" : "POLLING"}
                  </Badge>
                  <button 
                    onClick={handleRefresh}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={cn("w-3 h-3", isRefreshing && "animate-spin")} />
                    {formatTime(lastUpdated)}
                  </button>
                  {userLocation.hasPermission && userLocation.country && (
                    <Badge variant="secondary" className="gap-1 text-[10px]">
                      <Navigation className="w-2.5 h-2.5" />
                      {userLocation.country.flag} {userLocation.country.name}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 h-8"
                    onClick={handleDetectLocation}
                    disabled={userLocation.isLoading}
                  >
                    {userLocation.isLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Navigation className="w-3.5 h-3.5" />
                    )}
                    My Location
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 h-8"
                    onClick={() => setShowSearch(!showSearch)}
                  >
                    <Search className="w-3.5 h-3.5" />
                    Search
                  </Button>
                </div>
              </div>

              {/* Search Bar */}
              <AnimatePresence>
                {showSearch && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4"
                  >
                    <LocationSearch
                      onSelect={handleSearchSelect}
                      onClose={() => setShowSearch(false)}
                      placeholder="Search countries, states, cities, localities..."
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Title */}
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-foreground mb-2">
                Global Intelligence
              </h1>
              <p className="text-muted-foreground text-sm max-w-2xl mb-4">
                Drill down from {geoStats.totalContinents} continents → {geoStats.totalCountries} countries → {geoStats.totalStates.toLocaleString()} states → {geoStats.totalCities.toLocaleString()} cities. Real-time news from verified sources.
              </p>

              {/* Breadcrumb Navigation */}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <DrillBreadcrumb 
                  items={breadcrumbItems} 
                  onNavigate={handleBreadcrumbNavigate} 
                />
                
                {currentLevel !== "world" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={handleViewNews}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    View {totalStories} Stories
                  </Button>
                )}
              </div>

              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-6 mt-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="font-medium">{totalStories.toLocaleString()}</span>
                  <span className="text-muted-foreground">stories</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="font-medium">{currentItems.length}</span>
                  <span className="text-muted-foreground">
                    {currentLevel === "world" ? "continents" : 
                     currentLevel === "continent" ? "countries" : 
                     currentLevel === "country" ? "states/regions" : 
                     currentLevel === "state" ? "cities" : "localities"}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Main Content with Live Ticker */}
        <section className="py-8">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Live Ticker Sidebar */}
              <div className="lg:col-span-1 order-2 lg:order-1">
                <div className="sticky top-20">
                  <Card className="border-border/50">
                    <CardContent className="p-4">
                      <LiveNewsTicker maxItems={6} />
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Location Grid */}
              <div className="lg:col-span-3 order-1 lg:order-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentLevel + (selectedContinent?.id || "") + (selectedCountry?.id || "")}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Back Button for non-world levels */}
                {currentLevel !== "world" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mb-4 gap-1.5"
                    onClick={() => {
                      if (currentLevel === "continent") handleBreadcrumbNavigate("world");
                      else if (currentLevel === "country") handleBreadcrumbNavigate("continent");
                      else if (currentLevel === "state") handleBreadcrumbNavigate("country");
                      else if (currentLevel === "city") handleBreadcrumbNavigate("state");
                    }}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Back
                  </Button>
                )}

                {isLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="h-36 bg-muted/50 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {currentItems.map((item: any, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        {currentLevel === "world" && (
                          <LocationCard
                            id={item.id}
                            name={item.name}
                            subtitle={`${item.countries?.length || 0} countries`}
                            icon={<Globe className="w-4 h-4 text-primary" />}
                            stats={stats[item.id]}
                            onClick={() => handleDrillDown(item)}
                          />
                        )}
                        {currentLevel === "continent" && (
                          <LocationCard
                            id={item.id}
                            name={item.name}
                            subtitle={`${item.states?.length || 0} regions`}
                            flag={item.flag}
                            stats={stats[item.code]}
                            onClick={() => handleDrillDown(item)}
                          />
                        )}
                        {currentLevel === "country" && (
                          <LocationCard
                            id={item.id}
                            name={item.name}
                            subtitle={`${item.cities?.length || 0} cities`}
                            icon={<MapPin className="w-3.5 h-3.5 text-muted-foreground" />}
                            stats={stats[item.id]}
                            onClick={() => handleDrillDown(item)}
                          />
                        )}
                        {currentLevel === "state" && (
                          <LocationCard
                            id={item.id}
                            name={item.name}
                            subtitle={`${item.localities?.length || 0} areas`}
                            icon={<Building2 className="w-3.5 h-3.5 text-muted-foreground" />}
                            isCapital={item.isCapital}
                            stats={stats[item.id]}
                            onClick={() => handleDrillDown(item)}
                          />
                        )}
                        {currentLevel === "city" && (
                          <LocationCard
                            id={item.id}
                            name={item.name}
                            type={item.type}
                            icon={<MapPin className="w-3 h-3 text-muted-foreground" />}
                            onClick={() => handleDrillDown(item)}
                          />
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Empty state */}
                {!isLoading && currentItems.length === 0 && (
                  <div className="text-center py-12">
                    <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium text-lg mb-2">No data available</h3>
                    <p className="text-sm text-muted-foreground">
                      No locations found at this level.
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Filters */}
        {currentLevel === "world" && (
          <section className="py-6 bg-muted/20 border-t border-border/50">
            <div className="container mx-auto max-w-6xl px-4">
              <h3 className="text-sm font-medium mb-3">Quick Access - Top Countries</h3>
              <div className="flex flex-wrap gap-2">
                {["IN", "US", "GB", "CN", "DE", "FR", "JP", "AU"].map(code => {
                  const country = GEO_HIERARCHY.flatMap(c => c.countries).find(c => c.code === code);
                  if (!country) return null;
                  return (
                    <Button
                      key={code}
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => {
                        const continent = GEO_HIERARCHY.find(c => c.countries.some(co => co.code === code));
                        if (continent) {
                          setSelectedContinent(continent);
                          setSelectedCountry(country);
                          setCurrentLevel("country");
                        }
                      }}
                    >
                      <span>{country.flag}</span>
                      {country.name}
                    </Button>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Methodology Note */}
        <section className="py-6">
          <div className="container mx-auto max-w-6xl px-4">
            <Card className="bg-muted/30 border-border/50">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Data Coverage:</span>
                  {' '}Stories are aggregated from 174 verified sources with real-time updates. 
                  Geographic classification is based on story origin and topic relevance. 
                  Drill down from continent → country → state → city → locality for granular news coverage.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
