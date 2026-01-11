import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Info, Users, AlertTriangle, TrendingUp, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ContextLayerProps {
  headline: string;
  summary?: string;
  topic?: string;
  sourceCount?: number;
  publishedAt?: string;
  className?: string;
  defaultExpanded?: boolean;
}

// Generate neutral context based on story metadata
function generateContext(headline: string, topic?: string, sourceCount?: number): {
  whyMatters: string;
  whoAffected: string;
  confidence: "low" | "medium" | "high";
} {
  const normalizedHeadline = headline.toLowerCase();
  
  // Determine who is affected based on topic/keywords
  let whoAffected = "General public";
  if (normalizedHeadline.includes("market") || normalizedHeadline.includes("stock") || normalizedHeadline.includes("economy")) {
    whoAffected = "Investors, businesses, consumers";
  } else if (normalizedHeadline.includes("health") || normalizedHeadline.includes("medical") || normalizedHeadline.includes("covid")) {
    whoAffected = "Healthcare sector, patients, policymakers";
  } else if (normalizedHeadline.includes("tech") || normalizedHeadline.includes("ai") || normalizedHeadline.includes("digital")) {
    whoAffected = "Tech industry, developers, digital users";
  } else if (normalizedHeadline.includes("climate") || normalizedHeadline.includes("environment")) {
    whoAffected = "Environmental stakeholders, policy makers";
  } else if (normalizedHeadline.includes("politic") || normalizedHeadline.includes("election") || normalizedHeadline.includes("government")) {
    whoAffected = "Citizens, political entities, governance";
  } else if (normalizedHeadline.includes("sport")) {
    whoAffected = "Sports fans, athletes, leagues";
  }

  // Generate neutral why-it-matters based on topic
  const topicContexts: Record<string, string> = {
    business: "This development may influence market dynamics and business strategies in the sector.",
    tech: "This technological shift could affect how systems and services operate in this space.",
    finance: "Financial implications may extend to investment patterns and economic indicators.",
    politics: "This political development may shape policy directions and governance approaches.",
    health: "Healthcare stakeholders are monitoring this for potential systemic implications.",
    climate: "Environmental factors in this story connect to broader sustainability discussions.",
    ai: "AI developments in this area may influence automation and industry practices.",
    sports: "This affects competitive standings and broader sports industry dynamics.",
    entertainment: "This impacts cultural narratives and entertainment industry trends.",
    world: "International implications may affect diplomatic and cross-border relations.",
  };

  const whyMatters = topicContexts[topic?.toLowerCase() || "world"] || 
    "This story reflects ongoing developments that informed observers are tracking.";

  // Confidence based on source count
  let confidence: "low" | "medium" | "high" = "low";
  if (sourceCount && sourceCount >= 5) confidence = "high";
  else if (sourceCount && sourceCount >= 2) confidence = "medium";

  return { whyMatters, whoAffected, confidence };
}

const confidenceConfig = {
  low: { color: "text-amber-500", bg: "bg-amber-500/10", label: "Limited verification" },
  medium: { color: "text-blue-500", bg: "bg-blue-500/10", label: "Moderate confidence" },
  high: { color: "text-emerald-500", bg: "bg-emerald-500/10", label: "Well-verified" },
};

export function ContextLayer({
  headline,
  summary,
  topic,
  sourceCount,
  publishedAt,
  className,
  defaultExpanded = false,
}: ContextLayerProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const context = generateContext(headline, topic, sourceCount);
  const config = confidenceConfig[context.confidence];

  return (
    <div className={cn("border-t border-border/50 pt-3 mt-3", className)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full group"
      >
        <Info className="w-3.5 h-3.5" />
        <span className="font-medium">Why this matters</span>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-3.5 h-3.5" />
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
            <div className="pt-3 space-y-3">
              {/* Context statement */}
              <p className="text-xs text-muted-foreground leading-relaxed">
                {context.whyMatters}
              </p>

              {/* Who is affected */}
              <div className="flex items-center gap-2 text-xs">
                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Affected:</span>
                <span className="text-foreground">{context.whoAffected}</span>
              </div>

              {/* Confidence indicator */}
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-[10px] h-5 gap-1",
                    config.bg,
                    config.color
                  )}
                >
                  <TrendingUp className="w-2.5 h-2.5" />
                  {config.label}
                </Badge>
                {sourceCount && (
                  <span className="text-[10px] text-muted-foreground">
                    Based on {sourceCount} source{sourceCount !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
