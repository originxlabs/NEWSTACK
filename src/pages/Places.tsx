import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Search, Loader2, X, Thermometer, Wind, Droplets, Calendar, Users, Clock, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
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

// ===== INTELLIGENCE-DRIVEN PLACE BRIEF =====
// This is a LOCAL INTELLIGENCE BRIEF, not a travel or map application
// Design hierarchy: TEXT FIRST, INTELLIGENCE BEFORE MAPS

interface PlaceIntelligenceProps {
  placeData: PlaceData;
}

// Quick Facts Strip - Temperature, Weather, AQI, Best Season
function QuickFactsStrip({ placeData }: PlaceIntelligenceProps) {
  const { weather, aqi, aiSummary } = placeData;
  
  return (
    <div className="flex flex-wrap gap-4 py-4 border-b border-border/50">
      {weather?.current && (
        <div className="flex items-center gap-2 text-sm">
          <Thermometer className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{Math.round(weather.current.temp)}°C</span>
          <span className="text-muted-foreground">{weather.current.condition}</span>
        </div>
      )}
      {weather?.current?.humidity && (
        <div className="flex items-center gap-2 text-sm">
          <Droplets className="w-4 h-4 text-muted-foreground" />
          <span>{weather.current.humidity}% humidity</span>
        </div>
      )}
      {weather?.current?.wind_speed && (
        <div className="flex items-center gap-2 text-sm">
          <Wind className="w-4 h-4 text-muted-foreground" />
          <span>{Math.round(weather.current.wind_speed)} km/h</span>
        </div>
      )}
      {aqi?.aqi && (
        <div className="flex items-center gap-2 text-sm">
          <div 
            className={cn(
              "w-2 h-2 rounded-full",
              aqi.aqi <= 50 ? "bg-emerald-500" :
              aqi.aqi <= 100 ? "bg-yellow-500" :
              aqi.aqi <= 150 ? "bg-orange-500" : "bg-red-500"
            )}
          />
          <span>AQI {aqi.aqi}</span>
          <span className="text-muted-foreground text-xs">({aqi.category})</span>
        </div>
      )}
      {aiSummary?.bestTime && (
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">Best time:</span>
          <span>{aiSummary.bestTime}</span>
        </div>
      )}
    </div>
  );
}

// Place Intelligence Summary - Factual, neutral, informative
function PlaceIntelligenceSummary({ placeData }: PlaceIntelligenceProps) {
  const { place, aiSummary, weather, aqi } = placeData;
  
  if (!place) return null;
  
  // Generate context based on available data
  const contextLines: string[] = [];
  
  if (place.country) {
    contextLines.push(`${place.name} is located in ${place.country}.`);
  }
  
  // Current conditions context
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
    <Card className="border-border/50">
      <CardContent className="p-6">
        <h2 className="font-medium text-base mb-4">Place Intelligence Summary</h2>
        
        <div className="space-y-4">
          {/* Context */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Context</h3>
            <p className="text-sm text-foreground leading-relaxed">
              {contextLines.join(" ") || `${place.name} is a destination worth exploring.`}
            </p>
          </div>
          
          {/* Best Time to Visit */}
          {aiSummary?.bestTime && (
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Best Time to Visit</h3>
              <p className="text-sm text-foreground">{aiSummary.bestTime}</p>
            </div>
          )}
          
          {/* Who This Place Is For */}
          {aiSummary?.idealFor && (
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Ideal For</h3>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm text-foreground">{aiSummary.idealFor}</p>
              </div>
            </div>
          )}
          
          {/* Considerations */}
          {aiSummary?.avoidIf && (
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Consider Avoiding If</h3>
              <p className="text-sm text-muted-foreground">{aiSummary.avoidIf}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Nearby Essentials - Collapsed by default, load on demand
function NearbyEssentialsCollapsed({ placeData }: PlaceIntelligenceProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  
  const categories = [
    { id: "hotels", label: "Hotels", data: placeData.nearbyHotels },
    { id: "restaurants", label: "Restaurants", data: placeData.nearbyRestaurants },
    { id: "attractions", label: "Attractions", data: placeData.nearbyAttractions },
  ];
  
  return (
    <Card className="border-border/50">
      <CardContent className="p-6">
        <h2 className="font-medium text-base mb-4">Nearby Essentials</h2>
        <p className="text-xs text-muted-foreground mb-4">Click a category to view options</p>
        
        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.id}>
              <button
                onClick={() => setExpanded(expanded === cat.id ? null : cat.id)}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <span className="text-sm font-medium">{cat.label}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {cat.data.length} nearby
                  </Badge>
                  {expanded === cat.id ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
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
                    <div className="pt-2 space-y-2 max-h-60 overflow-y-auto">
                      {cat.data.slice(0, 5).map((item, idx) => (
                        <div 
                          key={idx} 
                          className="flex items-center justify-between p-2 rounded bg-background border border-border/50"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{item.vicinity}</p>
                          </div>
                          {item.distance_km && (
                            <span className="text-xs text-muted-foreground ml-2">
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

// Main Places Page
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
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  }, []);

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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      {/* Search Header - No place selected */}
      {!place && (
        <main className="pt-14">
          <section className="border-b border-border/50 bg-muted/20">
            <div className="container mx-auto max-w-5xl px-4 py-8">
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline" className="gap-1 bg-primary/5 text-primary border-primary/20">
                    <MapPin className="w-2.5 h-2.5" />
                    Places
                  </Badge>
                </div>

                <h1 className="font-display text-2xl sm:text-3xl font-semibold text-foreground mb-2">
                  Local Intelligence
                </h1>
                <p className="text-muted-foreground max-w-2xl text-sm">
                  Understand any place: what it is, why it matters, and what's happening there now.
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
          <div className="h-32 bg-muted/50 rounded-lg animate-pulse" />
        </div>
      )}

      {/* Place Content - Intelligence-Driven Brief */}
      <AnimatePresence mode="wait">
        {place && (
          <motion.div 
            key={place.place_id} 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="pt-14"
          >
            {/* Place Header - TEXT FIRST */}
            <section className="border-b border-border/50 bg-muted/20">
              <div className="container mx-auto max-w-5xl px-4 py-6">
                <Button variant="ghost" onClick={clearPlace} className="mb-4 h-8 text-sm -ml-2">
                  <X className="h-3.5 w-3.5 mr-2" />
                  Search another place
                </Button>
                
                <div className="flex items-start gap-2 mb-2">
                  <Badge variant="outline" className="gap-1 text-xs">
                    <MapPin className="w-2.5 h-2.5" />
                    Place Brief
                  </Badge>
                  {placeData.dataFreshness?.weather && (
                    <Badge variant="outline" className="gap-1 text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                      <Clock className="w-2.5 h-2.5" />
                      Live data
                    </Badge>
                  )}
                </div>
                
                <h1 className="font-display text-2xl sm:text-3xl font-semibold text-foreground">
                  {place.name}
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  {place.country ? `${place.state ? `${place.state}, ` : ""}${place.country}` : place.formatted_address}
                </p>
                
                {/* Quick Facts Strip */}
                <QuickFactsStrip placeData={placeData} />
              </div>
            </section>

            {/* Main Content Grid */}
            <div className="container mx-auto max-w-5xl px-4 py-8">
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Column - Intelligence */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Place Intelligence Summary */}
                  <PlaceIntelligenceSummary placeData={placeData} />
                  
                  {/* Local News - Last 30 days, clustered */}
                  <WhatsHappening placeData={placeData} />
                </div>

                {/* Sidebar - Essentials (Collapsed) */}
                <div className="space-y-6">
                  <NearbyEssentialsCollapsed placeData={placeData} />
                  
                  {/* Map - Optional, utility-focused */}
                  {place.lat && place.lng && (
                    <Card className="border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-medium">Location</h3>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 text-xs"
                            onClick={() => window.open(`https://www.google.com/maps?q=${place.lat},${place.lng}`, "_blank")}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Open in Maps
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Coordinates: {place.lat.toFixed(4)}, {place.lng.toFixed(4)}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!place && <Footer />}
    </div>
  );
};

export default Places;
