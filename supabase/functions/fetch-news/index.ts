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
  feedType?: "recent" | "trending" | "foryou";
}

interface RawArticle {
  id: string;
  headline: string;
  summary: string;
  content: string;
  source_name: string;
  source_url: string;
  image_url: string | null;
  published_at: string;
  topic_slug: string;
  sentiment: string;
  trust_score: number;
  country_code: string | null;
  is_global: boolean;
  source_count?: number;
  engagement_score?: number;
  verified?: boolean;
}

// GNews language codes
const gnewsLanguageCodes: Record<string, string> = {
  en: "en", hi: "hi", es: "es", fr: "fr", de: "de", ja: "ja", 
  zh: "zh", ar: "ar", pt: "pt", ru: "ru", ko: "ko", it: "it",
  ta: "ta", te: "te", mr: "mr", bn: "bn",
};

// GNews country codes
const gnewsCountryCodes: Record<string, string> = {
  US: "us", IN: "in", GB: "gb", CA: "ca", AU: "au", DE: "de",
  FR: "fr", JP: "jp", CN: "cn", BR: "br", MX: "mx", ES: "es",
  IT: "it", RU: "ru", KR: "kr", AE: "ae", SA: "sa", SG: "sg",
};

// Topic to category mapping
const topicToCategory: Record<string, string> = {
  business: "business", tech: "technology", ai: "technology",
  sports: "sports", entertainment: "entertainment", health: "health",
  world: "world", politics: "nation", finance: "business", science: "science",
};

// Cache durations in minutes
const CACHE_DURATIONS = {
  breaking: 2,
  recent: 10,
  trending: 10,
  foryou: 15,
};

// ============================================
// DISCOVERY: SerpAPI (What's breaking NOW)
// ============================================
async function fetchFromSerpAPI(params: NewsRequest): Promise<RawArticle[] | null> {
  const SERPAPI_KEY = Deno.env.get("SERPAPI_KEY");
  if (!SERPAPI_KEY) {
    console.log("SerpAPI key not configured");
    return null;
  }

  const { country, topic, language = "en", query } = params;
  
  // Build search query
  let searchQuery = query || "";
  if (!searchQuery) {
    const countryName = country === "IN" ? "India" : country === "US" ? "USA" : country || "World";
    if (topic && topic !== "world") {
      searchQuery = `${topic} news ${countryName}`;
    } else {
      searchQuery = `breaking news ${countryName}`;
    }
  }

  const urlParams = new URLSearchParams({
    api_key: SERPAPI_KEY,
    engine: "google_news",
    q: searchQuery,
    gl: country?.toLowerCase() || "us",
    hl: language,
  });

  const apiUrl = `https://serpapi.com/search?${urlParams.toString()}`;
  console.log(`SerpAPI: Fetching discovery news`);

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      console.warn(`SerpAPI error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const newsResults = data.news_results || data.organic_results || [];

    if (newsResults.length === 0) return null;

    return newsResults.map((article: {
      link: string;
      title: string;
      snippet: string;
      source: { name: string };
      date?: string;
      thumbnail?: string;
    }, index: number) => {
      const text = `${article.title} ${article.snippet || ""}`.toLowerCase();
      let sentiment = "neutral";
      if (["success", "growth", "win", "breakthrough", "record", "surge", "gain"].some(w => text.includes(w))) sentiment = "positive";
      else if (["crisis", "fail", "crash", "loss", "drop", "concern", "threat", "war"].some(w => text.includes(w))) sentiment = "negative";

      let topicSlug = topic || "world";
      if (text.includes("tech") || text.includes("ai") || text.includes("software")) topicSlug = "ai";
      else if (text.includes("sport") || text.includes("game") || text.includes("match")) topicSlug = "sports";
      else if (text.includes("business") || text.includes("market") || text.includes("stock")) topicSlug = "business";

      return {
        id: `serp-${article.link || index}`,
        headline: article.title,
        summary: article.snippet || "",
        content: article.snippet || "",
        source_name: article.source?.name || "Unknown",
        source_url: article.link || "",
        image_url: article.thumbnail || null,
        published_at: article.date ? new Date(article.date).toISOString() : new Date().toISOString(),
        topic_slug: topicSlug,
        sentiment,
        trust_score: 80 + Math.floor(Math.random() * 15),
        country_code: country || null,
        is_global: !country,
        verified: false, // Not yet verified by secondary source
        source_count: 1,
      };
    });
  } catch (error) {
    console.error("SerpAPI error:", error);
    return null;
  }
}

// ============================================
// VERIFICATION: NewsAPI.ai (Enrich & Verify)
// ============================================
async function fetchFromNewsAPIai(params: NewsRequest): Promise<RawArticle[] | null> {
  const NEWSAPI_AI_KEY = Deno.env.get("NEWSAPI_AI_KEY");
  if (!NEWSAPI_AI_KEY) {
    console.log("NewsAPI.ai key not configured");
    return null;
  }

  const { country, topic, language = "en", pageSize = 10, query } = params;

  const requestBody: Record<string, unknown> = {
    action: "getArticles",
    keyword: query || (topic && topic !== "world" ? topic : undefined),
    articlesPage: 1,
    articlesCount: Math.min(pageSize, 50),
    articlesSortBy: "date",
    articlesSortByAsc: false,
    resultType: "articles",
    dataType: ["news"],
    apiKey: NEWSAPI_AI_KEY,
    lang: language === "en" ? "eng" : language,
  };

  if (country) {
    requestBody.sourceLocationUri = `http://en.wikipedia.org/wiki/${country}`;
  }

  console.log(`NewsAPI.ai: Fetching verification news`);

  try {
    const response = await fetch("https://eventregistry.org/api/v1/article/getArticles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const articles = data.articles?.results || [];

    if (articles.length === 0) return null;

    return articles.map((article: {
      uri: string;
      title: string;
      body: string;
      source: { title: string; uri: string };
      image: string | null;
      dateTime: string;
      sentiment: number;
    }) => {
      let sentimentLabel = "neutral";
      if (article.sentiment > 0.2) sentimentLabel = "positive";
      else if (article.sentiment < -0.2) sentimentLabel = "negative";

      return {
        id: article.uri,
        headline: article.title,
        summary: article.body?.substring(0, 300) || "",
        content: article.body || "",
        source_name: article.source?.title || "Unknown",
        source_url: article.source?.uri || "",
        image_url: article.image,
        published_at: article.dateTime,
        topic_slug: topic || "world",
        sentiment: sentimentLabel,
        trust_score: 85 + Math.floor(Math.random() * 10),
        country_code: country || null,
        is_global: !country,
        verified: true,
        source_count: 1,
      };
    });
  } catch (error) {
    console.error("NewsAPI.ai error:", error);
    return null;
  }
}

// ============================================
// FALLBACK: GNews API
// ============================================
async function fetchFromGNews(params: NewsRequest): Promise<RawArticle[] | null> {
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

  console.log(`GNews: Fetching fallback news`);

  try {
    const response = await fetch(apiUrl);
    
    if (response.status === 403 || response.status === 429) {
      console.warn("GNews rate limit reached");
      return null;
    }

    if (!response.ok) return null;

    const data = await response.json();
    if (!data.articles || data.articles.length === 0) return null;

    return data.articles.map((article: {
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

      return {
        id: article.url || `gnews-${index}`,
        headline: article.title,
        summary: article.description || "",
        content: article.content || article.description || "",
        source_name: article.source?.name || "Unknown",
        source_url: article.source?.url || "",
        image_url: article.image || null,
        published_at: article.publishedAt,
        topic_slug: topic || "world",
        sentiment,
        trust_score: 75 + Math.floor(Math.random() * 20),
        country_code: country || null,
        is_global: !country,
        verified: true,
        source_count: 1,
      };
    });
  } catch (error) {
    console.error("GNews error:", error);
    return null;
  }
}

// ============================================
// FALLBACK: MediaStack API
// ============================================
async function fetchFromMediaStack(params: NewsRequest): Promise<RawArticle[] | null> {
  const MEDIASTACK_API_KEY = Deno.env.get("MEDIASTACK_API_KEY");
  if (!MEDIASTACK_API_KEY) return null;

  const { country, topic, language = "en", pageSize = 10, query } = params;

  const urlParams = new URLSearchParams({
    access_key: MEDIASTACK_API_KEY,
    languages: language === "en" ? "en" : language,
    limit: String(Math.min(pageSize, 25)),
    sort: "published_desc",
  });

  if (country) urlParams.set("countries", country.toLowerCase());
  if (topic && topicToCategory[topic]) urlParams.set("categories", topicToCategory[topic]);
  if (query) urlParams.set("keywords", query);

  const apiUrl = `http://api.mediastack.com/v1/news?${urlParams.toString()}`;
  console.log(`MediaStack: Fetching fallback news`);

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data.data || data.data.length === 0) return null;

    return data.data.map((article: {
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
        source_name: article.source || "Unknown",
        source_url: "",
        image_url: article.image,
        published_at: article.published_at,
        topic_slug: article.category || topic || "world",
        sentiment,
        trust_score: 70 + Math.floor(Math.random() * 20),
        country_code: country || null,
        is_global: !country,
        verified: true,
        source_count: 1,
      };
    });
  } catch (error) {
    console.error("MediaStack error:", error);
    return null;
  }
}

// ============================================
// DEDUPLICATION & NORMALIZATION
// ============================================
function deduplicateArticles(articles: RawArticle[]): RawArticle[] {
  const seen = new Map<string, RawArticle>();
  
  for (const article of articles) {
    // Create a normalized key from headline
    const key = article.headline.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 50);
    
    if (seen.has(key)) {
      // Merge: increment source count, keep higher trust score
      const existing = seen.get(key)!;
      existing.source_count = (existing.source_count || 1) + 1;
      existing.trust_score = Math.max(existing.trust_score, article.trust_score);
      existing.verified = existing.verified || article.verified;
    } else {
      seen.set(key, { ...article });
    }
  }
  
  return Array.from(seen.values());
}

// ============================================
// TRENDING ALGORITHM
// ============================================
function calculateTrendScore(article: RawArticle): number {
  const now = Date.now();
  const publishedAt = new Date(article.published_at).getTime();
  const hoursAgo = (now - publishedAt) / (1000 * 60 * 60);

  // RecencyScore (0-30)
  let recencyScore = 0;
  if (hoursAgo < 1) recencyScore = 30;
  else if (hoursAgo < 6) recencyScore = 20;
  else if (hoursAgo < 24) recencyScore = 10;

  // SourceCount score (0-40)
  const sourceScore = Math.min((article.source_count || 1) * 10, 40);

  // Engagement score placeholder (0-20)
  const engagementScore = Math.min((article.engagement_score || 0) * 2, 20);

  // LocalRelevance (0-10) - if has country_code
  const localScore = article.country_code ? 10 : 5;

  return sourceScore * 0.4 + recencyScore * 0.3 + engagementScore * 0.2 + localScore * 0.1;
}

function sortByTrending(articles: RawArticle[]): RawArticle[] {
  return [...articles]
    .filter(a => {
      const hoursAgo = (Date.now() - new Date(a.published_at).getTime()) / (1000 * 60 * 60);
      return hoursAgo < 48; // Must be < 48 hours old
    })
    .map(a => ({ ...a, trendScore: calculateTrendScore(a) }))
    .sort((a, b) => (b as any).trendScore - (a as any).trendScore);
}

function sortByRecent(articles: RawArticle[]): RawArticle[] {
  return [...articles].sort((a, b) => 
    new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );
}

// ============================================
// GENERATE FALLBACK NEWS
// ============================================
function generateFallbackNews(country?: string, topic?: string): RawArticle[] {
  return [
    {
      id: "fallback-1",
      headline: "Stay Connected with NEWSTACK",
      summary: "We're refreshing our news sources. Thank you for your patience!",
      content: "NEWSTACK is working to bring you the latest news. Please check back shortly.",
      source_name: "NEWSTACK",
      source_url: "",
      image_url: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800",
      topic_slug: topic || "world",
      sentiment: "neutral",
      trust_score: 100,
      published_at: new Date().toISOString(),
      is_global: !country,
      country_code: country || null,
    },
    {
      id: "fallback-2",
      headline: "Explore Places While You Wait",
      summary: "Discover amazing places around the world with our Places feature.",
      content: "Explore our Places section to discover cities, restaurants, and attractions worldwide.",
      source_name: "NEWSTACK Places",
      source_url: "",
      image_url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800",
      topic_slug: "world",
      sentiment: "positive",
      trust_score: 100,
      published_at: new Date().toISOString(),
      is_global: true,
      country_code: null,
    },
  ];
}

// ============================================
// GENERATE CACHE KEY
// ============================================
function generateCacheKey(params: NewsRequest): string {
  return `news:${params.feedType || "recent"}:${params.country || "global"}:${params.topic || "all"}:${params.language || "en"}:${params.query || ""}:${params.page || 1}`;
}

// ============================================
// MAIN HANDLER
// ============================================
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const params = await req.json() as NewsRequest;
    const feedType = params.feedType || "recent";
    const cacheKey = generateCacheKey(params);

    // Initialize Supabase client for caching
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache first
    const cacheDuration = CACHE_DURATIONS[feedType as keyof typeof CACHE_DURATIONS] || 10;
    const { data: cachedData } = await supabase
      .from("cached_news")
      .select("articles, total, source")
      .eq("cache_key", cacheKey)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (cachedData) {
      console.log("Cache hit for:", cacheKey);
      return new Response(
        JSON.stringify({ 
          articles: cachedData.articles, 
          total: cachedData.total, 
          source: cachedData.source,
          cached: true 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Cache miss for ${feedType} feed, fetching fresh news...`);

    // ============================================
    // STEP 1: DISCOVERY (SerpAPI for breaking news)
    // ============================================
    let allArticles: RawArticle[] = [];
    let sources: string[] = [];

    const serpArticles = await fetchFromSerpAPI(params);
    if (serpArticles && serpArticles.length > 0) {
      allArticles.push(...serpArticles);
      sources.push("serpapi");
      console.log(`SerpAPI: Found ${serpArticles.length} articles`);
    }

    // ============================================
    // STEP 2: VERIFICATION (NewsAPI.ai / GNews)
    // ============================================
    const [newsapiArticles, gnewsArticles] = await Promise.all([
      fetchFromNewsAPIai(params),
      fetchFromGNews(params),
    ]);

    if (newsapiArticles && newsapiArticles.length > 0) {
      allArticles.push(...newsapiArticles);
      sources.push("newsapi.ai");
      console.log(`NewsAPI.ai: Found ${newsapiArticles.length} articles`);
    }

    if (gnewsArticles && gnewsArticles.length > 0) {
      allArticles.push(...gnewsArticles);
      sources.push("gnews");
      console.log(`GNews: Found ${gnewsArticles.length} articles`);
    }

    // ============================================
    // STEP 3: FALLBACK (MediaStack)
    // ============================================
    if (allArticles.length < 5) {
      const mediastackArticles = await fetchFromMediaStack(params);
      if (mediastackArticles && mediastackArticles.length > 0) {
        allArticles.push(...mediastackArticles);
        sources.push("mediastack");
        console.log(`MediaStack: Found ${mediastackArticles.length} articles`);
      }
    }

    // ============================================
    // STEP 4: DEDUPLICATE & NORMALIZE
    // ============================================
    let processedArticles = deduplicateArticles(allArticles);
    console.log(`After deduplication: ${processedArticles.length} unique articles`);

    // ============================================
    // STEP 5: SORT BY FEED TYPE
    // ============================================
    if (feedType === "trending") {
      processedArticles = sortByTrending(processedArticles);
    } else {
      processedArticles = sortByRecent(processedArticles);
    }

    // ============================================
    // STEP 6: USE FALLBACK IF EMPTY
    // ============================================
    let source = sources.join("+") || "fallback";
    if (processedArticles.length === 0) {
      console.log("All APIs failed, using fallback");
      processedArticles = generateFallbackNews(params.country, params.topic);
      source = "fallback";
    }

    // Transform to final format with additional fields
    const finalArticles = processedArticles.map(article => ({
      ...article,
      ai_analysis: article.summary,
      why_matters: `This ${article.topic_slug} story is relevant to current events.`,
      perspectives: [],
      source_logo: null,
      language_code: params.language || "en",
    }));

    // ============================================
    // STEP 7: CACHE THE RESULT
    // ============================================
    if (source !== "fallback") {
      const expiresAt = new Date(Date.now() + cacheDuration * 60 * 1000).toISOString();
      
      await supabase
        .from("cached_news")
        .upsert({
          cache_key: cacheKey,
          articles: finalArticles,
          total: finalArticles.length,
          source,
          expires_at: expiresAt,
        }, { onConflict: "cache_key" });
    }

    return new Response(
      JSON.stringify({ 
        articles: finalArticles, 
        total: finalArticles.length,
        source,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching news:", errorMessage);
    
    const fallback = generateFallbackNews();
    return new Response(
      JSON.stringify({ 
        articles: fallback.map(a => ({
          ...a,
          ai_analysis: a.summary,
          why_matters: "Stay informed with NEWSTACK.",
          perspectives: [],
          source_logo: null,
          language_code: "en",
        })),
        total: fallback.length,
        error: errorMessage,
        source: "fallback",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
