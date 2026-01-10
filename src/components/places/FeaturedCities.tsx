import { useState, useRef } from "react";
import { motion, PanInfo } from "framer-motion";
import { MapPin, TrendingUp, Globe, ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface FeaturedCity {
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
    images: [
      "https://source.unsplash.com/800x600/?new-york-city,skyline",
      "https://source.unsplash.com/800x600/?new-york,times-square",
      "https://source.unsplash.com/800x600/?manhattan,bridge",
      "https://source.unsplash.com/800x600/?central-park,nyc",
    ],
    description: "The city that never sleeps", 
    category: "metro" 
  },
  { 
    name: "London", 
    country: "United Kingdom", 
    countryCode: "GB", 
    lat: 51.5074, 
    lng: -0.1278, 
    images: [
      "https://source.unsplash.com/800x600/?london,tower-bridge",
      "https://source.unsplash.com/800x600/?big-ben,london",
      "https://source.unsplash.com/800x600/?london-eye",
      "https://source.unsplash.com/800x600/?buckingham-palace",
    ],
    description: "Historic capital of culture", 
    category: "metro" 
  },
  { 
    name: "Tokyo", 
    country: "Japan", 
    countryCode: "JP", 
    lat: 35.6762, 
    lng: 139.6503, 
    images: [
      "https://source.unsplash.com/800x600/?tokyo,shibuya",
      "https://source.unsplash.com/800x600/?tokyo-tower",
      "https://source.unsplash.com/800x600/?shinjuku,japan",
      "https://source.unsplash.com/800x600/?senso-ji,temple",
    ],
    description: "Where tradition meets future", 
    category: "metro" 
  },
  { 
    name: "Paris", 
    country: "France", 
    countryCode: "FR", 
    lat: 48.8566, 
    lng: 2.3522, 
    images: [
      "https://source.unsplash.com/800x600/?paris,eiffel-tower",
      "https://source.unsplash.com/800x600/?louvre,paris",
      "https://source.unsplash.com/800x600/?champs-elysees",
      "https://source.unsplash.com/800x600/?notre-dame,paris",
    ],
    description: "City of lights and love", 
    category: "metro" 
  },
  { 
    name: "Dubai", 
    country: "UAE", 
    countryCode: "AE", 
    lat: 25.2048, 
    lng: 55.2708, 
    images: [
      "https://source.unsplash.com/800x600/?dubai,burj-khalifa",
      "https://source.unsplash.com/800x600/?dubai-marina",
      "https://source.unsplash.com/800x600/?palm-jumeirah",
      "https://source.unsplash.com/800x600/?dubai-desert",
    ],
    description: "Luxury in the desert", 
    category: "metro" 
  },
  { 
    name: "Singapore", 
    country: "Singapore", 
    countryCode: "SG", 
    lat: 1.3521, 
    lng: 103.8198, 
    images: [
      "https://source.unsplash.com/800x600/?singapore,marina-bay",
      "https://source.unsplash.com/800x600/?gardens-by-the-bay",
      "https://source.unsplash.com/800x600/?singapore-skyline",
      "https://source.unsplash.com/800x600/?sentosa,singapore",
    ],
    description: "Garden city of Asia", 
    category: "metro" 
  },
  { 
    name: "Mumbai", 
    country: "India", 
    countryCode: "IN", 
    lat: 19.076, 
    lng: 72.8777, 
    images: [
      "https://source.unsplash.com/800x600/?mumbai,gateway-india",
      "https://source.unsplash.com/800x600/?marine-drive,mumbai",
      "https://source.unsplash.com/800x600/?bandra-worli-sea-link",
      "https://source.unsplash.com/800x600/?mumbai-skyline",
    ],
    description: "City of dreams", 
    category: "metro" 
  },
  { 
    name: "Delhi", 
    country: "India", 
    countryCode: "IN", 
    lat: 28.6139, 
    lng: 77.209, 
    images: [
      "https://source.unsplash.com/800x600/?delhi,india-gate",
      "https://source.unsplash.com/800x600/?red-fort,delhi",
      "https://source.unsplash.com/800x600/?qutub-minar",
      "https://source.unsplash.com/800x600/?lotus-temple,delhi",
    ],
    description: "Heart of India", 
    category: "metro" 
  },
  { 
    name: "Bangalore", 
    country: "India", 
    countryCode: "IN", 
    lat: 12.9716, 
    lng: 77.5946, 
    images: [
      "https://source.unsplash.com/800x600/?bangalore,india",
      "https://source.unsplash.com/800x600/?lalbagh,bangalore",
      "https://source.unsplash.com/800x600/?bangalore-palace",
      "https://source.unsplash.com/800x600/?cubbon-park",
    ],
    description: "Silicon Valley of India", 
    category: "metro" 
  },
  { 
    name: "Bali", 
    country: "Indonesia", 
    countryCode: "ID", 
    lat: -8.3405, 
    lng: 115.092, 
    images: [
      "https://source.unsplash.com/800x600/?bali,temple",
      "https://source.unsplash.com/800x600/?bali-rice-terraces",
      "https://source.unsplash.com/800x600/?bali-beach",
      "https://source.unsplash.com/800x600/?ubud,bali",
    ],
    description: "Island of the Gods", 
    category: "trending" 
  },
  { 
    name: "Barcelona", 
    country: "Spain", 
    countryCode: "ES", 
    lat: 41.3851, 
    lng: 2.1734, 
    images: [
      "https://source.unsplash.com/800x600/?barcelona,sagrada-familia",
      "https://source.unsplash.com/800x600/?park-guell",
      "https://source.unsplash.com/800x600/?barcelona-beach",
      "https://source.unsplash.com/800x600/?la-rambla,barcelona",
    ],
    description: "Gaudí's masterpiece city", 
    category: "trending" 
  },
  { 
    name: "Istanbul", 
    country: "Turkey", 
    countryCode: "TR", 
    lat: 41.0082, 
    lng: 28.9784, 
    images: [
      "https://source.unsplash.com/800x600/?istanbul,hagia-sophia",
      "https://source.unsplash.com/800x600/?blue-mosque,istanbul",
      "https://source.unsplash.com/800x600/?bosphorus,istanbul",
      "https://source.unsplash.com/800x600/?grand-bazaar,istanbul",
    ],
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
  const images = city.images;

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x > threshold && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (info.offset.x < -threshold && currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return (
    <Card
      className="group cursor-pointer overflow-hidden border-0 bg-card/50 hover:bg-card transition-all hover:scale-[1.02] hover:shadow-xl"
      onClick={onSelect}
    >
      <div className="relative h-32 sm:h-40 overflow-hidden">
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
            <div key={index} className="relative h-full" style={{ width: `${100 / images.length}%` }}>
              <img
                src={image}
                alt={`${city.name} ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
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

export type { FeaturedCity };
