import { motion } from "framer-motion";
import { 
  Newspaper, CheckCircle2, AlertCircle, TrendingUp, 
  Shield, Globe, Building2, Info
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Verified major news organizations by category
const VERIFIED_SOURCES_BY_TYPE = {
  wire_agencies: ["Reuters", "AP News", "Associated Press", "AFP", "PTI"],
  broadcasters: ["BBC", "CNN", "Al Jazeera", "NPR", "NBC News", "CBS News", "ABC News", "Sky News", "DW News", "France 24"],
  newspapers: ["New York Times", "Washington Post", "The Guardian", "The Hindu", "Times of India", "Hindustan Times", "Financial Times", "Wall Street Journal"],
  business: ["Bloomberg", "CNBC", "Forbes", "Economic Times", "MarketWatch", "LiveMint", "Business Standard"],
  tech: ["TechCrunch", "The Verge", "Ars Technica", "Wired"],
  regional: ["India Today", "NDTV", "Indian Express", "Japan Times", "South China Morning Post"],
};

// Flatten for quick lookup
const ALL_VERIFIED_SOURCES = Object.values(VERIFIED_SOURCES_BY_TYPE).flat();

interface SourceInfo {
  source_name: string;
  source_url: string;
  published_at: string;
  description?: string;
}

interface SourceDiversityScoreProps {
  sources: SourceInfo[];
  sourceCount: number;
  variant?: "compact" | "detailed" | "badge";
  showTooltip?: boolean;
  className?: string;
}

function getSourceType(sourceName: string): string {
  const name = sourceName.toLowerCase();
  for (const [type, sources] of Object.entries(VERIFIED_SOURCES_BY_TYPE)) {
    if (sources.some(s => name.includes(s.toLowerCase()))) {
      return type;
    }
  }
  return "other";
}

function isVerifiedSource(sourceName: string): boolean {
  const normalizedName = sourceName.toLowerCase();
  return ALL_VERIFIED_SOURCES.some(vs => normalizedName.includes(vs.toLowerCase()));
}

function calculateDiversityScore(sources: SourceInfo[]): {
  score: number;
  level: "low" | "medium" | "high" | "excellent";
  verifiedCount: number;
  uniqueTypes: string[];
  reason: string;
  breakdown: {
    sourceCountScore: number;
    verifiedScore: number;
    typesDiversityScore: number;
  };
} {
  if (!sources || sources.length === 0) {
    return {
      score: 15,
      level: "low",
      verifiedCount: 0,
      uniqueTypes: [],
      reason: "Single unverified source - limited perspective",
      breakdown: { sourceCountScore: 0, verifiedScore: 0, typesDiversityScore: 0 },
    };
  }

  // Get unique source types
  const sourceTypes = sources.map(s => getSourceType(s.source_name));
  const uniqueTypes = [...new Set(sourceTypes.filter(t => t !== "other"))];
  
  // Count verified sources
  const verifiedCount = sources.filter(s => isVerifiedSource(s.source_name)).length;
  const totalSources = sources.length;
  
  // IMPROVED SCORING LOGIC:
  // 1 source = 15-25%
  // 2 sources = 30-50%
  // 3-4 sources = 55-85%
  // 5+ sources = 85-100%
  
  let baseScore: number;
  let reason: string;
  
  if (totalSources === 1) {
    if (verifiedCount === 1) {
      baseScore = 25;
      reason = "Single verified source - limited perspective available";
    } else {
      baseScore = 15;
      reason = "Single unverified source - consider seeking additional sources";
    }
  } else if (totalSources === 2) {
    if (verifiedCount >= 2) {
      baseScore = 50;
      reason = "Two verified sources - moderate coverage with some perspective";
    } else if (verifiedCount === 1) {
      baseScore = 40;
      reason = "One verified, one unverified source - limited verification";
    } else {
      baseScore = 30;
      reason = "Two unverified sources - limited credibility";
    }
  } else if (totalSources >= 3 && totalSources < 5) {
    const verifiedRatio = verifiedCount / totalSources;
    baseScore = 55 + Math.round(verifiedRatio * 30);
    reason = `${totalSources} sources (${verifiedCount} verified) - good multi-perspective coverage`;
  } else {
    // 5+ sources - excellent diversity
    const verifiedRatio = verifiedCount / totalSources;
    baseScore = 75 + Math.round(verifiedRatio * 25);
    reason = `${totalSources} sources (${verifiedCount} verified) - excellent diversity & credibility`;
  }

  // Add bonus for media type diversity (up to 10 extra points)
  const typeDiversityBonus = Math.min(uniqueTypes.length * 3, 10);
  const finalScore = Math.min(100, Math.max(0, baseScore + typeDiversityBonus));
  
  // Calculate component scores for breakdown display
  const sourceCountScore = Math.min(totalSources * 20, 100);
  const verifiedScore = totalSources > 0 ? Math.round((verifiedCount / totalSources) * 100) : 0;
  const typesDiversityScore = Math.min(uniqueTypes.length * 25, 100);
  
  // Determine level
  let level: "low" | "medium" | "high" | "excellent";
  if (finalScore >= 80) level = "excellent";
  else if (finalScore >= 55) level = "high";
  else if (finalScore >= 35) level = "medium";
  else level = "low";
  
  return {
    score: finalScore,
    level,
    verifiedCount,
    uniqueTypes,
    reason,
    breakdown: { sourceCountScore, verifiedScore, typesDiversityScore },
  };
}

const levelConfig = {
  low: {
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    label: "Low Diversity",
    icon: AlertCircle,
  },
  medium: {
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    label: "Moderate",
    icon: Info,
  },
  high: {
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
    label: "High Diversity",
    icon: CheckCircle2,
  },
  excellent: {
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    label: "Excellent",
    icon: Shield,
  },
};

const typeLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  wire_agencies: { label: "Wire Agency", icon: <Globe className="w-3 h-3" /> },
  broadcasters: { label: "Broadcaster", icon: <TrendingUp className="w-3 h-3" /> },
  newspapers: { label: "Newspaper", icon: <Newspaper className="w-3 h-3" /> },
  business: { label: "Business", icon: <Building2 className="w-3 h-3" /> },
  tech: { label: "Tech Media", icon: <Info className="w-3 h-3" /> },
  regional: { label: "Regional", icon: <Globe className="w-3 h-3" /> },
};

export function SourceDiversityScore({ 
  sources, 
  sourceCount,
  variant = "compact",
  showTooltip = true,
  className,
}: SourceDiversityScoreProps) {
  const diversity = calculateDiversityScore(sources);
  const config = levelConfig[diversity.level];
  const Icon = config.icon;

  // Badge variant - just shows the score
  if (variant === "badge") {
    const content = (
      <Badge 
        variant="outline" 
        className={cn(
          "text-[10px] h-5 px-1.5 gap-1 cursor-help transition-colors",
          config.bgColor,
          config.borderColor,
          config.color,
          className
        )}
      >
        <Icon className="w-3 h-3" />
        <span className="font-semibold">{diversity.score}</span>
      </Badge>
    );

    if (!showTooltip) return content;

    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">{config.label} Score: {diversity.score}/100</p>
            <p className="text-xs text-muted-foreground">
              {sourceCount} sources • {diversity.verifiedCount} verified
            </p>
            <p className="text-xs text-muted-foreground italic">
              {diversity.reason}
            </p>
            {diversity.uniqueTypes.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Types: {diversity.uniqueTypes.map(t => typeLabels[t]?.label || t).join(", ")}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Compact variant
  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-lg border",
          config.bgColor,
          config.borderColor
        )}>
          <Icon className={cn("w-4 h-4", config.color)} />
          <div className="flex flex-col">
            <span className={cn("text-xs font-bold leading-tight", config.color)}>
              {diversity.score}
            </span>
            <span className="text-[9px] text-muted-foreground leading-tight">
              diversity
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Newspaper className="w-3 h-3" />
          <span>{sourceCount} sources</span>
          {diversity.verifiedCount > 0 && (
            <>
              <span>•</span>
              <CheckCircle2 className="w-3 h-3 text-green-500" />
              <span>{diversity.verifiedCount} verified</span>
            </>
          )}
        </div>
      </div>
    );
  }

  // Detailed variant
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-4 rounded-xl border",
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={cn("w-5 h-5", config.color)} />
          <span className="font-semibold text-sm">Source Diversity</span>
        </div>
        <div className={cn(
          "text-2xl font-bold",
          config.color
        )}>
          {diversity.score}
          <span className="text-sm font-normal text-muted-foreground">/100</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
        <motion.div 
          className={cn("h-full rounded-full", config.color.replace("text-", "bg-"))}
          initial={{ width: 0 }}
          animate={{ width: `${diversity.score}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Level label + Reason */}
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex items-center justify-between">
          <Badge className={cn(config.bgColor, config.color, "border-0")}>
            {config.label}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {sourceCount} source{sourceCount !== 1 ? "s" : ""} covering this story
          </span>
        </div>
        <p className="text-xs text-muted-foreground italic bg-muted/50 rounded-lg px-3 py-2">
          {diversity.reason}
        </p>
      </div>

      {/* Breakdown */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Source Count</span>
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full" 
                style={{ width: `${diversity.breakdown.sourceCountScore}%` }}
              />
            </div>
            <span className="w-8 text-right">{diversity.breakdown.sourceCountScore}%</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Verified Sources</span>
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full" 
                style={{ width: `${diversity.breakdown.verifiedScore}%` }}
              />
            </div>
            <span className="w-8 text-right">{diversity.breakdown.verifiedScore}%</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Media Type Diversity</span>
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full" 
                style={{ width: `${diversity.breakdown.typesDiversityScore}%` }}
              />
            </div>
            <span className="w-8 text-right">{diversity.breakdown.typesDiversityScore}%</span>
          </div>
        </div>
      </div>

      {/* Source Types */}
      {diversity.uniqueTypes.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border/50">
          <p className="text-xs text-muted-foreground mb-2">Media types covering this story:</p>
          <div className="flex flex-wrap gap-1.5">
            {diversity.uniqueTypes.map(type => (
              <Badge 
                key={type} 
                variant="outline" 
                className="text-[10px] h-5 gap-1"
              >
                {typeLabels[type]?.icon}
                {typeLabels[type]?.label || type}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Verified sources list */}
      {diversity.verifiedCount > 0 && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <p className="text-xs text-muted-foreground mb-2">
            Verified sources ({diversity.verifiedCount}):
          </p>
          <div className="flex flex-wrap gap-1.5">
            {sources
              .filter(s => isVerifiedSource(s.source_name))
              .slice(0, 5)
              .map((source, i) => (
                <Badge 
                  key={i}
                  variant="outline" 
                  className="text-[10px] h-5 gap-1 border-green-500/30 text-green-600 bg-green-500/5"
                >
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  {source.source_name}
                </Badge>
              ))}
            {diversity.verifiedCount > 5 && (
              <Badge variant="outline" className="text-[10px] h-5">
                +{diversity.verifiedCount - 5} more
              </Badge>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// Export utility for other components
export { calculateDiversityScore, isVerifiedSource, getSourceType };
