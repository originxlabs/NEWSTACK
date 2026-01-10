import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Headphones, Bookmark, Heart, Share2, Shield, Clock, Loader2, Pause, MessageCircle, ChevronLeft, Send, Scale, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useTTS } from "@/hooks/use-tts";
import { useTTSLimit } from "@/hooks/use-tts-limit";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { NewsItem } from "@/components/NewsCard";
import { TTSLimitModal } from "@/components/TTSLimitModal";
import { format, formatDistanceToNow } from "date-fns";

interface ArticleDetailPanelProps {
  article: NewsItem | null;
  isOpen: boolean;
  onClose: () => void;
  onCompare?: (headline: string, id?: string) => void;
  onViewTimeline?: (id: string, headline: string) => void;
}

interface Discussion {
  id: string;
  author_name: string | null;
  message: string;
  agrees_count: number;
  disagrees_count: number;
  created_at: string;
  user_id: string | null;
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

// Discussion cache
const discussionCache = new Map<string, { data: Discussion[]; timestamp: number }>();
const CACHE_TTL = 60000;

export function ArticleDetailPanel({ article, isOpen, onClose, onCompare, onViewTimeline }: ArticleDetailPanelProps) {
  const isMobile = useIsMobile();
  const { language } = usePreferences();
  const { user, profile } = useAuth();
  const { speak, toggle, isLoading: ttsLoading, isPlaying, progress, stop } = useTTS({
    language: language?.code || "en",
  });
  const { incrementUsage, canPlay, showLimitModal, closeLimitModal, usedCount, maxCount } = useTTSLimit();
  
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSavingArticle, setIsSavingArticle] = useState(false);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [isLoadingDiscussions, setIsLoadingDiscussions] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if article is already saved
  useEffect(() => {
    const checkSavedStatus = async () => {
      if (!user || !article) return;
      
      const { data } = await supabase
        .from("saved_news")
        .select("id")
        .eq("user_id", user.id)
        .eq("news_id", article.id)
        .maybeSingle();
      
      setIsSaved(!!data);
    };
    
    if (isOpen && article && user) {
      checkSavedStatus();
    }
  }, [isOpen, article?.id, user]);

  const handleSaveArticle = async () => {
    if (!article) return;
    
    if (!user) {
      toast.error("Please sign in to save articles");
      return;
    }

    setIsSavingArticle(true);
    try {
      if (isSaved) {
        // Remove from saved
        await supabase
          .from("saved_news")
          .delete()
          .eq("user_id", user.id)
          .eq("news_id", article.id);
        
        setIsSaved(false);
        toast.success("Removed from saved");
      } else {
        // Add to saved
        await supabase
          .from("saved_news")
          .insert({
            user_id: user.id,
            news_id: article.id,
          });
        
        setIsSaved(true);
        toast.success("Saved for later");
      }
    } catch (err) {
      toast.error("Failed to save article");
    } finally {
      setIsSavingArticle(false);
    }
  };

  const fetchDiscussions = async () => {
    if (!article) return;
    
    const cacheKey = `news-${article.id}`;
    const cached = discussionCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setDiscussions(cached.data);
      return;
    }

    setIsLoadingDiscussions(true);
    try {
      const { data, error } = await supabase
        .from("discussions")
        .select("*")
        .eq("content_type", "news")
        .eq("content_id", article.id)
        .eq("is_hidden", false)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!error && data) {
        setDiscussions(data as Discussion[]);
        discussionCache.set(cacheKey, { data: data as Discussion[], timestamp: Date.now() });
      }
    } catch (err) {
      console.error("Failed to fetch discussions:", err);
    } finally {
      setIsLoadingDiscussions(false);
    }
  };

  useEffect(() => {
    if (isOpen && article) {
      fetchDiscussions();
    }
  }, [isOpen, article?.id]);

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

  const handleSubmitDiscussion = async () => {
    if (!newMessage.trim()) return;
    
    // Max 50 characters
    if (newMessage.length > 50) {
      toast.error("Max 50 characters per comment.");
      return;
    }

    setIsSubmitting(true);
    try {
      const authorName = user ? (profile?.display_name || user.email?.split("@")[0] || "User") : "Anonymous";

      const { error } = await supabase.from("discussions").insert({
        content_type: "news",
        content_id: article.id,
        user_id: user?.id || null,
        author_name: authorName,
        message: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage("");
      toast.success("Opinion shared!");
      
      discussionCache.delete(`news-${article.id}`);
      fetchDiscussions();
    } catch (err) {
      toast.error("Failed to post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimestamp = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60);

    if (diffHours < 24) {
      return `Today at ${format(d, "h:mm a")}`;
    } else if (diffHours < 48) {
      return `Yesterday at ${format(d, "h:mm a")}`;
    }
    return formatDistanceToNow(d, { addSuffix: true });
  };

  const handleClose = () => {
    stop();
    onClose();
  };

  // Mock sources
  const sources = [
    { name: article.source, url: article.sourceUrl || "#", verified: true },
    ...(article.sourceCount && article.sourceCount > 1 
      ? [{ name: "Reuters", url: "https://reuters.com", verified: true }]
      : []
    ),
  ];

  const Content = (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="h-full flex flex-col"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border p-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={handleClose} className="hover:bg-accent">
          {isMobile ? <ChevronLeft className="h-5 w-5" /> : <X className="h-5 w-5" />}
        </Button>
        <div className="flex-1 min-w-0">
          <Badge className={`${topicColors[article.topic.toLowerCase()] || "bg-primary/20 text-primary"} text-xs`}>
            {article.topic}
          </Badge>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Shield className="w-3 h-3 text-green-500" />
          <span>{article.trustScore}%</span>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Hero Image with Gradient Overlay */}
        {article.imageUrl && (
          <div className="relative h-56 sm:h-64 overflow-hidden">
            <motion.img
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              src={article.imageUrl}
              alt={article.headline}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
            
            {/* Floating badges on image */}
            <div className="absolute bottom-4 left-4 flex items-center gap-2">
              {article.isBreaking && (
                <Badge variant="destructive" className="animate-pulse">
                  Breaking
                </Badge>
              )}
              {article.isTrending && (
                <Badge className="bg-orange-500/90 hover:bg-orange-500">
                  🔥 Trending
                </Badge>
              )}
            </div>
          </div>
        )}

        <div className="p-4 sm:p-6 space-y-6">
          {/* Headline */}
          <h1 className="font-display text-xl sm:text-2xl font-bold leading-tight">
            {article.headline}
          </h1>

          {/* Source & Time */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                {article.source.charAt(0)}
              </div>
              <span>{article.source}</span>
            </div>
            {article.sourceCount && article.sourceCount > 1 && (
              <>
                <span>•</span>
                <Badge variant="outline" className="text-[10px]">
                  Covered by {article.sourceCount} sources
                </Badge>
              </>
            )}
            <span>•</span>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{article.timestamp}</span>
            </div>
          </div>

          {/* Listen Button */}
          <Button
            size="lg"
            className="w-full h-12 text-base gap-3"
            onClick={handleListen}
            disabled={ttsLoading}
          >
            {ttsLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading...
              </>
            ) : isPlaying ? (
              <>
                <Pause className="w-5 h-5" />
                Pause
                <AudioWave />
              </>
            ) : (
              <>
                <Headphones className="w-5 h-5" />
                Listen to this story
              </>
            )}
          </Button>
          
          {(isPlaying || ttsLoading) && (
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <motion.div className="h-full bg-primary" style={{ width: `${progress}%` }} />
            </div>
          )}

          {/* AI Summary */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              AI Summary
            </h3>
            <div className="p-4 rounded-xl bg-muted/50 border border-border">
              <p className="text-sm sm:text-base leading-relaxed">{article.summary}</p>
            </div>
          </div>

          {/* Why This Matters */}
          {article.whyMatters && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Why This Matters
              </h3>
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <p className="text-sm sm:text-base leading-relaxed">{article.whyMatters}</p>
              </div>
            </div>
          )}

          {/* Sources */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-500" />
              Sources ({sources.length})
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
              onClick={handleSaveArticle}
              disabled={isSavingArticle}
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
            {onCompare && article.sourceCount && article.sourceCount > 1 && (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 min-w-[80px]"
                onClick={() => onCompare(article.headline, article.id)}
              >
                <Scale className="w-4 h-4 mr-2" />
                Compare
              </Button>
            )}
          </div>

          {/* Open Discussion */}
          <div className="pt-6 border-t border-border">
            <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              💬 Open Discussion
            </h3>

            {/* New Comment */}
            <div className="mb-4">
              <Textarea
                placeholder="Share your opinion (max 50 characters)..."
                value={newMessage}
                onChange={(e) => {
                  // Enforce 50 character limit including paste
                  const value = e.target.value.slice(0, 50);
                  setNewMessage(value);
                }}
                maxLength={50}
                className="min-h-[60px] resize-none text-sm"
              />
              <div className="flex items-center justify-between mt-2">
                <span className={`text-xs ${
                  newMessage.length >= 45 
                    ? "text-destructive font-medium" 
                    : "text-muted-foreground"
                }`}>
                  {newMessage.length}/50 characters
                </span>
                <Button
                  size="sm"
                  onClick={handleSubmitDiscussion}
                  disabled={!newMessage.trim() || isSubmitting || newMessage.length > 50}
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Discussion List */}
            {isLoadingDiscussions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : discussions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No discussions yet. Be the first to share your thoughts!
              </p>
            ) : (
              <div className="space-y-3">
                {discussions.slice(0, 5).map((discussion) => (
                  <div key={discussion.id} className="p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">
                        {discussion.author_name || "Anonymous"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatTimestamp(discussion.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{discussion.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
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

  // Mobile: Full-screen dialog
  if (isMobile) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-full h-[100dvh] p-0 gap-0 rounded-none">
          {Content}
        </DialogContent>
      </Dialog>
    );
  }

  // Desktop: Side panel
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent side="right" className="w-full sm:w-[520px] lg:w-[600px] p-0">
        {Content}
      </SheetContent>
    </Sheet>
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
