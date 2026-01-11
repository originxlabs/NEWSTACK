import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Country code to region mapping
const countryToRegion: Record<string, string> = {
  // North America
  US: "north-america",
  CA: "north-america",
  MX: "north-america",
  
  // Europe
  GB: "europe",
  FR: "europe",
  DE: "europe",
  IT: "europe",
  ES: "europe",
  NL: "europe",
  BE: "europe",
  CH: "europe",
  AT: "europe",
  SE: "europe",
  NO: "europe",
  DK: "europe",
  FI: "europe",
  PL: "europe",
  PT: "europe",
  IE: "europe",
  GR: "europe",
  CZ: "europe",
  RO: "europe",
  HU: "europe",
  UA: "europe",
  RU: "europe",
  
  // Asia Pacific
  CN: "asia-pacific",
  JP: "asia-pacific",
  KR: "asia-pacific",
  IN: "asia-pacific",
  AU: "asia-pacific",
  NZ: "asia-pacific",
  SG: "asia-pacific",
  MY: "asia-pacific",
  TH: "asia-pacific",
  VN: "asia-pacific",
  PH: "asia-pacific",
  ID: "asia-pacific",
  TW: "asia-pacific",
  HK: "asia-pacific",
  PK: "asia-pacific",
  BD: "asia-pacific",
  LK: "asia-pacific",
  NP: "asia-pacific",
  
  // Middle East
  AE: "middle-east",
  SA: "middle-east",
  IL: "middle-east",
  TR: "middle-east",
  IR: "middle-east",
  IQ: "middle-east",
  QA: "middle-east",
  KW: "middle-east",
  BH: "middle-east",
  OM: "middle-east",
  JO: "middle-east",
  LB: "middle-east",
  SY: "middle-east",
  YE: "middle-east",
  PS: "middle-east",
  
  // Africa
  ZA: "africa",
  EG: "africa",
  NG: "africa",
  KE: "africa",
  GH: "africa",
  ET: "africa",
  TZ: "africa",
  UG: "africa",
  MA: "africa",
  DZ: "africa",
  TN: "africa",
  SN: "africa",
  CI: "africa",
  CM: "africa",
  
  // South America
  BR: "south-america",
  AR: "south-america",
  CL: "south-america",
  CO: "south-america",
  PE: "south-america",
  VE: "south-america",
  EC: "south-america",
  UY: "south-america",
  PY: "south-america",
  BO: "south-america",
};

export interface RegionStats {
  id: string;
  name: string;
  storyCount: number;
  activeNarratives: number;
  status: "stable" | "active" | "hotspot";
  trendingNarrative: string;
  trend: "up" | "down" | "stable";
  topCategories: string[];
}

interface StoryRow {
  country_code: string | null;
  category: string | null;
  headline: string;
  confidence_level: string | null;
  created_at: string;
}

export function useWorldStats() {
  return useQuery({
    queryKey: ["world-stats"],
    queryFn: async (): Promise<RegionStats[]> => {
      // Fetch stories from last 48 hours
      const cutoff = new Date();
      cutoff.setHours(cutoff.getHours() - 48);
      
      const { data: stories, error } = await supabase
        .from("stories")
        .select("country_code, category, headline, confidence_level, created_at")
        .gte("created_at", cutoff.toISOString())
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching world stats:", error);
        throw error;
      }

      // Group stories by region
      const regionMap: Record<string, StoryRow[]> = {
        "north-america": [],
        "europe": [],
        "asia-pacific": [],
        "middle-east": [],
        "africa": [],
        "south-america": [],
      };

      for (const story of stories || []) {
        const region = story.country_code 
          ? countryToRegion[story.country_code] || null
          : null;
        
        if (region && regionMap[region]) {
          regionMap[region].push(story);
        }
      }

      // Calculate stats for each region
      const regionConfigs: { id: string; name: string }[] = [
        { id: "north-america", name: "North America" },
        { id: "europe", name: "Europe" },
        { id: "asia-pacific", name: "Asia Pacific" },
        { id: "middle-east", name: "Middle East" },
        { id: "africa", name: "Africa" },
        { id: "south-america", name: "South America" },
      ];

      const regionStats: RegionStats[] = regionConfigs.map(({ id, name }) => {
        const regionStories = regionMap[id] || [];
        const storyCount = regionStories.length;
        
        // Count unique categories as "narratives"
        const categories = new Set<string>();
        const categoryCount: Record<string, number> = {};
        
        for (const story of regionStories) {
          if (story.category) {
            categories.add(story.category);
            categoryCount[story.category] = (categoryCount[story.category] || 0) + 1;
          }
        }

        // Get top categories
        const topCategories = Object.entries(categoryCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([cat]) => cat);

        // Determine status based on story count thresholds
        let status: "stable" | "active" | "hotspot" = "stable";
        if (storyCount > 100) {
          status = "hotspot";
        } else if (storyCount > 30) {
          status = "active";
        }

        // Calculate trend based on recent vs older stories
        const now = new Date();
        const last12h = new Date(now.getTime() - 12 * 60 * 60 * 1000);
        const recentCount = regionStories.filter(
          (s) => new Date(s.created_at) >= last12h
        ).length;
        const olderCount = storyCount - recentCount;
        
        let trend: "up" | "down" | "stable" = "stable";
        if (storyCount > 0) {
          const recentRatio = recentCount / storyCount;
          if (recentRatio > 0.6) {
            trend = "up";
          } else if (recentRatio < 0.3) {
            trend = "down";
          }
        }

        // Get trending narrative from most common category
        const trendingNarrative = topCategories[0] 
          ? `${topCategories[0].charAt(0).toUpperCase() + topCategories[0].slice(1)} stories dominating`
          : "No dominant narrative";

        return {
          id,
          name,
          storyCount,
          activeNarratives: categories.size,
          status,
          trendingNarrative,
          trend,
          topCategories,
        };
      });

      return regionStats;
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider stale after 2 minutes
  });
}
