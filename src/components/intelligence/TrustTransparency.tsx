import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, ChevronDown, CheckCircle2, AlertCircle, 
  Clock, Newspaper, RefreshCw, ExternalLink 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Source {
  source_name: string;
  source_url: string;
  published_at: string;
  description?: string;
}

interface TrustTransparencyProps {
  sources: Source[];
  sourceCount: number;
  primarySource?: string;
  primarySourceUrl?: string;
  publishedAt?: string;
  lastUpdatedAt?: string;
  className?: string;
}

// Verified sources list
const VERIFIED_SOURCES = [
  "Reuters", "AP News", "Associated Press", "AFP", "PTI",
  "BBC", "CNN", "Al Jazeera", "NPR", "NBC News", "CBS News", "ABC News",
  "New York Times", "Washington Post", "The Guardian", "The Hindu",
  "Bloomberg", "CNBC", "Forbes", "TechCrunch", "The Verge"
];

function isVerified(sourceName: string): boolean {
  return VERIFIED_SOURCES.some(vs => 
    sourceName.toLowerCase().includes(vs.toLowerCase())
  );
}

function getUpdateConsistency(sources: Source[]): "consistent" | "mixed" | "inconsistent" {
  if (sources.length < 2) return "consistent";
  
  // Check if timestamps are within 2 hours of each other
  const timestamps = sources
    .map(s => new Date(s.published_at).getTime())
    .filter(t => !isNaN(t));
  
  if (timestamps.length < 2) return "consistent";
  
  const maxDiff = Math.max(...timestamps) - Math.min(...timestamps);
  const twoHours = 2 * 60 * 60 * 1000;
  const sixHours = 6 * 60 * 60 * 1000;
  
  if (maxDiff < twoHours) return "consistent";
  if (maxDiff < sixHours) return "mixed";
  return "inconsistent";
}

export function TrustTransparency({
  sources,
  sourceCount,
  primarySource,
  primarySourceUrl,
  publishedAt,
  lastUpdatedAt,
  className,
}: TrustTransparencyProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const verifiedSources = sources.filter(s => isVerified(s.source_name));
  const unverifiedSources = sources.filter(s => !isVerified(s.source_name));
  const consistency = getUpdateConsistency(sources);

  const consistencyConfig = {
    consistent: { 
      color: "text-emerald-500", 
      bg: "bg-emerald-500/10", 
      label: "Consistent updates" 
    },
    mixed: { 
      color: "text-amber-500", 
      bg: "bg-amber-500/10", 
      label: "Mixed update times" 
    },
    inconsistent: { 
      color: "text-orange-500", 
      bg: "bg-orange-500/10", 
      label: "Inconsistent updates" 
    },
  };

  const consConfig = consistencyConfig[consistency];

  return (
    <div className={cn("border rounded-lg", className)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full px-3 py-2 text-xs hover:bg-muted/50 transition-colors rounded-lg"
      >
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Why trust this?</span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-3 border-t border-border/50">
              {/* Source Count */}
              <div className="pt-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <Newspaper className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Source count:</span>
                </div>
                <Badge variant="outline" className="text-[10px] h-5">
                  {sourceCount} source{sourceCount !== 1 ? "s" : ""}
                </Badge>
              </div>

              {/* Primary vs Secondary */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Verified sources:</span>
                </div>
                <div className="flex items-center gap-1">
                  <Badge 
                    variant="outline" 
                    className="text-[10px] h-5 bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                  >
                    {verifiedSources.length} primary
                  </Badge>
                  {unverifiedSources.length > 0 && (
                    <Badge variant="outline" className="text-[10px] h-5">
                      {unverifiedSources.length} secondary
                    </Badge>
                  )}
                </div>
              </div>

              {/* Update Consistency */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Update consistency:</span>
                </div>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-[10px] h-5",
                    consConfig.bg,
                    consConfig.color
                  )}
                >
                  {consConfig.label}
                </Badge>
              </div>

              {/* Conflicting Reports */}
              {unverifiedSources.length > verifiedSources.length && (
                <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-500/10 rounded-lg px-2 py-1.5">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>More unverified than verified sources</span>
                </div>
              )}

              {/* Source Links */}
              {verifiedSources.length > 0 && (
                <div className="pt-2 border-t border-border/50">
                  <p className="text-[10px] text-muted-foreground mb-2">Verified sources:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {verifiedSources.slice(0, 4).map((source, i) => (
                      <a
                        key={i}
                        href={source.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                      >
                        {source.source_name}
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ))}
                    {verifiedSources.length > 4 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{verifiedSources.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
