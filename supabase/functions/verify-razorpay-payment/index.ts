import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FROM_EMAIL = "Newstack <no-reply@newstack.live>";

const getThankYouHtml = (name: string, amount: number) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;">
        <tr>
          <td align="center" style="padding:32px 16px;">
            <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;">
              <tr>
                <td style="background:linear-gradient(135deg,#18181b 0%,#27272a 100%);padding:28px 32px;text-align:center;">
                  <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">Thank You for Supporting OpenNews</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:32px;">
                  <p style="margin:0 0 12px;color:#18181b;font-size:18px;font-weight:600;">Hello ${name},</p>
                  <p style="margin:0 0 16px;color:#52525b;font-size:15px;line-height:1.7;">
                    We received your donation of <strong>₹${amount}</strong>. Your contribution helps us build transparent, independent and public-interest journalism infrastructure.
                  </p>
                  <p style="margin:0;color:#52525b;font-size:15px;line-height:1.7;">
                    We’re grateful for your support.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background:#fafafa;padding:20px 32px;border-top:1px solid #e4e4e7;">
                  <p style="margin:0;color:#71717a;font-size:12px;text-align:center;">© ${new Date().getFullYear()} Newstack. All rights reserved.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
`;

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

    if (donation.email) {
      try {
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        if (resendApiKey) {
          const resend = new Resend(resendApiKey);
          const donorName = donation.is_anonymous ? "Supporter" : (donation.donor_name || "Supporter");
          await resend.emails.send({
            from: FROM_EMAIL,
            to: [donation.email],
            subject: "Thank you for supporting OpenNews",
            html: getThankYouHtml(donorName, donation.amount || 0),
          });
        }
      } catch (emailError) {
        console.error("Failed to send thank-you email:", emailError);
      }
    }

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
        message: "Payment verified successfully",
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
