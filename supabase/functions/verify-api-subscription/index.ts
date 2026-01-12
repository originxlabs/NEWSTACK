import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLAN_LIMITS = {
  sandbox: { requests: 100, rateLimit: 2 },
  starter: { requests: 100000, rateLimit: 10 },
  pro: { requests: 1000000, rateLimit: 50 },
  enterprise: { requests: 10000000, rateLimit: 100 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      subscriptionId,
      userId 
    } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !subscriptionId) {
      return new Response(
        JSON.stringify({ error: "Missing payment details" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!razorpayKeySecret) {
      return new Response(
        JSON.stringify({ error: "Payment gateway not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = createHmac("sha256", razorpayKeySecret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return new Response(
        JSON.stringify({ error: "Payment verification failed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the subscription record
    const { data: subscription, error: fetchError } = await supabase
      .from("enterprise_subscriptions")
      .select("*")
      .eq("id", subscriptionId)
      .single();

    if (fetchError || !subscription) {
      return new Response(
        JSON.stringify({ error: "Subscription not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const planLimits = PLAN_LIMITS[subscription.plan_type as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.starter;

    // Update subscription status
    await supabase
      .from("enterprise_subscriptions")
      .update({
        status: "active",
        razorpay_subscription_id: razorpay_payment_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscriptionId);

    // Generate production API key
    const { data: keyData } = await supabase.rpc("generate_api_key");
    const productionKey = keyData.replace("nsk_test_", "nsk_live_");

    // Create or update API key with production access
    const { data: apiKey, error: keyError } = await supabase
      .from("api_keys")
      .insert({
        customer_name: subscription.enterprise_id,
        customer_email: userId ? (await supabase.auth.admin.getUserById(userId)).data.user?.email : "",
        api_key: productionKey,
        plan: subscription.plan_type,
        is_sandbox: false,
        requests_limit: planLimits.requests,
        rate_limit_per_second: planLimits.rateLimit,
        allowed_endpoints: ["news", "world", "places", "streaming", "webhooks"],
        created_by: userId,
        enterprise_id: subscription.enterprise_id,
        subscription_id: subscriptionId,
      })
      .select()
      .single();

    if (keyError) {
      console.error("Failed to create API key:", keyError);
    }

    // Link API key to subscription
    if (apiKey) {
      await supabase
        .from("enterprise_subscriptions")
        .update({ api_key_id: apiKey.id })
        .eq("id", subscriptionId);
    }

    // Update user profile with enterprise status
    if (userId) {
      await supabase
        .from("profiles")
        .update({
          subscription_tier: subscription.plan_type,
          is_premium: true,
          premium_expires_at: subscription.current_period_end,
        })
        .eq("user_id", userId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Subscription activated successfully!",
        apiKey: productionKey,
        enterpriseId: subscription.enterprise_id,
        planType: subscription.plan_type,
        expiresAt: subscription.current_period_end,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error verifying subscription:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
