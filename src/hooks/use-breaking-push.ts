import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BreakingStory {
  id: string;
  headline: string;
  summary: string | null;
  source_count: number;
  verified_source_count: number;
  first_published_at: string;
  category: string | null;
}

/**
 * Hook that listens for breaking+verified news and sends push notifications
 * A story qualifies if:
 * - Published within last 2 hours (breaking)
 * - Has 3+ verified sources
 */
export function useBreakingPush() {
  const notifiedStories = useRef<Set<string>>(new Set());

  const showPushNotification = useCallback(async (story: BreakingStory) => {
    // Don't notify the same story twice
    if (notifiedStories.current.has(story.id)) return;
    notifiedStories.current.add(story.id);

    // Check if we can show notifications
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    // Check if service worker is ready
    if (!("serviceWorker" in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      
      await registration.showNotification("🔴 Breaking News - NEWSTACK", {
        body: story.headline,
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-72x72.png",
        tag: `breaking-${story.id}`,
        requireInteraction: true,
        data: {
          url: `/news/${story.id}`,
          storyId: story.id,
        },
      });

      // Also show in-app toast
      toast.success(`🔴 Breaking: ${story.headline}`, {
        duration: 8000,
        action: {
          label: "Read",
          onClick: () => {
            window.location.href = `/news/${story.id}`;
          },
        },
      });
    } catch (err) {
      console.error("Failed to show push notification:", err);
    }
  }, []);

  const checkIfBreakingAndVerified = useCallback((story: BreakingStory): boolean => {
    // Must have 3+ verified sources
    if ((story.verified_source_count || 0) < 3) return false;

    // Must be published within last 2 hours (breaking)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const publishedAt = new Date(story.first_published_at);
    if (publishedAt < twoHoursAgo) return false;

    return true;
  }, []);

  useEffect(() => {
    // Subscribe to new stories with realtime
    const channel = supabase
      .channel("breaking-verified-push")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "stories",
        },
        (payload) => {
          const story = payload.new as BreakingStory;
          console.log("New story received:", story.headline);

          if (checkIfBreakingAndVerified(story)) {
            console.log("Story qualifies for breaking+verified push:", story.headline);
            showPushNotification(story);
          }
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
          const story = payload.new as BreakingStory;
          
          // Check if this update made it qualify (e.g., source count increased)
          if (checkIfBreakingAndVerified(story) && !notifiedStories.current.has(story.id)) {
            console.log("Updated story now qualifies for breaking+verified push:", story.headline);
            showPushNotification(story);
          }
        }
      )
      .subscribe((status) => {
        console.log("Breaking+verified push subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [checkIfBreakingAndVerified, showPushNotification]);
}
