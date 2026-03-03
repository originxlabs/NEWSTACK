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
      const validation = await validateApiKey(supabase, apiKey, "places");
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

    // Parse path: /api-v1-places/{place_id} or /api-v1-places/{place_id}/intelligence or /api-v1-places/{place_id}/news
    const placeId = pathParts.length > 0 ? pathParts[0] : null;
    const subResource = pathParts.length > 1 ? pathParts[1] : null;

    if (!placeId) {
      return new Response(
        JSON.stringify({ error: "place_id is required. Use city name or country code." }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "X-Sandbox": isSandboxMode ? "true" : "false"
          } 
        }
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
      query = query.eq("country_code", placeId.toUpperCase());
    } else {
      query = query.ilike("city", `%${placeId}%`);
    }

    query = query.order("first_published_at", { ascending: false }).limit(isSandboxMode ? 10 : 50);

    const { data: stories, error } = await query;

    if (error) throw new Error(error.message);

    const storyList = stories || [];

    let responseData: any;
    let statusCode = 200;

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

      responseData = {
        place_id: placeId,
        context: `Intelligence summary for ${placeId} based on ${storyList.length} stories from the past ${window}`,
        story_count: storyList.length,
        confidence,
        recent_developments: recentDevelopments,
        top_categories: topCategories,
        average_sources_per_story: storyList.length > 0 ? Math.round(totalSources / storyList.length * 10) / 10 : 0
      };
    } else if (subResource === "news") {
      // Local news for place
      responseData = {
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
    } else if (subResource === "essentials") {
      // Nearby essentials - would integrate with places API
      const category = url.searchParams.get("category");
      
      if (!category || !["hotels", "restaurants", "hospitals", "transport"].includes(category)) {
        return new Response(
          JSON.stringify({ error: "category is required. Valid: hotels, restaurants, hospitals, transport" }),
          { 
            status: 400, 
            headers: { 
              ...corsHeaders, 
              "Content-Type": "application/json",
              "X-Sandbox": isSandboxMode ? "true" : "false"
            } 
          }
        );
      }

      responseData = {
        place_id: placeId,
        category,
        results: [],
        message: "Essentials data requires Places API integration. Contact sales for access."
      };
    } else {
      // Basic place info
      responseData = {
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
    }

    const responseTimeMs = Date.now() - startTime;

    // Log usage if we have a valid API key
    if (keyData) {
      await logApiUsage(supabase, keyData.id, "/v1/places", statusCode, responseTimeMs, req);
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
