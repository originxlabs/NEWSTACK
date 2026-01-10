import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Cloud, Wind, Thermometer, ChevronRight, Search, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

const featuredPlaces = [
  {
    name: "Tokyo",
    country: "Japan",
    weather: "22°C",
    aqi: 45,
    aqiLabel: "Good",
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop",
    newsCount: 24,
  },
  {
    name: "New York",
    country: "USA",
    weather: "18°C",
    aqi: 67,
    aqiLabel: "Moderate",
    image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=300&fit=crop",
    newsCount: 156,
  },
  {
    name: "London",
    country: "UK",
    weather: "14°C",
    aqi: 52,
    aqiLabel: "Moderate",
    image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=300&fit=crop",
    newsCount: 89,
  },
  {
    name: "Dubai",
    country: "UAE",
    weather: "35°C",
    aqi: 78,
    aqiLabel: "Moderate",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=300&fit=crop",
    newsCount: 42,
  },
];

export function PlacesSection() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearching(true);
      // Navigate to places page with search query
      navigate(`/places?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handlePlaceClick = (placeName: string) => {
    navigate(`/places?search=${encodeURIComponent(placeName)}`);
  };

  const handleExploreAll = () => {
    navigate("/places");
  };

  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Explore Places
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Discover local news, weather, and intelligence from any location in the world
          </p>

          {/* Search */}
          <form onSubmit={handleSearch} className="max-w-md mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search any city or country..."
              className="pl-12 pr-12 h-12 rounded-xl glass-card border-border/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button 
              type="submit"
              size="icon"
              variant="ghost"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
              disabled={isSearching || !searchQuery.trim()}
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
          </form>
        </motion.div>

        {/* Featured places grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredPlaces.map((place, index) => (
            <motion.div
              key={place.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                variant="interactive" 
                className="overflow-hidden cursor-pointer group"
                onClick={() => handlePlaceClick(place.name)}
              >
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={place.image}
                    alt={place.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <h3 className="font-display font-bold text-lg">{place.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {place.country}
                    </p>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Thermometer className="w-4 h-4 text-primary" />
                      <span>{place.weather}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Wind className="w-4 h-4 text-success" />
                      <span>AQI {place.aqi}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {place.newsCount} stories today
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="gap-1 h-8 text-xs group-hover:text-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlaceClick(place.name);
                      }}
                    >
                      Explore
                      <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* View all button */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-8"
        >
          <Button 
            variant="heroOutline" 
            size="lg"
            onClick={handleExploreAll}
          >
            <MapPin className="w-4 h-4 mr-2" />
            Explore All Places
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
