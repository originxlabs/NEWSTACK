import { useState } from "react";
import { motion, PanInfo } from "framer-motion";
import { MapPin, TrendingUp, Globe, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCityImages } from "@/lib/city-images";

export interface FeaturedCity {
  name: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  images: string[];
  description: string;
  category: "metro" | "trending" | "heritage";
}

const featuredCities: FeaturedCity[] = [
  // Metro Cities
  { 
    name: "New York", 
    country: "United States", 
    countryCode: "US", 
    lat: 40.7128, 
    lng: -74.006, 
    images: getCityImages("New York"),
    description: "The city that never sleeps", 
    category: "metro" 
  },
  { 
    name: "London", 
    country: "United Kingdom", 
    countryCode: "GB", 
    lat: 51.5074, 
    lng: -0.1278, 
    images: getCityImages("London"),
    description: "Historic capital of culture", 
    category: "metro" 
  },
  { 
    name: "Tokyo", 
    country: "Japan", 
    countryCode: "JP", 
    lat: 35.6762, 
    lng: 139.6503, 
    images: getCityImages("Tokyo"),
    description: "Where tradition meets future", 
    category: "metro" 
  },
  { 
    name: "Paris", 
    country: "France", 
    countryCode: "FR", 
    lat: 48.8566, 
    lng: 2.3522, 
    images: getCityImages("Paris"),
    description: "City of lights and love", 
    category: "metro" 
  },
  { 
    name: "Dubai", 
    country: "UAE", 
    countryCode: "AE", 
    lat: 25.2048, 
    lng: 55.2708, 
    images: getCityImages("Dubai"),
    description: "Luxury in the desert", 
    category: "metro" 
  },
  { 
    name: "Singapore", 
    country: "Singapore", 
    countryCode: "SG", 
    lat: 1.3521, 
    lng: 103.8198, 
    images: getCityImages("Singapore"),
    description: "Garden city of Asia", 
    category: "metro" 
  },
  { 
    name: "Mumbai", 
    country: "India", 
    countryCode: "IN", 
    lat: 19.076, 
    lng: 72.8777, 
    images: getCityImages("Mumbai"),
    description: "City of dreams", 
    category: "metro" 
  },
  { 
    name: "Delhi", 
    country: "India", 
    countryCode: "IN", 
    lat: 28.6139, 
    lng: 77.209, 
    images: getCityImages("Delhi"),
    description: "Heart of India", 
    category: "metro" 
  },
  { 
    name: "Bangalore", 
    country: "India", 
    countryCode: "IN", 
    lat: 12.9716, 
    lng: 77.5946, 
    images: getCityImages("Bangalore"),
    description: "Silicon Valley of India", 
    category: "metro" 
  },
  { 
    name: "Bali", 
    country: "Indonesia", 
    countryCode: "ID", 
    lat: -8.3405, 
    lng: 115.092, 
    images: getCityImages("Bali"),
    description: "Island of the Gods", 
    category: "trending" 
  },
  { 
    name: "Barcelona", 
    country: "Spain", 
    countryCode: "ES", 
    lat: 41.3851, 
    lng: 2.1734, 
    images: getCityImages("Barcelona"),
    description: "Gaudí's masterpiece city", 
    category: "trending" 
  },
  { 
    name: "Istanbul", 
    country: "Turkey", 
    countryCode: "TR", 
    lat: 41.0082, 
    lng: 28.9784, 
    images: getCityImages("Istanbul"),
    description: "Where East meets West", 
    category: "trending" 
  },
];

interface CityCardProps {
  city: FeaturedCity;
  onSelect: () => void;
  showTrending?: boolean;
}

function CityCard({ city, onSelect, showTrending }: CityCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set([0]));
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const images = city.images;

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x > threshold && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (info.offset.x < -threshold && currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleImageLoad = (index: number) => {
    setLoadedImages((prev) => new Set(prev).add(index));
  };

  const handleImageError = (index: number) => {
    setImageErrors((prev) => new Set(prev).add(index));
  };

  return (
    <Card
      className="group cursor-pointer overflow-hidden border-0 bg-card/50 hover:bg-card transition-all hover:scale-[1.02] hover:shadow-xl"
      onClick={onSelect}
    >
      <div className="relative h-32 sm:h-40 overflow-hidden bg-muted">
        <motion.div
          className="flex h-full touch-pan-y"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
          animate={{ x: -currentIndex * 100 + "%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{ width: `${images.length * 100}%` }}
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((image, index) => (
            <div key={index} className="relative h-full flex items-center justify-center" style={{ width: `${100 / images.length}%` }}>
              {!loadedImages.has(index) && !imageErrors.has(index) && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
              {!imageErrors.has(index) ? (
                <img
                  src={image}
                  alt={`${city.name} ${index + 1}`}
                  className={`w-full h-full object-cover transition-opacity duration-300 ${loadedImages.has(index) ? "opacity-100" : "opacity-0"}`}
                  loading={index === 0 ? "eager" : "lazy"}
                  onLoad={() => handleImageLoad(index)}
                  onError={() => handleImageError(index)}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <MapPin className="h-8 w-8 text-primary/50" />
                </div>
              )}
            </div>
          ))}
        </motion.div>

        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent pointer-events-none" />
        
        {showTrending && (
          <Badge className="absolute top-2 left-2 text-[10px] bg-orange-500/90 text-white border-0">
            🔥 Trending
          </Badge>
        )}
        
        <Badge className="absolute top-2 right-2 text-[10px] bg-background/80 backdrop-blur-sm">
          {city.countryCode}
        </Badge>

        {/* Dots indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
          {images.map((_, index) => (
            <button
              key={index}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                index === currentIndex ? "bg-white w-3" : "bg-white/50"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(index);
              }}
            />
          ))}
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center gap-1 mb-1">
          <MapPin className="h-3 w-3 text-primary" />
          <h3 className="font-semibold text-sm truncate">{city.name}</h3>
        </div>
        <p className="text-xs text-muted-foreground truncate">{city.description}</p>
      </div>
    </Card>
  );
}

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
            <h2 className="font-display text-xl sm:text-2xl font-bold">Metro Cities</h2>
            <p className="text-sm text-muted-foreground">World's major metropolitan destinations</p>
          </div>
        </div>
        
        {/* Horizontal scroll on mobile */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory sm:grid sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 sm:overflow-visible">
          {metroCities.map((city, index) => (
            <motion.div
              key={city.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex-shrink-0 w-[280px] sm:w-auto snap-start"
            >
              <CityCard city={city} onSelect={() => onSelectCity(city)} />
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
            <h2 className="font-display text-xl sm:text-2xl font-bold">Trending Now</h2>
            <p className="text-sm text-muted-foreground">Popular destinations this season</p>
          </div>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:overflow-visible">
          {trendingCities.map((city, index) => (
            <motion.div
              key={city.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
              className="flex-shrink-0 w-[280px] sm:w-auto snap-start"
            >
              <CityCard city={city} onSelect={() => onSelectCity(city)} showTrending />
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}