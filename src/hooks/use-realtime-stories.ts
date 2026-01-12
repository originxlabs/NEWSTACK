import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface RealtimeStats {
  newStories: number;
  lastUpdate: Date | null;
  isConnected: boolean;
}

export function useRealtimeStories() {
  const queryClient = useQueryClient();
  const [stats, setStats] = useState<RealtimeStats>({
    newStories: 0,
    lastUpdate: null,
    isConnected: false,
  });

  const resetNewCount = useCallback(() => {
    setStats(prev => ({ ...prev, newStories: 0 }));
  }, []);

  const refresh = useCallback(() => {
    // Invalidate all news-related queries to refetch
    queryClient.invalidateQueries({ queryKey: ["news"] });
    queryClient.invalidateQueries({ queryKey: ["infinite-news"] });
    queryClient.invalidateQueries({ queryKey: ["world-stats"] });
    resetNewCount();
  }, [queryClient, resetNewCount]);

  useEffect(() => {
    // Subscribe to stories table changes
    const channel = supabase
      .channel("stories-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "stories",
        },
        (payload) => {
          console.log("[Realtime] New story inserted:", payload.new);
          setStats(prev => ({
            ...prev,
            newStories: prev.newStories + 1,
            lastUpdate: new Date(),
          }));
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "stories",
        },
        (payload) => {
          console.log("[Realtime] Story updated:", payload.new);
          setStats(prev => ({
            ...prev,
            lastUpdate: new Date(),
          }));
          // Auto-refresh queries on update
          queryClient.invalidateQueries({ queryKey: ["news"] });
          queryClient.invalidateQueries({ queryKey: ["infinite-news"] });
        }
      )
      .subscribe((status) => {
        console.log("[Realtime] Subscription status:", status);
        setStats(prev => ({
          ...prev,
          isConnected: status === "SUBSCRIBED",
        }));
      });

    // Also subscribe to story_sources for trust panel updates
    const sourcesChannel = supabase
      .channel("sources-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "story_sources",
        },
        (payload) => {
          console.log("[Realtime] Source change:", payload.eventType);
          // Trust panel will auto-refresh
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(sourcesChannel);
    };
  }, [queryClient]);

  return {
    ...stats,
    refresh,
    resetNewCount,
  };
}
