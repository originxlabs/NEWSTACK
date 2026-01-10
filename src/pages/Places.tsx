import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Search, Cloud, Wind, Thermometer, Newspaper, Star, Navigation, Plane, Hotel, Utensils } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { usePreferences } from "@/contexts/PreferencesContext";

interface Place {
  id: string;
  name: string;
  country: string;
  flag: string;
  image: string;
  weather: { temp: number; condition: string };
  aqi: number;
  newsCount: number;
  rating: number;
}

const popularPlaces: Place[] = [
  {
    id: "new-york",
    name: "New York",
    country: "USA",
    flag: "🇺🇸",
    image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=300&fit=crop",
    weather: { temp: 18, condition: "Sunny" },
    aqi: 42,
    newsCount: 156,
    rating: 4.8,
  },
  {
    id: "london",
    name: "London",
    country: "UK",
    flag: "🇬🇧",
    image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=300&fit=crop",
    weather: { temp: 12, condition: "Cloudy" },
    aqi: 38,
    newsCount: 134,
    rating: 4.7,
  },
  {
    id: "tokyo",
    name: "Tokyo",
    country: "Japan",
    flag: "🇯🇵",
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop",
    weather: { temp: 22, condition: "Clear" },
    aqi: 55,
    newsCount: 198,
    rating: 4.9,
  },
  {
    id: "mumbai",
    name: "Mumbai",
    country: "India",
    flag: "🇮🇳",
    image: "https://images.unsplash.com/photo-1566552881560-0be862a7c445?w=400&h=300&fit=crop",
    weather: { temp: 32, condition: "Humid" },
    aqi: 145,
    newsCount: 87,
    rating: 4.5,
  },
  {
    id: "dubai",
    name: "Dubai",
    country: "UAE",
    flag: "🇦🇪",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=300&fit=crop",
    weather: { temp: 38, condition: "Hot" },
    aqi: 89,
    newsCount: 65,
    rating: 4.6,
  },
  {
    id: "paris",
    name: "Paris",
    country: "France",
    flag: "🇫🇷",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=300&fit=crop",
    weather: { temp: 15, condition: "Partly Cloudy" },
    aqi: 35,
    newsCount: 112,
    rating: 4.8,
  },
];

const getAqiColor = (aqi: number) => {
  if (aqi <= 50) return "text-success";
  if (aqi <= 100) return "text-warning";
  return "text-destructive";
};

const getAqiLabel = (aqi: number) => {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  return "Unhealthy";
};

const Places = () => {
  const { country } = usePreferences();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const filteredPlaces = popularPlaces.filter(
    (place) =>
      place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm mb-6">
              <MapPin className="h-4 w-4" />
              Google Maps + AI + News
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Explore Places
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Weather, AQI, local news, events, and best places to visit.
              {country && ` You're viewing from ${country.flag_emoji} ${country.name}`}
            </p>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-xl mx-auto mb-12"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search any city or country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-lg rounded-full"
              />
            </div>
          </motion.div>

          {/* Selected Place Detail */}
          {selectedPlace && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl overflow-hidden mb-12"
            >
              <div className="grid md:grid-cols-2 gap-6">
                <img
                  src={selectedPlace.image}
                  alt={selectedPlace.name}
                  className="w-full h-64 md:h-full object-cover"
                />
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">{selectedPlace.flag}</span>
                    <h2 className="font-display text-2xl font-bold">{selectedPlace.name}</h2>
                    <Badge variant="outline">{selectedPlace.country}</Badge>
                  </div>

                  {/* Weather & AQI */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 rounded-xl bg-muted/50">
                      <Thermometer className="h-5 w-5 mx-auto mb-2 text-primary" />
                      <div className="font-bold">{selectedPlace.weather.temp}°C</div>
                      <div className="text-xs text-muted-foreground">{selectedPlace.weather.condition}</div>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-muted/50">
                      <Wind className={`h-5 w-5 mx-auto mb-2 ${getAqiColor(selectedPlace.aqi)}`} />
                      <div className={`font-bold ${getAqiColor(selectedPlace.aqi)}`}>{selectedPlace.aqi}</div>
                      <div className="text-xs text-muted-foreground">{getAqiLabel(selectedPlace.aqi)}</div>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-muted/50">
                      <Newspaper className="h-5 w-5 mx-auto mb-2 text-primary" />
                      <div className="font-bold">{selectedPlace.newsCount}</div>
                      <div className="text-xs text-muted-foreground">News</div>
                    </div>
                  </div>

                  {/* Quick Links */}
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm">
                      <Plane className="h-4 w-4 mr-2" />
                      Flights
                    </Button>
                    <Button variant="outline" size="sm">
                      <Hotel className="h-4 w-4 mr-2" />
                      Hotels
                    </Button>
                    <Button variant="outline" size="sm">
                      <Utensils className="h-4 w-4 mr-2" />
                      Restaurants
                    </Button>
                    <Button variant="outline" size="sm">
                      <Navigation className="h-4 w-4 mr-2" />
                      Map
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Places Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlaces.map((place, index) => (
              <motion.div
                key={place.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className={`glass-card rounded-xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-all ${
                  selectedPlace?.id === place.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedPlace(place)}
              >
                <div className="relative h-40">
                  <img
                    src={place.image}
                    alt={place.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-background/80 backdrop-blur-sm text-xs">
                    <Star className="h-3 w-3 text-warning fill-warning" />
                    {place.rating}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span>{place.flag}</span>
                    <h3 className="font-display font-semibold">{place.name}</h3>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Cloud className="h-4 w-4" />
                      {place.weather.temp}°C
                    </span>
                    <span className={`flex items-center gap-1 ${getAqiColor(place.aqi)}`}>
                      <Wind className="h-4 w-4" />
                      AQI {place.aqi}
                    </span>
                    <span>{place.newsCount} news</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Places;
