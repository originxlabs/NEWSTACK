import { motion } from "framer-motion";
import { Thermometer, Cloud, Wind, Droplets } from "lucide-react";
import { PlaceData } from "@/hooks/use-places";
import { PlaceSkeleton } from "./PlaceSkeleton";

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

export function LiveStatusStrip({ placeData, isLoading }: LiveStatusStripProps) {
  const { weather, aqi } = placeData;

  if (isLoading) {
    return (
      <div className="py-6">
        <PlaceSkeleton type="weather" />
      </div>
    );
  }

  if (!weather?.current && !aqi) return null;

  const statusCards = [];

  if (weather?.current) {
    statusCards.push(
      {
        icon: Thermometer,
        value: `${weather.current.temp}°C`,
        label: "Temperature",
        sublabel: `Feels like ${weather.current.feels_like}°C`,
        gradient: "from-primary/20 to-primary/5",
        iconColor: "text-primary",
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
      sublabel: aqi.category,
      gradient: getAqiBg(aqi.aqi),
      iconColor: getAqiColor(aqi.aqi),
    });
  }

  return (
    <div className="py-6 overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-xs text-muted-foreground font-medium">
          Live • Updated just now
        </span>
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
            <div className="text-xs text-muted-foreground/70 mt-1 capitalize">{card.sublabel}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
