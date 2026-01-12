import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePreferences } from "@/contexts/PreferencesContext";

interface ReadingPattern {
  categories: Record<string, number>;
  states: Record<string, number>;
  languages: Record<string, number>;
  sources: Record<string, number>;
  timeOfDay: Record<string, number>; // morning, afternoon, evening, night
  lastReadIds: string[];
}

interface PersonalizedItem {
  id: string;
  score: number;
  reasons: string[];
}

const STORAGE_KEY = "user-reading-patterns";
const MAX_HISTORY = 100;

// Get time of day bucket
function getTimeOfDayBucket(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

// Load patterns from localStorage
function loadPatterns(): ReadingPattern {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error loading reading patterns:", e);
  }
  
  return {
    categories: {},
    states: {},
    languages: {},
    sources: {},
    timeOfDay: {},
    lastReadIds: [],
  };
}

// Save patterns to localStorage
function savePatterns(patterns: ReadingPattern) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patterns));
  } catch (e) {
    console.error("Error saving reading patterns:", e);
  }
}

export function usePersonalizedFeed() {
  const { user } = useAuth();
  const { country, language } = usePreferences();
  const [patterns, setPatterns] = useState<ReadingPattern>(loadPatterns);

  // Track when user reads a story
  const trackRead = useCallback((story: {
    id: string;
    category?: string | null;
    state?: string | null;
    original_language?: string | null;
    source?: string;
  }) => {
    setPatterns(prev => {
      const newPatterns = { ...prev };
      
      // Update category preference
      if (story.category) {
        newPatterns.categories[story.category] = (newPatterns.categories[story.category] || 0) + 1;
      }
      
      // Update state preference
      if (story.state) {
        newPatterns.states[story.state] = (newPatterns.states[story.state] || 0) + 1;
      }
      
      // Update language preference
      if (story.original_language) {
        newPatterns.languages[story.original_language] = (newPatterns.languages[story.original_language] || 0) + 1;
      }
      
      // Update source preference
      if (story.source) {
        newPatterns.sources[story.source] = (newPatterns.sources[story.source] || 0) + 1;
      }
      
      // Update time of day preference
      const timeOfDay = getTimeOfDayBucket();
      newPatterns.timeOfDay[timeOfDay] = (newPatterns.timeOfDay[timeOfDay] || 0) + 1;
      
      // Track read IDs to avoid showing same stories
      newPatterns.lastReadIds = [story.id, ...newPatterns.lastReadIds.slice(0, MAX_HISTORY - 1)];
      
      // Persist
      savePatterns(newPatterns);
      
      return newPatterns;
    });
  }, []);

  // Calculate personalization score for a story
  const calculateScore = useCallback((story: {
    id: string;
    category?: string | null;
    state?: string | null;
    original_language?: string | null;
    source?: string;
    source_count?: number;
    first_published_at?: string;
  }): PersonalizedItem => {
    let score = 0;
    const reasons: string[] = [];
    
    // Don't show already-read stories
    if (patterns.lastReadIds.includes(story.id)) {
      return { id: story.id, score: -1000, reasons: ["Already read"] };
    }
    
    // Category match (max 30 points)
    if (story.category && patterns.categories[story.category]) {
      const categoryScore = Math.min(patterns.categories[story.category] * 5, 30);
      score += categoryScore;
      if (categoryScore > 10) {
        reasons.push(`You often read ${story.category}`);
      }
    }
    
    // State match (max 25 points)
    if (story.state && patterns.states[story.state]) {
      const stateScore = Math.min(patterns.states[story.state] * 5, 25);
      score += stateScore;
      if (stateScore > 10) {
        reasons.push(`From ${story.state}`);
      }
    }
    
    // Language match (max 20 points)
    if (story.original_language && patterns.languages[story.original_language]) {
      const langScore = Math.min(patterns.languages[story.original_language] * 3, 20);
      score += langScore;
    }
    
    // Source trustworthiness (max 15 points)
    if (story.source_count && story.source_count >= 3) {
      score += 15;
      reasons.push("Verified by multiple sources");
    } else if (story.source_count && story.source_count >= 2) {
      score += 8;
    }
    
    // Recency bonus (max 10 points)
    if (story.first_published_at) {
      const ageHours = (Date.now() - new Date(story.first_published_at).getTime()) / (1000 * 60 * 60);
      if (ageHours < 2) {
        score += 10;
        reasons.push("Just published");
      } else if (ageHours < 6) {
        score += 7;
      } else if (ageHours < 24) {
        score += 4;
      }
    }
    
    // Time of day relevance (max 5 points)
    const currentTime = getTimeOfDayBucket();
    if (patterns.timeOfDay[currentTime] && patterns.timeOfDay[currentTime] > 5) {
      score += 5;
    }
    
    // User preferences boost
    if (country?.code === "IN" && story.state) {
      score += 5; // Boost local India news for Indian users
    }
    
    return { id: story.id, score, reasons };
  }, [patterns, country]);

  // Sort stories by personalization score
  const personalizeStories = useCallback(<T extends { 
    id: string;
    category?: string | null;
    state?: string | null;
    original_language?: string | null;
    source?: string;
    source_count?: number;
    first_published_at?: string;
  }>(stories: T[]): T[] => {
    const scored = stories.map(story => ({
      story,
      ...calculateScore(story),
    }));
    
    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);
    
    return scored.map(s => s.story);
  }, [calculateScore]);

  // Get top categories for user
  const topCategories = useMemo(() => {
    return Object.entries(patterns.categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat]) => cat);
  }, [patterns.categories]);

  // Get top states for user
  const topStates = useMemo(() => {
    return Object.entries(patterns.states)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([state]) => state);
  }, [patterns.states]);

  // Get recommendation reasons for a story
  const getReasons = useCallback((story: Parameters<typeof calculateScore>[0]) => {
    return calculateScore(story).reasons;
  }, [calculateScore]);

  // Clear reading history
  const clearHistory = useCallback(() => {
    setPatterns({
      categories: {},
      states: {},
      languages: {},
      sources: {},
      timeOfDay: {},
      lastReadIds: [],
    });
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    trackRead,
    personalizeStories,
    calculateScore,
    getReasons,
    topCategories,
    topStates,
    patterns,
    clearHistory,
  };
}
