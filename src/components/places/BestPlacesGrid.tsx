import { motion } from "framer-motion";
import { Star, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PlaceData } from "@/hooks/use-places";
import { PlaceGridSkeleton } from "./PlaceSkeleton";

interface BestPlacesGridProps {
  placeData: PlaceData;
  isLoading: boolean;
  onSelectPlace?: (placeId: string) => void;
}

const categoryIcons: Record<string, string> = {
  tourist_attraction: "🏛",
  museum: "🎨",
  park: "🌳",
  beach: "🏖",
  restaurant: "🍽",
  cafe: "☕",
  shopping_mall: "🛍",
  church: "⛪",
  temple: "🛕",
  mosque: "🕌",
  zoo: "🦁",
  aquarium: "🐠",
  amusement_park: "🎢",
  spa: "💆",
  gym: "🏋️",
  default: "📍",
};

function getCategoryIcon(types?: string[]): string {
  if (!types || types.length === 0) return categoryIcons.default;
  for (const type of types) {
    if (categoryIcons[type]) return categoryIcons[type];
  }
  return categoryIcons.default;
}

function getCategoryLabel(types?: string[]): string {
  if (!types || types.length === 0) return "Place";
  const type = types.find(t => categoryIcons[t]) || types[0];
  return type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

export function BestPlacesGrid({ placeData, isLoading, onSelectPlace }: BestPlacesGridProps) {
  const { nearbyAttractions } = placeData;

  if (isLoading) {
    return (
      <div>
        <h3 className="font-display text-xl font-semibold mb-4">Best Places to Visit</h3>
        <PlaceGridSkeleton count={4} />
      </div>
    );
  }

  if (nearbyAttractions.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-xl font-semibold">Best Places to Visit</h3>
        <span className="text-sm text-muted-foreground">{nearbyAttractions.length} found</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {nearbyAttractions.slice(0, 8).map((place, index) => (
          <motion.div
            key={place.place_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="glass-card rounded-xl overflow-hidden cursor-pointer group hover:scale-[1.02] transition-all"
            onClick={() => onSelectPlace?.(place.place_id)}
          >
            <div className="relative h-32">
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <span className="text-4xl">{getCategoryIcon([place.category || ""])}</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              
              {/* Category badge */}
              <Badge
                variant="secondary"
                className="absolute top-2 left-2 text-[10px] glass-card border-none"
              >
                {getCategoryIcon([place.category || ""])} {place.category || "Attraction"}
              </Badge>

              {/* Distance */}
              {place.distance_km && (
                <div className="absolute bottom-2 right-2 flex items-center gap-1 text-xs bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full">
                  📍 {place.distance_km} km
                </div>
              )}
            </div>
            <div className="p-3">
              <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                {place.name}
              </h4>
              <p className="text-xs text-muted-foreground truncate mt-1">
                {place.vicinity}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
