import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Headphones, Bookmark, Heart, Share2, Shield, Clock, Loader2, Pause, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useTTS } from "@/hooks/use-tts";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { NewsItem } from "@/components/NewsCard";

interface NewsDetailModalProps {
  news: NewsItem | null;
  isOpen: boolean;
  onClose: () => void;
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
};

export function NewsDetailModal({ news, isOpen, onClose }: NewsDetailModalProps) {
  const { language } = usePreferences();
  const { user } = useAuth();
  const { speak, toggle, isLoading, isPlaying, progress, stop } = useTTS({
    language: language?.code || "en",
  });
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Check if article is already saved by this user
  useEffect(() => {
    if (!user || !news) return;
    
    const checkSavedStatus = async () => {
      const { data } = await supabase
        .from("saved_news")
        .select("id")
        .eq("user_id", user.id)
        .eq("news_id", news.id)
        .maybeSingle();
      
      setIsSaved(!!data);
    };
    
    checkSavedStatus();
  }, [user, news?.id]);

  if (!news) return null;

  const handleListen = async () => {
    if (isPlaying) {
      toggle();
    } else if (!isLoading) {
      // Read the full summary for detailed view
      const textToSpeak = `${news.headline}. ${news.summary}`;
      await speak(textToSpeak);
    }
  };

  const handleShare = async () => {
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
    } catch {
      // User cancelled
    }
  };

  const handleSave = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    try {
      if (isSaved) {
        await supabase
          .from("saved_news")
          .delete()
          .eq("user_id", user.id)
          .eq("news_id", news.id);
        setIsSaved(false);
        toast.success("Removed from saved");
      } else {
        await supabase
          .from("saved_news")
          .insert({ user_id: user.id, news_id: news.id });
        setIsSaved(true);
        toast.success("Saved for later");
      }
    } catch (err) {
      toast.error("Failed to save article");
    }
  };

  const handleLike = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setIsLiked(!isLiked);
    toast.success(isLiked ? "Removed from liked" : "Liked!");
  };

  const handleClose = () => {
    stop();
    onClose();
  };

  // Mock sources - in production these would come from the API
  const sources = [
    { name: news.source, url: "#", verified: true },
    { name: "Reuters", url: "https://reuters.com", verified: true },
    { name: "Associated Press", url: "https://apnews.com", verified: true },
  ];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            {/* Hero Image */}
            {news.imageUrl && (
              <div className="relative h-64 overflow-hidden">
                <img
                  src={news.imageUrl}
                  alt={news.headline}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                
                {/* Close button */}
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors z-10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}

            <div className="p-6">
              {/* Topic & Trust */}
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={topicColors[news.topic.toLowerCase()] || "bg-primary/20 text-primary"}>
                    {news.topic}
                  </Badge>
                  {news.isGlobal && (
                    <Badge variant="outline">🌍 Global</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span className="text-green-500 font-medium">{news.trustScore}% Verified</span>
                </div>
              </div>

              {/* Headline */}
              <h1 className="font-display text-2xl md:text-3xl font-bold mb-4 leading-tight">
                {news.headline}
              </h1>

              {/* Source & Time */}
              <div className="flex items-center gap-3 text-sm text-muted-foreground mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    {news.source.charAt(0)}
                  </div>
                  <span>{news.source}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{news.timestamp}</span>
                </div>
              </div>

              {/* Listen Button - Prominent */}
              <div className="mb-6">
                <Button
                  size="lg"
                  className="w-full h-14 text-lg gap-3"
                  onClick={handleListen}
                  disabled={isLoading}
                >
                  {isLoading ? (
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
                      Listen to this story
                    </>
                  )}
                </Button>
                
                {/* Audio progress */}
                {(isPlaying || isLoading) && (
                  <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>

              {/* AI Summary */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  AI Summary
                </h3>
                <div className="p-4 rounded-xl bg-muted/50 border border-border">
                  <p className="text-base leading-relaxed">
                    {news.summary}
                  </p>
                </div>
              </div>

              {/* Why This Matters */}
              {news.whyMatters && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Why This Matters
                  </h3>
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <p className="text-base leading-relaxed">
                      {news.whyMatters}
                    </p>
                  </div>
                </div>
              )}

              {/* Verified Sources */}
              <div className="mb-6">
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
                        <span className="font-medium">{source.name}</span>
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
              <div className="flex items-center gap-2 pt-4 border-t border-border">
                <Button
                  variant={isSaved ? "default" : "outline"}
                  className="flex-1"
                  onClick={handleSave}
                >
                  <Bookmark className={`w-4 h-4 mr-2 ${isSaved ? "fill-current" : ""}`} />
                  {isSaved ? "Saved" : "Save"}
                </Button>
                <Button
                  variant={isLiked ? "default" : "outline"}
                  className="flex-1"
                  onClick={handleLike}
                >
                  <Heart className={`w-4 h-4 mr-2 ${isLiked ? "fill-current" : ""}`} />
                  {isLiked ? "Liked" : "Like"}
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
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
          animate={{
            height: ["6px", "14px", "6px"],
          }}
          transition={{
            duration: 0.4,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
