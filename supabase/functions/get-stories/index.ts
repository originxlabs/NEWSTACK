import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StoryRequest {
  feedType?: "recent" | "trending" | "foryou" | "local" | "world";
  category?: string;
  country?: string;
  userCity?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "latest" | "sources" | "discussed" | "relevance";
  source?: string; // Filter by source name
  dateFrom?: string; // ISO date string for date filtering
  dateTo?: string;
}

// Category taxonomy
const VALID_CATEGORIES = [
  "AI", "Business", "Finance", "Politics", "Startups", "Technology",
  "Climate", "Health", "Sports", "Entertainment", "Science", "World", "India", "Local"
];

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
      userCity,
      page = 1,
      pageSize = 15,
      sortBy = "latest",
      source,
      dateFrom,
      dateTo,
    } = params;

    console.log("Fetching stories:", { feedType, category, country, page, sortBy, source, dateFrom, dateTo });

    // Calculate cutoff for stories
    // Use 48 hours by default to ensure fresh news availability
    // For trending/foryou, use 7 days to show more content
    const now = new Date();
    let defaultCutoff: string;
    
    if (feedType === "recent" && !dateFrom) {
      // Show fresh news from last 48 hours by default for "recent" feed
      defaultCutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
    } else if (feedType === "trending" || feedType === "foryou") {
      // 7 days for trending/personalized feeds to show more content
      defaultCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    } else {
      // 3 days for other feeds
      defaultCutoff = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
    }
    const cutoffTime = dateFrom || defaultCutoff;

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

    // Apply category filter
    if (category && category !== "all") {
      // Normalize category to match database
      const normalizedCategory = VALID_CATEGORIES.find(
        c => c.toLowerCase() === category.toLowerCase()
      );
      if (normalizedCategory) {
        query = query.eq("category", normalizedCategory);
      }
    }

    // Apply feed type specific filters
    if (feedType === "local") {
      // Local: stories with city set OR country-specific stories
      if (userCity) {
        query = query.ilike("city", `%${userCity}%`);
      } else if (country) {
        query = query.eq("country_code", country).eq("is_global", false);
      }
    } else if (feedType === "world") {
      // World: global stories only
      query = query.eq("is_global", true);
    } else if (country) {
      // For other feeds, show country + global stories
      query = query.or(`country_code.eq.${country},is_global.eq.true`);
    }

    // Apply sorting based on feed type and sortBy
    if (feedType === "trending" || sortBy === "sources") {
      query = query
        .gte("source_count", 2)
        .order("source_count", { ascending: false })
        .order("first_published_at", { ascending: false });
    } else if (feedType === "foryou") {
      // Mix of trending and recent for personalized feel
      query = query
        .order("source_count", { ascending: false })
        .order("first_published_at", { ascending: false });
    } else if (sortBy === "relevance") {
      // Order by locality first, then country, then global
      query = query
        .order("city", { ascending: false, nullsFirst: false })
        .order("first_published_at", { ascending: false });
    } else {
      // Default: recent (latest first) - sort by first_published_at for fresh news
      query = query.order("first_published_at", { ascending: false });
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

    // Fetch sources for each story in parallel and filter by source if specified
    let storiesWithSources = await Promise.all(
      stories.map(async (story) => {
        // Fetch sources ordered by published_at ascending to show who reported first
        let sourcesQuery = supabase
          .from("story_sources")
          .select("source_name, source_url, published_at, description")
          .eq("story_id", story.id)
          .order("published_at", { ascending: true })
          .limit(10);
        
        const { data: sources } = await sourcesQuery;

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

        // Determine location relevance (Local → India → World)
        let locationRelevance: "Local" | "Country" | "Global";
        if (story.city) {
          locationRelevance = "Local";
        } else if (story.country_code === country && !story.is_global) {
          locationRelevance = "Country";
        } else {
          locationRelevance = "Global";
        }

        // Use actual fetched sources count for accuracy
        const actualSourceCount = sources?.length || 1;
        
        // Calculate trust score based on source count
        const trustScore = Math.min(95, 70 + actualSourceCount * 5);

        return {
          id: story.id,
          headline: story.headline,
          summary: story.ai_summary || story.summary || "",
          content: story.summary || "",
          ai_analysis: story.ai_summary || story.summary || "",
          why_matters: `This ${story.category || "news"} story is relevant to current events and developments.`,
          perspectives: [],
          source_name: sources?.[0]?.source_name || "Unknown",
          source_url: sources?.[0]?.source_url || "",
          source_logo: null,
          image_url: story.image_url,
          topic_slug: story.category?.toLowerCase() || "world",
          sentiment: "neutral",
          trust_score: trustScore,
          published_at: story.first_published_at,
          is_global: story.is_global,
          country_code: story.country_code,
          city: story.city,
          source_count: actualSourceCount,
          sources: sources || [],
          timestamp,
          location_relevance: locationRelevance,
          is_trending: actualSourceCount >= 2,
        };
      })
    );

    // Filter by source name if specified
    if (source && source !== "all") {
      const sourceNameLower = source.toLowerCase();
      storiesWithSources = storiesWithSources.filter(story => {
        // Check if any of the story's sources match the filter
        const matchesPrimary = story.source_name.toLowerCase().includes(sourceNameLower);
        const matchesAny = story.sources?.some((s: { source_name: string }) => 
          s.source_name.toLowerCase().includes(sourceNameLower)
        );
        return matchesPrimary || matchesAny;
      });
      console.log(`Filtered to ${storiesWithSources.length} stories from source: ${source}`);
    }

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
