import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NewsRequest {
  place_name: string;
  country?: string;
}

interface NewsArticle {
  title: string;
  description: string;
  source: string;
  publishedAt: string;
  url: string;
  image?: string;
}

// Cache duration: 30 minutes
const CACHE_DURATION_MINUTES = 30;

function generateCacheKey(placeName: string): string {
  return `places-news:${placeName.toLowerCase().replace(/\s+/g, "-")}`;
}

async function fetchFromSerpAPI(placeName: string): Promise<NewsArticle[] | null> {
  const SERPAPI_KEY = Deno.env.get("SERPAPI_KEY");
  if (!SERPAPI_KEY) {
    console.log("SerpAPI key not configured");
    return null;
  }

  try {
    const url = `https://serpapi.com/search?engine=google_news&q=${encodeURIComponent(placeName + " news")}&api_key=${SERPAPI_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`SerpAPI error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    const articles = data.news_results || [];
    
    if (articles.length === 0) return null;

    return articles.slice(0, 5).map((article: {
      title: string;
      snippet: string;
      source: { name: string };
      date?: string;
      link: string;
      thumbnail?: string;
    }) => ({
      title: article.title,
      description: article.snippet || "",
      source: article.source?.name || "Unknown",
      publishedAt: article.date || new Date().toISOString(),
      url: article.link,
      image: article.thumbnail,
    }));
  } catch (error) {
    console.error("SerpAPI error:", error);
    return null;
  }
}

async function fetchFromGNews(placeName: string): Promise<NewsArticle[] | null> {
  const GNEWS_API_KEY = Deno.env.get("GNEWS_API_KEY");
  if (!GNEWS_API_KEY) {
    console.log("GNews API key not configured");
    return null;
  }

  try {
    const query = encodeURIComponent(placeName);
    const url = `https://gnews.io/api/v4/search?q=${query}&lang=en&max=5&apikey=${GNEWS_API_KEY}`;
    
    const response = await fetch(url);
    
    if (response.status === 403 || response.status === 429) {
      console.warn("GNews rate limit reached");
      return null;
    }
    
    const data = await response.json();

    if (data.errors) {
      console.error("GNews error:", data.errors);
      return null;
    }

    if (!data.articles || data.articles.length === 0) {
      return null;
    }

    return data.articles.map((article: {
      title: string;
      description: string;
      source: { name: string };
      publishedAt: string;
      url: string;
      image: string;
    }) => ({
      title: article.title,
      description: article.description,
      source: article.source?.name || "Unknown",
      publishedAt: article.publishedAt,
      url: article.url,
      image: article.image,
    }));
  } catch (error) {
    console.error("GNews fetch error:", error);
    return null;
  }
}

async function fetchFromMediaStack(placeName: string): Promise<NewsArticle[] | null> {
  const MEDIASTACK_API_KEY = Deno.env.get("MEDIASTACK_API_KEY");
  if (!MEDIASTACK_API_KEY) {
    console.log("MediaStack API key not configured");
    return null;
  }

  try {
    const query = encodeURIComponent(placeName);
    const url = `http://api.mediastack.com/v1/news?access_key=${MEDIASTACK_API_KEY}&keywords=${query}&languages=en&limit=5`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.error("MediaStack error:", data.error);
      return null;
    }

    if (!data.data || data.data.length === 0) {
      return null;
    }

    return data.data.map((article: {
      title: string;
      description: string;
      source: string;
      published_at: string;
      url: string;
      image: string | null;
    }) => ({
      title: article.title,
      description: article.description || article.title,
      source: article.source || "MediaStack",
      publishedAt: article.published_at,
      url: article.url,
      image: article.image,
    }));
  } catch (error) {
    console.error("MediaStack fetch error:", error);
    return null;
  }
}

function generateFallbackNews(placeName: string): NewsArticle[] {
  const now = new Date().toISOString();
  return [
    {
      title: `Discover what's happening in ${placeName}`,
      description: `Stay updated with the latest events, attractions, and local stories from ${placeName}. Explore the vibrant culture and community.`,
      source: "Local Guide",
      publishedAt: now,
      url: "#",
    },
    {
      title: `${placeName} travel tips and recommendations`,
      description: `Planning to visit ${placeName}? Check out our curated guides for the best experiences, dining, and attractions.`,
      source: "Travel Insights",
      publishedAt: now,
      url: "#",
    },
    {
      title: `Community updates from ${placeName}`,
      description: `Connect with the local community and discover upcoming events, festivals, and activities in ${placeName}.`,
      source: "Community News",
      publishedAt: now,
      url: "#",
    },
  ];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { place_name, country } = await req.json() as NewsRequest;

    if (!place_name) {
      throw new Error("place_name is required");
    }

    console.log("Fetching news for place:", place_name);

    // Initialize Supabase client for caching
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const cacheKey = generateCacheKey(place_name);

    // Check cache first
    const { data: cachedData } = await supabase
      .from("cached_news")
      .select("articles, source")
      .eq("cache_key", cacheKey)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (cachedData) {
      console.log("Cache hit for:", cacheKey);
      return new Response(
        JSON.stringify({ news: cachedData.articles, source: cachedData.source, cached: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try multiple APIs in order
    let news: NewsArticle[] | null = null;
    let source = "fallback";

    // Try SerpAPI first (best for discovery)
    news = await fetchFromSerpAPI(place_name);
    if (news && news.length > 0) {
      source = "serpapi";
      console.log("SerpAPI: Found news");
    }

    // Try GNews as fallback
    if (!news) {
      console.log("SerpAPI failed, trying GNews...");
      news = await fetchFromGNews(place_name);
      if (news && news.length > 0) {
        source = "gnews";
      }
    }

    // Try MediaStack as final fallback
    if (!news) {
      console.log("GNews failed, trying MediaStack...");
      news = await fetchFromMediaStack(place_name);
      if (news && news.length > 0) {
        source = "mediastack";
      }
    }

    // Use fallback news if all APIs fail
    if (!news || news.length === 0) {
      console.log("All news APIs failed, using fallback news");
      news = generateFallbackNews(place_name);
      source = "fallback";
    }

    // Cache the result (if not fallback)
    if (source !== "fallback") {
      const expiresAt = new Date(Date.now() + CACHE_DURATION_MINUTES * 60 * 1000).toISOString();
      
      await supabase
        .from("cached_news")
        .upsert({
          cache_key: cacheKey,
          articles: news,
          total: news.length,
          source,
          expires_at: expiresAt,
        }, { onConflict: "cache_key" });
    }

    return new Response(
      JSON.stringify({ news, source }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Place news error:", message);
    
    // Return fallback news even on error
    const fallbackNews = generateFallbackNews("this location");
    return new Response(
      JSON.stringify({ news: fallbackNews, source: "fallback", error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
