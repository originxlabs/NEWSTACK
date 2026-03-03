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
  video_id: string | null;
  embed_url: string | null;
  is_short: boolean;
  is_trending: boolean;
  duration_seconds: number | null;
  is_verified_source: boolean;
}

const FALLBACK_FEEDS: FeedSource[] = [
  { name: "BBC News (YouTube)", url: "https://www.youtube.com/feeds/videos.xml?user=BBCNews", platform: "youtube" },
  { name: "CNN (YouTube)", url: "https://www.youtube.com/feeds/videos.xml?user=CNN", platform: "youtube" },
  { name: "Al Jazeera English (YouTube)", url: "https://www.youtube.com/feeds/videos.xml?user=AlJazeeraEnglish", platform: "youtube" },
  { name: "Reuters (YouTube)", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UChqUTb7kYRX8-EiaN3XFrSQ", platform: "youtube" },
  { name: "Sky News (YouTube)", url: "https://www.youtube.com/feeds/videos.xml?user=SkyNews", platform: "youtube" },
  { name: "France 24 (YouTube)", url: "https://www.youtube.com/feeds/videos.xml?user=FRANCE24English", platform: "youtube" },
  { name: "DW News (YouTube)", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCknLrEdhRCp1aegoMqRaCZg", platform: "youtube" },
  { name: "NDTV (YouTube)", url: "https://www.youtube.com/feeds/videos.xml?user=ndtv", platform: "youtube", country: "IN" },
  { name: "India Today (YouTube)", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCYPvAwZP8pZhSMW8qs7cVCw", platform: "youtube", country: "IN" },
  { name: "Aaj Tak (YouTube)", url: "https://www.youtube.com/feeds/videos.xml?user=aajtak", platform: "youtube", country: "IN" },
  { name: "ABP News (YouTube)", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCmphdqZNmqL72WJ2uyiNw5w", platform: "youtube", country: "IN" },
  { name: "WION (YouTube)", url: "https://www.youtube.com/feeds/videos.xml?user=WION", platform: "youtube", country: "IN" },
  { name: "News18 India (YouTube)", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCef1-8eOpJgud7szVPlZQA", platform: "youtube", country: "IN" },
  { name: "Republic World (YouTube)", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCwqusr8YDwM-3mEYTDeJHzw", platform: "youtube", country: "IN" },
  { name: "BBC Video RSS", url: "https://feeds.bbci.co.uk/news/video_and_audio/world/rss.xml", platform: "publisher" },
  { name: "NYT Video RSS", url: "https://rss.nytimes.com/services/xml/rss/nyt/Video.xml", platform: "publisher" },
];

const TRENDING_KEYWORDS = [
  "breaking", "live", "just in", "alert", "explained", "analysis", "exclusive", "shorts", "viral",
];

const VERIFIED_SOURCE_TOKENS = [
  "bbc", "reuters", "cnn", "al jazeera", "sky news", "france 24", "dw", "ndtv", "india today",
  "aaj tak", "abp", "wion", "news18", "republic", "new york times", "nyt", "washington post",
  "financial times", "ft", "bloomberg", "npr", "the hindu", "indian express", "times of india", "zee news",
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

function extractDurationSeconds(xml: string): number | null {
  const ytDuration = extractAttr(xml, "yt:duration", "seconds");
  if (ytDuration && /^\d+$/.test(ytDuration)) return Number(ytDuration);

  const mediaDurationTag = extractTag(xml, "media:duration");
  if (mediaDurationTag && /^\d+$/.test(mediaDurationTag)) return Number(mediaDurationTag);

  const mediaContentDuration = extractAttr(xml, "media:content", "duration");
  if (mediaContentDuration && /^\d+$/.test(mediaContentDuration)) return Number(mediaContentDuration);

  return null;
}

function isVerifiedSource(sourceName: string, sourceUrl?: string): boolean {
  const merged = `${sourceName} ${sourceUrl ?? ""}`.toLowerCase();
  return VERIFIED_SOURCE_TOKENS.some((token) => merged.includes(token));
}

function extractYoutubeId(link: string): string | null {
  try {
    const parsed = new URL(link);
    if (parsed.hostname.includes("youtube.com")) {
      return parsed.searchParams.get("v");
    }
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.split("/").filter(Boolean)[0] ?? null;
    }
  } catch {
    // no-op
  }
  return null;
}

function toEmbedUrl(videoId: string | null): string | null {
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1&controls=0&modestbranding=1&rel=0&loop=1&playlist=${videoId}&enablejsapi=1`;
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

function isTrendingVideo(title: string, publishedAt: string): boolean {
  const lower = title.toLowerCase();
  const keywordHit = TRENDING_KEYWORDS.some((k) => lower.includes(k));
  const ageHours = Math.max(0, (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60));
  return keywordHit || ageHours <= 10;
}

function looksShort(title: string, link: string): boolean {
  const lower = `${title} ${link}`.toLowerCase();
  return lower.includes("short") || lower.includes("reel") || lower.includes("/shorts/");
}

function parseAtomEntries(xml: string, source: FeedSource): VideoItem[] {
  const entries = xml.match(/<entry[\s\S]*?<\/entry>/gi) ?? [];
  return entries
    .map((entry) => {
      const title = extractTag(entry, "title") ?? "Untitled";
      const link = extractAttr(entry, "link", "href") ?? "";
      const published = extractTag(entry, "published") ?? extractTag(entry, "updated") ?? new Date().toISOString();
      const fromEntryVideoId = extractTag(entry, "yt:videoId");
      const fromLinkVideoId = extractYoutubeId(link);
      const videoId = fromEntryVideoId || fromLinkVideoId;
      const durationSeconds = extractDurationSeconds(entry);
      const thumbnail =
        extractAttr(entry, "media:thumbnail", "url") ??
        extractAttr(entry, "media:content", "url") ??
        (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : guessYoutubeThumb(link));

      if (!link || !looksLikeVideo({ link, title, media: thumbnail })) return null;

      return {
        title,
        link,
        source: source.name,
        platform: source.platform,
        published_at: published,
        thumbnail,
        video_id: videoId,
        embed_url: source.platform === "youtube" ? toEmbedUrl(videoId) : null,
        is_short: looksShort(title, link),
        is_trending: isTrendingVideo(title, published),
        duration_seconds: durationSeconds,
        is_verified_source: isVerifiedSource(source.name, source.url),
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
      const videoId = extractYoutubeId(link);
      const durationSeconds = extractDurationSeconds(item);
      const thumbnail =
        extractAttr(item, "media:thumbnail", "url") ??
        extractAttr(item, "media:content", "url") ??
        extractAttr(item, "enclosure", "url") ??
        (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : guessYoutubeThumb(link));

      if (!link || !looksLikeVideo({ link, title, media: thumbnail })) return null;

      return {
        title,
        link,
        source: source.name,
        platform: source.platform,
        published_at: published,
        thumbnail,
        video_id: videoId,
        embed_url: source.platform === "youtube" ? toEmbedUrl(videoId) : null,
        is_short: looksShort(title, link),
        is_trending: isTrendingVideo(title, published),
        duration_seconds: durationSeconds,
        is_verified_source: isVerifiedSource(source.name, source.url),
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

function shouldKeepByDuration(item: VideoItem, maxDurationSeconds: number, strictDuration: boolean): boolean {
  if (item.is_short) return true;
  if (item.duration_seconds !== null) return item.duration_seconds <= maxDurationSeconds;
  return !strictDuration;
}

async function isEmbeddableYouTube(item: VideoItem): Promise<boolean> {
  if (item.platform !== "youtube") return true;
  if (!item.video_id) return false;
  try {
    const probe = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${item.video_id}&format=json`,
      { headers: { "User-Agent": "NEWSTACK-ReelWire/1.0" } },
    );
    return probe.ok;
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      limit = 60,
      platform = "all",
      maxDurationSeconds = 300,
      verifiedOnly = true,
      strictDuration = true,
    } = await req.json().catch(() => ({}));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: feedRows } = await supabase
      .from("rss_feeds")
      .select("name, url, country_code")
      .eq("is_active", true)
      .or("url.ilike.%youtube.com/feeds/videos.xml%,url.ilike.%youtu.be%,url.ilike.%/video%,url.ilike.%/videos%,name.ilike.%video%,name.ilike.%youtube%")
      .limit(80);

    const dynamicFeeds: FeedSource[] = (feedRows ?? []).map((row) => ({
      name: row.name,
      url: row.url,
      platform: row.url.includes("youtube.com") ? "youtube" : "publisher",
      country: row.country_code,
    }));

    const seen = new Set<string>();
    const allFeeds = [...dynamicFeeds, ...FALLBACK_FEEDS]
      .filter((feed) => {
        if (platform === "youtube") return feed.platform === "youtube";
        if (platform === "publisher") return feed.platform === "publisher";
        return true;
      })
      .filter((feed) => {
      const key = `${feed.name}::${feed.url}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
      });

    const settled = await Promise.allSettled(allFeeds.map((feed) => fetchAndParseFeed(feed)));

    const allItems = settled
      .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
      .filter((item) => item.link && item.title)
      .filter((item) => (verifiedOnly ? item.is_verified_source : true))
      .filter((item) => shouldKeepByDuration(item, Number(maxDurationSeconds), Boolean(strictDuration)))
      .sort((a, b) => {
        const aTime = new Date(a.published_at).getTime();
        const bTime = new Date(b.published_at).getTime();
        const aTrend = a.is_trending ? 1 : 0;
        const bTrend = b.is_trending ? 1 : 0;
        const aShort = a.is_short ? 1 : 0;
        const bShort = b.is_short ? 1 : 0;
        const aScore = aTrend * 3 + aShort * 2 + aTime / 1e12;
        const bScore = bTrend * 3 + bShort * 2 + bTime / 1e12;
        return bScore - aScore;
      });

    const uniqueItems: VideoItem[] = [];
    const dedupe = new Set<string>();
    for (const item of allItems) {
      const key = item.link || `${item.source}:${item.title}`;
      if (dedupe.has(key)) continue;

      const embeddable = await isEmbeddableYouTube(item);
      if (!embeddable) continue;

      dedupe.add(key);
      uniqueItems.push(item);
      if (uniqueItems.length >= Number(limit)) break;
    }

    return new Response(
      JSON.stringify({
        success: true,
        count: uniqueItems.length,
        sources_scanned: allFeeds.length,
        platform,
        maxDurationSeconds,
        verifiedOnly,
        strictDuration,
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
