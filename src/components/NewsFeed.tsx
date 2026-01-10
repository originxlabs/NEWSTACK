import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Loader2, Filter, TrendingUp, Clock, Sparkles } from "lucide-react";
import { NewsCard, NewsItem } from "./NewsCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const topics = ["All", "Business", "Tech", "World", "India", "Sports", "Finance", "AI", "Politics"];

// Mock news data generator
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
    "Electric Vehicle Sales Surpass Gas Cars in Major European Markets",
    "New Study Reveals AI Can Detect Early Signs of Disease",
    "Global Supply Chain Crisis Shows Signs of Recovery",
    "Renewable Energy Investments Hit Record $500B Globally",
    "Major Cybersecurity Breach Affects Fortune 500 Companies",
  ];

  const summaries = [
    "Researchers at leading AI labs have demonstrated a new approach to machine learning that enables systems to perform multi-step reasoning with unprecedented accuracy.",
    "Markets showed strong momentum as investors anticipate policy shifts that could stimulate economic growth across major economies.",
    "The investment surge reflects growing confidence in India's digital infrastructure and emerging technology ecosystem.",
    "The mission marks a significant milestone in private space exploration and commercial space travel capabilities.",
    "World leaders have committed to ambitious carbon reduction targets with binding enforcement mechanisms.",
  ];

  const topicsList = ["Business", "Tech", "World", "India", "Sports", "Finance", "AI", "Politics"];
  const sources = ["Reuters", "Bloomberg", "AP News", "BBC", "CNN", "TechCrunch", "The Guardian"];
  const sentiments: ("positive" | "neutral" | "negative")[] = ["positive", "neutral", "negative"];

  return Array.from({ length: count }, (_, i) => ({
    id: `news-${startIndex + i}`,
    headline: headlines[(startIndex + i) % headlines.length],
    summary: summaries[(startIndex + i) % summaries.length],
    topic: topicsList[(startIndex + i) % topicsList.length],
    sentiment: sentiments[(startIndex + i) % sentiments.length],
    trustScore: 85 + Math.floor(Math.random() * 15),
    source: sources[(startIndex + i) % sources.length],
    timestamp: `${Math.floor(Math.random() * 23) + 1}h ago`,
    imageUrl: `https://images.unsplash.com/photo-${1500000000000 + (startIndex + i) * 1000}?w=400&h=300&fit=crop`,
    whyMatters: "Based on your interest in technology and global markets, this story aligns with topics you frequently engage with.",
  }));
};

export function NewsFeed() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [selectedTopic, setSelectedTopic] = useState("All");
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Load initial news
  useEffect(() => {
    setNews(generateMockNews(0, 10));
  }, []);

  // Load more news
  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setTimeout(() => {
      const newNews = generateMockNews(news.length, 5);
      setNews((prev) => [...prev, ...newNews]);
      setIsLoading(false);
      if (news.length >= 50) {
        setHasMore(false);
      }
    }, 1000);
  }, [news.length, isLoading, hasMore]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [loadMore]);

  const filteredNews = selectedTopic === "All" 
    ? news 
    : news.filter((n) => n.topic === selectedTopic);

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
                AI-curated stories tailored to your interests
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
                key={topic}
                variant={selectedTopic === topic ? "default" : "glass"}
                size="sm"
                onClick={() => setSelectedTopic(topic)}
                className="flex-shrink-0"
              >
                {topic}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* News cards */}
        <div className="space-y-4">
          {filteredNews.map((item, index) => (
            <NewsCard key={item.id} news={item} index={index} />
          ))}
        </div>

        {/* Loading indicator */}
        <div ref={loaderRef} className="py-8 flex justify-center">
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading more stories...</span>
            </div>
          )}
          {!hasMore && (
            <p className="text-muted-foreground text-sm">
              You've reached the end. Check back later for more stories.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
