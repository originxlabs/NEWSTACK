import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, ThumbsUp, ThumbsDown, Flag, Send, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, formatDistanceToNow } from "date-fns";

interface Discussion {
  id: string;
  author_name: string | null;
  message: string;
  agrees_count: number;
  disagrees_count: number;
  created_at: string;
  user_id: string | null;
}

interface DiscussionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  contentType: "news" | "place";
  contentId: string;
  contentTitle: string;
}

// Simple in-memory cache
const discussionCache = new Map<string, { data: Discussion[]; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute

export function DiscussionPanel({ isOpen, onClose, contentType, contentId, contentTitle }: DiscussionPanelProps) {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userReactions, setUserReactions] = useState<Record<string, "agree" | "disagree">>({});
  const { user, profile } = useAuth();

  const cacheKey = `${contentType}-${contentId}`;

  const fetchDiscussions = async (useCache = true) => {
    // Check cache first
    if (useCache) {
      const cached = discussionCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setDiscussions(cached.data);
        return;
      }
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("discussions")
        .select("*")
        .eq("content_type", contentType)
        .eq("content_id", contentId)
        .eq("is_hidden", false)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      const fetchedDiscussions = (data || []) as Discussion[];
      setDiscussions(fetchedDiscussions);
      
      // Update cache
      discussionCache.set(cacheKey, {
        data: fetchedDiscussions,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error("Failed to fetch discussions:", err);
      toast.error("Failed to load discussions");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDiscussions();
    }
  }, [isOpen, contentType, contentId]);

  const handleSubmit = async () => {
    if (!newMessage.trim()) return;
    if (newMessage.length > 500) {
      toast.error("Message too long. Keep it under 500 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const authorName = user ? (profile?.display_name || user.email?.split("@")[0] || "User") : "Anonymous";

      const { error } = await supabase.from("discussions").insert({
        content_type: contentType,
        content_id: contentId,
        user_id: user?.id || null,
        author_name: authorName,
        message: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage("");
      toast.success("Your opinion has been shared!");
      
      // Invalidate cache and refetch
      discussionCache.delete(cacheKey);
      fetchDiscussions(false);
    } catch (err) {
      console.error("Failed to post discussion:", err);
      toast.error("Failed to post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReaction = async (discussionId: string, type: "agree" | "disagree") => {
    const currentReaction = userReactions[discussionId];
    
    // If same reaction, remove it
    if (currentReaction === type) {
      setUserReactions((prev) => {
        const next = { ...prev };
        delete next[discussionId];
        return next;
      });
      return;
    }

    // Set new reaction
    setUserReactions((prev) => ({ ...prev, [discussionId]: type }));

    // Update counts optimistically
    setDiscussions((prev) =>
      prev.map((d) => {
        if (d.id !== discussionId) return d;
        
        let agrees = d.agrees_count;
        let disagrees = d.disagrees_count;

        // Remove previous reaction
        if (currentReaction === "agree") agrees--;
        if (currentReaction === "disagree") disagrees--;

        // Add new reaction
        if (type === "agree") agrees++;
        if (type === "disagree") disagrees++;

        return { ...d, agrees_count: agrees, disagrees_count: disagrees };
      })
    );
  };

  const handleReport = async (discussionId: string) => {
    try {
      await supabase
        .from("discussions")
        .update({ reported_count: supabase.rpc ? 1 : 1 })
        .eq("id", discussionId);
      
      toast.success("Reported. We'll review this message.");
    } catch {
      toast.error("Failed to report");
    }
  };

  const formatTimestamp = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60);

    if (diffHours < 24) {
      return `Today at ${format(d, "h:mm a")}`;
    } else if (diffHours < 48) {
      return `Yesterday at ${format(d, "h:mm a")}`;
    } else {
      return formatDistanceToNow(d, { addSuffix: true });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Open Discussion
          </SheetTitle>
          <p className="text-sm text-muted-foreground line-clamp-1">{contentTitle}</p>
        </SheetHeader>

        {/* New Message Input */}
        <div className="mb-6">
          <Textarea
            placeholder="Share your opinion or ask a question…"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="min-h-[80px] resize-none"
            maxLength={500}
          />
          <div className="flex items-center justify-between mt-2">
            <span className={`text-xs ${newMessage.length > 450 ? "text-destructive" : "text-muted-foreground"}`}>
              {newMessage.length}/500
            </span>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!newMessage.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Share
            </Button>
          </div>
        </div>

        {/* Discussion Count */}
        <div className="flex items-center justify-between mb-4">
          <Badge variant="secondary">
            {discussions.length} {discussions.length === 1 ? "opinion" : "opinions"}
          </Badge>
        </div>

        {/* Discussions List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : discussions.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground">No discussions yet</p>
            <p className="text-sm text-muted-foreground">Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {discussions.map((discussion) => (
                <motion.div
                  key={discussion.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="glass-card rounded-xl p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="font-medium text-sm">
                        {discussion.author_name || "Anonymous"}
                      </span>
                      {discussion.user_id && (
                        <Badge variant="outline" className="ml-2 text-[10px]">
                          Verified
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(discussion.created_at)}
                    </span>
                  </div>

                  <p className="text-sm mb-3 whitespace-pre-wrap">{discussion.message}</p>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-8 px-2 ${userReactions[discussion.id] === "agree" ? "text-green-500 bg-green-500/10" : ""}`}
                      onClick={() => handleReaction(discussion.id, "agree")}
                    >
                      <ThumbsUp className="h-3.5 w-3.5 mr-1" />
                      <span className="text-xs">{discussion.agrees_count}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-8 px-2 ${userReactions[discussion.id] === "disagree" ? "text-red-500 bg-red-500/10" : ""}`}
                      onClick={() => handleReaction(discussion.id, "disagree")}
                    >
                      <ThumbsDown className="h-3.5 w-3.5 mr-1" />
                      <span className="text-xs">{discussion.disagrees_count}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 ml-auto text-muted-foreground hover:text-destructive"
                      onClick={() => handleReport(discussion.id)}
                    >
                      <Flag className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
