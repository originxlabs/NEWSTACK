import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NewsRequest {
  country?: string;
  topic?: string;
  language?: string;
  page?: number;
  pageSize?: number;
  query?: string;
}

// GNews language codes
const gnewsLanguageCodes: Record<string, string> = {
  en: "en",
  hi: "hi",
  es: "es",
  fr: "fr",
  de: "de",
  ja: "ja",
  zh: "zh",
  ar: "ar",
  pt: "pt",
  ru: "ru",
  ko: "ko",
  it: "it",
  ta: "ta",
  te: "te",
  mr: "mr",
  bn: "bn",
};

// GNews country codes
const gnewsCountryCodes: Record<string, string> = {
  US: "us",
  IN: "in",
  GB: "gb",
  CA: "ca",
  AU: "au",
  DE: "de",
  FR: "fr",
  JP: "jp",
  CN: "cn",
  BR: "br",
  MX: "mx",
  ES: "es",
  IT: "it",
  RU: "ru",
  KR: "kr",
  AE: "ae",
  SA: "sa",
  SG: "sg",
};

// Topic to GNews category mapping
const topicToCategory: Record<string, string> = {
  business: "business",
  tech: "technology",
  ai: "technology",
  sports: "sports",
  entertainment: "entertainment",
  health: "health",
  world: "world",
  politics: "nation",
  finance: "business",
  science: "science",
};

// Cache duration in minutes
const CACHE_DURATION_MINUTES = 15;

// Generate fallback news when all APIs fail
function generateFallbackNews(country?: string, topic?: string, language?: string): { articles: unknown[]; total: number } {
  const fallbackArticles = [
    {
      id: "fallback-1",
      headline: "Stay Connected with NEWSTACK",
      summary: "We're refreshing our news sources. Thank you for your patience!",
      content: "NEWSTACK is working to bring you the latest news. Please check back shortly for updated content.",
      ai_analysis: "This is a temporary notice while we refresh our news sources.",
      why_matters: "Stay informed with NEWSTACK - your trusted news companion.",
      perspectives: [],
      source_name: "NEWSTACK",
      source_url: "",
      source_logo: null,
      image_url: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800",
      topic_slug: topic || "world",
      sentiment: "neutral",
      trust_score: 100,
      published_at: new Date().toISOString(),
      is_global: !country,
      country_code: country || null,
      language_code: language || "en",
    },
    {
      id: "fallback-2",
      headline: "Explore Places While You Wait",
      summary: "Discover amazing places around the world with our Places feature.",
      content: "While news refreshes, explore our Places section to discover cities, restaurants, and attractions worldwide.",
      ai_analysis: "Explore our Places feature for travel inspiration.",
      why_matters: "Discover new destinations and local gems.",
      perspectives: [],
      source_name: "NEWSTACK Places",
      source_url: "",
      source_logo: null,
      image_url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800",
      topic_slug: "world",
      sentiment: "positive",
      trust_score: 100,
      published_at: new Date().toISOString(),
      is_global: true,
      country_code: null,
      language_code: language || "en",
    },
    {
      id: "fallback-3",
      headline: "Support NEWSTACK",
      summary: "Help us keep the news flowing by supporting NEWSTACK.",
      content: "Your support helps us maintain free access to quality news for everyone.",
      ai_analysis: "Support independent news aggregation.",
      why_matters: "Your contribution helps maintain free access to news.",
      perspectives: [],
      source_name: "NEWSTACK",
      source_url: "",
      source_logo: null,
      image_url: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800",
      topic_slug: "world",
      sentiment: "positive",
      trust_score: 100,
      published_at: new Date().toISOString(),
      is_global: true,
      country_code: null,
      language_code: language || "en",
    },
  ];

  return { articles: fallbackArticles, total: fallbackArticles.length };
}

// Fetch news from GNews API
async function fetchFromGNews(params: NewsRequest): Promise<{ articles: unknown[]; total: number } | null> {
  const GNEWS_API_KEY = Deno.env.get("GNEWS_API_KEY");
  if (!GNEWS_API_KEY) return null;

  const { country, topic, language = "en", pageSize = 10, query } = params;

  const urlParams = new URLSearchParams({
    apikey: GNEWS_API_KEY,
    lang: gnewsLanguageCodes[language] || "en",
    max: String(Math.min(pageSize, 10)),
  });

  if (country && gnewsCountryCodes[country]) {
    urlParams.set("country", gnewsCountryCodes[country]);
  }

  let apiUrl: string;
  if (query) {
    apiUrl = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&${urlParams.toString()}`;
  } else if (topic && topicToCategory[topic]) {
    urlParams.set("category", topicToCategory[topic]);
    apiUrl = `https://gnews.io/api/v4/top-headlines?${urlParams.toString()}`;
  } else {
    apiUrl = `https://gnews.io/api/v4/top-headlines?${urlParams.toString()}`;
  }

  console.log(`GNews: ${apiUrl.replace(GNEWS_API_KEY, "***")}`);

  try {
    const response = await fetch(apiUrl);
    
    if (response.status === 403 || response.status === 429) {
      console.warn("GNews rate limit reached");
      return null;
    }

    if (!response.ok) return null;

    const data = await response.json();
    if (!data.articles || data.articles.length === 0) return null;

    const articles = data.articles.map((article: {
      url: string;
      title: string;
      description: string;
      content: string;
      image: string;
      publishedAt: string;
      source: { name: string; url: string };
    }, index: number) => {
      const text = `${article.title} ${article.description}`.toLowerCase();
      let sentiment = "neutral";
      if (["success", "growth", "win", "breakthrough", "record", "surge", "gain"].some(w => text.includes(w))) sentiment = "positive";
      else if (["crisis", "fail", "crash", "loss", "drop", "concern", "threat", "war"].some(w => text.includes(w))) sentiment = "negative";

      let topicSlug = topic || "world";
      if (text.includes("tech") || text.includes("ai") || text.includes("software")) topicSlug = "ai";
      else if (text.includes("sport") || text.includes("game") || text.includes("match")) topicSlug = "sports";
      else if (text.includes("business") || text.includes("market") || text.includes("stock")) topicSlug = "business";
      else if (text.includes("health") || text.includes("medical")) topicSlug = "health";

      return {
        id: article.url || `gnews-${index}`,
        headline: article.title,
        summary: article.description || "",
        content: article.content || article.description || "",
        ai_analysis: article.description || "",
        why_matters: `This ${topicSlug} story is relevant to current events.`,
        perspectives: [],
        source_name: article.source?.name || "Unknown",
        source_url: article.source?.url || "",
        source_logo: null,
        image_url: article.image || null,
        topic_slug: topicSlug,
        sentiment,
        trust_score: 75 + Math.floor(Math.random() * 20),
        published_at: article.publishedAt,
        is_global: !country,
        country_code: country || null,
        language_code: language,
      };
    });

    return { articles, total: data.totalArticles || articles.length };
  } catch (error) {
    console.error("GNews error:", error);
    return null;
  }
}

// Fetch news from MediaStack API (backup)
async function fetchFromMediaStack(params: NewsRequest): Promise<{ articles: unknown[]; total: number } | null> {
  const MEDIASTACK_API_KEY = Deno.env.get("MEDIASTACK_API_KEY");
  if (!MEDIASTACK_API_KEY) return null;

  const { country, topic, language = "en", pageSize = 10, query } = params;

  const urlParams = new URLSearchParams({
    access_key: MEDIASTACK_API_KEY,
    languages: language === "en" ? "en" : language,
    limit: String(Math.min(pageSize, 25)),
    sort: "published_desc",
  });

  if (country) {
    urlParams.set("countries", country.toLowerCase());
  }

  if (topic && topicToCategory[topic]) {
    urlParams.set("categories", topicToCategory[topic]);
  }

  if (query) {
    urlParams.set("keywords", query);
  }

  const apiUrl = `http://api.mediastack.com/v1/news?${urlParams.toString()}`;
  console.log(`MediaStack: fetching news`);

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data.data || data.data.length === 0) return null;

    const articles = data.data.map((article: {
      url: string;
      title: string;
      description: string;
      image: string | null;
      published_at: string;
      source: string;
      category: string;
    }, index: number) => {
      const text = `${article.title} ${article.description || ""}`.toLowerCase();
      let sentiment = "neutral";
      if (["success", "growth", "win", "breakthrough", "record", "surge", "gain"].some(w => text.includes(w))) sentiment = "positive";
      else if (["crisis", "fail", "crash", "loss", "drop", "concern", "threat", "war"].some(w => text.includes(w))) sentiment = "negative";

      return {
        id: article.url || `mediastack-${index}`,
        headline: article.title,
        summary: article.description || "",
        content: article.description || "",
        ai_analysis: article.description || "",
        why_matters: `This story is relevant to current events.`,
        perspectives: [],
        source_name: article.source || "Unknown",
        source_url: "",
        source_logo: null,
        image_url: article.image || null,
        topic_slug: article.category || topic || "world",
        sentiment,
        trust_score: 70 + Math.floor(Math.random() * 20),
        published_at: article.published_at,
        is_global: !country,
        country_code: country || null,
        language_code: language,
      };
    });

    return { articles, total: data.pagination?.total || articles.length };
  } catch (error) {
    console.error("MediaStack error:", error);
    return null;
  }
}

// Generate cache key
function generateCacheKey(params: NewsRequest): string {
  return `news:${params.country || "global"}:${params.topic || "all"}:${params.language || "en"}:${params.query || ""}:${params.page || 1}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const params = await req.json() as NewsRequest;
    const cacheKey = generateCacheKey(params);

    // Initialize Supabase client for caching
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache first
    const { data: cachedData } = await supabase
      .from("cached_news")
      .select("articles, total")
      .eq("cache_key", cacheKey)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (cachedData) {
      console.log("Cache hit for:", cacheKey);
      return new Response(
        JSON.stringify({ articles: cachedData.articles, total: cachedData.total, cached: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Cache miss, fetching fresh news");

    // Try GNews first
    let result = await fetchFromGNews(params);
    let source = "gnews";

    // Try MediaStack as fallback
    if (!result) {
      console.log("GNews failed, trying MediaStack");
      result = await fetchFromMediaStack(params);
      source = "mediastack";
    }

    // Use fallback if all APIs fail
    if (!result) {
      console.log("All APIs failed, using fallback");
      result = generateFallbackNews(params.country, params.topic, params.language);
      source = "fallback";
    }

    // Cache the result (if not fallback)
    if (source !== "fallback") {
      const expiresAt = new Date(Date.now() + CACHE_DURATION_MINUTES * 60 * 1000).toISOString();
      
      await supabase
        .from("cached_news")
        .upsert({
          cache_key: cacheKey,
          articles: result.articles,
          total: result.total,
          source,
          expires_at: expiresAt,
        }, { onConflict: "cache_key" });
    }

    return new Response(
      JSON.stringify({ ...result, source }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching news:", errorMessage);
    
    const fallback = generateFallbackNews();
    return new Response(
      JSON.stringify({ ...fallback, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});