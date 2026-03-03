import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, X, ExternalLink, Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useBreakingNewsNotifications } from "@/hooks/use-breaking-news";

interface BreakingNews {
  id: string;
  headline: string;
  summary: string | null;
  source_name: string | null;
  source_url: string | null;
  topic_slug: string | null;
  created_at: string;
  is_active?: boolean;
}

export function BreakingNewsBanner() {
  const [breakingNews, setBreakingNews] = useState<BreakingNews | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const { isSupported, permission, requestPermission } = useBreakingNewsNotifications();

  useEffect(() => {
    // Fetch current breaking news
    const fetchBreakingNews = async () => {
      const { data } = await supabase
        .from("breaking_news")
        .select("*")
        .eq("is_active", true)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && !dismissed.has(data.id)) {
        setBreakingNews(data);
      }
    };

    fetchBreakingNews();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("breaking-news-banner")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "breaking_news",
        },
        (payload) => {
          const news = payload.new as BreakingNews;
          if (!dismissed.has(news.id)) {
            setBreakingNews(news);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "breaking_news",
        },
        (payload) => {
          const news = payload.new as BreakingNews;
          if (news.is_active && !dismissed.has(news.id)) {
            setBreakingNews(news);
          } else if (!news.is_active && breakingNews?.id === news.id) {
            setBreakingNews(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dismissed, breakingNews?.id]);

  const handleDismiss = () => {
    if (breakingNews) {
      setDismissed((prev) => new Set(prev).add(breakingNews.id));
      setBreakingNews(null);
    }
  };

  const handleEnableNotifications = async () => {
    await requestPermission();
  };

  if (!breakingNews) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="bg-destructive text-destructive-foreground overflow-hidden"
      >
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="shrink-0"
              >
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
              </motion.div>
              <span className="font-semibold text-xs sm:text-sm uppercase tracking-wider shrink-0">
                Breaking
              </span>
              <span className="truncate text-xs sm:text-sm font-medium">
                {breakingNews.headline}
              </span>
              {breakingNews.source_url && (
                <a
                  href={breakingNews.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 hover:opacity-80 transition-opacity hidden sm:block"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
            
            <div className="flex items-center gap-1 shrink-0">
              {/* Enable notifications button */}
              {isSupported && permission !== "granted" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 hover:bg-destructive-foreground/20 hidden sm:flex"
                  onClick={handleEnableNotifications}
                  title="Enable breaking news notifications"
                >
                  <Bell className="h-3 w-3" />
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 hover:bg-destructive-foreground/20"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
