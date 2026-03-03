import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronDown, ChevronRight, Clock, Layers, 
  Shield, ExternalLink, TrendingUp
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StorySignal } from "./StorySignal";
import { formatDistanceToNow } from "date-fns";

interface ClusterSource {
  source_name: string;
  source_url: string;
  published_at: string;
  description?: string;
}

interface StoryClusterProps {
  id: string;
  headline: string;
  summary: string;
  sourceCount: number;
  sources?: ClusterSource[];
  publishedAt?: string;
  lastUpdatedAt?: string;
  topic?: string;
  confidence: "low" | "medium" | "high";
  onReadMore?: () => void;
  className?: string;
}

const confidenceConfig = {
  low: { 
    color: "text-amber-600", 
    bg: "bg-amber-500/10", 
    border: "border-amber-500/20",
    label: "Low confidence" 
  },
  medium: { 
    color: "text-blue-600", 
    bg: "bg-blue-500/10", 
    border: "border-blue-500/20",
    label: "Medium confidence" 
  },
  high: { 
    color: "text-emerald-600", 
    bg: "bg-emerald-500/10", 
    border: "border-emerald-500/20",
    label: "High confidence" 
  },
};

const topicColors: Record<string, string> = {
  business: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  tech: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  world: "bg-teal-500/10 text-teal-600 border-teal-500/20",
  politics: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  health: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  climate: "bg-green-500/10 text-green-600 border-green-500/20",
  finance: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  sports: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  ai: "bg-purple-500/10 text-purple-600 border-purple-500/20",
};

export function StoryCluster({
  id,
  headline,
  summary,
  sourceCount,
  sources = [],
  publishedAt,
  lastUpdatedAt,
  topic,
  confidence,
  onReadMore,
  className,
}: StoryClusterProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const confConfig = confidenceConfig[confidence];

  const freshness = publishedAt 
    ? formatDistanceToNow(new Date(publishedAt), { addSuffix: true })
    : "Recently";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "cluster-card group",
        className
      )}
      onClick={() => !isExpanded && onReadMore?.()}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {/* Source count indicator */}
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex flex-col items-center justify-center">
          <span className="text-sm font-semibold text-foreground">{sourceCount}</span>
          <span className="text-[8px] text-muted-foreground uppercase tracking-wide">sources</span>
        </div>

        <div className="flex-1 min-w-0">
          {/* Meta row */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {topic && (
              <Badge 
                variant="outline" 
                className={cn(
                  "text-[10px] h-5 capitalize",
                  topicColors[topic.toLowerCase()] || "bg-muted"
                )}
              >
                {topic}
              </Badge>
            )}
            <StorySignal 
              publishedAt={publishedAt}
              sourceCount={sourceCount}
              variant="badge"
            />
            <Badge 
              variant="outline" 
              className={cn("text-[10px] h-5", confConfig.bg, confConfig.color, confConfig.border)}
            >
              <Shield className="w-2.5 h-2.5 mr-1" />
              {confConfig.label}
            </Badge>
          </div>

          {/* Headline */}
          <h3 className="font-semibold text-sm sm:text-base leading-snug text-foreground mb-1.5 group-hover:text-primary transition-colors">
            {headline}
          </h3>

          {/* Summary */}
          <p className="text-sm text-muted-foreground line-clamp-2">
            {summary}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{freshness}</span>
          </div>
          <div className="flex items-center gap-1">
            <Layers className="w-3 h-3" />
            <span>{sourceCount} independent sources</span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          {isExpanded ? "Less" : "Sources"}
          <ChevronDown className={cn(
            "w-3 h-3 transition-transform",
            isExpanded && "rotate-180"
          )} />
        </Button>
      </div>

      {/* Expanded sources */}
      <AnimatePresence>
        {isExpanded && sources.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3 mt-3 border-t border-border/50 space-y-2">
              {sources.slice(0, 5).map((source, i) => (
                <a
                  key={i}
                  href={source.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors group/source"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-5 h-5 rounded bg-muted flex items-center justify-center text-[10px] font-medium flex-shrink-0">
                      {source.source_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-foreground truncate block">
                        {source.source_name}
                      </span>
                      {source.description && (
                        <span className="text-[10px] text-muted-foreground line-clamp-1">
                          {source.description}
                        </span>
                      )}
                    </div>
                  </div>
                  <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover/source:opacity-100 transition-opacity flex-shrink-0" />
                </a>
              ))}
              {sources.length > 5 && (
                <p className="text-[10px] text-muted-foreground text-center pt-1">
                  +{sources.length - 5} more sources
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
