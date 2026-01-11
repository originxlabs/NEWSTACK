import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Clock, ExternalLink, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface TimelineEvent {
  id: string;
  timestamp: string;
  description: string;
  sourceName: string;
  sourceUrl?: string;
  type: "initial" | "update" | "confirmation" | "contradiction" | "escalation";
}

interface StoryTimelineProps {
  storyId: string;
  events?: TimelineEvent[];
  publishedAt?: string;
  lastUpdatedAt?: string;
  className?: string;
}

const eventTypeConfig = {
  initial: {
    icon: Clock,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    label: "First reported",
  },
  update: {
    icon: TrendingUp,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    label: "Updated",
  },
  confirmation: {
    icon: CheckCircle,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    label: "Confirmed",
  },
  contradiction: {
    icon: AlertTriangle,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    label: "Contradicted",
  },
  escalation: {
    icon: TrendingUp,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    label: "Escalated",
  },
};

// Generate mock timeline events based on available data
function generateTimelineEvents(publishedAt?: string, lastUpdatedAt?: string): TimelineEvent[] {
  if (!publishedAt) return [];
  
  const events: TimelineEvent[] = [
    {
      id: "1",
      timestamp: publishedAt,
      description: "Story first reported",
      sourceName: "Primary Source",
      type: "initial",
    },
  ];

  // Add update event if there's a last updated time different from published
  if (lastUpdatedAt && lastUpdatedAt !== publishedAt) {
    const publishedDate = new Date(publishedAt);
    const updatedDate = new Date(lastUpdatedAt);
    
    if (updatedDate > publishedDate) {
      events.push({
        id: "2",
        timestamp: lastUpdatedAt,
        description: "Additional sources confirmed details",
        sourceName: "Multiple sources",
        type: "confirmation",
      });
    }
  }

  return events;
}

export function StoryTimeline({ 
  storyId, 
  events: providedEvents, 
  publishedAt,
  lastUpdatedAt,
  className 
}: StoryTimelineProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const events = providedEvents || generateTimelineEvents(publishedAt, lastUpdatedAt);
  
  if (events.length === 0) return null;

  return (
    <div className={cn("", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="h-7 px-2 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
      >
        <Clock className="w-3 h-3" />
        View timeline
        <ChevronDown className={cn(
          "w-3 h-3 transition-transform",
          isExpanded && "rotate-180"
        )} />
      </Button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3 pl-2">
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
                
                {/* Events */}
                <div className="space-y-3">
                  {events.map((event, index) => {
                    const config = eventTypeConfig[event.type];
                    const Icon = config.icon;
                    
                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative flex gap-3"
                      >
                        {/* Dot */}
                        <div className={cn(
                          "w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 z-10",
                          config.bgColor
                        )}>
                          <Icon className={cn("w-2.5 h-2.5", config.color)} />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0 pb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                              {config.label}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-xs text-foreground mt-1">
                            {event.description}
                          </p>
                          {event.sourceUrl ? (
                            <a
                              href={event.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary mt-1"
                            >
                              {event.sourceName}
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          ) : (
                            <span className="text-[10px] text-muted-foreground mt-1 block">
                              {event.sourceName}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
