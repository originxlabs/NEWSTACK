import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UsageRequest {
  apiKeyId: string;
  endpoint: string;
  method?: string;
  statusCode?: number;
  responseTimeMs?: number;
  isSandbox?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { apiKeyId, endpoint, method, statusCode, responseTimeMs, isSandbox } = await req.json() as UsageRequest;

    if (!apiKeyId || !endpoint) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get API key details
    const { data: apiKey, error: keyError } = await supabase
      .from("api_keys")
      .select("*, enterprise_subscriptions(*)")
      .eq("id", apiKeyId)
      .single();

    if (keyError || !apiKey) {
      return new Response(
        JSON.stringify({ error: "API key not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check rate limits
    if (apiKey.requests_used >= apiKey.requests_limit) {
      return new Response(
        JSON.stringify({ 
          error: "Rate limit exceeded",
          limit: apiKey.requests_limit,
          used: apiKey.requests_used,
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";
    const today = new Date().toISOString().split("T")[0];
    const currentHour = new Date().getHours();

    // Insert detailed usage record
    await supabase.from("api_usage_tracking").insert({
      api_key_id: apiKeyId,
      user_id: apiKey.created_by,
      enterprise_id: apiKey.enterprise_id,
      endpoint,
      method: method || "GET",
      status_code: statusCode || 200,
      response_time_ms: responseTimeMs || 0,
      request_date: today,
      request_hour: currentHour,
      ip_address: ipAddress,
      user_agent: userAgent,
      is_sandbox: isSandbox ?? apiKey.is_sandbox,
    });

    // Update or insert daily aggregation
    const endpointType = endpoint.includes("news") ? "news" : 
                         endpoint.includes("world") ? "world" : 
                         endpoint.includes("places") ? "places" : "other";

    const { data: existingDaily } = await supabase
      .from("api_usage_daily")
      .select("*")
      .eq("api_key_id", apiKeyId)
      .eq("usage_date", today)
      .single();

    if (existingDaily) {
      // Update existing record
      const updates: any = {
        total_requests: existingDaily.total_requests + 1,
      };
      
      if (statusCode && statusCode < 400) {
        updates.successful_requests = existingDaily.successful_requests + 1;
      } else {
        updates.failed_requests = existingDaily.failed_requests + 1;
      }

      if (responseTimeMs) {
        updates.avg_response_time_ms = Math.round(
          (existingDaily.avg_response_time_ms * existingDaily.total_requests + responseTimeMs) / 
          (existingDaily.total_requests + 1)
        );
      }

      if (endpointType === "news") updates.news_requests = existingDaily.news_requests + 1;
      if (endpointType === "world") updates.world_requests = existingDaily.world_requests + 1;
      if (endpointType === "places") updates.places_requests = existingDaily.places_requests + 1;

      await supabase
        .from("api_usage_daily")
        .update(updates)
        .eq("id", existingDaily.id);
    } else {
      // Insert new daily record
      await supabase.from("api_usage_daily").insert({
        api_key_id: apiKeyId,
        usage_date: today,
        total_requests: 1,
        successful_requests: statusCode && statusCode < 400 ? 1 : 0,
        failed_requests: statusCode && statusCode >= 400 ? 1 : 0,
        avg_response_time_ms: responseTimeMs || 0,
        news_requests: endpointType === "news" ? 1 : 0,
        world_requests: endpointType === "world" ? 1 : 0,
        places_requests: endpointType === "places" ? 1 : 0,
      });
    }

    // Increment usage counter on API key
    await supabase
      .from("api_keys")
      .update({
        requests_used: apiKey.requests_used + 1,
        last_used_at: new Date().toISOString(),
      })
      .eq("id", apiKeyId);

    return new Response(
      JSON.stringify({
        success: true,
        usage: {
          used: apiKey.requests_used + 1,
          limit: apiKey.requests_limit,
          remaining: apiKey.requests_limit - apiKey.requests_used - 1,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error tracking usage:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
