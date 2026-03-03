import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Clock, Shield, Layers, ExternalLink, 
  AlertTriangle, CheckCircle2, RefreshCw, MinusCircle,
  ChevronDown, Headphones, Pause, Loader2, Share2, Bookmark
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { StoryTimeline } from "@/components/intelligence/StoryTimeline";
import { calculateConfidence, getConfidenceColors, getStoryStateColors, isVerifiedSource } from "@/lib/confidence-scoring";
import { useTTS } from "@/hooks/use-tts";
import { useTTSLimit } from "@/hooks/use-tts-limit";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useAuth } from "@/contexts/AuthContext";
import { TTSLimitModal } from "@/components/TTSLimitModal";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface StorySource {
  id: string;
  source_name: string;
  source_url: string;
  published_at: string;
  description?: string;
}

interface Story {
  id: string;
  headline: string;
  summary: string | null;
  ai_summary: string | null;
  category: string | null;
  first_published_at: string;
  last_updated_at: string;
  source_count: number | null;
  image_url: string | null;
}

const storyStateIcons = {
  "single-source": AlertTriangle,
  "developing": RefreshCw,
  "confirmed": CheckCircle2,
  "contradicted": AlertTriangle,
  "resolved": MinusCircle,
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

export default function StoryDetailPage() {
  const { storyId } = useParams<{ storyId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language } = usePreferences();
  const { user } = useAuth();
  
  const [story, setStory] = useState<Story | null>(null);
  const [sources, setSources] = useState<StorySource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showWhyMatters, setShowWhyMatters] = useState(true);
  const [showBackground, setShowBackground] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  const { speak, toggle, isLoading: ttsLoading, isPlaying, stop } = useTTS({
    language: language?.code || "en",
  });
  const { incrementUsage, canPlay, showLimitModal, closeLimitModal, usedCount, maxCount } = useTTSLimit();

  // Fetch story and sources
  useEffect(() => {
    async function fetchStory() {
      if (!storyId) return;
      
      setIsLoading(true);
      try {
        // Fetch story
        const { data: storyData, error: storyError } = await supabase
          .from("stories")
          .select("*")
          .eq("id", storyId)
          .single();
        
        if (storyError) throw storyError;
        setStory(storyData);
        
        // Fetch sources
        const { data: sourcesData, error: sourcesError } = await supabase
          .from("story_sources")
          .select("*")
          .eq("story_id", storyId)
          .order("published_at", { ascending: true });
        
        if (!sourcesError && sourcesData) {
          setSources(sourcesData);
        }
      } catch (err) {
        console.error("Failed to fetch story:", err);
        toast.error("Failed to load story");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchStory();
  }, [storyId]);

  // Calculate confidence
  const analysis = useMemo(() => {
    if (!story) return null;
    
    const sourceList = sources.length > 0 ? sources : [];
    const verifiedCount = sourceList.filter(s => isVerifiedSource(s.source_name)).length;
    
    const confidence = calculateConfidence({
      sourceCount: sourceList.length || story.source_count || 1,
      verifiedSourceCount: verifiedCount,
      hasPrimaryReporting: verifiedCount > 0,
      hasContradictions: false,
      isStableNarrative: true,
    });
    
    return {
      verifiedCount,
      confidence,
    };
  }, [story, sources]);

  const handleListen = async () => {
    if (!story) return;
    if (isPlaying) {
      toggle();
    } else if (!ttsLoading) {
      if (!canPlay()) return;
      if (incrementUsage()) {
        const textToSpeak = `${story.headline}. ${story.summary || story.ai_summary || ""}`;
        await speak(textToSpeak);
      }
    }
  };

  const handleShare = async () => {
    if (!story) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: story.headline,
          text: story.summary || story.ai_summary || "",
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard");
      }
    } catch {}
  };

  const handleSave = async () => {
    if (!user) {
      toast.error("Please sign in to save stories");
      return;
    }
    setIsSaved(!isSaved);
    toast.success(isSaved ? "Removed from saved" : "Saved for later");
  };

  const handleBack = () => {
    stop();
    navigate(-1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-14 pb-12">
          <div className="container mx-auto max-w-4xl px-4 py-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-32 bg-muted rounded" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!story || !analysis) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-14 pb-12">
          <div className="container mx-auto max-w-4xl px-4 py-16 text-center">
            <h1 className="text-xl font-semibold mb-2">Story Not Found</h1>
            <p className="text-muted-foreground mb-4">The story you're looking for doesn't exist.</p>
            <Button onClick={() => navigate("/news")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to News
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const { confidence, verifiedCount } = analysis;
  const confidenceColors = getConfidenceColors(confidence.level);
  const stateColors = getStoryStateColors(confidence.storyState);
  const StateIcon = storyStateIcons[confidence.storyState];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-14 pb-12">
        {/* Back button */}
        <div className="border-b border-border/50">
          <div className="container mx-auto max-w-4xl px-4 py-3">
            <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
        </div>

        <article className="container mx-auto max-w-4xl px-4 py-6 sm:py-8">
          {/* SECTION 1: Story Overview */}
          <section className="space-y-4">
            {/* Category */}
            {story.category && (
              <Badge 
                variant="outline"
                className={cn("text-xs", topicColors[story.category.toLowerCase()] || "bg-primary/10 text-primary border-primary/20")}
              >
                {story.category}
              </Badge>
            )}

            {/* Headline */}
            <h1 className="font-display text-2xl sm:text-3xl font-bold leading-tight">
              {story.headline}
            </h1>

            {/* One-line summary */}
            {(story.summary || story.ai_summary) && (
              <p className="text-lg text-muted-foreground leading-relaxed">
                {story.summary || story.ai_summary}
              </p>
            )}

            {/* Metadata row */}
            <div className="flex items-center flex-wrap gap-3 text-sm">
              {/* Story State */}
              <Badge 
                variant="outline" 
                className={cn("gap-1.5", stateColors.bg, stateColors.text, stateColors.border)}
              >
                <StateIcon className="w-3.5 h-3.5" />
                {confidence.stateLabel}
              </Badge>
              
              {/* Confidence */}
              <Badge 
                variant="outline" 
                className={cn("gap-1.5", confidenceColors.bg, confidenceColors.text, confidenceColors.border)}
              >
                <Shield className="w-3.5 h-3.5" />
                {confidence.label}
              </Badge>
              
              {/* Sources */}
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Layers className="w-4 h-4" />
                <span>{sources.length || story.source_count || 1} sources</span>
              </div>
              
              {/* Last updated */}
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Updated {formatDistanceToNow(new Date(story.last_updated_at), { addSuffix: true })}</span>
              </div>
            </div>

            {/* Single Source Warning */}
            {confidence.isSingleSource && (
              <Card className="border-amber-500/20 bg-amber-500/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-amber-600 dark:text-amber-500">Single Source Story</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        This story has not been independently confirmed by other sources. 
                        Low confidence — limited independent confirmation.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleListen}
                disabled={ttsLoading}
              >
                {ttsLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Headphones className="w-4 h-4" />
                )}
                {isPlaying ? "Pause" : "Listen"}
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={handleSave}>
                <Bookmark className={cn("w-4 h-4", isSaved && "fill-current")} />
                {isSaved ? "Saved" : "Save"}
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            </div>
          </section>

          <Separator className="my-8" />

          {/* SECTION 2: Why This Matters */}
          <section className="space-y-4">
            <Button
              variant="ghost"
              className="w-full justify-between h-auto py-3 px-0 hover:bg-transparent"
              onClick={() => setShowWhyMatters(!showWhyMatters)}
            >
              <h2 className="text-lg font-semibold">Why This Matters</h2>
              <ChevronDown className={cn(
                "w-5 h-5 transition-transform",
                showWhyMatters && "rotate-180"
              )} />
            </Button>
            
            <AnimatePresence>
              {showWhyMatters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="p-5 space-y-4">
                      <div>
                        <h3 className="text-sm font-medium mb-1">Context</h3>
                        <p className="text-sm text-muted-foreground">
                          {story.summary || story.ai_summary || "No additional context available."}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium mb-1">Who is affected</h3>
                        <p className="text-sm text-muted-foreground">
                          Information derived from {sources.length || story.source_count || 1} source{(sources.length || story.source_count || 1) !== 1 ? "s" : ""}.
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium mb-1">Confidence</h3>
                        <p className="text-sm">
                          <span className={confidenceColors.text}>{confidence.label}</span>
                          <span className="text-muted-foreground"> — {confidence.explanation}</span>
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          <Separator className="my-8" />

          {/* SECTION 3: Timeline */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Story Timeline</h2>
            <p className="text-sm text-muted-foreground">
              How this story evolved over time
            </p>
            <StoryTimeline 
              storyId={story.id}
              publishedAt={story.first_published_at}
              lastUpdatedAt={story.last_updated_at}
              className="mt-4"
            />
          </section>

          <Separator className="my-8" />

          {/* SECTION 4: Sources & Trust */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-500" />
                Sources & Trust
              </h2>
              <Badge variant="outline" className="text-xs">
                {verifiedCount} of {sources.length || story.source_count || 1} verified
              </Badge>
            </div>

            {/* Trust breakdown */}
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">{sources.length || story.source_count || 1}</p>
                    <p className="text-xs text-muted-foreground">Total Sources</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-600">{verifiedCount}</p>
                    <p className="text-xs text-muted-foreground">Verified</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-muted-foreground">{(sources.length || 0) - verifiedCount}</p>
                    <p className="text-xs text-muted-foreground">Secondary</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-500">0</p>
                    <p className="text-xs text-muted-foreground">Contradictions</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sources list */}
            {sources.length > 0 && (
              <div className="space-y-2">
                {sources.map((source, idx) => {
                  const isVerified = isVerifiedSource(source.source_name);
                  return (
                    <a
                      key={source.id}
                      href={source.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors group"
                    >
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary flex-shrink-0">
                        {source.source_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{source.source_name}</span>
                          {isVerified && (
                            <Badge variant="secondary" className="text-[10px] h-4 bg-emerald-500/10 text-emerald-600 border-0">
                              ✓ Verified
                            </Badge>
                          )}
                          {idx === 0 && (
                            <Badge variant="secondary" className="text-[10px] h-4 bg-blue-500/10 text-blue-600 border-0">
                              First Report
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                          <span>{format(new Date(source.published_at), "MMM d, h:mm a")}</span>
                          {source.description && (
                            <>
                              <span>•</span>
                              <span className="truncate">{source.description}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                    </a>
                  );
                })}
              </div>
            )}
          </section>

          <Separator className="my-8" />

          {/* SECTION 5: Background (Optional) */}
          <section className="space-y-4">
            <Button
              variant="ghost"
              className="w-full justify-between h-auto py-3 px-0 hover:bg-transparent"
              onClick={() => setShowBackground(!showBackground)}
            >
              <h2 className="text-lg font-semibold text-muted-foreground">Background Context</h2>
              <ChevronDown className={cn(
                "w-5 h-5 transition-transform",
                showBackground && "rotate-180"
              )} />
            </Button>
            
            <AnimatePresence>
              {showBackground && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <Card>
                    <CardContent className="p-5">
                      <p className="text-sm text-muted-foreground">
                        Background context is derived from source reporting. 
                        First reported {formatDistanceToNow(new Date(story.first_published_at), { addSuffix: true })}.
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          <Separator className="my-8" />

          {/* SECTION 6: External Reading */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Read Original Reporting</h2>
            <p className="text-sm text-muted-foreground">
              Links to original articles from verified sources
            </p>
            <div className="flex flex-wrap gap-2">
              {sources.slice(0, 5).map((source) => (
                <Button
                  key={source.id}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  asChild
                >
                  <a href={source.source_url} target="_blank" rel="noopener noreferrer">
                    {source.source_name}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </Button>
              ))}
            </div>
          </section>
        </article>
      </main>

      <TTSLimitModal
        isOpen={showLimitModal}
        onClose={closeLimitModal}
        usedCount={usedCount}
        maxCount={maxCount}
      />

      <Footer />
    </div>
  );
}
