import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  MapPin,
  Layers,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Wifi,
  WifiOff,
  Newspaper,
  Radio,
  BarChart3,
  Search,
  Filter,
  ChevronRight,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { IngestionPipelineViewer } from "@/components/IngestionPipelineViewer";
import { RealtimeNewsIndicator, RealtimeStatusDot } from "@/components/RealtimeNewsIndicator";
import { BreadcrumbNav, BreadcrumbItem } from "@/components/BreadcrumbNav";
import {
  GEO_HIERARCHY,
  Continent,
  getContinentById,
  COUNTRY_TO_CONTINENT,
} from "@/lib/geo-hierarchy";

// Continent colors and gradients
const CONTINENT_THEMES: Record<string, { gradient: string; accent: string; bgGradient: string }> = {
  "asia": {
    gradient: "from-rose-500 to-orange-500",
    accent: "text-rose-600",
    bgGradient: "from-rose-500/10 via-orange-500/5 to-amber-500/10",
  },
  "europe": {
    gradient: "from-blue-500 to-indigo-500",
    accent: "text-blue-600",
    bgGradient: "from-blue-500/10 via-indigo-500/5 to-purple-500/10",
  },
  "north-america": {
    gradient: "from-emerald-500 to-teal-500",
    accent: "text-emerald-600",
    bgGradient: "from-emerald-500/10 via-teal-500/5 to-cyan-500/10",
  },
  "south-america": {
    gradient: "from-amber-500 to-yellow-500",
    accent: "text-amber-600",
    bgGradient: "from-amber-500/10 via-yellow-500/5 to-orange-500/10",
  },
  "africa": {
    gradient: "from-purple-500 to-pink-500",
    accent: "text-purple-600",
    bgGradient: "from-purple-500/10 via-pink-500/5 to-rose-500/10",
  },
  "oceania": {
    gradient: "from-cyan-500 to-blue-500",
    accent: "text-cyan-600",
    bgGradient: "from-cyan-500/10 via-blue-500/5 to-indigo-500/10",
  },
};

interface CountryStats {
  storyCount: number;
  trend: "up" | "down" | "stable";
  topCategories: string[];
  recentHeadline?: string;
}

interface ContinentStats {
  totalStories: number;
  totalCountries: number;
  activeCountries: number;
  topCountries: { name: string; code: string; count: number; flag: string }[];
  categoryBreakdown: { category: string; count: number }[];
}

function useContinentStats(continent: Continent | null) {
  const [countryStats, setCountryStats] = useState<Record<string, CountryStats>>({});
  const [overallStats, setOverallStats] = useState<ContinentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchStats = useCallback(async () => {
    if (!continent) return;

    try {
      const cutoff = new Date();
      cutoff.setHours(cutoff.getHours() - 48);

      const countryCodes = continent.countries.map((c) => c.code);

      const { data: stories, error } = await supabase
        .from("stories")
        .select("id, headline, country_code, category, created_at")
        .in("country_code", countryCodes)
        .gte("created_at", cutoff.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      const statsMap: Record<string, CountryStats> = {};
      const categoryCount: Record<string, number> = {};
      const countryCount: Record<string, number> = {};

      for (const story of stories || []) {
        const code = story.country_code?.toUpperCase();
        if (!code) continue;

        if (!statsMap[code]) {
          statsMap[code] = {
            storyCount: 0,
            trend: "stable",
            topCategories: [],
            recentHeadline: story.headline,
          };
        }
        statsMap[code].storyCount++;
        countryCount[code] = (countryCount[code] || 0) + 1;

        if (story.category) {
          categoryCount[story.category] = (categoryCount[story.category] || 0) + 1;
        }
      }

      // Calculate trends
      for (const code of Object.keys(statsMap)) {
        statsMap[code].trend = statsMap[code].storyCount > 10 ? "up" : "stable";
      }

      // Build overall stats
      const topCountries = Object.entries(countryCount)
        .map(([code, count]) => {
          const country = continent.countries.find((c) => c.code === code);
          return {
            code,
            name: country?.name || code,
            count,
            flag: country?.flag || "🏳️",
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const categoryBreakdown = Object.entries(categoryCount)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      const activeCountries = Object.keys(statsMap).length;

      setCountryStats(statsMap);
      setOverallStats({
        totalStories: stories?.length || 0,
        totalCountries: continent.countries.length,
        activeCountries,
        topCountries,
        categoryBreakdown,
      });
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to fetch continent stats:", err);
    } finally {
      setIsLoading(false);
    }
  }, [continent]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return { countryStats, overallStats, isLoading, lastUpdated, refetch: fetchStats };
}

function useRealtimeConnection() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const channel = supabase
      .channel("continent-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "stories" }, () => {})
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return isConnected;
}

function TrendIcon({ trend }: { trend: "up" | "down" | "stable" }) {
  if (trend === "up") return <TrendingUp className="h-3 w-3 text-emerald-500" />;
  if (trend === "down") return <TrendingDown className="h-3 w-3 text-red-500" />;
  return <Minus className="h-3 w-3 text-muted-foreground" />;
}

function CountryCard({
  country,
  stats,
  onClick,
  theme,
}: {
  country: { id: string; name: string; code: string; flag: string };
  stats?: CountryStats;
  onClick: () => void;
  theme: { gradient: string; accent: string };
}) {
  const hasStories = (stats?.storyCount || 0) > 0;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="cursor-pointer"
      onClick={onClick}
    >
      <Card
        className={cn(
          "h-full transition-all duration-300 hover:shadow-lg",
          hasStories && "border-l-4",
          hasStories && `border-l-${theme.gradient.split("-")[1]}-500`
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{country.flag}</span>
              <div>
                <h3 className="font-semibold text-sm">{country.name}</h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  {country.code}
                </p>
              </div>
            </div>
            {stats && <TrendIcon trend={stats.trend} />}
          </div>

          <div className="flex items-center gap-2 mb-2">
            <div className={cn("flex items-center gap-1.5 rounded-full px-2 py-1", `bg-gradient-to-r ${theme.gradient}/10`)}>
              <Newspaper className={cn("w-3 h-3", theme.accent)} />
              <span className={cn("text-sm font-bold", theme.accent)}>
                {stats?.storyCount || 0}
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground">stories</span>
          </div>

          {stats?.recentHeadline && (
            <p className="text-[11px] text-muted-foreground line-clamp-2 mb-2">
              {stats.recentHeadline}
            </p>
          )}

          <div className="flex items-center justify-end text-[10px] text-muted-foreground">
            <span>View news</span>
            <ChevronRight className="h-3 w-3 ml-0.5" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function ContinentPage() {
  const { continentId } = useParams<{ continentId: string }>();
  const navigate = useNavigate();
  const isConnected = useRealtimeConnection();

  const continent = useMemo(() => getContinentById(continentId || ""), [continentId]);
  const theme = useMemo(
    () => CONTINENT_THEMES[continentId || ""] || CONTINENT_THEMES.asia,
    [continentId]
  );

  const { countryStats, overallStats, isLoading, lastUpdated, refetch } = useContinentStats(continent);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredCountries = useMemo(() => {
    if (!continent) return [];

    let filtered = [...continent.countries];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.code.toLowerCase().includes(query)
      );
    }

    if (selectedFilter === "active") {
      filtered = filtered.filter((c) => (countryStats[c.code]?.storyCount || 0) > 0);
    }

    return filtered.sort(
      (a, b) => (countryStats[b.code]?.storyCount || 0) - (countryStats[a.code]?.storyCount || 0)
    );
  }, [continent, searchQuery, selectedFilter, countryStats]);

  const breadcrumbItems = useMemo((): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [
      { id: "home", label: "Home", path: "/", type: "home" },
      { id: "world", label: "World", path: "/world", type: "continent", icon: <Globe className="w-3.5 h-3.5" /> },
    ];
    if (continent) {
      items.push({ id: continent.id, label: continent.name, type: "continent" });
    }
    return items;
  }, [continent]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  const handleCountryClick = useCallback(
    (country: { code: string }) => {
      if (country.code === "IN") {
        navigate("/india");
      } else {
        navigate(`/world/${country.code.toLowerCase()}`);
      }
    },
    [navigate]
  );

  const formatTime = (date: Date) => {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  if (!continent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Continent not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* Spacer for fixed header */}
      <div className="h-14" />

      {/* Breadcrumb Navigation - Sticky below header */}
      <div className="sticky top-14 z-40 bg-background/98 backdrop-blur-md border-b border-border/40">
        <div className="container mx-auto max-w-7xl px-4">
          <BreadcrumbNav
            items={breadcrumbItems}
            onNavigate={(item) => {
              if (item.path) navigate(item.path);
            }}
            onGoBack={() => navigate("/world")}
          />
        </div>
      </div>

      <RealtimeNewsIndicator onRefresh={handleRefresh} variant="bar" />

      <main>
        {/* Hero Section */}
        <section className={cn("border-b border-border/50 bg-gradient-to-b", theme.bgGradient)}>
          <div className="container mx-auto max-w-7xl px-4 py-8">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br text-white", theme.gradient)}>
                    <Globe className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">{continent.name}</h1>
                    <p className="text-muted-foreground text-sm">
                      {continent.countries.length} countries • Real-time news intelligence
                    </p>
                  </div>
                  <RealtimeStatusDot />
                </div>
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

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <Card className={cn("bg-gradient-to-br border-opacity-50", `${theme.bgGradient}`)}>
                <CardContent className="p-4">
                  <div className={cn("flex items-center gap-2 mb-1", theme.accent)}>
                    <MapPin className="w-4 h-4" />
                    <span className="text-xs font-medium">Countries</span>
                  </div>
                  <p className="text-2xl font-bold">{overallStats?.totalCountries || 0}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {overallStats?.activeCountries || 0} with news
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-blue-600 mb-1">
                    <Newspaper className="w-4 h-4" />
                    <span className="text-xs font-medium">Stories</span>
                  </div>
                  <p className="text-2xl font-bold">{overallStats?.totalStories || 0}</p>
                  <p className="text-[10px] text-muted-foreground">Last 48 hours</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-emerald-600 mb-1">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs font-medium">Top Country</span>
                  </div>
                  <p className="text-lg font-bold truncate">
                    {overallStats?.topCountries[0]?.flag} {overallStats?.topCountries[0]?.name || "—"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {overallStats?.topCountries[0]?.count || 0} stories
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-purple-600 mb-1">
                    <BarChart3 className="w-4 h-4" />
                    <span className="text-xs font-medium">Top Category</span>
                  </div>
                  <p className="text-lg font-bold truncate capitalize">
                    {overallStats?.categoryBreakdown[0]?.category || "—"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {overallStats?.categoryBreakdown[0]?.count || 0} stories
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Pipeline */}
        <section className="border-b border-border/50 bg-muted/10">
          <div className="container mx-auto max-w-7xl px-4 py-4">
            <IngestionPipelineViewer onIngestionComplete={refetch} />
          </div>
        </section>

        {/* Main Content */}
        <section className="py-6">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Sidebar */}
              <div className="lg:col-span-1 space-y-4">
                {/* Top Countries */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      Top Countries
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {overallStats?.topCountries.map((country, index) => (
                        <button
                          key={country.code}
                          onClick={() => handleCountryClick({ code: country.code })}
                          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm w-5 text-muted-foreground">{index + 1}</span>
                            <span className="text-lg">{country.flag}</span>
                            <span className="text-sm font-medium truncate max-w-[100px]">
                              {country.name}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-[10px]">
                            {country.count}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Category Breakdown */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-primary" />
                      Categories
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {overallStats?.categoryBreakdown.slice(0, 6).map((cat) => (
                        <div key={cat.category} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="capitalize">{cat.category}</span>
                            <span className="text-muted-foreground">{cat.count}</span>
                          </div>
                          <Progress
                            value={(cat.count / (overallStats?.totalStories || 1)) * 100}
                            className="h-1.5"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Countries Grid */}
              <div className="lg:col-span-3">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search countries..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Countries</SelectItem>
                      <SelectItem value="active">With News Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Country Grid */}
                {isLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className="h-40 bg-muted/50 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                    >
                      {filteredCountries.map((country, index) => (
                        <motion.div
                          key={country.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.02 }}
                        >
                          <CountryCard
                            country={country}
                            stats={countryStats[country.code]}
                            onClick={() => handleCountryClick(country)}
                            theme={theme}
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                )}

                {!isLoading && filteredCountries.length === 0 && (
                  <div className="text-center py-12">
                    <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium text-lg mb-2">No countries found</h3>
                    <p className="text-sm text-muted-foreground">
                      Try adjusting your search or filter.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
