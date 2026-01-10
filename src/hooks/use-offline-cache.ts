import { useState, useEffect, useCallback } from "react";
import type { NewsItem } from "@/components/NewsCard";

const OFFLINE_CACHE_KEY = "newstack_offline_stories";
const MAX_CACHED_STORIES = 20;

interface OfflineCache {
  stories: NewsItem[];
  cachedAt: string;
}

export function useOfflineCache() {
  const [cachedStories, setCachedStories] = useState<NewsItem[]>([]);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [lastCached, setLastCached] = useState<Date | null>(null);

  // Load cached stories on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(OFFLINE_CACHE_KEY);
      if (cached) {
        const data: OfflineCache = JSON.parse(cached);
        setCachedStories(data.stories);
        setLastCached(new Date(data.cachedAt));
      }
    } catch (err) {
      console.error("Failed to load offline cache:", err);
    }
  }, []);

  // Listen for online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Cache stories
  const cacheStories = useCallback((stories: NewsItem[]) => {
    try {
      // Only cache the latest MAX_CACHED_STORIES
      const toCache = stories.slice(0, MAX_CACHED_STORIES);
      const cacheData: OfflineCache = {
        stories: toCache,
        cachedAt: new Date().toISOString(),
      };
      localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(cacheData));
      setCachedStories(toCache);
      setLastCached(new Date());
      
      // Also send to service worker for better caching
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        toCache.forEach((story) => {
          navigator.serviceWorker.controller?.postMessage({
            type: "SAVE_ARTICLE_OFFLINE",
            article: story,
          });
        });
      }
      
      return true;
    } catch (err) {
      console.error("Failed to cache stories:", err);
      return false;
    }
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem(OFFLINE_CACHE_KEY);
      setCachedStories([]);
      setLastCached(null);
      return true;
    } catch (err) {
      console.error("Failed to clear cache:", err);
      return false;
    }
  }, []);

  // Get cache size in KB
  const getCacheSize = useCallback((): number => {
    try {
      const cached = localStorage.getItem(OFFLINE_CACHE_KEY);
      if (cached) {
        return Math.round(cached.length / 1024);
      }
    } catch {
      // Ignore errors
    }
    return 0;
  }, []);

  return {
    cachedStories,
    isOffline,
    lastCached,
    cacheStories,
    clearCache,
    getCacheSize,
    hasCachedStories: cachedStories.length > 0,
    cachedCount: cachedStories.length,
  };
}
