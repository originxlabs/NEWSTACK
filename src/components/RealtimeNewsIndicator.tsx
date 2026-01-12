import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, RefreshCw, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRealtimeStories } from "@/hooks/use-realtime-stories";
import { cn } from "@/lib/utils";

interface RealtimeNewsIndicatorProps {
  onRefresh?: () => void;
  className?: string;
  variant?: "bar" | "floating" | "minimal";
}

export function RealtimeNewsIndicator({ 
  onRefresh, 
  className,
  variant = "bar" 
}: RealtimeNewsIndicatorProps) {
  const { newStories, lastUpdate, isConnected, refresh, resetNewCount } = useRealtimeStories();
  const [isDismissed, setIsDismissed] = useState(false);

  // Reset dismissed state when new stories come in
  useEffect(() => {
    if (newStories > 0) {
      setIsDismissed(false);
    }
  }, [newStories]);

  const handleRefresh = () => {
    refresh();
    onRefresh?.();
    setIsDismissed(true);
  };

  const handleDismiss = () => {
    resetNewCount();
    setIsDismissed(true);
  };

  // Minimal variant - just a badge indicator
  if (variant === "minimal") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {/* Connection status indicator */}
        <div className={cn(
          "w-2 h-2 rounded-full",
          isConnected ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
        )} />
        
        <AnimatePresence>
          {newStories > 0 && !isDismissed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Badge 
                variant="destructive" 
                className="cursor-pointer hover:bg-destructive/80"
                onClick={handleRefresh}
              >
                <Zap className="w-3 h-3 mr-1" />
                {newStories} new
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Floating variant - fixed position button
  if (variant === "floating") {
    return (
      <AnimatePresence>
        {newStories > 0 && !isDismissed && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className={cn(
              "fixed bottom-20 left-1/2 -translate-x-1/2 z-50",
              className
            )}
          >
            <Button
              onClick={handleRefresh}
              className="shadow-lg gap-2 bg-primary hover:bg-primary/90"
            >
              <RefreshCw className="w-4 h-4" />
              {newStories} new {newStories === 1 ? "story" : "stories"}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Bar variant - full width notification bar
  return (
    <AnimatePresence>
      {newStories > 0 && !isDismissed && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className={cn(
            "bg-primary text-primary-foreground overflow-hidden",
            className
          )}
        >
          <div className="container mx-auto px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Bell className="w-4 h-4" />
              </motion.div>
              <span className="text-sm font-medium">
                {newStories} new {newStories === 1 ? "story" : "stories"} available
              </span>
              {lastUpdate && (
                <span className="text-xs opacity-70">
                  Updated {new Date(lastUpdate).toLocaleTimeString()}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleRefresh}
                className="h-7 text-xs gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="h-7 w-7 p-0 hover:bg-primary-foreground/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Compact inline indicator for headers/toolbars
export function RealtimeStatusDot({ className }: { className?: string }) {
  const { isConnected, newStories } = useRealtimeStories();
  
  return (
    <div className={cn("relative", className)}>
      <div className={cn(
        "w-2 h-2 rounded-full transition-colors",
        isConnected ? "bg-emerald-500" : "bg-muted-foreground"
      )} />
      {isConnected && (
        <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-75" />
      )}
      {newStories > 0 && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full flex items-center justify-center">
          <span className="text-[8px] text-white font-bold">
            {newStories > 9 ? "9+" : newStories}
          </span>
        </div>
      )}
    </div>
  );
}
