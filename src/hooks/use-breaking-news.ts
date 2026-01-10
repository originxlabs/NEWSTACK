import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BreakingNewsItem {
  id: string;
  headline: string;
  summary: string | null;
  source_name: string | null;
  source_url: string | null;
  topic_slug: string | null;
  created_at: string;
}

export function useBreakingNewsNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [latestBreaking, setLatestBreaking] = useState<BreakingNewsItem | null>(null);

  // Check if notifications are supported
  useEffect(() => {
    if ("Notification" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === "granted") {
        toast.success("Breaking news notifications enabled!");
        return true;
      } else if (result === "denied") {
        toast.error("Notifications blocked. Enable them in browser settings.");
        return false;
      }
      return false;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }, [isSupported]);

  // Show native browser notification
  const showNotification = useCallback((news: BreakingNewsItem) => {
    if (!isSupported || permission !== "granted") return;

    try {
      const notification = new Notification("🔴 NEWSTACK Breaking News", {
        body: news.headline,
        icon: "/logo.svg",
        badge: "/logo.svg",
        tag: `breaking-${news.id}`,
        requireInteraction: true,
        silent: false,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        // Could navigate to the story here
      };

      // Auto-close after 10 seconds
      setTimeout(() => notification.close(), 10000);
    } catch (error) {
      console.error("Error showing notification:", error);
    }
  }, [isSupported, permission]);

  // Subscribe to realtime breaking news
  useEffect(() => {
    const channel = supabase
      .channel("breaking-news-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "breaking_news",
        },
        (payload) => {
          const news = payload.new as BreakingNewsItem;
          console.log("New breaking news received:", news.headline);
          
          setLatestBreaking(news);

          // Show browser notification if permitted
          if (permission === "granted") {
            showNotification(news);
          }

          // Always show in-app toast
          toast.error(`🔴 Breaking: ${news.headline}`, {
            duration: 8000,
            action: news.source_url ? {
              label: "Read More",
              onClick: () => window.open(news.source_url!, "_blank"),
            } : undefined,
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "breaking_news",
          filter: "is_active=eq.true",
        },
        (payload) => {
          const news = payload.new as BreakingNewsItem;
          setLatestBreaking(news);
        }
      )
      .subscribe((status) => {
        console.log("Breaking news subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [permission, showNotification]);

  return {
    isSupported,
    permission,
    requestPermission,
    latestBreaking,
  };
}
