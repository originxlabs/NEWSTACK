import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Clock, ExternalLink, Newspaper, TrendingUp, 
  ChevronDown, ChevronUp, Radio, Calendar, Building2,
  CheckCircle2, AlertCircle, Link as LinkIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

// List of known verified/trusted sources
const VERIFIED_SOURCES = [
  "Reuters", "AP News", "Associated Press", "BBC", "The Guardian", 
  "New York Times", "Washington Post", "Bloomberg", "NDTV", 
  "The Hindu", "Times of India", "Hindustan Times", "India Today",
  "CNN", "Al Jazeera", "Financial Times", "The Economist",
  "Wall Street Journal", "Forbes", "TechCrunch", "The Verge",
  "LiveMint", "Economic Times", "Business Standard", "Mint",
  "ESPN", "Sky Sports", "NBC News", "CBS News", "ABC News",
  "Google News"
];

interface StorySource {
  id: string;
  source_name: string;
  source_url: string;
  published_at: string;
  description: string | null;
}

interface StoryTimelineProps {
  storyId: string;
  headline: string;
  isOpen: boolean;
  onClose: () => void;
}

// Check if a source is verified
function isVerifiedSource(sourceName: string): boolean {
  const normalizedName = sourceName.toLowerCase();
  return VERIFIED_SOURCES.some(vs => normalizedName.includes(vs.toLowerCase()));
}

export function StoryTimeline({ storyId, headline, isOpen, onClose }: StoryTimelineProps) {
  const [sources, setSources] = useState<StorySource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSource, setExpandedSource] = useState<string | null>(null);
  const [storyDetails, setStoryDetails] = useState<{
    first_published_at: string;
    last_updated_at: string;
    source_count: number;
    category: string | null;
  } | null>(null);

  useEffect(() => {
    if (isOpen && storyId) {
      fetchStoryTimeline();
    }
  }, [isOpen, storyId]);

  async function fetchStoryTimeline() {
    setIsLoading(true);
    try {
      // Fetch story details
      const { data: story } = await supabase
        .from("stories")
        .select("first_published_at, last_updated_at, source_count, category")
        .eq("id", storyId)
        .maybeSingle();

      if (story) {
        setStoryDetails(story);
      } else {
        setStoryDetails({
          first_published_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          last_updated_at: new Date().toISOString(),
          source_count: 1,
          category: "News",
        });
      }

      // Fetch ALL sources for this story ordered by published_at (earliest first)
      const { data: sourcesData, error } = await supabase
        .from("story_sources")
        .select("*")
        .eq("story_id", storyId)
        .order("published_at", { ascending: true });

      if (error) {
        console.error("Error fetching sources:", error);
      }

      if (sourcesData && sourcesData.length > 0) {
        setSources(sourcesData);
      } else {
        // If no sources in story_sources, we still have at least the primary source
        setSources([]);
      }
    } catch (error) {
      console.error("Error fetching story timeline:", error);
      setStoryDetails({
        first_published_at: new Date().toISOString(),
        last_updated_at: new Date().toISOString(),
        source_count: 1,
        category: null,
      });
      setSources([]);
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen) return null;

  const totalDuration = sources.length > 1 
    ? Math.abs(
        new Date(sources[sources.length - 1].published_at).getTime() - 
        new Date(sources[0].published_at).getTime()
      ) / (1000 * 60 * 60)
    : 0;

  const verifiedCount = sources.filter(s => isVerifiedSource(s.source_name)).length;
  const unverifiedCount = sources.length - verifiedCount;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25 }}
          className="bg-card border border-border rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Radio className="w-4 h-4 text-primary" />
                  </motion.div>
                  <span className="text-sm font-medium text-primary">Publication Timeline</span>
                  {storyDetails?.category && (
                    <Badge variant="secondary" className="text-xs">
                      {storyDetails.category}
                    </Badge>
                  )}
                </div>
                <h2 className="text-lg font-semibold text-foreground line-clamp-2">
                  {headline}
                </h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Stats Bar */}
            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground flex-wrap">
              <div className="flex items-center gap-1.5">
                <Newspaper className="w-4 h-4" />
                <span>{sources.length} source{sources.length !== 1 ? 's' : ''} found</span>
              </div>
              {verifiedCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-green-600">{verifiedCount} verified</span>
                </div>
              )}
              {unverifiedCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span className="text-amber-600">{unverifiedCount} unverified</span>
                </div>
              )}
              {storyDetails && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Started {formatDistanceToNow(parseISO(storyDetails.first_published_at), { addSuffix: true })}
                  </span>
                </div>
              )}
              {totalDuration > 0 && (
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span>{totalDuration.toFixed(1)}h coverage span</span>
                </div>
              )}
            </div>
          </div>

          {/* Timeline Content */}
          <ScrollArea className="h-[500px]">
            <div className="p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <motion.div
                    className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                </div>
              ) : sources.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-amber-500" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Limited Source Data</h3>
                  <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-4">
                    Detailed timeline data is not yet available for this story. 
                    Our system is continuously indexing sources.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    The story was originally published{" "}
                    {storyDetails && formatDistanceToNow(parseISO(storyDetails.first_published_at), { addSuffix: true })}
                  </p>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline Line */}
                  <div className="absolute left-[19px] top-8 bottom-8 w-0.5 bg-gradient-to-b from-green-500 via-primary/30 to-amber-500/30" />

                  {/* Timeline Items */}
                  <div className="space-y-6">
                    {sources.map((source, index) => {
                      const isFirst = index === 0;
                      const isLast = index === sources.length - 1;
                      const isExpanded = expandedSource === source.id;
                      const publishedDate = parseISO(source.published_at);
                      const isVerified = isVerifiedSource(source.source_name);

                      return (
                        <motion.div
                          key={source.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="relative pl-12"
                        >
                          {/* Timeline Node */}
                          <motion.div
                            className={`absolute left-0 w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                              isFirst 
                                ? "bg-green-500 border-green-500 text-white" 
                                : isVerified
                                ? "bg-green-500/10 border-green-500 text-green-600"
                                : "bg-amber-500/10 border-amber-500 text-amber-600"
                            }`}
                            whileHover={{ scale: 1.1 }}
                          >
                            {isFirst ? (
                              <Radio className="w-4 h-4" />
                            ) : isVerified ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <Building2 className="w-4 h-4" />
                            )}
                          </motion.div>

                          {/* Content Card */}
                          <motion.div
                            className={`p-4 rounded-lg border ${
                              isFirst 
                                ? "bg-green-500/5 border-green-500/20" 
                                : isVerified
                                ? "bg-card border-green-500/20"
                                : "bg-card border-amber-500/20"
                            } cursor-pointer transition-all hover:shadow-md`}
                            onClick={() => setExpandedSource(isExpanded ? null : source.id)}
                            whileHover={{ scale: 1.01 }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="font-medium text-foreground">
                                    {source.source_name}
                                  </span>
                                  {isFirst && (
                                    <Badge className="bg-green-500 text-white border-0 text-xs">
                                      🏆 First Report
                                    </Badge>
                                  )}
                                  {isVerified ? (
                                    <Badge variant="outline" className="text-xs border-green-500/50 text-green-600 bg-green-500/5">
                                      <CheckCircle2 className="w-3 h-3 mr-1" />
                                      Verified
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-600 bg-amber-500/5">
                                      <AlertCircle className="w-3 h-3 mr-1" />
                                      Unverified
                                    </Badge>
                                  )}
                                  {isLast && sources.length > 1 && (
                                    <Badge variant="secondary" className="text-xs">
                                      Latest
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  <span>{format(publishedDate, "MMM d, yyyy 'at' h:mm a")}</span>
                                  <span className="text-primary">
                                    ({formatDistanceToNow(publishedDate, { addSuffix: true })})
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 gap-1.5 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(source.source_url, '_blank', 'noopener,noreferrer');
                                  }}
                                >
                                  <LinkIcon className="w-3 h-3" />
                                  Visit
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
                                {source.description && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                  >
                                    {isExpanded ? (
                                      <ChevronUp className="w-4 h-4" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4" />
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* Source URL Preview */}
                            <div className="mt-2 text-xs text-muted-foreground truncate">
                              <span className="opacity-60">🔗</span> {source.source_url}
                            </div>

                            {/* Expanded Description */}
                            <AnimatePresence>
                              {isExpanded && source.description && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <p className="mt-3 pt-3 border-t border-border text-sm text-muted-foreground leading-relaxed">
                                    {source.description}
                                  </p>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>

                          {/* Time difference to next source */}
                          {!isLast && sources[index + 1] && (
                            <div className="absolute left-[14px] mt-2 text-[10px] text-muted-foreground">
                              +{Math.round(
                                (new Date(sources[index + 1].published_at).getTime() - 
                                 new Date(source.published_at).getTime()) / 
                                (1000 * 60)
                              )}min
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-border bg-muted/30">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-xs">Verified = Major news outlet</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span className="text-xs">Unverified = Other sources</span>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}