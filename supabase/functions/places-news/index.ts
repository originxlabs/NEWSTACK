import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const data = await response.json();

    if (data.errors) {
      console.error("GNews error:", data.errors);
      return null;
    }

    if (!data.articles || data.articles.length === 0) {
      return null;
    }

    return data.articles.map((article: any) => ({
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

    return data.data.map((article: any) => ({
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

    // Try GNews first
    let news = await fetchFromGNews(place_name);
    let source = "gnews";

    // Fallback to MediaStack if GNews fails
    if (!news) {
      console.log("GNews failed, trying MediaStack...");
      news = await fetchFromMediaStack(place_name);
      source = "mediastack";
    }

    // Use fallback news if both APIs fail
    if (!news) {
      console.log("All news APIs failed, using fallback news");
      news = generateFallbackNews(place_name);
      source = "fallback";
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
