import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, TrendingUp, Flame, Clock, Shield, ExternalLink, 
  Headphones, Bookmark, Heart, Share2, Layers, Pause, ChevronRight,
  Filter, ChevronDown, ChevronUp, FileText
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useNews } from "@/hooks/use-news";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTTS } from "@/hooks/use-tts";
import { useTTSLimit } from "@/hooks/use-tts-limit";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SourcesPopover } from "@/components/SourcesPopover";
import { SourceDiversityScore } from "@/components/SourceDiversityScore";
import { TTSLimitModal } from "@/components/TTSLimitModal";
import { AuthModal } from "@/components/auth/AuthModal";
import { format, formatDistanceToNow } from "date-fns";

interface TrendingArticle {
  id: string;
  headline: string;
  summary: string;
  topic: string;
  source: string;
  sourceUrl?: string;
  sourceCount?: number;
  trustScore: number;
  timestamp: string;
  publishedAt?: string;
  imageUrl?: string;
  whyMatters?: string;
  isTrending?: boolean;
  sources?: Array<{
    source_name: string;
    source_url: string;
    description?: string;
    published_at: string;
  }>;
  content?: string;
}

const topicColors: Record<string, string> = {
  business: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  tech: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  world: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  sports: "bg-red-500/10 text-red-500 border-red-500/20",
  finance: "bg-green-500/10 text-green-500 border-green-500/20",
  ai: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  politics: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  health: "bg-teal-500/10 text-teal-500 border-teal-500/20",
  entertainment: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  climate: "bg-lime-500/10 text-lime-500 border-lime-500/20",
  startups: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  science: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
};

export function TrendingNewsGrid() {
  const { language, country } = usePreferences();
  const { user, profile } = useAuth();
  const [selectedArticle, setSelectedArticle] = useState<TrendingArticle | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showMultiSourceOnly, setShowMultiSourceOnly] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  
  const { speak, toggle, isLoading: ttsLoading, isPlaying, progress, stop } = useTTS({
    language: language?.code || "en",
  });
  const { incrementUsage, canPlay, showLimitModal, closeLimitModal, usedCount, maxCount } = useTTSLimit();

  const { data, isLoading, isError } = useNews({
    feedType: "trending",
    pageSize: 9,
    country: country?.code,
  });

  const trendingArticles = useMemo(() => {
    if (!data?.articles) return [];
    
    let articles = data.articles.map(article => {
      const publishedDate = new Date(article.published_at);
      const now = new Date();
      const diffHours = Math.floor((now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60));
      const timestamp = diffHours < 1 ? "Just now" : diffHours < 24 ? `${diffHours}h ago` : `${Math.floor(diffHours / 24)}d ago`;

      return {
        id: article.id,
        headline: article.headline,
        summary: article.summary || article.ai_analysis || "",
        topic: article.topic_slug || "world",
        source: article.source_name || "Unknown",
        sourceUrl: article.source_url || undefined,
        sourceCount: article.source_count,
        trustScore: article.trust_score || 85,
        timestamp,
        publishedAt: article.published_at,
        imageUrl: article.image_url || undefined,
        whyMatters: article.why_matters,
        isTrending: true,
        sources: (article as any).sources || [],
        content: (article as any).content || null,
      } as TrendingArticle;
    });

    // Filter for multi-source stories if enabled
    if (showMultiSourceOnly) {
      articles = articles.filter(a => (a.sourceCount || 0) >= 3);
    }
    
    return articles;
  }, [data, showMultiSourceOnly]);

  const handleCardClick = (article: TrendingArticle) => {
    setSelectedArticle(article);
    setIsModalOpen(true);
    setIsSaved(false);
    setIsLiked(false);
    setShowFullContent(false);
    
    // Check if saved
    if (user) {
      supabase
        .from("saved_news")
        .select("id")
        .eq("user_id", user.id)
        .eq("news_id", article.id)
        .maybeSingle()
        .then(({ data }) => setIsSaved(!!data));
    }
  };

  const handleCloseModal = () => {
    stop();
    setIsModalOpen(false);
    setSelectedArticle(null);
    setShowFullContent(false);
  };

  const handleListen = async () => {
    if (!selectedArticle) return;
    
    if (isPlaying) {
      toggle();
    } else if (!ttsLoading) {
      if (!canPlay()) return;
      if (incrementUsage()) {
        const textToSpeak = `${selectedArticle.headline}. ${selectedArticle.summary}`;
        await speak(textToSpeak);
      }
    }
  };

  const handleSave = async () => {
    if (!selectedArticle) return;
    
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      if (isSaved) {
        await supabase
          .from("saved_news")
          .delete()
          .eq("user_id", user.id)
          .eq("news_id", selectedArticle.id);
        setIsSaved(false);
        toast.success("Removed from saved");
      } else {
        await supabase
          .from("saved_news")
          .insert({
            user_id: user.id,
            news_id: selectedArticle.id,
          });
        setIsSaved(true);
        toast.success("Saved for later");
      }
    } catch {
      toast.error("Failed to save article");
    }
  };

  const handleLike = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setIsLiked(!isLiked);
  };

  const handleShare = async () => {
    if (!selectedArticle) return;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: selectedArticle.headline,
          text: selectedArticle.summary,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(`${selectedArticle.headline}\n\n${selectedArticle.summary}`);
        toast.success("Copied to clipboard!");
      }
    } catch {
      // User cancelled
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
    }
    return formatDistanceToNow(d, { addSuffix: true });
  };

  // Build sources for modal
  const sources = useMemo(() => {
    if (!selectedArticle) return [];
    
    if (selectedArticle.sources && selectedArticle.sources.length > 0) {
      return selectedArticle.sources.map((s, idx) => ({
        name: s.source_name,
        url: s.source_url,
        description: s.description,
        published_at: s.published_at,
        verified: true,
        isFirst: idx === 0,
      }));
    }
    
    return [
      { 
        name: selectedArticle.source, 
        url: selectedArticle.sourceUrl || "#", 
        verified: true,
        isFirst: true,
        published_at: selectedArticle.publishedAt,
      },
    ];
  }, [selectedArticle]);

  if (isLoading) {
    return (
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center gap-3 mb-8">
            <Flame className="w-6 h-6 text-orange-500" />
            <h2 className="font-display text-2xl sm:text-3xl font-bold">Trending Now</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass-card rounded-xl h-72 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (isError || trendingArticles.length === 0) {
    return null;
  }

  return (
    <>
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-orange-500/10">
                <Flame className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold">Trending Now</h2>
                <p className="text-sm text-muted-foreground">Multi-source verified stories</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Multi-source filter */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">3+ Sources</span>
                <Switch
                  checked={showMultiSourceOnly}
                  onCheckedChange={setShowMultiSourceOnly}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>
              
              <Button variant="ghost" className="gap-2" asChild>
                <a href="/news">
                  View All
                  <ChevronRight className="w-4 h-4" />
                </a>
              </Button>
            </div>
          </motion.div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingArticles.slice(0, 9).map((article, index) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  variant="news" 
                  className="cursor-pointer group overflow-hidden h-full hover:shadow-xl transition-all"
                  onClick={() => handleCardClick(article)}
                >
                  <CardContent className="p-0 h-full flex flex-col">
                    {/* Image */}
                    {article.imageUrl && (
                      <div className="h-40 relative overflow-hidden">
                        <img
                          src={article.imageUrl}
                          alt={article.headline}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                        
                        {/* Trending badge */}
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-orange-500 text-white border-0 text-xs">
                            🔥 Trending
                          </Badge>
                        </div>
                        
                        {/* Source count */}
                        {article.sourceCount && article.sourceCount >= 2 && (
                          <div className="absolute top-3 right-3">
                            <Badge variant="secondary" className="text-xs bg-background/80 backdrop-blur">
                              <Layers className="w-3 h-3 mr-1" />
                              {article.sourceCount} sources
                            </Badge>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-4 flex-1 flex flex-col">
                      {/* Topic */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <Badge className={`${topicColors[article.topic.toLowerCase()] || "bg-primary/10 text-primary"} text-xs`}>
                          {article.topic}
                        </Badge>
                        <div className="flex items-center gap-1.5">
                          {article.sources && article.sources.length > 1 && (
                            <SourceDiversityScore
                              sources={article.sources}
                              sourceCount={article.sourceCount || 1}
                              variant="badge"
                            />
                          )}
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Shield className="w-3 h-3 text-green-500" />
                            <span>{article.trustScore}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Headline */}
                      <h3 className="font-display font-semibold text-base leading-tight mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {article.headline}
                      </h3>

                      {/* Summary */}
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">
                        {article.summary}
                      </p>

                      {/* Footer */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/50">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium">
                            {article.source.charAt(0)}
                          </div>
                          <span className="truncate max-w-20">{article.source}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {article.timestamp}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Article Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          {selectedArticle && (
            <div className="flex flex-col">
              {/* Hero Image */}
              {selectedArticle.imageUrl && (
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={selectedArticle.imageUrl}
                    alt={selectedArticle.headline}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                  
                  {/* Badges */}
                  <div className="absolute bottom-4 left-4 flex items-center gap-2">
                    <Badge className="bg-orange-500/90 hover:bg-orange-500">
                      🔥 Trending
                    </Badge>
                    {selectedArticle.sourceCount && selectedArticle.sourceCount >= 2 && (
                      <Badge variant="secondary" className="bg-background/80">
                        {selectedArticle.sourceCount} sources
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <div className="p-6 space-y-6">
                {/* Topic & Trust */}
                <div className="flex items-center justify-between">
                  <Badge className={`${topicColors[selectedArticle.topic.toLowerCase()] || "bg-primary/10 text-primary"}`}>
                    {selectedArticle.topic}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Shield className="w-4 h-4 text-green-500" />
                    <span>{selectedArticle.trustScore}% Trust</span>
                  </div>
                </div>

                {/* Headline */}
                <h1 className="font-display text-xl sm:text-2xl font-bold leading-tight">
                  {selectedArticle.headline}
                </h1>

                {/* Source & Time */}
                <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                      {selectedArticle.source.charAt(0)}
                    </div>
                    <span>{selectedArticle.source}</span>
                  </div>
                  {selectedArticle.sourceCount && selectedArticle.sourceCount > 1 && (
                    <>
                      <span>•</span>
                      <SourcesPopover 
                        storyId={selectedArticle.id}
                        sourceCount={selectedArticle.sourceCount}
                        primarySource={selectedArticle.source}
                        primarySourceUrl={selectedArticle.sourceUrl}
                      />
                    </>
                  )}
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{selectedArticle.timestamp}</span>
                  </div>
                </div>

                {/* Listen Button */}
                <Button
                  size="lg"
                  className="w-full h-12 text-base gap-3"
                  onClick={handleListen}
                  disabled={ttsLoading}
                >
                  {ttsLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Loading...
                    </>
                  ) : isPlaying ? (
                    <>
                      <Pause className="w-5 h-5" />
                      Pause
                      <AudioWave />
                    </>
                  ) : (
                    <>
                      <Headphones className="w-5 h-5" />
                      Listen to this story
                    </>
                  )}
                </Button>
                
                {(isPlaying || ttsLoading) && (
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <motion.div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                  </div>
                )}

                {/* AI Summary */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    AI Summary
                  </h3>
                  <div className="p-4 rounded-xl bg-muted/50 border border-border">
                    <p className="text-sm leading-relaxed">{selectedArticle.summary}</p>
                  </div>
                </div>

                {/* Why This Matters */}
                {selectedArticle.whyMatters && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                      Why This Matters
                    </h3>
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <p className="text-sm leading-relaxed">{selectedArticle.whyMatters}</p>
                    </div>
                  </div>
                )}

                {/* Source Diversity Score */}
                {selectedArticle.sources && selectedArticle.sources.length > 0 && (
                  <SourceDiversityScore
                    sources={selectedArticle.sources}
                    sourceCount={selectedArticle.sourceCount || 1}
                    variant="detailed"
                  />
                )}

                {/* Full Content Section */}
                <div>
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => setShowFullContent(!showFullContent)}
                  >
                    <FileText className="w-4 h-4" />
                    {showFullContent ? "Hide Full Story" : "Read Full Story"}
                    {showFullContent ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                  
                  <AnimatePresence>
                    {showFullContent && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 p-4 rounded-xl bg-muted/30 border border-border">
                          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                            Full Story
                          </h3>
                          {selectedArticle.content ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedArticle.content}</p>
                            </div>
                          ) : (
                            <div className="text-center py-6">
                              <p className="text-sm text-muted-foreground mb-3">
                                Full article content is available from the original sources.
                              </p>
                              {selectedArticle.sourceUrl && (
                                <Button variant="outline" size="sm" asChild>
                                  <a href={selectedArticle.sourceUrl} target="_blank" rel="noopener noreferrer" className="gap-2">
                                    Read at {selectedArticle.source}
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Sources */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-500" />
                    Verified Sources ({sources.length})
                  </h3>
                  <div className="space-y-2">
                    {sources.map((source, idx) => (
                      <a
                        key={idx}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                            {source.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm truncate">{source.name}</span>
                              {source.verified && (
                                <Badge variant="secondary" className="text-[10px] bg-green-500/20 text-green-500 border-0 flex-shrink-0">
                                  ✓ Verified
                                </Badge>
                              )}
                              {source.isFirst && (
                                <Badge variant="secondary" className="text-[10px] bg-blue-500/20 text-blue-500 border-0 flex-shrink-0">
                                  First Report
                                </Badge>
                              )}
                            </div>
                            {source.published_at && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {formatTimestamp(source.published_at)}
                              </p>
                            )}
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-4 border-t border-border">
                  <Button
                    variant={isSaved ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={handleSave}
                  >
                    <Bookmark className={`w-4 h-4 mr-2 ${isSaved ? "fill-current" : ""}`} />
                    {isSaved ? "Saved" : "Save"}
                  </Button>
                  <Button
                    variant={isLiked ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={handleLike}
                  >
                    <Heart className={`w-4 h-4 mr-2 ${isLiked ? "fill-current" : ""}`} />
                    Like
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={handleShare}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <TTSLimitModal
        isOpen={showLimitModal}
        onClose={closeLimitModal}
        usedCount={usedCount}
        maxCount={maxCount}
      />

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}

function AudioWave() {
  return (
    <div className="flex items-center gap-0.5 h-3">
      {[1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="w-0.5 bg-primary-foreground rounded-full"
          animate={{ height: ["6px", "12px", "6px"] }}
          transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
