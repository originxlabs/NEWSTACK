import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Newspaper, Calendar, AlertTriangle, Globe, Headphones, ExternalLink, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlaceData } from "@/hooks/use-places";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface NewsItem {
  title: string;
  description: string;
  source: string;
  publishedAt: string;
  url: string;
  image?: string;
  type: "news" | "event" | "alert" | "highlight";
}

interface WhatsHappeningProps {
  placeData: PlaceData;
}

export function WhatsHappening({ placeData }: WhatsHappeningProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const placeName = placeData.place?.name;
  const country = placeData.place?.country;

  useEffect(() => {
    if (!placeName) return;

    const fetchNews = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/places-news`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
          body: JSON.stringify({ place_name: placeName, country }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch news");
        }

        const data = await response.json();
        
        // Add type classification to news items
        const classifiedNews = (data.news || []).map((item: any, index: number) => ({
          ...item,
          type: classifyNewsType(item.title, index),
        }));

        setNews(classifiedNews);
      } catch (err) {
        console.error("News fetch error:", err);
        setError("Unable to load local news");
        // Set fallback mock data
        setNews(getMockNews(placeName));
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, [placeName, country]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "event":
        return <Calendar className="h-4 w-4" />;
      case "alert":
        return <AlertTriangle className="h-4 w-4" />;
      case "highlight":
        return <Globe className="h-4 w-4" />;
      default:
        return <Newspaper className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      news: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      event: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      alert: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      highlight: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    };

    const labels: Record<string, string> = {
      news: "Local News",
      event: "Event",
      alert: "Alert",
      highlight: "Highlight",
    };

    return (
      <Badge variant="outline" className={`${styles[type] || styles.news} text-xs`}>
        {getTypeIcon(type)}
        <span className="ml-1">{labels[type] || "News"}</span>
      </Badge>
    );
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    
    return date.toLocaleDateString();
  };

  if (!placeName) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card className="p-6 glass-card border-white/10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <Newspaper className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold">What's Happening Here</h3>
              <p className="text-sm text-muted-foreground">Local news, events & alerts</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error && news.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Newspaper className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No recent news available</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
            {news.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-4 bg-card/50 hover:bg-card/80 transition-all group cursor-pointer border-white/5">
                  <div className="flex gap-4">
                    {item.image && (
                      <div className="shrink-0 w-20 h-20 rounded-lg overflow-hidden">
                        <img
                          src={item.image}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {getTypeBadge(item.type)}
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(item.publishedAt)}
                        </span>
                      </div>
                      <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-3 mt-3">
                        <span className="text-xs text-muted-foreground">{item.source}</span>
                        <div className="flex gap-2 ml-auto">
                          <Button variant="ghost" size="sm" className="h-7 text-xs">
                            <Headphones className="h-3 w-3 mr-1" />
                            Listen
                          </Button>
                          {item.url && item.url !== "#" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => window.open(item.url, "_blank")}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </motion.div>
  );
}

function classifyNewsType(title: string, index: number): "news" | "event" | "alert" | "highlight" {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes("warning") || lowerTitle.includes("alert") || lowerTitle.includes("emergency")) {
    return "alert";
  }
  if (lowerTitle.includes("festival") || lowerTitle.includes("event") || lowerTitle.includes("celebration")) {
    return "event";
  }
  if (index === 0 || lowerTitle.includes("top") || lowerTitle.includes("best")) {
    return "highlight";
  }
  
  return "news";
}

function getMockNews(placeName: string): NewsItem[] {
  return [
    {
      title: `Discover the hidden gems of ${placeName}`,
      description: "Local experts share their favorite spots that most tourists miss. From quiet cafes to scenic viewpoints.",
      source: "Travel Weekly",
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      url: "#",
      type: "highlight",
    },
    {
      title: `Cultural festival season begins in ${placeName}`,
      description: "Annual celebrations bring together locals and visitors for music, food, and traditional performances.",
      source: "Local Events",
      publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      url: "#",
      type: "event",
    },
    {
      title: `Weather update for ${placeName} region`,
      description: "Clear skies expected for the upcoming week, perfect conditions for outdoor activities and sightseeing.",
      source: "Weather Service",
      publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      url: "#",
      type: "news",
    },
  ];
}
