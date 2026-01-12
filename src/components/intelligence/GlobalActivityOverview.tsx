import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, TrendingDown, Minus, AlertTriangle, Activity, Globe, RefreshCw, Radio 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface RegionData {
  id: string;
  name: string;
  shortName: string;
  storyCount: number;
  intensity: "low" | "moderate" | "high" | "critical";
  trend: "up" | "down" | "stable";
  hotTopics: string[];
}

// Country code to region mapping
const countryToRegion: Record<string, string> = {
  US: "north-america", CA: "north-america", MX: "north-america",
  GB: "europe", FR: "europe", DE: "europe", IT: "europe", ES: "europe",
  NL: "europe", BE: "europe", CH: "europe", AT: "europe", SE: "europe",
  NO: "europe", DK: "europe", FI: "europe", PL: "europe", PT: "europe",
  IE: "europe", GR: "europe", CZ: "europe", RO: "europe", HU: "europe",
  UA: "europe", RU: "europe",
  CN: "asia-pacific", JP: "asia-pacific", KR: "asia-pacific", IN: "asia-pacific",
  AU: "asia-pacific", NZ: "asia-pacific", SG: "asia-pacific", MY: "asia-pacific",
  TH: "asia-pacific", VN: "asia-pacific", PH: "asia-pacific", ID: "asia-pacific",
  TW: "asia-pacific", HK: "asia-pacific", PK: "asia-pacific", BD: "asia-pacific",
  LK: "asia-pacific", NP: "asia-pacific",
  AE: "middle-east", SA: "middle-east", IL: "middle-east", TR: "middle-east",
  IR: "middle-east", IQ: "middle-east", QA: "middle-east", KW: "middle-east",
  BH: "middle-east", OM: "middle-east", JO: "middle-east", LB: "middle-east",
  SY: "middle-east", YE: "middle-east", PS: "middle-east",
  ZA: "africa", EG: "africa", NG: "africa", KE: "africa", GH: "africa",
  ET: "africa", TZ: "africa", UG: "africa", MA: "africa", DZ: "africa",
  TN: "africa", SN: "africa", CI: "africa", CM: "africa",
  BR: "south-america", AR: "south-america", CL: "south-america", CO: "south-america",
  PE: "south-america", VE: "south-america", EC: "south-america", UY: "south-america",
  PY: "south-america", BO: "south-america",
};

const regionConfigs = [
  { id: "north-america", name: "North America", shortName: "NA" },
  { id: "south-america", name: "South America", shortName: "SA" },
  { id: "europe", name: "Europe", shortName: "EU" },
  { id: "africa", name: "Africa", shortName: "AF" },
  { id: "middle-east", name: "Middle East", shortName: "ME" },
  { id: "asia-pacific", name: "Asia Pacific", shortName: "AP" },
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
  refreshInterval?: number; // ms, default 60000 (1 min)
}

export function GlobalActivityOverview({ 
  onRegionClick, 
  className,
  refreshInterval = 60000,
}: GlobalActivityOverviewProps) {
  const navigate = useNavigate();
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [regionData, setRegionData] = useState<RegionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const cutoff = new Date();
      cutoff.setHours(cutoff.getHours() - 48);

      const { data: stories, error } = await supabase
        .from("stories")
        .select("country_code, category, headline, created_at")
        .gte("created_at", cutoff.toISOString());

      if (error) throw error;

      // Group by region
      const regionMap: Record<string, { stories: any[]; categories: Record<string, number> }> = {};
      for (const config of regionConfigs) {
        regionMap[config.id] = { stories: [], categories: {} };
      }

      for (const story of stories || []) {
        const region = story.country_code ? countryToRegion[story.country_code] : null;
        if (region && regionMap[region]) {
          regionMap[region].stories.push(story);
          if (story.category) {
            regionMap[region].categories[story.category] = 
              (regionMap[region].categories[story.category] || 0) + 1;
          }
        }
      }

      // Calculate stats for each region
      const now = new Date();
      const last12h = new Date(now.getTime() - 12 * 60 * 60 * 1000);

      const data: RegionData[] = regionConfigs.map(config => {
        const { stories: regionStories, categories } = regionMap[config.id];
        const storyCount = regionStories.length;

        // Top topics
        const topCategories = Object.entries(categories)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 2)
          .map(([cat]) => cat.charAt(0).toUpperCase() + cat.slice(1));

        // Intensity
        let intensity: RegionData["intensity"] = "low";
        if (storyCount > 100) intensity = "critical";
        else if (storyCount > 50) intensity = "high";
        else if (storyCount > 20) intensity = "moderate";

        // Trend
        const recentCount = regionStories.filter(
          s => new Date(s.created_at) >= last12h
        ).length;
        let trend: RegionData["trend"] = "stable";
        if (storyCount > 0) {
          const ratio = recentCount / storyCount;
          if (ratio > 0.6) trend = "up";
          else if (ratio < 0.3) trend = "down";
        }

        return {
          id: config.id,
          name: config.name,
          shortName: config.shortName,
          storyCount,
          intensity,
          trend,
          hotTopics: topCategories.length > 0 ? topCategories : ["General"],
        };
      });

      setRegionData(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to fetch global activity:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, refreshInterval]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const handleRegionClick = (regionId: string) => {
    if (onRegionClick) {
      onRegionClick(regionId);
    } else {
      navigate(`/news?region=${regionId}`);
    }
  };

  const totalStories = useMemo(() => 
    regionData.reduce((sum, r) => sum + r.storyCount, 0), 
    [regionData]
  );

  const hotspotCount = useMemo(() => 
    regionData.filter(r => r.intensity === "high" || r.intensity === "critical").length,
    [regionData]
  );

  const formatTime = (date: Date) => {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

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
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Radio className="w-2.5 h-2.5 text-emerald-500 animate-pulse" />
              <span>Live</span>
              {lastUpdated && <span>• {formatTime(lastUpdated)}</span>}
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-1 hover:bg-muted rounded transition-colors"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
          <div className="flex items-center gap-1.5">
            <Activity className="h-4 w-4" />
            <span>{totalStories.toLocaleString()} stories</span>
          </div>
          {hotspotCount > 0 && (
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              <span>{hotspotCount} hotspot{hotspotCount > 1 ? "s" : ""}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        {isLoading ? (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Regional Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
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
                    onClick={() => handleRegionClick(region.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium truncate">{region.shortName}</span>
                        <TrendIcon trend={region.trend} />
                      </div>
                      <div className={cn("text-lg font-semibold", style.text)}>
                        {region.storyCount}
                      </div>
                      <IntensityDots intensity={region.intensity} />
                    </div>

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

            {/* High Activity Regions */}
            {hotspotCount > 0 && (
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
                        onClick={() => handleRegionClick(region.id)}
                      >
                        {region.name}: {region.storyCount}
                      </Badge>
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
