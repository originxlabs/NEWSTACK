import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Headphones, Bookmark, Heart, Share2, Shield, Clock, Loader2, Pause, ChevronLeft, History, Scale, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTTS } from "@/hooks/use-tts";
import { useTTSLimit } from "@/hooks/use-tts-limit";
import { usePreferences } from "@/contexts/PreferencesContext";
import { toast } from "sonner";
import type { NewsItem } from "@/components/NewsCard";
import { TTSLimitModal } from "@/components/TTSLimitModal";
import { format, formatDistanceToNow } from "date-fns";

interface ReadMoreModalProps {
  article: NewsItem | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenPanel?: () => void;
  onCompare?: (headline: string, id?: string) => void;
  onViewTimeline?: (id: string, headline: string) => void;
}

const topicColors: Record<string, string> = {
  business: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  tech: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  world: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  sports: "bg-red-500/20 text-red-400 border-red-500/30",
  finance: "bg-green-500/20 text-green-400 border-green-500/30",
  ai: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  politics: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  health: "bg-teal-500/20 text-teal-400 border-teal-500/30",
  entertainment: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  climate: "bg-lime-500/20 text-lime-400 border-lime-500/30",
  science: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  startups: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

export function ReadMoreModal({ article, isOpen, onClose, onOpenPanel, onCompare, onViewTimeline }: ReadMoreModalProps) {
  const { language } = usePreferences();
  const { speak, toggle, isLoading: ttsLoading, isPlaying, progress, stop } = useTTS({
    language: language?.code || "en",
  });
  const { incrementUsage, canPlay, showLimitModal, closeLimitModal, usedCount, maxCount } = useTTSLimit();
  
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  if (!article) return null;

  const handleListen = async () => {
    if (isPlaying) {
      toggle();
    } else if (!ttsLoading) {
      if (!canPlay()) return;
      if (incrementUsage()) {
        const textToSpeak = `${article.headline}. ${article.summary}`;
        await speak(textToSpeak);
      }
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: article.headline,
          text: article.summary,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(`${article.headline}\n\n${article.summary}`);
        toast.success("Copied to clipboard!");
      }
    } catch {
      // User cancelled
    }
  };

  const handleClose = () => {
    stop();
    onClose();
  };

  const formatPublishedDate = (dateStr?: string) => {
    if (!dateStr) return article.timestamp;
    const date = new Date(dateStr);
    return format(date, "EEEE, MMMM d, yyyy 'at' h:mm a");
  };

  // Mock sources
  const sources = [
    { name: article.source, url: article.sourceUrl || "#", verified: true },
    ...(article.sourceCount && article.sourceCount > 1 
      ? [
          { name: "Reuters", url: "https://reuters.com", verified: true },
          { name: "Associated Press", url: "https://apnews.com", verified: true },
        ].slice(0, article.sourceCount - 1)
      : []
    ),
  ];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0 gap-0 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="relative flex flex-col h-full max-h-[90vh]"
          >
            {/* Hero Image with Gradient */}
            {article.imageUrl && (
              <div className="relative h-56 md:h-64 overflow-hidden flex-shrink-0">
                <motion.img
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5 }}
                  src={article.imageUrl}
                  alt={article.headline}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                
                {/* Floating badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                  {article.isBreaking && (
                    <Badge variant="destructive" className="animate-pulse">
                      🔴 Breaking
                    </Badge>
                  )}
                  {article.isTrending && (
                    <Badge className="bg-orange-500/90 hover:bg-orange-500">
                      🔥 Trending
                    </Badge>
                  )}
                </div>

                {/* Close button */}
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors z-10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* Scrollable Content */}
            <ScrollArea className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Topic & Trust */}
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`${topicColors[article.topic.toLowerCase()] || "bg-primary/20 text-primary"}`}>
                      {article.topic}
                    </Badge>
                    {article.isGlobal && (
                      <Badge variant="outline">🌍 Global</Badge>
                    )}
                    {article.sourceCount && article.sourceCount > 1 && (
                      <Badge variant="outline" className="text-xs">
                        Covered by {article.sourceCount} sources
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="w-4 h-4 text-green-500" />
                    <span className="text-green-500 font-medium">{article.trustScore}% Verified</span>
                  </div>
                </div>

                {/* Headline */}
                <h1 className="font-display text-2xl md:text-3xl font-bold leading-tight">
                  {article.headline}
                </h1>

                {/* Source & Time */}
                <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                      {article.source.charAt(0)}
                    </div>
                    <span className="font-medium">{article.source}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatPublishedDate(article.publishedAt)}</span>
                  </div>
                </div>

                {/* Listen Button */}
                <Button
                  size="lg"
                  className="w-full h-14 text-lg gap-3"
                  onClick={handleListen}
                  disabled={ttsLoading}
                >
                  {ttsLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Loading audio...
                    </>
                  ) : isPlaying ? (
                    <>
                      <Pause className="w-5 h-5" />
                      Pause listening
                      <AudioWave />
                    </>
                  ) : (
                    <>
                      <Headphones className="w-5 h-5" />
                      Listen to full story
                    </>
                  )}
                </Button>
                
                {(isPlaying || ttsLoading) && (
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                  </div>
                )}

                {/* AI Summary */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Newspaper className="w-4 h-4" />
                    AI Summary
                  </h3>
                  <div className="p-4 rounded-xl bg-muted/50 border border-border">
                    <p className="text-base leading-relaxed">{article.summary}</p>
                  </div>
                </div>

                {/* Extended Content (if available) */}
                {article.content && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                      Full Article
                    </h3>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p className="text-base leading-relaxed whitespace-pre-wrap">{article.content}</p>
                    </div>
                  </div>
                )}

                {/* Why This Matters */}
                {article.whyMatters && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                      Why This Matters
                    </h3>
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <p className="text-base leading-relaxed">{article.whyMatters}</p>
                    </div>
                  </div>
                )}

                {/* Verified Sources */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-500" />
                    Verified Sources ({sources.length})
                  </h3>
                  <div className="space-y-2">
                    {sources.map((source, idx) => (
                      <a
                        key={idx}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                            {source.name.charAt(0)}
                          </div>
                          <span className="font-medium text-sm">{source.name}</span>
                          {source.verified && (
                            <Badge variant="secondary" className="text-[10px] bg-green-500/20 text-green-500 border-0">
                              ✓ Verified
                            </Badge>
                          )}
                        </div>
                        <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </a>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-4 border-t border-border flex-wrap">
                  <Button
                    variant={isSaved ? "default" : "outline"}
                    size="sm"
                    className="flex-1 min-w-[80px]"
                    onClick={() => {
                      setIsSaved(!isSaved);
                      toast.success(isSaved ? "Removed from saved" : "Saved for later");
                    }}
                  >
                    <Bookmark className={`w-4 h-4 mr-2 ${isSaved ? "fill-current" : ""}`} />
                    {isSaved ? "Saved" : "Save"}
                  </Button>
                  <Button
                    variant={isLiked ? "default" : "outline"}
                    size="sm"
                    className="flex-1 min-w-[80px]"
                    onClick={() => setIsLiked(!isLiked)}
                  >
                    <Heart className={`w-4 h-4 mr-2 ${isLiked ? "fill-current" : ""}`} />
                    Like
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 min-w-[80px]" onClick={handleShare}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>

                {/* Advanced Actions */}
                {(onCompare || onViewTimeline || onOpenPanel) && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {onOpenPanel && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          onClose();
                          onOpenPanel();
                        }}
                      >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Open in Side Panel
                      </Button>
                    )}
                    {onCompare && article.sourceCount && article.sourceCount > 1 && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          onClose(); // Close modal first
                          setTimeout(() => onCompare(article.headline, article.id), 100);
                        }}
                      >
                        <Scale className="w-4 h-4 mr-2" />
                        Compare Sources
                      </Button>
                    )}
                    {onViewTimeline && article.sourceCount && article.sourceCount > 1 && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          onClose(); // Close modal first
                          setTimeout(() => onViewTimeline(article.id, article.headline), 100);
                        }}
                      >
                        <History className="w-4 h-4 mr-2" />
                        View Timeline
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </motion.div>
        </DialogContent>
      </Dialog>

      <TTSLimitModal
        isOpen={showLimitModal}
        onClose={closeLimitModal}
        usedCount={usedCount}
        maxCount={maxCount}
      />
    </>
  );
}

function AudioWave() {
  return (
    <div className="flex items-center gap-0.5 h-4 ml-2">
      {[1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="w-0.5 bg-primary-foreground rounded-full"
          animate={{ height: ["6px", "14px", "6px"] }}
          transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
