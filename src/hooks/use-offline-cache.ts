import { useState, useEffect, useCallback } from "react";
import type { NewsItem } from "@/components/NewsCard";

const OFFLINE_CACHE_KEY = "newstack_offline_stories";
const MAX_CACHED_STORIES = 100; // Increased from 20 to 100
const SYNC_STATUS_KEY = "newstack_sync_status";

interface OfflineCache {
  stories: NewsItem[];
  cachedAt: string;
}

interface SyncStatus {
  lastSyncedAt: string;
  pendingSync: boolean;
}

export function useOfflineCache() {
  const [cachedStories, setCachedStories] = useState<NewsItem[]>([]);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [lastCached, setLastCached] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingSync, setPendingSync] = useState(false);

  // Load cached stories on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(OFFLINE_CACHE_KEY);
      if (cached) {
        const data: OfflineCache = JSON.parse(cached);
        setCachedStories(data.stories);
        setLastCached(new Date(data.cachedAt));
      }
      
      // Check sync status
      const syncStatus = localStorage.getItem(SYNC_STATUS_KEY);
      if (syncStatus) {
        const status: SyncStatus = JSON.parse(syncStatus);
        setPendingSync(status.pendingSync);
      }
    } catch (err) {
      console.error("Failed to load offline cache:", err);
    }
  }, []);

  // Listen for online/offline status and sync when back online
  useEffect(() => {
    const handleOnline = async () => {
      setIsOffline(false);
      
      // Trigger sync when coming back online
      if (pendingSync) {
        setIsSyncing(true);
        // Small delay to ensure network is stable
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsSyncing(false);
        setPendingSync(false);
        
        // Update sync status
        const syncStatus: SyncStatus = {
          lastSyncedAt: new Date().toISOString(),
          pendingSync: false,
        };
        localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(syncStatus));
      }
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      setPendingSync(true);
      
      // Update sync status
      const syncStatus: SyncStatus = {
        lastSyncedAt: localStorage.getItem(SYNC_STATUS_KEY) 
          ? JSON.parse(localStorage.getItem(SYNC_STATUS_KEY)!).lastSyncedAt 
          : new Date().toISOString(),
        pendingSync: true,
      };
      localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(syncStatus));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [pendingSync]);

  // Cache stories
  const cacheStories = useCallback((stories: NewsItem[]) => {
    try {
      // Get existing cached stories
      const existingCache = localStorage.getItem(OFFLINE_CACHE_KEY);
      let existingStories: NewsItem[] = [];
      
      if (existingCache) {
        const data: OfflineCache = JSON.parse(existingCache);
        existingStories = data.stories;
      }
      
      // Merge new stories with existing, removing duplicates by id
      const storyMap = new Map<string, NewsItem>();
      existingStories.forEach(story => storyMap.set(story.id, story));
      stories.forEach(story => storyMap.set(story.id, story));
      
      // Sort by publishedAt (newest first) and limit
      const mergedStories = Array.from(storyMap.values())
        .sort((a, b) => {
          const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
          const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, MAX_CACHED_STORIES);
      
      const cacheData: OfflineCache = {
        stories: mergedStories,
        cachedAt: new Date().toISOString(),
      };
      localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(cacheData));
      setCachedStories(mergedStories);
      setLastCached(new Date());
      
      // Also send to service worker for better caching
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        mergedStories.slice(0, 20).forEach((story) => {
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
      localStorage.removeItem(SYNC_STATUS_KEY);
      setCachedStories([]);
      setLastCached(null);
      setPendingSync(false);
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
    isSyncing,
    pendingSync,
  };
}
