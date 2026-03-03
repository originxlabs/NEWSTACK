import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CheckCircle2, ExternalLink, Film, Home, PlayCircle, Radio, ShieldCheck, Volume2, VolumeX, Youtube } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BreadcrumbNav, type BreadcrumbItem } from "@/components/BreadcrumbNav";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

gsap.registerPlugin(ScrollTrigger);

interface VideoWireItem {
  title: string;
  link: string;
  source: string;
  platform: "youtube" | "publisher" | "x" | "threads" | "facebook" | "instagram";
  published_at: string;
  thumbnail: string | null;
  video_id?: string | null;
  embed_url?: string | null;
  is_short?: boolean;
  is_trending?: boolean;
  duration_seconds?: number | null;
  is_verified_source?: boolean;
  media_type?: "video" | "image" | "post";
  source_url?: string;
}

interface RenderReel extends VideoWireItem {
  reel_key: string;
}

type ReactionType = "love" | "like" | "dislike";

interface ReactionState {
  love: number;
  like: number;
  dislike: number;
  user?: ReactionType;
}

type VideoWireRaw = Partial<VideoWireItem> | null | undefined;

const CACHE_KEY = "newstack_reelwire_cached_videos";
const REACTION_KEY = "newstack_reelwire_reactions";

const OFFICIAL_SOCIAL_POSTS: VideoWireItem[] = [
  {
    title: "Reuters official updates",
    link: "https://x.com/Reuters",
    source: "Reuters (X)",
    source_url: "https://x.com/Reuters",
    platform: "x",
    published_at: new Date().toISOString(),
    thumbnail: "https://images.ctfassets.net/pjshm78m9jt4/56rjMSg7n1kVHRwuYHqLob/44a7d09eeb57f4f0f8204cde95e6af19/reuters-logo.png",
    is_trending: true,
    is_short: true,
    is_verified_source: true,
    media_type: "image",
  },
  {
    title: "BBC News official social stream",
    link: "https://www.facebook.com/bbcnews",
    source: "BBC News (Facebook)",
    source_url: "https://www.facebook.com/bbcnews",
    platform: "facebook",
    published_at: new Date().toISOString(),
    thumbnail: "https://static.files.bbci.co.uk/ws/simorgh-assets/public/news/images/metadata/poster-1024x576.png",
    is_trending: true,
    is_short: true,
    is_verified_source: true,
    media_type: "image",
  },
  {
    title: "India Today official quick updates",
    link: "https://www.instagram.com/indiatoday/",
    source: "India Today (Instagram)",
    source_url: "https://www.instagram.com/indiatoday/",
    platform: "instagram",
    published_at: new Date().toISOString(),
    thumbnail: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Instagram_logo_2016.svg/600px-Instagram_logo_2016.svg.png",
    is_trending: true,
    is_short: true,
    is_verified_source: true,
    media_type: "post",
  },
  {
    title: "Al Jazeera newsroom updates",
    link: "https://www.threads.net/@aljazeeraenglish",
    source: "Al Jazeera (Threads)",
    source_url: "https://www.threads.net/@aljazeeraenglish",
    platform: "threads",
    published_at: new Date().toISOString(),
    thumbnail: "https://upload.wikimedia.org/wikipedia/commons/8/81/Threads_%28app%29_logo.svg",
    is_trending: true,
    is_short: true,
    is_verified_source: true,
    media_type: "post",
  },
];

const CHANNEL_LOGOS = [
  { name: "BBC", src: "/media-logos/bbc.svg", href: "https://www.youtube.com/@BBCNews" },
  { name: "Reuters", src: "/media-logos/reuters.svg", href: "https://www.youtube.com/@Reuters" },
  { name: "CNN", src: "/media-logos/cnn.svg", href: "https://www.youtube.com/@CNN" },
  { name: "NYT", src: "/media-logos/nytimes.svg", href: "https://www.youtube.com/@nytimes" },
  { name: "Washington Post", src: "/media-logos/washingtonpost.svg", href: "https://www.youtube.com/@WashingtonPost" },
  { name: "FT", src: "/media-logos/ft.svg", href: "https://www.youtube.com/@FinancialTimes" },
  { name: "Bloomberg", src: "/media-logos/bloomberg.svg", href: "https://www.youtube.com/@Bloomberg" },
  { name: "NPR", src: "/media-logos/npr.svg", href: "https://www.youtube.com/@NPR" },
  { name: "NDTV", src: "/media-logos/ndtv.svg", href: "https://www.youtube.com/@NDTV" },
  { name: "India Today", src: "/media-logos/indiatoday.svg", href: "https://www.youtube.com/@IndiaToday" },
  { name: "The Hindu", src: "/media-logos/thehindu.svg", href: "https://www.youtube.com/@TheHindu" },
  { name: "Indian Express", src: "/media-logos/indianexpress.svg", href: "https://www.youtube.com/@indianexpress" },
  { name: "TOI", src: "/media-logos/timesofindia.svg", href: "https://www.youtube.com/@TimesOfIndiaChannel" },
  { name: "Aaj Tak", src: "/media-logos/aajtak.svg", href: "https://www.youtube.com/@aajtak" },
  { name: "ABP", src: "/media-logos/abpnews.svg", href: "https://www.youtube.com/@ABPNEWS" },
  { name: "Zee News", src: "/media-logos/zeenews.svg", href: "https://www.youtube.com/@zeenews" },
];

const CHANNEL_LOGO_DETAILS = [...CHANNEL_LOGOS, ...CHANNEL_LOGOS];

const CHANNEL_EMBED_BY_SOURCE: Record<string, string> = {
  "BBC": "https://www.youtube-nocookie.com/embed/videoseries?list=UU16niRr50-MSBwiO3YDb3RA",
  "CNN": "https://www.youtube-nocookie.com/embed/videoseries?list=UUupvZG-5ko_eiXAupbDfxWw",
  "Al Jazeera": "https://www.youtube-nocookie.com/embed/videoseries?list=UUNye-wNBqNL5ZzHSJj3l8Bg",
  "Reuters": "https://www.youtube-nocookie.com/embed/videoseries?list=UUhqUTb7kYRX8-EiaN3XFrSQ",
  "DW": "https://www.youtube-nocookie.com/embed/videoseries?list=UUknLrEdhRCp1aegoMqRaCZg",
  "France 24": "https://www.youtube-nocookie.com/embed/videoseries?list=UUQfwfsi5VrQ8yKZ-UWmAEFg",
  "NDTV": "https://www.youtube-nocookie.com/embed/videoseries?list=UUKCSy9n4hBZXJ11-4xBhnSQ",
  "India Today": "https://www.youtube-nocookie.com/embed/videoseries?list=UUYPvAwZP8pZhSMW8qs7cVCw",
  "Aaj Tak": "https://www.youtube-nocookie.com/embed/videoseries?list=UUt4t-jeY85JegMlZ-E5UWtA",
  "ABP": "https://www.youtube-nocookie.com/embed/videoseries?list=UUmphdqZNmqL72WJ2uyiNw5w",
  "WION": "https://www.youtube-nocookie.com/embed/videoseries?list=UU_gUM8rL-Lrg6O3adPW9K1g",
  "News18": "https://www.youtube-nocookie.com/embed/videoseries?list=UUef1-8eOpJgud7szVPlZQA",
  "Republic": "https://www.youtube-nocookie.com/embed/videoseries?list=UUwqusr8YDwM-3mEYTDeJHzw",
};

const FALLBACK_VIDEOS: VideoWireItem[] = [
  {
    title: "BBC News — Live Global News",
    link: "https://www.youtube.com/@BBCNews",
    source: "BBC News (YouTube)",
    platform: "youtube",
    published_at: new Date().toISOString(),
    thumbnail: "https://i.ytimg.com/vi/_QYwAj_5zkI/hqdefault.jpg",
    embed_url: "https://www.youtube.com/embed/live_stream?channel=UC16niRr50-MSBwiO3YDb3RA&autoplay=1&mute=1&playsinline=1&controls=0&modestbranding=1&rel=0&enablejsapi=1",
    is_trending: true,
    is_short: true,
  },
  {
    title: "CNN — Breaking News Live",
    link: "https://www.youtube.com/@CNN",
    source: "CNN (YouTube)",
    platform: "youtube",
    published_at: new Date().toISOString(),
    thumbnail: "https://i.ytimg.com/vi/9Auq9mYxFEE/hqdefault.jpg",
    embed_url: "https://www.youtube.com/embed/live_stream?channel=UCupvZG-5ko_eiXAupbDfxWw&autoplay=1&mute=1&playsinline=1&controls=0&modestbranding=1&rel=0&enablejsapi=1",
    is_trending: true,
    is_short: true,
  },
  {
    title: "NDTV — India News Live",
    link: "https://www.youtube.com/@NDTV",
    source: "NDTV (YouTube)",
    platform: "youtube",
    published_at: new Date().toISOString(),
    thumbnail: "https://i.ytimg.com/vi/WB-y7_ymPJ4/hqdefault.jpg",
    embed_url: "https://www.youtube.com/embed/live_stream?channel=UCKCSy9n4hBZXJ11-4xBhnSQ&autoplay=1&mute=1&playsinline=1&controls=0&modestbranding=1&rel=0&enablejsapi=1",
    is_trending: true,
    is_short: true,
  },
  {
    title: "Al Jazeera English — Live",
    link: "https://www.youtube.com/@aljazeeraenglish",
    source: "Al Jazeera (YouTube)",
    platform: "youtube",
    published_at: new Date().toISOString(),
    thumbnail: "https://i.ytimg.com/vi/gCNeDWCI0vo/hqdefault.jpg",
    embed_url: "https://www.youtube.com/embed/live_stream?channel=UCNye-wNBqNL5ZzHSJj3l8Bg&autoplay=1&mute=1&playsinline=1&controls=0&modestbranding=1&rel=0&enablejsapi=1",
    is_trending: true,
    is_short: true,
  },
  {
    title: "France 24 English — Live",
    link: "https://www.youtube.com/@FRANCE24English",
    source: "France 24 (YouTube)",
    platform: "youtube",
    published_at: new Date().toISOString(),
    thumbnail: "https://i.ytimg.com/vi/l8PMl7tUDIE/hqdefault.jpg",
    embed_url: "https://www.youtube.com/embed/live_stream?channel=UCQfwfsi5VrQ8yKZ-UWmAEFg&autoplay=1&mute=1&playsinline=1&controls=0&modestbranding=1&rel=0&enablejsapi=1",
    is_trending: true,
    is_short: true,
  },
  {
    title: "WION — Live World News",
    link: "https://www.youtube.com/@WION",
    source: "WION (YouTube)",
    platform: "youtube",
    published_at: new Date().toISOString(),
    thumbnail: "https://i.ytimg.com/vi/JAzl6fM2V4w/hqdefault.jpg",
    embed_url: "https://www.youtube.com/embed/live_stream?channel=UC_gUM8rL-Lrg6O3adPW9K1g&autoplay=1&mute=1&playsinline=1&controls=0&modestbranding=1&rel=0&enablejsapi=1",
    is_trending: true,
    is_short: true,
  },
  {
    title: "India Today — Live News",
    link: "https://www.youtube.com/@IndiaToday",
    source: "India Today (YouTube)",
    platform: "youtube",
    published_at: new Date().toISOString(),
    thumbnail: "https://i.ytimg.com/vi/l_MyUGq7pgs/hqdefault.jpg",
    embed_url: "https://www.youtube.com/embed/live_stream?channel=UCYPvAwZP8pZhSMW8qs7cVCw&autoplay=1&mute=1&playsinline=1&controls=0&modestbranding=1&rel=0&enablejsapi=1",
    is_trending: true,
    is_short: true,
  },
  {
    title: "Aaj Tak — Live",
    link: "https://www.youtube.com/@aajtak",
    source: "Aaj Tak (YouTube)",
    platform: "youtube",
    published_at: new Date().toISOString(),
    thumbnail: "https://i.ytimg.com/vi/Nq2wYlWFucg/hqdefault.jpg",
    embed_url: "https://www.youtube.com/embed/live_stream?channel=UCt4t-jeY85JegMlZ-E5UWtA&autoplay=1&mute=1&playsinline=1&controls=0&modestbranding=1&rel=0&enablejsapi=1",
    is_trending: true,
    is_short: true,
  },
  {
    title: "ABP News — Live",
    link: "https://www.youtube.com/@ABPNEWS",
    source: "ABP News (YouTube)",
    platform: "youtube",
    published_at: new Date().toISOString(),
    thumbnail: "https://i.ytimg.com/vi/1rLQj3h2S7E/hqdefault.jpg",
    embed_url: "https://www.youtube-nocookie.com/embed/videoseries?list=UUmphdqZNmqL72WJ2uyiNw5w&autoplay=1&mute=1&playsinline=1&controls=0&modestbranding=1&rel=0&loop=1&enablejsapi=1",
    is_trending: true,
    is_short: true,
  },
  {
    title: "News18 India — Live",
    link: "https://www.youtube.com/@news18India",
    source: "News18 India (YouTube)",
    platform: "youtube",
    published_at: new Date().toISOString(),
    thumbnail: "https://i.ytimg.com/vi/fM9hM4e7XJc/hqdefault.jpg",
    embed_url: "https://www.youtube-nocookie.com/embed/videoseries?list=UUef1-8eOpJgud7szVPlZQA&autoplay=1&mute=1&playsinline=1&controls=0&modestbranding=1&rel=0&loop=1&enablejsapi=1",
    is_trending: true,
    is_short: true,
  },
  {
    title: "Republic World — Live",
    link: "https://www.youtube.com/@RepublicWorld",
    source: "Republic World (YouTube)",
    platform: "youtube",
    published_at: new Date().toISOString(),
    thumbnail: "https://i.ytimg.com/vi/jNQXAC9IVRw/hqdefault.jpg",
    embed_url: "https://www.youtube-nocookie.com/embed/videoseries?list=UUwqusr8YDwM-3mEYTDeJHzw&autoplay=1&mute=1&playsinline=1&controls=0&modestbranding=1&rel=0&loop=1&enablejsapi=1",
    is_trending: true,
    is_short: true,
  },
  {
    title: "WION — Live World News",
    link: "https://www.youtube.com/@WION",
    source: "WION (YouTube)",
    platform: "youtube",
    published_at: new Date().toISOString(),
    thumbnail: "https://i.ytimg.com/vi/JAzl6fM2V4w/hqdefault.jpg",
    embed_url: "https://www.youtube-nocookie.com/embed/videoseries?list=UU_gUM8rL-Lrg6O3adPW9K1g&autoplay=1&mute=1&playsinline=1&controls=0&modestbranding=1&rel=0&loop=1&enablejsapi=1",
    is_trending: true,
    is_short: true,
  },
  {
    title: "Reuters — Latest Video Briefings",
    link: "https://www.youtube.com/@Reuters",
    source: "Reuters (YouTube)",
    platform: "youtube",
    published_at: new Date().toISOString(),
    thumbnail: "https://i.ytimg.com/vi/tgbNymZ7vqY/hqdefault.jpg",
    embed_url: "https://www.youtube-nocookie.com/embed/videoseries?list=UUhqUTb7kYRX8-EiaN3XFrSQ&autoplay=1&mute=1&playsinline=1&controls=0&modestbranding=1&rel=0&loop=1&enablejsapi=1",
    is_trending: true,
    is_short: true,
  },
  {
    title: "DW News — Latest",
    link: "https://www.youtube.com/@dwnews",
    source: "DW News (YouTube)",
    platform: "youtube",
    published_at: new Date().toISOString(),
    thumbnail: "https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg",
    embed_url: "https://www.youtube-nocookie.com/embed/videoseries?list=UUknLrEdhRCp1aegoMqRaCZg&autoplay=1&mute=1&playsinline=1&controls=0&modestbranding=1&rel=0&loop=1&enablejsapi=1",
    is_trending: true,
    is_short: true,
  },
  {
    title: "France 24 — Live International",
    link: "https://www.youtube.com/@FRANCE24English",
    source: "France 24 (YouTube)",
    platform: "youtube",
    published_at: new Date().toISOString(),
    thumbnail: "https://i.ytimg.com/vi/l8PMl7tUDIE/hqdefault.jpg",
    embed_url: "https://www.youtube-nocookie.com/embed/videoseries?list=UUQfwfsi5VrQ8yKZ-UWmAEFg&autoplay=1&mute=1&playsinline=1&controls=0&modestbranding=1&rel=0&loop=1&enablejsapi=1",
    is_trending: true,
    is_short: true,
  },
  {
    title: "Sky News — Live",
    link: "https://www.youtube.com/@SkyNews",
    source: "Sky News (YouTube)",
    platform: "youtube",
    published_at: new Date().toISOString(),
    thumbnail: "https://i.ytimg.com/vi/9Auq9mYxFEE/hqdefault.jpg",
    embed_url: "https://www.youtube-nocookie.com/embed/live_stream?channel=UCoMdktPbSTixAyNGwb-UYkQ&autoplay=1&mute=1&playsinline=1&controls=0&modestbranding=1&rel=0&enablejsapi=1",
    is_trending: true,
    is_short: true,
  },
  {
    title: "CNBC — Business Reels",
    link: "https://www.youtube.com/@CNBC",
    source: "CNBC (YouTube)",
    platform: "youtube",
    published_at: new Date().toISOString(),
    thumbnail: "https://i.ytimg.com/vi/JAzl6fM2V4w/hqdefault.jpg",
    embed_url: "https://www.youtube-nocookie.com/embed/live_stream?channel=UCrp_UI8XtuYfpiqluWLD7Lw&autoplay=1&mute=1&playsinline=1&controls=0&modestbranding=1&rel=0&enablejsapi=1",
    is_trending: true,
    is_short: true,
  },
  {
    title: "TRT World — Latest Video",
    link: "https://www.youtube.com/@TRTWorld",
    source: "TRT World (YouTube)",
    platform: "youtube",
    published_at: new Date().toISOString(),
    thumbnail: "https://i.ytimg.com/vi/fM9hM4e7XJc/hqdefault.jpg",
    embed_url: "https://www.youtube-nocookie.com/embed/live_stream?channel=UC7fWeaHhqgM4Ry-RMpM2YYw&autoplay=1&mute=1&playsinline=1&controls=0&modestbranding=1&rel=0&enablejsapi=1",
    is_trending: true,
    is_short: true,
  },
  {
    title: "ABC News — Top Videos",
    link: "https://www.youtube.com/@ABCNews",
    source: "ABC News (YouTube)",
    platform: "youtube",
    published_at: new Date().toISOString(),
    thumbnail: "https://i.ytimg.com/vi/1rLQj3h2S7E/hqdefault.jpg",
    embed_url: "https://www.youtube-nocookie.com/embed/live_stream?channel=UCBi2mrWuNuyYy4gbM6fU18Q&autoplay=1&mute=1&playsinline=1&controls=0&modestbranding=1&rel=0&enablejsapi=1",
    is_trending: true,
    is_short: true,
  },
];

function normalizeToTwenty(items: VideoWireItem[]): VideoWireItem[] {
  const compact = items.filter((item): item is VideoWireItem => Boolean(item));
  if (compact.length === 0) return [];
  if (compact.length >= 20) return compact;
  const out = [...compact];
  let pointer = 0;
  while (out.length < 20) {
    const next = compact[pointer % compact.length];
    if (!next) break;
    out.push(next);
    pointer += 1;
  }
  return out;
}

function mixSocialAndImageReels(items: VideoWireItem[]): VideoWireItem[] {
  const compact = items.filter((item): item is VideoWireItem => Boolean(item));
  if (compact.length === 0) return OFFICIAL_SOCIAL_POSTS;

  const isVideoItem = (item: VideoWireItem) =>
    item.media_type === "video" ||
    item.platform === "youtube" ||
    Boolean(item.video_id) ||
    Boolean(item.embed_url);

  const shortVideos = compact.filter((item) => isVideoItem(item) && item.is_short);
  const otherVideos = compact.filter((item) => isVideoItem(item) && !item.is_short);
  const nonVideos = compact.filter((item) => !isVideoItem(item));
  const ordered = [...shortVideos, ...otherVideos, ...nonVideos];

  const mixed: VideoWireItem[] = [];
  for (let i = 0; i < ordered.length; i += 1) {
    const current = ordered[i];
    if (current) mixed.push(current);

    if ((i + 1) % 8 === 0) {
      const social = OFFICIAL_SOCIAL_POSTS[Math.floor(i / 8) % OFFICIAL_SOCIAL_POSTS.length];
      mixed.push(social);
    }
  }
  return mixed;
}

function buildReliableMixedPool(liveItems: VideoWireItem[], cached: VideoWireItem[]): VideoWireItem[] {
  const base = liveItems.length > 0 ? liveItems : cached;
  const seed = [...base, ...FALLBACK_VIDEOS, ...OFFICIAL_SOCIAL_POSTS];
  const dedupe = new Set<string>();
  const unique = seed.filter((item) => {
    const key = `${item.platform}:${item.link}`;
    if (dedupe.has(key)) return false;
    dedupe.add(key);
    return true;
  });
  return mixSocialAndImageReels(unique);
}

function sanitizeVideoItems(items: VideoWireRaw[]): VideoWireItem[] {
  return items
    .filter((item): item is Partial<VideoWireItem> => Boolean(item && typeof item === "object"))
    .map((item) => {
      const platform = item.platform;
      const safePlatform: VideoWireItem["platform"] =
        platform === "youtube" ||
        platform === "publisher" ||
        platform === "x" ||
        platform === "threads" ||
        platform === "facebook" ||
        platform === "instagram"
          ? platform
          : "publisher";

      return {
        title: typeof item.title === "string" && item.title.trim().length > 0 ? item.title : "Untitled",
        link: typeof item.link === "string" ? item.link : "",
        source: typeof item.source === "string" && item.source.trim().length > 0 ? item.source : "Verified Source",
        platform: safePlatform,
        published_at: typeof item.published_at === "string" ? item.published_at : new Date().toISOString(),
        thumbnail: typeof item.thumbnail === "string" ? item.thumbnail : null,
        video_id: typeof item.video_id === "string" ? item.video_id : null,
        embed_url: typeof item.embed_url === "string" ? item.embed_url : null,
        is_short: Boolean(item.is_short),
        is_trending: item.is_trending ?? true,
        duration_seconds: typeof item.duration_seconds === "number" ? item.duration_seconds : null,
        is_verified_source: item.is_verified_source ?? true,
        media_type: item.media_type,
        source_url: typeof item.source_url === "string" ? item.source_url : undefined,
      };
    })
    .filter((item) => item.link.length > 0);
}

function platformLabel(platform: VideoWireItem["platform"]): string {
  if (platform === "x") return "X";
  if (platform === "threads") return "Threads";
  if (platform === "facebook") return "Facebook";
  if (platform === "instagram") return "Instagram";
  if (platform === "youtube") return "YouTube";
  return "Publisher Feed";
}

function parseYoutubeId(link: string): string | null {
  try {
    const url = new URL(link);
    if (url.hostname.includes("youtube.com")) {
      const fromQuery = url.searchParams.get("v");
      if (fromQuery) return fromQuery;
      const parts = url.pathname.split("/").filter(Boolean);
      const shortsIndex = parts.indexOf("shorts");
      if (shortsIndex >= 0 && parts[shortsIndex + 1]) return parts[shortsIndex + 1];
    }
    if (url.hostname.includes("youtu.be")) {
      return url.pathname.split("/").filter(Boolean)[0] ?? null;
    }
  } catch {
    return null;
  }
  return null;
}

function fallbackEmbedBySource(sourceName: string): string | null {
  const key = Object.keys(CHANNEL_EMBED_BY_SOURCE).find((k) => sourceName.toLowerCase().includes(k.toLowerCase()));
  if (!key) return null;
  return CHANNEL_EMBED_BY_SOURCE[key];
}

function fallbackThumbnailBySource(sourceName: string): string {
  const logo = CHANNEL_LOGOS.find((item) => sourceName.toLowerCase().includes(item.name.toLowerCase()));
  return logo?.src ?? "/logo.svg";
}

async function fetchVideoWire() {
  if (import.meta.env.DEV) {
    return [];
  }

  try {
    const { data, error } = await supabase.functions.invoke("video-wire-feed", {
      body: {
        limit: 80,
        platform: "all",
        verifiedOnly: true,
        maxDurationSeconds: 120,
        strictDuration: true,
      },
    });

    if (error) {
      console.warn("video-wire-feed unavailable, using fallback", error.message);
      return [];
    }

    return sanitizeVideoItems((data?.videos ?? []) as VideoWireRaw[]);
  } catch (error) {
    console.warn("video-wire-feed request failed, using fallback", error);
    return [];
  }
}

function timeAgo(isoDate: string): string {
  const date = new Date(isoDate).getTime();
  if (Number.isNaN(date)) return "Recently";
  const delta = Date.now() - date;
  const mins = Math.floor(delta / (1000 * 60));
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function postYoutubeCommand(iframe: HTMLIFrameElement | null, func: string, args: unknown[] = []) {
  if (!iframe?.contentWindow) return;
  try {
    iframe.contentWindow.postMessage(
      JSON.stringify({ event: "command", func, args }),
      "*",
    );
  } catch {
    // Ignore transient iframe postMessage issues
  }
}

export default function VideoWire() {
  const navigate = useNavigate();
  const reelContainerRef = useRef<HTMLDivElement | null>(null);
  const reelRefs = useRef<(HTMLElement | null)[]>([]);
  const iframeRefs = useRef<(HTMLIFrameElement | null)[]>([]);
  const sourcePoolRef = useRef<VideoWireItem[]>([]);
  const sourcePoolKeyRef = useRef<string>("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [cachedVideos, setCachedVideos] = useState<VideoWireItem[]>([]);
  const [renderedReels, setRenderedReels] = useState<RenderReel[]>([]);
  const [reactions, setReactions] = useState<Record<string, ReactionState>>({});
  const [isOffline, setIsOffline] = useState<boolean>(typeof navigator !== "undefined" ? !navigator.onLine : false);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [audioEnabledByUser, setAudioEnabledByUser] = useState(false);

  const {
    data: videos = [],
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["video-wire-feed"],
    queryFn: fetchVideoWire,
    staleTime: 3 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as VideoWireRaw[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCachedVideos(sanitizeVideoItems(parsed));
        }
      }
      const storedReactions = localStorage.getItem(REACTION_KEY);
      if (storedReactions) {
        setReactions(JSON.parse(storedReactions));
      }
    } catch {
      // ignore cache errors
    }
  }, []);

  useEffect(() => {
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    if (videos.length === 0) return;
    const latest = normalizeToTwenty(buildReliableMixedPool(sanitizeVideoItems(videos), []).slice(0, 50));
    setCachedVideos(latest);
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(latest));
    } catch {
      // ignore write errors
    }
  }, [videos]);

  const sourcePool = useMemo(() => {
    const pool = buildReliableMixedPool(sanitizeVideoItems(videos), sanitizeVideoItems(cachedVideos));
    if (pool.length > 0) return normalizeToTwenty(pool);
    return normalizeToTwenty(mixSocialAndImageReels(FALLBACK_VIDEOS));
  }, [videos, cachedVideos]);

  const sourceCount = useMemo(
    () => new Set(sourcePool.filter((item) => Boolean(item?.source)).map((item) => item.source)).size,
    [sourcePool],
  );
  const sourcePoolKey = useMemo(
    () => sourcePool.filter((item) => Boolean(item?.link)).slice(0, 20).map((item) => item.link).join("|"),
    [sourcePool],
  );
  const isFallback = videos.length === 0;
  const visibleCount = sourcePool.length >= 20 ? "20+" : String(sourcePool.length);

  useEffect(() => {
    sourcePoolRef.current = sourcePool;
  }, [sourcePool]);

  useEffect(() => {
    if (sourcePool.length === 0) return;
    if (sourcePoolKeyRef.current === sourcePoolKey && renderedReels.length > 0) return;

    sourcePoolKeyRef.current = sourcePoolKey;
    const initial = sourcePool
      .filter((item): item is VideoWireItem => Boolean(item && item.link))
      .slice(0, 20)
      .map((item, idx) => ({
        ...item,
        reel_key: `${item.link}-${idx}-0`,
      }));
    setRenderedReels(initial);
    setActiveIndex(0);
    reelRefs.current = [];
    iframeRefs.current = [];
  }, [sourcePool, sourcePoolKey, renderedReels.length]);

  useEffect(() => {
    if (sourcePoolRef.current.length === 0 || renderedReels.length === 0) return;
    if (activeIndex < renderedReels.length - 5) return;

    setRenderedReels((prev) => {
      const pool = sourcePoolRef.current;
      if (pool.length === 0) return prev;
      const next: RenderReel[] = [];
      const start = prev.length;
      for (let i = 0; i < 10; i += 1) {
        const base = pool[(start + i) % pool.length];
        if (!base?.link) continue;
        next.push({
          ...base,
          reel_key: `${base.link}-${start + i}-${Math.floor((start + i) / pool.length)}`,
        });
      }
      return [...prev, ...next];
    });
  }, [activeIndex, renderedReels.length]);

  useEffect(() => {
    const container = reelContainerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let bestIndex = -1;
        let bestRatio = 0;

        entries.forEach((entry) => {
          const index = Number((entry.target as HTMLElement).dataset.index);
          if (entry.isIntersecting && entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio;
            bestIndex = index;
          }
        });

        if (bestIndex >= 0) {
          setActiveIndex((prev) => (prev === bestIndex ? prev : bestIndex));
        }
      },
      { root: container, threshold: [0.5, 0.7, 0.85] },
    );

    reelRefs.current.forEach((node) => {
      if (node) observer.observe(node);
    });

    return () => observer.disconnect();
  }, [renderedReels.length]);

  useEffect(() => {
    if (!reelContainerRef.current) return;

    const ctx = gsap.context(() => {
      reelRefs.current.forEach((node) => {
        if (!node) return;
        gsap.fromTo(
          node,
          { opacity: 0.55, y: 50, scale: 0.98 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            ease: "power2.out",
            scrollTrigger: {
              trigger: node,
              scroller: reelContainerRef.current,
              start: "top 85%",
              end: "bottom 15%",
              scrub: false,
            },
          },
        );
      });
    }, reelContainerRef);

    return () => ctx.revert();
  }, [renderedReels.length]);

  useEffect(() => {
    iframeRefs.current.forEach((iframe, index) => {
      if (!iframe) return;
      const command = index === activeIndex ? "playVideo" : "pauseVideo";
      postYoutubeCommand(iframe, command);
    });
  }, [activeIndex, renderedReels.length]);

  useEffect(() => {
    const iframe = iframeRefs.current[activeIndex];
    if (!iframe) return;
    const shouldMute = !audioEnabledByUser || isMuted;
    postYoutubeCommand(iframe, shouldMute ? "mute" : "unMute");
    if (!shouldMute) {
      postYoutubeCommand(iframe, "setVolume", [100]);
    }
  }, [activeIndex, isMuted, audioEnabledByUser]);

  useEffect(() => {
    const container = reelContainerRef.current;
    if (!container || audioEnabledByUser) return;

    const unlock = () => {
      setAudioEnabledByUser(true);
      setIsMuted(false);
    };

    container.addEventListener("pointerdown", unlock, { once: true });
    container.addEventListener("touchstart", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });

    return () => {
      container.removeEventListener("pointerdown", unlock);
      container.removeEventListener("touchstart", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [audioEnabledByUser]);

  useEffect(() => {
    if (!isAutoScroll || renderedReels.length === 0) return;

    const timer = window.setInterval(() => {
      const nextIndex = activeIndex + 1;
      const nextReel = reelRefs.current[nextIndex];
      if (nextReel) {
        nextReel.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 9000);

    return () => window.clearInterval(timer);
  }, [isAutoScroll, activeIndex, renderedReels.length]);

  const toggleMute = () => {
    setAudioEnabledByUser(true);
    setIsMuted((prev) => !prev);
  };

  const breadcrumbItems: BreadcrumbItem[] = [
    { id: "home", label: "Home", path: "/", type: "home", icon: <Home className="w-3.5 h-3.5" /> },
    { id: "reelwire", label: "ReelWire", path: "/reelwire", type: "locality", icon: <Film className="w-3.5 h-3.5" /> },
  ];

  const handleReact = (reelKey: string, reaction: ReactionType) => {
    setReactions((prev) => {
      const current = prev[reelKey] ?? { love: 0, like: 0, dislike: 0 };
      const next: ReactionState = { ...current };

      if (current.user === reaction) {
        next[reaction] = Math.max(0, next[reaction] - 1);
        delete next.user;
      } else {
        if (current.user) {
          next[current.user] = Math.max(0, next[current.user] - 1);
        }
        next[reaction] += 1;
        next.user = reaction;
      }

      const merged = { ...prev, [reelKey]: next };
      try {
        localStorage.setItem(REACTION_KEY, JSON.stringify(merged));
      } catch {
        // ignore
      }
      return merged;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="pt-14" />

      <div className="sticky top-14 z-40 bg-background/95 backdrop-blur-md border-b border-border/40">
        <div className="container mx-auto max-w-6xl px-0">
          <BreadcrumbNav
            items={breadcrumbItems}
            onNavigate={(item) => {
              if (item.path) navigate(item.path);
            }}
            showHamburger={false}
          />
        </div>
      </div>

      <div className="border-b border-border/30 bg-background/90 overflow-hidden">
        <div className="container mx-auto max-w-6xl px-4 py-2">
          <div className="group overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]">
            <div className="animate-source-marquee flex w-max items-center gap-6 py-1">
              {CHANNEL_LOGO_DETAILS.map((logo, idx) => (
                <a
                  key={`${logo.name}-${idx}`}
                  href={logo.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-2 opacity-75 hover:opacity-100 transition-opacity shrink-0"
                  title={logo.name}
                >
                  <img src={logo.src} alt={logo.name} className="h-5 w-auto object-contain" loading="lazy" />
                  <span className="text-[11px] sm:text-xs text-muted-foreground whitespace-nowrap">{logo.name} • Verified</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto max-w-6xl px-4 pb-6">
      <section className="pt-4 pb-3">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Badge variant="outline" className="gap-1.5">
            <Film className="h-3.5 w-3.5" />
            Trending Latest Reels
          </Badge>
          <Badge variant="secondary" className="gap-1.5">
            <Radio className="h-3.5 w-3.5" />
            Auto + Manual Scroll
          </Badge>
          <Badge variant="outline" className="gap-1.5">
            <Youtube className="h-3.5 w-3.5 text-red-500" />
            Video + Image + Official Posts
          </Badge>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mb-1">
          ReelWire — Verified News Reels
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-3xl">
          Scroll manually or use auto mode. Open any verified badge to jump directly to the official source.
        </p>
      </section>

      <section className="pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="text-sm text-muted-foreground">
            {isLoading && sourcePool.length === 0
              ? "Loading live video feed..."
              : isLoading && sourcePool.length > 0
                ? `Showing ${visibleCount} ready reels while live feed connects`
              : isFallback
                ? `Showing ${visibleCount} ready reels`
                : `${videos.length} latest reels from ${sourceCount} news channels`}
          </div>
          <div className="flex items-center gap-2">
            <Button variant={isAutoScroll ? "default" : "outline"} size="sm" onClick={() => setIsAutoScroll((prev) => !prev)}>
              {isAutoScroll ? "Auto Scroll" : "Manual Scroll"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? "Refreshing..." : "Refresh"}
            </Button>
            <Button variant="outline" size="sm" onClick={toggleMute}>
              {isMuted ? <VolumeX className="h-4 w-4 mr-1.5" /> : <Volume2 className="h-4 w-4 mr-1.5" />}
              {!audioEnabledByUser ? "Enable Audio" : isMuted ? "Muted" : "Audio On"}
            </Button>
          </div>
        </div>

        <div
          ref={reelContainerRef}
          className="h-[calc(100vh-17rem)] md:h-[calc(100vh-18rem)] overflow-y-auto snap-y snap-mandatory scroll-smooth"
        >
          {renderedReels.map((video, index) => {
            const videoId = video.video_id || parseYoutubeId(video.link);
            const sourceEmbed = fallbackEmbedBySource(video.source);
            const mediaType = video.media_type ?? ((videoId || video.embed_url || sourceEmbed) ? "video" : video.thumbnail ? "image" : "post");
            const withinDuration = typeof video.duration_seconds === "number" ? video.duration_seconds <= 120 : false;
            const shortLike = Boolean(video.is_short) || withinDuration;
            const canEmbedVideo = mediaType === "video" && Boolean(videoId) && shortLike && withinDuration;
            const shouldMountPlayer = canEmbedVideo && Math.abs(index - activeIndex) <= 1;
            const sourceLink = video.source_url || video.link;
            const normalizedEmbed = video.embed_url?.includes("live_stream") && sourceEmbed ? sourceEmbed : video.embed_url;
            const isActuallyMuted = !audioEnabledByUser || isMuted;
            const origin = typeof window !== "undefined" ? window.location.origin : "https://newstack.live";
            const posterSrc = mediaType === "video"
              ? fallbackThumbnailBySource(video.source)
              : (video.thumbnail || fallbackThumbnailBySource(video.source));

            const embedUrl = shouldMountPlayer
              ? (normalizedEmbed || (videoId
                  ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=${index === activeIndex ? 1 : 0}&mute=${isActuallyMuted ? 1 : 0}&playsinline=1&controls=1&modestbranding=1&rel=0&loop=1&playlist=${videoId}&enablejsapi=1&origin=${encodeURIComponent(origin)}`
                  : sourceEmbed
                    ? `${sourceEmbed}&autoplay=${index === activeIndex ? 1 : 0}&mute=${isActuallyMuted ? 1 : 0}&playsinline=1&controls=1&modestbranding=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(origin)}`
                    : null))
              : null;

            const reaction = reactions[video.reel_key] ?? { love: 0, like: 0, dislike: 0 };

            return (
              <div
                key={video.reel_key}
                data-index={index}
                ref={(el) => {
                  reelRefs.current[index] = el;
                }}
                className="reel-item snap-start h-[calc(100vh-17rem)] md:h-[calc(100vh-18rem)] py-1"
                onClick={() => {
                  setActiveIndex(index);
                }}
              >
                <Card className="border-border/40 overflow-hidden h-full bg-black/95 max-w-[520px] mx-auto rounded-2xl">
                  <div className="relative h-full w-full">
                    <div className="absolute top-2 left-2 right-2 z-20 h-1 rounded-full bg-white/20 overflow-hidden">
                      <div className={`h-full transition-all duration-500 ${index === activeIndex ? "w-full bg-white" : "w-0 bg-white/40"}`} />
                    </div>

                    {embedUrl ? (
                      <iframe
                        ref={(el) => {
                          iframeRefs.current[index] = el;
                        }}
                        title={video.title}
                        src={embedUrl}
                        className="absolute inset-0 h-full w-full"
                        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                      />
                    ) : posterSrc ? (
                      <img
                        src={posterSrc}
                        alt={video.title}
                        className="absolute inset-0 h-full w-full object-cover bg-black"
                        loading="lazy"
                        onError={(event) => {
                          const img = event.currentTarget;
                          if (img.src.endsWith("/logo.svg")) return;
                          img.src = "/logo.svg";
                        }}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-white/90 px-5 text-center bg-gradient-to-b from-black/70 to-black/90">
                        <div>
                          <PlayCircle className="h-12 w-12 mx-auto mb-3" />
                          <p className="text-sm sm:text-base font-medium">Open verified source post</p>
                        </div>
                      </div>
                    )}

                    {!embedUrl && canEmbedVideo && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                        <div className="rounded-full bg-black/60 p-3 text-white">
                          <PlayCircle className="h-8 w-8" />
                        </div>
                      </div>
                    )}

                    <div className="absolute right-3 bottom-16 z-20 flex flex-col items-center gap-2 text-white">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          handleReact(video.reel_key, "love");
                        }}
                        className={`h-10 w-10 rounded-full border flex items-center justify-center text-sm ${reaction.user === "love" ? "bg-pink-500/35 border-pink-300/70" : "bg-black/45 border-white/35"}`}
                        title="Love"
                      >
                        ❤️
                      </button>
                      <span className="text-[11px] text-white/85 -mt-1">{reaction.love}</span>

                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          handleReact(video.reel_key, "like");
                        }}
                        className={`h-10 w-10 rounded-full border flex items-center justify-center text-sm ${reaction.user === "like" ? "bg-emerald-500/35 border-emerald-300/70" : "bg-black/45 border-white/35"}`}
                        title="Like"
                      >
                        👍
                      </button>
                      <span className="text-[11px] text-white/85 -mt-1">{reaction.like}</span>

                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          handleReact(video.reel_key, "dislike");
                        }}
                        className={`h-10 w-10 rounded-full border flex items-center justify-center text-sm ${reaction.user === "dislike" ? "bg-red-500/35 border-red-300/70" : "bg-black/45 border-white/35"}`}
                        title="Dislike"
                      >
                        👎
                      </button>
                      <span className="text-[11px] text-white/85 -mt-1">{reaction.dislike}</span>

                      <a
                        href={sourceLink}
                        target="_blank"
                        rel="noreferrer noopener"
                        onClick={(event) => event.stopPropagation()}
                        className="h-10 w-10 rounded-full border bg-black/45 border-white/35 flex items-center justify-center"
                        title="Open source"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>

                    <div className="absolute inset-x-0 bottom-0 p-4 pr-16 bg-gradient-to-t from-black/90 via-black/60 to-transparent text-white">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {(video.is_trending ?? true) && (
                          <Badge className="bg-red-600 text-white hover:bg-red-600">Trending</Badge>
                        )}
                        {video.is_short && (
                          <Badge variant="secondary" className="bg-white/15 text-white border-white/20">Short Reel</Badge>
                        )}
                        <Badge variant="outline" className="border-white/30 text-white/90">
                          {platformLabel(video.platform)}
                        </Badge>
                        {(video.is_verified_source ?? true) && (
                          <a href={sourceLink} target="_blank" rel="noreferrer noopener" className="inline-flex">
                            <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-100 border border-emerald-300/40 hover:bg-emerald-500/30">
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                              Verified
                            </Badge>
                          </a>
                        )}
                      </div>
                      <p className="text-base sm:text-lg font-semibold leading-snug line-clamp-3 mb-1">{video.title}</p>
                      <div className="text-xs sm:text-sm text-white/80 flex items-center gap-2 mb-3">
                        <span>{timeAgo(video.published_at)}</span>
                        <span>•</span>
                        <span>Source: {video.source}</span>
                        <span>•</span>
                        <a
                          href={sourceLink}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center gap-1 hover:text-white"
                        >
                          Open source
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>

        {!isLoading && isFallback && (
          <Card className="border-border/60 mt-3">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              {isOffline
                ? "You are offline. Showing your last saved 20+ reels."
                : "Refreshing latest reels. Showing 20+ ready reels right now."}
            </CardContent>
          </Card>
        )}

        <div className="mt-3 rounded-lg border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground flex items-start gap-2">
          <ShieldCheck className="h-4 w-4 mt-0.5 text-emerald-600" />
          ReelWire shows verified source reels with clear platform labels, mixes video and image/post cards, and opens each source directly.
        </div>
      </section>
      </main>

      <Footer />
    </div>
  );
}
