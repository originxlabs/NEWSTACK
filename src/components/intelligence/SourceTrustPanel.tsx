import { useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Shield, CheckCircle2, AlertCircle, Copy, 
  RefreshCw, ExternalLink, Newspaper
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Source {
  source_name: string;
  source_url: string;
  published_at: string;
  description?: string;
}

interface SourceTrustPanelProps {
  sources: Source[];
  className?: string;
}

// Verified sources list
const VERIFIED_SOURCES = [
  "Reuters", "AP News", "Associated Press", "AFP", "PTI",
  "BBC", "CNN", "Al Jazeera", "NPR", "NBC News", "CBS News",
  "New York Times", "Washington Post", "The Guardian", "The Hindu",
  "Bloomberg", "CNBC", "Forbes", "TechCrunch", "The Verge",
  "Times of India", "Hindustan Times", "NDTV", "India Today"
];

function isVerified(sourceName: string): boolean {
  return VERIFIED_SOURCES.some(vs => 
    sourceName.toLowerCase().includes(vs.toLowerCase())
  );
}

function analyzeSourcePattern(sources: Source[]): {
  uniqueSources: string[];
  repeatedNarratives: string[];
  contradictions: string[];
  primarySources: Source[];
  secondarySources: Source[];
} {
  const uniqueSources = [...new Set(sources.map(s => s.source_name))];
  
  // Group by similar descriptions (simplified)
  const descriptionGroups: Record<string, string[]> = {};
  sources.forEach(s => {
    if (s.description) {
      const key = s.description.slice(0, 50);
      if (!descriptionGroups[key]) descriptionGroups[key] = [];
      descriptionGroups[key].push(s.source_name);
    }
  });

  const repeatedNarratives = Object.entries(descriptionGroups)
    .filter(([_, sources]) => sources.length > 1)
    .map(([desc, sources]) => `${sources.length} sources report similar: "${desc.slice(0, 40)}..."`);

  const primarySources = sources.filter(s => isVerified(s.source_name));
  const secondarySources = sources.filter(s => !isVerified(s.source_name));

  return {
    uniqueSources,
    repeatedNarratives,
    contradictions: [], // Would need NLP to detect
    primarySources,
    secondarySources,
  };
}

function SourceItem({ source, isPrimary }: { source: Source; isPrimary: boolean }) {
  return (
    <motion.a
      href={source.source_url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg transition-colors",
        "hover:bg-muted/50 group"
      )}
    >
      <div className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
        isPrimary ? "bg-emerald-500/20 text-emerald-600" : "bg-muted text-muted-foreground"
      )}>
        {source.source_name.charAt(0)}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium truncate">{source.source_name}</span>
          {isPrimary && (
            <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
          )}
        </div>
        {source.description && (
          <p className="text-[10px] text-muted-foreground line-clamp-1">
            {source.description}
          </p>
        )}
      </div>

      <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.a>
  );
}

export function SourceTrustPanel({ sources, className }: SourceTrustPanelProps) {
  const analysis = useMemo(() => analyzeSourcePattern(sources), [sources]);

  if (sources.length === 0) {
    return null;
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-primary" />
          <div>
            <h3 className="font-semibold text-sm">Source Trust Analysis</h3>
            <p className="text-xs text-muted-foreground">
              {analysis.uniqueSources.length} unique sources covering this story
            </p>
          </div>
        </div>

        {/* Source Breakdown */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-medium">Primary</span>
            </div>
            <div className="text-lg font-bold text-emerald-600">
              {analysis.primarySources.length}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Verified organizations
            </p>
          </div>

          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center gap-1.5 mb-1">
              <Newspaper className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-medium">Secondary</span>
            </div>
            <div className="text-lg font-bold text-muted-foreground">
              {analysis.secondarySources.length}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Other sources
            </p>
          </div>
        </div>

        {/* Repeated Narratives Alert */}
        {analysis.repeatedNarratives.length > 0 && (
          <div className="mb-4 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-1.5 mb-1">
              <Copy className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-medium text-amber-600">Repeated narratives detected</span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Some sources are reporting similar or identical information
            </p>
          </div>
        )}

        {/* Source List */}
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">
            All Sources
          </p>
          
          {analysis.primarySources.slice(0, 5).map((source, i) => (
            <SourceItem key={`p-${i}`} source={source} isPrimary />
          ))}
          
          {analysis.secondarySources.slice(0, 3).map((source, i) => (
            <SourceItem key={`s-${i}`} source={source} isPrimary={false} />
          ))}

          {sources.length > 8 && (
            <p className="text-[10px] text-muted-foreground text-center pt-2">
              +{sources.length - 8} more sources
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
