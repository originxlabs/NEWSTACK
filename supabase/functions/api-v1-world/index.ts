import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

// Region to country code mapping
const REGION_COUNTRIES: Record<string, string[]> = {
  "north-america": ["US", "CA", "MX"],
  "europe": ["GB", "FR", "DE", "IT", "ES", "NL", "BE", "CH", "AT", "SE", "NO", "DK", "FI", "PL", "PT", "IE", "GR", "CZ", "RO", "HU", "UA", "RU"],
  "asia-pacific": ["CN", "JP", "KR", "IN", "AU", "NZ", "SG", "MY", "TH", "VN", "PH", "ID", "TW", "HK", "PK", "BD", "LK", "NP"],
  "middle-east": ["AE", "SA", "IL", "TR", "IR", "IQ", "QA", "KW", "BH", "OM", "JO", "LB", "SY", "YE", "PS"],
  "africa": ["ZA", "EG", "NG", "KE", "GH", "ET", "TZ", "UG", "MA", "DZ", "TN", "SN", "CI", "CM"],
  "south-america": ["BR", "AR", "CL", "CO", "PE", "VE", "EC", "UY", "PY", "BO"],
};

const REGION_NAMES: Record<string, string> = {
  "north-america": "North America",
  "europe": "Europe",
  "asia-pacific": "Asia Pacific",
  "middle-east": "Middle East",
  "africa": "Africa",
  "south-america": "South America",
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

    // Check if requesting specific region: /api-v1-world/regions/{region}
    const isRegionRequest = pathParts.includes("regions");
    const regionSlug = isRegionRequest && pathParts.length > 2 ? pathParts[pathParts.length - 1] : null;

    const cutoffTime = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    if (regionSlug) {
      // Single region detail
      if (!REGION_COUNTRIES[regionSlug]) {
        return new Response(
          JSON.stringify({ error: "Invalid region. Valid regions: north-america, europe, asia-pacific, middle-east, africa, south-america" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const countryCodes = REGION_COUNTRIES[regionSlug];

      const { data: stories, error } = await supabase
        .from("stories")
        .select("id, headline, category, country_code, source_count, first_published_at, confidence_level, story_state")
        .in("country_code", countryCodes)
        .gte("first_published_at", cutoffTime)
        .order("source_count", { ascending: false })
        .order("first_published_at", { ascending: false })
        .limit(50);

      if (error) throw new Error(error.message);

      const storyList = stories || [];
      
      // Calculate category distribution
      const categoryCount: Record<string, number> = {};
      storyList.forEach(s => {
        const cat = s.category || "uncategorized";
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      });

      const topCategories = Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([category, count]) => ({ category, count }));

      // Determine hotspot status
      const recentCount = storyList.filter(s => 
        new Date(s.first_published_at).getTime() > Date.now() - 6 * 60 * 60 * 1000
      ).length;
      
      let status: "stable" | "active" | "hotspot" = "stable";
      if (recentCount > 10) status = "hotspot";
      else if (recentCount > 5) status = "active";

      const regionResponse = {
        region: regionSlug,
        name: REGION_NAMES[regionSlug],
        status,
        story_count: storyList.length,
        active_narratives: Object.keys(categoryCount).length,
        top_categories: topCategories,
        trending_narrative: topCategories[0]?.category || null,
        stories: storyList.slice(0, 10).map(s => ({
          story_id: s.id,
          headline: sanitizeOutput(s.headline),
          category: s.category,
          confidence: s.confidence_level || "low",
          sources_count: s.source_count || 1,
          first_published_at: s.first_published_at
        }))
      };

      return new Response(
        JSON.stringify(regionResponse),
        { 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "X-Sandbox": isSandbox ? "true" : "false"
          } 
        }
      );
    }

    // World overview - all regions
    const { data: allStories, error } = await supabase
      .from("stories")
      .select("id, headline, category, country_code, source_count, first_published_at")
      .gte("first_published_at", cutoffTime);

    if (error) throw new Error(error.message);

    const stories = allStories || [];

    // Group stories by region
    const regionStats: Record<string, { count: number; categories: Record<string, number>; recentCount: number }> = {};
    
    for (const regionKey of Object.keys(REGION_COUNTRIES)) {
      regionStats[regionKey] = { count: 0, categories: {}, recentCount: 0 };
    }

    stories.forEach(story => {
      for (const [regionKey, countries] of Object.entries(REGION_COUNTRIES)) {
        if (countries.includes(story.country_code || "")) {
          regionStats[regionKey].count++;
          const cat = story.category || "uncategorized";
          regionStats[regionKey].categories[cat] = (regionStats[regionKey].categories[cat] || 0) + 1;
          
          if (new Date(story.first_published_at).getTime() > Date.now() - 6 * 60 * 60 * 1000) {
            regionStats[regionKey].recentCount++;
          }
          break;
        }
      }
    });

    const regions = Object.entries(regionStats).map(([regionKey, stats]) => {
      let status: "stable" | "active" | "hotspot" = "stable";
      if (stats.recentCount > 10) status = "hotspot";
      else if (stats.recentCount > 5) status = "active";

      const topCategories = Object.entries(stats.categories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([category]) => category);

      return {
        id: regionKey,
        name: REGION_NAMES[regionKey],
        status,
        story_count: stats.count,
        active_narratives: Object.keys(stats.categories).length,
        trending_narrative: topCategories[0] || null,
        top_categories: topCategories
      };
    });

    // Identify global hotspots
    const hotspots = regions.filter(r => r.status === "hotspot");

    const worldResponse = {
      updated_at: new Date().toISOString(),
      total_stories: stories.length,
      regions,
      hotspots: hotspots.map(h => h.id),
      coverage_gaps: regions.filter(r => r.story_count < 3).map(r => r.id)
    };

    return new Response(
      JSON.stringify(worldResponse),
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
