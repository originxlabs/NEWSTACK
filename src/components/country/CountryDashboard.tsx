import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  MapPin, TrendingUp, Globe2, Newspaper, Radio, 
  Languages, Building2, ChevronRight, RefreshCw,
  Wifi, WifiOff, Search, Filter, BarChart3, PieChart,
  Volume2, VolumeX, Globe, CheckCircle2, Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useTTS } from "@/hooks/use-tts";

// Types
export interface Region {
  id: string;
  name: string;
  code: string;
  languages: string[];
  capital: string;
  type: "state" | "province" | "territory" | "region";
}

export interface CountryConfig {
  code: string;
  name: string;
  flag: string;
  regions: Region[];
  geographicGroups: Record<string, string[]>;
  languageNames: Record<string, string>;
  languageColors: Record<string, string>;
  cityToRegionMap: Record<string, string>;
}

interface RegionStats {
  storyCount: number;
  trendingTopics: { topic: string; count: number }[];
  sources: { name: string; count: number }[];
  recentHeadlines: string[];
  languageBreakdown: { language: string; count: number }[];
  hasLocalNews: boolean;
  localFeedCount: number;
}

interface OverallStats {
  totalStories: number;
  totalSources: number;
  totalFeeds: number;
  activeRegions: number;
  topRegions: { region: string; count: number }[];
  categoryBreakdown: { category: string; count: number }[];
  languageBreakdown: { language: string; count: number }[];
  hourlyTrend: { hour: string; count: number }[];
}

// Hook to fetch country stats
function useCountryStats(config: CountryConfig) {
  const [stats, setStats] = useState<Record<string, RegionStats>>({});
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchStats = useCallback(async () => {
    try {
      const cutoff = new Date();
      cutoff.setHours(cutoff.getHours() - 48);

      // Fetch stories from this country
      const { data: stories, error } = await supabase
        .from("stories")
        .select("id, headline, city, state, category, created_at")
        .eq("country_code", config.code)
        .gte("created_at", cutoff.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch RSS feeds for language info
      const { data: feeds } = await supabase
        .from("rss_feeds")
        .select("name, language, category")
        .eq("country_code", config.code)
        .eq("is_active", true);

      // Fetch story sources
      const storyIds = stories?.map(s => s.id) || [];
      const { data: sources } = await supabase
        .from("story_sources")
        .select("story_id, source_name")
        .in("story_id", storyIds.slice(0, 100));

      const regionStatsMap: Record<string, RegionStats> = {};
      const categoryCount: Record<string, number> = {};
      const languageCount: Record<string, number> = {};
      const regionCount: Record<string, number> = {};
      const hourlyCount: Record<string, number> = {};

      // Process stories
      for (const story of stories || []) {
        const cityLower = story.city?.toLowerCase()?.trim() || "";
        const stateLower = story.state?.toLowerCase()?.trim() || "";
        
        let matchedRegionId: string | null = null;
        
        // First try city-to-region mapping
        if (config.cityToRegionMap[cityLower]) {
          matchedRegionId = config.cityToRegionMap[cityLower];
        } else if (stateLower) {
          // Try matching against state field directly
          for (const region of config.regions) {
            const regionName = region.name.toLowerCase();
            if (stateLower === regionName || stateLower === region.id || stateLower === region.code.toLowerCase()) {
              matchedRegionId = region.id;
              break;
            }
          }
        }
        
        // Fallback to region name matching
        if (!matchedRegionId) {
          for (const region of config.regions) {
            const regionName = region.name.toLowerCase();
            const capitalName = region.capital.toLowerCase();
            
            if (cityLower === regionName || cityLower === capitalName || 
                cityLower.includes(regionName) || regionName.includes(cityLower)) {
              matchedRegionId = region.id;
              break;
            }
          }
        }
        
        if (matchedRegionId) {
          if (!regionStatsMap[matchedRegionId]) {
            regionStatsMap[matchedRegionId] = {
              storyCount: 0,
              trendingTopics: [],
              sources: [],
              recentHeadlines: [],
              languageBreakdown: [],
              hasLocalNews: false,
              localFeedCount: 0,
            };
          }
          
          regionStatsMap[matchedRegionId].storyCount++;
          
          if (regionStatsMap[matchedRegionId].recentHeadlines.length < 5) {
            regionStatsMap[matchedRegionId].recentHeadlines.push(story.headline);
          }
          
          if (story.category) {
            const existing = regionStatsMap[matchedRegionId].trendingTopics.find(t => t.topic === story.category);
            if (existing) {
              existing.count++;
            } else {
              regionStatsMap[matchedRegionId].trendingTopics.push({ topic: story.category, count: 1 });
            }
          }
          
          const regionName = config.regions.find(s => s.id === matchedRegionId)?.name || matchedRegionId;
          regionCount[regionName] = (regionCount[regionName] || 0) + 1;
        }
        
        if (story.category) {
          categoryCount[story.category] = (categoryCount[story.category] || 0) + 1;
        }
        
        const hour = new Date(story.created_at).getHours();
        const hourKey = `${hour.toString().padStart(2, '0')}:00`;
        hourlyCount[hourKey] = (hourlyCount[hourKey] || 0) + 1;
      }

      // Process feeds for language breakdown
      for (const feed of feeds || []) {
        if (feed.language) {
          languageCount[feed.language] = (languageCount[feed.language] || 0) + 1;
        }
      }

      // Add language breakdown to regions and count local feeds
      const localFeedCounts: Record<string, number> = {};
      for (const feed of feeds || []) {
        if (feed.category === 'local') {
          for (const region of config.regions) {
            const regionName = region.name.toLowerCase();
            const feedName = feed.name.toLowerCase();
            if (feedName.includes(regionName) || 
                feedName.includes(region.capital.toLowerCase()) ||
                region.languages.some(lang => feed.language === lang)) {
              localFeedCounts[region.id] = (localFeedCounts[region.id] || 0) + 1;
            }
          }
        }
      }
      
      for (const region of config.regions) {
        if (regionStatsMap[region.id]) {
          regionStatsMap[region.id].languageBreakdown = region.languages.map(lang => ({
            language: lang,
            count: languageCount[lang] || 0,
          }));
          
          regionStatsMap[region.id].hasLocalNews = regionStatsMap[region.id].storyCount > 0;
          regionStatsMap[region.id].localFeedCount = localFeedCounts[region.id] || 0;
          
          regionStatsMap[region.id].trendingTopics.sort((a, b) => b.count - a.count);
        } else {
          regionStatsMap[region.id] = {
            storyCount: 0,
            trendingTopics: [],
            sources: [],
            recentHeadlines: [],
            languageBreakdown: region.languages.map(lang => ({
              language: lang,
              count: languageCount[lang] || 0,
            })),
            hasLocalNews: false,
            localFeedCount: localFeedCounts[region.id] || 0,
          };
        }
      }

      // Process sources
      const sourceCount: Record<string, number> = {};
      for (const source of sources || []) {
        sourceCount[source.source_name] = (sourceCount[source.source_name] || 0) + 1;
      }

      const activeRegionsCount = Object.values(regionStatsMap).filter(s => s.storyCount > 0).length;

      const overall: OverallStats = {
        totalStories: stories?.length || 0,
        totalSources: Object.keys(sourceCount).length,
        totalFeeds: feeds?.length || 0,
        activeRegions: activeRegionsCount,
        topRegions: Object.entries(regionCount)
          .map(([region, count]) => ({ region, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10),
        categoryBreakdown: Object.entries(categoryCount)
          .map(([category, count]) => ({ category, count }))
          .sort((a, b) => b.count - a.count),
        languageBreakdown: Object.entries(languageCount)
          .map(([language, count]) => ({ language, count }))
          .sort((a, b) => b.count - a.count),
        hourlyTrend: Object.entries(hourlyCount)
          .map(([hour, count]) => ({ hour, count }))
          .sort((a, b) => a.hour.localeCompare(b.hour)),
      };

      setStats(regionStatsMap);
      setOverallStats(overall);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to fetch country stats:", err);
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return { stats, overallStats, isLoading, lastUpdated, refetch: fetchStats };
}

// Realtime connection hook
function useRealtimeConnection(countryCode: string) {
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    const channel = supabase
      .channel(`${countryCode}-realtime`)
      .on("postgres_changes", { event: "*", schema: "public", table: "stories" }, () => {})
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });
    
    return () => { supabase.removeChannel(channel); };
  }, [countryCode]);
  
  return isConnected;
}

// Region Card Component
function RegionCard({ 
  region, 
  stats, 
  config,
  onClick 
}: { 
  region: Region;
  stats?: RegionStats;
  config: CountryConfig;
  onClick: () => void;
}) {
  const hasStories = (stats?.storyCount || 0) > 0;
  const hasLocalNews = stats?.hasLocalNews || false;
  const primaryLang = region.languages[0] || 'en';
  const isNonEnglish = primaryLang !== 'en';
  const { speak, isPlaying, isLoading: isSpeaking, stop } = useTTS({ language: primaryLang });
  
  // Translation state
  const [showTranslated, setShowTranslated] = useState(false);
  const [translatedHeadline, setTranslatedHeadline] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  
  const handleListen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) {
      stop();
    } else if (stats?.recentHeadlines[0]) {
      speak(stats.recentHeadlines[0]);
    }
  };
  
  const handleTranslate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (translatedHeadline) {
      setShowTranslated(!showTranslated);
      return;
    }
    
    const headline = stats?.recentHeadlines[0];
    if (!headline) return;
    
    setIsTranslating(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/translate-to-english`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ headline, summary: headline }),
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.headline_en) {
          setTranslatedHeadline(data.headline_en);
          setShowTranslated(true);
        }
      }
    } catch (err) {
      console.error("Translation failed:", err);
    } finally {
      setIsTranslating(false);
    }
  };
  
  const regionTypeLabel = region.type === 'state' ? '' : 
    region.type === 'territory' ? 'UT' : 
    region.type === 'province' ? 'Province' : 'Region';
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="cursor-pointer"
      onClick={onClick}
    >
      <Card className={cn(
        "h-full transition-all hover:shadow-lg hover:border-primary/30",
        hasStories && "border-l-4 border-l-primary"
      )}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-sm">{region.name}</h3>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {region.capital}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {regionTypeLabel && (
                <Badge variant="secondary" className="text-[9px]">{regionTypeLabel}</Badge>
              )}
              <Badge variant="outline" className="text-[10px]">
                {region.code}
              </Badge>
            </div>
          </div>
          
          {/* Local News Indicator */}
          <div className="mb-2">
            {hasLocalNews ? (
              <Badge variant="secondary" className="text-[9px] gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                <CheckCircle2 className="w-2.5 h-2.5" />
                Local news available
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[9px] gap-1 bg-amber-500/10 text-amber-600 border-amber-500/20">
                <Globe className="w-2.5 h-2.5" />
                Showing national news
              </Badge>
            )}
          </div>
          
          {/* Story Count */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1.5 bg-primary/10 rounded-full px-2 py-1">
              <Newspaper className="w-3 h-3 text-primary" />
              <span className="text-sm font-bold text-primary">{stats?.storyCount || 0}</span>
            </div>
            <span className="text-[11px] text-muted-foreground">stories</span>
            
            {/* Listen Button */}
            {stats?.recentHeadlines[0] && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 ml-auto"
                      onClick={handleListen}
                    >
                      {isSpeaking ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : isPlaying ? (
                        <VolumeX className="w-3 h-3 text-primary" />
                      ) : (
                        <Volume2 className="w-3 h-3" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    Listen in {config.languageNames[primaryLang] || 'English'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          
          {/* Languages */}
          <div className="flex flex-wrap gap-1 mb-2">
            {region.languages.slice(0, 3).map(lang => (
              <Badge 
                key={lang} 
                variant="secondary" 
                className={cn("text-[9px] h-5", config.languageColors[lang]?.replace('bg-', 'bg-opacity-20 text-'))}
              >
                {config.languageNames[lang] || lang}
              </Badge>
            ))}
          </div>
          
          {/* Top Topic */}
          {stats?.trendingTopics[0] && (
            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-red-500" />
              <span className="capitalize">{stats.trendingTopics[0].topic}</span>
              <span className="text-muted-foreground/60">({stats.trendingTopics[0].count})</span>
            </div>
          )}
          
          {/* Recent Headline with Translation Toggle */}
          {stats?.recentHeadlines[0] && (
            <div className="mt-2 border-t pt-2 border-border/50">
              <div className="flex items-center gap-1 mb-1">
                {isNonEnglish && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "h-5 px-1.5 text-[9px] gap-1",
                            showTranslated && "bg-primary/10 text-primary"
                          )}
                          onClick={handleTranslate}
                          disabled={isTranslating}
                        >
                          {isTranslating ? (
                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                          ) : (
                            <Languages className="w-2.5 h-2.5" />
                          )}
                          {showTranslated ? "Original" : "English"}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-[10px]">
                        {showTranslated ? `Show original ${config.languageNames[primaryLang]}` : "Translate to English"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground line-clamp-2">
                {showTranslated && translatedHeadline ? translatedHeadline : stats.recentHeadlines[0]}
              </p>
            </div>
          )}
          
          <div className="flex items-center justify-end text-[10px] text-primary mt-2">
            <span>View Details</span>
            <ChevronRight className="w-3 h-3 ml-0.5" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Analytics Components
function TopRegionsLeaderboard({ data }: { data: { region: string; count: number }[] }) {
  const maxCount = data[0]?.count || 1;
  
  return (
    <div className="space-y-2">
      {data.slice(0, 5).map((item, idx) => (
        <div key={item.region} className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground w-4">{idx + 1}.</span>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-xs font-medium truncate">{item.region}</span>
              <span className="text-[10px] text-muted-foreground">{item.count}</span>
            </div>
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${(item.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function LanguageChart({ data, languageNames }: { data: { language: string; count: number }[]; languageNames: Record<string, string> }) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  
  return (
    <div className="space-y-2">
      {data.slice(0, 6).map(item => (
        <div key={item.language} className="flex items-center gap-2">
          <span className="text-xs w-16 truncate">{languageNames[item.language] || item.language}</span>
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full"
              style={{ width: `${(item.count / total) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground w-8 text-right">{item.count}</span>
        </div>
      ))}
    </div>
  );
}

function CategoryChart({ data }: { data: { category: string; count: number }[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {data.slice(0, 8).map(item => (
        <Badge 
          key={item.category} 
          variant="secondary" 
          className="text-[10px] capitalize"
        >
          {item.category}: {item.count}
        </Badge>
      ))}
    </div>
  );
}

// Main Country Dashboard Component
export function CountryDashboard({ config }: { config: CountryConfig }) {
  const navigate = useNavigate();
  const { stats, overallStats, isLoading, lastUpdated, refetch } = useCountryStats(config);
  const isConnected = useRealtimeConnection(config.code);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("all");

  const filteredRegions = useMemo(() => {
    let filtered = [...config.regions];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(region => 
        region.name.toLowerCase().includes(query) ||
        region.capital.toLowerCase().includes(query) ||
        region.code.toLowerCase().includes(query)
      );
    }
    
    if (selectedGroup !== "all" && config.geographicGroups[selectedGroup]) {
      filtered = filtered.filter(region => config.geographicGroups[selectedGroup].includes(region.id));
    }
    
    return filtered.sort((a, b) => (stats[b.id]?.storyCount || 0) - (stats[a.id]?.storyCount || 0));
  }, [searchQuery, selectedGroup, stats, config]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  const handleRegionClick = useCallback((region: Region) => {
    const params = new URLSearchParams();
    params.set("country", config.code);
    params.set("state", region.name);
    navigate(`/news?${params.toString()}`);
  }, [navigate, config.code]);

  const formatTime = (date: Date) => {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  const stateCount = config.regions.filter(r => r.type === 'state').length;
  const territoryCount = config.regions.filter(r => r.type === 'territory').length;
  const provinceCount = config.regions.filter(r => r.type === 'province').length;

  const regionTypeLabel = stateCount > 0 && territoryCount > 0 
    ? `${stateCount} states and ${territoryCount} union territories`
    : provinceCount > 0 
    ? `${provinceCount} provinces`
    : `${config.regions.length} regions`;

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <section className="border-b border-border/50 bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="container mx-auto max-w-7xl px-4 py-8">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-3xl">{config.flag}</span>
                <h1 className="text-2xl sm:text-3xl font-bold">{config.name} Dashboard</h1>
              </div>
              <p className="text-muted-foreground text-sm">
                Real-time news intelligence across {regionTypeLabel}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={cn(
                  "gap-1 text-[10px]",
                  isConnected 
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                )}
              >
                {isConnected ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
                {isConnected ? "LIVE" : "POLLING"}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="gap-1.5"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
                {formatTime(lastUpdated)}
              </Button>
            </div>
          </div>

          {/* Overall Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <Newspaper className="w-4 h-4" />
                  <span className="text-xs font-medium">Total Stories</span>
                </div>
                <p className="text-2xl font-bold">{overallStats?.totalStories || 0}</p>
                <p className="text-[10px] text-muted-foreground">Last 48 hours</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-green-600 mb-1">
                  <Radio className="w-4 h-4" />
                  <span className="text-xs font-medium">Active Feeds</span>
                </div>
                <p className="text-2xl font-bold">{overallStats?.totalFeeds || 0}</p>
                <p className="text-[10px] text-muted-foreground">{overallStats?.totalSources || 0} sources reporting</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-orange-600 mb-1">
                  <Languages className="w-4 h-4" />
                  <span className="text-xs font-medium">Languages</span>
                </div>
                <p className="text-2xl font-bold">{overallStats?.languageBreakdown.length || 0}</p>
                <p className="text-[10px] text-muted-foreground">Regional coverage</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-purple-600 mb-1">
                  <MapPin className="w-4 h-4" />
                  <span className="text-xs font-medium">Active Regions</span>
                </div>
                <p className="text-2xl font-bold">{overallStats?.activeRegions || 0}</p>
                <p className="text-[10px] text-muted-foreground">With recent news</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-6">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar - Analytics */}
            <div className="lg:col-span-1 space-y-4">
              {/* Top Regions */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    Top Regions by Coverage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {overallStats?.topRegions && overallStats.topRegions.length > 0 ? (
                    <TopRegionsLeaderboard data={overallStats.topRegions} />
                  ) : (
                    <p className="text-xs text-muted-foreground">No data available</p>
                  )}
                </CardContent>
              </Card>

              {/* Language Distribution */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Languages className="w-4 h-4 text-primary" />
                    Language Coverage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {overallStats?.languageBreakdown && overallStats.languageBreakdown.length > 0 ? (
                    <LanguageChart data={overallStats.languageBreakdown} languageNames={config.languageNames} />
                  ) : (
                    <p className="text-xs text-muted-foreground">No data available</p>
                  )}
                </CardContent>
              </Card>

              {/* Category Distribution */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-primary" />
                    Categories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {overallStats?.categoryBreakdown && overallStats.categoryBreakdown.length > 0 ? (
                    <CategoryChart data={overallStats.categoryBreakdown} />
                  ) : (
                    <p className="text-xs text-muted-foreground">No data available</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Main Grid */}
            <div className="lg:col-span-3">
              {/* Filters */}
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search regions, capitals..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                {Object.keys(config.geographicGroups).length > 0 && (
                  <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Regions</SelectItem>
                      {Object.keys(config.geographicGroups).map(group => (
                        <SelectItem key={group} value={group} className="capitalize">
                          {group.charAt(0).toUpperCase() + group.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Regions Grid */}
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="h-48 bg-muted/50 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <AnimatePresence>
                    {filteredRegions.map((region, index) => (
                      <motion.div
                        key={region.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: index * 0.02 }}
                      >
                        <RegionCard
                          region={region}
                          stats={stats[region.id]}
                          config={config}
                          onClick={() => handleRegionClick(region)}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {filteredRegions.length === 0 && !isLoading && (
                <div className="text-center py-12">
                  <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium text-lg mb-2">No regions found</h3>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search or filters
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Methodology Note */}
      <section className="py-6 bg-muted/30">
        <div className="container mx-auto max-w-7xl px-4">
          <Card className="border-border/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Data Coverage:</span>
                {' '}Stories are aggregated from {overallStats?.languageBreakdown.length || 0}+ language sources.
                Regional news is matched to regions based on geographic keywords and source metadata.
                Data refreshes every minute for real-time accuracy.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

export default CountryDashboard;
