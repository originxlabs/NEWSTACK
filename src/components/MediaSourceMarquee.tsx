import type { CSSProperties } from "react";

interface MediaSource {
  name: string;
  logo: string;
  homepage: string;
}

// ── Global Sources ──
const GLOBAL_SOURCES: MediaSource[] = [
  { name: "BBC News", logo: "https://logo.clearbit.com/bbc.com", homepage: "https://www.bbc.com/news" },
  { name: "Reuters", logo: "https://logo.clearbit.com/reuters.com", homepage: "https://www.reuters.com/world/" },
  { name: "CNN", logo: "https://logo.clearbit.com/cnn.com", homepage: "https://edition.cnn.com/world" },
  { name: "The Guardian", logo: "https://logo.clearbit.com/theguardian.com", homepage: "https://www.theguardian.com/world" },
  { name: "The New York Times", logo: "https://logo.clearbit.com/nytimes.com", homepage: "https://www.nytimes.com/section/world" },
  { name: "Washington Post", logo: "https://logo.clearbit.com/washingtonpost.com", homepage: "https://www.washingtonpost.com/world/" },
  { name: "Bloomberg", logo: "https://logo.clearbit.com/bloomberg.com", homepage: "https://www.bloomberg.com/" },
  { name: "NPR", logo: "https://logo.clearbit.com/npr.org", homepage: "https://www.npr.org/sections/news/" },
  { name: "WSJ", logo: "https://logo.clearbit.com/wsj.com", homepage: "https://www.wsj.com/" },
  { name: "Financial Times", logo: "https://logo.clearbit.com/ft.com", homepage: "https://www.ft.com/world" },
  { name: "Associated Press", logo: "https://logo.clearbit.com/apnews.com", homepage: "https://apnews.com/" },
  { name: "Al Jazeera", logo: "https://logo.clearbit.com/aljazeera.com", homepage: "https://www.aljazeera.com/" },
  { name: "ABC News", logo: "https://logo.clearbit.com/abcnews.go.com", homepage: "https://abcnews.go.com/" },
  { name: "Forbes", logo: "https://logo.clearbit.com/forbes.com", homepage: "https://www.forbes.com/" },
  { name: "The Economist", logo: "https://logo.clearbit.com/economist.com", homepage: "https://www.economist.com/" },
  { name: "Sky News", logo: "https://logo.clearbit.com/news.sky.com", homepage: "https://news.sky.com/" },
  { name: "DW News", logo: "https://logo.clearbit.com/dw.com", homepage: "https://www.dw.com/en/" },
  { name: "France 24", logo: "https://logo.clearbit.com/france24.com", homepage: "https://www.france24.com/en/" },
];

// ── India Sources ──
const INDIA_SOURCES: MediaSource[] = [
  { name: "NDTV", logo: "https://logo.clearbit.com/ndtv.com", homepage: "https://www.ndtv.com/" },
  { name: "India Today", logo: "https://logo.clearbit.com/indiatoday.in", homepage: "https://www.indiatoday.in/" },
  { name: "The Hindu", logo: "https://logo.clearbit.com/thehindu.com", homepage: "https://www.thehindu.com/" },
  { name: "The Indian Express", logo: "https://logo.clearbit.com/indianexpress.com", homepage: "https://indianexpress.com/" },
  { name: "Hindustan Times", logo: "https://logo.clearbit.com/hindustantimes.com", homepage: "https://www.hindustantimes.com/" },
  { name: "Times of India", logo: "https://logo.clearbit.com/timesofindia.indiatimes.com", homepage: "https://timesofindia.indiatimes.com/" },
  { name: "Aaj Tak", logo: "https://logo.clearbit.com/aajtak.in", homepage: "https://www.aajtak.in/" },
  { name: "ABP News", logo: "https://logo.clearbit.com/abplive.com", homepage: "https://news.abplive.com/" },
  { name: "Zee News", logo: "https://logo.clearbit.com/zeenews.india.com", homepage: "https://zeenews.india.com/" },
  { name: "Republic World", logo: "https://logo.clearbit.com/republicworld.com", homepage: "https://www.republicworld.com/" },
  { name: "News18", logo: "https://logo.clearbit.com/news18.com", homepage: "https://www.news18.com/" },
  { name: "The Wire", logo: "https://logo.clearbit.com/thewire.in", homepage: "https://thewire.in/" },
  { name: "Scroll.in", logo: "https://logo.clearbit.com/scroll.in", homepage: "https://scroll.in/" },
  { name: "Mint", logo: "https://logo.clearbit.com/livemint.com", homepage: "https://www.livemint.com/" },
  { name: "Economic Times", logo: "https://logo.clearbit.com/economictimes.indiatimes.com", homepage: "https://economictimes.indiatimes.com/" },
  { name: "Deccan Herald", logo: "https://logo.clearbit.com/deccanherald.com", homepage: "https://www.deccanherald.com/" },
  { name: "The Quint", logo: "https://logo.clearbit.com/thequint.com", homepage: "https://www.thequint.com/" },
  { name: "WION", logo: "https://logo.clearbit.com/wionews.com", homepage: "https://www.wionews.com/" },
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
        className="animate-source-marquee flex w-max shrink-0 items-center gap-10 sm:gap-14 py-3 group-hover:[animation-play-state:paused]"
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
            className="shrink-0 opacity-50 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0 hover:scale-110"
            aria-label={source.name}
            title={source.name}
          >
            <img
              src={source.logo}
              alt={source.name}
              loading="lazy"
              className="h-6 sm:h-7 w-auto object-contain"
              onError={(e) => {
                // Hide broken images gracefully
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
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
