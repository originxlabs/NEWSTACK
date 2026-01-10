import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Navigation, Clock, Car, Train, Footprints, ExternalLink, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PlaceData } from "@/hooks/use-places";

interface InteractiveMapProps {
  placeData: PlaceData;
}

export function InteractiveMap({ placeData }: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
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
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => console.log("Location access denied")
      );
    }
  }, []);

  useEffect(() => {
    if (!place || !mapRef.current) return;

    const initMap = async () => {
      const L = await import("leaflet");

      // Clean up previous instance
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      // Initialize map
      const map = L.map(mapRef.current!, {
        center: [place.lat, place.lng],
        zoom: 14,
        zoomControl: false,
      });

      // Add OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      // Add zoom control to bottom right
      L.control.zoom({ position: "bottomright" }).addTo(map);

      // Custom marker icon
      const mainIcon = L.divIcon({
        className: "custom-marker",
        html: `<div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);"><span style="color: white; font-size: 16px;">📍</span></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      // Main place marker
      L.marker([place.lat, place.lng], { icon: mainIcon })
        .addTo(map)
        .bindPopup(`<strong>${place.name}</strong><br/>${place.formatted_address || ""}`);

      // Add nearby attraction markers
      nearbyAttractions.slice(0, 8).forEach((attraction) => {
        if (attraction.lat && attraction.lng) {
          const attractionIcon = L.divIcon({
            className: "custom-marker",
            html: `<div style="background: #10b981; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);"><span style="color: white; font-size: 10px;">⭐</span></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          L.marker([attraction.lat, attraction.lng], { icon: attractionIcon })
            .addTo(map)
            .bindPopup(`<strong>${attraction.name}</strong><br/>${attraction.vicinity || ""}`);
        }
      });

      // Add user location if available
      if (userLocation) {
        const userIcon = L.divIcon({
          className: "custom-marker",
          html: `<div style="background: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(59, 130, 246, 0.5);"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
          .addTo(map)
          .bindPopup("Your location");

        // Calculate rough travel estimates
        const distance = calculateDistance(userLocation.lat, userLocation.lng, place.lat, place.lng);
        setTravelEstimates({
          driving: formatTime(distance / 50), // ~50 km/h average
          transit: formatTime(distance / 30), // ~30 km/h average
          walking: formatTime(distance / 5), // ~5 km/h average
        });
      }

      mapInstanceRef.current = map;
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [place, nearbyAttractions, userLocation]);

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

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl overflow-hidden"
      >
        {/* Map Container */}
        <div className="relative h-64">
          <div ref={mapRef} className="w-full h-full z-0" />
          
          {/* Fullscreen button */}
          <Button
            size="icon"
            variant="secondary"
            className="absolute top-3 right-3 z-10 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowFullscreen(true)}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
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
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${place.lng - 0.05},${place.lat - 0.03},${place.lng + 0.05},${place.lat + 0.03}&layer=mapnik&marker=${place.lat},${place.lng}`}
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
