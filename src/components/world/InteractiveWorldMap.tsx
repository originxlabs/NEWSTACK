import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ContinentData {
  id: string;
  name: string;
  storyCount: number;
  path: string;
  labelX: number;
  labelY: number;
}

interface InteractiveWorldMapProps {
  continentStats: Record<string, { storyCount: number; trend: string }>;
  onContinentClick: (continentId: string) => void;
  selectedContinent?: string | null;
}

// Simplified SVG paths for continents
const CONTINENTS: ContinentData[] = [
  {
    id: "north-america",
    name: "North America",
    storyCount: 0,
    labelX: 120,
    labelY: 100,
    path: "M 50 50 L 200 40 L 220 80 L 200 120 L 180 150 L 140 180 L 100 160 L 60 140 L 40 100 Z"
  },
  {
    id: "south-america",
    name: "South America",
    storyCount: 0,
    labelX: 150,
    labelY: 280,
    path: "M 130 200 L 180 190 L 200 230 L 190 280 L 170 340 L 140 360 L 110 320 L 100 260 L 110 220 Z"
  },
  {
    id: "europe",
    name: "Europe",
    storyCount: 0,
    labelX: 330,
    labelY: 80,
    path: "M 290 50 L 360 40 L 380 60 L 370 100 L 340 120 L 300 110 L 280 80 Z"
  },
  {
    id: "africa",
    name: "Africa",
    storyCount: 0,
    labelX: 340,
    labelY: 200,
    path: "M 290 130 L 380 120 L 400 160 L 390 240 L 360 300 L 320 290 L 280 240 L 270 180 L 280 140 Z"
  },
  {
    id: "asia",
    name: "Asia",
    storyCount: 0,
    labelX: 480,
    labelY: 100,
    path: "M 380 30 L 580 20 L 600 80 L 580 140 L 520 180 L 450 170 L 400 140 L 370 100 L 380 60 Z"
  },
  {
    id: "oceania",
    name: "Oceania",
    storyCount: 0,
    labelX: 560,
    labelY: 280,
    path: "M 500 240 L 580 230 L 620 260 L 610 300 L 560 320 L 510 300 L 490 260 Z"
  },
  {
    id: "antarctica",
    name: "Antarctica",
    storyCount: 0,
    labelX: 340,
    labelY: 370,
    path: "M 100 360 L 580 355 L 600 380 L 580 400 L 100 400 L 80 380 Z"
  }
];

export function InteractiveWorldMap({ 
  continentStats, 
  onContinentClick,
  selectedContinent 
}: InteractiveWorldMapProps) {
  
  const getStoryCount = (id: string) => continentStats[id]?.storyCount || 0;
  
  const getHeatColor = (count: number) => {
    if (count === 0) return "fill-muted/30";
    if (count < 50) return "fill-blue-500/40";
    if (count < 200) return "fill-emerald-500/50";
    if (count < 500) return "fill-amber-500/50";
    return "fill-primary/60";
  };

  return (
    <div className="relative w-full aspect-[2/1] max-w-4xl mx-auto">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/20 to-muted/5 rounded-2xl" />
      
      {/* SVG Map */}
      <svg
        viewBox="0 0 700 420"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Ocean Background */}
        <rect x="0" y="0" width="700" height="420" className="fill-background" rx="16" />
        
        {/* Grid Lines */}
        <g className="stroke-muted/20" strokeWidth="0.5">
          {[...Array(7)].map((_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 60} x2="700" y2={i * 60} />
          ))}
          {[...Array(12)].map((_, i) => (
            <line key={`v${i}`} x1={i * 60} y1="0" x2={i * 60} y2="420" />
          ))}
        </g>

        {/* Continents */}
        {CONTINENTS.map((continent, index) => {
          const count = getStoryCount(continent.id);
          const isSelected = selectedContinent === continent.id;
          
          return (
            <motion.g
              key={continent.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              className="cursor-pointer"
              onClick={() => onContinentClick(continent.id)}
            >
              {/* Continent Shape */}
              <motion.path
                d={continent.path}
                className={cn(
                  "transition-all duration-300 stroke-border",
                  getHeatColor(count),
                  isSelected && "stroke-primary stroke-2"
                )}
                strokeWidth={isSelected ? 2 : 1}
                whileHover={{ 
                  scale: 1.02,
                  filter: "brightness(1.2)"
                }}
                whileTap={{ scale: 0.98 }}
              />
              
              {/* Glow Effect for Selected */}
              {isSelected && (
                <motion.path
                  d={continent.path}
                  className="fill-primary/20 stroke-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  style={{ filter: "blur(8px)" }}
                />
              )}
              
              {/* Label */}
              <g>
                <text
                  x={continent.labelX}
                  y={continent.labelY}
                  className="fill-foreground text-[10px] font-medium pointer-events-none"
                  textAnchor="middle"
                >
                  {continent.name}
                </text>
                <text
                  x={continent.labelX}
                  y={continent.labelY + 14}
                  className="fill-muted-foreground text-[8px] pointer-events-none"
                  textAnchor="middle"
                >
                  {count > 0 ? `${count} stories` : "No stories"}
                </text>
              </g>

              {/* Pulse Indicator for Active Continents */}
              {count > 0 && (
                <motion.circle
                  cx={continent.labelX}
                  cy={continent.labelY - 20}
                  r="4"
                  className="fill-primary"
                  animate={{ 
                    scale: [1, 1.5, 1],
                    opacity: [1, 0.5, 1]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </motion.g>
          );
        })}

        {/* Legend */}
        <g transform="translate(560, 360)">
          <text className="fill-muted-foreground text-[8px]" x="0" y="0">Story Density</text>
          <rect x="0" y="8" width="20" height="8" className="fill-muted/30" />
          <rect x="24" y="8" width="20" height="8" className="fill-blue-500/40" />
          <rect x="48" y="8" width="20" height="8" className="fill-emerald-500/50" />
          <rect x="72" y="8" width="20" height="8" className="fill-amber-500/50" />
          <rect x="96" y="8" width="20" height="8" className="fill-primary/60" />
          <text className="fill-muted-foreground text-[6px]" x="0" y="26">0</text>
          <text className="fill-muted-foreground text-[6px]" x="96" y="26">500+</text>
        </g>
      </svg>

      {/* Decorative Elements */}
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs text-muted-foreground">Live Updates</span>
      </div>
    </div>
  );
}
