import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FeedItem {
  title: string;
  link: string;
  pubDate?: string;
  description?: string;
}

async function parseRSSFeed(url: string): Promise<{ items: FeedItem[]; error?: string }> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "NEWSTACK RSS Reader/1.0",
      },
    });

    if (!response.ok) {
      return { items: [], error: `HTTP ${response.status}: ${response.statusText}` };
    }

    const xml = await response.text();
    const items: FeedItem[] = [];

    // Simple XML parsing for RSS items
    const itemMatches = xml.match(/<item[^>]*>([\s\S]*?)<\/item>/gi) || [];
    
    for (const itemXml of itemMatches.slice(0, 10)) {
      const title = itemXml.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim() || "";
      const link = itemXml.match(/<link[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i)?.[1]?.trim() || "";
      const pubDate = itemXml.match(/<pubDate[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/pubDate>/i)?.[1]?.trim();
      const description = itemXml.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)?.[1]?.trim();

      if (title && link) {
        items.push({
          title: title.replace(/<!\[CDATA\[|\]\]>/g, "").slice(0, 200),
          link: link.replace(/<!\[CDATA\[|\]\]>/g, ""),
          pubDate,
          description: description?.replace(/<[^>]+>/g, "").slice(0, 300),
        });
      }
    }

    return { items };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { items: [], error: errorMessage };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { feedId, feedUrl, feedName } = await req.json();

    if (!feedUrl) {
      return new Response(
        JSON.stringify({ error: "Feed URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Testing feed: ${feedName || feedUrl}`);

    const { items, error } = await parseRSSFeed(feedUrl);
    const durationMs = Date.now() - startTime;

    // Log the ingestion attempt
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    await supabase.from("rss_ingestion_logs").insert({
      feed_id: feedId || null,
      feed_name: feedName || feedUrl,
      feed_url: feedUrl,
      status: error ? "error" : "success",
      stories_fetched: items.length,
      stories_inserted: 0, // Test mode - not inserting
      error_message: error || null,
      duration_ms: durationMs,
    });

    // Update last_fetched_at if feedId provided
    if (feedId) {
      await supabase
        .from("rss_feeds")
        .update({ last_fetched_at: new Date().toISOString() })
        .eq("id", feedId);
    }

    return new Response(
      JSON.stringify({
        success: !error,
        feedName: feedName || feedUrl,
        itemsFound: items.length,
        items: items.slice(0, 5), // Return first 5 items as preview
        durationMs,
        error: error || null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Test feed error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
