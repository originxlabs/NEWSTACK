import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

// Plan limits configuration
const PLAN_LIMITS: Record<string, { requests: number; ratePerSecond: number; endpoints: string[] }> = {
  starter: { requests: 100000, ratePerSecond: 10, endpoints: ["news"] },
  pro: { requests: 1000000, ratePerSecond: 50, endpoints: ["news", "world", "places"] },
  enterprise: { requests: 10000000, ratePerSecond: 200, endpoints: ["news", "world", "places", "streaming", "webhooks"] },
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
    // Increment usage count
    await supabase.rpc("increment_api_usage", { key_id: apiKeyId });
    
    // Log detailed usage
    await supabase.from("api_key_usage_logs").insert({
      api_key_id: apiKeyId,
      endpoint,
      method: req.method,
      status_code: statusCode,
      response_time_ms: responseTimeMs,
      ip_address: req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || null,
      user_agent: req.headers.get("user-agent") || null,
    });

    // Update last_used_at
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
  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Check for API key - environment determined by key prefix, not headers
  const apiKey = req.headers.get("x-api-key");
  const sandboxQueryParam = url.searchParams.get("sandbox") === "true";
  
  // Variables for tracking
  let keyData: ApiKeyData | undefined;
  let requestsRemaining = 100;
  let isSandboxMode = sandboxQueryParam; // Default to query param for demo mode
  let rateLimitReset = Math.floor(Date.now() / 1000) + 86400; // Default: 24h from now
  
  // If API key provided, validate it and determine environment from key prefix
  if (apiKey) {
    const validation = await validateApiKey(supabase, apiKey, "news");
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
    // No API key and not in demo sandbox mode
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

  try {
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

    let responseData: any;
    let statusCode = 200;

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
        statusCode = 404;
        responseData = { error: "Story not found" };
      } else {
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

        responseData = {
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
      }
    } else {
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
        .limit(isSandboxMode ? 10 : 50); // Limit sandbox to 10 results

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

      responseData = {
        updated_at: new Date().toISOString(),
        stories: apiStories
      };
    }

    const responseTimeMs = Date.now() - startTime;

    // Log usage if we have a valid API key
    if (keyData) {
      await logApiUsage(supabase, keyData.id, "/v1/news", statusCode, responseTimeMs, req);
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
    const responseTimeMs = Date.now() - startTime;
    
    if (keyData) {
      await logApiUsage(supabase, keyData.id, "/v1/news", 500, responseTimeMs, req);
    }
    
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
