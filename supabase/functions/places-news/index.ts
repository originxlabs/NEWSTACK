import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NewsRequest {
  place_name: string;
  country?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GNEWS_API_KEY = Deno.env.get("GNEWS_API_KEY");
    const { place_name, country } = await req.json() as NewsRequest;

    if (!place_name) {
      throw new Error("place_name is required");
    }

    console.log("Fetching news for place:", place_name);

    if (!GNEWS_API_KEY) {
      // Return mock data if no API key
      return new Response(
        JSON.stringify({
          news: [
            {
              title: `Latest updates from ${place_name}`,
              description: "Stay informed about local events and news.",
              source: "Local News",
              publishedAt: new Date().toISOString(),
              url: "#",
            },
          ],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const query = encodeURIComponent(place_name);
    const url = `https://gnews.io/api/v4/search?q=${query}&lang=en&max=5&apikey=${GNEWS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.errors) {
      console.error("GNews error:", data.errors);
      throw new Error("Failed to fetch news");
    }

    const news = (data.articles || []).map((article: any) => ({
      title: article.title,
      description: article.description,
      source: article.source?.name || "Unknown",
      publishedAt: article.publishedAt,
      url: article.url,
      image: article.image,
    }));

    return new Response(
      JSON.stringify({ news }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Place news error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
