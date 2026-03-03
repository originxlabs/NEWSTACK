import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Star, Sparkles, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PlaceData } from "@/hooks/use-places";
import { PlaceGridSkeleton } from "./PlaceSkeleton";

interface BestPlacesGridProps {
  placeData: PlaceData;
  isLoading: boolean;
  onSelectPlace?: (placeId: string) => void;
}

const categoryConfig: Record<string, { icon: string; label: string; color: string }> = {
  museum: { icon: "🎨", label: "Museum", color: "bg-purple-500/20 text-purple-400" },
  attraction: { icon: "🏛", label: "Landmark", color: "bg-blue-500/20 text-blue-400" },
  park: { icon: "🌳", label: "Nature", color: "bg-green-500/20 text-green-400" },
  garden: { icon: "🌷", label: "Garden", color: "bg-emerald-500/20 text-emerald-400" },
  viewpoint: { icon: "🏔", label: "Viewpoint", color: "bg-cyan-500/20 text-cyan-400" },
  monument: { icon: "🗿", label: "Monument", color: "bg-amber-500/20 text-amber-400" },
  castle: { icon: "🏰", label: "Castle", color: "bg-rose-500/20 text-rose-400" },
  ruins: { icon: "🏚", label: "Historic", color: "bg-orange-500/20 text-orange-400" },
  place_of_worship: { icon: "⛪", label: "Temple", color: "bg-violet-500/20 text-violet-400" },
  artwork: { icon: "🎭", label: "Art", color: "bg-pink-500/20 text-pink-400" },
  default: { icon: "📍", label: "Must See", color: "bg-primary/20 text-primary" },
};

function getCategoryConfig(category?: string) {
  if (!category) return categoryConfig.default;
  const lowerCat = category.toLowerCase();
  return categoryConfig[lowerCat] || categoryConfig.default;
}

// AI-style editorial labels for top spots
const editorialLabels = [
  "🏆 #1 Must Visit",
  "⭐ Local Favorite",
  "📸 Photo Hotspot",
  "💎 Hidden Gem",
  "🌟 Editor's Pick",
  "🔥 Trending Now",
  "✨ Iconic Spot",
  "🎯 Don't Miss",
];

export function BestPlacesGrid({ placeData, isLoading, onSelectPlace }: BestPlacesGridProps) {
  const { nearbyAttractions } = placeData;

  // AI clustering: dedupe by name similarity and rank by importance
  const rankedPlaces = useMemo(() => {
    if (!nearbyAttractions.length) return [];

    // Dedupe: remove places with very similar names
    const seen = new Set<string>();
    const deduped = nearbyAttractions.filter((place) => {
      const normalized = place.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (seen.has(normalized)) return false;
      
      // Also check for partial matches
      for (const existing of seen) {
        if (normalized.includes(existing) || existing.includes(normalized)) {
          return false;
        }
      }
      
      seen.add(normalized);
      return true;
    });

    // Sort by category diversity and distance
    const categoryGroups = new Map<string, typeof deduped>();
    deduped.forEach((place) => {
      const cat = place.category || "default";
      if (!categoryGroups.has(cat)) {
        categoryGroups.set(cat, []);
      }
      categoryGroups.get(cat)!.push(place);
    });

    // Pick top from each category to ensure diversity
    const diverseSelection: typeof deduped = [];
    const maxPerCategory = 3;
    
    categoryGroups.forEach((places) => {
      const sorted = places.sort((a, b) => (a.distance_km || 999) - (b.distance_km || 999));
      diverseSelection.push(...sorted.slice(0, maxPerCategory));
    });

    // Final sort by distance and take top 8
    return diverseSelection
      .sort((a, b) => (a.distance_km || 999) - (b.distance_km || 999))
      .slice(0, 8);
  }, [nearbyAttractions]);

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-display text-xl font-semibold">Best Places to Visit</h3>
            <p className="text-sm text-muted-foreground">AI-curated must-see destinations</p>
          </div>
        </div>
        <PlaceGridSkeleton count={4} />
      </div>
    );
  }

  if (rankedPlaces.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-display text-xl font-semibold">Best Places to Visit</h3>
            <p className="text-sm text-muted-foreground">AI-curated must-see destinations</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-xs">
          {rankedPlaces.length} spots
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {rankedPlaces.map((place, index) => {
          const config = getCategoryConfig(place.category);
          const editorialLabel = index < 8 ? editorialLabels[index] : null;

          return (
            <motion.div
              key={place.place_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className="group cursor-pointer overflow-hidden border-0 bg-card/50 hover:bg-card transition-all hover:scale-[1.02] hover:shadow-xl h-full"
                onClick={() => onSelectPlace?.(place.place_id)}
              >
                <div className="relative h-28">
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <span className="text-4xl opacity-50">{config.icon}</span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                  
                  {/* Editorial label for top spots */}
                  {editorialLabel && index < 4 && (
                    <Badge className="absolute top-2 left-2 text-[9px] bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-lg">
                      {editorialLabel}
                    </Badge>
                  )}

                  {/* Category badge */}
                  <Badge
                    className={`absolute bottom-2 left-2 text-[10px] ${config.color} border-0`}
                  >
                    {config.icon} {config.label}
                  </Badge>

                  {/* Distance */}
                  {place.distance_km && (
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] bg-background/80 backdrop-blur-sm px-1.5 py-0.5 rounded">
                      <MapPin className="h-2.5 w-2.5" />
                      {place.distance_km} km
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors leading-tight">
                    {place.name}
                  </h4>
                  {place.vicinity && (
                    <p className="text-[11px] text-muted-foreground truncate mt-1">
                      {place.vicinity}
                    </p>
                  )}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
