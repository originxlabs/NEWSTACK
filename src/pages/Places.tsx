import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Search, Cloud, Wind, Thermometer, Star, Navigation, Plane, Hotel, Utensils, Loader2, X, ExternalLink, Sparkles, Map } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePlaces } from "@/hooks/use-places";
import { useDebounce } from "@/hooks/use-debounce";

const getAqiColor = (aqi: number | null) => {
  if (!aqi) return "text-muted-foreground";
  if (aqi <= 50) return "text-green-500";
  if (aqi <= 100) return "text-yellow-500";
  if (aqi <= 150) return "text-orange-500";
  return "text-red-500";
};

const Places = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showMapModal, setShowMapModal] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  const {
    searchPlaces,
    selectPlace,
    clearPlace,
    openInMaps,
    searchResults,
    placeData,
    isLoading,
    isSearching,
  } = usePlaces();

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  useEffect(() => {
    if (debouncedSearch) {
      searchPlaces(debouncedSearch);
    }
  }, [debouncedSearch, searchPlaces]);

  const handleSelectPlace = (placeId: string) => {
    selectPlace(placeId);
    setSearchQuery("");
  };

  const { place, weather, aqi, nearbyAttractions, nearbyRestaurants, nearbyHotels, airports, aiSummary } = placeData;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm mb-6">
              <MapPin className="h-4 w-4" />
              AI-Powered Place Intelligence
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Explore Places</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Weather, AQI, attractions, hotels, and AI insights for any destination
            </p>
          </motion.div>

          {/* Search */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="max-w-xl mx-auto mb-8 relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search any city or place..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-lg rounded-full"
              />
              {isSearching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin" />}
            </div>
            
            {/* Search Results Dropdown */}
            {searchResults.length > 0 && searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-50 max-h-80 overflow-auto">
                {searchResults.map((result) => (
                  <button
                    key={result.place_id}
                    onClick={() => handleSelectPlace(result.place_id)}
                    className="w-full px-4 py-3 text-left hover:bg-muted/50 flex items-center gap-3 border-b border-border last:border-0"
                  >
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium truncate">{result.name}</div>
                      <div className="text-sm text-muted-foreground truncate">{result.formatted_address}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading place data...</p>
            </div>
          )}

          {/* Place Details */}
          {place && !isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {/* Header Card */}
              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="relative h-64">
                  {place.photos?.[0] ? (
                    <img src={place.photos[0].url} alt={place.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <MapPin className="h-16 w-16 text-primary/50" />
                    </div>
                  )}
                  <Button variant="ghost" size="icon" className="absolute top-4 right-4 bg-background/80" onClick={clearPlace}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="font-display text-2xl font-bold">{place.name}</h2>
                      <p className="text-muted-foreground">{place.formatted_address}</p>
                    </div>
                    {place.rating && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                        {place.rating} ({place.user_ratings_total?.toLocaleString()})
                      </Badge>
                    )}
                  </div>
                  
                  {/* Weather & AQI */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {weather?.current && (
                      <>
                        <div className="text-center p-4 rounded-xl bg-muted/50">
                          <Thermometer className="h-5 w-5 mx-auto mb-2 text-primary" />
                          <div className="font-bold text-xl">{weather.current.temp}°C</div>
                          <div className="text-xs text-muted-foreground">{weather.current.condition}</div>
                        </div>
                        <div className="text-center p-4 rounded-xl bg-muted/50">
                          <Cloud className="h-5 w-5 mx-auto mb-2 text-primary" />
                          <div className="font-bold">{weather.current.humidity}%</div>
                          <div className="text-xs text-muted-foreground">Humidity</div>
                        </div>
                      </>
                    )}
                    <div className="text-center p-4 rounded-xl bg-muted/50">
                      <Wind className={`h-5 w-5 mx-auto mb-2 ${getAqiColor(aqi?.aqi ?? null)}`} />
                      <div className={`font-bold ${getAqiColor(aqi?.aqi ?? null)}`}>{aqi?.aqi ?? "N/A"}</div>
                      <div className="text-xs text-muted-foreground">{aqi?.category || "AQI"}</div>
                    </div>
                    {airports[0] && (
                      <div className="text-center p-4 rounded-xl bg-muted/50">
                        <Plane className="h-5 w-5 mx-auto mb-2 text-primary" />
                        <div className="font-bold text-sm truncate">{airports[0].name.split(" ").slice(0, 2).join(" ")}</div>
                        <div className="text-xs text-muted-foreground">{airports[0].distance_km} km</div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => setShowMapModal(true)}>
                      <Navigation className="h-4 w-4 mr-2" />
                      Open in Maps
                    </Button>
                    {place.website && (
                      <Button variant="outline" onClick={() => window.open(place.website, "_blank")}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Website
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* AI Summary */}
              {aiSummary && (
                <div className="glass-card rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h3 className="font-display font-semibold">AI Insights</h3>
                  </div>
                  <p className="text-lg mb-4">{aiSummary.hook}</p>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div><span className="font-medium">Best time:</span> {aiSummary.bestTime}</div>
                    <div><span className="font-medium">Ideal for:</span> {aiSummary.idealFor}</div>
                    <div><span className="font-medium">Consider avoiding if:</span> {aiSummary.avoidIf}</div>
                    <div><span className="font-medium">Insider tip:</span> {aiSummary.insiderTip}</div>
                  </div>
                </div>
              )}

              {/* Nearby Places */}
              {nearbyAttractions.length > 0 && (
                <div>
                  <h3 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" /> Top Attractions
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {nearbyAttractions.slice(0, 4).map((a) => (
                      <div key={a.place_id} className="glass-card rounded-xl overflow-hidden">
                        {a.photo_url ? (
                          <img src={a.photo_url} alt={a.name} className="w-full h-24 object-cover" />
                        ) : (
                          <div className="w-full h-24 bg-muted flex items-center justify-center">
                            <MapPin className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="p-3">
                          <div className="font-medium text-sm truncate">{a.name}</div>
                          {a.rating && <div className="text-xs text-muted-foreground flex items-center gap-1"><Star className="h-3 w-3" /> {a.rating}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hotels & Restaurants */}
              <div className="grid md:grid-cols-2 gap-6">
                {nearbyHotels.length > 0 && (
                  <div>
                    <h3 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
                      <Hotel className="h-5 w-5 text-primary" /> Nearby Hotels
                    </h3>
                    <div className="space-y-2">
                      {nearbyHotels.slice(0, 3).map((h) => (
                        <div key={h.place_id} className="glass-card rounded-lg p-3 flex items-center gap-3">
                          <Hotel className="h-4 w-4 text-primary shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm truncate">{h.name}</div>
                            <div className="text-xs text-muted-foreground truncate">{h.vicinity}</div>
                          </div>
                          {h.rating && <Badge variant="secondary" className="shrink-0">{h.rating}</Badge>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {nearbyRestaurants.length > 0 && (
                  <div>
                    <h3 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
                      <Utensils className="h-5 w-5 text-primary" /> Nearby Restaurants
                    </h3>
                    <div className="space-y-2">
                      {nearbyRestaurants.slice(0, 3).map((r) => (
                        <div key={r.place_id} className="glass-card rounded-lg p-3 flex items-center gap-3">
                          <Utensils className="h-4 w-4 text-primary shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm truncate">{r.name}</div>
                            <div className="text-xs text-muted-foreground truncate">{r.vicinity}</div>
                          </div>
                          {r.rating && <Badge variant="secondary" className="shrink-0">{r.rating}</Badge>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Empty State */}
          {!place && !isLoading && (
            <div className="text-center py-16">
              <Map className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Search for a city or place to get started</p>
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Maps Modal */}
      <Dialog open={showMapModal} onOpenChange={setShowMapModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Open in Maps</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <Button variant="outline" onClick={() => { openInMaps(place?.lat || 0, place?.lng || 0, "google"); setShowMapModal(false); }}>
              Google Maps
            </Button>
            <Button variant="outline" onClick={() => { openInMaps(place?.lat || 0, place?.lng || 0, "apple"); setShowMapModal(false); }}>
              Apple Maps
            </Button>
            <Button variant="outline" onClick={() => { openInMaps(place?.lat || 0, place?.lng || 0, "mapmyindia"); setShowMapModal(false); }}>
              MapmyIndia
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Places;
