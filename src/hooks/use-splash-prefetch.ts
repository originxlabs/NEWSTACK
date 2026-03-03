import { useCallback, useRef, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { NewsItem } from "@/components/NewsCard";

const CACHE_KEY = "newstack_prefetch_cache";
const CACHE_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

interface PrefetchCache {
  stories: NewsItem[];
  timestamp: number;
  countryCode?: string;
}

interface PrefetchResult {
  stories: NewsItem[];
  fromCache: boolean;
  error?: string;
}

export function useSplashPrefetch() {
  const [isPrefetching, setIsPrefetching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "checking" | "fetching" | "cached" | "complete" | "error">("idle");
  const [storiesCount, setStoriesCount] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check if cache is valid
  const isCacheValid = useCallback((): PrefetchCache | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;
      
      const data: PrefetchCache = JSON.parse(cached);
      const age = Date.now() - data.timestamp;
      
      if (age < CACHE_EXPIRY_MS && data.stories.length > 0) {
        return data;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // Save to cache
  const saveToCache = useCallback((stories: NewsItem[], countryCode?: string) => {
    try {
      const cache: PrefetchCache = {
        stories,
        timestamp: Date.now(),
        countryCode,
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (err) {
      console.error("Failed to save prefetch cache:", err);
    }
  }, []);

  // Fetch stories from database
  const fetchStories = useCallback(async (countryCode?: string): Promise<NewsItem[]> => {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - 48);

    let query = supabase
      .from("stories")
      .select(`
        id,
        headline,
        summary,
        category,
        city,
        state,
        district,
        image_url,
        first_published_at,
        source_count,
        original_headline,
        original_summary,
        original_language,
        confidence_level,
        country_code,
        is_global
      `)
      .gte("first_published_at", cutoff.toISOString())
      .order("first_published_at", { ascending: false })
      .limit(100);

    if (countryCode) {
      query = query.eq("country_code", countryCode.toUpperCase());
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((story) => ({
      id: story.id,
      headline: story.headline,
      summary: story.summary || "",
      topic: story.category || "News",
      sentiment: "neutral" as const,
      trustScore: story.confidence_level === "high" ? 95 : story.confidence_level === "medium" ? 80 : 70,
      source: "Local Sources",
      timestamp: formatTimestamp(story.first_published_at),
      publishedAt: story.first_published_at,
      imageUrl: story.image_url || undefined,
      countryCode: story.country_code || "",
      isGlobal: story.is_global || false,
      sourceCount: story.source_count || 1,
      locationRelevance: story.is_global ? "Global" : "Local",
      original_headline: story.original_headline,
      original_summary: story.original_summary,
      original_language: story.original_language,
    }));
  }, []);

  // Format timestamp
  const formatTimestamp = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  // Main prefetch function - called during splash screen
  const prefetch = useCallback(async (countryCode?: string): Promise<PrefetchResult> => {
    setIsPrefetching(true);
    setProgress(0);
    setStatus("checking");

    try {
      // Step 1: Check cache
      setProgress(20);
      const cached = isCacheValid();
      
      if (cached && (!countryCode || cached.countryCode === countryCode)) {
        setStatus("cached");
        setStoriesCount(cached.stories.length);
        setProgress(100);
        setIsPrefetching(false);
        return { stories: cached.stories, fromCache: true };
      }

      // Step 2: Fetch from database
      setStatus("fetching");
      setProgress(50);

      const stories = await fetchStories(countryCode);
      
      setProgress(80);
      
      // Step 3: Save to cache
      saveToCache(stories, countryCode);
      
      setProgress(100);
      setStatus("complete");
      setStoriesCount(stories.length);
      setIsPrefetching(false);
      
      return { stories, fromCache: false };
    } catch (err) {
      console.error("Prefetch error:", err);
      setStatus("error");
      setIsPrefetching(false);
      
      // Try to return cached data even if expired
      const cached = isCacheValid();
      if (cached) {
        return { stories: cached.stories, fromCache: true, error: String(err) };
      }
      
      return { stories: [], fromCache: false, error: String(err) };
    }
  }, [isCacheValid, fetchStories, saveToCache]);

  // Cancel prefetch
  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsPrefetching(false);
    setStatus("idle");
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    localStorage.removeItem(CACHE_KEY);
  }, []);

  // Get cache info
  const getCacheInfo = useCallback(() => {
    const cached = isCacheValid();
    if (!cached) return null;
    
    const age = Date.now() - cached.timestamp;
    const ageMinutes = Math.floor(age / 60000);
    
    return {
      count: cached.stories.length,
      ageMinutes,
      countryCode: cached.countryCode,
      isValid: age < CACHE_EXPIRY_MS,
    };
  }, [isCacheValid]);

  return {
    prefetch,
    cancel,
    clearCache,
    getCacheInfo,
    isPrefetching,
    progress,
    status,
    storiesCount,
  };
}
