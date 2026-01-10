import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, MapPin, ExternalLink, Coffee, Utensils, Hotel, Plane, Train, Hospital, Bus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlaceData } from "@/hooks/use-places";
import { PlaceSkeleton } from "./PlaceSkeleton";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

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
  distance_km?: number;
  lat: number;
  lng: number;
  category?: string;
  cuisine?: string;
  opening_hours?: string;
}

function PlaceListItem({ item, onOpenInMaps }: { item: PlaceItem; onOpenInMaps: (lat: number, lng: number) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors cursor-pointer group"
      onClick={() => onOpenInMaps(item.lat, item.lng)}
    >
      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-muted flex items-center justify-center">
        <MapPin className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-sm truncate">{item.name}</h4>
        </div>
        <p className="text-xs text-muted-foreground truncate mb-1">
          {item.vicinity || item.category}
        </p>
        <div className="flex items-center gap-3">
          {item.rating && (
            <span className="flex items-center gap-1 text-xs">
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
              {item.rating}
            </span>
          )}
          {item.distance_km && (
            <span className="text-xs text-muted-foreground">
              {item.distance_km} km
            </span>
          )}
          {item.cuisine && (
            <Badge variant="secondary" className="text-[10px]">
              {item.cuisine}
            </Badge>
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
  const { place, nearbyRestaurants, nearbyHotels, nearbyAttractions, airports } = placeData;
  
  const [cafes, setCafes] = useState<PlaceItem[]>([]);
  const [hospitals, setHospitals] = useState<PlaceItem[]>([]);
  const [railwayStations, setRailwayStations] = useState<PlaceItem[]>([]);
  const [busStations, setBusStations] = useState<PlaceItem[]>([]);
  const [loadingExtra, setLoadingExtra] = useState(false);

  // Fetch additional categories when place changes
  useEffect(() => {
    if (!place?.lat || !place?.lng) return;

    const fetchExtraCategories = async () => {
      setLoadingExtra(true);
      
      try {
        const [cafesRes, hospitalsRes, railwayRes, busRes] = await Promise.allSettled([
          fetch(`${SUPABASE_URL}/functions/v1/places-nearby`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`,
            },
            body: JSON.stringify({ lat: place.lat, lng: place.lng, type: "cafe" }),
          }).then(r => r.json()),
          fetch(`${SUPABASE_URL}/functions/v1/places-nearby`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`,
            },
            body: JSON.stringify({ lat: place.lat, lng: place.lng, type: "hospital" }),
          }).then(r => r.json()),
          fetch(`${SUPABASE_URL}/functions/v1/places-nearby`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`,
            },
            body: JSON.stringify({ lat: place.lat, lng: place.lng, type: "railway_station" }),
          }).then(r => r.json()),
          fetch(`${SUPABASE_URL}/functions/v1/places-nearby`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`,
            },
            body: JSON.stringify({ lat: place.lat, lng: place.lng, type: "bus_station" }),
          }).then(r => r.json()),
        ]);

        if (cafesRes.status === "fulfilled") setCafes(cafesRes.value.places || []);
        if (hospitalsRes.status === "fulfilled") setHospitals(hospitalsRes.value.places || []);
        if (railwayRes.status === "fulfilled") setRailwayStations(railwayRes.value.places || []);
        if (busRes.status === "fulfilled") setBusStations(busRes.value.places || []);
      } catch (error) {
        console.error("Failed to fetch extra categories:", error);
      } finally {
        setLoadingExtra(false);
      }
    };

    fetchExtraCategories();
  }, [place?.lat, place?.lng]);

  const tabs = [
    { 
      id: "attractions", 
      label: "Attractions", 
      icon: <MapPin className="h-3.5 w-3.5" />,
      items: nearbyAttractions 
    },
    { 
      id: "restaurants", 
      label: "Restaurants", 
      icon: <Utensils className="h-3.5 w-3.5" />,
      items: nearbyRestaurants 
    },
    { 
      id: "cafes", 
      label: "Cafes", 
      icon: <Coffee className="h-3.5 w-3.5" />,
      items: cafes 
    },
    { 
      id: "hotels", 
      label: "Hotels", 
      icon: <Hotel className="h-3.5 w-3.5" />,
      items: nearbyHotels 
    },
    { 
      id: "hospitals", 
      label: "Hospitals", 
      icon: <Hospital className="h-3.5 w-3.5" />,
      items: hospitals 
    },
    { 
      id: "airports", 
      label: "Airports", 
      icon: <Plane className="h-3.5 w-3.5" />,
      items: airports.map(a => ({
        place_id: a.place_id || a.name,
        name: a.name,
        vicinity: a.iata_code ? `${a.iata_code} • ${a.distance_km} km` : `${a.distance_km} km away`,
        lat: a.lat,
        lng: a.lng,
        distance_km: a.distance_km,
      }))
    },
    { 
      id: "railway", 
      label: "Railway", 
      icon: <Train className="h-3.5 w-3.5" />,
      items: railwayStations 
    },
    { 
      id: "bus", 
      label: "Bus Stands", 
      icon: <Bus className="h-3.5 w-3.5" />,
      items: busStations 
    },
  ];

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="font-display text-xl font-semibold mb-4">Nearby Essentials</h3>
      
      <Tabs defaultValue="attractions" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto scrollbar-hide mb-4 h-auto flex-wrap gap-1 bg-transparent p-0">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="text-xs whitespace-nowrap flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-3 py-1.5"
            >
              {tab.icon}
              {tab.label}
              {tab.items.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-[9px] h-4 px-1.5 rounded-full">
                  {tab.items.length}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-0">
            {isLoading || (loadingExtra && ["cafes", "hospitals", "railway", "bus"].includes(tab.id)) ? (
              <PlaceSkeleton type="list" />
            ) : tab.items.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-hide">
                {tab.items.slice(0, 6).map((item) => (
                  <PlaceListItem
                    key={item.place_id}
                    item={item as PlaceItem}
                    onOpenInMaps={onOpenInMaps}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {tab.icon}
                <p className="text-sm mt-2">No {tab.label.toLowerCase()} found nearby</p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
