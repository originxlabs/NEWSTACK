import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Loader2,
  X, Shuffle, Repeat, ListMusic, ChevronDown, ChevronUp, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTTS } from "@/hooks/use-tts";
import { useTTSLimit } from "@/hooks/use-tts-limit";
import { cn } from "@/lib/utils";

interface PlaylistItem {
  id: string;
  headline: string;
  summary?: string;
  originalHeadline?: string | null;
  originalLanguage?: string | null;
  language?: string;
  source?: string;
  timestamp?: string;
}

interface AudioPlaylistPlayerProps {
  items: PlaylistItem[];
  isOpen: boolean;
  onClose: () => void;
  regionalFirst?: boolean;
  className?: string;
}

// Language priority for regional-first mode (regional languages first, then English)
const LANGUAGE_PRIORITY: Record<string, number> = {
  or: 1, // Odia
  hi: 2, // Hindi
  bn: 3, // Bengali
  ta: 4, // Tamil
  te: 5, // Telugu
  mr: 6, // Marathi
  gu: 7, // Gujarati
  kn: 8, // Kannada
  ml: 9, // Malayalam
  pa: 10, // Punjabi
  as: 11, // Assamese
  en: 99, // English last
};

const LANGUAGE_DISPLAY: Record<string, { name: string; native: string; flag: string }> = {
  or: { name: "Odia", native: "ଓଡ଼ିଆ", flag: "🏛️" },
  hi: { name: "Hindi", native: "हिंदी", flag: "🇮🇳" },
  bn: { name: "Bengali", native: "বাংলা", flag: "🎭" },
  ta: { name: "Tamil", native: "தமிழ்", flag: "🏯" },
  te: { name: "Telugu", native: "తెలుగు", flag: "🏰" },
  mr: { name: "Marathi", native: "मराठी", flag: "🦁" },
  gu: { name: "Gujarati", native: "ગુજરાતી", flag: "🦁" },
  kn: { name: "Kannada", native: "ಕನ್ನಡ", flag: "🐘" },
  ml: { name: "Malayalam", native: "മലയാളം", flag: "🌴" },
  pa: { name: "Punjabi", native: "ਪੰਜਾਬੀ", flag: "🌾" },
  as: { name: "Assamese", native: "অসমীয়া", flag: "🌿" },
  en: { name: "English", native: "English", flag: "🌐" },
};

export function AudioPlaylistPlayer({
  items,
  isOpen,
  onClose,
  regionalFirst = true,
  className,
}: AudioPlaylistPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isShuffled, setIsShuffled] = useState(false);
  const [isRepeating, setIsRepeating] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [playOriginal, setPlayOriginal] = useState(true); // Play in original language
  const hasAutoPlayedRef = useRef(false);

  // Sort items by regional priority
  const sortedItems = useCallback(() => {
    if (!regionalFirst) return items;
    
    return [...items].sort((a, b) => {
      const langA = a.originalLanguage || a.language || "en";
      const langB = b.originalLanguage || b.language || "en";
      const priorityA = LANGUAGE_PRIORITY[langA] ?? 50;
      const priorityB = LANGUAGE_PRIORITY[langB] ?? 50;
      return priorityA - priorityB;
    });
  }, [items, regionalFirst]);

  const playlist = sortedItems();
  const currentItem = playlist[currentIndex];
  const currentLang = playOriginal 
    ? (currentItem?.originalLanguage || currentItem?.language || "en")
    : "en";

  const { speak, stop, isLoading, isPlaying, progress, duration } = useTTS({
    language: currentLang,
    maxLength: 300,
  });
  
  const { incrementUsage, canPlay } = useTTSLimit();

  // Play current item
  const playCurrentItem = useCallback(async () => {
    if (!currentItem || !canPlay()) return;
    
    if (!incrementUsage()) return;
    
    const textToSpeak = playOriginal && currentItem.originalHeadline
      ? currentItem.originalHeadline
      : currentItem.headline;
    
    await speak(textToSpeak);
  }, [currentItem, playOriginal, speak, canPlay, incrementUsage]);

  // Auto-advance to next item when current finishes
  useEffect(() => {
    if (progress >= 100 && !isLoading && !isPlaying && hasAutoPlayedRef.current) {
      const nextIndex = currentIndex + 1;
      if (nextIndex < playlist.length) {
        setCurrentIndex(nextIndex);
      } else if (isRepeating) {
        setCurrentIndex(0);
      }
    }
  }, [progress, isLoading, isPlaying, currentIndex, playlist.length, isRepeating]);

  // Play when index changes
  useEffect(() => {
    if (isOpen && hasAutoPlayedRef.current && currentItem) {
      playCurrentItem();
    }
  }, [currentIndex, isOpen]);

  const handlePlay = useCallback(() => {
    hasAutoPlayedRef.current = true;
    playCurrentItem();
  }, [playCurrentItem]);

  const handleStop = useCallback(() => {
    stop();
    hasAutoPlayedRef.current = false;
  }, [stop]);

  const handleNext = useCallback(() => {
    stop();
    if (isShuffled) {
      const randomIndex = Math.floor(Math.random() * playlist.length);
      setCurrentIndex(randomIndex);
    } else {
      setCurrentIndex(prev => (prev + 1) % playlist.length);
    }
  }, [stop, isShuffled, playlist.length]);

  const handlePrev = useCallback(() => {
    stop();
    setCurrentIndex(prev => (prev - 1 + playlist.length) % playlist.length);
  }, [stop, playlist.length]);

  const handleSelectItem = useCallback((index: number) => {
    stop();
    setCurrentIndex(index);
    hasAutoPlayedRef.current = true;
  }, [stop]);

  // Cleanup on close
  useEffect(() => {
    if (!isOpen) {
      stop();
      hasAutoPlayedRef.current = false;
    }
  }, [isOpen, stop]);

  if (!isOpen || playlist.length === 0) return null;

  const langInfo = LANGUAGE_DISPLAY[currentLang] || LANGUAGE_DISPLAY.en;
  const hasOriginalLanguage = currentItem?.originalLanguage && currentItem.originalLanguage !== "en";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 p-4 pb-safe",
          className
        )}
      >
        <Card className="max-w-3xl mx-auto shadow-2xl border-primary/20 bg-background/95 backdrop-blur-xl">
          <CardContent className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ListMusic className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Audio Playlist</span>
                <Badge variant="outline" className="text-[10px]">
                  {currentIndex + 1} / {playlist.length}
                </Badge>
              </div>
              
              <div className="flex items-center gap-1">
                {/* Language toggle */}
                {hasOriginalLanguage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-7 px-2 text-xs gap-1",
                      playOriginal && "bg-primary/10 text-primary"
                    )}
                    onClick={() => setPlayOriginal(!playOriginal)}
                  >
                    <Globe className="w-3 h-3" />
                    {playOriginal ? langInfo.native : "English"}
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setShowPlaylist(!showPlaylist)}
                >
                  {showPlaylist ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronUp className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={onClose}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Current item info */}
            <div className="mb-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm line-clamp-2 mb-1">
                    {playOriginal && currentItem?.originalHeadline 
                      ? currentItem.originalHeadline 
                      : currentItem?.headline}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {currentItem?.source && <span>{currentItem.source}</span>}
                    <Badge variant="outline" className="text-[9px] h-4 px-1 gap-1">
                      {langInfo.flag} {langInfo.name}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>{Math.floor((progress / 100) * duration)}s</span>
                <span>{Math.floor(duration)}s</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8", isShuffled && "text-primary")}
                onClick={() => setIsShuffled(!isShuffled)}
              >
                <Shuffle className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10"
                onClick={handlePrev}
              >
                <SkipBack className="w-5 h-5" />
              </Button>
              
              <Button
                variant="default"
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={isPlaying ? handleStop : handlePlay}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10"
                onClick={handleNext}
              >
                <SkipForward className="w-5 h-5" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8", isRepeating && "text-primary")}
                onClick={() => setIsRepeating(!isRepeating)}
              >
                <Repeat className="w-4 h-4" />
              </Button>

              {/* Volume */}
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={100}
                  step={1}
                  className="w-20"
                  onValueChange={(v) => {
                    setVolume(v[0]);
                    if (v[0] > 0) setIsMuted(false);
                  }}
                />
              </div>
            </div>

            {/* Playlist */}
            <AnimatePresence>
              {showPlaylist && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <ScrollArea className="h-48 mt-4 rounded-md border border-border/50">
                    <div className="p-2 space-y-1">
                      {playlist.map((item, index) => {
                        const itemLang = item.originalLanguage || item.language || "en";
                        const itemLangInfo = LANGUAGE_DISPLAY[itemLang] || LANGUAGE_DISPLAY.en;
                        
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleSelectItem(index)}
                            className={cn(
                              "w-full text-left p-2 rounded-md transition-colors",
                              "hover:bg-muted/50",
                              index === currentIndex && "bg-primary/10 border border-primary/20"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground w-5">
                                {index + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium line-clamp-1">
                                  {item.headline}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <Badge variant="outline" className="text-[8px] h-3.5 px-1">
                                    {itemLangInfo.flag} {itemLangInfo.native}
                                  </Badge>
                                  {item.source && (
                                    <span className="text-[10px] text-muted-foreground">
                                      {item.source}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {index === currentIndex && isPlaying && (
                                <div className="flex items-center gap-0.5">
                                  {[1, 2, 3].map((i) => (
                                    <motion.div
                                      key={i}
                                      className="w-0.5 bg-primary rounded-full"
                                      animate={{ height: ["4px", "12px", "4px"] }}
                                      transition={{
                                        duration: 0.6,
                                        repeat: Infinity,
                                        delay: i * 0.15,
                                      }}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
