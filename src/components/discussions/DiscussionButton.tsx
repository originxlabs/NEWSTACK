import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DiscussionPanel } from "./DiscussionPanel";
import { supabase } from "@/integrations/supabase/client";

interface DiscussionButtonProps {
  contentType: "news" | "place";
  contentId: string;
  contentTitle: string;
  variant?: "default" | "compact";
}

// Cache for discussion counts
const countCache = new Map<string, { count: number; timestamp: number }>();
const COUNT_CACHE_TTL = 120000; // 2 minutes

export function DiscussionButton({ contentType, contentId, contentTitle, variant = "default" }: DiscussionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      const cacheKey = `${contentType}-${contentId}`;
      const cached = countCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < COUNT_CACHE_TTL) {
        setCount(cached.count);
        return;
      }

      try {
        const { count: discussionCount, error } = await supabase
          .from("discussions")
          .select("*", { count: "exact", head: true })
          .eq("content_type", contentType)
          .eq("content_id", contentId)
          .eq("is_hidden", false);

        if (!error && discussionCount !== null) {
          setCount(discussionCount);
          countCache.set(cacheKey, { count: discussionCount, timestamp: Date.now() });
        }
      } catch (err) {
        console.error("Failed to fetch discussion count:", err);
      }
    };

    fetchCount();
  }, [contentType, contentId]);

  if (variant === "compact") {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          {count > 0 && <span>{count}</span>}
        </button>
        <DiscussionPanel
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          contentType={contentType}
          contentId={contentId}
          contentTitle={contentTitle}
        />
      </>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <MessageCircle className="h-4 w-4" />
        Discussion
        {count > 0 && (
          <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
            {count}
          </Badge>
        )}
      </Button>
      <DiscussionPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        contentType={contentType}
        contentId={contentId}
        contentTitle={contentTitle}
      />
    </>
  );
}
