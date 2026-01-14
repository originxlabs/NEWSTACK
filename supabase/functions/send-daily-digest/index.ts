import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Story {
  id: string;
  headline: string;
  summary: string | null;
  ai_summary: string | null;
  category: string | null;
  source_count: number;
  first_published_at: string;
  image_url: string | null;
  confidence_level: string | null;
}

interface StorySource {
  source_name: string;
  source_url: string;
}

// Verified sources for trust scoring
const VERIFIED_SOURCES = [
  "Reuters", "AP News", "Associated Press", "BBC", "The Guardian", 
  "New York Times", "Washington Post", "Bloomberg", "NDTV", 
  "The Hindu", "Times of India", "Hindustan Times", "India Today",
  "CNN", "Al Jazeera", "Financial Times", "The Economist",
  "Wall Street Journal", "Forbes", "TechCrunch", "ESPN"
];

function isVerifiedSource(name: string): boolean {
  return VERIFIED_SOURCES.some(vs => name.toLowerCase().includes(vs.toLowerCase()));
}

// Get category color
function getCategoryColor(category: string | null): { bg: string; text: string } {
  const colors: Record<string, { bg: string; text: string }> = {
    politics: { bg: "#fef3c7", text: "#d97706" },
    business: { bg: "#dbeafe", text: "#2563eb" },
    technology: { bg: "#ede9fe", text: "#7c3aed" },
    world: { bg: "#dcfce7", text: "#16a34a" },
    sports: { bg: "#fee2e2", text: "#dc2626" },
    entertainment: { bg: "#fce7f3", text: "#db2777" },
    science: { bg: "#e0f2fe", text: "#0284c7" },
    health: { bg: "#d1fae5", text: "#059669" },
  };
  return colors[category?.toLowerCase() || ""] || { bg: "#f3f4f6", text: "#6b7280" };
}

// Get confidence badge
function getConfidenceBadge(level: string | null, verifiedCount: number): string {
  if (level === "high" || verifiedCount >= 2) {
    return `<span style="background: #dcfce7; color: #16a34a; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500;">✓ High Confidence</span>`;
  } else if (level === "medium" || verifiedCount >= 1) {
    return `<span style="background: #fef3c7; color: #d97706; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500;">◐ Medium</span>`;
  }
  return `<span style="background: #fee2e2; color: #dc2626; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500;">○ Developing</span>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const resend = new Resend(resendApiKey);
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get top 20 multi-source stories from the last 24 hours (from all categories)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: stories, error: storiesError } = await supabase
      .from("stories")
      .select("id, headline, summary, ai_summary, category, source_count, first_published_at, image_url, confidence_level")
      .gte("first_published_at", yesterday)
      .order("first_published_at", { ascending: false })
      .limit(20);

    if (storiesError) {
      throw storiesError;
    }

    if (!stories || stories.length === 0) {
      console.log("No multi-source stories found for digest");
      return new Response(
        JSON.stringify({ success: true, message: "No stories to send" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get sources for each story
    const storiesWithSources = await Promise.all(
      stories.map(async (story: Story) => {
        const { data: sources } = await supabase
          .from("story_sources")
          .select("source_name, source_url")
          .eq("story_id", story.id)
          .order("published_at", { ascending: true })
          .limit(5);

        const verifiedCount = (sources || []).filter((s: StorySource) => isVerifiedSource(s.source_name)).length;
        
        return {
          ...story,
          sources: sources || [],
          verifiedCount,
          trustScore: Math.min(100, 60 + (story.source_count * 3) + (verifiedCount * 5))
        };
      })
    );

    // Get active subscribers
    const { data: subscribers, error: subError } = await supabase
      .from("newsletter_subscribers")
      .select("email")
      .eq("is_active", true);

    if (subError) {
      throw subError;
    }

    if (!subscribers || subscribers.length === 0) {
      console.log("No active subscribers");
      return new Response(
        JSON.stringify({ success: true, message: "No subscribers" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate email HTML
    const today = new Date().toLocaleDateString("en-US", { 
      weekday: "long", 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    });

    const storiesHtml = storiesWithSources.map((story, idx) => {
      const catColor = getCategoryColor(story.category);
      const summary = story.ai_summary || story.summary || "";
      // Create link to story on NEWStack
      const storyLink = `https://newstack.live/news?story=${story.id}`;
      
      return `
      <div style="margin-bottom: 16px; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="padding: 16px;">
          <!-- Header -->
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px; flex-wrap: wrap;">
            <span style="background: #18181b; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700;">
              #${idx + 1}
            </span>
            <span style="background: ${catColor.bg}; color: ${catColor.text}; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; text-transform: uppercase;">
              ${story.category || 'News'}
            </span>
            ${story.source_count > 1 ? `<span style="font-size: 10px; color: #16a34a;">📰 ${story.source_count} sources</span>` : ''}
          </div>
          
          <!-- Headline with Link -->
          <a href="${storyLink}" target="_blank" style="text-decoration: none;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #18181b; line-height: 1.4; font-weight: 600;">
              ${story.headline}
            </h3>
          </a>
          
          <!-- Summary -->
          ${summary ? `<p style="margin: 0 0 12px 0; color: #52525b; font-size: 13px; line-height: 1.5;">${summary.substring(0, 150)}${summary.length > 150 ? '...' : ''}</p>` : ''}
          
          <!-- Read on NEWStack link -->
          <a href="${storyLink}" target="_blank" style="display: inline-block; background: #18181b; color: #ffffff; padding: 6px 14px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 12px;">
            Read on NEWStack →
          </a>
        </div>
      </div>
    `;
    }).join('');

    // Generate full email HTML
    const generateEmailHtml = (email: string) => {
      const unsubscribeToken = btoa(email);
      const unsubscribeUrl = `${supabaseUrl}/functions/v1/unsubscribe-newsletter?token=${unsubscribeToken}`;
      
      const totalSources = storiesWithSources.reduce((acc, s) => acc + s.source_count, 0);
      const totalVerified = storiesWithSources.reduce((acc, s) => acc + s.verifiedCount, 0);
      
      return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>NEWSTACK Daily Digest</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-width: 100%; background-color: #f4f4f5;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" width="100%" style="max-width: 640px;">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #18181b 0%, #27272a 100%); border-radius: 16px 16px 0 0; padding: 40px 32px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                      NEWSTACK
                    </h1>
                    <p style="margin: 12px 0 0 0; color: #a1a1aa; font-size: 14px;">
                      Daily Digest • ${today}
                    </p>
                  </td>
                </tr>
                
                <!-- Stats Banner -->
                <tr>
                  <td style="background: #ffffff; padding: 24px 32px; border-bottom: 1px solid #e4e4e7;">
                    <table role="presentation" width="100%">
                      <tr>
                        <td align="center" style="padding: 0 16px;">
                          <div style="font-size: 28px; font-weight: 700; color: #18181b;">${stories.length}</div>
                          <div style="font-size: 12px; color: #71717a; margin-top: 4px;">Top Stories</div>
                        </td>
                        <td align="center" style="padding: 0 16px; border-left: 1px solid #e4e4e7;">
                          <div style="font-size: 28px; font-weight: 700; color: #16a34a;">${totalVerified}</div>
                          <div style="font-size: 12px; color: #71717a; margin-top: 4px;">Verified Sources</div>
                        </td>
                        <td align="center" style="padding: 0 16px; border-left: 1px solid #e4e4e7;">
                          <div style="font-size: 28px; font-weight: 700; color: #6366f1;">${totalSources}</div>
                          <div style="font-size: 12px; color: #71717a; margin-top: 4px;">Total Coverage</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="background: #f4f4f5; padding: 32px 24px;">
                    <h2 style="margin: 0 0 24px 0; font-size: 20px; color: #18181b; font-weight: 600;">
                      🔥 Today's Most Verified Stories
                    </h2>
                    
                    ${storiesHtml}
                    
                    <!-- CTA -->
                    <div style="text-align: center; margin-top: 32px;">
                      <a href="https://newstack.live/news" style="display: inline-block; background: #18181b; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                        Read All Stories →
                      </a>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background: #18181b; border-radius: 0 0 16px 16px; padding: 32px; text-align: center;">
                    <p style="margin: 0 0 8px 0; color: #a1a1aa; font-size: 13px;">
                      You're receiving this because you subscribed to NEWSTACK Daily Digest.
                    </p>
                    <p style="margin: 0 0 16px 0; color: #71717a; font-size: 12px;">
                      © ${new Date().getFullYear()} Newstack • Multi-source verified news intelligence
                    </p>
                    <div style="border-top: 1px solid #27272a; padding-top: 16px;">
                      <a href="${unsubscribeUrl}" style="color: #a1a1aa; font-size: 12px; text-decoration: underline;">
                        Unsubscribe
                      </a>
                      <span style="color: #52525b; font-size: 12px;"> • </span>
                      <a href="https://newstack.live/privacy" style="color: #a1a1aa; font-size: 12px; text-decoration: underline;">
                        Privacy Policy
                      </a>
                      <span style="color: #52525b; font-size: 12px;"> • </span>
                      <a href="https://newstack.live" style="color: #a1a1aa; font-size: 12px; text-decoration: underline;">
                        Visit Website
                      </a>
                    </div>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
    };

    // Send emails to all subscribers
    let sentCount = 0;
    let failedCount = 0;

    for (const subscriber of subscribers) {
      try {
        const personalizedEmailHtml = generateEmailHtml(subscriber.email);
        const unsubscribeToken = btoa(subscriber.email);
        
        const emailResponse = await resend.emails.send({
          from: "Newstack <no-reply@newstack.live>",
          to: [subscriber.email],
          subject: `📰 NEWSTACK Daily Digest - ${stories.length} Top Stories`,
          html: personalizedEmailHtml,
          headers: {
            "List-Unsubscribe": `<${supabaseUrl}/functions/v1/unsubscribe-newsletter?token=${unsubscribeToken}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        });

        if (emailResponse.data?.id) {
          sentCount++;
          console.log(`Sent digest to ${subscriber.email}`);
        } else {
          console.error(`Failed to send to ${subscriber.email}:`, emailResponse.error);
          failedCount++;
        }
      } catch (err) {
        console.error(`Error sending to ${subscriber.email}:`, err);
        failedCount++;
      }
    }

    // Log the digest send
    await supabase.from("cron_job_logs").insert({
      job_name: "daily-digest",
      status: "success",
      records_processed: sentCount,
      metadata: {
        stories_count: stories.length,
        subscribers_count: subscribers.length,
        sent_count: sentCount,
        failed_count: failedCount,
      },
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Digest sent to ${sentCount} subscribers`,
        stories: stories.length,
        sent: sentCount,
        failed: failedCount
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending daily digest:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
