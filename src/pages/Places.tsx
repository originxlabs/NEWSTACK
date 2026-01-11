import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Search, MessageCircle, Loader2, X, Radio, Shield } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { usePlaces } from "@/hooks/use-places";
import { useDebounce } from "@/hooks/use-debounce";
import { PlaceHero } from "@/components/places/PlaceHero";
import { LiveStatusStrip } from "@/components/places/LiveStatusStrip";
import { AIPlaceInsight } from "@/components/places/AIPlaceInsight";
import { BestPlacesGrid } from "@/components/places/BestPlacesGrid";
import { NearbyEssentials } from "@/components/places/NearbyEssentials";
import { PlaceChat } from "@/components/places/PlaceChat";
import { PlaceSkeleton } from "@/components/places/PlaceSkeleton";
import { WhatsHappening } from "@/components/places/WhatsHappening";
import { FeaturedCities, type FeaturedCity } from "@/components/places/FeaturedCities";
import { InteractiveMap } from "@/components/places/InteractiveMap";
import { LocalImpactSummary, SourceTrustPanel } from "@/components/intelligence";
import { useSearchParams } from "react-router-dom";

const Places = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [hasInitialSearch, setHasInitialSearch] = useState(!!initialSearch);
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

  // Mock data for intelligence components when place is selected
  const localNewsItems = place ? [
    { headline: `Local governance updates in ${place.name}`, category: "governance" },
    { headline: `Infrastructure development projects announced`, category: "infrastructure" },
    { headline: `Economic outlook and job market trends`, category: "economy" },
  ] : [];

  // Mock sources for SourceTrustPanel (using correct interface)
  const localSources = place ? [
    { source_name: "Local News", source_url: "#", published_at: new Date().toISOString(), description: "Local reporting" },
    { source_name: "Regional Times", source_url: "#", published_at: new Date().toISOString(), description: "Regional coverage" },
  ] : [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      {/* Search Header */}
      {!place && (
        <main className="pt-14">
          <section className="border-b border-border/50 bg-muted/20">
            <div className="container mx-auto max-w-6xl px-4 py-8">
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
                  Real-time weather, air quality, local news, and AI insights for any destination.
                </p>
              </motion.div>
            </div>
          </section>

          <section className="py-8">
            <div className="container mx-auto max-w-6xl px-4">
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
        <div className="container mx-auto max-w-6xl px-4 pb-16">
          <PlaceSkeleton type="hero" />
        </div>
      )}

      {/* Place Content */}
      <AnimatePresence mode="wait">
        {place && (
          <motion.div 
            key={place.place_id} 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="pt-14"
          >
            <PlaceHero placeData={placeData} />

            <div className="container mx-auto max-w-6xl px-4 py-8">
              <Button variant="ghost" onClick={clearPlace} className="mb-6 h-8 text-sm">
                <X className="h-3.5 w-3.5 mr-2" />
                Search another place
              </Button>

              <LiveStatusStrip placeData={placeData} isLoading={isLoading} />

              {/* Local Impact Summary - Intelligence Layer */}
              <div className="mt-6">
                <LocalImpactSummary 
                  placeName={place.name || "this area"} 
                  newsItems={localNewsItems}
                />
              </div>

              <div className="grid lg:grid-cols-3 gap-8 mt-8">
                <div className="lg:col-span-2 space-y-6">
                  <AIPlaceInsight placeData={placeData} />
                  <WhatsHappening placeData={placeData} />
                  <BestPlacesGrid placeData={placeData} isLoading={isLoading} />
                </div>

                <div className="space-y-6">
                  {/* Source Trust Panel - Intelligence Layer */}
                  <SourceTrustPanel sources={localSources} />
                  <InteractiveMap placeData={placeData} />
                  <NearbyEssentials 
                    placeData={placeData} 
                    isLoading={isLoading} 
                    onOpenInMaps={(lat, lng) => openInMaps(lat, lng, "google")} 
                  />
                </div>
              </div>
            </div>

            <motion.div 
              initial={{ scale: 0, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              transition={{ delay: 0.5 }} 
              className="fixed bottom-6 right-6 z-40"
            >
              <Button 
                size="sm" 
                className="rounded-full shadow-lg h-10 px-4 gap-2" 
                onClick={() => setIsChatOpen(true)}
              >
                <MessageCircle className="h-4 w-4" />
                Ask about this place
              </Button>
            </motion.div>

            <PlaceChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} placeData={placeData} />
          </motion.div>
        )}
      </AnimatePresence>

      {!place && <Footer />}
    </div>
  );
};

export default Places;
