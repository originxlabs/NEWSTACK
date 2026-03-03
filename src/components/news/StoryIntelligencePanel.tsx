import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, ExternalLink, Clock, Shield, ChevronLeft, 
  Layers, AlertTriangle, CheckCircle2, RefreshCw, 
  MinusCircle, ChevronRight, Headphones, Pause, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { StoryTimeline } from "@/components/intelligence/StoryTimeline";
import { calculateConfidence, getConfidenceColors, getStoryStateColors, isVerifiedSource } from "@/lib/confidence-scoring";
import { useTTS } from "@/hooks/use-tts";
import { useTTSLimit } from "@/hooks/use-tts-limit";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { TTSLimitModal } from "@/components/TTSLimitModal";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface StorySource {
  source_name: string;
  source_url: string;
  published_at: string;
  description?: string;
}

export interface StoryIntelligenceItem {
  id: string;
  headline: string;
  summary: string;
  content?: string;
  topic: string;
  source: string;
  sourceUrl?: string;
  timestamp: string;
  publishedAt?: string;
  imageUrl?: string;
  whyMatters?: string;
  sourceCount?: number;
  sources?: StorySource[];
}

interface StoryIntelligencePanelProps {
  story: StoryIntelligenceItem | null;
  isOpen: boolean;
  onClose: () => void;
  onViewFullPage?: (storyId: string) => void;
}

const topicColors: Record<string, string> = {
  business: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  tech: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  world: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  politics: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  health: "bg-teal-500/10 text-teal-600 border-teal-500/20",
  climate: "bg-lime-500/10 text-lime-600 border-lime-500/20",
  science: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
};

const storyStateIcons = {
  "single-source": AlertTriangle,
  "developing": RefreshCw,
  "confirmed": CheckCircle2,
  "contradicted": AlertTriangle,
  "resolved": MinusCircle,
};

export function StoryIntelligencePanel({ 
  story, 
  isOpen, 
  onClose,
  onViewFullPage 
}: StoryIntelligencePanelProps) {
  const isMobile = useIsMobile();
  const { language } = usePreferences();
  
  const { speak, toggle, isLoading: ttsLoading, isPlaying, stop } = useTTS({
    language: language?.code || "en",
  });
  const { incrementUsage, canPlay, showLimitModal, closeLimitModal, usedCount, maxCount } = useTTSLimit();

  // Calculate confidence and sources
  const analysis = useMemo(() => {
    if (!story) return null;
    
    const sources = story.sources || [];
    const allSources = sources.length > 0 ? sources : [{
      source_name: story.source,
      source_url: story.sourceUrl || "#",
      published_at: story.publishedAt || new Date().toISOString(),
      description: story.summary?.substring(0, 100),
    }];
    
    const verifiedCount = allSources.filter(s => isVerifiedSource(s.source_name)).length;
    
    const confidence = calculateConfidence({
      sourceCount: allSources.length,
      verifiedSourceCount: verifiedCount,
      hasPrimaryReporting: verifiedCount > 0,
      hasContradictions: false,
      isStableNarrative: true,
    });
    
    return {
      sources: allSources,
      verifiedCount,
      confidence,
    };
  }, [story]);

  const handleListen = async () => {
    if (!story) return;
    if (isPlaying) {
      toggle();
    } else if (!ttsLoading) {
      if (!canPlay()) return;
      if (incrementUsage()) {
        const textToSpeak = `${story.headline}. ${story.summary || ""}`;
        await speak(textToSpeak);
      }
    }
  };

  const handleClose = () => {
    stop();
    onClose();
  };

  if (!story || !analysis) return null;

  const { confidence, sources, verifiedCount } = analysis;
  const confidenceColors = getConfidenceColors(confidence.level);
  const stateColors = getStoryStateColors(confidence.storyState);
  const StateIcon = storyStateIcons[confidence.storyState];

  const Content = (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="h-full flex flex-col bg-background"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border p-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={handleClose} className="hover:bg-accent">
          {isMobile ? <ChevronLeft className="h-5 w-5" /> : <X className="h-5 w-5" />}
        </Button>
        <div className="flex-1 min-w-0">
          <Badge 
            variant="outline"
            className={cn("text-xs", topicColors[story.topic.toLowerCase()] || "bg-primary/10 text-primary border-primary/20")}
          >
            {story.topic}
          </Badge>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 space-y-5">
          {/* 1️⃣ Headline */}
          <h1 className="font-display text-lg sm:text-xl font-semibold leading-tight">
            {story.headline}
          </h1>

          {/* 2️⃣ Story State & Confidence Row */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Story State Badge */}
            <Badge 
              variant="outline" 
              className={cn("gap-1.5 text-xs", stateColors.bg, stateColors.text, stateColors.border)}
            >
              <StateIcon className="w-3 h-3" />
              {confidence.stateLabel}
            </Badge>
            
            {/* Confidence Badge */}
            <Badge 
              variant="outline" 
              className={cn("gap-1.5 text-xs", confidenceColors.bg, confidenceColors.text, confidenceColors.border)}
            >
              <Shield className="w-3 h-3" />
              {confidence.label} Confidence
            </Badge>
            
            {/* Source Count */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Layers className="w-3 h-3" />
              <span>{sources.length} source{sources.length !== 1 ? "s" : ""}</span>
            </div>
            
            {/* Time */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{story.timestamp}</span>
            </div>
          </div>

          {/* Single Source Warning */}
          {confidence.isSingleSource && (
            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="text-xs">
                  <p className="font-medium text-amber-600 dark:text-amber-500">Single Source Story</p>
                  <p className="text-muted-foreground mt-0.5">
                    This story has not been independently confirmed by other sources.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Confidence Explanation */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-xs text-muted-foreground">
              {confidence.explanation}
            </p>
          </div>

          <Separator className="opacity-50" />

          {/* 3️⃣ AI Summary (optional) */}
          {story.summary && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Summary
              </h3>
              <p className="text-sm leading-relaxed">
                {story.summary}
              </p>
            </div>
          )}

          {/* Listen Button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2"
            onClick={handleListen}
            disabled={ttsLoading}
          >
            {ttsLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : isPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                Pause
              </>
            ) : (
              <>
                <Headphones className="w-4 h-4" />
                Listen
              </>
            )}
          </Button>

          <Separator className="opacity-50" />

          {/* 4️⃣ Why This Matters - Fixed structure: Context / Who is affected / Confidence */}
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Why This Matters
            </h3>
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-3 text-sm">
              <div>
                <span className="font-medium">Context: </span>
                <span className="text-muted-foreground">
                  {story.whyMatters || story.summary || "This story is developing. Check back for updates."}
                </span>
              </div>
              <div>
                <span className="font-medium">Who is affected: </span>
                <span className="text-muted-foreground">
                  {sources.length === 1 
                    ? "Limited information available from a single source."
                    : `Information corroborated across ${sources.length} independent sources.`}
                </span>
              </div>
              <div>
                <span className="font-medium">Confidence: </span>
                <span className={confidenceColors.text}>{confidence.label}</span>
                <span className="text-muted-foreground"> — {confidence.explanation}</span>
              </div>
            </div>
          </div>

          <Separator className="opacity-50" />

          {/* 5️⃣ Sources List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3 h-3" />
                Sources ({sources.length})
              </h3>
              <div className="text-[10px] text-muted-foreground">
                {verifiedCount} verified
              </div>
            </div>
            
            <div className="space-y-2">
              {sources.map((source, idx) => {
                const isVerified = isVerifiedSource(source.source_name);
                return (
                  <a
                    key={idx}
                    href={source.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
                  >
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary flex-shrink-0">
                      {source.source_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium truncate">{source.source_name}</span>
                        {isVerified && (
                          <Badge variant="secondary" className="text-[9px] h-4 bg-emerald-500/10 text-emerald-600 border-0">
                            ✓
                          </Badge>
                        )}
                        {idx === 0 && (
                          <Badge variant="secondary" className="text-[9px] h-4 bg-blue-500/10 text-blue-600 border-0">
                            First
                          </Badge>
                        )}
                      </div>
                      {source.published_at && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(source.published_at), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                  </a>
                );
              })}
            </div>
          </div>

          <Separator className="opacity-50" />

          {/* 6️⃣ Timeline (collapsed) */}
          <StoryTimeline 
            storyId={story.id}
            publishedAt={story.publishedAt}
          />

          {/* View Full Intelligence Page */}
          {onViewFullPage && (
            <Button
              variant="default"
              className="w-full gap-2 mt-4"
              onClick={() => onViewFullPage(story.id)}
            >
              View Full Story Intelligence
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <TTSLimitModal
        isOpen={showLimitModal}
        onClose={closeLimitModal}
        usedCount={usedCount}
        maxCount={maxCount}
      />
    </motion.div>
  );

  // Use Sheet for desktop, Dialog for mobile
  if (isMobile) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-full h-[95vh] p-0 overflow-hidden">
          {Content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        {Content}
      </SheetContent>
    </Sheet>
  );
}
