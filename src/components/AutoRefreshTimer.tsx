import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Clock, Bell, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface AutoRefreshTimerProps {
  intervalMinutes?: number;
  onRefresh: () => Promise<void>;
  newStoriesCount?: number;
  onNewStoriesClick?: () => void;
  className?: string;
}

export function AutoRefreshTimer({
  intervalMinutes = 5,
  onRefresh,
  newStoriesCount = 0,
  onNewStoriesClick,
  className,
}: AutoRefreshTimerProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(intervalMinutes * 60);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());
  const [isPaused, setIsPaused] = useState(false);

  const totalSeconds = intervalMinutes * 60;
  const progress = ((totalSeconds - secondsRemaining) / totalSeconds) * 100;

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
      setLastRefreshTime(new Date());
      setSecondsRemaining(totalSeconds);
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh, totalSeconds, isRefreshing]);

  // Countdown timer
  useEffect(() => {
    if (isPaused || isRefreshing) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Time's up - trigger refresh
          handleRefresh();
          return totalSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, isRefreshing, handleRefresh, totalSeconds]);

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* New stories notification */}
      <AnimatePresence>
        {newStoriesCount > 0 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-7 bg-primary/10 text-primary border-primary/20 animate-pulse"
              onClick={onNewStoriesClick || handleRefresh}
            >
              <Bell className="w-3 h-3" />
              <span className="font-medium">{newStoriesCount} new</span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Countdown timer */}
      <div className="flex items-center gap-2">
        <div 
          className="relative w-20 h-1.5 bg-muted rounded-full overflow-hidden cursor-pointer"
          onClick={() => setIsPaused(!isPaused)}
          title={isPaused ? "Click to resume auto-refresh" : "Click to pause auto-refresh"}
        >
          <motion.div
            className={cn(
              "absolute inset-y-0 left-0 rounded-full",
              isPaused ? "bg-amber-500" : "bg-primary"
            )}
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <Badge 
          variant="outline" 
          className={cn(
            "text-[10px] h-5 px-1.5 gap-1 font-mono",
            isPaused ? "bg-amber-500/10 text-amber-600 border-amber-500/20" : ""
          )}
        >
          <Clock className="w-2.5 h-2.5" />
          {isPaused ? "Paused" : formatTime(secondsRemaining)}
        </Badge>
      </div>

      {/* Manual refresh button */}
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0"
        onClick={handleRefresh}
        disabled={isRefreshing}
        title="Refresh now"
      >
        <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
      </Button>
    </div>
  );
}

// Compact inline version
interface AutoRefreshBadgeProps {
  intervalMinutes?: number;
  onRefresh: () => Promise<void>;
  className?: string;
}

export function AutoRefreshBadge({
  intervalMinutes = 5,
  onRefresh,
  className,
}: AutoRefreshBadgeProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(intervalMinutes * 60);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const totalSeconds = intervalMinutes * 60;

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
      setSecondsRemaining(totalSeconds);
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh, totalSeconds, isRefreshing]);

  useEffect(() => {
    if (isRefreshing) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          handleRefresh();
          return totalSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRefreshing, handleRefresh, totalSeconds]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "gap-1 text-[10px] cursor-pointer hover:bg-muted transition-colors",
        className
      )}
      onClick={handleRefresh}
    >
      {isRefreshing ? (
        <RefreshCw className="w-2.5 h-2.5 animate-spin" />
      ) : (
        <Clock className="w-2.5 h-2.5" />
      )}
      {isRefreshing ? "Refreshing..." : `Next: ${formatTime(secondsRemaining)}`}
    </Badge>
  );
}
