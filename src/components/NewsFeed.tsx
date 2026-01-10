import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Loader2, TrendingUp, Clock, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { NewsCard, NewsItem } from "./NewsCard";
import { Button } from "@/components/ui/button";
import { useInfiniteNews, NewsArticle } from "@/hooks/use-news";
import { usePreferences } from "@/contexts/PreferencesContext";

const topics = [
  { slug: "all", name: "All" },
  { slug: "ai", name: "AI" },
  { slug: "business", name: "Business" },
  { slug: "finance", name: "Finance" },
  { slug: "politics", name: "Politics" },
  { slug: "sports", name: "Sports" },
  { slug: "entertainment", name: "Entertainment" },
  { slug: "health", name: "Health" },
  { slug: "tech", name: "Tech" },
  { slug: "climate", name: "Climate" },
];

// Transform API article to NewsItem format
function transformArticle(article: NewsArticle): NewsItem {
  const publishedDate = new Date(article.published_at);
  const now = new Date();
  const diffHours = Math.floor((now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60));
  const timestamp = diffHours < 1 ? "Just now" : diffHours < 24 ? `${diffHours}h ago` : `${Math.floor(diffHours / 24)}d ago`;

  return {
    id: article.id,
    headline: article.headline,
    summary: article.summary || article.ai_analysis || "",
    content: article.content,
    topic: article.topic_slug || "world",
    sentiment: article.sentiment || "neutral",
    trustScore: article.trust_score || 85,
    source: article.source_name || "Unknown",
    sourceIcon: article.source_logo || undefined,
    timestamp,
    imageUrl: article.image_url || undefined,
    whyMatters: article.why_matters || "This story provides insights into developments that could impact global trends and your interests.",
    countryCode: article.country_code || undefined,
    isGlobal: article.is_global,
  };
}

// Fallback mock data in case API fails
const generateMockNews = (startIndex: number, count: number): NewsItem[] => {
  const headlines = [
    "AI Breakthrough: New Language Model Achieves Human-Level Reasoning in Complex Tasks",
    "Global Markets Rally as Central Banks Signal Rate Cut Trajectory",
    "India's Tech Sector Sees Record $45B Investment in 2024",
    "SpaceX Successfully Launches First Commercial Mars Mission",
    "Climate Summit Reaches Historic Agreement on Carbon Neutrality",
    "Quantum Computing Milestone: First Error-Corrected Operations Demonstrated",
    "Apple Unveils Revolutionary Mixed Reality Platform at WWDC",
    "World Cup 2026: Host Cities Announce Sustainable Stadium Plans",
    "Federal Reserve Holds Rates Steady Amid Economic Uncertainty",
    "Breakthrough in Nuclear Fusion Brings Clean Energy Closer",
  ];

  const summaries = [
    "Researchers at leading AI labs have demonstrated a new approach to machine learning that enables systems to perform multi-step reasoning with unprecedented accuracy.",
    "Markets showed strong momentum as investors anticipate policy shifts that could stimulate economic growth across major economies.",
    "The investment surge reflects growing confidence in India's digital infrastructure and emerging technology ecosystem.",
    "The mission marks a significant milestone in private space exploration and commercial space travel capabilities.",
    "World leaders have committed to ambitious carbon reduction targets with binding enforcement mechanisms.",
  ];

  const topicsList = ["business", "ai", "world", "sports", "finance", "politics", "health", "entertainment"];
  const sources = ["Reuters", "Bloomberg", "AP News", "BBC", "CNN", "TechCrunch", "The Guardian"];
  const sentiments: ("positive" | "neutral" | "negative")[] = ["positive", "neutral", "negative"];

  return Array.from({ length: count }, (_, i) => ({
    id: `mock-${startIndex + i}`,
    headline: headlines[(startIndex + i) % headlines.length],
    summary: summaries[(startIndex + i) % summaries.length],
    topic: topicsList[(startIndex + i) % topicsList.length],
    sentiment: sentiments[(startIndex + i) % sentiments.length],
    trustScore: 85 + Math.floor(Math.random() * 15),
    source: sources[(startIndex + i) % sources.length],
    timestamp: `${Math.floor(Math.random() * 23) + 1}h ago`,
    imageUrl: undefined,
    whyMatters: "Based on your interest in technology and global markets, this story aligns with topics you frequently engage with.",
  }));
};

export function NewsFeed() {
  const { country, language } = usePreferences();
  const [selectedTopic, setSelectedTopic] = useState("all");
  const loaderRef = useRef<HTMLDivElement>(null);

  // Build query params based on preferences
  const queryParams = useMemo(() => ({
    country: country?.code,
    language: language?.code === "en" ? "eng" : language?.code,
    topic: selectedTopic !== "all" ? selectedTopic : undefined,
    pageSize: 15,
  }), [country?.code, language?.code, selectedTopic]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteNews(queryParams);

  // Transform articles to NewsItem format
  const newsItems = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.articles.map(transformArticle));
  }, [data]);

  // Use mock data as fallback if API fails
  const [mockNews, setMockNews] = useState<NewsItem[]>([]);
  useEffect(() => {
    if (isError && mockNews.length === 0) {
      setMockNews(generateMockNews(0, 10));
    }
  }, [isError, mockNews.length]);

  const displayNews = newsItems.length > 0 ? newsItems : mockNews;

  // Filter by topic (client-side for mock data, server handles real data)
  const filteredNews = selectedTopic === "all" || newsItems.length > 0
    ? displayNews
    : displayNews.filter((n) => n.topic.toLowerCase() === selectedTopic);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold mb-2">
                Your Feed
              </h2>
              <p className="text-muted-foreground">
                {country ? (
                  <>News from {country.flag_emoji} {country.name} & around the world</>
                ) : (
                  "AI-curated stories tailored to your interests"
                )}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <Button variant="ghost" size="sm" className="gap-2">
                <TrendingUp className="w-4 h-4" />
                Trending
              </Button>
              <Button variant="ghost" size="sm" className="gap-2">
                <Clock className="w-4 h-4" />
                Recent
              </Button>
              <Button variant="ghost" size="sm" className="gap-2">
                <Sparkles className="w-4 h-4" />
                For You
              </Button>
            </div>
          </div>

          {/* Topic filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {topics.map((topic) => (
              <Button
                key={topic.slug}
                variant={selectedTopic === topic.slug ? "default" : "glass"}
                size="sm"
                onClick={() => setSelectedTopic(topic.slug)}
                className="flex-shrink-0"
              >
                {topic.name}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Error state */}
        {isError && mockNews.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="font-display text-xl font-semibold mb-2">Failed to load news</h3>
            <p className="text-muted-foreground mb-4">
              {error instanceof Error ? error.message : "Please try again later"}
            </p>
            <Button onClick={() => refetch()} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          </motion.div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="glass-card rounded-xl h-48 animate-pulse" />
            ))}
          </div>
        )}

        {/* News cards */}
        {!isLoading && (
          <div className="space-y-4">
            {filteredNews.map((item, index) => (
              <NewsCard key={item.id} news={item} index={index} />
            ))}
          </div>
        )}

        {/* No results */}
        {!isLoading && filteredNews.length === 0 && !isError && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No news found for this topic. Try selecting a different category.</p>
          </div>
        )}

        {/* Loading indicator */}
        <div ref={loaderRef} className="py-8 flex justify-center">
          {isFetchingNextPage && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading more stories...</span>
            </div>
          )}
          {!hasNextPage && filteredNews.length > 0 && (
            <p className="text-muted-foreground text-sm">
              You've reached the end. Check back later for more stories.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
