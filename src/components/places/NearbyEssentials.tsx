import { motion } from "framer-motion";
import { Star, MapPin, ChevronRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlaceData } from "@/hooks/use-places";
import { PlaceSkeleton } from "./PlaceSkeleton";

interface NearbyEssentialsProps {
  placeData: PlaceData;
  isLoading: boolean;
  onOpenInMaps: (lat: number, lng: number) => void;
}

interface PlaceItem {
  place_id: string;
  name: string;
  vicinity?: string;
  rating?: number;
  photo_url?: string | null;
  open_now?: boolean;
  price_level?: number;
  lat: number;
  lng: number;
}

function PlaceListItem({ item, onOpenInMaps }: { item: PlaceItem; onOpenInMaps: (lat: number, lng: number) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors cursor-pointer group"
      onClick={() => onOpenInMaps(item.lat, item.lng)}
    >
      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
        {item.photo_url ? (
          <img src={item.photo_url} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-sm truncate">{item.name}</h4>
          {item.open_now !== undefined && (
            <Badge variant={item.open_now ? "default" : "secondary"} className="text-[10px] py-0">
              {item.open_now ? "Open" : "Closed"}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate mb-1">{item.vicinity}</p>
        <div className="flex items-center gap-3">
          {item.rating && (
            <span className="flex items-center gap-1 text-xs">
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
              {item.rating}
            </span>
          )}
          {item.price_level && (
            <span className="text-xs text-muted-foreground">
              {"$".repeat(item.price_level)}
            </span>
          )}
        </div>
      </div>
      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
        <ExternalLink className="h-4 w-4" />
      </Button>
    </motion.div>
  );
}

export function NearbyEssentials({ placeData, isLoading, onOpenInMaps }: NearbyEssentialsProps) {
  const { nearbyRestaurants, nearbyHotels, nearbyAttractions, airports } = placeData;

  const tabs = [
    { id: "attractions", label: "🏛 Attractions", items: nearbyAttractions },
    { id: "restaurants", label: "🍽 Restaurants", items: nearbyRestaurants },
    { id: "hotels", label: "🏨 Hotels", items: nearbyHotels },
    { id: "transport", label: "✈️ Transport", items: airports.map(a => ({
      place_id: a.place_id || a.name,
      name: a.name,
      vicinity: `${a.distance_km} km away`,
      lat: a.lat,
      lng: a.lng,
    })) },
  ];

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="font-display text-xl font-semibold mb-4">Nearby Essentials</h3>
      
      <Tabs defaultValue="attractions" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto scrollbar-hide mb-4 h-auto flex-wrap">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="text-xs sm:text-sm whitespace-nowrap"
            >
              {tab.label}
              {tab.items.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-[10px]">
                  {tab.items.length}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-0">
            {isLoading ? (
              <PlaceSkeleton type="list" />
            ) : tab.items.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-hide">
                {tab.items.slice(0, 5).map((item) => (
                  <PlaceListItem
                    key={item.place_id}
                    item={item as PlaceItem}
                    onOpenInMaps={onOpenInMaps}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No {tab.id} found nearby</p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
