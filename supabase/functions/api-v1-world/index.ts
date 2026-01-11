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

interface ApiKeyData {
  id: string;
  plan: string;
  is_active: boolean;
  is_sandbox: boolean;
  requests_limit: number;
  requests_used: number;
  rate_limit_per_second: number;
  allowed_endpoints: string[];
}

async function validateApiKey(
  supabase: any,
  apiKey: string | null,
  endpoint: string
): Promise<{ valid: boolean; keyData?: ApiKeyData; error?: string; remaining?: number; isSandbox?: boolean }> {
  // Check for missing API key
  if (!apiKey) {
    return { valid: false, error: "API key required. Pass X-API-Key header." };
  }

  // Validate API key format - must start with nsk_test_ or nsk_live_
  const isTestKey = apiKey.startsWith("nsk_test_");
  const isLiveKey = apiKey.startsWith("nsk_live_");
  
  if (!isTestKey && !isLiveKey) {
    return { valid: false, error: "Invalid API key format. Keys must start with nsk_test_ or nsk_live_" };
  }

  const { data, error } = await supabase
    .from("api_keys")
    .select("id, plan, is_active, is_sandbox, requests_limit, requests_used, rate_limit_per_second, allowed_endpoints")
    .eq("api_key", apiKey)
    .single();

  if (error || !data) {
    return { valid: false, error: "Invalid API key" };
  }

  if (!data.is_active) {
    return { valid: false, error: "API key is inactive" };
  }

  // Check if endpoint is allowed for this plan
  if (!data.allowed_endpoints.includes(endpoint)) {
    return { valid: false, error: `Endpoint '${endpoint}' not available on your plan. Upgrade to access.` };
  }

  // For sandbox keys, enforce 100 requests/day limit
  const effectiveLimit = isTestKey ? 100 : data.requests_limit;
  
  // Check rate limit (requests used vs limit)
  if (data.requests_used >= effectiveLimit) {
    const limitMessage = isTestKey 
      ? "Sandbox daily limit (100 requests) exceeded. Wait until tomorrow or upgrade to production."
      : "Monthly request limit exceeded. Upgrade your plan or wait until next billing cycle.";
    return { valid: false, error: limitMessage };
  }

  return { 
    valid: true, 
    keyData: data,
    remaining: effectiveLimit - data.requests_used,
    isSandbox: isTestKey
  };
}

async function logApiUsage(
  supabase: any,
  apiKeyId: string,
  endpoint: string,
  statusCode: number,
  responseTimeMs: number,
  req: Request
): Promise<void> {
  try {
    await supabase.rpc("increment_api_usage", { key_id: apiKeyId });
    await supabase.from("api_key_usage_logs").insert({
      api_key_id: apiKeyId,
      endpoint,
      method: req.method,
      status_code: statusCode,
      response_time_ms: responseTimeMs,
      ip_address: req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || null,
      user_agent: req.headers.get("user-agent") || null,
    });
    await supabase
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", apiKeyId);
  } catch (err) {
    console.error("Failed to log API usage:", err);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const rateLimitReset = Math.floor(Date.now() / 1000) + 86400;

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    
    const apiKey = req.headers.get("x-api-key");
    const sandboxQueryParam = url.searchParams.get("sandbox") === "true";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Variables for tracking
    let keyData: ApiKeyData | undefined;
    let requestsRemaining = 100;
    let isSandboxMode = sandboxQueryParam;

    // If API key provided, validate it and determine environment from key prefix
    if (apiKey) {
      const validation = await validateApiKey(supabase, apiKey, "world");
      if (!validation.valid) {
        const statusCode = validation.error?.includes("format") ? 403 : 401;
        return new Response(
          JSON.stringify({ error: validation.error }),
          { 
            status: statusCode, 
            headers: { 
              ...corsHeaders, 
              "Content-Type": "application/json",
              "X-RateLimit-Limit": "0",
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": String(rateLimitReset),
              "X-Sandbox": "false"
            } 
          }
        );
      }
      keyData = validation.keyData;
      requestsRemaining = validation.remaining || 0;
      isSandboxMode = validation.isSandbox || false;
    } else if (!sandboxQueryParam) {
      return new Response(
        JSON.stringify({ error: "API key required. Pass X-API-Key header." }),
        { 
          status: 401, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "X-RateLimit-Limit": "0",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(rateLimitReset)
          } 
        }
      );
    }

    // Check if requesting specific region: /api-v1-world/regions/{region}
    const isRegionRequest = pathParts.includes("regions");
    const regionSlug = isRegionRequest && pathParts.length > 2 ? pathParts[pathParts.length - 1] : null;

    const cutoffTime = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    let responseData: any;
    let statusCode = 200;

    if (regionSlug) {
      // Single region detail
      if (!REGION_COUNTRIES[regionSlug]) {
        statusCode = 400;
        responseData = { error: "Invalid region. Valid regions: north-america, europe, asia-pacific, middle-east, africa, south-america" };
      } else {
        const countryCodes = REGION_COUNTRIES[regionSlug];

        const { data: stories, error } = await supabase
          .from("stories")
          .select("id, headline, category, country_code, source_count, first_published_at, confidence_level, story_state")
          .in("country_code", countryCodes)
          .gte("first_published_at", cutoffTime)
          .order("source_count", { ascending: false })
          .order("first_published_at", { ascending: false })
          .limit(isSandboxMode ? 10 : 50);

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

        responseData = {
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
      }
    } else {
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

      responseData = {
        updated_at: new Date().toISOString(),
        total_stories: stories.length,
        regions,
        hotspots: hotspots.map(h => h.id),
        coverage_gaps: regions.filter(r => r.story_count < 3).map(r => r.id)
      };
    }

    const responseTimeMs = Date.now() - startTime;

    // Log usage if we have a valid API key
    if (keyData) {
      await logApiUsage(supabase, keyData.id, "/v1/world", statusCode, responseTimeMs, req);
    }

    return new Response(
      JSON.stringify(responseData),
      { 
        status: statusCode,
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "X-Sandbox": isSandboxMode ? "true" : "false",
          "X-RateLimit-Limit": keyData ? String(isSandboxMode ? 100 : keyData.requests_limit) : "100",
          "X-RateLimit-Remaining": String(Math.max(0, requestsRemaining - 1)),
          "X-RateLimit-Reset": String(rateLimitReset),
          "X-Response-Time": `${responseTimeMs}ms`
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
