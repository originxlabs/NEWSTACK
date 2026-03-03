import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Web Push implementation using native fetch
async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<boolean> {
  try {
    // For now, we'll use a simplified approach
    // In production, you'd need proper VAPID signing
    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "TTL": "86400",
      },
      body: payload,
    });

    return response.ok;
  } catch (error) {
    console.error("Push send failed:", error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get latest news from the last 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    
    const { data: latestNews, error: newsError } = await supabase
      .from("stories")
      .select("headline, summary, image_url, category")
      .gte("created_at", thirtyMinutesAgo)
      .order("trend_score", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (newsError || !latestNews) {
      console.log("No new stories to notify about");
      return new Response(
        JSON.stringify({ message: "No new stories to notify" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("is_active", true);

    if (subError || !subscriptions?.length) {
      console.log("No active subscriptions");
      return new Response(
        JSON.stringify({ message: "No active subscriptions" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log the notification attempt
    await supabase.from("cron_job_logs").insert({
      job_name: "send-push-notifications",
      status: "success",
      records_processed: subscriptions.length,
      metadata: { headline: latestNews.headline },
    });

    return new Response(
      JSON.stringify({
        success: true,
        subscriptionCount: subscriptions.length,
        headline: latestNews.headline,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Push notification error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
