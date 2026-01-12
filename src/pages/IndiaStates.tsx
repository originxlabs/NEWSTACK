import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  MapPin, TrendingUp, Globe2, Newspaper, Radio, 
  Languages, Building2, ChevronRight, RefreshCw,
  Wifi, WifiOff, Search, Filter, BarChart3, PieChart,
  Users, Clock, Zap, ChevronDown, Volume2, VolumeX, Globe,
  CheckCircle2, AlertCircle, Loader2
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { toast } from "sonner";
import { IngestionPipelineViewer } from "@/components/IngestionPipelineViewer";
import { IngestionRunHistory } from "@/components/IngestionRunHistory";
import { StateFlagBadge } from "@/components/StateFlagBadge";
import { getStateConfig, getStateFlag } from "@/lib/india-states-config";
import { RealtimeNewsIndicator, RealtimeStatusDot } from "@/components/RealtimeNewsIndicator";
import { BreadcrumbNav } from "@/components/BreadcrumbNav";
// State color mapping based on region
const STATE_COLORS: Record<string, string> = {
  // North
  "delhi": "bg-orange-500", "uttar-pradesh": "bg-orange-400", "uttarakhand": "bg-orange-300",
  "haryana": "bg-amber-500", "punjab": "bg-amber-400", "himachal-pradesh": "bg-amber-300",
  "jammu-kashmir": "bg-rose-400", "ladakh": "bg-rose-300", "chandigarh": "bg-amber-600",
  // East
  "west-bengal": "bg-yellow-500", "bihar": "bg-yellow-400", "jharkhand": "bg-yellow-300",
  "odisha": "bg-cyan-500", "sikkim": "bg-yellow-600",
  // Northeast
  "assam": "bg-emerald-500", "arunachal-pradesh": "bg-emerald-400", "manipur": "bg-emerald-300",
  "meghalaya": "bg-teal-500", "mizoram": "bg-teal-400", "nagaland": "bg-teal-300",
  "tripura": "bg-green-500",
  // Central
  "madhya-pradesh": "bg-violet-500", "chhattisgarh": "bg-violet-400",
  // West
  "rajasthan": "bg-pink-500", "gujarat": "bg-indigo-500", "maharashtra": "bg-pink-400",
  "goa": "bg-red-400", "dadra-nagar-haveli-daman-diu": "bg-indigo-400",
  // South
  "karnataka": "bg-red-500", "kerala": "bg-teal-600", "tamil-nadu": "bg-green-600",
  "andhra-pradesh": "bg-purple-500", "telangana": "bg-purple-400", "puducherry": "bg-green-500",
  "lakshadweep": "bg-teal-500", "andaman-nicobar": "bg-blue-500",
};

// All 28 States of India
const INDIAN_STATES = [
  { id: "andhra-pradesh", name: "Andhra Pradesh", code: "AP", languages: ["te", "en"], capital: "Amaravati", type: "state" },
  { id: "arunachal-pradesh", name: "Arunachal Pradesh", code: "AR", languages: ["en"], capital: "Itanagar", type: "state" },
  { id: "assam", name: "Assam", code: "AS", languages: ["as", "en", "bn"], capital: "Dispur", type: "state" },
  { id: "bihar", name: "Bihar", code: "BR", languages: ["hi", "en"], capital: "Patna", type: "state" },
  { id: "chhattisgarh", name: "Chhattisgarh", code: "CG", languages: ["hi", "en"], capital: "Raipur", type: "state" },
  { id: "goa", name: "Goa", code: "GA", languages: ["en", "mr", "kn"], capital: "Panaji", type: "state" },
  { id: "gujarat", name: "Gujarat", code: "GJ", languages: ["gu", "en", "hi"], capital: "Gandhinagar", type: "state" },
  { id: "haryana", name: "Haryana", code: "HR", languages: ["hi", "en"], capital: "Chandigarh", type: "state" },
  { id: "himachal-pradesh", name: "Himachal Pradesh", code: "HP", languages: ["hi", "en"], capital: "Shimla", type: "state" },
  { id: "jharkhand", name: "Jharkhand", code: "JH", languages: ["hi", "en"], capital: "Ranchi", type: "state" },
  { id: "karnataka", name: "Karnataka", code: "KA", languages: ["kn", "en"], capital: "Bengaluru", type: "state" },
  { id: "kerala", name: "Kerala", code: "KL", languages: ["ml", "en"], capital: "Thiruvananthapuram", type: "state" },
  { id: "madhya-pradesh", name: "Madhya Pradesh", code: "MP", languages: ["hi", "en"], capital: "Bhopal", type: "state" },
  { id: "maharashtra", name: "Maharashtra", code: "MH", languages: ["mr", "en", "hi"], capital: "Mumbai", type: "state" },
  { id: "manipur", name: "Manipur", code: "MN", languages: ["en", "mni"], capital: "Imphal", type: "state" },
  { id: "meghalaya", name: "Meghalaya", code: "ML", languages: ["en", "kha"], capital: "Shillong", type: "state" },
  { id: "mizoram", name: "Mizoram", code: "MZ", languages: ["en", "miz"], capital: "Aizawl", type: "state" },
  { id: "nagaland", name: "Nagaland", code: "NL", languages: ["en"], capital: "Kohima", type: "state" },
  { id: "odisha", name: "Odisha", code: "OD", languages: ["or", "en"], capital: "Bhubaneswar", type: "state" },
  { id: "punjab", name: "Punjab", code: "PB", languages: ["pa", "en", "hi"], capital: "Chandigarh", type: "state" },
  { id: "rajasthan", name: "Rajasthan", code: "RJ", languages: ["hi", "en"], capital: "Jaipur", type: "state" },
  { id: "sikkim", name: "Sikkim", code: "SK", languages: ["en", "ne"], capital: "Gangtok", type: "state" },
  { id: "tamil-nadu", name: "Tamil Nadu", code: "TN", languages: ["ta", "en"], capital: "Chennai", type: "state" },
  { id: "telangana", name: "Telangana", code: "TS", languages: ["te", "en"], capital: "Hyderabad", type: "state" },
  { id: "tripura", name: "Tripura", code: "TR", languages: ["bn", "en", "kok"], capital: "Agartala", type: "state" },
  { id: "uttar-pradesh", name: "Uttar Pradesh", code: "UP", languages: ["hi", "en"], capital: "Lucknow", type: "state" },
  { id: "uttarakhand", name: "Uttarakhand", code: "UK", languages: ["hi", "en"], capital: "Dehradun", type: "state" },
  { id: "west-bengal", name: "West Bengal", code: "WB", languages: ["bn", "en", "hi"], capital: "Kolkata", type: "state" },
];

// All 8 Union Territories of India
const UNION_TERRITORIES = [
  { id: "andaman-nicobar", name: "Andaman & Nicobar Islands", code: "AN", languages: ["en", "hi", "bn"], capital: "Port Blair", type: "ut" },
  { id: "chandigarh", name: "Chandigarh", code: "CH", languages: ["hi", "en", "pa"], capital: "Chandigarh", type: "ut" },
  { id: "dadra-nagar-haveli-daman-diu", name: "Dadra & Nagar Haveli and Daman & Diu", code: "DN", languages: ["gu", "hi", "en"], capital: "Daman", type: "ut" },
  { id: "delhi", name: "Delhi", code: "DL", languages: ["hi", "en"], capital: "New Delhi", type: "ut" },
  { id: "jammu-kashmir", name: "Jammu & Kashmir", code: "JK", languages: ["ur", "hi", "en"], capital: "Srinagar", type: "ut" },
  { id: "ladakh", name: "Ladakh", code: "LA", languages: ["en", "hi", "bod"], capital: "Leh", type: "ut" },
  { id: "lakshadweep", name: "Lakshadweep", code: "LD", languages: ["ml", "en"], capital: "Kavaratti", type: "ut" },
  { id: "puducherry", name: "Puducherry", code: "PY", languages: ["ta", "en", "ml", "te"], capital: "Puducherry", type: "ut" },
];

// Combined list of all states and union territories
const ALL_REGIONS = [...INDIAN_STATES, ...UNION_TERRITORIES];

// Language name mapping
const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  hi: "Hindi",
  ta: "Tamil",
  te: "Telugu",
  kn: "Kannada",
  ml: "Malayalam",
  bn: "Bengali",
  mr: "Marathi",
  gu: "Gujarati",
  pa: "Punjabi",
  or: "Odia",
  as: "Assamese",
};

// Language colors for charts
const LANGUAGE_COLORS: Record<string, string> = {
  en: "bg-blue-500",
  hi: "bg-orange-500",
  ta: "bg-green-500",
  te: "bg-purple-500",
  kn: "bg-red-500",
  ml: "bg-teal-500",
  bn: "bg-yellow-500",
  mr: "bg-pink-500",
  gu: "bg-indigo-500",
  pa: "bg-amber-500",
  or: "bg-cyan-500",
  as: "bg-emerald-500",
};

interface StateStats {
  storyCount: number;
  trendingTopics: { topic: string; count: number }[];
  sources: { name: string; count: number }[];
  recentHeadlines: string[];
  languageBreakdown: { language: string; count: number }[];
  hasLocalNews: boolean; // True if we have specific local news for this state
  localFeedCount: number; // Number of active local feeds for this state
}

interface OverallStats {
  totalStories: number;
  totalSources: number;
  totalFeeds: number;
  activeStates: number;
  statesCount: number; // Total number of states (28)
  utsCount: number; // Total number of UTs (8)
  topStates: { state: string; count: number; type?: 'state' | 'ut' }[];
  allRegionsCoverage: { state: string; count: number; type: 'state' | 'ut' }[]; // All 36 regions
  categoryBreakdown: { category: string; count: number }[];
  languageBreakdown: { language: string; count: number }[];
  hourlyTrend: { hour: string; count: number }[];
}

// Hook to fetch state-wise stats
function useStateStats() {
  const [stats, setStats] = useState<Record<string, StateStats>>({});
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchStats = useCallback(async () => {
    try {
      const cutoff = new Date();
      cutoff.setHours(cutoff.getHours() - 48);

      // Fetch stories from India
      const { data: stories, error } = await supabase
        .from("stories")
        .select("id, headline, city, category, created_at")
        .eq("country_code", "IN")
        .gte("created_at", cutoff.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch RSS feeds for language info
      const { data: feeds } = await supabase
        .from("rss_feeds")
        .select("name, language, category")
        .eq("country_code", "IN")
        .eq("is_active", true);

      // Fetch story sources
      const storyIds = stories?.map(s => s.id) || [];
      const { data: sources } = await supabase
        .from("story_sources")
        .select("story_id, source_name")
        .in("story_id", storyIds.slice(0, 100)); // Limit for performance

      const stateStatsMap: Record<string, StateStats> = {};
      const categoryCount: Record<string, number> = {};
      const languageCount: Record<string, number> = {};
      const stateCount: Record<string, number> = {};
      const hourlyCount: Record<string, number> = {};

      // City to state mapping for accurate matching
      const CITY_TO_STATE: Record<string, string> = {
        "mumbai": "maharashtra", "pune": "maharashtra", "nagpur": "maharashtra", "nashik": "maharashtra", "thane": "maharashtra",
        "delhi": "delhi", "new delhi": "delhi",
        "bengaluru": "karnataka", "bangalore": "karnataka", "mysuru": "karnataka", "hubli": "karnataka",
        "chennai": "tamil-nadu", "coimbatore": "tamil-nadu", "madurai": "tamil-nadu", "salem": "tamil-nadu",
        "hyderabad": "telangana", "secunderabad": "telangana", "warangal": "telangana",
        "kolkata": "west-bengal", "howrah": "west-bengal", "durgapur": "west-bengal",
        "ahmedabad": "gujarat", "surat": "gujarat", "vadodara": "gujarat", "rajkot": "gujarat",
        "jaipur": "rajasthan", "jodhpur": "rajasthan", "udaipur": "rajasthan", "kota": "rajasthan",
        "lucknow": "uttar-pradesh", "kanpur": "uttar-pradesh", "agra": "uttar-pradesh", "varanasi": "uttar-pradesh", "noida": "uttar-pradesh", "ghaziabad": "uttar-pradesh",
        "patna": "bihar", "gaya": "bihar", "muzaffarpur": "bihar",
        "bhopal": "madhya-pradesh", "indore": "madhya-pradesh", "jabalpur": "madhya-pradesh", "gwalior": "madhya-pradesh",
        "thiruvananthapuram": "kerala", "kochi": "kerala", "kozhikode": "kerala", "thrissur": "kerala",
        "chandigarh": "chandigarh",
        "guwahati": "assam", "silchar": "assam", "dibrugarh": "assam",
        "visakhapatnam": "andhra-pradesh", "vizag": "andhra-pradesh", "vijayawada": "andhra-pradesh", "tirupati": "andhra-pradesh", "guntur": "andhra-pradesh", "amaravati": "andhra-pradesh",
        "bhubaneswar": "odisha", "cuttack": "odisha", "rourkela": "odisha",
        "raipur": "chhattisgarh", "bhilai": "chhattisgarh", "bilaspur": "chhattisgarh",
        "ranchi": "jharkhand", "jamshedpur": "jharkhand", "dhanbad": "jharkhand",
        "ludhiana": "punjab", "amritsar": "punjab", "jalandhar": "punjab",
        "dehradun": "uttarakhand", "haridwar": "uttarakhand", "rishikesh": "uttarakhand",
        "shimla": "himachal-pradesh", "dharamshala": "himachal-pradesh", "manali": "himachal-pradesh",
        "panaji": "goa", "margao": "goa", "vasco": "goa",
        "imphal": "manipur", "shillong": "meghalaya", "aizawl": "mizoram", "kohima": "nagaland",
        "agartala": "tripura", "itanagar": "arunachal-pradesh", "gangtok": "sikkim",
        "srinagar": "jammu-kashmir", "jammu": "jammu-kashmir", "leh": "ladakh",
        "puducherry": "puducherry", "pondicherry": "puducherry",
      };

      // Process stories
      for (const story of stories || []) {
        // Match story to state based on city field
        const cityLower = story.city?.toLowerCase()?.trim() || "";
        
        if (!cityLower) continue; // Skip stories without city info
        
        let matchedStateId: string | null = null;
        
        // First try direct city-to-state mapping
        if (CITY_TO_STATE[cityLower]) {
          matchedStateId = CITY_TO_STATE[cityLower];
        } else {
          // Try matching against state names
          for (const state of ALL_REGIONS) {
            const stateName = state.name.toLowerCase();
            const capitalName = state.capital.toLowerCase();
            
            if (cityLower === stateName || cityLower === capitalName || 
                cityLower.includes(stateName) || stateName.includes(cityLower)) {
              matchedStateId = state.id;
              break;
            }
          }
        }
        
        if (matchedStateId) {
          if (!stateStatsMap[matchedStateId]) {
            stateStatsMap[matchedStateId] = {
              storyCount: 0,
              trendingTopics: [],
              sources: [],
              recentHeadlines: [],
              languageBreakdown: [],
              hasLocalNews: false,
              localFeedCount: 0,
            };
          }
          
          stateStatsMap[matchedStateId].storyCount++;
          
          if (stateStatsMap[matchedStateId].recentHeadlines.length < 5) {
            stateStatsMap[matchedStateId].recentHeadlines.push(story.headline);
          }
          
          // Track category for this state
          if (story.category) {
            const existing = stateStatsMap[matchedStateId].trendingTopics.find(t => t.topic === story.category);
            if (existing) {
              existing.count++;
            } else {
              stateStatsMap[matchedStateId].trendingTopics.push({ topic: story.category, count: 1 });
            }
          }
          
          const stateName = ALL_REGIONS.find(s => s.id === matchedStateId)?.name || matchedStateId;
          stateCount[stateName] = (stateCount[stateName] || 0) + 1;
        }
        
        // Track overall category
        if (story.category) {
          categoryCount[story.category] = (categoryCount[story.category] || 0) + 1;
        }
        
        // Track hourly trend
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

      // Add language breakdown to states based on their regional languages and count local feeds
      const localFeedCounts: Record<string, number> = {};
      for (const feed of feeds || []) {
        if (feed.category === 'local') {
          // Try to match feed to state by name
          for (const state of ALL_REGIONS) {
            const stateName = state.name.toLowerCase();
            const feedName = feed.name.toLowerCase();
            if (feedName.includes(stateName) || 
                feedName.includes(state.capital.toLowerCase()) ||
                state.languages.some(lang => feed.language === lang)) {
              localFeedCounts[state.id] = (localFeedCounts[state.id] || 0) + 1;
            }
          }
        }
      }
      
      for (const state of ALL_REGIONS) {
        if (stateStatsMap[state.id]) {
          stateStatsMap[state.id].languageBreakdown = state.languages.map(lang => ({
            language: lang,
            count: languageCount[lang] || 0,
          }));
          
          // Set hasLocalNews based on story count and local feed availability
          stateStatsMap[state.id].hasLocalNews = stateStatsMap[state.id].storyCount > 0;
          stateStatsMap[state.id].localFeedCount = localFeedCounts[state.id] || 0;
          
          // Sort trending topics
          stateStatsMap[state.id].trendingTopics.sort((a, b) => b.count - a.count);
        } else {
          // Create entry for states without stories to show feed availability
          stateStatsMap[state.id] = {
            storyCount: 0,
            trendingTopics: [],
            sources: [],
            recentHeadlines: [],
            languageBreakdown: state.languages.map(lang => ({
              language: lang,
              count: languageCount[lang] || 0,
            })),
            hasLocalNews: false,
            localFeedCount: localFeedCounts[state.id] || 0,
          };
        }
      }

      // Process sources
      const sourceCount: Record<string, number> = {};
      for (const source of sources || []) {
        sourceCount[source.source_name] = (sourceCount[source.source_name] || 0) + 1;
      }

      // Calculate active states (states with stories in the last 48h)
      const activeStatesCount = Object.values(stateStatsMap).filter(s => s.storyCount > 0).length;

      // Build all regions coverage (all 28 states + 8 UTs)
      const allRegionsCoverage = ALL_REGIONS.map(region => ({
        state: region.name, // Use 'state' key for compatibility with TopStatesLeaderboard
        count: stateStatsMap[region.id]?.storyCount || 0,
        type: region.type as 'state' | 'ut',
      })).sort((a, b) => b.count - a.count);

      // Build overall stats
      const overall: OverallStats = {
        totalStories: stories?.length || 0,
        totalSources: Object.keys(sourceCount).length,
        totalFeeds: feeds?.length || 0,
        activeStates: activeStatesCount,
        statesCount: INDIAN_STATES.length,
        utsCount: UNION_TERRITORIES.length,
        topStates: Object.entries(stateCount)
          .map(([state, count]) => {
            const regionInfo = ALL_REGIONS.find(r => r.name === state);
            return { state, count, type: (regionInfo?.type || 'state') as 'state' | 'ut' };
          })
          .sort((a, b) => b.count - a.count)
          .slice(0, 10),
        allRegionsCoverage,
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

      setStats(stateStatsMap);
      setOverallStats(overall);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to fetch state stats:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return { stats, overallStats, isLoading, lastUpdated, refetch: fetchStats };
}

// Realtime connection hook
function useRealtimeConnection() {
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    const channel = supabase
      .channel("india-states-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "stories" }, () => {})
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });
    
    return () => { supabase.removeChannel(channel); };
  }, []);
  
  return isConnected;
}

// State Card Component with local news indicator, listen feature, and translation
function StateCard({ 
  state, 
  stats, 
  onClick 
}: { 
  state: typeof ALL_REGIONS[0];
  stats?: StateStats;
  onClick: () => void;
}) {
  const hasStories = (stats?.storyCount || 0) > 0;
  const hasLocalNews = stats?.hasLocalNews || false;
  const primaryLang = state.languages[0] || 'en';
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
    
    // If already translated, just toggle display
    if (translatedHeadline) {
      setShowTranslated(!showTranslated);
      return;
    }
    
    // Translate the headline
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
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="cursor-pointer"
      onClick={onClick}
    >
      <Card className={cn(
        "h-full transition-all hover:shadow-lg hover:border-primary/30",
        hasStories && "border-l-4",
        hasStories && (STATE_COLORS[state.id] ? STATE_COLORS[state.id].replace('bg-', 'border-l-') : "border-l-primary")
      )}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <StateFlagBadge 
                stateId={state.id} 
                size="md" 
                showEmoji={true} 
              />
              <div>
                <h3 className="font-semibold text-sm">{state.name}</h3>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {state.capital}
                </p>
              </div>
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
                    Listen in {LANGUAGE_NAMES[primaryLang] || 'English'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          
          {/* Languages */}
          <div className="flex flex-wrap gap-1 mb-2">
            {state.languages.slice(0, 3).map(lang => (
              <Badge 
                key={lang} 
                variant="secondary" 
                className={cn("text-[9px] h-5", LANGUAGE_COLORS[lang]?.replace('bg-', 'bg-opacity-20 text-'))}
              >
                {LANGUAGE_NAMES[lang] || lang}
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
                {/* Translation Button - only for non-English states */}
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
                        {showTranslated ? `Show original ${LANGUAGE_NAMES[primaryLang]}` : "Translate to English"}
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

// Language Distribution Chart
function LanguageChart({ data }: { data: { language: string; count: number }[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  
  return (
    <div className="space-y-2">
      {data.slice(0, 6).map((item, idx) => {
        const percentage = total > 0 ? (item.count / total) * 100 : 0;
        return (
          <div key={item.language} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", LANGUAGE_COLORS[item.language] || "bg-gray-400")} />
                <span>{LANGUAGE_NAMES[item.language] || item.language}</span>
              </div>
              <span className="text-muted-foreground">{item.count} feeds</span>
            </div>
            <Progress value={percentage} className="h-1.5" />
          </div>
        );
      })}
    </div>
  );
}

// Category Distribution
function CategoryChart({ data }: { data: { category: string; count: number }[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const colors = ["bg-blue-500", "bg-green-500", "bg-orange-500", "bg-purple-500", "bg-red-500", "bg-teal-500"];
  
  return (
    <div className="space-y-2">
      {data.slice(0, 6).map((item, idx) => {
        const percentage = total > 0 ? (item.count / total) * 100 : 0;
        return (
          <div key={item.category} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", colors[idx % colors.length])} />
                <span className="capitalize">{item.category}</span>
              </div>
              <span className="text-muted-foreground">{item.count}</span>
            </div>
            <Progress value={percentage} className="h-1.5" />
          </div>
        );
      })}
    </div>
  );
}

// Top States Leaderboard (with all regions - scrollable, color coded)
function TopStatesLeaderboard({ 
  data, 
  showAll = false,
  onStateClick,
}: { 
  data: { state: string; count: number; type?: 'state' | 'ut' }[]; 
  showAll?: boolean;
  onStateClick?: (stateId: string) => void;
}) {
  const maxCount = data[0]?.count || 1;
  const displayData = showAll ? data : data.slice(0, 10);
  
  // Get state id from name
  const getStateId = (stateName: string) => {
    const region = ALL_REGIONS.find(r => r.name.toLowerCase() === stateName.toLowerCase());
    return region?.id || stateName.toLowerCase().replace(/\s+/g, '-');
  };
  
  return (
    <div className={cn(
      "space-y-2",
      showAll && "max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
    )}>
      {displayData.map((item, idx) => {
        const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
        const stateId = getStateId(item.state);
        const stateColor = STATE_COLORS[stateId] || "bg-gray-400";
        
        return (
          <button
            key={item.state}
            onClick={() => onStateClick?.(stateId)}
            className="w-full flex items-center gap-3 p-1.5 rounded-lg hover:bg-muted/50 transition-colors text-left"
          >
            <StateFlagBadge 
              stateId={stateId} 
              size="sm" 
              showEmoji={true}
              className="flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-xs mb-0.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-medium truncate">{item.state}</span>
                  {item.type === 'ut' && (
                    <Badge variant="outline" className="text-[8px] h-4 px-1 border-purple-500/30 text-purple-600">
                      UT
                    </Badge>
                  )}
                </div>
                <span className="text-muted-foreground flex-shrink-0 ml-2">{item.count}</span>
              </div>
              <Progress value={percentage} className="h-1" />
            </div>
          </button>
        );
      })}
      {displayData.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">No coverage data yet</p>
      )}
    </div>
  );
}

export default function IndiaStates() {
  const navigate = useNavigate();
  const { stats, overallStats, isLoading, lastUpdated, refetch } = useStateStats();
  const isConnected = useRealtimeConnection();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Filter states
  const filteredStates = useMemo(() => {
    let filtered = ALL_REGIONS;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(state => 
        state.name.toLowerCase().includes(query) ||
        state.capital.toLowerCase().includes(query) ||
        state.code.toLowerCase().includes(query)
      );
    }
    
    if (selectedRegion !== "all") {
      // Filter by region or type
      if (selectedRegion === "states") {
        filtered = filtered.filter(r => r.type === "state");
      } else if (selectedRegion === "ut") {
        filtered = filtered.filter(r => r.type === "ut");
      } else {
        const regions: Record<string, string[]> = {
          north: ["delhi", "haryana", "punjab", "rajasthan", "uttar-pradesh", "uttarakhand", "himachal-pradesh", "jammu-kashmir", "ladakh", "chandigarh"],
          south: ["andhra-pradesh", "karnataka", "kerala", "tamil-nadu", "telangana", "puducherry", "lakshadweep"],
          east: ["bihar", "jharkhand", "odisha", "west-bengal", "sikkim", "andaman-nicobar"],
          west: ["gujarat", "maharashtra", "goa", "dadra-nagar-haveli-daman-diu"],
          central: ["madhya-pradesh", "chhattisgarh"],
          northeast: ["assam", "arunachal-pradesh", "manipur", "meghalaya", "mizoram", "nagaland", "tripura"],
        };
        filtered = filtered.filter(state => regions[selectedRegion]?.includes(state.id));
      }
    }
    
    // Sort by story count
    return filtered.sort((a, b) => (stats[b.id]?.storyCount || 0) - (stats[a.id]?.storyCount || 0));
  }, [searchQuery, selectedRegion, stats]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  const handleStateClick = useCallback((state: typeof ALL_REGIONS[0]) => {
    // Navigate to dedicated state page instead of /news
    navigate(`/india/${state.id}`);
  }, [navigate]);

  const formatTime = (date: Date) => {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      {/* Spacer for fixed header */}
      <div className="h-14" />
      
      {/* Breadcrumb Navigation */}
      <div className="sticky top-14 z-40 bg-background/98 backdrop-blur-md border-b border-border/40">
        <div className="container mx-auto max-w-7xl px-4">
          <BreadcrumbNav
            items={[
              { id: "home", label: "Home", path: "/", type: "home" },
              { id: "india", label: "India", type: "country", icon: <span>🇮🇳</span> },
            ]}
            onNavigate={() => {}}
            onGoBack={() => navigate("/")}
          />
        </div>
      </div>
      
      {/* Real-time news indicator */}
      <RealtimeNewsIndicator 
        onRefresh={handleRefresh} 
        variant="bar"
      />
      
      <main>
        {/* Hero Section */}
        <section className="border-b border-border/50 bg-gradient-to-b from-orange-500/5 via-white/5 to-green-500/5">
          <div className="container mx-auto max-w-7xl px-4 py-8">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-3xl">🇮🇳</span>
                  <h1 className="text-2xl sm:text-3xl font-bold">India Dashboard</h1>
                  <RealtimeStatusDot />
                </div>
                <p className="text-muted-foreground text-sm">
                  Real-time news intelligence across {INDIAN_STATES.length} states and {UNION_TERRITORIES.length} union territories
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
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
              {/* States & UTs - Prominent Display */}
              <Card className="bg-gradient-to-br from-orange-500/10 via-white/5 to-green-500/10 border-orange-500/20 sm:col-span-1">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-orange-600 mb-1">
                    <MapPin className="w-4 h-4" />
                    <span className="text-xs font-medium">States & UTs</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <p className="text-2xl font-bold">{overallStats?.statesCount || 28}</p>
                    <span className="text-muted-foreground text-sm">+</span>
                    <p className="text-xl font-bold text-purple-600">{overallStats?.utsCount || 8}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground">States + Union Territories</p>
                </CardContent>
              </Card>
              
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
                  <p className="text-[10px] text-muted-foreground">{overallStats?.totalSources || 0} sources</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-cyan-600 mb-1">
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
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs font-medium">Active Regions</span>
                  </div>
                  <p className="text-2xl font-bold">{overallStats?.activeStates || 0}</p>
                  <p className="text-[10px] text-muted-foreground">With recent news</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Ingestion Pipeline Viewer + History */}
        <section className="border-b border-border/50 bg-muted/10">
          <div className="container mx-auto max-w-7xl px-4 py-4 space-y-4">
            <IngestionPipelineViewer onIngestionComplete={refetch} />
            <IngestionRunHistory defaultCollapsed={true} maxRuns={10} />
          </div>
        </section>

        {/* Main Content */}
        <section className="py-6">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Sidebar - Analytics */}
              <div className="lg:col-span-1 space-y-4">
                {/* All Regions Coverage - Scrollable */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-primary" />
                        All Regions Coverage
                      </div>
                      <Badge variant="outline" className="text-[9px]">
                        {INDIAN_STATES.length} States + {UNION_TERRITORIES.length} UTs
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {overallStats?.allRegionsCoverage && overallStats.allRegionsCoverage.length > 0 ? (
                      <TopStatesLeaderboard 
                        data={overallStats.allRegionsCoverage} 
                        showAll={true}
                        onStateClick={(stateId) => navigate(`/india/${stateId}`)}
                      />
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
                      <LanguageChart data={overallStats.languageBreakdown} />
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
                      placeholder="Search states, capitals..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  
                  <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Regions</SelectItem>
                      <SelectItem value="north">North</SelectItem>
                      <SelectItem value="south">South</SelectItem>
                      <SelectItem value="east">East</SelectItem>
                      <SelectItem value="west">West</SelectItem>
                      <SelectItem value="central">Central</SelectItem>
                      <SelectItem value="northeast">Northeast</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* States Grid */}
                {isLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className="h-48 bg-muted/50 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                      {filteredStates.map((state, index) => (
                        <motion.div
                          key={state.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: index * 0.02 }}
                        >
                          <StateCard
                            state={state}
                            stats={stats[state.id]}
                            onClick={() => handleStateClick(state)}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                {filteredStates.length === 0 && !isLoading && (
                  <div className="text-center py-12">
                    <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium text-lg mb-2">No states found</h3>
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
                  {' '}Stories are aggregated from {overallStats?.languageBreakdown.length || 0}+ language sources including 
                  Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi, Gujarati, Punjabi, and Odia. 
                  Regional news is matched to states based on geographic keywords and source metadata.
                  Data refreshes every minute for real-time accuracy.
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
