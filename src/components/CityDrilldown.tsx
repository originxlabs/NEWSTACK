import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, ChevronRight, ChevronDown, Newspaper, 
  Building2, Languages, Search, X, Map, Navigation
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { LANGUAGE_CONFIG } from "@/lib/india-states-config";

interface Story {
  id: string;
  headline: string;
  city: string | null;
  locality: string | null;
  category: string | null;
  original_language: string | null;
}

interface CityDrilldownProps {
  stateId: string;
  stateName: string;
  districtName: string;
  cities: string[];
  stories: Story[];
  onCitySelect: (city: string) => void;
  selectedCity: string;
  className?: string;
}

export function CityDrilldown({
  stateId,
  stateName,
  districtName,
  cities,
  stories,
  onCitySelect,
  selectedCity,
  className,
}: CityDrilldownProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);

  // Calculate stories per city
  const cityStats = useMemo(() => {
    const stats: Record<string, { count: number; regional: number; categories: Record<string, number> }> = {};
    
    cities.forEach(city => {
      stats[city.toLowerCase()] = { count: 0, regional: 0, categories: {} };
    });

    stories.forEach(story => {
      const cityLower = story.city?.toLowerCase() || "";
      
      for (const city of cities) {
        if (cityLower.includes(city.toLowerCase()) || city.toLowerCase().includes(cityLower)) {
          if (!stats[city.toLowerCase()]) {
            stats[city.toLowerCase()] = { count: 0, regional: 0, categories: {} };
          }
          stats[city.toLowerCase()].count++;
          
          if (story.original_language && story.original_language !== "en") {
            stats[city.toLowerCase()].regional++;
          }
          
          if (story.category) {
            stats[city.toLowerCase()].categories[story.category] = 
              (stats[city.toLowerCase()].categories[story.category] || 0) + 1;
          }
          break;
        }
      }
    });

    return stats;
  }, [cities, stories]);

  // Filter cities
  const filteredCities = useMemo(() => {
    let result = [...cities];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(city => city.toLowerCase().includes(query));
    }

    // Sort by story count
    result.sort((a, b) => {
      const countA = cityStats[a.toLowerCase()]?.count || 0;
      const countB = cityStats[b.toLowerCase()]?.count || 0;
      if (countB !== countA) return countB - countA;
      return a.localeCompare(b);
    });

    return result;
  }, [cities, searchQuery, cityStats]);

  const totalCityStories = Object.values(cityStats).reduce((sum, s) => sum + s.count, 0);
  const citiesWithNews = Object.values(cityStats).filter(s => s.count > 0).length;

  const handleViewNews = (city: string) => {
    navigate(`/news?state=${stateName}&city=${city}`);
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Navigation className="w-4 h-4 text-primary" />
            <div>
              <span className="block">{districtName} Cities</span>
              <span className="text-[10px] text-muted-foreground font-normal">
                {citiesWithNews}/{cities.length} cities with news
              </span>
            </div>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>

        <div className="flex items-center gap-3 mt-2">
          <Badge variant="secondary" className="text-[10px]">
            <Newspaper className="w-3 h-3 mr-1" />
            {totalCityStories} stories
          </Badge>
          <Badge variant="secondary" className="text-[10px]">
            <MapPin className="w-3 h-3 mr-1" />
            {cities.length} cities
          </Badge>
        </div>
      </CardHeader>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="pt-0">
              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                <Input
                  placeholder="Search cities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-7 pr-8 text-xs"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-0 top-0 h-8 w-8 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>

              {/* Clear selection */}
              {selectedCity !== "all" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCitySelect("all")}
                  className="w-full mb-3 h-7 text-xs gap-1"
                >
                  <X className="w-3 h-3" />
                  Clear city filter
                </Button>
              )}

              {/* Cities list */}
              <ScrollArea className="h-[300px]">
                <div className="space-y-1 pr-3">
                  {filteredCities.map((city, index) => {
                    const stats = cityStats[city.toLowerCase()];
                    const storyCount = stats?.count || 0;
                    const regionalCount = stats?.regional || 0;
                    const isSelected = selectedCity.toLowerCase() === city.toLowerCase();
                    const hasNews = storyCount > 0;

                    return (
                      <motion.div
                        key={city}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className={cn(
                          "flex items-center justify-between gap-2 p-2 rounded-lg transition-all",
                          isSelected 
                            ? "bg-primary/10 border border-primary/30" 
                            : "hover:bg-muted/60",
                          !hasNews && "opacity-60"
                        )}
                      >
                        <button
                          onClick={() => onCitySelect(city)}
                          className="flex items-center gap-2 flex-1 min-w-0 text-left"
                        >
                          <MapPin className={cn(
                            "w-3.5 h-3.5 flex-shrink-0",
                            hasNews ? "text-primary" : "text-muted-foreground"
                          )} />
                          <div className="flex-1 min-w-0">
                            <span className={cn(
                              "text-sm font-medium truncate block",
                              isSelected && "text-primary"
                            )}>
                              {city}
                            </span>
                            {hasNews && totalCityStories > 0 && (
                              <Progress 
                                value={(storyCount / totalCityStories) * 100} 
                                className="h-0.5 mt-1"
                              />
                            )}
                          </div>
                        </button>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {regionalCount > 0 && (
                            <Badge className="text-[8px] h-4 px-1 bg-emerald-500/20 text-emerald-600 border-0">
                              <Languages className="w-2 h-2 mr-0.5" />
                              {regionalCount}
                            </Badge>
                          )}
                          {hasNews && (
                            <Badge variant="secondary" className="text-[9px] h-4 px-1.5">
                              {storyCount}
                            </Badge>
                          )}
                          {hasNews && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewNews(city)}
                              className="h-6 w-6 p-0"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}

                  {filteredCities.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No cities found</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
