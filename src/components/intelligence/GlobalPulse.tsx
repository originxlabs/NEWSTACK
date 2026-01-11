import { useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Activity, TrendingUp, TrendingDown, Minus, 
  Globe, AlertTriangle, Newspaper, BarChart3
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface RegionPulse {
  code: string;
  name: string;
  flag: string;
  storyCount: number;
  intensity: 1 | 2 | 3 | 4 | 5;
  sentiment: "positive" | "neutral" | "negative";
  activeNarratives: number;
  trending?: string;
}

interface GlobalPulseProps {
  regions?: RegionPulse[];
  className?: string;
}

// Mock data generator based on region stats
function generatePulseData(): RegionPulse[] {
  return [
    {
      code: "NA",
      name: "North America",
      flag: "🇺🇸",
      storyCount: 234,
      intensity: 4,
      sentiment: "neutral",
      activeNarratives: 12,
      trending: "Tech earnings",
    },
    {
      code: "EU",
      name: "Europe",
      flag: "🇪🇺",
      storyCount: 189,
      intensity: 4,
      sentiment: "negative",
      activeNarratives: 8,
      trending: "Energy policy",
    },
    {
      code: "AS",
      name: "Asia Pacific",
      flag: "🌏",
      storyCount: 312,
      intensity: 5,
      sentiment: "positive",
      activeNarratives: 15,
      trending: "Trade talks",
    },
    {
      code: "ME",
      name: "Middle East",
      flag: "🇦🇪",
      storyCount: 87,
      intensity: 5,
      sentiment: "negative",
      activeNarratives: 6,
      trending: "Oil markets",
    },
    {
      code: "AF",
      name: "Africa",
      flag: "🌍",
      storyCount: 56,
      intensity: 2,
      sentiment: "neutral",
      activeNarratives: 4,
      trending: "Climate summit",
    },
    {
      code: "SA",
      name: "South America",
      flag: "🇧🇷",
      storyCount: 78,
      intensity: 3,
      sentiment: "neutral",
      activeNarratives: 5,
      trending: "Economic reforms",
    },
  ];
}

const intensityColors: Record<number, string> = {
  1: "bg-emerald-500/20 border-emerald-500/40",
  2: "bg-emerald-500/30 border-emerald-500/50",
  3: "bg-amber-500/30 border-amber-500/50",
  4: "bg-orange-500/40 border-orange-500/60",
  5: "bg-red-500/50 border-red-500/70",
};

const sentimentConfig = {
  positive: { icon: TrendingUp, color: "text-emerald-500" },
  neutral: { icon: Minus, color: "text-muted-foreground" },
  negative: { icon: TrendingDown, color: "text-red-500" },
};

function RegionPulseCard({ region }: { region: RegionPulse }) {
  const SentimentIcon = sentimentConfig[region.sentiment].icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className={cn(
        "p-3 rounded-xl border-2 cursor-pointer transition-all",
        intensityColors[region.intensity],
        "hover:shadow-lg"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{region.flag}</span>
          <span className="font-medium text-sm">{region.name}</span>
        </div>
        <SentimentIcon className={cn("w-4 h-4", sentimentConfig[region.sentiment].color)} />
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Newspaper className="w-3 h-3" />
          <span>{region.storyCount}</span>
        </div>
        <div className="flex items-center gap-1">
          <Activity className="w-3 h-3" />
          <span>{region.activeNarratives} narratives</span>
        </div>
      </div>

      {region.trending && (
        <div className="mt-2 pt-2 border-t border-border/30">
          <span className="text-[10px] text-muted-foreground">Trending: </span>
          <span className="text-xs font-medium">{region.trending}</span>
        </div>
      )}
    </motion.div>
  );
}

export function GlobalPulse({ regions, className }: GlobalPulseProps) {
  const pulseData = useMemo(() => regions || generatePulseData(), [regions]);

  // Calculate global stats
  const totalStories = pulseData.reduce((sum, r) => sum + r.storyCount, 0);
  const totalNarratives = pulseData.reduce((sum, r) => sum + r.activeNarratives, 0);
  const hotspotsCount = pulseData.filter(r => r.intensity >= 4).length;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Global Pulse</h3>
              <p className="text-xs text-muted-foreground">
                Real-time event intensity
              </p>
            </div>
          </div>
          
          {/* Legend */}
          <div className="hidden sm:flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>Intensity:</span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map(i => (
                <div 
                  key={i} 
                  className={cn(
                    "w-3 h-3 rounded-sm border",
                    intensityColors[i]
                  )} 
                />
              ))}
            </div>
          </div>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4 p-3 rounded-lg bg-muted/50">
          <div className="text-center">
            <div className="text-lg font-bold text-foreground">{totalStories}</div>
            <div className="text-[10px] text-muted-foreground">Total Stories</div>
          </div>
          <div className="text-center border-x border-border/50">
            <div className="text-lg font-bold text-foreground">{totalNarratives}</div>
            <div className="text-[10px] text-muted-foreground">Active Narratives</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-red-500">{hotspotsCount}</div>
            <div className="text-[10px] text-muted-foreground">Hotspots</div>
          </div>
        </div>

        {/* Region Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {pulseData.map(region => (
            <RegionPulseCard key={region.code} region={region} />
          ))}
        </div>

        {/* Alert Banner */}
        {hotspotsCount >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs"
          >
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span className="text-muted-foreground">
              <span className="font-medium text-foreground">{hotspotsCount} regions</span> showing elevated news activity
            </span>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
