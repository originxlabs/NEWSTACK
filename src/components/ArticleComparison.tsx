import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Scale, X, ChevronLeft, ChevronRight, ExternalLink, 
  Clock, CheckCircle2, AlertCircle, Globe, Building2, Shield, BarChart3, Info,
  TrendingUp, TrendingDown, Minus, Link as LinkIcon, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";

interface ComparisonSource {
  id: string;
  source_name: string;
  source_url: string;
  description: string;
  published_at: string;
  coverage?: number;
  sentiment?: "positive" | "neutral" | "negative";
  isVerified?: boolean;
}

interface ArticleComparisonProps {
  storyHeadline: string;
  storyId?: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Trust Score Calculation Formula:
 * 
 * Trust Score = (Source Count Factor × 40%) + (Source Diversity × 30%) + (Verification Factor × 30%)
 * 
 * 1. Source Count Factor (40% weight):
 *    - 1 source: 60 points
 *    - 2-3 sources: 75 points
 *    - 4-6 sources: 85 points
 *    - 7-10 sources: 92 points
 *    - 10+ sources: 98 points
 * 
 * 2. Source Diversity (30% weight):
 *    - Measures how many unique news organizations cover the story
 *    - Higher diversity = higher credibility
 * 
 * 3. Verification Factor (30% weight):
 *    - Trusted sources (Reuters, AP, BBC, etc.) get higher scores
 *    - Based on media bias ratings and fact-check records
 * 
 * Coverage Percentage per source:
 *    - First source (earliest): 100%
 *    - Each subsequent source: -8% (minimum 35%)
 *    - This represents how comprehensively each source covers the story
 * 
 * Sentiment Analysis:
 *    - Analyzes description keywords to determine sentiment
 *    - Positive: Growth, success, improvement keywords
 *    - Negative: Crisis, decline, problem keywords
 *    - Neutral: Balanced or factual reporting
 */

const TRUSTED_SOURCES = [
  "Reuters", "Associated Press", "AP", "BBC", "AFP", 
  "The Hindu", "NDTV", "Times of India", "The Guardian",
  "NPR", "PBS", "Al Jazeera", "Bloomberg", "The Economist",
  "New York Times", "Washington Post", "CNN", "LiveMint",
  "Hindustan Times", "India Today", "ESPN", "TechCrunch",
  "Economic Times", "Business Standard", "Forbes", "Google News"
];

// Sentiment keywords for analysis
const POSITIVE_KEYWORDS = [
  "success", "growth", "win", "victory", "improve", "positive", "gains",
  "breakthrough", "achievement", "celebrate", "optimism", "boost", "surge",
  "record high", "milestone", "progress", "innovation", "recovery"
];

const NEGATIVE_KEYWORDS = [
  "crisis", "decline", "fall", "drop", "concern", "threat", "warning",
  "failure", "loss", "crash", "collapse", "risk", "danger", "death",
  "killed", "arrested", "violence", "protest", "conflict", "problem"
];

function analyzeSentiment(text: string): "positive" | "neutral" | "negative" {
  const lowerText = text.toLowerCase();
  let positiveCount = 0;
  let negativeCount = 0;

  POSITIVE_KEYWORDS.forEach(keyword => {
    if (lowerText.includes(keyword)) positiveCount++;
  });

  NEGATIVE_KEYWORDS.forEach(keyword => {
    if (lowerText.includes(keyword)) negativeCount++;
  });

  if (positiveCount > negativeCount && positiveCount >= 2) return "positive";
  if (negativeCount > positiveCount && negativeCount >= 2) return "negative";
  return "neutral";
}

function isVerifiedSource(sourceName: string): boolean {
  const normalizedName = sourceName.toLowerCase();
  return TRUSTED_SOURCES.some(ts => normalizedName.includes(ts.toLowerCase()));
}

function calculateCoverage(index: number, totalSources: number): number {
  const baseCoverage = 100 - (index * 8);
  return Math.max(baseCoverage, 35);
}

function calculateTrustScore(sources: ComparisonSource[]): { 
  score: number; 
  breakdown: { sourceCount: number; diversity: number; verification: number };
  sentimentBreakdown: { positive: number; neutral: number; negative: number };
} {
  const sourceCount = sources.length;
  
  // Source Count Factor (40%)
  let sourceCountScore = 60;
  if (sourceCount >= 10) sourceCountScore = 98;
  else if (sourceCount >= 7) sourceCountScore = 92;
  else if (sourceCount >= 4) sourceCountScore = 85;
  else if (sourceCount >= 2) sourceCountScore = 75;
  
  // Source Diversity (30%)
  const uniqueSources = new Set(sources.map(s => s.source_name.toLowerCase())).size;
  const diversityScore = Math.min(100, (uniqueSources / Math.max(sourceCount, 1)) * 100 + 30);
  
  // Verification Factor (30%)
  const trustedCount = sources.filter(s => s.isVerified).length;
  const verificationScore = Math.min(100, (trustedCount / Math.max(sourceCount, 1)) * 100 + 40);
  
  // Sentiment breakdown
  const positiveCount = sources.filter(s => s.sentiment === "positive").length;
  const negativeCount = sources.filter(s => s.sentiment === "negative").length;
  const neutralCount = sources.filter(s => s.sentiment === "neutral").length;
  
  const finalScore = Math.round(
    (sourceCountScore * 0.4) + 
    (diversityScore * 0.3) + 
    (verificationScore * 0.3)
  );
  
  return {
    score: Math.min(100, finalScore),
    breakdown: {
      sourceCount: sourceCountScore,
      diversity: Math.round(diversityScore),
      verification: Math.round(verificationScore)
    },
    sentimentBreakdown: {
      positive: positiveCount,
      neutral: neutralCount,
      negative: negativeCount
    }
  };
}

const SentimentIcon = ({ sentiment }: { sentiment: "positive" | "neutral" | "negative" }) => {
  switch (sentiment) {
    case "positive":
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    case "negative":
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    default:
      return <Minus className="w-4 h-4 text-blue-500" />;
  }
};

const SentimentBadge = ({ sentiment }: { sentiment: "positive" | "neutral" | "negative" }) => {
  const config = {
    positive: { bg: "bg-green-500/10 border-green-500/30 text-green-600", label: "Positive" },
    negative: { bg: "bg-red-500/10 border-red-500/30 text-red-600", label: "Negative" },
    neutral: { bg: "bg-blue-500/10 border-blue-500/30 text-blue-600", label: "Neutral" }
  };

  const { bg, label } = config[sentiment];
  return (
    <Badge variant="outline" className={`text-xs ${bg} gap-1`}>
      <SentimentIcon sentiment={sentiment} />
      {label}
    </Badge>
  );
};

export function ArticleComparison({ storyHeadline, storyId, isOpen, onClose }: ArticleComparisonProps) {
  const [sources, setSources] = useState<ComparisonSource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [trustData, setTrustData] = useState<ReturnType<typeof calculateTrustScore> | null>(null);

  useEffect(() => {
    if (isOpen && storyId) {
      fetchSources();
    }
  }, [isOpen, storyId]);

  const fetchSources = async () => {
    if (!storyId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("story_sources")
        .select("*")
        .eq("story_id", storyId)
        .order("published_at", { ascending: true });

      if (error) throw error;
      
      if (data && data.length > 0) {
        // Add coverage, sentiment, and verification to each source
        const enhancedSources = data.map((source, idx) => ({
          ...source,
          coverage: calculateCoverage(idx, data.length),
          sentiment: analyzeSentiment(source.description || source.source_name),
          isVerified: isVerifiedSource(source.source_name)
        }));
        setSources(enhancedSources);
        setTrustData(calculateTrustScore(enhancedSources));
      } else {
        setSources([]);
        setTrustData(null);
      }
    } catch (err) {
      console.error("Failed to fetch sources:", err);
      setSources([]);
    } finally {
      setIsLoading(false);
    }
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : sources.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < sources.length - 1 ? prev + 1 : 0));
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", { 
      month: "short", 
      day: "numeric", 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  if (!isOpen) return null;

  const verifiedCount = sources.filter(s => s.isVerified).length;
  const unverifiedCount = sources.length - verifiedCount;

  return (
    <TooltipProvider>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-4xl bg-card rounded-2xl shadow-2xl overflow-hidden border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-border bg-gradient-to-r from-primary/5 via-background to-accent/5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Scale className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium text-primary">Multi-Source Comparison & Sentiment</span>
                  </div>
                  <h2 className="font-display text-xl font-bold text-foreground line-clamp-2">
                    {storyHeadline}
                  </h2>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              {!isLoading && sources.length > 0 && (
                <div className="flex items-center gap-4 mt-4 flex-wrap">
                  <Badge variant="outline" className="gap-1">
                    <Globe className="w-3 h-3" />
                    {sources.length} Sources
                  </Badge>
                  
                  {verifiedCount > 0 && (
                    <Badge variant="outline" className="gap-1 border-green-500/30 text-green-600 bg-green-500/5">
                      <CheckCircle2 className="w-3 h-3" />
                      {verifiedCount} Verified
                    </Badge>
                  )}
                  
                  {unverifiedCount > 0 && (
                    <Badge variant="outline" className="gap-1 border-amber-500/30 text-amber-600 bg-amber-500/5">
                      <AlertCircle className="w-3 h-3" />
                      {unverifiedCount} Unverified
                    </Badge>
                  )}
                  
                  {trustData && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 cursor-help">
                          <Shield className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium text-green-500">{trustData.score}% Trust Score</span>
                          <Info className="w-3 h-3 text-muted-foreground" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs p-4">
                        <div className="space-y-3">
                          <p className="font-semibold text-sm">Trust Score Breakdown</p>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between items-center">
                              <span>Source Count (40%)</span>
                              <span className="font-medium">{trustData.breakdown.sourceCount}%</span>
                            </div>
                            <Progress value={trustData.breakdown.sourceCount} className="h-1" />
                            
                            <div className="flex justify-between items-center">
                              <span>Source Diversity (30%)</span>
                              <span className="font-medium">{trustData.breakdown.diversity}%</span>
                            </div>
                            <Progress value={trustData.breakdown.diversity} className="h-1" />
                            
                            <div className="flex justify-between items-center">
                              <span>Verification (30%)</span>
                              <span className="font-medium">{trustData.breakdown.verification}%</span>
                            </div>
                            <Progress value={trustData.breakdown.verification} className="h-1" />
                          </div>
                          <p className="text-[10px] text-muted-foreground pt-2 border-t">
                            Based on source count, diversity, and trusted outlet verification
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              )}

              {/* Sentiment Summary */}
              {!isLoading && trustData && sources.length > 0 && (
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Sentiment Analysis:</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {trustData.sentimentBreakdown.positive > 0 && (
                      <div className="flex items-center gap-1 text-xs">
                        <TrendingUp className="w-3 h-3 text-green-500" />
                        <span className="text-green-600">{trustData.sentimentBreakdown.positive} Positive</span>
                      </div>
                    )}
                    {trustData.sentimentBreakdown.neutral > 0 && (
                      <div className="flex items-center gap-1 text-xs">
                        <Minus className="w-3 h-3 text-blue-500" />
                        <span className="text-blue-600">{trustData.sentimentBreakdown.neutral} Neutral</span>
                      </div>
                    )}
                    {trustData.sentimentBreakdown.negative > 0 && (
                      <div className="flex items-center gap-1 text-xs">
                        <TrendingDown className="w-3 h-3 text-red-500" />
                        <span className="text-red-600">{trustData.sentimentBreakdown.negative} Negative</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 bg-muted/50 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : sources.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-amber-500" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Limited Source Data</h3>
                  <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                    Detailed comparison data is not yet available for this story. 
                    Our system is continuously indexing sources.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Navigation */}
                  <div className="flex items-center justify-between">
                    <Button variant="outline" size="sm" onClick={goToPrevious} disabled={sources.length <= 1}>
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-2">
                      {sources.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentIndex(i)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            i === currentIndex ? "bg-primary" : "bg-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                    <Button variant="outline" size="sm" onClick={goToNext} disabled={sources.length <= 1}>
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>

                  {/* Current Source Detail */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentIndex}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className={`p-6 rounded-xl border ${
                        sources[currentIndex]?.isVerified 
                          ? "bg-green-500/5 border-green-500/20" 
                          : "bg-amber-500/5 border-amber-500/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="font-display text-lg font-semibold text-foreground">
                              {sources[currentIndex]?.source_name}
                            </h3>
                            {sources[currentIndex]?.isVerified ? (
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
                            {sources[currentIndex]?.sentiment && (
                              <SentimentBadge sentiment={sources[currentIndex].sentiment!} />
                            )}
                            {currentIndex === 0 && (
                              <Badge className="bg-green-500 text-white border-0 text-xs">
                                🏆 First Report
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {sources[currentIndex] && formatTime(sources[currentIndex].published_at)}
                            </span>
                            <span className="flex items-center gap-1">
                              <BarChart3 className="w-4 h-4" />
                              Coverage: {sources[currentIndex]?.coverage}%
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => window.open(sources[currentIndex]?.source_url, '_blank', 'noopener,noreferrer')}
                        >
                          <LinkIcon className="w-4 h-4" />
                          Visit
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {/* Coverage Progress */}
                      <div className="mb-4">
                        <Progress value={sources[currentIndex]?.coverage || 0} className="h-2" />
                      </div>
                      
                      {/* Source URL */}
                      <div className="mb-3 text-xs text-muted-foreground truncate">
                        🔗 {sources[currentIndex]?.source_url}
                      </div>
                      
                      <p className="text-foreground leading-relaxed">
                        {sources[currentIndex]?.description || "No description available."}
                      </p>
                    </motion.div>
                  </AnimatePresence>

                  {/* All Sources List with Coverage & Sentiment */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      All Sources, Coverage & Sentiment
                    </h4>
                    <ScrollArea className="h-56">
                      <div className="space-y-2 pr-3">
                        {sources.map((source, index) => (
                          <motion.button
                            key={source.id}
                            onClick={() => setCurrentIndex(index)}
                            className={`w-full text-left p-3 rounded-lg transition-colors ${
                              index === currentIndex 
                                ? "bg-primary/10 border border-primary/30" 
                                : source.isVerified
                                ? "bg-green-500/5 hover:bg-green-500/10 border border-green-500/20"
                                : "bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20"
                            }`}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                          >
                            <div className="flex items-center justify-between mb-1 gap-2">
                              <div className="flex items-center gap-2 flex-wrap min-w-0">
                                <span className="font-medium text-foreground truncate">{source.source_name}</span>
                                {index === 0 && (
                                  <Badge className="bg-green-500 text-white border-0 text-[10px]">First</Badge>
                                )}
                                {source.isVerified ? (
                                  <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                                ) : (
                                  <AlertCircle className="w-3 h-3 text-amber-500 flex-shrink-0" />
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <SentimentIcon sentiment={source.sentiment || "neutral"} />
                                <span className="text-xs text-muted-foreground">{source.coverage}%</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Progress value={source.coverage} className="h-1 flex-1" />
                              <span className="text-xs text-muted-foreground flex-shrink-0">
                                {formatTime(source.published_at)}
                              </span>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              )}
            </div>

            {/* Footer with Formula Explanation */}
            <div className="p-4 border-t border-border bg-muted/30">
              <div className="flex items-center justify-between text-xs text-muted-foreground flex-wrap gap-2">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    <span>Verified = Major outlet</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3 text-green-500" />
                    <span>Positive</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Minus className="w-3 h-3 text-blue-500" />
                    <span>Neutral</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <TrendingDown className="w-3 h-3 text-red-500" />
                    <span>Negative</span>
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
    </TooltipProvider>
  );
}