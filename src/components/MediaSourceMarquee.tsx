import type { CSSProperties } from "react";
import { Badge } from "@/components/ui/badge";

interface MediaSource {
  name: string;
  logo: string;
  homepage: string;
}

const GLOBAL_SOURCES: MediaSource[] = [
  { name: "BBC News", logo: "/media-logos/bbc.svg", homepage: "https://www.bbc.com/news" },
  { name: "Reuters", logo: "/media-logos/reuters.svg", homepage: "https://www.reuters.com/world/" },
  { name: "CNN", logo: "/media-logos/cnn.svg", homepage: "https://edition.cnn.com/world" },
  { name: "The Guardian", logo: "/media-logos/theguardian.svg", homepage: "https://www.theguardian.com/world" },
  { name: "The New York Times", logo: "/media-logos/nytimes.svg", homepage: "https://www.nytimes.com/section/world" },
  { name: "Washington Post", logo: "/media-logos/washingtonpost.svg", homepage: "https://www.washingtonpost.com/world/" },
  { name: "Bloomberg", logo: "/media-logos/bloomberg.svg", homepage: "https://www.bloomberg.com/" },
  { name: "NPR", logo: "/media-logos/npr.svg", homepage: "https://www.npr.org/sections/news/" },
  { name: "WSJ", logo: "/media-logos/wsj.svg", homepage: "https://www.wsj.com/" },
  { name: "Financial Times", logo: "/media-logos/ft.svg", homepage: "https://www.ft.com/world" },
];

const INDIA_SOURCES: MediaSource[] = [
  { name: "NDTV", logo: "/media-logos/ndtv.svg", homepage: "https://www.ndtv.com/" },
  { name: "India Today", logo: "/media-logos/indiatoday.svg", homepage: "https://www.indiatoday.in/" },
  { name: "The Hindu", logo: "/media-logos/thehindu.svg", homepage: "https://www.thehindu.com/" },
  { name: "The Indian Express", logo: "/media-logos/indianexpress.svg", homepage: "https://indianexpress.com/" },
  { name: "Hindustan Times", logo: "/media-logos/hindustantimes.svg", homepage: "https://www.hindustantimes.com/" },
  { name: "Times of India", logo: "/media-logos/timesofindia.svg", homepage: "https://timesofindia.indiatimes.com/" },
  { name: "Aaj Tak", logo: "/media-logos/aajtak.svg", homepage: "https://www.aajtak.in/" },
  { name: "ABP News", logo: "/media-logos/abpnews.svg", homepage: "https://news.abplive.com/" },
  { name: "Zee News", logo: "/media-logos/zeenews.svg", homepage: "https://zeenews.india.com/" },
];

function SourceRow({
  items,
  reverse = false,
  speedSeconds = 44,
}: {
  items: MediaSource[];
  reverse?: boolean;
  speedSeconds?: number;
}) {
  const repeated = [...items, ...items];

  return (
    <div className="group overflow-hidden">
      <div
        className="animate-source-marquee flex w-max min-w-full shrink-0 py-1 group-hover:[animation-play-state:paused]"
        style={
          {
            ["--source-marquee-duration" as string]: `${speedSeconds}s`,
            animationDirection: reverse ? "reverse" : "normal",
          } as CSSProperties
        }
      >
        {repeated.map((source, idx) => (
          <a
            key={`${source.name}-${idx}`}
            href={source.homepage}
            target="_blank"
            rel="noreferrer noopener"
            className="group/item relative mx-2 flex h-[74px] w-[116px] shrink-0 items-center justify-center rounded-2xl border border-border/40 bg-background/50 px-3 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-background/70"
            aria-label={source.name}
            title={source.name}
          >
            <img
              src={source.logo}
              alt={`${source.name} logo`}
              loading="lazy"
              className="max-h-9 w-auto max-w-[82px] object-contain"
            />
            <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 rounded-md border border-border/60 bg-background/90 px-2 py-1 text-center text-[10px] text-foreground opacity-0 shadow-sm transition-all group-hover/item:-translate-y-1 group-hover/item:opacity-100 whitespace-nowrap">
              {source.name}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

export function MediaSourceMarquee() {
  return (
    <section className="px-4 py-7 border-y border-border/50 bg-muted/20">
      <div className="container mx-auto max-w-6xl space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Primary RSS Sources</Badge>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Major media houses used in NEWSTACK ingestion across India and global coverage.
          </p>
        </div>

        <SourceRow items={GLOBAL_SOURCES} speedSeconds={42} />
        <SourceRow items={INDIA_SOURCES} reverse speedSeconds={48} />
      </div>
    </section>
  );
}
