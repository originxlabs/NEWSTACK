import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Clock, ExternalLink, ChevronRight, Flame, Crown, Medal, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { NewsItem } from "@/components/NewsCard";

interface DailyTrendingTop10Props {
  articles: NewsItem[];
  onArticleClick: (article: NewsItem) => void;
  onReadMore: (article: NewsItem) => void;
}

const rankIcons = [
  { icon: Crown, color: "text-yellow-500", bg: "bg-yellow-500/10 border-yellow-500/30" },
  { icon: Medal, color: "text-gray-400", bg: "bg-gray-500/10 border-gray-500/30" },
  { icon: Award, color: "text-amber-600", bg: "bg-amber-600/10 border-amber-600/30" },
];

export function DailyTrendingTop10({ articles, onArticleClick, onReadMore }: DailyTrendingTop10Props) {
  const [expanded, setExpanded] = useState(false);

  const trendingArticles = useMemo(() => {
    // Sort by source count and recency to get top trending
    return [...articles]
      .sort((a, b) => {
        const scoreA = (a.sourceCount || 1) * 10 + (a.isTrending ? 5 : 0);
        const scoreB = (b.sourceCount || 1) * 10 + (b.isTrending ? 5 : 0);
        return scoreB - scoreA;
      })
      .slice(0, 10);
  }, [articles]);

  if (trendingArticles.length === 0) return null;

  const displayedArticles = expanded ? trendingArticles : trendingArticles.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6 mb-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30">
            <Flame className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">Daily Top 10</h2>
            <p className="text-sm text-muted-foreground">Most trending stories today</p>
          </div>
        </div>
        <Badge className="bg-primary/10 text-primary border-primary/20">
          <TrendingUp className="w-3 h-3 mr-1" />
          Live
        </Badge>
      </div>

      {/* Trending List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {displayedArticles.map((article, index) => {
            const RankIcon = rankIcons[index]?.icon || null;
            const rankStyle = rankIcons[index];

            return (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="group relative"
              >
                <div
                  onClick={() => onArticleClick(article)}
                  className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all cursor-pointer border border-transparent hover:border-primary/20"
                >
                  {/* Rank */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border ${rankStyle?.bg || "bg-muted/50 border-border"}`}>
                    {RankIcon ? (
                      <RankIcon className={`w-5 h-5 ${rankStyle?.color}`} />
                    ) : (
                      <span className="font-display font-bold text-lg text-muted-foreground">
                        {index + 1}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[10px] h-5">
                        {article.topic}
                      </Badge>
                      {article.sourceCount && article.sourceCount > 1 && (
                        <Badge variant="outline" className="text-[10px] h-5 bg-primary/5">
                          {article.sourceCount} sources
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                      {article.headline}
                    </h3>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span>{article.source}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {article.timestamp}
                      </div>
                    </div>
                  </div>

                  {/* Image Thumbnail */}
                  {article.imageUrl && (
                    <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden">
                      <img
                        src={article.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                    </div>
                  )}

                  {/* Read More Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onReadMore(article);
                    }}
                  >
                    Read
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Expand/Collapse */}
      {trendingArticles.length > 5 && (
        <div className="mt-4 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="gap-2"
          >
            {expanded ? "Show Less" : `Show All ${trendingArticles.length}`}
            <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? "rotate-90" : ""}`} />
          </Button>
        </div>
      )}
    </motion.div>
  );
}
