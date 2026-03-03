import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubscriptionRequest {
  planType: 'starter' | 'pro' | 'enterprise';
  billingCycle: 'monthly' | 'annual';
  userId: string;
  email: string;
  companyName?: string;
}

const PLAN_PRICES = {
  starter: { monthly: 29900, annual: 24900 }, // in paise
  pro: { monthly: 120000, annual: 99900 },
  enterprise: { monthly: 0, annual: 0 }, // Custom pricing
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { planType, billingCycle, userId, email, companyName } = await req.json() as SubscriptionRequest;

    if (!planType || !billingCycle || !userId || !email) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (planType === 'enterprise') {
      return new Response(
        JSON.stringify({ error: "Please contact sales for enterprise plans" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!razorpayKeyId || !razorpayKeySecret) {
      return new Response(
        JSON.stringify({ error: "Payment gateway not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate enterprise ID
    const enterpriseId = `ENT-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;
    
    const price = PLAN_PRICES[planType][billingCycle];
    const periodMonths = billingCycle === 'annual' ? 12 : 1;
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + periodMonths);

    // Create Razorpay order
    const orderData = {
      amount: price,
      currency: "INR",
      receipt: `api_sub_${Date.now()}`,
      notes: {
        email,
        plan_type: planType,
        billing_cycle: billingCycle,
        user_id: userId,
        enterprise_id: enterpriseId,
        company_name: companyName || "",
      },
    };

    const authHeader = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    
    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${authHeader}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    });

    if (!razorpayResponse.ok) {
      const errorText = await razorpayResponse.text();
      console.error("Razorpay order creation failed:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to create payment order" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const order = await razorpayResponse.json();

    // Create pending subscription record
    const { data: subscription, error: subError } = await supabase
      .from("enterprise_subscriptions")
      .insert({
        user_id: userId,
        plan_type: planType,
        billing_cycle: billingCycle,
        status: "pending",
        razorpay_order_id: order.id,
        current_period_end: periodEnd.toISOString(),
        price_paid: price / 100, // Convert from paise to rupees
        enterprise_id: enterpriseId,
      })
      .select()
      .single();

    if (subError) {
      console.error("Failed to create subscription:", subError);
      return new Response(
        JSON.stringify({ error: "Failed to create subscription record" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: razorpayKeyId,
        subscriptionId: subscription.id,
        enterpriseId: enterpriseId,
        planType,
        billingCycle,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating subscription:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
