import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Globe, TrendingUp, AlertTriangle, MapPin, 
  ChevronRight, Radio, ArrowUpRight, Activity,
  Layers, Clock
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useNavigate } from "react-router-dom";
import { GlobalPulse } from "@/components/intelligence";

interface Region {
  code: string;
  name: string;
  flag: string;
  stories: number;
  trending: string[];
  status: "stable" | "active" | "hotspot";
  sentiment: "positive" | "neutral" | "negative";
  changeDirection: "up" | "down" | "stable";
}

const regions: Region[] = [
  { 
    code: "NA", 
    name: "North America", 
    flag: "🇺🇸", 
    stories: 234, 
    trending: ["Tech earnings", "Fed policy", "Elections"],
    status: "active", 
    sentiment: "neutral",
    changeDirection: "up"
  },
  { 
    code: "EU", 
    name: "Europe", 
    flag: "🇪🇺", 
    stories: 189, 
    trending: ["Energy markets", "ECB rates", "Ukraine"],
    status: "active", 
    sentiment: "neutral",
    changeDirection: "stable"
  },
  { 
    code: "AS", 
    name: "Asia Pacific", 
    flag: "🌏", 
    stories: 312, 
    trending: ["Trade talks", "Tech sector", "Markets"],
    status: "hotspot", 
    sentiment: "positive",
    changeDirection: "up"
  },
  { 
    code: "ME", 
    name: "Middle East", 
    flag: "🌍", 
    stories: 87, 
    trending: ["Oil production", "Diplomacy", "Infrastructure"],
    status: "hotspot", 
    sentiment: "negative",
    changeDirection: "up"
  },
  { 
    code: "AF", 
    name: "Africa", 
    flag: "🌍", 
    stories: 56, 
    trending: ["Climate summit", "Development", "Resources"],
    status: "stable", 
    sentiment: "neutral",
    changeDirection: "stable"
  },
  { 
    code: "SA", 
    name: "South America", 
    flag: "🌎", 
    stories: 78, 
    trending: ["Economic reforms", "Elections", "Trade"],
    status: "stable", 
    sentiment: "neutral",
    changeDirection: "down"
  },
];

const globalMetrics = [
  { label: "Total Stories", value: "956", icon: Layers },
  { label: "Active Regions", value: "6", icon: Globe },
  { label: "Hotspots", value: "2", icon: AlertTriangle },
  { label: "Updated", value: "2m ago", icon: Clock },
];

function RegionCard({ region, onClick }: { region: Region; onClick: () => void }) {
  const statusColors = {
    stable: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    active: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    hotspot: "bg-red-500/10 text-red-600 border-red-500/20",
  };

  const directionIcons = {
    up: <TrendingUp className="w-3 h-3 text-emerald-500" />,
    down: <TrendingUp className="w-3 h-3 text-red-500 rotate-180" />,
    stable: <Activity className="w-3 h-3 text-muted-foreground" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group cursor-pointer"
      onClick={onClick}
    >
      <div className="intel-card p-4 h-full hover:border-primary/30 transition-all">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{region.flag}</span>
            <div>
              <h3 className="font-medium text-sm">{region.name}</h3>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {directionIcons[region.changeDirection]}
                <span>{region.stories} stories</span>
              </div>
            </div>
          </div>
          <Badge variant="outline" className={`text-[10px] ${statusColors[region.status]}`}>
            {region.status}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Active narratives
          </div>
          <div className="flex flex-wrap gap-1">
            {region.trending.slice(0, 3).map((topic, i) => (
              <Badge 
                key={i} 
                variant="secondary" 
                className="text-[10px] px-1.5 py-0 h-5 font-normal"
              >
                {topic}
              </Badge>
            ))}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">View details</span>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </motion.div>
  );
}

export default function World() {
  const { country } = usePreferences();
  const navigate = useNavigate();
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const handleRegionClick = (region: Region) => {
    setSelectedRegion(region);
  };

  const totalStories = useMemo(() => 
    regions.reduce((acc, r) => acc + r.stories, 0), 
  []);

  const hotspotCount = useMemo(() => 
    regions.filter(r => r.status === "hotspot").length,
  []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <main className="pt-14">
        {/* Page Header */}
        <section className="border-b border-border/50 bg-muted/20">
          <div className="container mx-auto max-w-6xl px-4 py-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline" className="gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                  <Radio className="w-2.5 h-2.5" />
                  LIVE
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Updated every 15 minutes
                </span>
              </div>

              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-foreground mb-2">
                Global Pulse
              </h1>
              <p className="text-muted-foreground max-w-2xl text-sm">
                Real-time news intensity and narrative tracking across world regions. 
                Data derived from 66+ verified sources.
              </p>

              {/* Metrics */}
              <div className="flex flex-wrap items-center gap-6 mt-6">
                {globalMetrics.map((metric, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <metric.icon className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{metric.value}</span>
                    <span className="text-muted-foreground">{metric.label.toLowerCase()}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Global Pulse Component */}
        <section className="py-6">
          <div className="container mx-auto max-w-6xl px-4">
            <GlobalPulse />
          </div>
        </section>

        {/* Regional Breakdown */}
        <section className="py-6">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-medium text-sm">Regional Breakdown</h2>
              <span className="text-xs text-muted-foreground">{regions.length} regions tracked</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {regions.map((region, index) => (
                <motion.div
                  key={region.code}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <RegionCard 
                    region={region} 
                    onClick={() => handleRegionClick(region)} 
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Hotspot Alert */}
        {hotspotCount > 0 && (
          <section className="py-6">
            <div className="container mx-auto max-w-6xl px-4">
              <div className="intel-card p-4 border-amber-500/20 bg-amber-500/5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-sm mb-1">
                      {hotspotCount} Active Hotspot{hotspotCount > 1 ? 's' : ''} Detected
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Elevated news activity detected in {regions.filter(r => r.status === "hotspot").map(r => r.name).join(" and ")}. 
                      Multiple sources reporting on developing situations.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
