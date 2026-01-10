import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  enclosure?: { url: string };
  "media:content"?: { url: string };
}

interface RSSFeed {
  id: string;
  name: string;
  url: string;
  category: string;
  country_code: string | null;
}

// Stopwords to remove for normalization
const STOPWORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "must", "shall", "can", "need", "dare",
  "to", "of", "in", "for", "on", "with", "at", "by", "from", "as",
  "into", "through", "during", "before", "after", "above", "below",
  "and", "but", "or", "nor", "so", "yet", "both", "either", "neither",
  "not", "only", "own", "same", "than", "too", "very", "just",
]);

// Normalize headline for deduplication
function normalizeHeadline(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // Remove punctuation
    .split(/\s+/)
    .filter(word => !STOPWORDS.has(word) && word.length > 2)
    .join(" ")
    .substring(0, 100);
}

// Create hash for deduplication
async function createHash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("").substring(0, 32);
}

// Parse RSS XML
function parseRSSItems(xmlText: string): RSSItem[] {
  const items: RSSItem[] = [];
  
  // Simple regex-based parsing for RSS items
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  
  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemContent = match[1];
    
    const getTag = (tag: string): string => {
      const tagRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
      const tagMatch = itemContent.match(tagRegex);
      return (tagMatch?.[1] || tagMatch?.[2] || "").trim();
    };
    
    const getEnclosure = (): string | undefined => {
      const encRegex = /<enclosure[^>]*url=["']([^"']+)["'][^>]*>/i;
      const encMatch = itemContent.match(encRegex);
      return encMatch?.[1];
    };
    
    const getMediaContent = (): string | undefined => {
      const mediaRegex = /<media:content[^>]*url=["']([^"']+)["'][^>]*>/i;
      const mediaMatch = itemContent.match(mediaRegex);
      return mediaMatch?.[1];
    };
    
    const title = getTag("title");
    const link = getTag("link");
    const description = getTag("description");
    const pubDate = getTag("pubDate");
    
    if (title && link) {
      items.push({
        title,
        link,
        description: description.replace(/<[^>]*>/g, "").substring(0, 500),
        pubDate,
        enclosure: getEnclosure() ? { url: getEnclosure()! } : undefined,
        "media:content": getMediaContent() ? { url: getMediaContent()! } : undefined,
      });
    }
  }
  
  return items;
}

// Fetch and parse RSS feed
async function fetchRSSFeed(feed: RSSFeed): Promise<RSSItem[]> {
  try {
    console.log(`Fetching: ${feed.name}`);
    
    const response = await fetch(feed.url, {
      headers: {
        "User-Agent": "NEWSTACK/1.0 (News Aggregator)",
        "Accept": "application/rss+xml, application/xml, text/xml",
      },
    });
    
    if (!response.ok) {
      console.warn(`Failed to fetch ${feed.name}: ${response.status}`);
      return [];
    }
    
    const xmlText = await response.text();
    return parseRSSItems(xmlText);
  } catch (error) {
    console.error(`Error fetching ${feed.name}:`, error);
    return [];
  }
}

// Process items and deduplicate into stories
async function processItems(
  supabase: any,
  items: RSSItem[],
  feed: RSSFeed
): Promise<{ created: number; merged: number }> {
  let created = 0;
  let merged = 0;
  
  for (const item of items) {
    try {
      const normalizedHeadline = normalizeHeadline(item.title);
      const storyHash = await createHash(normalizedHeadline);
      
      // Parse publish date
      let publishedAt: Date;
      try {
        publishedAt = new Date(item.pubDate);
        if (isNaN(publishedAt.getTime())) {
          publishedAt = new Date();
        }
      } catch {
        publishedAt = new Date();
      }
      
      // Check if story is older than 48 hours
      const hoursSincePublished = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60);
      if (hoursSincePublished > 48) {
        continue; // Skip old stories
      }
      
      // Get image URL
      const imageUrl = item.enclosure?.url || item["media:content"]?.url || null;
      
      // Check if story exists
      const { data: existingStory } = await supabase
        .from("stories")
        .select("id, source_count")
        .eq("story_hash", storyHash)
        .single() as { data: { id: string; source_count: number } | null };
      
      if (existingStory) {
        // Story exists - add source and update
        const { error: sourceError } = await supabase
          .from("story_sources")
          .upsert({
            story_id: existingStory.id,
            source_name: feed.name,
            source_url: item.link,
            published_at: publishedAt.toISOString(),
            description: item.description,
          } as any, { onConflict: "story_id,source_url" });
        
        if (!sourceError) {
          // Update story with new source count and last updated time
          await supabase
            .from("stories")
            .update({
              source_count: existingStory.source_count + 1,
              last_updated_at: new Date().toISOString(),
              image_url: imageUrl || undefined,
            } as any)
            .eq("id", existingStory.id);
          
          merged++;
        }
      } else {
        // Create new story
        const { data: newStory, error: storyError } = await supabase
          .from("stories")
          .insert({
            story_hash: storyHash,
            headline: item.title,
            normalized_headline: normalizedHeadline,
            summary: item.description,
            category: feed.category,
            country_code: feed.country_code,
            is_global: !feed.country_code,
            first_published_at: publishedAt.toISOString(),
            last_updated_at: new Date().toISOString(),
            image_url: imageUrl,
          } as any)
          .select("id")
          .single() as { data: { id: string } | null; error: any };
        
        if (newStory && !storyError) {
          // Add source
          await supabase
            .from("story_sources")
            .insert({
              story_id: newStory.id,
              source_name: feed.name,
              source_url: item.link,
              published_at: publishedAt.toISOString(),
              description: item.description,
            } as any);
          
          created++;
        }
      }
    } catch (error) {
      console.error("Error processing item:", error);
    }
  }
  
  return { created, merged };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Starting RSS ingestion...");

    // Get active RSS feeds
    const { data: feeds, error: feedsError } = await supabase
      .from("rss_feeds")
      .select("*")
      .eq("is_active", true)
      .order("priority", { ascending: false });

    if (feedsError || !feeds) {
      throw new Error("Failed to fetch RSS feeds");
    }

    console.log(`Found ${feeds.length} active feeds`);

    let totalCreated = 0;
    let totalMerged = 0;

    // Process each feed
    for (const feed of feeds) {
      const items = await fetchRSSFeed(feed);
      
      if (items.length > 0) {
        const { created, merged } = await processItems(supabase, items, feed);
        totalCreated += created;
        totalMerged += merged;
        
        // Update last fetched timestamp
        await supabase
          .from("rss_feeds")
          .update({ last_fetched_at: new Date().toISOString() })
          .eq("id", feed.id);
      }
    }

    // Clean up old stories (older than 48 hours)
    const cutoffTime = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    await supabase
      .from("stories")
      .delete()
      .lt("first_published_at", cutoffTime);

    const result = {
      success: true,
      feeds_processed: feeds.length,
      stories_created: totalCreated,
      stories_merged: totalMerged,
      timestamp: new Date().toISOString(),
    };

    console.log("RSS ingestion complete:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("RSS ingestion error:", message);
    
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
