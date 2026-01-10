import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock } from "lucide-react";

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface NewsEvent {
  id: string;
  headline: string;
  location: string;
  lat: number;
  lng: number;
  category: string;
  timestamp: string;
  source: string;
}

interface WorldMapProps {
  center: [number, number];
  events: NewsEvent[];
  onCenterChange?: (center: [number, number]) => void;
}

// Custom marker icons based on category
const createCustomIcon = (category: string) => {
  const colors: Record<string, string> = {
    Business: "#3b82f6",
    Politics: "#f59e0b",
    Finance: "#10b981",
    Climate: "#84cc16",
    Tech: "#8b5cf6",
  };
  
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background: ${colors[category] || "#6366f1"};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        color: white;
        font-size: 14px;
      ">
        📰
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

// Map controller component
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 4, { duration: 1.5 });
  }, [center, map]);
  return null;
}

export default function WorldMap({ center, events, onCenterChange }: WorldMapProps) {
  return (
    <MapContainer
      center={center}
      zoom={2}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={true}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapController center={center} />
      
      {/* News Event Markers */}
      {events.map((event) => (
        <Marker
          key={event.id}
          position={[event.lat, event.lng]}
          icon={createCustomIcon(event.category)}
        >
          <Popup className="custom-popup">
            <div className="p-1 min-w-[200px]">
              <Badge className="mb-2 text-xs">{event.category}</Badge>
              <h3 className="font-semibold text-sm mb-2">{event.headline}</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <MapPin className="w-3 h-3" />
                {event.location}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{event.source}</span>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {event.timestamp}
                </div>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
