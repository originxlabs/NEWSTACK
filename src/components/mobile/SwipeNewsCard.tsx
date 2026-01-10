import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Headphones, Bookmark, Heart, Share2, Shield, ChevronUp, ChevronDown,
  Pause, Loader2, Clock, ExternalLink, MapPin, Globe, Building2, X, MessageCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTTS } from "@/hooks/use-tts";
import { useTTSLimit } from "@/hooks/use-tts-limit";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";
import { toast } from "sonner";
import { TTSLimitModal } from "@/components/TTSLimitModal";
import { DiscussionButton } from "@/components/discussions/DiscussionButton";
import type { NewsItem } from "@/components/NewsCard";

interface SwipeNewsCardProps {
  news: NewsItem;
  isActive: boolean;
  onSwipeUp: () => void;
  onSwipeDown: () => void;
  hasNext: boolean;
  hasPrev: boolean;
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
  startups: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  science: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
};

const locationBadgeConfig = {
  Local: { icon: MapPin, color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  Country: { icon: Building2, color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  Global: { icon: Globe, color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
};

export function SwipeNewsCard({ 
  news, 
  isActive, 
  onSwipeUp, 
  onSwipeDown,
  hasNext,
  hasPrev 
}: SwipeNewsCardProps) {
  const { language, country } = usePreferences();
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showFullArticle, setShowFullArticle] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  const { speak, toggle, isLoading, isPlaying, progress, stop } = useTTS({
    language: language?.code || "en",
  });
  const { incrementUsage, canPlay, showLimitModal, closeLimitModal, usedCount, maxCount } = useTTSLimit();

  const locationRelevance = news.locationRelevance || (
    news.isGlobal ? "Global" : 
    news.countryCode === country?.code ? "Country" : "Global"
  );

  const handleListen = async () => {
    if (isPlaying) {
      toggle();
    } else if (!isLoading) {
      if (!canPlay()) return;
      if (incrementUsage()) {
        const textToSpeak = `${news.headline}. ${news.summary}`;
        await speak(textToSpeak.substring(0, 250));
      }
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

  const handleSave = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setIsSaved(!isSaved);
    toast.success(isSaved ? "Removed from saved" : "Saved for later");
  };

  const handleLike = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setIsLiked(!isLiked);
  };

  useEffect(() => {
    return () => stop();
  }, [stop]);

  // Reset full article view when card changes
  useEffect(() => {
    setShowFullArticle(false);
  }, [news.id]);

  if (!isActive) return null;

  return (
    <>
      <motion.div
        className="absolute inset-0 flex flex-col"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Full-screen Image Background */}
        <div className="absolute inset-0">
          {news.imageUrl ? (
            <img
              src={news.imageUrl}
              alt={news.headline}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-background" />
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative flex-1 flex flex-col justify-end p-4 pb-6 z-10">
          {/* Top badges */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              {news.isBreaking && (
                <Badge className="bg-red-500 text-white border-0 animate-pulse">
                  🔴 Breaking
                </Badge>
              )}
              {news.isTrending && (
                <Badge className="bg-orange-500 text-white border-0">
                  🔥 Trending
                </Badge>
              )}
              <Badge className={`${topicColors[news.topic.toLowerCase()] || "bg-primary/20 text-primary"}`}>
                {news.topic}
              </Badge>
            </div>
            <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-2 py-1">
              <Shield className="w-3 h-3 text-green-400" />
              <span className="text-xs text-white">{news.trustScore}%</span>
            </div>
          </div>

          {/* Navigation hints */}
          {hasPrev && (
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute top-20 left-1/2 -translate-x-1/2 flex flex-col items-center text-white/50"
            >
              <ChevronUp className="w-5 h-5" />
              <span className="text-xs">Previous</span>
            </motion.div>
          )}

          {/* Main content area */}
          <div className="space-y-4">
            {/* Location badge */}
            {(() => {
              const config = locationBadgeConfig[locationRelevance];
              const LocationIcon = config.icon;
              return (
                <Badge variant="outline" className={`${config.color} w-fit`}>
                  <LocationIcon className="w-3 h-3 mr-1" />
                  {locationRelevance}
                </Badge>
              );
            })()}

            {/* Headline */}
            <h1 className="text-2xl sm:text-3xl font-bold font-display leading-tight text-foreground">
              {news.headline}
            </h1>

            {/* Summary */}
            <p className="text-base text-muted-foreground leading-relaxed">
              {news.summary}
            </p>

            {/* Audio progress */}
            {(isPlaying || isLoading) && (
              <div className="w-full">
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary"
                    style={{ width: `${progress}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
              </div>
            )}

            {/* Source and time */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
              <button 
                onClick={() => news.sourceUrl && window.open(news.sourceUrl, "_blank")}
                className="flex items-center gap-1.5 hover:text-primary transition-colors"
              >
                <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                  {news.source.charAt(0)}
                </div>
                <span>{news.source}</span>
                <ExternalLink className="w-3 h-3" />
              </button>
              {news.sourceCount && news.sourceCount > 1 && (
                <>
                  <span>•</span>
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                    {news.sourceCount} sources
                  </span>
                </>
              )}
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {news.timestamp}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="glass"
                  size="sm"
                  onClick={handleListen}
                  className="gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isPlaying ? (
                    <>
                      <Pause className="w-4 h-4" />
                      <AudioWave />
                    </>
                  ) : (
                    <>
                      <Headphones className="w-4 h-4" />
                      Listen
                    </>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSave}
                  className={`${isSaved ? "text-primary" : ""}`}
                >
                  <Bookmark className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`} />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLike}
                  className={`${isLiked ? "text-destructive" : ""}`}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
                </Button>

                <Button variant="ghost" size="icon" onClick={handleShare}>
                  <Share2 className="w-5 h-5" />
                </Button>

                <DiscussionButton
                  contentType="news"
                  contentId={news.id}
                  contentTitle={news.headline}
                  variant="compact"
                />
              </div>

              <Button
                variant="default"
                size="sm"
                onClick={() => setShowFullArticle(true)}
                className="gap-1"
              >
                Read More
                <ChevronUp className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Next hint */}
          {hasNext && (
            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="flex flex-col items-center mt-6 text-muted-foreground"
            >
              <span className="text-xs">Swipe up for next</span>
              <ChevronDown className="w-5 h-5" />
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Full Article Modal */}
      <AnimatePresence>
        {showFullArticle && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-background"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-lg border-b">
              <div className="flex items-center justify-between p-4">
                <Badge className={`${topicColors[news.topic.toLowerCase()] || "bg-primary/20 text-primary"}`}>
                  {news.topic}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowFullArticle(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <ScrollArea className="h-[calc(100vh-64px)]">
              <div className="p-4 pb-20">
                {/* Image */}
                {news.imageUrl && (
                  <div className="relative aspect-video rounded-xl overflow-hidden mb-4">
                    <img
                      src={news.imageUrl}
                      alt={news.headline}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Headline */}
                <h1 className="text-2xl font-bold font-display mb-4">
                  {news.headline}
                </h1>

                {/* Meta */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 flex-wrap">
                  <span>{news.source}</span>
                  <span>•</span>
                  <span>{news.timestamp}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Shield className="w-3 h-3 text-green-500" />
                    <span>{news.trustScore}% trusted</span>
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
                  <h3 className="text-sm font-semibold text-primary mb-2">AI Summary</h3>
                  <p className="text-foreground">{news.summary}</p>
                </div>

                {/* Why This Matters */}
                {news.whyMatters && (
                  <div className="bg-muted rounded-xl p-4 mb-6">
                    <h3 className="text-sm font-semibold mb-2">Why This Matters</h3>
                    <p className="text-muted-foreground">{news.whyMatters}</p>
                  </div>
                )}

                {/* Full Content */}
                {news.content && (
                  <div className="prose dark:prose-invert max-w-none">
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                      {news.content}
                    </p>
                  </div>
                )}

                {/* Source link */}
                {news.sourceUrl && (
                  <Button
                    variant="outline"
                    className="w-full mt-6"
                    onClick={() => window.open(news.sourceUrl, "_blank")}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Read Original Article
                  </Button>
                )}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>

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

function AudioWave() {
  return (
    <div className="flex items-center gap-0.5 h-4">
      {[1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="w-0.5 bg-current rounded-full"
          animate={{ height: ["8px", "16px", "8px"] }}
          transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
