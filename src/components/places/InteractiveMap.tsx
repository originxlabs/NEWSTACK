import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Navigation, Car, Train, Footprints, ExternalLink, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PlaceData } from "@/hooks/use-places";

interface InteractiveMapProps {
  placeData: PlaceData;
}

export function InteractiveMap({ placeData }: InteractiveMapProps) {
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [travelEstimates, setTravelEstimates] = useState<{
    driving: string;
    transit: string;
    walking: string;
  } | null>(null);

  const { place, nearbyAttractions } = placeData;

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(loc);
          
          // Calculate rough travel estimates if place exists
          if (place) {
            const distance = calculateDistance(loc.lat, loc.lng, place.lat, place.lng);
            setTravelEstimates({
              driving: formatTime(distance / 50), // ~50 km/h average
              transit: formatTime(distance / 30), // ~30 km/h average
              walking: formatTime(distance / 5), // ~5 km/h average
            });
          }
        },
        () => console.log("Location access denied")
      );
    }
  }, [place]);

  const openInMaps = (provider: string) => {
    if (!place) return;

    const urls: Record<string, string> = {
      google: `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`,
      apple: `https://maps.apple.com/?daddr=${place.lat},${place.lng}`,
      osm: `https://www.openstreetmap.org/directions?to=${place.lat},${place.lng}`,
    };

    window.open(urls[provider] || urls.google, "_blank");
  };

  if (!place) return null;

  // Build OpenStreetMap embed URL with marker
  const mapEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${place.lng - 0.01},${place.lat - 0.008},${place.lng + 0.01},${place.lat + 0.008}&layer=mapnik&marker=${place.lat},${place.lng}`;
  const fullscreenMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${place.lng - 0.05},${place.lat - 0.03},${place.lng + 0.05},${place.lat + 0.03}&layer=mapnik&marker=${place.lat},${place.lng}`;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl overflow-hidden"
      >
        {/* Map Container */}
        <div className="relative h-64">
          <iframe
            src={mapEmbedUrl}
            className="w-full h-full border-0"
            title={`Map of ${place.name}`}
            loading="lazy"
          />
          
          {/* Fullscreen button */}
          <Button
            size="icon"
            variant="secondary"
            className="absolute top-3 right-3 z-10 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowFullscreen(true)}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>

          {/* Location info overlay */}
          <div className="absolute bottom-3 left-3 right-3 z-10">
            <div className="bg-background/90 backdrop-blur-sm rounded-lg p-2 text-xs">
              <p className="font-medium truncate">{place.name}</p>
              {place.formatted_address && (
                <p className="text-muted-foreground truncate">{place.formatted_address}</p>
              )}
            </div>
          </div>
        </div>

        {/* Travel Estimates */}
        {travelEstimates && (
          <div className="p-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground mb-3">Estimated travel time from your location</p>
            <div className="flex gap-3">
              <Badge variant="secondary" className="flex items-center gap-1.5 py-1.5">
                <Car className="h-3 w-3" />
                {travelEstimates.driving}
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1.5 py-1.5">
                <Train className="h-3 w-3" />
                {travelEstimates.transit}
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1.5 py-1.5">
                <Footprints className="h-3 w-3" />
                {travelEstimates.walking}
              </Badge>
            </div>
          </div>
        )}

        {/* Route Buttons */}
        <div className="p-4 border-t border-border/50 flex gap-2">
          <Button onClick={() => openInMaps("google")} className="flex-1" size="sm">
            <Navigation className="h-4 w-4 mr-2" />
            Get Directions
          </Button>
          <Button onClick={() => openInMaps("osm")} variant="outline" size="sm">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      {/* Fullscreen Map Modal */}
      <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-primary" />
              {place.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-[500px] rounded-lg overflow-hidden">
            <iframe
              src={fullscreenMapUrl}
              className="w-full h-full border-0"
              title="Map"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

function formatTime(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)} min`;
  }
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
