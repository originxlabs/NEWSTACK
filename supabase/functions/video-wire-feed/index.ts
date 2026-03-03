import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FeedSource {
  name: string;
  url: string;
  platform: "youtube" | "publisher";
  country?: string | null;
}

interface VideoItem {
  title: string;
  link: string;
  source: string;
  platform: "youtube" | "publisher";
  published_at: string;
  thumbnail: string | null;
}

const FALLBACK_FEEDS: FeedSource[] = [
  { name: "BBC News (YouTube)", url: "https://www.youtube.com/feeds/videos.xml?user=BBCNews", platform: "youtube" },
  { name: "CNN (YouTube)", url: "https://www.youtube.com/feeds/videos.xml?user=CNN", platform: "youtube" },
  { name: "Al Jazeera English (YouTube)", url: "https://www.youtube.com/feeds/videos.xml?user=AlJazeeraEnglish", platform: "youtube" },
  { name: "NDTV (YouTube)", url: "https://www.youtube.com/feeds/videos.xml?user=ndtv", platform: "youtube", country: "IN" },
  { name: "Aaj Tak (YouTube)", url: "https://www.youtube.com/feeds/videos.xml?user=aajtak", platform: "youtube", country: "IN" },
  { name: "WION (YouTube)", url: "https://www.youtube.com/feeds/videos.xml?user=WION", platform: "youtube", country: "IN" },
  { name: "BBC Video RSS", url: "https://feeds.bbci.co.uk/news/video_and_audio/world/rss.xml", platform: "publisher" },
  { name: "NYT Video RSS", url: "https://rss.nytimes.com/services/xml/rss/nyt/Video.xml", platform: "publisher" },
];

function stripCdata(input: string): string {
  return input
    .replace(/^<!\[CDATA\[/, "")
    .replace(/\]\]>$/, "")
    .trim();
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTag(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  if (!match) return null;
  return decodeHtmlEntities(stripCdata(match[1]).replace(/<[^>]+>/g, "").trim());
}

function extractAttr(xml: string, tag: string, attr: string): string | null {
  const match = xml.match(new RegExp(`<${tag}[^>]*\\s${attr}="([^"]+)"[^>]*>`, "i"));
  return match?.[1] ?? null;
}

function guessYoutubeThumb(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtube.com")) {
      const videoId = parsed.searchParams.get("v");
      if (videoId) return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    }
    if (parsed.hostname.includes("youtu.be")) {
      const videoId = parsed.pathname.split("/").filter(Boolean)[0];
      if (videoId) return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    }
  } catch {
    // noop
  }
  return null;
}

function looksLikeVideo(item: { link?: string | null; title?: string | null; media?: string | null }): boolean {
  const merged = `${item.link ?? ""} ${item.title ?? ""} ${item.media ?? ""}`.toLowerCase();
  return ["youtube.com/watch", "youtu.be/", "/video", "/videos", "watch", "live", "media:", "enclosure"].some((token) => merged.includes(token));
}

function parseAtomEntries(xml: string, source: FeedSource): VideoItem[] {
  const entries = xml.match(/<entry[\s\S]*?<\/entry>/gi) ?? [];
  return entries
    .map((entry) => {
      const title = extractTag(entry, "title") ?? "Untitled";
      const link = extractAttr(entry, "link", "href") ?? "";
      const published = extractTag(entry, "published") ?? extractTag(entry, "updated") ?? new Date().toISOString();
      const thumbnail = extractAttr(entry, "media:thumbnail", "url") ?? extractAttr(entry, "media:content", "url") ?? guessYoutubeThumb(link);

      if (!link || !looksLikeVideo({ link, title, media: thumbnail })) return null;

      return {
        title,
        link,
        source: source.name,
        platform: source.platform,
        published_at: published,
        thumbnail,
      } as VideoItem;
    })
    .filter((item): item is VideoItem => Boolean(item));
}

function parseRssItems(xml: string, source: FeedSource): VideoItem[] {
  const items = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
  return items
    .map((item) => {
      const title = extractTag(item, "title") ?? "Untitled";
      const link = extractTag(item, "link") ?? "";
      const published = extractTag(item, "pubDate") ?? new Date().toISOString();
      const thumbnail =
        extractAttr(item, "media:thumbnail", "url") ??
        extractAttr(item, "media:content", "url") ??
        extractAttr(item, "enclosure", "url") ??
        guessYoutubeThumb(link);

      if (!link || !looksLikeVideo({ link, title, media: thumbnail })) return null;

      return {
        title,
        link,
        source: source.name,
        platform: source.platform,
        published_at: published,
        thumbnail,
      } as VideoItem;
    })
    .filter((item): item is VideoItem => Boolean(item));
}

async function fetchAndParseFeed(source: FeedSource): Promise<VideoItem[]> {
  try {
    const response = await fetch(source.url, {
      headers: {
        "User-Agent": "NEWSTACK-ReelWire/1.0 (+https://newstack.live)",
        "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml",
      },
    });

    if (!response.ok) {
      console.warn("Feed fetch failed", source.url, response.status);
      return [];
    }

    const xml = await response.text();
    const isAtom = /<feed[\s\S]*xmlns="http:\/\/www\.w3\.org\/2005\/Atom"/i.test(xml) || /<entry>/i.test(xml);

    const parsed = isAtom ? parseAtomEntries(xml, source) : parseRssItems(xml, source);
    return parsed.slice(0, 8);
  } catch (error) {
    console.warn("Error parsing feed", source.url, error);
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { limit = 30 } = await req.json().catch(() => ({}));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: feedRows } = await supabase
      .from("rss_feeds")
      .select("name, url, country_code")
      .eq("is_active", true)
      .or("url.ilike.%youtube.com/feeds/videos.xml%,url.ilike.%/video%,url.ilike.%/videos%,name.ilike.%video%")
      .limit(24);

    const dynamicFeeds: FeedSource[] = (feedRows ?? []).map((row) => ({
      name: row.name,
      url: row.url,
      platform: row.url.includes("youtube.com") ? "youtube" : "publisher",
      country: row.country_code,
    }));

    const seen = new Set<string>();
    const allFeeds = [...dynamicFeeds, ...FALLBACK_FEEDS].filter((feed) => {
      const key = `${feed.name}::${feed.url}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const settled = await Promise.allSettled(allFeeds.map((feed) => fetchAndParseFeed(feed)));

    const allItems = settled
      .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
      .filter((item) => item.link && item.title)
      .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());

    const uniqueItems: VideoItem[] = [];
    const dedupe = new Set<string>();
    for (const item of allItems) {
      const key = item.link || `${item.source}:${item.title}`;
      if (dedupe.has(key)) continue;
      dedupe.add(key);
      uniqueItems.push(item);
      if (uniqueItems.length >= Number(limit)) break;
    }

    return new Response(
      JSON.stringify({
        success: true,
        count: uniqueItems.length,
        sources_scanned: allFeeds.length,
        videos: uniqueItems,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=300",
        },
      },
    );
  } catch (error) {
    console.error("video-wire-feed failed", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
