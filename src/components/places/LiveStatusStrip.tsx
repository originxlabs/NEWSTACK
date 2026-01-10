import { motion } from "framer-motion";
import { Thermometer, Cloud, Wind, Droplets, RefreshCw } from "lucide-react";
import { PlaceData } from "@/hooks/use-places";
import { PlaceSkeleton } from "./PlaceSkeleton";
import { Badge } from "@/components/ui/badge";

interface LiveStatusStripProps {
  placeData: PlaceData;
  isLoading: boolean;
}

const getAqiColor = (aqi: number | null) => {
  if (!aqi) return "text-muted-foreground";
  if (aqi <= 50) return "text-green-500";
  if (aqi <= 100) return "text-yellow-500";
  if (aqi <= 150) return "text-orange-500";
  return "text-red-500";
};

const getAqiBg = (aqi: number | null) => {
  if (!aqi) return "from-muted/50 to-muted/30";
  if (aqi <= 50) return "from-green-500/20 to-green-500/5";
  if (aqi <= 100) return "from-yellow-500/20 to-yellow-500/5";
  if (aqi <= 150) return "from-orange-500/20 to-orange-500/5";
  return "from-red-500/20 to-red-500/5";
};

const formatFetchTime = (fetchedAt?: number): string => {
  if (!fetchedAt) return "";
  const diff = Date.now() - fetchedAt;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
};

export function LiveStatusStrip({ placeData, isLoading }: LiveStatusStripProps) {
  const { weather, aqi, dataFreshness } = placeData;

  if (isLoading && !weather && !aqi) {
    return (
      <div className="py-6">
        <PlaceSkeleton type="weather" />
      </div>
    );
  }

  if (!weather?.current && !aqi) return null;

  const statusCards = [];
  const isFresh = dataFreshness?.weather || dataFreshness?.aqi;

  if (weather?.current) {
    statusCards.push(
      {
        icon: Thermometer,
        value: `${weather.current.temp}°C`,
        label: "Temperature",
        sublabel: `Feels like ${weather.current.feels_like}°C`,
        gradient: "from-primary/20 to-primary/5",
        iconColor: "text-primary",
        fetchedAt: weather.fetchedAt,
      },
      {
        icon: Cloud,
        value: weather.current.condition,
        label: "Weather",
        sublabel: weather.current.description,
        gradient: "from-blue-500/20 to-blue-500/5",
        iconColor: "text-blue-500",
        image: weather.current.icon_url,
      },
      {
        icon: Droplets,
        value: `${weather.current.humidity}%`,
        label: "Humidity",
        sublabel: `Wind ${weather.current.wind_speed} m/s`,
        gradient: "from-cyan-500/20 to-cyan-500/5",
        iconColor: "text-cyan-500",
      }
    );
  }

  if (aqi) {
    statusCards.push({
      icon: Wind,
      value: aqi.aqi !== null ? `AQI ${aqi.aqi}` : "N/A",
      label: "Air Quality",
      sublabel: aqi.category || "Unknown",
      gradient: getAqiBg(aqi.aqi),
      iconColor: getAqiColor(aqi.aqi),
      fetchedAt: aqi.fetchedAt,
      station: aqi.station?.name,
    });
  }

  return (
    <div className="py-6 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full animate-pulse ${isFresh ? "bg-green-500" : "bg-yellow-500"}`} />
          <span className="text-xs text-muted-foreground font-medium">
            {isFresh ? "Live" : "Cached"} • Updated {formatFetchTime(weather?.fetchedAt || aqi?.fetchedAt)}
          </span>
        </div>
        {isFresh && (
          <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-600 border-green-500/20">
            ✓ Latest
          </Badge>
        )}
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {statusCards.map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex-shrink-0 min-w-[140px] glass-card rounded-xl p-4 bg-gradient-to-br ${card.gradient}`}
          >
            <div className="flex items-center justify-between mb-2">
              <card.icon className={`h-5 w-5 ${card.iconColor}`} />
              {card.image && (
                <img src={card.image} alt={card.label} className="w-8 h-8" />
              )}
            </div>
            <div className="font-display font-bold text-xl">{card.value}</div>
            <div className="text-xs text-muted-foreground">{card.label}</div>
            <div className="text-xs text-muted-foreground/70 mt-1 capitalize truncate">{card.sublabel}</div>
            {card.station && (
              <div className="text-[10px] text-muted-foreground/50 mt-1 truncate" title={card.station}>
                📍 {card.station}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}