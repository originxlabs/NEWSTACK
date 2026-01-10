import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, ChevronLeft, ChevronRight, ExternalLink, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TrendingStory {
  id: string;
  headline: string;
  summary: string;
  source: string;
  sourceUrl?: string;
  timestamp: string;
  imageUrl?: string;
  sourceCount?: number;
}

interface TrendingNewsBannerProps {
  stories: TrendingStory[];
  onStoryClick?: (story: TrendingStory) => void;
}

export function TrendingNewsBanner({ stories, onStoryClick }: TrendingNewsBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-rotate every 5 seconds
  useEffect(() => {
    if (stories.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % stories.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [stories.length, isPaused]);

  if (!stories || stories.length === 0) return null;

  const currentStory = stories[currentIndex];

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % stories.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + stories.length) % stories.length);
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500/10 via-red-500/10 to-pink-500/10 border border-orange-500/20"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-orange-500/20 bg-orange-500/5">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
          <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
            Daily Trending
          </span>
          <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
            Top {stories.length}
          </Badge>
        </div>
        
        {/* Navigation dots */}
        <div className="flex items-center gap-1">
          {stories.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentIndex
                  ? "bg-orange-500 w-4"
                  : "bg-orange-500/30 hover:bg-orange-500/50"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative min-h-[120px] p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="cursor-pointer"
            onClick={() => onStoryClick?.(currentStory)}
          >
            <div className="flex gap-4">
              {/* Image */}
              {currentStory.imageUrl && (
                <div className="hidden sm:block w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={currentStory.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}

              {/* Text content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-orange-500 text-white border-0 text-[10px]">
                    #{currentIndex + 1} Trending
                  </Badge>
                  {currentStory.sourceCount && currentStory.sourceCount > 1 && (
                    <Badge variant="outline" className="text-[10px]">
                      Covered by {currentStory.sourceCount} sources
                    </Badge>
                  )}
                </div>

                <h3 className="font-display text-base sm:text-lg font-semibold mb-1 line-clamp-2 hover:text-primary transition-colors">
                  {currentStory.headline}
                </h3>

                <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                  {currentStory.summary}
                </p>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {currentStory.timestamp}
                  </span>
                  {currentStory.source && (
                    <>
                      <span>•</span>
                      <span className="truncate max-w-24">{currentStory.source}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation arrows */}
        {stories.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8 opacity-0 hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                goToPrev();
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 opacity-0 hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Progress bar */}
      {!isPaused && stories.length > 1 && (
        <motion.div
          key={currentIndex}
          className="absolute bottom-0 left-0 h-0.5 bg-orange-500"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 5, ease: "linear" }}
        />
      )}
    </div>
  );
}
