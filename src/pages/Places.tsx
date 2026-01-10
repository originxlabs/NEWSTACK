import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Search, MessageCircle, Loader2, X } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePlaces } from "@/hooks/use-places";
import { useDebounce } from "@/hooks/use-debounce";
import { PlaceHero } from "@/components/places/PlaceHero";
import { LiveStatusStrip } from "@/components/places/LiveStatusStrip";
import { AIPlaceInsight } from "@/components/places/AIPlaceInsight";
import { BestPlacesGrid } from "@/components/places/BestPlacesGrid";
import { NearbyEssentials } from "@/components/places/NearbyEssentials";
import { MapRoutes } from "@/components/places/MapRoutes";
import { PlaceChat } from "@/components/places/PlaceChat";
import { PlaceSkeleton } from "@/components/places/PlaceSkeleton";
import { WhatsHappening } from "@/components/places/WhatsHappening";

const Places = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
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
    const selectedResult = searchResults.find(r => r.place_id === placeId);
    selectPlace(placeId, selectedResult);
    setSearchQuery("");
  };

  const { place } = placeData;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      {/* Search Header */}
      {!place && (
        <div className="pt-24 pb-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm mb-6">
                <MapPin className="h-4 w-4" />
                AI-Powered Place Intelligence
              </div>
              <h1 className="font-display text-4xl md:text-6xl font-bold mb-4">
                Explore the <span className="gradient-text">World</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Real-time weather, air quality, local news, and AI insights for any destination
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="max-w-xl mx-auto relative">
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
          </div>
        </div>
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
          >
            {/* Hero */}
            <PlaceHero placeData={placeData} />

            {/* Main Content */}
            <div className="container mx-auto max-w-6xl px-4 py-8">
              {/* Back Button */}
              <Button variant="ghost" onClick={clearPlace} className="mb-6">
                <X className="h-4 w-4 mr-2" />
                Search another place
              </Button>

              {/* Live Status Strip */}
              <LiveStatusStrip placeData={placeData} isLoading={isLoading} />

              {/* Two Column Layout */}
              <div className="grid lg:grid-cols-3 gap-8 mt-8">
                {/* Main Column */}
                <div className="lg:col-span-2 space-y-8">
                  {/* AI Insight */}
                  <AIPlaceInsight placeData={placeData} />

                  {/* What's Happening */}
                  <WhatsHappening placeData={placeData} />
                  
                  {/* Best Places Grid */}
                  <BestPlacesGrid placeData={placeData} isLoading={isLoading} />
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Map */}
                  <MapRoutes placeData={placeData} onOpenInMaps={openInMaps} />
                  
                  {/* Nearby Essentials */}
                  <NearbyEssentials
                    placeData={placeData}
                    isLoading={isLoading}
                    onOpenInMaps={(lat, lng) => openInMaps(lat, lng, "google")}
                  />
                </div>
              </div>
            </div>

            {/* Ask This Place FAB */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="fixed bottom-6 right-6 z-40"
            >
              <Button
                size="lg"
                className="rounded-full shadow-lg h-14 px-6 glow-accent"
                onClick={() => setIsChatOpen(true)}
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Ask about this place
              </Button>
            </motion.div>

            {/* Chat Sidebar */}
            <PlaceChat
              isOpen={isChatOpen}
              onClose={() => setIsChatOpen(false)}
              placeData={placeData}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {!place && <Footer />}
    </div>
  );
};

export default Places;
