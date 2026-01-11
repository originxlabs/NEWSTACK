import { motion } from "framer-motion";
import { 
  Zap, TrendingUp, CheckCircle2, AlertTriangle, 
  RefreshCw, Clock, Radio 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type SignalType = "breaking" | "developing" | "stabilized" | "contradicted" | "resolved";

interface StorySignalProps {
  publishedAt?: string;
  lastUpdatedAt?: string;
  sourceCount?: number;
  hasContradictions?: boolean;
  variant?: "badge" | "chip" | "inline";
  className?: string;
}

function determineSignal(
  publishedAt?: string,
  sourceCount?: number,
  hasContradictions?: boolean
): { signal: SignalType; description: string } {
  const now = new Date();
  const published = publishedAt ? new Date(publishedAt) : now;
  const ageMinutes = (now.getTime() - published.getTime()) / (1000 * 60);
  const ageHours = ageMinutes / 60;

  // Check for contradictions first
  if (hasContradictions) {
    return {
      signal: "contradicted",
      description: "Sources report conflicting information"
    };
  }

  // Breaking: Less than 30 minutes old
  if (ageMinutes < 30) {
    return {
      signal: "breaking",
      description: "Just reported within the last 30 minutes"
    };
  }

  // Developing: Less than 6 hours and multiple sources
  if (ageHours < 6 && (sourceCount || 1) >= 2) {
    return {
      signal: "developing",
      description: "Story is actively being covered by multiple sources"
    };
  }

  // Stabilized: More than 6 hours with good source coverage
  if (ageHours >= 6 && (sourceCount || 1) >= 3) {
    return {
      signal: "stabilized",
      description: "Initial reports have been confirmed across sources"
    };
  }

  // Resolved: More than 24 hours with consistent reporting
  if (ageHours >= 24 && (sourceCount || 1) >= 4) {
    return {
      signal: "resolved",
      description: "Story has concluded or reached consensus"
    };
  }

  // Default to developing
  return {
    signal: "developing",
    description: "Story is still evolving"
  };
}

const signalConfig: Record<SignalType, {
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  pulse?: boolean;
}> = {
  breaking: {
    label: "Breaking",
    icon: Zap,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    pulse: true,
  },
  developing: {
    label: "Developing",
    icon: RefreshCw,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
  },
  stabilized: {
    label: "Stabilized",
    icon: TrendingUp,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
  },
  contradicted: {
    label: "Conflicting",
    icon: AlertTriangle,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
  },
  resolved: {
    label: "Resolved",
    icon: CheckCircle2,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
  },
};

export function StorySignal({
  publishedAt,
  lastUpdatedAt,
  sourceCount,
  hasContradictions,
  variant = "badge",
  className,
}: StorySignalProps) {
  const { signal, description } = determineSignal(publishedAt, sourceCount, hasContradictions);
  const config = signalConfig[signal];
  const Icon = config.icon;

  const content = (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 text-[10px] h-5 transition-colors cursor-help",
        config.bgColor,
        config.borderColor,
        config.color,
        config.pulse && "animate-pulse",
        variant === "chip" && "rounded-full px-2.5",
        className
      )}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p className="text-xs">{description}</p>
        {sourceCount && (
          <p className="text-xs text-muted-foreground mt-1">
            Covered by {sourceCount} source{sourceCount !== 1 ? "s" : ""}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

// Utility export for determining signal type programmatically
export { determineSignal };
