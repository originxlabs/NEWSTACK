import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
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
      console.error("Signature verification failed");
      return new Response(
        JSON.stringify({ error: "Payment verification failed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update donation record
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the donation record
    const { data: donation, error: fetchError } = await supabase
      .from("donations")
      .select("*")
      .eq("razorpay_order_id", razorpay_order_id)
      .single();

    if (fetchError || !donation) {
      console.error("Donation not found:", fetchError);
      return new Response(
        JSON.stringify({ error: "Donation not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update donation status
    await supabase
      .from("donations")
      .update({
        status: "completed",
        razorpay_payment_id,
        razorpay_signature,
        premium_granted: true,
      })
      .eq("razorpay_order_id", razorpay_order_id);

    // Grant premium features to user
    if (userId) {
      const premiumExpiry = donation.donation_type === "monthly"
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year for one-time

      await supabase
        .from("profiles")
        .update({
          is_premium: true,
          premium_expires_at: premiumExpiry.toISOString(),
          subscription_tier: "pro",
          total_donations: (donation.amount || 0),
          premium_features: {
            unlimited_tts: true,
            ad_free: true,
            exclusive_topics: true,
            offline_reading: true,
          },
        })
        .eq("user_id", userId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment verified and premium features activated!",
        premium: true,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error verifying payment:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
