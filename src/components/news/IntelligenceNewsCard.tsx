import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronDown, Clock, ExternalLink, Layers, Shield, 
  Zap, RefreshCw, CheckCircle2, AlertTriangle, MinusCircle,
  Headphones, Bookmark, Heart, Share2, ChevronRight, Pause, Loader2,
  Languages
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SourcesPopover } from "@/components/SourcesPopover";
import { StoryTimeline } from "@/components/intelligence/StoryTimeline";
import { useTTS } from "@/hooks/use-tts";
import { useTTSLimit } from "@/hooks/use-tts-limit";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";
import { TTSLimitModal } from "@/components/TTSLimitModal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

export interface IntelligenceNewsItem {
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
  trustScore?: number;
  isBreaking?: boolean;
  signal?: "breaking" | "developing" | "stabilized" | "contradicted" | "resolved";
  confidence?: "low" | "medium" | "high";
}

interface IntelligenceNewsCardProps {
  news: IntelligenceNewsItem;
  index: number;
  onClick?: () => void;
}

const signalConfig = {
  breaking: { icon: Zap, label: "Breaking", color: "bg-red-500/10 text-red-600 border-red-500/20" },
  developing: { icon: RefreshCw, label: "Developing", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  stabilized: { icon: CheckCircle2, label: "Verified", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  contradicted: { icon: AlertTriangle, label: "Contradicted", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  resolved: { icon: MinusCircle, label: "Resolved", color: "bg-muted text-muted-foreground border-border" },
};

const confidenceConfig = {
  low: { label: "Low", color: "text-amber-600" },
  medium: { label: "Medium", color: "text-blue-600" },
  high: { label: "High", color: "text-emerald-600" },
};

const topicColors: Record<string, string> = {
  business: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  tech: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  world: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  politics: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  health: "bg-teal-500/10 text-teal-600 border-teal-500/20",
  climate: "bg-lime-500/10 text-lime-600 border-lime-500/20",
  science: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
};

function determineSignal(publishedAt?: string, sourceCount?: number): IntelligenceNewsItem["signal"] {
  if (!publishedAt) return "developing";
  const ageMinutes = (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60);
  if (ageMinutes < 30) return "breaking";
  if (ageMinutes < 360 && (sourceCount || 1) >= 2) return "developing";
  if ((sourceCount || 1) >= 3) return "stabilized";
  return "developing";
}

function determineConfidence(sourceCount?: number): IntelligenceNewsItem["confidence"] {
  if (!sourceCount || sourceCount < 2) return "low";
  if (sourceCount < 4) return "medium";
  return "high";
}

export function IntelligenceNewsCard({ news, index, onClick }: IntelligenceNewsCardProps) {
  const { language } = usePreferences();
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Translation state (headline + short summary)
  const [translateEnabled, setTranslateEnabled] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedHeadline, setTranslatedHeadline] = useState<string | null>(null);
  const [translatedSummary, setTranslatedSummary] = useState<string | null>(null);

  const displayHeadline = translateEnabled && translatedHeadline ? translatedHeadline : news.headline;
  const displaySummary = translateEnabled && translatedSummary ? translatedSummary : news.summary;

  const { speak, toggle, isLoading, isPlaying } = useTTS({
    language: language?.code || "en",
  });
  const { incrementUsage, canPlay, showLimitModal, closeLimitModal, usedCount, maxCount } = useTTSLimit();

  const signal = news.signal || determineSignal(news.publishedAt, news.sourceCount);
  const confidence = news.confidence || determineConfidence(news.sourceCount);
  const signalInfo = signalConfig[signal];
  const confidenceInfo = confidenceConfig[confidence];
  const SignalIcon = signalInfo.icon;

  const shouldOfferTranslation = useMemo(() => {
    // If user is already in English, allow translation (useful for regional sources)
    // If user is not in English, still allow translation to English (per request)
    return true;
  }, []);

  const handleToggleTranslation = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const nextEnabled = !translateEnabled;
    setTranslateEnabled(nextEnabled);

    // If enabling and we don't have translations yet, fetch them
    if (nextEnabled && (!translatedHeadline || !translatedSummary) && !isTranslating) {
      setIsTranslating(true);
      try {
        const { data, error } = await supabase.functions.invoke("translate-to-english", {
          body: {
            headline: news.headline,
            summary: news.summary,
          },
        });

        if (error) throw error;
        if (!data?.headline_en || !data?.summary_en) {
          throw new Error("Translation failed");
        }

        setTranslatedHeadline(data.headline_en);
        setTranslatedSummary(data.summary_en);
      } catch (err) {
        setTranslateEnabled(false);
        toast.error("Could not translate right now");
      } finally {
        setIsTranslating(false);
      }
    }
  };

  const handleListen = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) {
      toggle();
    } else if (!isLoading) {
      if (!canPlay()) return;
      if (incrementUsage()) {
        await speak(news.headline.substring(0, 150));
      }
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (navigator.share) {
        await navigator.share({
          title: news.headline,
          text: news.summary,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(`${news.headline}\n\n${news.summary}`);
        toast.success("Copied to clipboard!");
      }
    } catch {}
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setIsSaved(!isSaved);
    toast.success(isSaved ? "Removed from saved" : "Saved for later");
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setIsLiked(!isLiked);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.03 }}
      >
        <Card 
          className="group overflow-hidden hover:shadow-md transition-all cursor-pointer border-border/50"
          onClick={onClick}
        >
          <CardContent className="p-4 sm:p-5">
            {/* 1️⃣ Headline */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="font-display text-base sm:text-lg font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-2 flex-1">
                {displayHeadline}
              </h3>

              {shouldOfferTranslation && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                  onClick={handleToggleTranslation}
                  disabled={isTranslating}
                  title="Translate to English"
                >
                  {isTranslating ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Languages className="w-3 h-3" />
                  )}
                  {translateEnabled ? "Original" : "English"}
                </Button>
              )}
            </div>

            {/* 2️⃣ Intelligence metadata row */}
            <div className="flex items-center flex-wrap gap-2 mb-3 text-xs">
              {/* Source count */}
              <div className="flex items-center gap-1 text-muted-foreground">
                <Layers className="w-3 h-3" />
                <span>Reported by <span className="font-medium text-foreground">{news.sourceCount || 1}</span> sources</span>
              </div>
              
              <span className="text-muted-foreground/50">•</span>
              
              {/* Last updated */}
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{news.timestamp}</span>
              </div>
              
              <span className="text-muted-foreground/50">•</span>
              
              {/* Confidence */}
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Confidence:</span>
                <span className={cn("font-medium", confidenceInfo.color)}>
                  {confidenceInfo.label}
                </span>
              </div>
              
              {/* State badge */}
              <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5 gap-1", signalInfo.color)}>
                <SignalIcon className="w-2.5 h-2.5" />
                {signalInfo.label}
              </Badge>
            </div>

            {/* Summary */}
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed line-clamp-2">
              {displaySummary}
            </p>

            {/* 3️⃣ "Why this matters" toggle */}
            {news.whyMatters && (
              <div className="mb-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowContext(!showContext);
                  }}
                >
                  Why this matters
                  <ChevronDown className={cn(
                    "w-3 h-3 transition-transform",
                    showContext && "rotate-180"
                  )} />
                </Button>
                
                <AnimatePresence>
                  {showContext && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 p-3 rounded-md bg-muted/30 border border-border/50 text-xs space-y-2">
                        <div>
                          <span className="font-medium text-foreground">Context: </span>
                          <span className="text-muted-foreground">{news.whyMatters}</span>
                        </div>
                        <div>
                          <span className="font-medium text-foreground">Confidence: </span>
                          <span className={confidenceInfo.color}>{confidenceInfo.label}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* 4️⃣ Timeline link */}
            <StoryTimeline 
              storyId={news.id} 
              publishedAt={news.publishedAt}
            />

            {/* Source and actions */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
              {/* Source */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <a 
                  href={news.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-primary transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[9px] font-medium">
                    {news.source.charAt(0)}
                  </div>
                  <span className="truncate max-w-24">{news.source}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                {news.sourceCount && news.sourceCount > 1 && (
                  <>
                    <span>•</span>
                    <SourcesPopover 
                      storyId={news.id}
                      sourceCount={news.sourceCount}
                      primarySource={news.source}
                      primarySourceUrl={news.sourceUrl}
                    />
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7"
                  onClick={handleListen}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-3.5 h-3.5" />
                  ) : (
                    <Headphones className="w-3.5 h-3.5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("w-7 h-7", isSaved && "text-primary")}
                  onClick={handleSave}
                >
                  <Bookmark className={cn("w-3.5 h-3.5", isSaved && "fill-current")} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("w-7 h-7", isLiked && "text-destructive")}
                  onClick={handleLike}
                >
                  <Heart className={cn("w-3.5 h-3.5", isLiked && "fill-current")} />
                </Button>
                <Button variant="ghost" size="icon" className="w-7 h-7" onClick={handleShare}>
                  <Share2 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1 h-7 ml-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick?.();
                  }}
                >
                  Read more
                  <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <TTSLimitModal
        isOpen={showLimitModal}
        onClose={closeLimitModal}
        usedCount={usedCount}
        maxCount={maxCount}
      />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}
