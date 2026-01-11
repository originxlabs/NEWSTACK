import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WebhookDeliveryRequest {
  subscription_id?: string;
  event_type: string;
  payload: Record<string, unknown>;
  test?: boolean;
  broadcast?: boolean;
}

async function signPayload(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

interface Subscription {
  id: string;
  webhook_url: string;
  secret: string;
  events: string[];
}

async function deliverWebhook(
  supabase: any,
  subscription: Subscription,
  eventType: string,
  payload: Record<string, unknown>,
  isTest: boolean = false
): Promise<{ success: boolean; statusCode?: number; error?: string; deliveryTimeMs: number }> {
  const startTime = Date.now();
  
  const webhookPayload = {
    event: eventType,
    timestamp: new Date().toISOString(),
    test: isTest,
    data: payload,
  };

  const payloadString = JSON.stringify(webhookPayload);
  const signature = await signPayload(payloadString, subscription.secret);

  try {
    const response = await fetch(subscription.webhook_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-NEWSTACK-Signature": signature,
        "X-NEWSTACK-Event": eventType,
        "X-NEWSTACK-Timestamp": webhookPayload.timestamp,
      },
      body: payloadString,
    });

    const deliveryTimeMs = Date.now() - startTime;
    const responseBody = await response.text().catch(() => "");

    // Log the delivery
    await supabase.from("webhook_delivery_logs").insert({
      subscription_id: subscription.id,
      event_type: eventType,
      payload: webhookPayload,
      status_code: response.status,
      response_body: responseBody.substring(0, 1000),
      delivery_time_ms: deliveryTimeMs,
      attempt_number: 1,
      success: response.ok,
      error_message: response.ok ? null : `HTTP ${response.status}`,
    });

    // Update subscription status
    await supabase
      .from("webhook_subscriptions")
      .update({
        last_triggered_at: new Date().toISOString(),
        last_status_code: response.status,
        last_error: response.ok ? null : `HTTP ${response.status}`,
      })
      .eq("id", subscription.id);

    return {
      success: response.ok,
      statusCode: response.status,
      deliveryTimeMs,
    };
  } catch (error: unknown) {
    const deliveryTimeMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Log failed delivery
    await supabase.from("webhook_delivery_logs").insert({
      subscription_id: subscription.id,
      event_type: eventType,
      payload: webhookPayload,
      status_code: null,
      delivery_time_ms: deliveryTimeMs,
      attempt_number: 1,
      success: false,
      error_message: errorMessage,
    });

    // Update subscription with error
    await supabase
      .from("webhook_subscriptions")
      .update({
        last_triggered_at: new Date().toISOString(),
        last_error: errorMessage,
      })
      .eq("id", subscription.id);

    return {
      success: false,
      error: errorMessage,
      deliveryTimeMs,
    };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: WebhookDeliveryRequest = await req.json();
    const { subscription_id, event_type, payload, test, broadcast } = body;

    if (!event_type || !payload) {
      return new Response(
        JSON.stringify({ error: "event_type and payload are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: Array<{ subscription_id: string; success: boolean; statusCode?: number; error?: string }> = [];

    if (broadcast) {
      // Deliver to all active subscriptions listening to this event
      const { data: subscriptions, error } = await supabase
        .from("webhook_subscriptions")
        .select("id, webhook_url, secret, events")
        .eq("is_active", true)
        .contains("events", [event_type]);

      if (error) throw error;

      for (const sub of subscriptions || []) {
        const result = await deliverWebhook(supabase, sub, event_type, payload, test || false);
        results.push({
          subscription_id: sub.id,
          success: result.success,
          statusCode: result.statusCode,
          error: result.error,
        });
      }
    } else if (subscription_id) {
      // Deliver to specific subscription
      const { data: subscription, error } = await supabase
        .from("webhook_subscriptions")
        .select("id, webhook_url, secret, events")
        .eq("id", subscription_id)
        .single();

      if (error || !subscription) {
        return new Response(
          JSON.stringify({ error: "Subscription not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const result = await deliverWebhook(supabase, subscription, event_type, payload, test || false);
      results.push({
        subscription_id: subscription.id,
        success: result.success,
        statusCode: result.statusCode,
        error: result.error,
      });
    } else {
      return new Response(
        JSON.stringify({ error: "Either subscription_id or broadcast must be provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        delivered: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Webhook delivery error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
