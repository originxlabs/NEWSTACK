import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, ChevronRight, ChevronDown, Newspaper, 
  Building2, Users, TrendingUp, Languages, Filter,
  Search, X, Map
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { DistrictConfig, LANGUAGE_CONFIG, getStateFlag } from "@/lib/india-states-config";

interface Story {
  id: string;
  headline: string;
  district: string | null;
  city: string | null;
  category: string | null;
  original_language: string | null;
}

interface DistrictDrilldownProps {
  stateId: string;
  stateName: string;
  stateCode: string;
  stateColor: string;
  districts: DistrictConfig[];
  stories: Story[];
  onDistrictSelect: (district: string) => void;
  selectedDistrict: string;
  className?: string;
}

export function DistrictDrilldown({
  stateId,
  stateName,
  stateCode,
  stateColor,
  districts,
  stories,
  onDistrictSelect,
  selectedDistrict,
  className,
}: DistrictDrilldownProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // Get flag info
  const flagInfo = getStateFlag(stateId);

  // Calculate stories per district
  const districtStats = useMemo(() => {
    const stats: Record<string, { count: number; regional: number; categories: Record<string, number> }> = {};
    
    districts.forEach(d => {
      stats[d.name.toLowerCase()] = { count: 0, regional: 0, categories: {} };
    });

    stories.forEach(story => {
      const districtLower = story.district?.toLowerCase() || "";
      const cityLower = story.city?.toLowerCase() || "";
      
      // Try to match story to district
      for (const district of districts) {
        const districtName = district.name.toLowerCase();
        const hqName = district.headquarters?.toLowerCase() || "";
        
        if (
          districtLower.includes(districtName) ||
          districtName.includes(districtLower) ||
          cityLower.includes(hqName) ||
          hqName.includes(cityLower) ||
          cityLower.includes(districtName)
        ) {
          if (!stats[districtName]) {
            stats[districtName] = { count: 0, regional: 0, categories: {} };
          }
          stats[districtName].count++;
          
          if (story.original_language && story.original_language !== "en") {
            stats[districtName].regional++;
          }
          
          if (story.category) {
            stats[districtName].categories[story.category] = 
              (stats[districtName].categories[story.category] || 0) + 1;
          }
          break;
        }
      }
    });

    return stats;
  }, [districts, stories]);

  // Filter and sort districts
  const filteredDistricts = useMemo(() => {
    let result = [...districts];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(d => 
        d.name.toLowerCase().includes(query) ||
        d.headquarters?.toLowerCase().includes(query)
      );
    }

    // Sort by story count (descending), then alphabetically
    result.sort((a, b) => {
      const countA = districtStats[a.name.toLowerCase()]?.count || 0;
      const countB = districtStats[b.name.toLowerCase()]?.count || 0;
      if (countB !== countA) return countB - countA;
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [districts, searchQuery, districtStats]);

  // Calculate totals
  const totalDistrictStories = Object.values(districtStats).reduce((sum, s) => sum + s.count, 0);
  const totalRegionalStories = Object.values(districtStats).reduce((sum, s) => sum + s.regional, 0);
  const districtsWithNews = Object.values(districtStats).filter(s => s.count > 0).length;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <div 
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold",
                stateColor
              )}
              style={flagInfo ? { 
                background: `linear-gradient(135deg, ${flagInfo.colors[0]}, ${flagInfo.colors[1] || flagInfo.colors[0]})`
              } : undefined}
            >
              {flagInfo?.emoji || stateCode}
            </div>
            <div>
              <span className="block">{stateName} Districts</span>
              <span className="text-[10px] text-muted-foreground font-normal">
                {districtsWithNews}/{districts.length} districts with news
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

        {/* Stats row */}
        <div className="flex items-center gap-3 mt-2">
          <Badge variant="secondary" className="text-[10px]">
            <Newspaper className="w-3 h-3 mr-1" />
            {totalDistrictStories} stories
          </Badge>
          <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600">
            <Languages className="w-3 h-3 mr-1" />
            {totalRegionalStories} regional
          </Badge>
          <Badge variant="secondary" className="text-[10px]">
            <Map className="w-3 h-3 mr-1" />
            {districts.length} districts
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
                  placeholder="Search districts..."
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

              {/* Clear selection button */}
              {selectedDistrict !== "all" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDistrictSelect("all")}
                  className="w-full mb-3 h-7 text-xs gap-1"
                >
                  <X className="w-3 h-3" />
                  Clear district filter
                </Button>
              )}

              {/* Districts list */}
              <ScrollArea className="h-[400px]">
                <div className="space-y-1 pr-3">
                  {filteredDistricts.map((district, index) => {
                    const stats = districtStats[district.name.toLowerCase()];
                    const storyCount = stats?.count || 0;
                    const regionalCount = stats?.regional || 0;
                    const isSelected = selectedDistrict.toLowerCase() === district.name.toLowerCase();
                    const hasNews = storyCount > 0;
                    const topCategory = stats?.categories 
                      ? Object.entries(stats.categories).sort((a, b) => b[1] - a[1])[0]?.[0]
                      : null;

                    return (
                      <motion.button
                        key={district.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        onClick={() => onDistrictSelect(district.name)}
                        className={cn(
                          "w-full flex items-start gap-2 p-2 rounded-lg transition-all text-left group",
                          isSelected 
                            ? "bg-primary/10 border border-primary/30" 
                            : "hover:bg-muted/60",
                          !hasNews && "opacity-60"
                        )}
                      >
                        {/* Rank/Number */}
                        <div className={cn(
                          "w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5",
                          hasNews ? stateColor.replace("bg-", "bg-opacity-20 text-") : "bg-muted text-muted-foreground"
                        )}>
                          {hasNews ? index + 1 : "-"}
                        </div>

                        {/* District info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={cn(
                              "text-sm font-medium truncate",
                              isSelected && "text-primary"
                            )}>
                              {district.name}
                            </span>
                            {hasNews && (
                              <Badge 
                                variant="secondary" 
                                className={cn(
                                  "text-[9px] h-4 px-1.5 flex-shrink-0",
                                  regionalCount > 0 && "bg-emerald-500/10 text-emerald-600"
                                )}
                              >
                                {storyCount}
                              </Badge>
                            )}
                          </div>
                          
                          {district.headquarters && (
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                              <Building2 className="w-2.5 h-2.5" />
                              <span className="truncate">{district.headquarters}</span>
                            </div>
                          )}

                          {/* Progress bar for story distribution */}
                          {hasNews && totalDistrictStories > 0 && (
                            <div className="mt-1.5">
                              <Progress 
                                value={(storyCount / totalDistrictStories) * 100} 
                                className="h-1"
                              />
                            </div>
                          )}

                          {/* Top category and regional indicator */}
                          {hasNews && (
                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                              {topCategory && (
                                <Badge variant="outline" className="text-[8px] h-4 px-1">
                                  {topCategory}
                                </Badge>
                              )}
                              {regionalCount > 0 && (
                                <Badge className="text-[8px] h-4 px-1 bg-emerald-500/20 text-emerald-600 border-0">
                                  <Languages className="w-2 h-2 mr-0.5" />
                                  {regionalCount} regional
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>

                        <ChevronRight className={cn(
                          "w-4 h-4 flex-shrink-0 text-muted-foreground transition-transform mt-0.5",
                          isSelected && "text-primary rotate-90"
                        )} />
                      </motion.button>
                    );
                  })}

                  {filteredDistricts.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No districts found</p>
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
