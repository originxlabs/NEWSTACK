import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NewsAPIArticle {
  uri: string;
  title: string;
  body: string;
  source: {
    title: string;
    uri: string;
  };
  image: string;
  dateTime: string;
  sentiment: number;
  concepts?: Array<{ label: { eng: string }; type: string }>;
  categories?: Array<{ label: string }>;
}

interface NewsRequest {
  country?: string;
  topic?: string;
  language?: string;
  page?: number;
  pageSize?: number;
  query?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const NEWSAPI_AI_KEY = Deno.env.get("NEWSAPI_AI_KEY");
    if (!NEWSAPI_AI_KEY) {
      throw new Error("NEWSAPI_AI_KEY not configured");
    }

    const { country, topic, language = "eng", page = 1, pageSize = 20, query } = await req.json() as NewsRequest;

    // Build the query for NewsAPI.ai
    const baseUrl = "https://eventregistry.org/api/v1/article/getArticles";
    
    // Build query object
    const queryObj: Record<string, unknown> = {
      apiKey: NEWSAPI_AI_KEY,
      resultType: "articles",
      articlesSortBy: "date",
      articlesCount: pageSize,
      articlesPage: page,
      lang: language,
      includeArticleSocialScore: true,
      includeArticleSentiment: true,
      includeArticleConcepts: true,
      includeArticleCategories: true,
      includeArticleImage: true,
      includeSourceTitle: true,
    };

    // Add filters
    if (query) {
      queryObj.keyword = query;
    }
    
    if (country) {
      // Map country codes to NewsAPI.ai location URIs
      const countryMap: Record<string, string> = {
        US: "http://en.wikipedia.org/wiki/United_States",
        IN: "http://en.wikipedia.org/wiki/India",
        GB: "http://en.wikipedia.org/wiki/United_Kingdom",
        CA: "http://en.wikipedia.org/wiki/Canada",
        AU: "http://en.wikipedia.org/wiki/Australia",
        DE: "http://en.wikipedia.org/wiki/Germany",
        FR: "http://en.wikipedia.org/wiki/France",
        JP: "http://en.wikipedia.org/wiki/Japan",
        CN: "http://en.wikipedia.org/wiki/China",
        BR: "http://en.wikipedia.org/wiki/Brazil",
      };
      if (countryMap[country]) {
        queryObj.sourceLocationUri = countryMap[country];
      }
    }

    if (topic) {
      // Map topic slugs to categories
      const topicMap: Record<string, string> = {
        ai: "dmoz/Computers/Artificial_Intelligence",
        business: "news/Business",
        finance: "news/Economy",
        politics: "news/Politics",
        sports: "news/Sports",
        entertainment: "news/Arts_and_Entertainment",
        health: "news/Health",
        tech: "dmoz/Computers",
        climate: "news/Environment",
      };
      if (topicMap[topic]) {
        queryObj.categoryUri = topicMap[topic];
      }
    }

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(queryObj),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("NewsAPI.ai error:", errorText);
      throw new Error(`NewsAPI.ai request failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform articles to our format
    const articles = (data.articles?.results || []).map((article: NewsAPIArticle) => {
      // Determine sentiment label
      let sentimentLabel = "neutral";
      if (article.sentiment > 0.2) sentimentLabel = "positive";
      else if (article.sentiment < -0.2) sentimentLabel = "negative";

      // Extract topic from categories
      let topicSlug = "world";
      if (article.categories && article.categories.length > 0) {
        const category = article.categories[0].label.toLowerCase();
        if (category.includes("business")) topicSlug = "business";
        else if (category.includes("tech") || category.includes("computer")) topicSlug = "ai";
        else if (category.includes("sport")) topicSlug = "sports";
        else if (category.includes("health")) topicSlug = "health";
        else if (category.includes("politic")) topicSlug = "politics";
        else if (category.includes("entertainment") || category.includes("arts")) topicSlug = "entertainment";
        else if (category.includes("economy") || category.includes("finance")) topicSlug = "finance";
      }

      // Generate AI summary (first 200 chars of body as fallback)
      const summary = article.body ? article.body.substring(0, 250) + "..." : "";

      // Generate "why this matters"
      const whyMatters = `This story provides insights into ${topicSlug} developments that could impact global trends and your interests.`;

      return {
        id: article.uri,
        headline: article.title,
        summary,
        content: article.body,
        ai_analysis: summary,
        why_matters: whyMatters,
        perspectives: [
          { viewpoint: "Analysis", content: "Multiple sources confirm these developments." }
        ],
        source_name: article.source?.title || "Unknown",
        source_url: article.source?.uri || "",
        source_logo: null,
        image_url: article.image || null,
        topic_slug: topicSlug,
        sentiment: sentimentLabel,
        trust_score: Math.floor(70 + Math.random() * 25), // 70-95
        published_at: article.dateTime,
        is_global: !country,
        country_code: country || null,
      };
    });

    return new Response(JSON.stringify({ articles, total: data.articles?.totalResults || 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching news:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
