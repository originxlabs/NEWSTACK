import { useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Globe, TrendingUp, TrendingDown, AlertTriangle, 
  ChevronRight, Radio, Activity, Minus,
  Layers, Clock, ArrowRight, RefreshCw
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useWorldStats, RegionStats } from "@/hooks/use-world-stats";

// ===== REGION DATA STRUCTURE =====
type Region = RegionStats;

// ===== STATUS STYLES =====
const statusStyles = {
  stable: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/20",
    label: "Stable",
  },
  active: {
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/20",
    label: "Active",
  },
  hotspot: {
    bg: "bg-red-500/10",
    text: "text-red-600 dark:text-red-400",
    border: "border-red-500/20",
    label: "Hotspot",
  },
};

// ===== TREND ICON COMPONENT =====
function TrendIcon({ trend }: { trend: "up" | "down" | "stable" }) {
  if (trend === "up") {
    return <TrendingUp className="h-3.5 w-3.5 text-red-500" />;
  }
  if (trend === "down") {
    return <TrendingDown className="h-3.5 w-3.5 text-emerald-500" />;
  }
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
}

// ===== REGION CARD COMPONENT =====
// Abstract rectangular card - NO map icons, NO location markers, NO shapes
function RegionCard({ region, onClick }: { region: Region; onClick: () => void }) {
  const style = statusStyles[region.status];

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="cursor-pointer"
      onClick={onClick}
    >
      <Card className={cn(
        "h-full transition-all hover:shadow-md",
        style.border,
        region.status === "hotspot" && "ring-1 ring-red-500/20"
      )}>
        <CardContent className="p-4">
          {/* Header: Name + Status */}
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-medium text-sm">{region.name}</h3>
            <Badge 
              variant="outline" 
              className={cn("text-[10px] font-medium", style.bg, style.text, style.border)}
            >
              {region.status === "hotspot" && (
                <AlertTriangle className="h-2.5 w-2.5 mr-1" />
              )}
              {style.label}
            </Badge>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">
                Stories
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-semibold">{region.storyCount}</span>
                <TrendIcon trend={region.trend} />
              </div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">
                Narratives
              </div>
              <span className="text-lg font-semibold">{region.activeNarratives}</span>
            </div>
          </div>

          {/* Trending Narrative */}
          <div className="pt-3 border-t border-border/50">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
              Top Narrative
            </div>
            <p className="text-xs text-foreground line-clamp-2">
              {region.trendingNarrative}
            </p>
          </div>

          {/* View Details Link */}
          <div className="mt-3 flex items-center justify-end text-[10px] text-muted-foreground group-hover:text-foreground">
            <span>View details</span>
            <ChevronRight className="h-3 w-3 ml-0.5" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ===== MAIN WORLD PAGE COMPONENT =====
export default function World() {
  const navigate = useNavigate();
  const { data: regions = [], isLoading, dataUpdatedAt, refetch, isFetching } = useWorldStats();

  // Computed metrics
  const totalStories = useMemo(() => 
    regions.reduce((acc, r) => acc + r.storyCount, 0), 
  [regions]);

  const totalNarratives = useMemo(() => 
    regions.reduce((acc, r) => acc + r.activeNarratives, 0), 
  [regions]);

  const hotspotRegions = useMemo(() => 
    regions.filter(r => r.status === "hotspot"),
  [regions]);

  // Format last updated time
  const lastUpdated = useMemo(() => {
    if (!dataUpdatedAt) return "Loading...";
    const diff = Math.floor((Date.now() - dataUpdatedAt) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  }, [dataUpdatedAt]);

  const handleRegionClick = (region: Region) => {
    // Navigate to filtered news view for this region
    navigate(`/news?region=${region.id}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <main className="pt-14">
        {/* Page Header */}
        <section className="border-b border-border/50 bg-muted/20">
          <div className="container mx-auto max-w-5xl px-4 py-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline" className="gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                  <Radio className="w-2.5 h-2.5" />
                  LIVE
                </Badge>
                <button 
                  onClick={() => refetch()}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isFetching}
                >
                  <RefreshCw className={cn("w-3 h-3", isFetching && "animate-spin")} />
                  {lastUpdated}
                </button>
              </div>

              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-foreground mb-2">
                Global Intelligence Overview
              </h1>
              <p className="text-muted-foreground max-w-2xl text-sm">
                Aggregated news intensity and narrative activity by world region. 
                Data derived from 174 verified sources across all tiers.
              </p>

              {/* Global Metrics */}
              <div className="flex flex-wrap items-center gap-6 mt-6">
                <div className="flex items-center gap-2 text-sm">
                  <Layers className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{totalStories.toLocaleString()}</span>
                  <span className="text-muted-foreground">total stories</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Activity className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{totalNarratives}</span>
                  <span className="text-muted-foreground">active narratives</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{regions.length}</span>
                  <span className="text-muted-foreground">regions tracked</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">48h</span>
                  <span className="text-muted-foreground">window</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ===== GLOBAL ACTIVITY OVERVIEW ===== */}
        {/* This is an ABSTRACT REGION GRID - NO maps, NO geography */}
        <section className="py-8">
          <div className="container mx-auto max-w-5xl px-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-medium text-base">Global Activity Overview</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Aggregated news intensity and narrative activity by world region
                </p>
              </div>
            </div>

            {/* Region Grid - Abstract rectangular cards, NOT a map */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-48 bg-muted/50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {regions.map((region, index) => (
                  <motion.div
                    key={region.id}
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
            )}
          </div>
        </section>

        {/* ===== HOTSPOT SUMMARY ===== */}
        {/* Calm, informational alert - NOT alarming */}
        {hotspotRegions.length > 0 && !isLoading && (
          <section className="py-4">
            <div className="container mx-auto max-w-5xl px-4">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-amber-500/20 bg-amber-500/5">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Activity className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-foreground">
                          <span className="font-medium">{hotspotRegions.length} region{hotspotRegions.length > 1 ? 's' : ''}</span>
                          {' '}showing elevated news activity based on rapid multi-source reporting.
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {hotspotRegions.map((region) => (
                            <Badge 
                              key={region.id}
                              variant="outline"
                              className="text-xs cursor-pointer bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/20"
                              onClick={() => handleRegionClick(region)}
                            >
                              {region.name}
                              <ArrowRight className="h-2.5 w-2.5 ml-1" />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </section>
        )}

        {/* ===== METHODOLOGY NOTE ===== */}
        <section className="py-6">
          <div className="container mx-auto max-w-5xl px-4">
            <Card className="bg-muted/30 border-border/50">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Methodology:</span>
                  {' '}Regional activity is calculated from story clusters verified across multiple 
                  independent sources. Hotspot status is assigned when a region shows elevated 
                  story volume with high-confidence reporting from primary wire services. 
                  This visualization reflects reporting intensity, not editorial judgment about importance.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
