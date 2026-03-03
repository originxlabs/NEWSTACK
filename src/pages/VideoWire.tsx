import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Film, PlayCircle, Radio, ShieldCheck, Youtube } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface VideoWireItem {
  title: string;
  link: string;
  source: string;
  platform: "youtube" | "publisher";
  published_at: string;
  thumbnail: string | null;
}

const FALLBACK_VIDEOS: VideoWireItem[] = [
  {
    title: "BBC News — Latest World News Video Briefing",
    link: "https://www.youtube.com/@BBCNews/videos",
    source: "BBC News (YouTube)",
    platform: "youtube",
    published_at: new Date().toISOString(),
    thumbnail: "/media-logos/bbc.svg",
  },
  {
    title: "CNN — Breaking Video Updates",
    link: "https://www.youtube.com/@CNN/videos",
    source: "CNN (YouTube)",
    platform: "youtube",
    published_at: new Date().toISOString(),
    thumbnail: "/media-logos/cnn.svg",
  },
  {
    title: "NDTV — India Video News Stream",
    link: "https://www.youtube.com/@NDTV/videos",
    source: "NDTV (YouTube)",
    platform: "youtube",
    published_at: new Date().toISOString(),
    thumbnail: "/media-logos/ndtv.svg",
  },
];

async function fetchVideoWire() {
  try {
    const { data, error } = await supabase.functions.invoke("video-wire-feed", {
      body: { limit: 36 },
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

export default function VideoWire() {
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

  return (
    <main className="min-h-screen bg-background">
      <section className="container mx-auto max-w-6xl px-4 pt-24 pb-8">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Badge variant="outline" className="gap-1.5">
            <Film className="h-3.5 w-3.5" />
            Video Intelligence
          </Badge>
          <Badge variant="secondary" className="gap-1.5">
            <Radio className="h-3.5 w-3.5" />
            ReelWire
          </Badge>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3">
          ReelWire — Video Based News
        </h1>
        <p className="text-muted-foreground max-w-3xl">
          ReelWire aggregates fresh videos from YouTube news channels and trusted publisher video feeds in one stream.
        </p>
      </section>

      <section className="container mx-auto max-w-6xl px-4 pb-16">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="text-sm text-muted-foreground">
            {isLoading
              ? "Loading live video feed..."
              : isFallback
                ? "Showing fallback video sources until live feed is ready"
                : `${videos.length} videos from ${sourceCount} sources`}
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayVideos.map((video) => (
            <Card key={video.link} className="border-border/60 overflow-hidden">
              <a href={video.link} target="_blank" rel="noreferrer noopener" className="block">
                <div className="aspect-video bg-muted/40 overflow-hidden">
                  {video.thumbnail ? (
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                      <PlayCircle className="h-8 w-8" />
                    </div>
                  )}
                </div>
              </a>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm leading-5 line-clamp-2">{video.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 flex items-center justify-between gap-2">
                <div className="text-xs text-muted-foreground flex items-center gap-2 min-w-0">
                  {video.platform === "youtube" ? (
                    <Youtube className="h-3.5 w-3.5 text-red-500 shrink-0" />
                  ) : (
                    <PlayCircle className="h-3.5 w-3.5 text-primary shrink-0" />
                  )}
                  <span className="truncate">{video.source}</span>
                  <span>•</span>
                  <span className="shrink-0">{timeAgo(video.published_at)}</span>
                </div>
                <a
                  href={video.link}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={`Open ${video.title}`}
                  title="Open video"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </CardContent>
            </Card>
          ))}
        </div>

        {!isLoading && isFallback && (
          <Card className="border-border/60 mt-4">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Live scraped feeds are initializing. Fallback video channels are shown for now.
            </CardContent>
          </Card>
        )}

        <div className="mt-6 rounded-lg border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground flex items-start gap-2">
          <ShieldCheck className="h-4 w-4 mt-0.5 text-emerald-600" />
          Feed quality and source trust checks remain enabled for all incoming video stories from YouTube and publisher RSS streams.
        </div>
      </section>
    </main>
  );
}
