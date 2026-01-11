import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

// Verified sources list
const VERIFIED_SOURCES = [
  "Reuters", "AP News", "Associated Press", "AFP", "PTI",
  "BBC", "CNN", "Al Jazeera", "NPR", "NBC News", "CBS News", "ABC News",
  "New York Times", "Washington Post", "The Guardian", "Financial Times", "Wall Street Journal",
  "Bloomberg", "CNBC", "Forbes", "TechCrunch", "The Verge", "Wired"
];

function isVerifiedSource(sourceName: string): boolean {
  const normalized = sourceName.toLowerCase();
  return VERIFIED_SOURCES.some(vs => normalized.includes(vs.toLowerCase()));
}

function sanitizeOutput(text: string | null): string {
  if (!text) return "";
  let cleaned = text;
  const entityMap: Record<string, string> = {
    "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": "\"", "&apos;": "'",
    "&#39;": "'", "&nbsp;": " ", "&ndash;": "-", "&mdash;": "—",
    "&lsquo;": "'", "&rsquo;": "'", "&ldquo;": "\"", "&rdquo;": "\"", "&hellip;": "...",
  };
  for (const [entity, char] of Object.entries(entityMap)) {
    cleaned = cleaned.replace(new RegExp(entity, "gi"), char);
  }
  cleaned = cleaned.replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)));
  cleaned = cleaned.replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  cleaned = cleaned.replace(/<[^>]+>/g, "");
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  return cleaned;
}

function determineStoryState(sourceCount: number, verifiedCount: number, ageMinutes: number): string {
  if (sourceCount === 1) return "single-source";
  if (ageMinutes < 30) return "developing";
  if (sourceCount >= 4 && verifiedCount >= 2) return "confirmed";
  return "developing";
}

function determineConfidence(sourceCount: number, verifiedCount: number): "Low" | "Medium" | "High" {
  if (sourceCount === 1 || verifiedCount === 0) return "Low";
  if (sourceCount >= 4 && verifiedCount >= 2) return "High";
  return "Medium";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    
    // Check for API key (in production, validate against stored keys)
    const apiKey = req.headers.get("x-api-key");
    const isSandbox = url.hostname.includes("sandbox") || url.searchParams.get("sandbox") === "true";
    
    // For now, allow requests without key for demo (in production, require valid key)
    if (!apiKey && !isSandbox) {
      // Still allow for demo purposes, but log
      console.log("Request without API key - demo mode");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse path: /api-v1-news or /api-v1-news/{story_id}
    const storyId = pathParts.length > 1 ? pathParts[1] : null;
    
    // Query parameters
    const category = url.searchParams.get("category");
    const confidence = url.searchParams.get("confidence");
    const window = url.searchParams.get("window") || "24h";

    // Parse window to hours
    const windowMatch = window.match(/^(\d+)(h|d)$/);
    let windowHours = 24;
    if (windowMatch) {
      const value = parseInt(windowMatch[1]);
      windowHours = windowMatch[2] === "d" ? value * 24 : value;
    }

    const cutoffTime = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString();

    if (storyId) {
      // Single story detail
      const { data: story, error } = await supabase
        .from("stories")
        .select(`
          id, headline, summary, ai_summary, category, country_code, city,
          is_global, first_published_at, last_updated_at, source_count, image_url,
          story_state, confidence_level, has_contradictions
        `)
        .eq("id", storyId)
        .single();

      if (error || !story) {
        return new Response(
          JSON.stringify({ error: "Story not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get sources
      const { data: sources } = await supabase
        .from("story_sources")
        .select("source_name, source_url, published_at, description, is_primary_reporting")
        .eq("story_id", storyId)
        .order("published_at", { ascending: true });

      const actualSources = sources || [];
      const verifiedCount = actualSources.filter(s => isVerifiedSource(s.source_name)).length;

      // Build timeline from sources
      const timeline = actualSources.map(s => 
        `${new Date(s.published_at).toISOString()}: ${s.source_name} - ${sanitizeOutput(s.description || "Reported this story")}`
      );

      const storyDetail = {
        story_id: story.id,
        headline: sanitizeOutput(story.headline),
        summary: sanitizeOutput(story.ai_summary || story.summary || ""),
        state: story.story_state || determineStoryState(actualSources.length, verifiedCount, 60),
        confidence: story.confidence_level?.charAt(0).toUpperCase() + story.confidence_level?.slice(1) || 
                   determineConfidence(actualSources.length, verifiedCount),
        sources_count: actualSources.length,
        verified_sources_count: verifiedCount,
        has_contradictions: story.has_contradictions || false,
        first_published_at: story.first_published_at,
        last_updated_at: story.last_updated_at,
        category: story.category,
        location: {
          country_code: story.country_code,
          city: story.city,
          is_global: story.is_global
        },
        image_url: story.image_url,
        timeline,
        sources: actualSources.map(s => ({
          name: s.source_name,
          url: s.source_url,
          published_at: s.published_at,
          is_primary: s.is_primary_reporting
        }))
      };

      return new Response(
        JSON.stringify(storyDetail),
        { 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "X-Sandbox": isSandbox ? "true" : "false"
          } 
        }
      );
    }

    // Story feed
    let query = supabase
      .from("stories")
      .select(`
        id, headline, summary, ai_summary, category, country_code, city,
        is_global, first_published_at, last_updated_at, source_count, image_url,
        story_state, confidence_level, verified_source_count
      `)
      .gte("first_published_at", cutoffTime)
      .order("source_count", { ascending: false })
      .order("first_published_at", { ascending: false })
      .limit(50);

    // Apply filters
    if (category) {
      query = query.ilike("category", category);
    }

    const { data: stories, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch stories: ${error.message}`);
    }

    // Filter by confidence if specified
    let filteredStories = stories || [];
    if (confidence) {
      filteredStories = filteredStories.filter(s => {
        const storyConf = s.confidence_level || "low";
        return storyConf.toLowerCase() === confidence.toLowerCase();
      });
    }

    // Transform to API schema
    const apiStories = await Promise.all(filteredStories.map(async (story) => {
      // Get sources for each story
      const { data: sources } = await supabase
        .from("story_sources")
        .select("source_name, published_at")
        .eq("story_id", story.id)
        .limit(5);

      const actualSources = sources || [];
      const verifiedCount = actualSources.filter(s => isVerifiedSource(s.source_name)).length;

      return {
        story_id: story.id,
        headline: sanitizeOutput(story.headline),
        state: story.story_state || determineStoryState(actualSources.length, verifiedCount, 60),
        confidence: story.confidence_level?.charAt(0).toUpperCase() + story.confidence_level?.slice(1) || 
                   determineConfidence(actualSources.length, verifiedCount),
        sources_count: actualSources.length || story.source_count || 1,
        category: story.category,
        first_published_at: story.first_published_at,
        timeline: actualSources.slice(0, 3).map(s => 
          `${new Date(s.published_at).toISOString()}: ${s.source_name}`
        )
      };
    }));

    const response = {
      updated_at: new Date().toISOString(),
      stories: apiStories
    };

    return new Response(
      JSON.stringify(response),
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
