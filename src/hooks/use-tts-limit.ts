import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

const TTS_LIMIT_KEY = "newstack_tts_usage";
const MAX_FREE_PLAYS = 50;

interface TTSUsage {
  count: number;
  date: string;
}

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

function getStoredUsage(): TTSUsage {
  try {
    const stored = localStorage.getItem(TTS_LIMIT_KEY);
    if (stored) {
      const usage = JSON.parse(stored) as TTSUsage;
      // Reset if it's a new day
      if (usage.date !== getTodayDate()) {
        return { count: 0, date: getTodayDate() };
      }
      return usage;
    }
  } catch {
    // Invalid data, reset
  }
  return { count: 0, date: getTodayDate() };
}

function saveUsage(usage: TTSUsage): void {
  localStorage.setItem(TTS_LIMIT_KEY, JSON.stringify(usage));
}

export function useTTSLimit() {
  const { user, profile } = useAuth();
  const [usage, setUsage] = useState<TTSUsage>(getStoredUsage());
  const [showLimitModal, setShowLimitModal] = useState(false);

  // Check if user is premium (unlimited plays)
  // subscription_tier can be: free, pro, lifetime, enterprise
  const tier = profile?.subscription_tier;
  const isPremium = tier === "pro" || tier === "lifetime" || tier === "enterprise";

  // Calculate remaining plays
  const remainingPlays = Math.max(0, MAX_FREE_PLAYS - usage.count);
  const hasReachedLimit = !isPremium && remainingPlays <= 0;

  // Reset counter on new day
  useEffect(() => {
    const checkDate = () => {
      const currentUsage = getStoredUsage();
      if (currentUsage.date !== usage.date) {
        setUsage(currentUsage);
      }
    };
    
    // Check every minute for date change
    const interval = setInterval(checkDate, 60000);
    return () => clearInterval(interval);
  }, [usage.date]);

  // Increment usage count
  const incrementUsage = useCallback(() => {
    if (isPremium) return true; // Premium users have unlimited

    const currentUsage = getStoredUsage();
    
    if (currentUsage.count >= MAX_FREE_PLAYS) {
      setShowLimitModal(true);
      return false; // Limit reached
    }

    const newUsage = {
      count: currentUsage.count + 1,
      date: getTodayDate(),
    };
    saveUsage(newUsage);
    setUsage(newUsage);
    return true;
  }, [isPremium]);

  // Check if can play (without incrementing)
  const canPlay = useCallback(() => {
    if (isPremium) return true;
    return usage.count < MAX_FREE_PLAYS;
  }, [isPremium, usage.count]);

  // Close the modal
  const closeLimitModal = useCallback(() => {
    setShowLimitModal(false);
  }, []);

  return {
    usedCount: usage.count,
    maxCount: MAX_FREE_PLAYS,
    remainingPlays,
    hasReachedLimit,
    isPremium,
    showLimitModal,
    incrementUsage,
    canPlay,
    closeLimitModal,
  };
}
