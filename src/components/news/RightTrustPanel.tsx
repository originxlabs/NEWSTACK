import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, AlertTriangle, TrendingUp, ChevronDown, Info, Layers, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface RightTrustPanelProps {
  totalSources?: number;
  primarySources?: number;
  secondarySources?: number;
  contradictionsDetected?: number;
  emergingSignals?: string[];
  className?: string;
}

export function RightTrustPanel({
  totalSources = 66,
  primarySources = 24,
  secondarySources = 42,
  contradictionsDetected = 0,
  emergingSignals = [],
  className,
}: RightTrustPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showExplainer, setShowExplainer] = useState(false);

  const diversityScore = Math.min(100, Math.round((primarySources / totalSources) * 100 + 40));

  return (
    <aside className={cn(
      "hidden xl:block w-56 flex-shrink-0",
      className
    )}>
      <div className="sticky top-20 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-3 h-3" />
            Trust Signals
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
            {/* Source Diversity */}
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Source Diversity</span>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-[10px] h-5",
                    diversityScore >= 70 
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : diversityScore >= 40
                      ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      : "bg-red-500/10 text-red-600 border-red-500/20"
                  )}
                >
                  {diversityScore >= 70 ? "High" : diversityScore >= 40 ? "Medium" : "Low"}
                </Badge>
              </div>
              
              {/* Progress bar */}
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${diversityScore}%` }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className={cn(
                    "h-full rounded-full",
                    diversityScore >= 70 
                      ? "bg-emerald-500"
                      : diversityScore >= 40
                      ? "bg-amber-500"
                      : "bg-red-500"
                  )}
                />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Primary</span>
                  <p className="font-medium">{primarySources} sources</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Secondary</span>
                  <p className="font-medium">{secondarySources} sources</p>
                </div>
              </div>
            </div>

            {/* Contradictions */}
            {contradictionsDetected > 0 && (
              <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-xs font-medium text-amber-600">
                    Contradictions Detected
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {contradictionsDetected} stories have conflicting reports from different sources.
                </p>
              </div>
            )}

            {/* Emerging Signals */}
            {emergingSignals.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3" />
                  Emerging Signals
                </span>
                <div className="space-y-1.5">
                  {emergingSignals.map((signal, i) => (
                    <div
                      key={i}
                      className="text-xs p-2 rounded bg-muted/30 border border-border/50"
                    >
                      {signal}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator className="opacity-50" />

            {/* How confidence works */}
            <div>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground gap-1.5 font-normal"
                onClick={() => setShowExplainer(!showExplainer)}
              >
                <Info className="w-3 h-3" />
                How confidence is determined
                <ChevronDown className={cn(
                  "w-3 h-3 transition-transform ml-auto",
                  showExplainer && "rotate-180"
                )} />
              </Button>
              
              <AnimatePresence>
                {showExplainer && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3 space-y-2 text-[11px] text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <Layers className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>Independent source count</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>Primary reporting presence</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>Contradictions detected</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <TrendingUp className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>Update consistency</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </div>
    </aside>
  );
}
