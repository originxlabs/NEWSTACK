import { useState } from "react";
import { motion } from "framer-motion";
import { Map, Navigation, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PlaceData } from "@/hooks/use-places";

interface MapRoutesProps {
  placeData: PlaceData;
  onOpenInMaps: (lat: number, lng: number, provider?: "google" | "apple" | "mapmyindia" | "osm") => void;
}

export function MapRoutes({ placeData, onOpenInMaps }: MapRoutesProps) {
  const [showModal, setShowModal] = useState(false);
  const { place } = placeData;

  if (!place) return null;

  const mapProviders = [
    {
      id: "google" as const,
      name: "Google Maps",
      icon: "🗺️",
      description: "Navigation & Street View",
    },
    {
      id: "apple" as const,
      name: "Apple Maps",
      icon: "🍎",
      description: "iOS native maps",
    },
    {
      id: "mapmyindia" as const,
      name: "MapmyIndia",
      icon: "🇮🇳",
      description: "Best for India",
    },
    {
      id: "osm" as const,
      name: "OpenStreetMap",
      icon: "🌍",
      description: "Open source maps",
    },
  ];

  const handleOpenMap = (provider: "google" | "apple" | "mapmyindia" | "osm") => {
    let url = "";
    
    switch (provider) {
      case "apple":
        url = `https://maps.apple.com/?ll=${place.lat},${place.lng}&z=15&q=${encodeURIComponent(place.name)}`;
        break;
      case "mapmyindia":
        url = `https://maps.mapmyindia.com/direction?lat=${place.lat}&lng=${place.lng}&zoom=15`;
        break;
      case "osm":
        url = `https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}&zoom=15`;
        break;
      case "google":
      default:
        url = `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}&query_place_id=${place.place_id}`;
        break;
    }
    
    window.open(url, "_blank");
    setShowModal(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl overflow-hidden"
      >
        {/* Map Preview (Static) */}
        <div className="relative h-48 bg-muted">
          <img
            src={`https://maps.googleapis.com/maps/api/staticmap?center=${place.lat},${place.lng}&zoom=14&size=600x300&maptype=roadmap&markers=color:red%7C${place.lat},${place.lng}&key=${import.meta.env.VITE_GOOGLE_MAPS_KEY || ""}`}
            alt="Map preview"
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to placeholder if API key not available
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
            <Map className="h-12 w-12 text-primary/50" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          
          {/* Open Map Button */}
          <Button
            onClick={() => setShowModal(true)}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full shadow-lg"
          >
            <Navigation className="h-4 w-4 mr-2" />
            Open in Maps
          </Button>
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Coordinates</span>
            <span className="font-mono text-xs">
              {place.lat.toFixed(4)}, {place.lng.toFixed(4)}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Map Provider Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-primary" />
              Open in Maps
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            {mapProviders.map((provider) => (
              <Button
                key={provider.id}
                variant="outline"
                className="h-auto py-4 justify-start"
                onClick={() => handleOpenMap(provider.id)}
              >
                <span className="text-2xl mr-4">{provider.icon}</span>
                <div className="text-left">
                  <div className="font-medium">{provider.name}</div>
                  <div className="text-xs text-muted-foreground">{provider.description}</div>
                </div>
                <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
