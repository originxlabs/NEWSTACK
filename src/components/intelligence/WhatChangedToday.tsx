import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Sparkles, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface Story {
  id: string;
  headline: string;
  topic?: string;
  sourceCount?: number;
  publishedAt?: string;
  trendDirection?: "up" | "down" | "new";
}

interface WhatChangedTodayProps {
  stories: Story[];
  className?: string;
}

function categorizeStories(stories: Story[]): {
  escalated: Story[];
  deescalated: Story[];
  emerging: Story[];
} {
  const now = new Date();
  const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);

  const escalated: Story[] = [];
  const deescalated: Story[] = [];
  const emerging: Story[] = [];

  stories.forEach(story => {
    const publishedDate = story.publishedAt ? new Date(story.publishedAt) : now;
    const sourceCount = story.sourceCount || 1;

    // Emerging: Less than 1 hour old
    if (publishedDate > oneHourAgo) {
      emerging.push({ ...story, trendDirection: "new" });
    }
    // Escalated: Multiple sources, recent
    else if (sourceCount >= 3 && publishedDate > sixHoursAgo) {
      escalated.push({ ...story, trendDirection: "up" });
    }
    // De-escalated: Older stories that had multiple sources
    else if (sourceCount >= 2 && publishedDate <= sixHoursAgo) {
      deescalated.push({ ...story, trendDirection: "down" });
    }
  });

  return {
    escalated: escalated.slice(0, 3),
    deescalated: deescalated.slice(0, 2),
    emerging: emerging.slice(0, 3),
  };
}

const trendConfig = {
  up: {
    icon: TrendingUp,
    color: "text-red-500",
    bg: "bg-red-500/10",
    label: "Escalating",
  },
  down: {
    icon: TrendingDown,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    label: "De-escalating",
  },
  new: {
    icon: Sparkles,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    label: "Emerging",
  },
};

function StoryChip({ story, direction }: { story: Story; direction: "up" | "down" | "new" }) {
  const navigate = useNavigate();
  const config = trendConfig[direction];
  const Icon = config.icon;

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/news?story=${story.id}`)}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors",
        "hover:border-primary/50 cursor-pointer text-left",
        "bg-card/50 border-border/50"
      )}
    >
      <div className={cn("p-1 rounded-md flex-shrink-0", config.bg)}>
        <Icon className={cn("w-3 h-3", config.color)} />
      </div>
      <span className="text-xs font-medium line-clamp-1 flex-1">
        {story.headline}
      </span>
      {story.sourceCount && story.sourceCount >= 2 && (
        <Badge variant="outline" className="text-[9px] h-4 px-1.5 flex-shrink-0">
          {story.sourceCount}
        </Badge>
      )}
    </motion.button>
  );
}

export function WhatChangedToday({ stories, className }: WhatChangedTodayProps) {
  const navigate = useNavigate();
  const { escalated, deescalated, emerging } = useMemo(
    () => categorizeStories(stories),
    [stories]
  );

  const hasContent = escalated.length > 0 || deescalated.length > 0 || emerging.length > 0;

  if (!hasContent) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "border-b border-border/50 bg-gradient-to-r from-muted/30 via-background to-muted/30",
        className
      )}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            What Changed Today
          </h2>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs h-7 gap-1"
            onClick={() => navigate("/news")}
          >
            View all
            <ArrowRight className="w-3 h-3" />
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
          {/* Escalating */}
          {escalated.length > 0 && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-red-500" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                  Escalating
                </span>
              </div>
              <div className="space-y-1.5">
                {escalated.map(story => (
                  <StoryChip key={story.id} story={story} direction="up" />
                ))}
              </div>
            </div>
          )}

          {/* De-escalating */}
          {deescalated.length > 0 && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                  De-escalating
                </span>
              </div>
              <div className="space-y-1.5">
                {deescalated.map(story => (
                  <StoryChip key={story.id} story={story} direction="down" />
                ))}
              </div>
            </div>
          )}

          {/* Emerging */}
          {emerging.length > 0 && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                  Emerging
                </span>
              </div>
              <div className="space-y-1.5">
                {emerging.map(story => (
                  <StoryChip key={story.id} story={story} direction="new" />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}
