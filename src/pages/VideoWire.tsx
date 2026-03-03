import { Film, PlayCircle, Radio, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const videoSources = [
  { name: "YouTube News Channels", note: "Live and latest publisher uploads" },
  { name: "Global Publisher Video Desks", note: "BBC, Reuters, CNN, AP and more" },
  { name: "India News Video Networks", note: "NDTV, India Today, TOI, Aaj Tak and more" },
];

export default function VideoWire() {
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
          ReelWire is your video-first stream for verified news. It is designed to aggregate videos from
          YouTube and trusted news publisher video sources into one clean feed.
        </p>
      </section>

      <section className="container mx-auto max-w-6xl px-4 pb-16">
        <div className="grid gap-4 md:grid-cols-3">
          {videoSources.map((source) => (
            <Card key={source.name} className="border-border/60">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <PlayCircle className="h-4 w-4 text-primary" />
                  {source.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{source.note}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 rounded-lg border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground flex items-start gap-2">
          <ShieldCheck className="h-4 w-4 mt-0.5 text-emerald-600" />
          Feed quality and source trust checks remain enabled for all incoming video stories.
        </div>
      </section>
    </main>
  );
}
