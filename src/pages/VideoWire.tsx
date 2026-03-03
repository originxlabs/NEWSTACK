import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ExternalLink, Film, PlayCircle, Radio, ShieldCheck, Volume2, VolumeX, Youtube } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

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
];

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
  const reelContainerRef = useRef<HTMLDivElement | null>(null);
  const reelRefs = useRef<(HTMLElement | null)[]>([]);
  const iframeRefs = useRef<(HTMLIFrameElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);

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
    retry: false,
    refetchOnWindowFocus: false,
  });

  const sourceCount = useMemo(() => new Set(videos.map((item) => item.source)).size, [videos]);
  const displayVideos = videos.length > 0 ? videos : FALLBACK_VIDEOS;
  const isFallback = videos.length === 0;

  useEffect(() => {
    const container = reelContainerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let bestIndex = activeIndex;
        let bestRatio = 0;

        entries.forEach((entry) => {
          const index = Number((entry.target as HTMLElement).dataset.index);
          if (entry.isIntersecting && entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio;
            bestIndex = index;
          }
        });

        if (bestIndex !== activeIndex) {
          setActiveIndex(bestIndex);
        }
      },
      { root: container, threshold: [0.5, 0.7, 0.85] },
    );

    reelRefs.current.forEach((node) => {
      if (node) observer.observe(node);
    });

    return () => observer.disconnect();
  }, [displayVideos.length, activeIndex]);

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
  }, [displayVideos.length]);

  useEffect(() => {
    iframeRefs.current.forEach((iframe, index) => {
      if (!iframe) return;
      const command = index === activeIndex ? "playVideo" : "pauseVideo";
      postYoutubeCommand(iframe, command);
    });
  }, [activeIndex, displayVideos.length]);

  useEffect(() => {
    const iframe = iframeRefs.current[activeIndex];
    if (!iframe) return;
    postYoutubeCommand(iframe, isMuted ? "mute" : "unMute");
  }, [activeIndex, isMuted]);

  const toggleMute = () => setIsMuted((prev) => !prev);

  return (
    <main className="h-screen bg-background overflow-hidden">
      <section className="container mx-auto max-w-6xl px-4 pt-20 pb-3">
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

      <section className="container mx-auto max-w-6xl px-4 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="text-sm text-muted-foreground">
            {isLoading
              ? "Loading live video feed..."
              : isFallback
                ? "Showing fallback sources until edge function is deployed"
                : `${videos.length} videos from ${sourceCount} sources`}
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
          className="h-[calc(100vh-12.5rem)] overflow-y-auto snap-y snap-mandatory scroll-smooth"
        >
          {displayVideos.map((video, index) => {
            const videoId = video.video_id || (() => {
              try {
                const url = new URL(video.link);
                if (url.hostname.includes("youtube.com")) {
                  const fromQuery = url.searchParams.get("v");
                  if (fromQuery) return fromQuery;
                  const parts = url.pathname.split("/").filter(Boolean);
                  const shortsIndex = parts.indexOf("shorts");
                  if (shortsIndex >= 0 && parts[shortsIndex + 1]) return parts[shortsIndex + 1];
                }
                if (url.hostname.includes("youtu.be")) {
                  const id = url.pathname.split("/").filter(Boolean)[0];
                  if (id) return id;
                }
                return null;
              } catch {
                return null;
              }
            })();

            const embedUrl = video.embed_url || (videoId
              ? `https://www.youtube.com/embed/${videoId}?autoplay=${index === activeIndex ? 1 : 0}&mute=${isMuted ? 1 : 0}&playsinline=1&controls=0&modestbranding=1&rel=0&loop=1&playlist=${videoId}&enablejsapi=1`
              : null);

            return (
              <div
                key={`${video.link}-${index}`}
                data-index={index}
                ref={(el) => {
                  reelRefs.current[index] = el;
                }}
                className="reel-item snap-start h-[calc(100vh-12.5rem)] py-2"
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
                      <div className="text-xs sm:text-sm text-white/80 flex items-center gap-2">
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
              Live scraping pipeline is not deployed on this environment yet. Fallback reels are shown.
            </CardContent>
          </Card>
        )}

        <div className="mt-3 rounded-lg border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground flex items-start gap-2">
          <ShieldCheck className="h-4 w-4 mt-0.5 text-emerald-600" />
          ReelWire uses YouTube RSS and publisher video feeds, ranks latest + trending items, and presents them as short reels-style playback.
        </div>
      </section>
    </main>
  );
}
