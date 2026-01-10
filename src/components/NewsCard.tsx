import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Headphones, Bookmark, Heart, Share2, TrendingUp, Shield, ExternalLink, ChevronRight, Pause, Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  topic: string;
  sentiment: "positive" | "neutral" | "negative";
  trustScore: number;
  source: string;
  sourceIcon?: string;
  timestamp: string;
  imageUrl?: string;
  whyMatters?: string;
}

interface NewsCardProps {
  news: NewsItem;
  index: number;
}

const topicColors: Record<string, string> = {
  Business: "bg-blue-500/10 text-blue-500",
  Tech: "bg-purple-500/10 text-purple-500",
  World: "bg-emerald-500/10 text-emerald-500",
  India: "bg-orange-500/10 text-orange-500",
  Sports: "bg-red-500/10 text-red-500",
  Finance: "bg-green-500/10 text-green-500",
  AI: "bg-cyan-500/10 text-cyan-500",
  Politics: "bg-amber-500/10 text-amber-500",
};

const sentimentConfig = {
  positive: { color: "text-success", icon: TrendingUp, label: "Positive" },
  neutral: { color: "text-muted-foreground", icon: TrendingUp, label: "Neutral" },
  negative: { color: "text-destructive", icon: TrendingUp, label: "Negative" },
};

export function NewsCard({ news, index }: NewsCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showWhy, setShowWhy] = useState(false);

  const sentiment = sentimentConfig[news.sentiment];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Card variant="news" className="group overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row">
            {/* Image */}
            {news.imageUrl && (
              <div className="lg:w-64 h-48 lg:h-auto relative overflow-hidden flex-shrink-0">
                <img
                  src={news.imageUrl}
                  alt={news.headline}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent lg:bg-gradient-to-r" />
              </div>
            )}

            {/* Content */}
            <div className="flex-1 p-6">
              {/* Top row - Topic, sentiment, trust */}
              <div className="flex items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={topicColors[news.topic] || "bg-primary/10 text-primary"}>
                    {news.topic}
                  </Badge>
                  <div className={`flex items-center gap-1 text-xs ${sentiment.color}`}>
                    <sentiment.icon className="w-3 h-3" />
                    <span>{sentiment.label}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Shield className="w-3 h-3 text-success" />
                  <span>{news.trustScore}% Trust</span>
                </div>
              </div>

              {/* Headline */}
              <h3 className="font-display text-lg sm:text-xl font-semibold mb-2 leading-tight group-hover:text-primary transition-colors cursor-pointer">
                {news.headline}
              </h3>

              {/* AI Summary */}
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed line-clamp-2">
                {news.summary}
              </p>

              {/* Why this matters */}
              <AnimatePresence>
                {showWhy && news.whyMatters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/10"
                  >
                    <div className="text-xs font-medium text-primary mb-1">Why this matters to you</div>
                    <p className="text-sm text-muted-foreground">{news.whyMatters}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Source and time */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium">
                    {news.source.charAt(0)}
                  </div>
                  <span>{news.source}</span>
                </div>
                <span>•</span>
                <span>{news.timestamp}</span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Listen button with audio wave */}
                  <Button
                    variant="glass"
                    size="sm"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="gap-2"
                  >
                    {isPlaying ? (
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
                    onClick={() => setIsSaved(!isSaved)}
                    className={isSaved ? "text-primary" : ""}
                  >
                    <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
                  </Button>

                  <Button
                    variant="ghost"
                    size="iconSm"
                    onClick={() => setIsLiked(!isLiked)}
                    className={isLiked ? "text-destructive" : ""}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
                  </Button>

                  <Button variant="ghost" size="iconSm">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowWhy(!showWhy)}
                  className="text-xs gap-1"
                >
                  Why this matters
                  <ChevronRight className={`w-3 h-3 transition-transform ${showWhy ? "rotate-90" : ""}`} />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
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
