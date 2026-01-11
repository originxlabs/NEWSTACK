import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Search, Loader2, X, Thermometer, Wind, Droplets, Calendar, Users, Clock, ChevronDown, ChevronUp, ExternalLink, Radio, Activity, AlertTriangle } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { usePlaces, PlaceData } from "@/hooks/use-places";
import { useDebounce } from "@/hooks/use-debounce";
import { FeaturedCities, type FeaturedCity } from "@/components/places/FeaturedCities";
import { WhatsHappening } from "@/components/places/WhatsHappening";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";

// ===== PLACES = MICRO INTELLIGENCE (ZOOMED-IN WORLD) =====
// Visual system ALIGNED with World page:
// - Same dark/analytical theme
// - Same typography scale
// - Same confidence colors (Stable/Active/Hotspot)
// - Same component patterns

// Status colors (matching World page exactly)
const statusStyles = {
  stable: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/20",
    label: "Stable",
  },
  active: {
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/20",
    label: "Active",
  },
  hotspot: {
    bg: "bg-red-500/10",
    text: "text-red-600 dark:text-red-400",
    border: "border-red-500/20",
    label: "Hotspot",
  },
};

interface PlaceIntelligenceProps {
  placeData: PlaceData;
}

// Determine activity status based on conditions
function getActivityStatus(placeData: PlaceData): "stable" | "active" | "hotspot" {
  const { aqi, weather } = placeData;
  
  // Check for concerning conditions
  if (aqi?.aqi && aqi.aqi > 150) return "hotspot"; // Poor air quality
  if (weather?.current?.temp && (weather.current.temp > 40 || weather.current.temp < -10)) return "hotspot";
  
  // Check for notable conditions
  if (aqi?.aqi && aqi.aqi > 100) return "active";
  if (weather?.current?.temp && (weather.current.temp > 35 || weather.current.temp < 0)) return "active";
  
  return "stable";
}

// Quick Facts Strip - Matches World page stat row
function QuickFactsStrip({ placeData }: PlaceIntelligenceProps) {
  const { weather, aqi, aiSummary } = placeData;
  const status = getActivityStatus(placeData);
  const style = statusStyles[status];
  
  return (
    <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-6 text-xs sm:text-sm">
      {weather?.current && (
        <div className="flex items-center gap-1.5">
          <Thermometer className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="font-medium">{Math.round(weather.current.temp)}°C</span>
          <span className="text-muted-foreground">{weather.current.condition}</span>
        </div>
      )}
      {weather?.current?.humidity && (
        <div className="flex items-center gap-1.5">
          <Droplets className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="font-medium">{weather.current.humidity}%</span>
          <span className="text-muted-foreground">humidity</span>
        </div>
      )}
      {weather?.current?.wind_speed && (
        <div className="flex items-center gap-1.5">
          <Wind className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="font-medium">{Math.round(weather.current.wind_speed)}</span>
          <span className="text-muted-foreground">km/h</span>
        </div>
      )}
      {aqi?.aqi && (
        <div className="flex items-center gap-1.5">
          <div 
            className={cn(
              "w-2 h-2 rounded-full",
              aqi.aqi <= 50 ? "bg-emerald-500" :
              aqi.aqi <= 100 ? "bg-yellow-500" :
              aqi.aqi <= 150 ? "bg-orange-500" : "bg-red-500"
            )}
          />
          <span className="font-medium">AQI {aqi.aqi}</span>
          <span className="text-muted-foreground">{aqi.category}</span>
        </div>
      )}
      {aiSummary?.bestTime && (
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Best time:</span>
          <span className="font-medium">{aiSummary.bestTime}</span>
        </div>
      )}
    </div>
  );
}

// Place Intelligence Summary Card - Matches World RegionCard style
function PlaceIntelligenceSummary({ placeData }: PlaceIntelligenceProps) {
  const { place, aiSummary, weather, aqi } = placeData;
  const status = getActivityStatus(placeData);
  const style = statusStyles[status];
  
  if (!place) return null;
  
  // Generate context based on available data
  const contextLines: string[] = [];
  
  if (place.country) {
    contextLines.push(`${place.name} is located in ${place.country}.`);
  }
  
  if (weather?.current) {
    const temp = Math.round(weather.current.temp);
    const condition = weather.current.condition.toLowerCase();
    contextLines.push(`Current conditions: ${temp}°C with ${condition}.`);
  }
  
  if (aqi?.aqi) {
    const aqiLevel = aqi.aqi <= 50 ? "good" : aqi.aqi <= 100 ? "moderate" : "poor";
    contextLines.push(`Air quality is ${aqiLevel} (AQI ${aqi.aqi}).`);
  }

  return (
    <Card className={cn("border-border/50 transition-all", style.border, status === "hotspot" && "ring-1 ring-red-500/20")}>
      <CardContent className="p-6">
        {/* Header with status badge - matches RegionCard */}
        <div className="flex items-start justify-between mb-4">
          <h2 className="font-medium text-base">Place Intelligence Summary</h2>
          <Badge 
            variant="outline" 
            className={cn("text-[10px] font-medium", style.bg, style.text, style.border)}
          >
            {status === "hotspot" && <AlertTriangle className="h-2.5 w-2.5 mr-1" />}
            {style.label}
          </Badge>
        </div>
        
        <div className="space-y-4">
          {/* Context */}
          <div>
            <h3 className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5">Context</h3>
            <p className="text-sm text-foreground leading-relaxed">
              {contextLines.join(" ") || `${place.name} is a destination worth exploring.`}
            </p>
          </div>
          
          {/* Best Time to Visit */}
          {aiSummary?.bestTime && (
            <div>
              <h3 className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5">Best Time to Visit</h3>
              <p className="text-sm text-foreground">{aiSummary.bestTime}</p>
            </div>
          )}
          
          {/* Who This Place Is For */}
          {aiSummary?.idealFor && (
            <div>
              <h3 className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5">Relevant For</h3>
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-sm text-foreground">{aiSummary.idealFor}</p>
              </div>
            </div>
          )}
          
          {/* Considerations */}
          {aiSummary?.avoidIf && (
            <div>
              <h3 className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5">Considerations</h3>
              <p className="text-xs text-muted-foreground">{aiSummary.avoidIf}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Nearby Essentials - Collapsed by default (lazy load)
function NearbyEssentialsCollapsed({ placeData }: PlaceIntelligenceProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  
  const categories = [
    { id: "hotels", label: "Hotels", data: placeData.nearbyHotels },
    { id: "restaurants", label: "Restaurants", data: placeData.nearbyRestaurants },
    { id: "attractions", label: "Attractions", data: placeData.nearbyAttractions },
  ];
  
  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <h2 className="font-medium text-sm mb-3">Nearby Essentials</h2>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-3">Click to expand</p>
        
        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.id}>
              <button
                onClick={() => setExpanded(expanded === cat.id ? null : cat.id)}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <span className="text-xs font-medium">{cat.label}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px] h-5">
                    {cat.data.length}
                  </Badge>
                  {expanded === cat.id ? (
                    <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </div>
              </button>
              
              <AnimatePresence>
                {expanded === cat.id && cat.data.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-2 space-y-1.5 max-h-48 overflow-y-auto">
                      {cat.data.slice(0, 5).map((item, idx) => (
                        <div 
                          key={idx} 
                          className="flex items-center justify-between p-2 rounded bg-background border border-border/30 text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{item.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{item.vicinity}</p>
                          </div>
                          {item.distance_km && (
                            <span className="text-[10px] text-muted-foreground ml-2 shrink-0">
                              {item.distance_km.toFixed(1)} km
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Main Places Page - ALIGNED WITH WORLD PAGE
const Places = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [hasInitialSearch, setHasInitialSearch] = useState(!!initialSearch);
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  const {
    searchPlaces,
    selectPlace,
    clearPlace,
    searchResults,
    placeData,
    isLoading,
    isSearching,
  } = usePlaces();

  useEffect(() => {
    if (hasInitialSearch && initialSearch) {
      searchPlaces(initialSearch);
      setHasInitialSearch(false);
    }
  }, [hasInitialSearch, initialSearch, searchPlaces]);

  useEffect(() => {
    if (debouncedSearch && !hasInitialSearch) {
      searchPlaces(debouncedSearch);
    }
  }, [debouncedSearch, searchPlaces, hasInitialSearch]);

  useEffect(() => {
    if (searchResults.length > 0 && initialSearch && !placeData.place) {
      const firstResult = searchResults[0];
      if (firstResult) {
        selectPlace(firstResult.place_id, firstResult);
        setSearchParams({});
      }
    }
  }, [searchResults, initialSearch, placeData.place, selectPlace, setSearchParams]);

  const handleSelectPlace = (placeId: string) => {
    const selectedResult = searchResults.find(r => r.place_id === placeId);
    selectPlace(placeId, selectedResult);
    setSearchQuery("");
  };

  const handleSelectCity = (city: FeaturedCity) => {
    selectPlace(city.name, {
      place_id: city.name,
      name: city.name,
      lat: city.lat,
      lng: city.lng,
      country: city.country,
      country_code: city.countryCode,
      formatted_address: `${city.name}, ${city.country}`,
    });
  };

  const { place } = placeData;
  const status = place ? getActivityStatus(placeData) : "stable";
  const style = statusStyles[status];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      {/* Search Header - No place selected */}
      {!place && (
        <main className="pt-14">
          {/* Header section - matches World page exactly */}
          <section className="border-b border-border/50 bg-muted/20">
            <div className="container mx-auto max-w-5xl px-4 py-8">
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline" className="gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                    <Radio className="w-2.5 h-2.5" />
                    LIVE
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Real-time conditions
                  </span>
                </div>

                <h1 className="font-display text-2xl sm:text-3xl font-semibold text-foreground mb-2">
                  Local Intelligence
                </h1>
                <p className="text-muted-foreground max-w-2xl text-sm">
                  Understand any place: what it is, current conditions, and recent developments.
                </p>
              </motion.div>
            </div>
          </section>

          <section className="py-8">
            <div className="container mx-auto max-w-5xl px-4">
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.1 }} 
                className="max-w-xl mx-auto relative mb-12"
              >
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search any city or place..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-11 h-12 text-sm rounded-xl border-border/60 bg-card"
                  />
                  {isSearching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
                </div>
                
                {searchResults.length > 0 && searchQuery && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-50 max-h-80 overflow-auto">
                    {searchResults.map((result) => (
                      <button
                        key={result.place_id}
                        onClick={() => handleSelectPlace(result.place_id)}
                        className="w-full px-4 py-3 text-left hover:bg-muted/50 flex items-center gap-3 border-b border-border/50 last:border-0 transition-colors"
                      >
                        <MapPin className="h-4 w-4 text-primary shrink-0" />
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">{result.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{result.formatted_address}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>

              <FeaturedCities onSelectCity={handleSelectCity} />
            </div>
          </section>
        </main>
      )}

      {/* Loading State */}
      {isLoading && !place && (
        <div className="container mx-auto max-w-5xl px-4 pb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      )}

      {/* Place Content - Intelligence-Driven Brief (aligned with World) */}
      <AnimatePresence mode="wait">
        {place && (
          <motion.div 
            key={place.place_id} 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="pt-14"
          >
            {/* Place Header - matches World page header exactly */}
            <section className="border-b border-border/50 bg-muted/20">
              <div className="container mx-auto max-w-5xl px-4 py-8">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Button variant="ghost" onClick={clearPlace} className="mb-4 h-8 text-sm -ml-2">
                    <X className="h-3.5 w-3.5 mr-2" />
                    Search another place
                  </Button>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="outline" className="gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                      <Radio className="w-2.5 h-2.5" />
                      LIVE
                    </Badge>
                    {placeData.dataFreshness?.weather && (
                      <span className="text-xs text-muted-foreground">
                        Updated just now
                      </span>
                    )}
                  </div>

                  <h1 className="font-display text-2xl sm:text-3xl font-semibold text-foreground mb-2">
                    {place.name}
                  </h1>
                  <p className="text-muted-foreground max-w-2xl text-sm">
                    {place.country ? `${place.state ? `${place.state}, ` : ""}${place.country}` : place.formatted_address}
                  </p>

                  {/* Quick Facts - matches World stats row */}
                  <QuickFactsStrip placeData={placeData} />
                </motion.div>
              </div>
            </section>

            {/* ===== MAIN CONTENT GRID ===== */}
            <section className="py-8">
              <div className="container mx-auto max-w-5xl px-4">
                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Main Column - Intelligence (2 cols) */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Place Intelligence Summary */}
                    <PlaceIntelligenceSummary placeData={placeData} />
                    
                    {/* Local News - Recent Developments */}
                    <WhatsHappening placeData={placeData} />
                  </div>

                  {/* Sidebar - Essentials (1 col) */}
                  <div className="space-y-4">
                    {/* Nearby Essentials - Collapsed */}
                    <NearbyEssentialsCollapsed placeData={placeData} />
                    
                    {/* Map - Minimal, utility only */}
                    {place.lat && place.lng && (
                      <Card className="border-border/50">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Location</h3>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 text-[10px] px-2"
                              onClick={() => window.open(`https://www.google.com/maps?q=${place.lat},${place.lng}`, "_blank")}
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Open Map
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {place.lat.toFixed(4)}, {place.lng.toFixed(4)}
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Methodology Note - matches World */}
                    <Card className="bg-muted/30 border-border/50">
                      <CardContent className="p-4">
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                          <span className="font-medium text-foreground">Methodology:</span>
                          {' '}Conditions are fetched in real-time from verified weather and air quality APIs. 
                          Local news reflects reporting from the last 30 days. Intelligence summary is 
                          AI-generated based on current data.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      {!place && <Footer />}
    </div>
  );
};

export default Places;
