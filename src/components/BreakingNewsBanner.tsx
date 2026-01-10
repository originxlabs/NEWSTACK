import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface BreakingNews {
  id: string;
  headline: string;
  summary: string | null;
  source_name: string | null;
  source_url: string | null;
  topic_slug: string | null;
  created_at: string;
}

export function BreakingNewsBanner() {
  const [breakingNews, setBreakingNews] = useState<BreakingNews | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

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
      .channel("breaking-news")
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dismissed]);

  const handleDismiss = () => {
    if (breakingNews) {
      setDismissed((prev) => new Set(prev).add(breakingNews.id));
      setBreakingNews(null);
    }
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
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <AlertCircle className="h-5 w-5 shrink-0" />
              </motion.div>
              <span className="font-semibold text-sm uppercase tracking-wider shrink-0">
                Breaking
              </span>
              <span className="truncate text-sm font-medium">
                {breakingNews.headline}
              </span>
              {breakingNews.source_url && (
                <a
                  href={breakingNews.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 hover:opacity-80 transition-opacity"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
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
      </motion.div>
    </AnimatePresence>
  );
}