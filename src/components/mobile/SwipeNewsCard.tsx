import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Headphones, Bookmark, Heart, Share2, Shield, ChevronUp, ChevronDown,
  Pause, Loader2, Clock, ExternalLink, MapPin, Globe, Building2, X, 
  MessageCircle, Play, Volume2
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
import { useHaptic } from "@/hooks/use-haptic";
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
  all: "bg-primary/20 text-primary border-primary/30",
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
  const { trigger: haptic } = useHaptic();
  const hapticEnabled = localStorage.getItem("newstack_haptic_enabled") !== "false";
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showFullArticle, setShowFullArticle] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const { speak, toggle, isLoading, isPlaying, progress, stop } = useTTS({
    language: language?.code || "en",
  });
  const { incrementUsage, canPlay, showLimitModal, closeLimitModal, usedCount, maxCount } = useTTSLimit();

  const locationRelevance = news.locationRelevance || (
    news.isGlobal ? "Global" : 
    news.countryCode === country?.code ? "Country" : "Global"
  );

  const handleListen = async () => {
    if (hapticEnabled) haptic("light");
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
    if (hapticEnabled) haptic("light");
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
    if (hapticEnabled) haptic("medium");
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setIsSaved(!isSaved);
    toast.success(isSaved ? "Removed from saved" : "Saved for later");
  };

  const handleLike = () => {
    if (hapticEnabled) haptic("medium");
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setIsLiked(!isLiked);
  };

  const handleReadMore = () => {
    if (hapticEnabled) haptic("light");
    setShowFullArticle(true);
  };

  const handleCloseFullArticle = useCallback(() => {
    if (hapticEnabled) haptic("light");
    setShowFullArticle(false);
  }, [hapticEnabled, haptic]);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  // Reset states when card changes
  useEffect(() => {
    setShowFullArticle(false);
    setImageLoaded(false);
  }, [news.id]);

  if (!isActive) return null;

  const topicColor = topicColors[news.topic?.toLowerCase()] || topicColors.all;

  return (
    <>
      <div className="absolute inset-0 flex flex-col overflow-hidden">
        {/* Full-screen Image Background */}
        <div className="absolute inset-0">
          {news.imageUrl ? (
            <>
              {/* Placeholder while loading */}
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background">
                  <motion.div
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute inset-0 bg-gradient-to-t from-background to-transparent"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="w-12 h-12 rounded-xl bg-primary/30 flex items-center justify-center"
                    >
                      <span className="text-lg font-bold text-primary font-display">N</span>
                    </motion.div>
                  </div>
                </div>
              )}
              <img
                src={news.imageUrl}
                alt={news.headline}
                loading="eager"
                className={`w-full h-full object-cover transition-opacity duration-500 ${
                  imageLoaded ? "opacity-100" : "opacity-0"
                }`}
                onLoad={() => setImageLoaded(true)}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                  setImageLoaded(true);
                }}
              />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 via-primary/10 to-background">
              <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <div className="w-32 h-32 rounded-3xl bg-primary/20 flex items-center justify-center">
                  <span className="text-5xl font-bold text-primary font-display">N</span>
                </div>
              </div>
            </div>
          )}
          {/* Enhanced gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent h-40" />
        </div>

        {/* Content */}
        <div className="relative flex-1 flex flex-col justify-end p-4 pb-8 z-10 safe-area-bottom">
          {/* Top badges */}
          <div className="absolute top-16 left-4 right-4 flex items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              {news.isBreaking && (
                <Badge className="bg-red-500 text-white border-0 animate-pulse shadow-lg">
                  🔴 Breaking
                </Badge>
              )}
              {news.isTrending && (
                <Badge className="bg-orange-500 text-white border-0 shadow-lg">
                  🔥 Trending
                </Badge>
              )}
              <Badge className={`${topicColor} shadow-sm`}>
                {news.topic}
              </Badge>
            </div>
            <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1 shadow-lg">
              <Shield className="w-3 h-3 text-green-400" />
              <span className="text-xs text-white font-medium">{news.trustScore}%</span>
            </div>
          </div>

          {/* Navigation hint - Previous */}
          {hasPrev && (
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-24 left-1/2 -translate-x-1/2 flex flex-col items-center text-white/40"
            >
              <ChevronUp className="w-5 h-5" />
              <span className="text-[10px]">Swipe down</span>
            </motion.div>
          )}

          {/* Main content area */}
          <div className="space-y-3">
            {/* Location badge */}
            {(() => {
              const config = locationBadgeConfig[locationRelevance as keyof typeof locationBadgeConfig];
              if (!config) return null;
              const LocationIcon = config.icon;
              return (
                <Badge variant="outline" className={`${config.color} w-fit shadow-sm`}>
                  <LocationIcon className="w-3 h-3 mr-1" />
                  {locationRelevance}
                </Badge>
              );
            })()}

            {/* Headline */}
            <h1 className="text-xl sm:text-2xl font-bold font-display leading-tight text-foreground drop-shadow-sm">
              {news.headline}
            </h1>

            {/* Summary */}
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed line-clamp-3">
              {news.summary}
            </p>

            {/* Audio progress */}
            <AnimatePresence>
              {(isPlaying || isLoading) && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="w-full overflow-hidden"
                >
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-primary" />
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${progress}%` }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Source and time */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
              <button 
                onClick={() => news.sourceUrl && window.open(news.sourceUrl, "_blank")}
                className="flex items-center gap-1.5 hover:text-primary transition-colors active:scale-95"
              >
                <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                  {news.source?.charAt(0) || "N"}
                </div>
                <span className="font-medium">{news.source}</span>
                <ExternalLink className="w-3 h-3" />
              </button>
              {news.sourceCount && news.sourceCount > 1 && (
                <>
                  <span className="text-muted-foreground/50">•</span>
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                    {news.sourceCount} sources
                  </span>
                </>
              )}
              <span className="text-muted-foreground/50">•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {news.timestamp}
              </span>
            </div>

            {/* Actions - Native app style */}
            <div className="flex items-center justify-between pt-3 gap-2">
              {/* Left side action buttons */}
              <div className="flex items-center gap-0.5">
                <motion.div whileTap={{ scale: 0.9 }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleListen}
                    className="gap-1.5 h-10 px-4 bg-white/15 backdrop-blur-md border-0 text-foreground hover:bg-white/25 rounded-full shadow-lg"
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
                        <Play className="w-4 h-4" />
                        <span className="text-xs font-medium">Listen</span>
                      </>
                    )}
                  </Button>
                </motion.div>

                <motion.div whileTap={{ scale: 0.85 }}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSave}
                    className={`h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm ${isSaved ? "text-primary bg-primary/20" : "text-foreground"}`}
                  >
                    <Bookmark className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`} />
                  </Button>
                </motion.div>

                <motion.div whileTap={{ scale: 0.85 }}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLike}
                    className={`h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm ${isLiked ? "text-red-500 bg-red-500/20" : "text-foreground"}`}
                  >
                    <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
                  </Button>
                </motion.div>

                <motion.div whileTap={{ scale: 0.85 }}>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleShare}
                    className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm text-foreground"
                  >
                    <Share2 className="w-5 h-5" />
                  </Button>
                </motion.div>

                <DiscussionButton
                  contentType="news"
                  contentId={news.id}
                  contentTitle={news.headline}
                  variant="compact"
                />
              </div>

              {/* Read More button */}
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleReadMore}
                  className="gap-1.5 h-10 px-5 shadow-xl rounded-full font-semibold"
                >
                  Read More
                  <ChevronUp className="w-4 h-4" />
                </Button>
              </motion.div>
            </div>
          </div>

          {/* Next hint */}
          {hasNext && (
            <motion.div
              animate={{ y: [0, 4, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              className="flex flex-col items-center mt-4 text-muted-foreground/60"
            >
              <span className="text-[10px]">Swipe up for next</span>
              <ChevronDown className="w-5 h-5" />
            </motion.div>
          )}
        </div>
      </div>

      {/* Full Article Modal - Slide up like native */}
      <AnimatePresence>
        {showFullArticle && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseFullArticle}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            
            {/* Modal */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ 
                type: "spring", 
                damping: 30, 
                stiffness: 300,
                mass: 0.8 
              }}
              className="fixed inset-x-0 bottom-0 z-50 bg-background rounded-t-3xl max-h-[92vh] overflow-hidden shadow-2xl"
            >
              {/* Drag handle */}
              <div className="sticky top-0 z-10 bg-background pt-3 pb-2 px-4 border-b">
                <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-3" />
                <div className="flex items-center justify-between">
                  <Badge className={`${topicColor}`}>
                    {news.topic}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCloseFullArticle}
                    className="h-8 w-8"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <ScrollArea className="h-[calc(92vh-80px)]">
                <div className="p-4 pb-8 space-y-4">
                  {/* Image */}
                  {news.imageUrl && (
                    <div className="relative aspect-video rounded-xl overflow-hidden">
                      <img
                        src={news.imageUrl}
                        alt={news.headline}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Headline */}
                  <h1 className="text-xl sm:text-2xl font-bold font-display leading-tight">
                    {news.headline}
                  </h1>

                  {/* Meta */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                    <span className="font-medium">{news.source}</span>
                    <span>•</span>
                    <span>{news.timestamp}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Shield className="w-3 h-3 text-green-500" />
                      <span>{news.trustScore}% trusted</span>
                    </div>
                    {news.sourceCount && news.sourceCount > 1 && (
                      <>
                        <span>•</span>
                        <span>{news.sourceCount} sources</span>
                      </>
                    )}
                  </div>

                  {/* Audio player */}
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                    <Button
                      variant="default"
                      size="icon"
                      onClick={handleListen}
                      disabled={isLoading}
                      className="h-10 w-10 rounded-full"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : isPlaying ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5 ml-0.5" />
                      )}
                    </Button>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Listen to article</p>
                      <p className="text-xs text-muted-foreground">
                        {isPlaying ? "Playing..." : `~${Math.ceil((news.headline.length + (news.summary?.length || 0)) / 150)} min`}
                      </p>
                    </div>
                    {(isPlaying || isLoading) && (
                      <div className="w-24">
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* AI Summary */}
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      AI Summary
                    </h3>
                    <p className="text-foreground leading-relaxed">{news.summary}</p>
                  </div>

                  {/* Why This Matters */}
                  {news.whyMatters && (
                    <div className="bg-muted rounded-xl p-4">
                      <h3 className="text-sm font-semibold mb-2">💡 Why This Matters</h3>
                      <p className="text-muted-foreground leading-relaxed">{news.whyMatters}</p>
                    </div>
                  )}

                  {/* Full Content */}
                  {news.content && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold">Full Story</h3>
                      <div className="prose dark:prose-invert max-w-none">
                        <p className="text-foreground leading-relaxed whitespace-pre-wrap text-sm">
                          {news.content}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant={isLiked ? "default" : "outline"}
                      size="sm"
                      onClick={handleLike}
                      className="flex-1 gap-2"
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
                      {isLiked ? "Liked" : "Like"}
                    </Button>
                    <Button
                      variant={isSaved ? "default" : "outline"}
                      size="sm"
                      onClick={handleSave}
                      className="flex-1 gap-2"
                    >
                      <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
                      {isSaved ? "Saved" : "Save"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShare}
                      className="flex-1 gap-2"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </Button>
                  </div>

                  {/* Source link */}
                  {news.sourceUrl && (
                    <Button
                      variant="outline"
                      className="w-full mt-2"
                      onClick={() => window.open(news.sourceUrl, "_blank")}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Read Original Article
                    </Button>
                  )}

                  {/* Discussion */}
                  <div className="pt-4 border-t">
                    <DiscussionButton
                      contentType="news"
                      contentId={news.id}
                      contentTitle={news.headline}
                    />
                  </div>
                </div>
              </ScrollArea>
            </motion.div>
          </>
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
          animate={{ height: ["6px", "14px", "6px"] }}
          transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.08, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
