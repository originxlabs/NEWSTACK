import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Globe, Activity, TrendingUp, TrendingDown, AlertTriangle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface RegionData {
  id: string;
  name: string;
  code: string;
  stories: number;
  intensity: "low" | "moderate" | "high" | "critical";
  trend: "up" | "down" | "stable";
  narratives: string[];
  // SVG path coordinates (simplified world map regions)
  path: string;
  labelPosition: { x: number; y: number };
}

const regionData: RegionData[] = [
  {
    id: "na",
    name: "North America",
    code: "NA",
    stories: 234,
    intensity: "moderate",
    trend: "up",
    narratives: ["Tech earnings", "Fed policy"],
    path: "M 50 60 L 150 50 L 170 100 L 140 130 L 80 120 L 40 90 Z",
    labelPosition: { x: 100, y: 85 },
  },
  {
    id: "sa",
    name: "South America",
    code: "SA",
    stories: 78,
    intensity: "low",
    trend: "stable",
    narratives: ["Elections", "Trade"],
    path: "M 100 140 L 130 145 L 140 200 L 120 240 L 95 220 L 85 170 Z",
    labelPosition: { x: 110, y: 190 },
  },
  {
    id: "eu",
    name: "Europe",
    code: "EU",
    stories: 189,
    intensity: "moderate",
    trend: "stable",
    narratives: ["ECB rates", "Energy"],
    path: "M 200 50 L 280 45 L 290 90 L 250 100 L 200 95 Z",
    labelPosition: { x: 245, y: 70 },
  },
  {
    id: "af",
    name: "Africa",
    code: "AF",
    stories: 56,
    intensity: "low",
    trend: "stable",
    narratives: ["Climate", "Development"],
    path: "M 200 100 L 270 100 L 290 180 L 240 210 L 190 170 L 195 120 Z",
    labelPosition: { x: 235, y: 150 },
  },
  {
    id: "me",
    name: "Middle East",
    code: "ME",
    stories: 87,
    intensity: "critical",
    trend: "up",
    narratives: ["Oil", "Diplomacy"],
    path: "M 275 85 L 320 80 L 330 120 L 290 130 L 270 110 Z",
    labelPosition: { x: 300, y: 100 },
  },
  {
    id: "as",
    name: "Asia Pacific",
    code: "AS",
    stories: 312,
    intensity: "high",
    trend: "up",
    narratives: ["Trade talks", "Tech"],
    path: "M 310 50 L 420 40 L 430 130 L 350 160 L 300 120 Z",
    labelPosition: { x: 365, y: 90 },
  },
  {
    id: "oc",
    name: "Oceania",
    code: "OC",
    stories: 34,
    intensity: "low",
    trend: "stable",
    narratives: ["Climate policy"],
    path: "M 380 180 L 430 175 L 440 220 L 390 230 L 370 200 Z",
    labelPosition: { x: 405, y: 200 },
  },
];

const intensityColors = {
  low: { fill: "fill-emerald-500/20", stroke: "stroke-emerald-500/40", dot: "bg-emerald-500" },
  moderate: { fill: "fill-blue-500/20", stroke: "stroke-blue-500/40", dot: "bg-blue-500" },
  high: { fill: "fill-amber-500/30", stroke: "stroke-amber-500/50", dot: "bg-amber-500" },
  critical: { fill: "fill-red-500/30", stroke: "stroke-red-500/50", dot: "bg-red-500 animate-pulse" },
};

interface WorldMapOverlayProps {
  onRegionClick?: (regionId: string) => void;
  className?: string;
}

export function WorldMapOverlay({ onRegionClick, className }: WorldMapOverlayProps) {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [showLegend, setShowLegend] = useState(false);

  const totalStories = useMemo(() => 
    regionData.reduce((sum, r) => sum + r.stories, 0),
  []);

  const hotspotCount = useMemo(() =>
    regionData.filter(r => r.intensity === "high" || r.intensity === "critical").length,
  []);

  return (
    <div className={cn("intel-card p-4 sm:p-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium">Global Activity Map</h3>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{totalStories} stories</span>
          <span>•</span>
          <span className="text-amber-500">{hotspotCount} hotspots</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setShowLegend(!showLegend)}
          >
            <Info className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Legend (collapsible) */}
      {showLegend && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-4 pb-4 border-b border-border/50"
        >
          <div className="flex flex-wrap gap-4 text-xs">
            {Object.entries(intensityColors).map(([level, colors]) => (
              <div key={level} className="flex items-center gap-1.5">
                <div className={cn("w-2.5 h-2.5 rounded-full", colors.dot)} />
                <span className="capitalize text-muted-foreground">{level}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* SVG Map */}
      <div className="relative aspect-[2/1] sm:aspect-[2.5/1]">
        <svg
          viewBox="0 0 480 260"
          className="w-full h-full"
          style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.1))" }}
        >
          {/* Background */}
          <rect x="0" y="0" width="480" height="260" className="fill-muted/20" rx="8" />
          
          {/* Grid lines (subtle) */}
          {[...Array(5)].map((_, i) => (
            <line
              key={`h-${i}`}
              x1="0"
              y1={52 * (i + 1)}
              x2="480"
              y2={52 * (i + 1)}
              className="stroke-border/30"
              strokeWidth="0.5"
            />
          ))}
          {[...Array(7)].map((_, i) => (
            <line
              key={`v-${i}`}
              x1={60 * (i + 1)}
              y1="0"
              x2={60 * (i + 1)}
              y2="260"
              className="stroke-border/30"
              strokeWidth="0.5"
            />
          ))}

          {/* Regions */}
          <TooltipProvider>
            {regionData.map((region) => {
              const colors = intensityColors[region.intensity];
              const isHovered = hoveredRegion === region.id;
              
              return (
                <Tooltip key={region.id}>
                  <TooltipTrigger asChild>
                    <g
                      className="cursor-pointer transition-all duration-200"
                      onMouseEnter={() => setHoveredRegion(region.id)}
                      onMouseLeave={() => setHoveredRegion(null)}
                      onClick={() => onRegionClick?.(region.id)}
                    >
                      <motion.path
                        d={region.path}
                        className={cn(colors.fill, colors.stroke)}
                        strokeWidth={isHovered ? 2 : 1}
                        initial={false}
                        animate={{
                          scale: isHovered ? 1.02 : 1,
                          opacity: isHovered ? 1 : 0.8,
                        }}
                        style={{ transformOrigin: `${region.labelPosition.x}px ${region.labelPosition.y}px` }}
                      />
                      
                      {/* Activity dot */}
                      <circle
                        cx={region.labelPosition.x}
                        cy={region.labelPosition.y}
                        r={isHovered ? 6 : 4}
                        className={cn(
                          "transition-all duration-200",
                          region.intensity === "critical" ? "fill-red-500" :
                          region.intensity === "high" ? "fill-amber-500" :
                          region.intensity === "moderate" ? "fill-blue-500" : "fill-emerald-500"
                        )}
                      />
                      
                      {/* Pulse ring for high activity */}
                      {(region.intensity === "high" || region.intensity === "critical") && (
                        <motion.circle
                          cx={region.labelPosition.x}
                          cy={region.labelPosition.y}
                          r={8}
                          fill="none"
                          stroke={region.intensity === "critical" ? "#ef4444" : "#f59e0b"}
                          strokeWidth={1}
                          initial={{ opacity: 0.8, scale: 1 }}
                          animate={{ opacity: 0, scale: 2 }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                    </g>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-48">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium text-sm">{region.name}</span>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-[10px] h-4 px-1",
                            region.intensity === "critical" ? "border-red-500/30 text-red-500" :
                            region.intensity === "high" ? "border-amber-500/30 text-amber-500" :
                            "border-muted"
                          )}
                        >
                          {region.intensity}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{region.stories} stories</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          {region.trend === "up" && <TrendingUp className="w-3 h-3 text-emerald-500" />}
                          {region.trend === "down" && <TrendingDown className="w-3 h-3 text-red-500" />}
                          {region.trend === "stable" && <Activity className="w-3 h-3" />}
                          {region.trend}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {region.narratives.join(" • ")}
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </svg>
      </div>

      {/* Quick stats */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border/50">
        {regionData
          .filter(r => r.intensity === "high" || r.intensity === "critical")
          .slice(0, 3)
          .map((region) => (
            <div key={region.id} className="flex items-center gap-2 text-xs">
              <div className={cn(
                "w-2 h-2 rounded-full",
                region.intensity === "critical" ? "bg-red-500 animate-pulse" : "bg-amber-500"
              )} />
              <span className="text-muted-foreground">{region.code}</span>
              <span className="font-medium">{region.stories}</span>
            </div>
          ))}
      </div>
    </div>
  );
}
