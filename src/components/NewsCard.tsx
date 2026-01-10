import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Headphones, Bookmark, Heart, Share2, TrendingUp, Shield, ChevronRight, Pause, Play, Loader2, Flag, Clock, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTTS } from "@/hooks/use-tts";
import { usePreferences } from "@/contexts/PreferencesContext";
import { toast } from "sonner";
import { NewsDetailModal } from "@/components/NewsDetailModal";
import { DiscussionButton } from "@/components/discussions/DiscussionButton";

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
  imageUrl?: string;
  whyMatters?: string;
  countryCode?: string;
  isGlobal?: boolean;
  isBreaking?: boolean;
  isTrending?: boolean;
  sourceCount?: number;
}

interface NewsCardProps {
  news: NewsItem;
  index: number;
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
  crypto: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
};

const sentimentConfig = {
  positive: { color: "text-green-500", icon: TrendingUp, label: "Positive" },
  neutral: { color: "text-muted-foreground", icon: TrendingUp, label: "Neutral" },
  negative: { color: "text-red-500", icon: TrendingUp, label: "Negative" },
};

export function NewsCard({ news, index }: NewsCardProps) {
  const { language } = usePreferences();
  const { speak, toggle, isLoading, isPlaying, progress, stop } = useTTS({
    language: language?.code || "en",
  });
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const sentiment = sentimentConfig[news.sentiment] || sentimentConfig.neutral;

  const handleListen = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) {
      toggle();
    } else if (!isLoading) {
      const textToSpeak = news.headline.substring(0, 150);
      await speak(textToSpeak);
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
    setIsSaved(!isSaved);
    toast.success(isSaved ? "Removed from saved" : "Saved for later");
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
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
        onClick={() => setShowDetail(true)}
        className="cursor-pointer"
      >
        <Card variant="news" className="group overflow-hidden hover:shadow-xl transition-shadow">
          <CardContent className="p-0">
            <div className="flex flex-col lg:flex-row">
              {/* Image */}
              {news.imageUrl && (
                <div className="lg:w-64 h-48 lg:h-auto relative overflow-hidden flex-shrink-0">
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
                      <Badge className="bg-red-500 text-white border-0 animate-pulse">
                        🔴 Breaking
                      </Badge>
                    )}
                    {news.isTrending && (
                      <Badge className="bg-orange-500 text-white border-0">
                        🔥 Trending
                      </Badge>
                    )}
                  </div>

                  {news.countryCode && (
                    <div className="absolute bottom-3 left-3 px-2 py-1 rounded-full bg-background/80 backdrop-blur-sm text-xs flex items-center gap-1">
                      <Flag className="w-3 h-3" />
                      {news.countryCode}
                    </div>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="flex-1 p-6">
                {/* Top row */}
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={topicColors[news.topic.toLowerCase()] || "bg-primary/10 text-primary"}>
                      {news.topic}
                    </Badge>
                    <div className={`flex items-center gap-1 text-xs ${sentiment.color}`}>
                      <sentiment.icon className="w-3 h-3" />
                      <span>{sentiment.label}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Shield className="w-3 h-3 text-green-500" />
                    <span>{news.trustScore}% Trust</span>
                  </div>
                </div>

                {/* Headline */}
                <h3 className="font-display text-lg sm:text-xl font-semibold mb-2 leading-tight group-hover:text-primary transition-colors">
                  {news.headline}
                </h3>

                {/* AI Summary */}
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed line-clamp-2">
                  {news.summary}
                </p>

                {/* Audio progress bar */}
                {(isPlaying || isLoading) && (
                  <div className="mb-4">
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
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4 flex-wrap">
                  <button 
                    onClick={handleSourceClick}
                    className="flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium">
                      {news.source.charAt(0)}
                    </div>
                    <span className="truncate max-w-32">{news.source}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                  {news.sourceCount && news.sourceCount > 1 && (
                    <>
                      <span>•</span>
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                        Covered by {news.sourceCount} sources
                      </Badge>
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
                  <div className="flex items-center gap-2">
                    <Button
                      variant="glass"
                      size="sm"
                      onClick={handleListen}
                      className="gap-2"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Loading...</span>
                        </>
                      ) : isPlaying ? (
                        <>
                          <Pause className="w-4 h-4" />
                          <AudioWave />
                        </>
                      ) : (
                        <>
                          <Headphones className="w-4 h-4" />
                          <span>Listen</span>
                        </>
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="iconSm"
                      onClick={handleSave}
                      className={isSaved ? "text-primary" : ""}
                    >
                      <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
                    </Button>

                    <Button
                      variant="ghost"
                      size="iconSm"
                      onClick={handleLike}
                      className={isLiked ? "text-destructive" : ""}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
                    </Button>

                    <Button variant="ghost" size="iconSm" onClick={handleShare}>
                      <Share2 className="w-4 h-4" />
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
                    className="text-xs gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDetail(true);
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

      {/* Detail Modal */}
      <NewsDetailModal
        news={news}
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
      />
    </>
  );
}

function AudioWave() {
  return (
    <div className="flex items-center gap-0.5 h-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <motion.div
          key={i}
          className="w-0.5 bg-primary rounded-full"
          animate={{
            height: ["8px", "16px", "8px"],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
