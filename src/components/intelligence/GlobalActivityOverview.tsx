import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Activity, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface RegionData {
  id: string;
  name: string;
  shortName: string;
  storyCount: number;
  intensity: "low" | "moderate" | "high" | "critical";
  trend: "up" | "down" | "stable";
  hotTopics: string[];
}

// Abstract regional data - no geographic coordinates
const regionData: RegionData[] = [
  {
    id: "north-america",
    name: "North America",
    shortName: "NA",
    storyCount: 234,
    intensity: "moderate",
    trend: "up",
    hotTopics: ["US Politics", "Tech"],
  },
  {
    id: "south-america",
    name: "South America",
    shortName: "SA",
    storyCount: 78,
    intensity: "low",
    trend: "stable",
    hotTopics: ["Economy", "Climate"],
  },
  {
    id: "europe",
    name: "Europe",
    shortName: "EU",
    storyCount: 189,
    intensity: "moderate",
    trend: "down",
    hotTopics: ["Defense", "Energy"],
  },
  {
    id: "africa",
    name: "Africa",
    shortName: "AF",
    storyCount: 56,
    intensity: "low",
    trend: "stable",
    hotTopics: ["Development", "Health"],
  },
  {
    id: "middle-east",
    name: "Middle East",
    shortName: "ME",
    storyCount: 312,
    intensity: "critical",
    trend: "up",
    hotTopics: ["Conflict", "Diplomacy"],
  },
  {
    id: "south-asia",
    name: "South Asia",
    shortName: "SA",
    storyCount: 167,
    intensity: "high",
    trend: "up",
    hotTopics: ["India", "Politics"],
  },
  {
    id: "east-asia",
    name: "East Asia",
    shortName: "EA",
    storyCount: 198,
    intensity: "moderate",
    trend: "stable",
    hotTopics: ["China", "Tech"],
  },
  {
    id: "oceania",
    name: "Oceania",
    shortName: "OC",
    storyCount: 34,
    intensity: "low",
    trend: "down",
    hotTopics: ["Climate", "Trade"],
  },
];

const intensityStyles = {
  low: {
    bg: "bg-muted/50",
    border: "border-border",
    text: "text-muted-foreground",
    dots: 1,
  },
  moderate: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-600 dark:text-blue-400",
    dots: 2,
  },
  high: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-600 dark:text-amber-400",
    dots: 3,
  },
  critical: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    text: "text-red-600 dark:text-red-400",
    dots: 4,
  },
};

interface GlobalActivityOverviewProps {
  onRegionClick?: (regionId: string) => void;
  className?: string;
}

export function GlobalActivityOverview({ onRegionClick, className }: GlobalActivityOverviewProps) {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const totalStories = useMemo(
    () => regionData.reduce((sum, r) => sum + r.storyCount, 0),
    []
  );

  const hotspotCount = useMemo(
    () => regionData.filter(r => r.intensity === "high" || r.intensity === "critical").length,
    []
  );

  const TrendIcon = ({ trend }: { trend: "up" | "down" | "stable" }) => {
    if (trend === "up") return <TrendingUp className="h-3 w-3 text-red-500" />;
    if (trend === "down") return <TrendingDown className="h-3 w-3 text-emerald-500" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  const IntensityDots = ({ intensity }: { intensity: RegionData["intensity"] }) => {
    const count = intensityStyles[intensity].dots;
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              i < count ? intensityStyles[intensity].text.replace("text-", "bg-") : "bg-muted"
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg font-medium">Global Activity Overview</CardTitle>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Activity className="h-4 w-4" />
              <span>{totalStories} stories</span>
            </div>
            {hotspotCount > 0 && (
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                <span>{hotspotCount} hotspot{hotspotCount > 1 ? "s" : ""}</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        {/* Abstract Regional Grid */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {regionData.map((region) => {
            const style = intensityStyles[region.intensity];
            const isHovered = hoveredRegion === region.id;

            return (
              <motion.div
                key={region.id}
                className={cn(
                  "relative rounded-lg border p-3 cursor-pointer transition-all",
                  style.bg,
                  style.border,
                  isHovered && "ring-2 ring-primary/50"
                )}
                onMouseEnter={() => setHoveredRegion(region.id)}
                onMouseLeave={() => setHoveredRegion(null)}
                onClick={() => onRegionClick?.(region.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex flex-col gap-1.5">
                  {/* Region header */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium truncate">
                      {region.shortName}
                    </span>
                    <TrendIcon trend={region.trend} />
                  </div>

                  {/* Story count */}
                  <div className={cn("text-lg font-semibold", style.text)}>
                    {region.storyCount}
                  </div>

                  {/* Intensity indicator */}
                  <IntensityDots intensity={region.intensity} />
                </div>

                {/* Tooltip on hover */}
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute left-0 right-0 -bottom-1 translate-y-full z-10"
                  >
                    <div className="bg-popover border rounded-md shadow-lg p-2 mx-1">
                      <div className="text-xs font-medium">{region.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {region.hotTopics.join(", ")}
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Intensity Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t">
          {(["low", "moderate", "high", "critical"] as const).map((level) => (
            <div key={level} className="flex items-center gap-1.5 text-xs">
              <IntensityDots intensity={level} />
              <span className="text-muted-foreground capitalize">{level}</span>
            </div>
          ))}
        </div>

        {/* Quick Stats - High Activity Regions */}
        <div className="mt-4 pt-3 border-t">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            High Activity Regions
          </div>
          <div className="flex flex-wrap gap-1.5">
            {regionData
              .filter(r => r.intensity === "high" || r.intensity === "critical")
              .sort((a, b) => b.storyCount - a.storyCount)
              .map((region) => (
                <Badge
                  key={region.id}
                  variant="outline"
                  className={cn(
                    "text-xs cursor-pointer",
                    intensityStyles[region.intensity].text,
                    intensityStyles[region.intensity].border
                  )}
                  onClick={() => onRegionClick?.(region.id)}
                >
                  {region.name}: {region.storyCount}
                </Badge>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
