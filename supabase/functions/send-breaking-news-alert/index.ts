import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// Using fetch API instead of Resend SDK for compatibility

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AlertRequest {
  storyId?: string;
  headline?: string;
  sourceCount?: number;
  sources?: string[];
  category?: string;
}

/**
 * Send Breaking News Alert
 * 
 * Sends email notifications to subscribers when a story reaches 3+ verified sources,
 * indicating high-confidence breaking news.
 */
const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured - email notifications disabled");
      return new Response(
        JSON.stringify({ success: false, message: "Email notifications not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const params: AlertRequest = await req.json();
    const { storyId, headline, sourceCount, sources, category } = params;

    // Validate - only send for stories with 3+ verified sources
    if (!sourceCount || sourceCount < 3) {
      return new Response(
        JSON.stringify({ success: false, message: "Story needs 3+ sources for alert" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing breaking news alert for story: ${storyId}, sources: ${sourceCount}`);

    // Get active newsletter subscribers
    const { data: subscribers, error: subError } = await supabase
      .from("newsletter_subscribers")
      .select("email")
      .eq("is_active", true)
      .limit(100);

    if (subError || !subscribers || subscribers.length === 0) {
      console.log("No active subscribers found");
      return new Response(
        JSON.stringify({ success: true, message: "No subscribers to notify", sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sourcesList = sources?.slice(0, 5).join(", ") || "Multiple verified sources";
    const categoryBadge = category || "Breaking News";

    // Email template
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NEWSTACK Breaking News Alert</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px 24px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">
                ⚡ BREAKING NEWS
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                ${sourceCount}+ Verified Sources Reporting
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px 24px;">
              <div style="display: inline-block; background: #f0f9ff; color: #0369a1; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 16px;">
                ${categoryBadge}
              </div>
              
              <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: #1e293b; line-height: 1.4;">
                ${headline || "Breaking Story"}
              </h2>
              
              <div style="background: #f1f5f9; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #64748b;">
                  🛡️ Verified by ${sourceCount} trusted sources:
                </p>
                <p style="margin: 0; font-size: 14px; color: #475569;">
                  ${sourcesList}
                </p>
              </div>
              
              <a href="https://newstack.live/news?story=${storyId}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 15px;">
                Read Full Coverage →
              </a>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #64748b;">
                You're receiving this because you subscribed to NEWSTACK alerts.
              </p>
              <a href="https://newstack.live" style="color: #6366f1; text-decoration: none; font-size: 13px; font-weight: 500;">
                NEWSTACK
              </a>
              <span style="color: #cbd5e1; margin: 0 8px;">•</span>
              <span style="color: #94a3b8; font-size: 12px;">Free AI-Powered News</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Send to all subscribers (in batches for performance)
    const batchSize = 50;
    let sentCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);
      const batchEmails = batch.map((s) => s.email);

      try {
        // Use Resend API directly via fetch
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "NEWSTACK <alerts@newstack.live>",
            to: batchEmails,
            subject: `⚡ Breaking: ${headline?.substring(0, 60) || "Major Story"} (${sourceCount}+ sources)`,
            html: emailHtml,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          errors.push(`Batch ${i}: ${errorData.message || response.statusText}`);
        } else {
          sentCount += batchEmails.length;
        }
      } catch (err) {
        errors.push(`Batch ${i}: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }

    console.log(`Breaking news alert sent to ${sentCount} subscribers`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: sentCount,
        total: subscribers.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending breaking news alert:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);