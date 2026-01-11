import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Story {
  id: string;
  headline: string;
  summary: string | null;
  category: string | null;
  source_count: number;
  first_published_at: string;
  image_url: string | null;
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

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get top multi-source stories from the last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: stories, error: storiesError } = await supabase
      .from("stories")
      .select("id, headline, summary, category, source_count, first_published_at, image_url")
      .gte("first_published_at", yesterday)
      .gte("source_count", 3)
      .order("source_count", { ascending: false })
      .limit(10);

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

    const storiesHtml = storiesWithSources.map((story, idx) => `
      <div style="margin-bottom: 24px; padding: 20px; background: #f8f9fa; border-radius: 12px; border-left: 4px solid ${story.verifiedCount >= 2 ? '#22c55e' : '#f59e0b'};">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <span style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">
            #${idx + 1}
          </span>
          <span style="background: ${story.category === 'Politics' ? '#f59e0b' : story.category === 'World' ? '#3b82f6' : '#10b981'}20; color: ${story.category === 'Politics' ? '#d97706' : story.category === 'World' ? '#2563eb' : '#059669'}; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500;">
            ${story.category || 'News'}
          </span>
          <span style="background: #22c55e20; color: #16a34a; padding: 2px 8px; border-radius: 4px; font-size: 11px;">
            ${story.source_count} sources • ${story.verifiedCount} verified
          </span>
        </div>
        
        <h3 style="margin: 0 0 8px 0; font-size: 18px; color: #1f2937; line-height: 1.4;">
          ${story.headline}
        </h3>
        
        ${story.summary ? `<p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">${story.summary}</p>` : ''}
        
        <div style="margin-top: 12px;">
          <span style="font-size: 12px; color: #9ca3af; font-weight: 500;">Coverage from:</span>
          <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px;">
            ${story.sources.slice(0, 4).map((s: StorySource) => `
              <a href="${s.source_url}" target="_blank" style="background: white; border: 1px solid #e5e7eb; padding: 4px 10px; border-radius: 6px; font-size: 12px; color: #374151; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
                ${isVerifiedSource(s.source_name) ? '✓' : '○'} ${s.source_name}
              </a>
            `).join('')}
          </div>
        </div>
      </div>
    `).join('');

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 640px; margin: 0 auto; padding: 20px;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%); border-radius: 16px 16px 0 0; padding: 32px 24px; text-align: center;">
            <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
              📰 NEWSTACK
            </h1>
            <p style="margin: 8px 0 0 0; color: #c4b5fd; font-size: 14px;">
              Daily Digest • ${today}
            </p>
          </div>
          
          <!-- Stats Banner -->
          <div style="background: white; padding: 16px 24px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: center; gap: 24px;">
            <div style="text-align: center;">
              <div style="font-size: 24px; font-weight: 700; color: #6366f1;">${stories.length}</div>
              <div style="font-size: 12px; color: #6b7280;">Top Stories</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 24px; font-weight: 700; color: #22c55e;">${storiesWithSources.reduce((acc, s) => acc + s.verifiedCount, 0)}</div>
              <div style="font-size: 12px; color: #6b7280;">Verified Sources</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 24px; font-weight: 700; color: #f59e0b;">${storiesWithSources.reduce((acc, s) => acc + s.source_count, 0)}</div>
              <div style="font-size: 12px; color: #6b7280;">Total Coverage</div>
            </div>
          </div>
          
          <!-- Content -->
          <div style="background: white; padding: 24px;">
            <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #1f2937;">
              🔥 Today's Most Verified Stories
            </h2>
            
            ${storiesHtml}
            
            <!-- CTA -->
            <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
              <a href="https://newstack.app/news" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                Read All Stories →
              </a>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #1f2937; border-radius: 0 0 16px 16px; padding: 24px; text-align: center;">
            <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 12px;">
              You're receiving this because you subscribed to NEWSTACK Daily Digest.
            </p>
            <p style="margin: 0; color: #6b7280; font-size: 11px;">
              © ${new Date().getFullYear()} NEWSTACK • Multi-source verified news
            </p>
          </div>
          
        </div>
      </body>
      </html>
    `;

    // Send emails to all subscribers
    let sentCount = 0;
    let failedCount = 0;

    for (const subscriber of subscribers) {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "NEWSTACK <digest@newstack.app>",
            to: [subscriber.email],
            subject: `📰 NEWSTACK Daily Digest - ${stories.length} Top Stories (${today})`,
            html: emailHtml,
          }),
        });

        if (response.ok) {
          sentCount++;
          console.log(`Sent digest to ${subscriber.email}`);
        } else {
          const error = await response.text();
          console.error(`Failed to send to ${subscriber.email}:`, error);
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
