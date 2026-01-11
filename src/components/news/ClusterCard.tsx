import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Clock,
  Layers,
  Shield,
  ExternalLink,
  Zap,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { StoryCluster } from "@/lib/story-clustering";

interface ClusterCardProps {
  cluster: StoryCluster;
  onClick?: () => void;
  showUpdateBadge?: boolean;
}

const signalConfig = {
  breaking: {
    icon: Zap,
    label: "Breaking",
    color: "bg-red-500/10 text-red-600 border-red-500/20",
  },
  developing: {
    icon: RefreshCw,
    label: "Developing",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
  stabilized: {
    icon: CheckCircle2,
    label: "Verified",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
  contradicted: {
    icon: AlertTriangle,
    label: "Contradicted",
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  },
  resolved: {
    icon: CheckCircle2,
    label: "Resolved",
    color: "bg-muted text-muted-foreground border-border",
  },
};

const confidenceConfig = {
  low: { label: "Low", color: "text-amber-600", bg: "bg-amber-500/10" },
  medium: { label: "Medium", color: "text-blue-600", bg: "bg-blue-500/10" },
  high: { label: "High", color: "text-emerald-600", bg: "bg-emerald-500/10" },
};

const topicColors: Record<string, string> = {
  business: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  tech: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  technology: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  world: "bg-teal-500/10 text-teal-600 border-teal-500/20",
  politics: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  health: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  climate: "bg-green-500/10 text-green-600 border-green-500/20",
  finance: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  sports: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  ai: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  science: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
};

export function ClusterCard({ cluster, onClick, showUpdateBadge }: ClusterCardProps) {
  const [showSources, setShowSources] = useState(false);

  const signalInfo = signalConfig[cluster.signal];
  const confInfo = confidenceConfig[cluster.confidence];
  const SignalIcon = signalInfo.icon;

  const freshness = formatDistanceToNow(new Date(cluster.lastUpdated), {
    addSuffix: true,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="group overflow-hidden hover:shadow-md transition-all cursor-pointer border-border/50"
        onClick={onClick}
      >
        <CardContent className="p-4 sm:p-5">
          {/* Header with source count indicator */}
          <div className="flex items-start gap-3 mb-3">
            {/* Source count indicator */}
            <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-muted flex flex-col items-center justify-center">
              <span className="text-base font-semibold text-foreground">
                {cluster.sourceCount}
              </span>
              <span className="text-[8px] text-muted-foreground uppercase tracking-wide">
                sources
              </span>
            </div>

            <div className="flex-1 min-w-0">
              {/* Meta row */}
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                {cluster.topic && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] h-5 capitalize",
                      topicColors[cluster.topic.toLowerCase()] || "bg-muted"
                    )}
                  >
                    {cluster.topic}
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className={cn("text-[10px] h-5 gap-1", signalInfo.color)}
                >
                  <SignalIcon className="w-2.5 h-2.5" />
                  {signalInfo.label}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn("text-[10px] h-5", confInfo.bg, confInfo.color)}
                >
                  <Shield className="w-2.5 h-2.5 mr-1" />
                  {confInfo.label}
                </Badge>
                {showUpdateBadge && (
                  <Badge className="text-[10px] h-5 bg-primary/20 text-primary border-primary/30">
                    Updated
                  </Badge>
                )}
              </div>

              {/* Headline */}
              <h3 className="font-display text-sm sm:text-base font-semibold leading-snug text-foreground mb-1.5 group-hover:text-primary transition-colors line-clamp-2">
                {cluster.headline}
              </h3>

              {/* Summary */}
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {cluster.summary}
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
                <span>
                  {cluster.verifiedSourceCount}/{cluster.sourceCount} verified
                </span>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={(e) => {
                e.stopPropagation();
                setShowSources(!showSources);
              }}
            >
              {showSources ? "Less" : "Sources"}
              <ChevronDown
                className={cn(
                  "w-3 h-3 transition-transform",
                  showSources && "rotate-180"
                )}
              />
            </Button>
          </div>

          {/* Expanded sources */}
          <AnimatePresence>
            {showSources && cluster.sources.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-3 mt-3 border-t border-border/50 space-y-2">
                  {cluster.sources.slice(0, 5).map((source, i) => (
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
                          {source.published_at && (
                            <span className="text-[10px] text-muted-foreground">
                              {formatDistanceToNow(new Date(source.published_at), {
                                addSuffix: true,
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                      <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover/source:opacity-100 transition-opacity flex-shrink-0" />
                    </a>
                  ))}
                  {cluster.sources.length > 5 && (
                    <p className="text-[10px] text-muted-foreground text-center pt-1">
                      +{cluster.sources.length - 5} more sources
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
