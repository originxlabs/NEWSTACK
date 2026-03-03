import { useState, useEffect, useCallback } from "react";

const LAST_VIEWED_KEY = "newstack_last_viewed";
const STORY_STATES_KEY = "newstack_story_states";

interface LastViewedData {
  [storyId: string]: {
    viewedAt: string;
    headline: string;
    sourceCount: number;
    signal: string;
  };
}

interface StoryState {
  headline: string;
  sourceCount: number;
  signal: string;
  updatedAt: string;
}

interface StoryUpdate {
  storyId: string;
  type: "new_sources" | "signal_change" | "headline_update";
  previousValue: string | number;
  currentValue: string | number;
  message: string;
}

export function useLastViewed() {
  const [lastViewedData, setLastViewedData] = useState<LastViewedData>({});
  const [storyUpdates, setStoryUpdates] = useState<StoryUpdate[]>([]);

  // Load last viewed data on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LAST_VIEWED_KEY);
      if (stored) {
        setLastViewedData(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading last viewed data:", error);
    }
  }, []);

  // Mark a story as viewed
  const markAsViewed = useCallback((storyId: string, data: {
    headline: string;
    sourceCount: number;
    signal: string;
  }) => {
    setLastViewedData(prev => {
      const updated = {
        ...prev,
        [storyId]: {
          ...data,
          viewedAt: new Date().toISOString(),
        },
      };
      
      try {
        localStorage.setItem(LAST_VIEWED_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error("Error saving last viewed data:", error);
      }
      
      return updated;
    });
  }, []);

  // Check if story was viewed before
  const wasViewed = useCallback((storyId: string): boolean => {
    return !!lastViewedData[storyId];
  }, [lastViewedData]);

  // Get last viewed time for a story
  const getLastViewedAt = useCallback((storyId: string): Date | null => {
    const data = lastViewedData[storyId];
    return data ? new Date(data.viewedAt) : null;
  }, [lastViewedData]);

  // Check for updates since last view
  const checkForUpdates = useCallback((storyId: string, currentData: {
    headline: string;
    sourceCount: number;
    signal: string;
  }): StoryUpdate[] => {
    const previous = lastViewedData[storyId];
    if (!previous) return [];

    const updates: StoryUpdate[] = [];

    // Check for new sources
    if (currentData.sourceCount > previous.sourceCount) {
      updates.push({
        storyId,
        type: "new_sources",
        previousValue: previous.sourceCount,
        currentValue: currentData.sourceCount,
        message: `+${currentData.sourceCount - previous.sourceCount} new sources since you last viewed`,
      });
    }

    // Check for signal change
    if (currentData.signal !== previous.signal) {
      updates.push({
        storyId,
        type: "signal_change",
        previousValue: previous.signal,
        currentValue: currentData.signal,
        message: `Status changed: ${previous.signal} → ${currentData.signal}`,
      });
    }

    return updates;
  }, [lastViewedData]);

  // Get all stories with updates
  const getStoriesWithUpdates = useCallback((currentStories: Array<{
    id: string;
    headline: string;
    sourceCount: number;
    signal: string;
  }>): Map<string, StoryUpdate[]> => {
    const updatesMap = new Map<string, StoryUpdate[]>();
    
    currentStories.forEach(story => {
      const updates = checkForUpdates(story.id, {
        headline: story.headline,
        sourceCount: story.sourceCount,
        signal: story.signal,
      });
      
      if (updates.length > 0) {
        updatesMap.set(story.id, updates);
      }
    });
    
    return updatesMap;
  }, [checkForUpdates]);

  // Clear all viewing history
  const clearHistory = useCallback(() => {
    localStorage.removeItem(LAST_VIEWED_KEY);
    setLastViewedData({});
  }, []);

  // Get last session time (when user last visited)
  const getLastSessionTime = useCallback((): Date | null => {
    const times = Object.values(lastViewedData).map(d => new Date(d.viewedAt));
    if (times.length === 0) return null;
    return new Date(Math.max(...times.map(t => t.getTime())));
  }, [lastViewedData]);

  return {
    markAsViewed,
    wasViewed,
    getLastViewedAt,
    checkForUpdates,
    getStoriesWithUpdates,
    clearHistory,
    getLastSessionTime,
    lastViewedData,
  };
}
