import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StoryRequest {
  feedType?: "recent" | "trending" | "foryou";
  category?: string;
  country?: string;
  page?: number;
  pageSize?: number;
  userLocation?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const params = await req.json() as StoryRequest;
    const {
      feedType = "recent",
      category,
      country,
      page = 1,
      pageSize = 15,
    } = params;

    console.log("Fetching stories:", { feedType, category, country, page });

    // Calculate cutoff for stories (48 hours ago)
    const cutoffTime = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    // Build query
    let query = supabase
      .from("stories")
      .select(`
        id,
        headline,
        summary,
        ai_summary,
        category,
        country_code,
        city,
        is_global,
        first_published_at,
        last_updated_at,
        source_count,
        trend_score,
        image_url,
        engagement_reads,
        engagement_listens
      `)
      .gte("first_published_at", cutoffTime);

    // Apply filters
    if (category && category !== "all" && category !== "world") {
      query = query.eq("category", category);
    }

    if (country) {
      // Show stories from user's country OR global stories
      query = query.or(`country_code.eq.${country},is_global.eq.true`);
    }

    // Apply sorting based on feed type
    if (feedType === "trending") {
      query = query
        .gte("source_count", 2) // Must have at least 2 sources
        .order("source_count", { ascending: false })
        .order("last_updated_at", { ascending: false });
    } else if (feedType === "foryou") {
      // For personalized, mix trending with recent
      query = query
        .order("source_count", { ascending: false })
        .order("last_updated_at", { ascending: false });
    } else {
      // Recent - sort by last updated
      query = query.order("last_updated_at", { ascending: false });
    }

    // Pagination
    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);

    const { data: stories, error: storiesError } = await query;

    if (storiesError) {
      console.error("Stories query error:", storiesError);
      throw new Error(`Failed to fetch stories: ${storiesError.message}`);
    }

    if (!stories || stories.length === 0) {
      console.log("No stories found, returning empty array");
      return new Response(
        JSON.stringify({ articles: [], total: 0, source: "newstack" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${stories.length} stories`);

    // Fetch sources for each story in parallel
    const storiesWithSources = await Promise.all(
      stories.map(async (story) => {
        const { data: sources } = await supabase
          .from("story_sources")
          .select("source_name, source_url, published_at")
          .eq("story_id", story.id)
          .order("published_at", { ascending: false })
          .limit(5);

        // Calculate relative time
        const publishedDate = new Date(story.first_published_at);
        const now = new Date();
        const diffMs = now.getTime() - publishedDate.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        
        let timestamp: string;
        if (diffMins < 1) {
          timestamp = "Just now";
        } else if (diffMins < 60) {
          timestamp = `${diffMins}m ago`;
        } else if (diffHours < 24) {
          timestamp = `${diffHours}h ago`;
        } else {
          timestamp = `${Math.floor(diffHours / 24)}d ago`;
        }

        // Determine location relevance based on country match
        let locationRelevance = "Global";
        if (story.city) {
          locationRelevance = "Local";
        } else if (story.country_code && story.country_code === country) {
          locationRelevance = "Country";
        } else if (story.country_code) {
          locationRelevance = "Country";
        }

        return {
          id: story.id,
          headline: story.headline,
          summary: story.ai_summary || story.summary || "",
          content: story.summary || "",
          ai_analysis: story.ai_summary || story.summary || "",
          why_matters: `This ${story.category || "news"} story is relevant to current events.`,
          perspectives: [],
          source_name: sources?.[0]?.source_name || "Unknown",
          source_url: sources?.[0]?.source_url || "",
          source_logo: null,
          image_url: story.image_url,
          topic_slug: story.category || "world",
          sentiment: "neutral",
          trust_score: Math.min(95, 70 + (story.source_count || 1) * 5),
          published_at: story.first_published_at,
          is_global: story.is_global,
          country_code: story.country_code,
          source_count: story.source_count || 1,
          sources: sources || [],
          timestamp,
          location_relevance: locationRelevance,
          is_trending: (story.source_count || 0) >= 2,
        };
      })
    );

    return new Response(
      JSON.stringify({
        articles: storiesWithSources,
        total: storiesWithSources.length,
        source: "newstack",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Get stories error:", message);

    return new Response(
      JSON.stringify({ articles: [], total: 0, error: message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
