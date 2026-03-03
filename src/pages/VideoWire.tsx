import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ExternalLink, Film, Home, PlayCircle, Radio, ShieldCheck, Volume2, VolumeX, Youtube } from "lucide-react";
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
  platform: "youtube" | "publisher";
  published_at: string;
  thumbnail: string | null;
  video_id?: string | null;
  embed_url?: string | null;
  is_short?: boolean;
  is_trending?: boolean;
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

const CACHE_KEY = "newstack_reelwire_cached_videos";
const REACTION_KEY = "newstack_reelwire_reactions";

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
  if (items.length >= 20) return items;
  const out = [...items];
  let pointer = 0;
  while (out.length < 20) {
    out.push(items[pointer % items.length]);
    pointer += 1;
  }
  return out;
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

async function fetchVideoWire() {
  try {
    const { data, error } = await supabase.functions.invoke("video-wire-feed", {
      body: { limit: 80, platform: "youtube" },
    });

    if (error) {
      console.warn("video-wire-feed unavailable, using fallback", error.message);
      return [];
    }

    return (data?.videos ?? []) as VideoWireItem[];
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

function postYoutubeCommand(iframe: HTMLIFrameElement | null, func: string) {
  if (!iframe?.contentWindow) return;
  try {
    iframe.contentWindow.postMessage(
      JSON.stringify({ event: "command", func, args: [] }),
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
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [cachedVideos, setCachedVideos] = useState<VideoWireItem[]>([]);
  const [renderedReels, setRenderedReels] = useState<RenderReel[]>([]);
  const [reactions, setReactions] = useState<Record<string, ReactionState>>({});
  const [isOffline, setIsOffline] = useState<boolean>(typeof navigator !== "undefined" ? !navigator.onLine : false);

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
        const parsed = JSON.parse(raw) as VideoWireItem[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCachedVideos(parsed);
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
    const latest = normalizeToTwenty(videos).slice(0, 50);
    setCachedVideos(latest);
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(latest));
    } catch {
      // ignore write errors
    }
  }, [videos]);

  const sourcePool = useMemo(() => {
    if (videos.length > 0) return normalizeToTwenty(videos);
    if (cachedVideos.length > 0) return normalizeToTwenty(cachedVideos);
    return normalizeToTwenty(FALLBACK_VIDEOS);
  }, [videos, cachedVideos]);

  const sourceCount = useMemo(() => new Set(sourcePool.map((item) => item.source)).size, [sourcePool]);
  const isFallback = videos.length === 0;

  useEffect(() => {
    sourcePoolRef.current = sourcePool;
  }, [sourcePool]);

  useEffect(() => {
    const initial = sourcePool.slice(0, 20).map((item, idx) => ({
      ...item,
      reel_key: `${item.link}-${idx}-0`,
    }));
    setRenderedReels(initial);
    setActiveIndex(0);
    reelRefs.current = [];
    iframeRefs.current = [];
  }, [sourcePool]);

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
    postYoutubeCommand(iframe, isMuted ? "mute" : "unMute");
  }, [activeIndex, isMuted]);

  const toggleMute = () => setIsMuted((prev) => !prev);

  const breadcrumbItems: BreadcrumbItem[] = [
    { id: "home", label: "Home", path: "/", type: "home", icon: <Home className="w-3.5 h-3.5" /> },
    { id: "reelwire", label: "ReelWire", path: "/video-wire", type: "locality", icon: <Film className="w-3.5 h-3.5" /> },
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

      <div className="hidden lg:block border-b border-border/30 bg-background/90">
        <div className="container mx-auto max-w-6xl px-4 py-2 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-5 min-w-max">
            {CHANNEL_LOGOS.map((logo) => (
              <a
                key={logo.name}
                href={logo.href}
                target="_blank"
                rel="noreferrer noopener"
                className="opacity-70 hover:opacity-100 transition-opacity shrink-0"
                title={logo.name}
              >
                <img src={logo.src} alt={logo.name} className="h-5 w-auto object-contain" loading="lazy" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <main className="container mx-auto max-w-6xl px-4 pb-6">
      <section className="pt-4 pb-3">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Badge variant="outline" className="gap-1.5">
            <Film className="h-3.5 w-3.5" />
            Trending Latest Videos
          </Badge>
          <Badge variant="secondary" className="gap-1.5">
            <Radio className="h-3.5 w-3.5" />
            ReelWire Reels
          </Badge>
          <Badge variant="outline" className="gap-1.5">
            <Youtube className="h-3.5 w-3.5 text-red-500" />
            News Channel Shorts
          </Badge>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mb-1">
          ReelWire — Auto-play News Reels
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-3xl">
          Scroll down for the next reel. Active video auto-plays muted. Tap mute/unmute anytime.
        </p>
      </section>

      <section className="pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="text-sm text-muted-foreground">
            {isLoading
              ? "Loading live video feed..."
              : isFallback
                ? `Showing ${sourcePool.length >= 20 ? "20+" : sourcePool.length} reels from cached/fallback sources`
                : `${videos.length} latest reels from ${sourceCount} news channels`}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? "Refreshing..." : "Refresh"}
            </Button>
            <Button variant="outline" size="sm" onClick={toggleMute}>
              {isMuted ? <VolumeX className="h-4 w-4 mr-1.5" /> : <Volume2 className="h-4 w-4 mr-1.5" />}
              {isMuted ? "Muted" : "Sound On"}
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

            const embedUrl = video.embed_url || (videoId
              ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=${index === activeIndex ? 1 : 0}&mute=${isMuted ? 1 : 0}&playsinline=1&controls=0&modestbranding=1&rel=0&loop=1&playlist=${videoId}&enablejsapi=1`
              : sourceEmbed
                ? `${sourceEmbed}&autoplay=${index === activeIndex ? 1 : 0}&mute=${isMuted ? 1 : 0}&playsinline=1&controls=0&modestbranding=1&rel=0&enablejsapi=1`
                : null);

            const reaction = reactions[video.reel_key] ?? { love: 0, like: 0, dislike: 0 };

            return (
              <div
                key={video.reel_key}
                data-index={index}
                ref={(el) => {
                  reelRefs.current[index] = el;
                }}
                className="reel-item snap-start h-[calc(100vh-17rem)] md:h-[calc(100vh-18rem)] py-2"
              >
                <Card className="border-border/60 overflow-hidden h-full bg-black/90">
                  <div className="relative h-full w-full">
                    {embedUrl ? (
                      <iframe
                        ref={(el) => {
                          iframeRefs.current[index] = el;
                        }}
                        title={video.title}
                        src={embedUrl}
                        className="absolute inset-0 h-full w-full"
                        allow="autoplay; encrypted-media; picture-in-picture"
                        allowFullScreen
                      />
                    ) : video.thumbnail ? (
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-white/70">
                        <PlayCircle className="h-12 w-12" />
                      </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/85 to-transparent text-white">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {(video.is_trending ?? true) && (
                          <Badge className="bg-red-600 text-white hover:bg-red-600">Trending</Badge>
                        )}
                        {video.is_short && (
                          <Badge variant="secondary" className="bg-white/15 text-white border-white/20">Short Reel</Badge>
                        )}
                        <Badge variant="outline" className="border-white/30 text-white/90">
                          {video.source}
                        </Badge>
                      </div>
                      <p className="text-base sm:text-lg font-semibold leading-snug line-clamp-3 mb-1">{video.title}</p>
                      <div className="text-xs sm:text-sm text-white/80 flex items-center gap-2 mb-3">
                        <span>{timeAgo(video.published_at)}</span>
                        <span>•</span>
                        <a
                          href={video.link}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center gap-1 hover:text-white"
                        >
                          Open source
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReact(video.reel_key, "love")}
                          className={`px-2.5 py-1 rounded-full text-xs border ${reaction.user === "love" ? "bg-pink-500/25 border-pink-300/60" : "bg-black/25 border-white/25"}`}
                        >
                          ❤️ {reaction.love}
                        </button>
                        <button
                          onClick={() => handleReact(video.reel_key, "like")}
                          className={`px-2.5 py-1 rounded-full text-xs border ${reaction.user === "like" ? "bg-emerald-500/25 border-emerald-300/60" : "bg-black/25 border-white/25"}`}
                        >
                          👍 {reaction.like}
                        </button>
                        <button
                          onClick={() => handleReact(video.reel_key, "dislike")}
                          className={`px-2.5 py-1 rounded-full text-xs border ${reaction.user === "dislike" ? "bg-red-500/25 border-red-300/60" : "bg-black/25 border-white/25"}`}
                        >
                          👎 {reaction.dislike}
                        </button>
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
                ? "You are offline. Showing cached/fallback 20+ reels."
                : "Live scraping pipeline is not deployed in this environment yet. Showing 20+ fallback reels."}
            </CardContent>
          </Card>
        )}

        <div className="mt-3 rounded-lg border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground flex items-start gap-2">
          <ShieldCheck className="h-4 w-4 mt-0.5 text-emerald-600" />
          ReelWire always prioritizes latest channel videos, caches reels for offline mode, and continues infinite scrolling across sources.
        </div>
      </section>
      </main>

      <Footer />
    </div>
  );
}
