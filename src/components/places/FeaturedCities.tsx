import { motion } from "framer-motion";
import { MapPin, TrendingUp, Globe } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FeaturedCity {
  name: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  image: string;
  description: string;
  category: "metro" | "trending" | "heritage";
}

const featuredCities: FeaturedCity[] = [
  // Metro Cities
  { name: "New York", country: "United States", countryCode: "US", lat: 40.7128, lng: -74.006, image: "https://source.unsplash.com/800x600/?new-york-city,skyline", description: "The city that never sleeps", category: "metro" },
  { name: "London", country: "United Kingdom", countryCode: "GB", lat: 51.5074, lng: -0.1278, image: "https://source.unsplash.com/800x600/?london,tower-bridge", description: "Historic capital of culture", category: "metro" },
  { name: "Tokyo", country: "Japan", countryCode: "JP", lat: 35.6762, lng: 139.6503, image: "https://source.unsplash.com/800x600/?tokyo,shibuya", description: "Where tradition meets future", category: "metro" },
  { name: "Paris", country: "France", countryCode: "FR", lat: 48.8566, lng: 2.3522, image: "https://source.unsplash.com/800x600/?paris,eiffel-tower", description: "City of lights and love", category: "metro" },
  { name: "Dubai", country: "UAE", countryCode: "AE", lat: 25.2048, lng: 55.2708, image: "https://source.unsplash.com/800x600/?dubai,burj-khalifa", description: "Luxury in the desert", category: "metro" },
  { name: "Singapore", country: "Singapore", countryCode: "SG", lat: 1.3521, lng: 103.8198, image: "https://source.unsplash.com/800x600/?singapore,marina-bay", description: "Garden city of Asia", category: "metro" },
  // Indian Metro Cities
  { name: "Mumbai", country: "India", countryCode: "IN", lat: 19.076, lng: 72.8777, image: "https://source.unsplash.com/800x600/?mumbai,gateway-india", description: "City of dreams", category: "metro" },
  { name: "Delhi", country: "India", countryCode: "IN", lat: 28.6139, lng: 77.209, image: "https://source.unsplash.com/800x600/?delhi,india-gate", description: "Heart of India", category: "metro" },
  { name: "Bangalore", country: "India", countryCode: "IN", lat: 12.9716, lng: 77.5946, image: "https://source.unsplash.com/800x600/?bangalore,india", description: "Silicon Valley of India", category: "metro" },
  // Trending Destinations
  { name: "Bali", country: "Indonesia", countryCode: "ID", lat: -8.3405, lng: 115.092, image: "https://source.unsplash.com/800x600/?bali,temple", description: "Island of the Gods", category: "trending" },
  { name: "Barcelona", country: "Spain", countryCode: "ES", lat: 41.3851, lng: 2.1734, image: "https://source.unsplash.com/800x600/?barcelona,sagrada-familia", description: "Gaudí's masterpiece city", category: "trending" },
  { name: "Istanbul", country: "Turkey", countryCode: "TR", lat: 41.0082, lng: 28.9784, image: "https://source.unsplash.com/800x600/?istanbul,hagia-sophia", description: "Where East meets West", category: "trending" },
];

interface FeaturedCitiesProps {
  onSelectCity: (city: FeaturedCity) => void;
}

export function FeaturedCities({ onSelectCity }: FeaturedCitiesProps) {
  const metroCities = featuredCities.filter(c => c.category === "metro");
  const trendingCities = featuredCities.filter(c => c.category === "trending");

  return (
    <div className="space-y-12">
      {/* Metro Cities */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <Globe className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold">Metro Cities</h2>
            <p className="text-sm text-muted-foreground">World's major metropolitan destinations</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {metroCities.map((city, index) => (
            <motion.div
              key={city.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className="group cursor-pointer overflow-hidden border-0 bg-card/50 hover:bg-card transition-all hover:scale-[1.02] hover:shadow-xl"
                onClick={() => onSelectCity(city)}
              >
                <div className="relative h-32 overflow-hidden">
                  <img
                    src={city.image}
                    alt={city.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                  <Badge className="absolute top-2 right-2 text-[10px] bg-background/80 backdrop-blur-sm">
                    {city.countryCode}
                  </Badge>
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-1 mb-1">
                    <MapPin className="h-3 w-3 text-primary" />
                    <h3 className="font-semibold text-sm truncate">{city.name}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{city.description}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trending Destinations */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold">Trending Now</h2>
            <p className="text-sm text-muted-foreground">Popular destinations this season</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {trendingCities.map((city, index) => (
            <motion.div
              key={city.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
            >
              <Card
                className="group cursor-pointer overflow-hidden border-0 bg-card/50 hover:bg-card transition-all hover:scale-[1.02] hover:shadow-xl"
                onClick={() => onSelectCity(city)}
              >
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={city.image}
                    alt={city.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                  <Badge className="absolute top-2 left-2 text-[10px] bg-orange-500/90 text-white border-0">
                    🔥 Trending
                  </Badge>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-1 mb-1">
                    <MapPin className="h-3 w-3 text-primary" />
                    <h3 className="font-semibold truncate">{city.name}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">{city.country}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{city.description}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}

export type { FeaturedCity };
