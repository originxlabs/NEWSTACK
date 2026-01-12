import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-enterprise-id, x-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKeyHeader = req.headers.get("x-api-key");
    const enterpriseId = req.headers.get("x-enterprise-id");
    const signature = req.headers.get("x-signature");

    if (!apiKeyHeader) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: "API key required",
          code: "MISSING_API_KEY"
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find API key
    const { data: apiKey, error } = await supabase
      .from("api_keys")
      .select("*, enterprise_subscriptions(*)")
      .eq("api_key", apiKeyHeader)
      .single();

    if (error || !apiKey) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: "Invalid API key",
          code: "INVALID_API_KEY"
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if key is active
    if (!apiKey.is_active) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: "API key is inactive",
          code: "INACTIVE_KEY"
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check expiration
    if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: "API key has expired",
          code: "EXPIRED_KEY"
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check rate limits
    if (apiKey.requests_used >= apiKey.requests_limit) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: "Rate limit exceeded",
          code: "RATE_LIMIT_EXCEEDED",
          limit: apiKey.requests_limit,
          used: apiKey.requests_used,
          resetDate: "First of next month"
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For production keys, validate enterprise ID and signature
    if (!apiKey.is_sandbox) {
      if (!enterpriseId || enterpriseId !== apiKey.enterprise_id) {
        return new Response(
          JSON.stringify({ 
            valid: false, 
            error: "Enterprise ID mismatch",
            code: "ENTERPRISE_ID_MISMATCH"
          }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate signature if provided (for enhanced security)
      if (signature) {
        const timestamp = req.headers.get("x-timestamp") || Date.now().toString();
        const body = await req.clone().text();
        const payload = `${timestamp}.${body}`;
        
        const expectedSignature = createHmac("sha256", apiKeyHeader)
          .update(payload)
          .digest("hex");

        if (signature !== expectedSignature) {
          return new Response(
            JSON.stringify({ 
              valid: false, 
              error: "Invalid signature",
              code: "INVALID_SIGNATURE"
            }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Check subscription status for production keys
      const subscription = apiKey.enterprise_subscriptions;
      if (subscription && subscription.status !== "active") {
        return new Response(
          JSON.stringify({ 
            valid: false, 
            error: "Subscription is not active",
            code: "INACTIVE_SUBSCRIPTION",
            subscriptionStatus: subscription.status
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if subscription has expired
      if (subscription && new Date(subscription.current_period_end) < new Date()) {
        return new Response(
          JSON.stringify({ 
            valid: false, 
            error: "Subscription has expired",
            code: "EXPIRED_SUBSCRIPTION",
            expiredAt: subscription.current_period_end
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({
        valid: true,
        apiKey: {
          id: apiKey.id,
          plan: apiKey.plan,
          isSandbox: apiKey.is_sandbox,
          enterpriseId: apiKey.enterprise_id,
          usage: {
            used: apiKey.requests_used,
            limit: apiKey.requests_limit,
            remaining: apiKey.requests_limit - apiKey.requests_used,
          },
          rateLimit: apiKey.rate_limit_per_second,
          allowedEndpoints: apiKey.allowed_endpoints,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error validating API key:", error);
    return new Response(
      JSON.stringify({ valid: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
