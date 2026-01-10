import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

// Generate fallback news when API limit is reached
function generateFallbackNews(country?: string, topic?: string, language?: string): { articles: unknown[]; total: number } {
  const fallbackArticles = [
    {
      id: "fallback-1",
      headline: "Stay Connected with NEWSTACK",
      summary: "We're experiencing high demand. News will refresh soon. Thank you for your patience!",
      content: "NEWSTACK is working to bring you the latest news. Our news sources are being refreshed. Please check back shortly for updated content.",
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
      content: "Your support helps us maintain free access to quality news for everyone. Consider donating to keep NEWSTACK running.",
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { country, topic, language = "en", page = 1, pageSize = 10, query } = await req.json() as NewsRequest;

    const GNEWS_API_KEY = Deno.env.get("GNEWS_API_KEY");
    
    // If no API key, return fallback
    if (!GNEWS_API_KEY) {
      console.log("No GNEWS_API_KEY configured, returning fallback news");
      const fallback = generateFallbackNews(country, topic, language);
      return new Response(
        JSON.stringify(fallback),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build GNews API URL
    let apiUrl: string;
    const params = new URLSearchParams({
      apikey: GNEWS_API_KEY,
      lang: gnewsLanguageCodes[language] || "en",
      max: String(Math.min(pageSize, 10)), // GNews free tier max is 10
    });

    // Add country filter
    if (country && gnewsCountryCodes[country]) {
      params.set("country", gnewsCountryCodes[country]);
    }

    if (query) {
      // Search endpoint
      apiUrl = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&${params.toString()}`;
    } else if (topic && topicToCategory[topic]) {
      // Top headlines with category
      params.set("category", topicToCategory[topic]);
      apiUrl = `https://gnews.io/api/v4/top-headlines?${params.toString()}`;
    } else {
      // General top headlines
      apiUrl = `https://gnews.io/api/v4/top-headlines?${params.toString()}`;
    }

    console.log(`Fetching news from: ${apiUrl.replace(GNEWS_API_KEY, "***")}`);

    const response = await fetch(apiUrl);

    // Handle rate limit / quota exceeded - return fallback gracefully
    if (response.status === 403 || response.status === 429) {
      const errorText = await response.text();
      console.warn("GNews rate limit reached:", errorText);
      const fallback = generateFallbackNews(country, topic, language);
      return new Response(
        JSON.stringify({ ...fallback, rateLimited: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("GNews error:", errorText);
      throw new Error(`GNews API failed: ${response.status}`);
    }

    const data = await response.json();

    // If no articles returned, use fallback
    if (!data.articles || data.articles.length === 0) {
      console.log("No articles returned from GNews, using fallback");
      const fallback = generateFallbackNews(country, topic, language);
      return new Response(
        JSON.stringify(fallback),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Transform GNews articles to our format
    const articles = data.articles.map((article: {
      url: string;
      title: string;
      description: string;
      content: string;
      image: string;
      publishedAt: string;
      source: { name: string; url: string };
    }, index: number) => {
      // Determine sentiment based on keywords (simple heuristic)
      const text = `${article.title} ${article.description}`.toLowerCase();
      let sentiment = "neutral";
      const positiveWords = ["success", "growth", "win", "breakthrough", "record", "surge", "gain"];
      const negativeWords = ["crisis", "fail", "crash", "loss", "drop", "concern", "threat", "war"];
      
      if (positiveWords.some(w => text.includes(w))) sentiment = "positive";
      else if (negativeWords.some(w => text.includes(w))) sentiment = "negative";

      // Determine topic from category or keywords
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
        why_matters: `This ${topicSlug} story is relevant to current events in ${country || "the world"}.`,
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

    return new Response(
      JSON.stringify({ articles, total: data.totalArticles || articles.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching news:", errorMessage);
    
    // On any error, return fallback news instead of failing
    const fallback = generateFallbackNews();
    return new Response(
      JSON.stringify({ ...fallback, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
