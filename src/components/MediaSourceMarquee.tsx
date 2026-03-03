import type { CSSProperties } from "react";

interface MediaSource {
  name: string;
  /** Path to local SVG in /public/media-logos, OR null to use Google Favicon */
  localLogo: string | null;
  /** Domain for Google Favicon fallback */
  domain: string;
  homepage: string;
}

/**
 * Resolve logo URL:
 * 1. Use local SVG from /public/media-logos if available (fastest, no external dependency)
 * 2. Fall back to Google's S2 Favicon API at 128px (always online)
 */
function logoUrl(source: MediaSource): string {
  if (source.localLogo) return `/media-logos/${source.localLogo}`;
  return `https://www.google.com/s2/favicons?domain=${source.domain}&sz=128`;
}

// ── Global Sources ──
const GLOBAL_SOURCES: MediaSource[] = [
  { name: "BBC News", localLogo: "bbc.svg", domain: "bbc.com", homepage: "https://www.bbc.com/news" },
  { name: "Reuters", localLogo: "reuters.svg", domain: "reuters.com", homepage: "https://www.reuters.com/world/" },
  { name: "CNN", localLogo: "cnn.svg", domain: "cnn.com", homepage: "https://edition.cnn.com/world" },
  { name: "The Guardian", localLogo: "theguardian.svg", domain: "theguardian.com", homepage: "https://www.theguardian.com/world" },
  { name: "NY Times", localLogo: "nytimes.svg", domain: "nytimes.com", homepage: "https://www.nytimes.com/section/world" },
  { name: "Washington Post", localLogo: "washingtonpost.svg", domain: "washingtonpost.com", homepage: "https://www.washingtonpost.com/world/" },
  { name: "Bloomberg", localLogo: "bloomberg.svg", domain: "bloomberg.com", homepage: "https://www.bloomberg.com/" },
  { name: "NPR", localLogo: "npr.svg", domain: "npr.org", homepage: "https://www.npr.org/sections/news/" },
  { name: "WSJ", localLogo: "wsj.svg", domain: "wsj.com", homepage: "https://www.wsj.com/" },
  { name: "Financial Times", localLogo: "ft.svg", domain: "ft.com", homepage: "https://www.ft.com/world" },
  { name: "AP News", localLogo: null, domain: "apnews.com", homepage: "https://apnews.com/" },
  { name: "Al Jazeera", localLogo: null, domain: "aljazeera.com", homepage: "https://www.aljazeera.com/" },
  { name: "ABC News", localLogo: null, domain: "abcnews.go.com", homepage: "https://abcnews.go.com/" },
  { name: "Forbes", localLogo: null, domain: "forbes.com", homepage: "https://www.forbes.com/" },
  { name: "The Economist", localLogo: null, domain: "economist.com", homepage: "https://www.economist.com/" },
  { name: "Sky News", localLogo: null, domain: "news.sky.com", homepage: "https://news.sky.com/" },
  { name: "DW News", localLogo: null, domain: "dw.com", homepage: "https://www.dw.com/en/" },
  { name: "France 24", localLogo: null, domain: "france24.com", homepage: "https://www.france24.com/en/" },
];

// ── India Sources ──
const INDIA_SOURCES: MediaSource[] = [
  { name: "NDTV", localLogo: "ndtv.svg", domain: "ndtv.com", homepage: "https://www.ndtv.com/" },
  { name: "India Today", localLogo: "indiatoday.svg", domain: "indiatoday.in", homepage: "https://www.indiatoday.in/" },
  { name: "The Hindu", localLogo: "thehindu.svg", domain: "thehindu.com", homepage: "https://www.thehindu.com/" },
  { name: "Indian Express", localLogo: "indianexpress.svg", domain: "indianexpress.com", homepage: "https://indianexpress.com/" },
  { name: "Hindustan Times", localLogo: "hindustantimes.svg", domain: "hindustantimes.com", homepage: "https://www.hindustantimes.com/" },
  { name: "Times of India", localLogo: "timesofindia.svg", domain: "timesofindia.indiatimes.com", homepage: "https://timesofindia.indiatimes.com/" },
  { name: "Aaj Tak", localLogo: "aajtak.svg", domain: "aajtak.in", homepage: "https://www.aajtak.in/" },
  { name: "ABP News", localLogo: "abpnews.svg", domain: "abplive.com", homepage: "https://news.abplive.com/" },
  { name: "Zee News", localLogo: "zeenews.svg", domain: "zeenews.india.com", homepage: "https://zeenews.india.com/" },
  { name: "Republic World", localLogo: null, domain: "republicworld.com", homepage: "https://www.republicworld.com/" },
  { name: "News18", localLogo: null, domain: "news18.com", homepage: "https://www.news18.com/" },
  { name: "The Wire", localLogo: null, domain: "thewire.in", homepage: "https://thewire.in/" },
  { name: "Scroll.in", localLogo: null, domain: "scroll.in", homepage: "https://scroll.in/" },
  { name: "Mint", localLogo: null, domain: "livemint.com", homepage: "https://www.livemint.com/" },
  { name: "Economic Times", localLogo: null, domain: "economictimes.indiatimes.com", homepage: "https://economictimes.indiatimes.com/" },
  { name: "Deccan Herald", localLogo: null, domain: "deccanherald.com", homepage: "https://www.deccanherald.com/" },
  { name: "The Quint", localLogo: null, domain: "thequint.com", homepage: "https://www.thequint.com/" },
  { name: "WION", localLogo: null, domain: "wionews.com", homepage: "https://www.wionews.com/" },
];

function SourceRow({
  items,
  reverse = false,
  speedSeconds = 50,
}: {
  items: MediaSource[];
  reverse?: boolean;
  speedSeconds?: number;
}) {
  const repeated = [...items, ...items];

  return (
    <div className="group overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]">
      <div
        className="animate-source-marquee flex w-max shrink-0 items-center gap-8 sm:gap-12 py-3 group-hover:[animation-play-state:paused]"
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
            className="shrink-0 inline-flex items-center gap-2 opacity-50 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0 hover:scale-105"
            aria-label={source.name}
            title={source.name}
          >
            <img
              src={logoUrl(source)}
              alt={source.name}
              loading="lazy"
              className="h-5 sm:h-6 w-auto object-contain"
              onError={(e) => {
                const el = e.target as HTMLImageElement;
                // If local SVG failed, try Google Favicon
                if (source.localLogo && !el.dataset.fallback) {
                  el.dataset.fallback = "1";
                  el.src = `https://www.google.com/s2/favicons?domain=${source.domain}&sz=128`;
                } else {
                  el.style.display = "none";
                }
              }}
            />
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground whitespace-nowrap">
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
    <section className="py-8 border-y border-border/30">
      <div className="container mx-auto max-w-6xl px-4">
        <p className="text-center text-[11px] uppercase tracking-[0.2em] text-muted-foreground/60 font-medium mb-5">
          Trusted sources powering NEWSTACK intelligence
        </p>
        <div className="space-y-5">
          <SourceRow items={GLOBAL_SOURCES} speedSeconds={55} />
          <SourceRow items={INDIA_SOURCES} reverse speedSeconds={60} />
        </div>
      </div>
    </section>
  );
}
