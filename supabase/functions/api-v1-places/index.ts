import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

function sanitizeOutput(text: string | null): string {
  if (!text) return "";
  let cleaned = text;
  cleaned = cleaned.replace(/&[a-z]+;/gi, "");
  cleaned = cleaned.replace(/<[^>]+>/g, "");
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  return cleaned;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    
    const apiKey = req.headers.get("x-api-key");
    const isSandbox = url.hostname.includes("sandbox") || url.searchParams.get("sandbox") === "true";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse path: /api-v1-places/{place_id} or /api-v1-places/{place_id}/intelligence or /api-v1-places/{place_id}/news
    // For this implementation, place_id can be a city name or country code
    const placeId = pathParts.length > 0 ? pathParts[0] : null;
    const subResource = pathParts.length > 1 ? pathParts[1] : null;

    if (!placeId) {
      return new Response(
        JSON.stringify({ error: "place_id is required. Use city name or country code." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const window = url.searchParams.get("window") || "30d";
    const windowMatch = window.match(/^(\d+)(h|d)$/);
    let windowHours = 30 * 24; // 30 days default
    if (windowMatch) {
      const value = parseInt(windowMatch[1]);
      windowHours = windowMatch[2] === "d" ? value * 24 : value;
    }

    const cutoffTime = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString();

    // Try to find stories for this place
    let query = supabase
      .from("stories")
      .select("id, headline, summary, ai_summary, category, country_code, city, first_published_at, source_count, confidence_level")
      .gte("first_published_at", cutoffTime);

    // Match by city or country code
    const placeIdLower = placeId.toLowerCase();
    if (placeId.length === 2) {
      // Country code
      query = query.eq("country_code", placeId.toUpperCase());
    } else {
      // City name
      query = query.ilike("city", `%${placeId}%`);
    }

    query = query.order("first_published_at", { ascending: false }).limit(50);

    const { data: stories, error } = await query;

    if (error) throw new Error(error.message);

    const storyList = stories || [];

    // Handle different sub-resources
    if (subResource === "intelligence") {
      // Place intelligence summary
      const categories: Record<string, number> = {};
      let totalSources = 0;
      let highConfidenceCount = 0;

      storyList.forEach(s => {
        const cat = s.category || "uncategorized";
        categories[cat] = (categories[cat] || 0) + 1;
        totalSources += s.source_count || 1;
        if (s.confidence_level === "high") highConfidenceCount++;
      });

      const topCategories = Object.entries(categories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([category, count]) => ({ category, count }));

      const recentDevelopments = storyList.slice(0, 5).map(s => sanitizeOutput(s.headline));

      let confidence: "Low" | "Medium" | "High" = "Low";
      if (highConfidenceCount > storyList.length * 0.5) confidence = "High";
      else if (highConfidenceCount > storyList.length * 0.2) confidence = "Medium";

      const intelligenceResponse = {
        place_id: placeId,
        context: `Intelligence summary for ${placeId} based on ${storyList.length} stories from the past ${window}`,
        story_count: storyList.length,
        confidence,
        recent_developments: recentDevelopments,
        top_categories: topCategories,
        average_sources_per_story: storyList.length > 0 ? Math.round(totalSources / storyList.length * 10) / 10 : 0
      };

      return new Response(
        JSON.stringify(intelligenceResponse),
        { 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "X-Sandbox": isSandbox ? "true" : "false"
          } 
        }
      );
    }

    if (subResource === "news") {
      // Local news for place
      const newsResponse = {
        place_id: placeId,
        window,
        total: storyList.length,
        stories: storyList.map(s => ({
          story_id: s.id,
          headline: sanitizeOutput(s.headline),
          summary: sanitizeOutput(s.ai_summary || s.summary || ""),
          category: s.category,
          confidence: s.confidence_level || "low",
          sources_count: s.source_count || 1,
          published_at: s.first_published_at
        }))
      };

      return new Response(
        JSON.stringify(newsResponse),
        { 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "X-Sandbox": isSandbox ? "true" : "false"
          } 
        }
      );
    }

    if (subResource === "essentials") {
      // Nearby essentials - would integrate with places API
      // For now, return structured placeholder
      const category = url.searchParams.get("category");
      
      if (!category || !["hotels", "restaurants", "hospitals", "transport"].includes(category)) {
        return new Response(
          JSON.stringify({ error: "category is required. Valid: hotels, restaurants, hospitals, transport" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const essentialsResponse = {
        place_id: placeId,
        category,
        results: [],
        message: "Essentials data requires Places API integration. Contact sales for access."
      };

      return new Response(
        JSON.stringify(essentialsResponse),
        { 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "X-Sandbox": isSandbox ? "true" : "false"
          } 
        }
      );
    }

    // Basic place info
    const placeResponse = {
      place_id: placeId,
      name: placeId.length === 2 ? placeId.toUpperCase() : placeId.charAt(0).toUpperCase() + placeId.slice(1),
      type: placeId.length === 2 ? "country" : "city",
      location: {
        display_name: placeId,
        country_code: placeId.length === 2 ? placeId.toUpperCase() : storyList[0]?.country_code || null
      },
      story_count: storyList.length,
      endpoints: {
        intelligence: `/places/${placeId}/intelligence`,
        news: `/places/${placeId}/news`,
        essentials: `/places/${placeId}/essentials?category={hotels|restaurants|hospitals|transport}`
      }
    };

    return new Response(
      JSON.stringify(placeResponse),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "X-Sandbox": isSandbox ? "true" : "false",
          "X-RateLimit-Remaining": "999"
        } 
      }
    );

  } catch (error: unknown) {
    console.error("API error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
