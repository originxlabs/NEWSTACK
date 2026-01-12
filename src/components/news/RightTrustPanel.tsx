import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, AlertTriangle, TrendingUp, ChevronDown, Info, Layers, 
  CheckCircle2, RefreshCw, Globe, Building2, Newspaper, Radio
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface SourceStats {
  totalSources: number;
  primarySources: number;
  secondarySources: number;
  tier1Count: number;
  tier2Count: number;
  tier3Count: number;
  wireAgencies: number;
  broadcasters: number;
  newspapers: number;
  contradictionsDetected: number;
  verifiedSources: number;
  lastUpdated: Date;
}

interface RightTrustPanelProps {
  className?: string;
  refreshInterval?: number; // ms, default 60000 (1 min)
}

// Known wire agencies
const WIRE_AGENCIES = ["Reuters", "AP", "AFP", "PTI", "Yonhap", "Xinhua", "TASS", "ANSA"];
const BROADCASTERS = ["BBC", "CNN", "Al Jazeera", "NPR", "NBC", "CBS", "ABC", "Sky News", "DW", "France 24", "NDTV"];
const NEWSPAPERS = ["Times", "Post", "Guardian", "Hindu", "Journal", "Tribune", "Telegraph", "Herald"];

export function RightTrustPanel({
  className,
  refreshInterval = 60000,
}: RightTrustPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showExplainer, setShowExplainer] = useState(false);
  const [stats, setStats] = useState<SourceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      // Fetch unique sources from story_sources in last 48h
      const cutoff = new Date();
      cutoff.setHours(cutoff.getHours() - 48);

      const { data: sources, error } = await supabase
        .from("story_sources")
        .select("source_name, reliability_tier, is_primary_reporting")
        .gte("created_at", cutoff.toISOString());

      if (error) throw error;

      // Calculate stats
      const uniqueSources = new Set<string>();
      let tier1 = 0, tier2 = 0, tier3 = 0;
      let primary = 0, secondary = 0;
      let wires = 0, broadcasters = 0, newspapers = 0;
      let verified = 0;

      for (const src of sources || []) {
        const name = src.source_name || "";
        uniqueSources.add(name);

        if (src.reliability_tier === "tier_1") tier1++;
        else if (src.reliability_tier === "tier_2") tier2++;
        else tier3++;

        if (src.is_primary_reporting) primary++;
        else secondary++;

        // Categorize by type
        if (WIRE_AGENCIES.some(w => name.includes(w))) wires++;
        else if (BROADCASTERS.some(b => name.includes(b))) broadcasters++;
        else if (NEWSPAPERS.some(n => name.includes(n))) newspapers++;

        if (src.reliability_tier === "tier_1" || src.reliability_tier === "tier_2") {
          verified++;
        }
      }

      // Count contradictions from stories
      const { count: contradictions } = await supabase
        .from("stories")
        .select("*", { count: "exact", head: true })
        .eq("has_contradictions", true)
        .gte("created_at", cutoff.toISOString());

      setStats({
        totalSources: uniqueSources.size,
        primarySources: primary,
        secondarySources: secondary,
        tier1Count: tier1,
        tier2Count: tier2,
        tier3Count: tier3,
        wireAgencies: wires,
        broadcasters,
        newspapers,
        contradictionsDetected: contradictions || 0,
        verifiedSources: verified,
        lastUpdated: new Date(),
      });
    } catch (err) {
      console.error("Failed to fetch trust stats:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchStats, refreshInterval]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchStats();
  };

  const diversityScore = useMemo(() => {
    if (!stats) return 0;
    // Score based on: source count, tier distribution, type variety
    const sourceScore = Math.min(stats.totalSources / 50, 1) * 30;
    const tierScore = (stats.tier1Count / (stats.tier1Count + stats.tier2Count + stats.tier3Count + 1)) * 30;
    const varietyScore = ((stats.wireAgencies > 0 ? 1 : 0) + (stats.broadcasters > 0 ? 1 : 0) + (stats.newspapers > 0 ? 1 : 0)) / 3 * 40;
    return Math.min(100, Math.round(sourceScore + tierScore + varietyScore));
  }, [stats]);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <aside className={cn("hidden xl:block w-56 flex-shrink-0", className)}>
      <div className="sticky top-20 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-3 h-3" />
            Trust Signals
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("w-3 h-3", isRefreshing && "animate-spin")} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isCollapsed && "-rotate-90")} />
            </Button>
          </div>
        </div>

        {!isCollapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Live indicator */}
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <Radio className="w-2.5 h-2.5 text-emerald-500 animate-pulse" />
              <span>Live • Updated {stats ? formatTime(stats.lastUpdated) : "..."}</span>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                <div className="h-24 bg-muted/50 rounded-lg animate-pulse" />
                <div className="h-16 bg-muted/50 rounded-lg animate-pulse" />
              </div>
            ) : stats && (
              <>
                {/* Source Diversity */}
                <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">Source Diversity</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] h-5",
                        diversityScore >= 70
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : diversityScore >= 40
                          ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                          : "bg-red-500/10 text-red-600 border-red-500/20"
                      )}
                    >
                      {diversityScore}%
                    </Badge>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${diversityScore}%` }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className={cn(
                        "h-full rounded-full",
                        diversityScore >= 70
                          ? "bg-emerald-500"
                          : diversityScore >= 40
                          ? "bg-amber-500"
                          : "bg-red-500"
                      )}
                    />
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Primary</span>
                      <p className="font-medium">{stats.primarySources.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Secondary</span>
                      <p className="font-medium">{stats.secondarySources.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Source Tiers */}
                <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2">
                  <span className="text-xs font-medium">Source Tiers</span>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        Tier 1 (Wire/Major)
                      </span>
                      <span className="font-medium">{stats.tier1Count}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        Tier 2 (Verified)
                      </span>
                      <span className="font-medium">{stats.tier2Count}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-gray-400" />
                        Tier 3 (Other)
                      </span>
                      <span className="font-medium">{stats.tier3Count}</span>
                    </div>
                  </div>
                </div>

                {/* Media Types */}
                <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2">
                  <span className="text-xs font-medium">Media Types</span>
                  <div className="flex flex-wrap gap-1.5">
                    {stats.wireAgencies > 0 && (
                      <Badge variant="outline" className="text-[10px] gap-1">
                        <Globe className="w-2.5 h-2.5" />
                        Wire: {stats.wireAgencies}
                      </Badge>
                    )}
                    {stats.broadcasters > 0 && (
                      <Badge variant="outline" className="text-[10px] gap-1">
                        <Radio className="w-2.5 h-2.5" />
                        Broadcast: {stats.broadcasters}
                      </Badge>
                    )}
                    {stats.newspapers > 0 && (
                      <Badge variant="outline" className="text-[10px] gap-1">
                        <Newspaper className="w-2.5 h-2.5" />
                        Print: {stats.newspapers}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Verified Sources */}
                <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-xs font-medium text-emerald-600">
                      {stats.verifiedSources.toLocaleString()} Verified Sources
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    From {stats.totalSources} unique sources tracked in last 48h
                  </p>
                </div>

                {/* Contradictions */}
                {stats.contradictionsDetected > 0 && (
                  <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-xs font-medium text-amber-600">
                        Contradictions Detected
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {stats.contradictionsDetected} stories have conflicting reports.
                    </p>
                  </div>
                )}

                <Separator className="opacity-50" />

                {/* How confidence works */}
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground gap-1.5 font-normal"
                    onClick={() => setShowExplainer(!showExplainer)}
                  >
                    <Info className="w-3 h-3" />
                    How confidence is determined
                    <ChevronDown className={cn("w-3 h-3 transition-transform ml-auto", showExplainer && "rotate-180")} />
                  </Button>

                  <AnimatePresence>
                    {showExplainer && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-3 space-y-2 text-[11px] text-muted-foreground">
                          <div className="flex items-start gap-2">
                            <Layers className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span>Independent source count</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span>Primary reporting presence</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span>Contradictions detected</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <TrendingUp className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span>Update consistency</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
          </motion.div>
        )}
      </div>
    </aside>
  );
}
