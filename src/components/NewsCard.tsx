import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Headphones, Bookmark, Heart, Share2, Shield, ChevronRight, Pause, Loader2, Clock, ExternalLink, MapPin, Globe, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTTS } from "@/hooks/use-tts";
import { useTTSLimit } from "@/hooks/use-tts-limit";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";
import { toast } from "sonner";
import { TTSLimitModal } from "@/components/TTSLimitModal";
import { DiscussionButton } from "@/components/discussions/DiscussionButton";
import { SourcesPopover } from "@/components/SourcesPopover";

export interface NewsSource {
  source_name: string;
  source_url: string;
  description?: string;
  published_at: string;
}

export interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  content?: string;
  topic: string;
  sentiment: "positive" | "neutral" | "negative";
  trustScore: number;
  source: string;
  sourceUrl?: string;
  sourceIcon?: string;
  timestamp: string;
  publishedAt?: string;
  imageUrl?: string;
  whyMatters?: string;
  countryCode?: string;
  isGlobal?: boolean;
  isBreaking?: boolean;
  isTrending?: boolean;
  sourceCount?: number;
  locationRelevance?: "Local" | "Country" | "Global";
  sources?: NewsSource[];
}

interface NewsCardProps {
  news: NewsItem;
  index: number;
  onClick?: () => void;
  onReadMore?: () => void;
  isActive?: boolean;
  compact?: boolean;
}

const topicColors: Record<string, string> = {
  business: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  tech: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  world: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  sports: "bg-red-500/10 text-red-500 border-red-500/20",
  finance: "bg-green-500/10 text-green-500 border-green-500/20",
  ai: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  politics: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  health: "bg-teal-500/10 text-teal-500 border-teal-500/20",
  entertainment: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  climate: "bg-lime-500/10 text-lime-500 border-lime-500/20",
  startups: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  science: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
};

const locationBadgeConfig = {
  Local: { icon: MapPin, color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  Country: { icon: Building2, color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  Global: { icon: Globe, color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
};

export function NewsCard({ news, index, onClick, onReadMore, isActive, compact = false }: NewsCardProps) {
  const { language, country } = usePreferences();
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { speak, toggle, isLoading, isPlaying, progress, stop } = useTTS({
    language: language?.code || "en",
  });
  const { incrementUsage, canPlay, showLimitModal, closeLimitModal, usedCount, maxCount } = useTTSLimit();
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const locationRelevance = news.locationRelevance || (
    news.isGlobal ? "Global" : 
    news.countryCode === country?.code ? "Country" : "Global"
  );

  const handleListen = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) {
      toggle();
    } else if (!isLoading) {
      if (!canPlay()) return;
      if (incrementUsage()) {
        const textToSpeak = news.headline.substring(0, 150);
        await speak(textToSpeak);
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
    } catch {
      // User cancelled
    }
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

  const handleSourceClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (news.sourceUrl) {
      window.open(news.sourceUrl, "_blank");
    }
  };

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.05 }}
        onClick={onClick}
        className="cursor-pointer"
      >
        <Card 
          variant="news" 
          className={`group overflow-hidden hover:shadow-xl transition-all ${
            isActive ? "ring-2 ring-primary shadow-lg" : ""
          }`}
        >
          <CardContent className="p-0">
            <div className="flex flex-col lg:flex-row">
              {/* Image */}
              {news.imageUrl && (
                <div className="lg:w-56 xl:w-64 h-44 lg:h-auto relative overflow-hidden flex-shrink-0">
                  <img
                    src={news.imageUrl}
                    alt={news.headline}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent lg:bg-gradient-to-r" />
                  
                  {/* Breaking/Trending badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {news.isBreaking && (
                      <Badge className="bg-red-500 text-white border-0 animate-pulse text-xs">
                        🔴 Breaking
                      </Badge>
                    )}
                    {news.isTrending && (
                      <Badge className="bg-orange-500 text-white border-0 text-xs">
                        🔥 Trending
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="flex-1 p-4 sm:p-5">
                {/* Top row */}
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`${topicColors[news.topic.toLowerCase()] || "bg-primary/10 text-primary"} text-xs`}>
                      {news.topic}
                    </Badge>
                    {(() => {
                      const config = locationBadgeConfig[locationRelevance];
                      const LocationIcon = config.icon;
                      return (
                        <Badge variant="outline" className={`text-[10px] ${config.color}`}>
                          <LocationIcon className="w-3 h-3 mr-1" />
                          {locationRelevance}
                        </Badge>
                      );
                    })()}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Shield className="w-3 h-3 text-green-500" />
                    <span>{news.trustScore}%</span>
                  </div>
                </div>

                {/* Headline */}
                <h3 className="font-display text-base sm:text-lg font-semibold mb-2 leading-tight group-hover:text-primary transition-colors line-clamp-2">
                  {news.headline}
                </h3>

                {/* Summary */}
                <p className="text-sm text-muted-foreground mb-3 leading-relaxed line-clamp-2">
                  {news.summary}
                </p>

                {/* Audio progress */}
                {(isPlaying || isLoading) && (
                  <div className="mb-3">
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
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 flex-wrap">
                  <button 
                    onClick={handleSourceClick}
                    className="flex items-center gap-1.5 hover:text-primary transition-colors"
                  >
                    <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[9px] font-medium">
                      {news.source.charAt(0)}
                    </div>
                    <span className="truncate max-w-28">{news.source}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                  {news.sourceCount && news.sourceCount >= 1 && (
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
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {news.timestamp}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="glass"
                      size="sm"
                      onClick={handleListen}
                      className="gap-1.5 h-8 text-xs"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : isPlaying ? (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          <AudioWave />
                        </>
                      ) : (
                        <>
                          <Headphones className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Listen</span>
                        </>
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleSave}
                      className={`w-8 h-8 ${isSaved ? "text-primary" : ""}`}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-current" : ""}`} />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleLike}
                      className={`w-8 h-8 ${isLiked ? "text-destructive" : ""}`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-current" : ""}`} />
                    </Button>

                    <Button variant="ghost" size="icon" onClick={handleShare} className="w-8 h-8">
                      <Share2 className="w-3.5 h-3.5" />
                    </Button>

                    <DiscussionButton
                      contentType="news"
                      contentId={news.id}
                      contentTitle={news.headline}
                      variant="compact"
                    />
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs gap-1 h-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onReadMore) {
                        onReadMore();
                      } else {
                        onClick?.();
                      }
                    }}
                  >
                    Read more
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                </div>
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

function AudioWave() {
  return (
    <div className="flex items-center gap-0.5 h-3">
      {[1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="w-0.5 bg-primary rounded-full"
          animate={{ height: ["6px", "12px", "6px"] }}
          transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
