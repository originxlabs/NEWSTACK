import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Layers, Filter, ChevronDown, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface LeftContextPanelProps {
  categories: { slug: string; name: string }[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  timeFilter: string;
  onTimeFilterChange: (filter: string) => void;
  viewAsClusters: boolean;
  onViewChange: (clusters: boolean) => void;
  onResetFilters?: () => void;
  className?: string;
}

const timeFilters = [
  { id: "latest", label: "Latest" },
  { id: "2hours", label: "Last 2 hours" },
  { id: "yesterday", label: "Since yesterday" },
  { id: "lastVisit", label: "Since last visit" },
];

// Categories shown by default vs collapsed
const PRIMARY_CATEGORIES = ["all", "politics", "business", "tech", "world"];

export function LeftContextPanel({
  categories,
  selectedCategory,
  onCategoryChange,
  timeFilter,
  onTimeFilterChange,
  viewAsClusters,
  onViewChange,
  onResetFilters,
  className,
}: LeftContextPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);

  const primaryCategories = categories.filter(c => PRIMARY_CATEGORIES.includes(c.slug));
  const secondaryCategories = categories.filter(c => !PRIMARY_CATEGORIES.includes(c.slug));

  const hasActiveFilters = selectedCategory !== "all" || timeFilter !== "latest" || viewAsClusters;

  return (
    <aside className={cn(
      "hidden lg:block w-52 flex-shrink-0",
      className
    )}>
      <div className="sticky top-20 space-y-4">
        {/* Header with collapse */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Filters
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <ChevronDown className={cn(
              "w-3.5 h-3.5 transition-transform",
              isCollapsed && "-rotate-90"
            )} />
          </Button>
        </div>

        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* View mode toggle - MOVED HIGHER */}
            <div className="space-y-2">
              <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                <Layers className="w-3 h-3" />
                View mode
              </span>
              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-foreground">
                  View as clusters
                </span>
                <Switch
                  checked={viewAsClusters}
                  onCheckedChange={onViewChange}
                  className="scale-90"
                />
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Groups similar stories from multiple sources
              </p>
            </div>

            <Separator className="opacity-50" />

            {/* Categories */}
            <div className="space-y-2">
              <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                <Filter className="w-3 h-3" />
                Categories
              </span>
              <div className="space-y-0.5">
                {primaryCategories.map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => onCategoryChange(cat.slug)}
                    className={cn(
                      "w-full text-left px-2.5 py-1.5 text-sm rounded-md transition-colors",
                      selectedCategory === cat.slug
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
                
                {/* Collapsed secondary categories */}
                {secondaryCategories.length > 0 && (
                  <>
                    <button
                      onClick={() => setShowAllCategories(!showAllCategories)}
                      className="w-full text-left px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      {showAllCategories ? "Show less" : `+${secondaryCategories.length} more`}
                      <ChevronDown className={cn(
                        "w-3 h-3 transition-transform",
                        showAllCategories && "rotate-180"
                      )} />
                    </button>
                    
                    {showAllCategories && secondaryCategories.map((cat) => (
                      <button
                        key={cat.slug}
                        onClick={() => onCategoryChange(cat.slug)}
                        className={cn(
                          "w-full text-left px-2.5 py-1.5 text-sm rounded-md transition-colors",
                          selectedCategory === cat.slug
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>

            <Separator className="opacity-50" />

            {/* Time filters */}
            <div className="space-y-2">
              <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                Time
              </span>
              <div className="space-y-0.5">
                {timeFilters.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => onTimeFilterChange(filter.id)}
                    className={cn(
                      "w-full text-left px-2.5 py-1.5 text-sm rounded-md transition-colors",
                      timeFilter === filter.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reset filters */}
            {hasActiveFilters && onResetFilters && (
              <>
                <Separator className="opacity-50" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-7 text-xs text-muted-foreground hover:text-foreground justify-start gap-1.5"
                  onClick={onResetFilters}
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset filters
                </Button>
              </>
            )}
          </motion.div>
        )}
      </div>
    </aside>
  );
}
