import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Layers, Filter, ChevronDown } from "lucide-react";
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
  className?: string;
}

const timeFilters = [
  { id: "latest", label: "Latest" },
  { id: "yesterday", label: "Since yesterday" },
  { id: "lastVisit", label: "Since last visit" },
];

export function LeftContextPanel({
  categories,
  selectedCategory,
  onCategoryChange,
  timeFilter,
  onTimeFilterChange,
  viewAsClusters,
  onViewChange,
  className,
}: LeftContextPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={cn(
      "hidden lg:block w-56 flex-shrink-0",
      className
    )}>
      <div className="sticky top-20 space-y-4">
        {/* Header */}
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
            className="space-y-5"
          >
            {/* Categories */}
            <div className="space-y-2">
              <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                <Filter className="w-3 h-3" />
                Categories
              </span>
              <div className="space-y-0.5">
                {categories.map((cat) => (
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

            <Separator className="opacity-50" />

            {/* View toggle */}
            <div className="space-y-3">
              <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                <Layers className="w-3 h-3" />
                View mode
              </span>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  View as clusters
                </span>
                <Switch
                  checked={viewAsClusters}
                  onCheckedChange={onViewChange}
                  className="scale-90"
                />
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Groups similar stories and shows unified summaries
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </aside>
  );
}
