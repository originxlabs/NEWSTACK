import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bookmark, Loader2, Trash2, Filter, ChevronDown, Calendar, 
  Tag, ArrowLeft, AlertCircle, Search 
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns";
import { ArticleDetailPanel } from "@/components/ArticleDetailPanel";
import { NewsItem } from "@/components/NewsCard";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SavedArticle {
  id: string;
  news_id: string;
  created_at: string;
  news: {
    id: string;
    headline: string;
    summary: string | null;
    content: string | null;
    topic_id: string | null;
    source_name: string | null;
    source_url: string | null;
    image_url: string | null;
    published_at: string | null;
    trust_score: number | null;
    sentiment: string | null;
    why_matters: string | null;
    is_global: boolean | null;
    country_code: string | null;
  } | null;
}

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "ai", label: "AI" },
  { value: "business", label: "Business" },
  { value: "finance", label: "Finance" },
  { value: "politics", label: "Politics" },
  { value: "startups", label: "Startups" },
  { value: "technology", label: "Technology" },
  { value: "climate", label: "Climate" },
  { value: "health", label: "Health" },
  { value: "sports", label: "Sports" },
  { value: "entertainment", label: "Entertainment" },
  { value: "science", label: "Science" },
];

const DATE_FILTERS = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
];

const SavedArticles = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [savedArticles, setSavedArticles] = useState<SavedArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    fetchSavedArticles();
  }, [user, navigate]);

  const fetchSavedArticles = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from("saved_news")
        .select("*, news(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSavedArticles((data || []) as SavedArticle[]);
    } catch (err) {
      console.error("Failed to fetch saved articles:", err);
      toast.error("Failed to load saved articles");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from("saved_news")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setSavedArticles((prev) => prev.filter((a) => a.id !== id));
      toast.success("Article removed from saved");
    } catch (err) {
      toast.error("Failed to remove article");
    }
  };

  const filteredArticles = useMemo(() => {
    let articles = savedArticles.filter((a) => a.news !== null);

    // Category filter
    if (categoryFilter !== "all") {
      articles = articles.filter((a) => {
        const topic = a.news?.topic_id?.toLowerCase() || "";
        return topic.includes(categoryFilter);
      });
    }

    // Date filter
    if (dateFilter !== "all") {
      articles = articles.filter((a) => {
        const date = new Date(a.created_at);
        switch (dateFilter) {
          case "today":
            return isToday(date);
          case "yesterday":
            return isYesterday(date);
          case "week":
            return isThisWeek(date);
          case "month":
            return isThisMonth(date);
          default:
            return true;
        }
      });
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      articles = articles.filter(
        (a) =>
          a.news?.headline?.toLowerCase().includes(query) ||
          a.news?.summary?.toLowerCase().includes(query)
      );
    }

    return articles;
  }, [savedArticles, categoryFilter, dateFilter, searchQuery]);

  const transformToNewsItem = (article: SavedArticle): NewsItem | null => {
    if (!article.news) return null;
    
    const publishedDate = article.news.published_at 
      ? new Date(article.news.published_at) 
      : new Date(article.created_at);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60));
    const timestamp = diffHours < 1 ? "Just now" : diffHours < 24 ? `${diffHours}h ago` : `${Math.floor(diffHours / 24)}d ago`;

    return {
      id: article.news.id,
      headline: article.news.headline,
      summary: article.news.summary || "",
      content: article.news.content || undefined,
      topic: article.news.topic_id || "world",
      sentiment: (article.news.sentiment as "positive" | "negative" | "neutral") || "neutral",
      trustScore: article.news.trust_score || 85,
      source: article.news.source_name || "Unknown",
      sourceUrl: article.news.source_url || undefined,
      timestamp,
      imageUrl: article.news.image_url || undefined,
      whyMatters: article.news.why_matters || undefined,
      countryCode: article.news.country_code || undefined,
      isGlobal: article.news.is_global || false,
      locationRelevance: article.news.is_global ? "Global" : "Country",
    };
  };

  const handleArticleClick = (article: SavedArticle) => {
    const newsItem = transformToNewsItem(article);
    if (newsItem) {
      setSelectedArticle(newsItem);
      setIsPanelOpen(true);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto max-w-5xl px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back to News
            </Link>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl font-bold flex items-center gap-3">
                  <Bookmark className="w-8 h-8 text-primary" />
                  Saved Articles
                </h1>
                <p className="text-muted-foreground mt-1">
                  {savedArticles.length} articles saved
                </p>
              </div>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-xl p-4 mb-6"
          >
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search saved articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Tag className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Date Filter */}
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_FILTERS.map((date) => (
                    <SelectItem key={date.value} value={date.value}>
                      {date.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Active filters */}
            {(categoryFilter !== "all" || dateFilter !== "all" || searchQuery) && (
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className="text-xs text-muted-foreground">Active filters:</span>
                {categoryFilter !== "all" && (
                  <Badge variant="secondary" className="text-xs">
                    {CATEGORIES.find((c) => c.value === categoryFilter)?.label}
                  </Badge>
                )}
                {dateFilter !== "all" && (
                  <Badge variant="secondary" className="text-xs">
                    {DATE_FILTERS.find((d) => d.value === dateFilter)?.label}
                  </Badge>
                )}
                {searchQuery && (
                  <Badge variant="secondary" className="text-xs">
                    "{searchQuery}"
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => {
                    setCategoryFilter("all");
                    setDateFilter("all");
                    setSearchQuery("");
                  }}
                >
                  Clear all
                </Button>
              </div>
            )}
          </motion.div>

          {/* Results */}
          <div className={`flex gap-6 ${!isMobile && isPanelOpen ? "max-w-full" : ""}`}>
            <div className={`flex-1 min-w-0 ${!isMobile && isPanelOpen ? "max-w-[calc(100%-520px)]" : ""}`}>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredArticles.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    {savedArticles.length === 0 ? (
                      <Bookmark className="w-8 h-8 text-muted-foreground" />
                    ) : (
                      <AlertCircle className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <h3 className="font-display text-xl font-semibold mb-2">
                    {savedArticles.length === 0
                      ? "No saved articles yet"
                      : "No articles match your filters"}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {savedArticles.length === 0
                      ? "Bookmark articles to read them later"
                      : "Try adjusting your filters"}
                  </p>
                  <Link to="/">
                    <Button>Browse News</Button>
                  </Link>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {filteredArticles.map((article, index) => (
                      <motion.div
                        key={article.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ delay: index * 0.03 }}
                        layout
                      >
                        <Card
                          className={`p-4 cursor-pointer hover:bg-accent/50 transition-colors ${
                            selectedArticle?.id === article.news?.id && isPanelOpen
                              ? "ring-2 ring-primary"
                              : ""
                          }`}
                          onClick={() => handleArticleClick(article)}
                        >
                          <div className="flex gap-4">
                            {article.news?.image_url && (
                              <img
                                src={article.news.image_url}
                                alt=""
                                className="w-24 h-24 sm:w-32 sm:h-24 object-cover rounded-lg flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h3 className="font-semibold line-clamp-2">
                                  {article.news?.headline}
                                </h3>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-destructive"
                                  onClick={(e) => handleRemove(article.id, e)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                {article.news?.summary}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{article.news?.source_name}</span>
                                <span>•</span>
                                <span>Saved {format(new Date(article.created_at), "MMM d, yyyy")}</span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Desktop panel space */}
            {!isMobile && isPanelOpen && (
              <div className="hidden lg:block w-[520px] flex-shrink-0" />
            )}
          </div>
        </div>
      </main>

      {/* Article Detail Panel */}
      <ArticleDetailPanel
        article={selectedArticle}
        isOpen={isPanelOpen}
        onClose={() => {
          setIsPanelOpen(false);
          setSelectedArticle(null);
        }}
      />

      <Footer />
    </div>
  );
};

export default SavedArticles;
