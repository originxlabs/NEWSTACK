import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Globe, TrendingUp, AlertTriangle, Thermometer, DollarSign, Leaf, MapPin, Newspaper, ExternalLink, Clock } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePreferences } from "@/contexts/PreferencesContext";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface Region {
  code: string;
  name: string;
  flag: string;
  stories: number;
  trending: string;
  status: "stable" | "alert" | "hotspot";
  lat: number;
  lng: number;
}

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

const regions: Region[] = [
  { code: "NA", name: "North America", flag: "🇺🇸", stories: 234, trending: "Tech earnings season", status: "stable", lat: 40.7128, lng: -74.0060 },
  { code: "EU", name: "Europe", flag: "🇪🇺", stories: 189, trending: "Energy crisis update", status: "alert", lat: 51.5074, lng: -0.1278 },
  { code: "AS", name: "Asia Pacific", flag: "🇨🇳", stories: 312, trending: "Trade negotiations", status: "stable", lat: 35.6762, lng: 139.6503 },
  { code: "ME", name: "Middle East", flag: "🇦🇪", stories: 87, trending: "Oil production cuts", status: "hotspot", lat: 25.2048, lng: 55.2708 },
  { code: "AF", name: "Africa", flag: "🇿🇦", stories: 56, trending: "Climate summit", status: "stable", lat: -33.9249, lng: 18.4241 },
  { code: "SA", name: "South America", flag: "🇧🇷", stories: 78, trending: "Economic reforms", status: "stable", lat: -23.5505, lng: -46.6333 },
];

const globalStats = [
  { label: "Markets", value: "+1.2%", icon: TrendingUp, color: "text-green-500" },
  { label: "Conflicts", value: "3 Active", icon: AlertTriangle, color: "text-destructive" },
  { label: "Climate", value: "+1.5°C", icon: Thermometer, color: "text-orange-500" },
  { label: "Oil Price", value: "$78.45", icon: DollarSign, color: "text-primary" },
  { label: "Carbon", value: "418 ppm", icon: Leaf, color: "text-green-500" },
];

// Mock news events with locations
const newsEvents: NewsEvent[] = [
  { id: "1", headline: "Tech Giants Report Q4 Earnings", location: "San Francisco, USA", lat: 37.7749, lng: -122.4194, category: "Business", timestamp: "2h ago", source: "Reuters" },
  { id: "2", headline: "EU Energy Ministers Meet on Crisis", location: "Brussels, Belgium", lat: 50.8503, lng: 4.3517, category: "Politics", timestamp: "3h ago", source: "BBC" },
  { id: "3", headline: "Asian Markets Rally on Trade Talks", location: "Tokyo, Japan", lat: 35.6762, lng: 139.6503, category: "Finance", timestamp: "1h ago", source: "Bloomberg" },
  { id: "4", headline: "Middle East Oil Summit Concludes", location: "Dubai, UAE", lat: 25.2048, lng: 55.2708, category: "Business", timestamp: "4h ago", source: "Al Jazeera" },
  { id: "5", headline: "Climate Conference in Cape Town", location: "Cape Town, South Africa", lat: -33.9249, lng: 18.4241, category: "Climate", timestamp: "5h ago", source: "Guardian" },
  { id: "6", headline: "Brazil Announces Economic Reforms", location: "Brasília, Brazil", lat: -15.7801, lng: -47.9292, category: "Politics", timestamp: "6h ago", source: "NYT" },
  { id: "7", headline: "AI Summit in London Draws Tech Leaders", location: "London, UK", lat: 51.5074, lng: -0.1278, category: "Tech", timestamp: "2h ago", source: "TechCrunch" },
  { id: "8", headline: "G20 Finance Ministers Discuss Global Economy", location: "New Delhi, India", lat: 28.6139, lng: 77.2090, category: "Finance", timestamp: "3h ago", source: "NDTV" },
];

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

const World = () => {
  const { country } = usePreferences();
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20, 0]);

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const handleRegionClick = (region: Region) => {
    setSelectedRegion(region);
    setMapCenter([region.lat, region.lng]);
  };

  const filteredEvents = useMemo(() => {
    if (!selectedRegion) return newsEvents;
    // Filter events near selected region (simplified distance check)
    return newsEvents.filter(event => {
      const latDiff = Math.abs(event.lat - selectedRegion.lat);
      const lngDiff = Math.abs(event.lng - selectedRegion.lng);
      return latDiff < 30 && lngDiff < 60;
    });
  }, [selectedRegion]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm mb-6">
              <Globe className="h-4 w-4" />
              Global Intelligence
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              World Overview
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Real-time global news, markets, conflicts, and climate events on an interactive map.
              {country && ` Your location: ${country.flag_emoji} ${country.name}`}
            </p>
          </motion.div>

          {/* Global Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8"
          >
            {globalStats.map((stat) => (
              <div key={stat.label} className="glass-card rounded-xl p-4 text-center">
                <stat.icon className={`h-6 w-6 mx-auto mb-2 ${stat.color}`} />
                <div className={`font-display font-bold text-xl ${stat.color}`}>
                  {stat.value}
                </div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Interactive Map */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-2xl overflow-hidden mb-8"
          >
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <h2 className="font-display font-semibold">Interactive News Map</h2>
                </div>
                {selectedRegion && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedRegion(null);
                      setMapCenter([20, 0]);
                    }}
                  >
                    Show All Regions
                  </Button>
                )}
              </div>
              {selectedRegion && (
                <p className="text-sm text-muted-foreground mt-2">
                  Viewing: {selectedRegion.flag} {selectedRegion.name} • {selectedRegion.stories} stories • {selectedRegion.trending}
                </p>
              )}
            </div>
            
            <div className="h-[400px] md:h-[500px] relative">
              <MapContainer
                center={mapCenter}
                zoom={2}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={true}
                className="z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapController center={mapCenter} />
                
                {/* News Event Markers */}
                {filteredEvents.map((event) => (
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
            </div>
          </motion.div>

          {/* Regions Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-primary" />
              Explore by Region
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {regions.map((region, index) => (
                <motion.div
                  key={region.code}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  onClick={() => handleRegionClick(region)}
                  className={`glass-card rounded-xl p-6 cursor-pointer hover:scale-[1.02] transition-all ${
                    selectedRegion?.code === region.code ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{region.flag}</span>
                      <div>
                        <h3 className="font-display font-semibold">{region.name}</h3>
                        <p className="text-sm text-muted-foreground">{region.stories} stories</p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        region.status === "hotspot"
                          ? "destructive"
                          : region.status === "alert"
                          ? "secondary"
                          : "outline"
                      }
                      className="capitalize"
                    >
                      {region.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">Trending:</span>
                    <span>{region.trending}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* News Events List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8"
          >
            <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Latest Global Events
              {selectedRegion && (
                <Badge variant="outline" className="ml-2">
                  {selectedRegion.name}
                </Badge>
              )}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card rounded-xl p-4 hover:bg-muted/30 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {event.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{event.source}</span>
                      </div>
                      <h3 className="font-medium text-sm group-hover:text-primary transition-colors">
                        {event.headline}
                      </h3>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {event.timestamp}
                        </div>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default World;
