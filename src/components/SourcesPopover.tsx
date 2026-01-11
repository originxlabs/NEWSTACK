import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ExternalLink, CheckCircle2, AlertCircle, Clock, 
  Newspaper, ChevronDown 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, parseISO } from "date-fns";

// Verified sources list (same as other components)
const VERIFIED_SOURCES = [
  "Reuters", "AP News", "Associated Press", "BBC", "The Guardian", 
  "New York Times", "Washington Post", "Bloomberg", "NDTV", 
  "The Hindu", "Times of India", "Hindustan Times", "India Today",
  "CNN", "Al Jazeera", "Financial Times", "The Economist",
  "Wall Street Journal", "Forbes", "TechCrunch", "The Verge",
  "LiveMint", "Economic Times", "Business Standard", "Mint",
  "ESPN", "Sky Sports", "NBC News", "CBS News", "ABC News",
  "Google News", "AFP"
];

interface StorySource {
  id: string;
  source_name: string;
  source_url: string;
  published_at: string;
  description: string | null;
}

interface SourcesPopoverProps {
  storyId: string;
  sourceCount: number;
  primarySource?: string;
  primarySourceUrl?: string;
}

function isVerifiedSource(sourceName: string): boolean {
  const normalizedName = sourceName.toLowerCase();
  return VERIFIED_SOURCES.some(vs => normalizedName.includes(vs.toLowerCase()));
}

export function SourcesPopover({ 
  storyId, 
  sourceCount, 
  primarySource,
  primarySourceUrl 
}: SourcesPopoverProps) {
  const [sources, setSources] = useState<StorySource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen && storyId && sources.length === 0) {
      fetchSources();
    }
  }, [isOpen, storyId]);

  const fetchSources = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("story_sources")
        .select("id, source_name, source_url, published_at, description")
        .eq("story_id", storyId)
        .order("published_at", { ascending: true });

      if (error) throw error;
      setSources(data || []);
    } catch (err) {
      console.error("Failed to fetch sources:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const verifiedCount = sources.filter(s => isVerifiedSource(s.source_name)).length;

  // If only 1 source, just show a simple clickable link
  if (sourceCount <= 1) {
    return (
      <button 
        onClick={(e) => {
          e.stopPropagation();
          if (primarySourceUrl) {
            window.open(primarySourceUrl, "_blank", "noopener,noreferrer");
          }
        }}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
      >
        <Badge variant="outline" className="text-[9px] h-4 px-1.5 gap-1">
          <Newspaper className="w-2.5 h-2.5" />
          1 source
        </Badge>
      </button>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button 
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 cursor-pointer group"
        >
          <Badge 
            variant="outline" 
            className="text-[9px] h-4 px-1.5 gap-1 hover:bg-primary/10 hover:border-primary/50 transition-all group-hover:text-primary"
          >
            <Newspaper className="w-2.5 h-2.5" />
            {sourceCount} sources
            <ChevronDown className="w-2.5 h-2.5 transition-transform group-data-[state=open]:rotate-180" />
          </Badge>
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 z-[100]" 
        align="start" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">Coverage Sources</span>
            </div>
            {!isLoading && sources.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs">
                {verifiedCount > 0 && (
                  <Badge variant="outline" className="text-[9px] h-4 px-1 gap-0.5 border-green-500/30 text-green-600 bg-green-500/5">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    {verifiedCount}
                  </Badge>
                )}
                {sources.length - verifiedCount > 0 && (
                  <Badge variant="outline" className="text-[9px] h-4 px-1 gap-0.5 border-amber-500/30 text-amber-600 bg-amber-500/5">
                    <AlertCircle className="w-2.5 h-2.5" />
                    {sources.length - verifiedCount}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        <ScrollArea className="max-h-64">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : sources.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No source details available
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {sources.map((source, index) => {
                const isVerified = isVerifiedSource(source.source_name);
                const isFirst = index === 0;

                return (
                  <motion.div
                    key={source.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Button
                      variant="ghost"
                      className={`w-full justify-start h-auto py-2 px-3 text-left ${
                        isFirst ? "bg-green-500/5" : ""
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(source.source_url, "_blank", "noopener,noreferrer");
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium text-sm truncate">
                            {source.source_name}
                          </span>
                          {isFirst && (
                            <Badge className="bg-green-500 text-white border-0 text-[8px] h-3.5 px-1">
                              First
                            </Badge>
                          )}
                          {isVerified ? (
                            <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-3 h-3 text-amber-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {formatDistanceToNow(parseISO(source.published_at), { addSuffix: true })}
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="p-2 border-t border-border bg-muted/20">
          <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
            <CheckCircle2 className="w-3 h-3 text-green-500" />
            <span>Verified = Trusted news organization</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
