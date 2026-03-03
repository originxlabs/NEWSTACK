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
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let sourcesChannel: ReturnType<typeof supabase.channel> | null = null;
    let retryCount = 0;
    const maxRetries = 3;

    const setupChannel = () => {
      // Subscribe to stories table changes
      channel = supabase
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
          if (status === "SUBSCRIBED") {
            console.log("[Realtime] Connected successfully");
            retryCount = 0;
            setStats(prev => ({ ...prev, isConnected: true }));
          } else if (status === "CHANNEL_ERROR") {
            console.warn("[Realtime] Channel error, will retry...");
            setStats(prev => ({ ...prev, isConnected: false }));
            
            // Retry with exponential backoff
            if (retryCount < maxRetries) {
              retryCount++;
              setTimeout(() => {
                if (channel) supabase.removeChannel(channel);
                setupChannel();
              }, Math.min(1000 * Math.pow(2, retryCount), 10000));
            }
          } else if (status === "CLOSED") {
            setStats(prev => ({ ...prev, isConnected: false }));
          }
        });

      // Also subscribe to story_sources for trust panel updates
      sourcesChannel = supabase
        .channel("sources-realtime")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "story_sources",
          },
          () => {
            // Trust panel will auto-refresh
          }
        )
        .subscribe();
    };

    setupChannel();

    return () => {
      if (channel) supabase.removeChannel(channel);
      if (sourcesChannel) supabase.removeChannel(sourcesChannel);
    };
  }, [queryClient]);

  return {
    ...stats,
    refresh,
    resetNewCount,
  };
}
