import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Rss,
  ExternalLink,
  Globe,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface RssFeed {
  id: string;
  name: string;
  url: string;
  language: string | null;
  last_fetched_at: string | null;
  is_active: boolean;
  category: string | null;
}

interface ActiveFeedsPanelProps {
  state?: string;
  className?: string;
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  hi: "Hindi",
  or: "Odia",
  ta: "Tamil",
  te: "Telugu",
  kn: "Kannada",
  ml: "Malayalam",
  bn: "Bengali",
  mr: "Marathi",
  gu: "Gujarati",
  pa: "Punjabi",
  as: "Assamese",
};

export function ActiveFeedsPanel({ state, className }: ActiveFeedsPanelProps) {
  const [feeds, setFeeds] = useState<RssFeed[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchFeeds = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("rss_feeds")
        .select("id, name, url, language, last_fetched_at, is_active, category")
        .eq("country_code", "IN")
        .eq("is_active", true)
        .order("last_fetched_at", { ascending: false, nullsFirst: false })
        .limit(30);

      // Filter by state if provided
      if (state) {
        const stateLower = state.toLowerCase();
        query = query.or(`name.ilike.%${stateLower}%,publisher.ilike.%${stateLower}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setFeeds((data || []) as RssFeed[]);
    } catch (err) {
      console.error("Failed to fetch feeds:", err);
    } finally {
      setIsLoading(false);
    }
  }, [state]);

  useEffect(() => {
    fetchFeeds();
  }, [fetchFeeds]);

  const languageGroups = feeds.reduce((acc, feed) => {
    const lang = feed.language || "en";
    if (!acc[lang]) acc[lang] = [];
    acc[lang].push(feed);
    return acc;
  }, {} as Record<string, RssFeed[]>);

  if (feeds.length === 0 && !isLoading) return null;

  return (
    <Card className={cn("border-border/50", className)}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
                <Rss className="w-3 h-3 sm:w-4 sm:h-4" />
                Active RSS Feeds
                <Badge variant="outline" className="text-[9px] sm:text-[10px] ml-1">
                  {feeds.length} sources
                </Badge>
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-5 w-5 sm:h-6 sm:w-6">
                {isExpanded ? <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" /> : <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />}
              </Button>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 pb-3 sm:pb-4 px-3 sm:px-4">
            <div className="space-y-3">
              {Object.entries(languageGroups).map(([lang, langFeeds]) => (
                <div key={lang}>
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] sm:text-xs font-medium">
                      {LANGUAGE_NAMES[lang] || lang.toUpperCase()} ({langFeeds.length})
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {langFeeds.slice(0, 6).map((feed) => (
                      <a
                        key={feed.id}
                        href={feed.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-1.5 sm:p-2 rounded-md hover:bg-muted/50 text-[10px] sm:text-xs group"
                      >
                        <span className="truncate flex-1 font-medium">{feed.name}</span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {feed.last_fetched_at && (
                            <span className="text-muted-foreground hidden sm:inline">
                              {formatDistanceToNow(new Date(feed.last_fetched_at), { addSuffix: true })}
                            </span>
                          )}
                          <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
