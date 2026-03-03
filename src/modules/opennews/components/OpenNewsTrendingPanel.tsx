import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useOpenNewsTrending } from "@/modules/opennews/hooks/use-opennews";

export function OpenNewsTrendingPanel() {
  const [window, setWindow] = useState<"1h" | "6h" | "24h">("24h");
  const { data, isLoading } = useOpenNewsTrending(window);

  return (
    <section className="rounded-xl border border-border/60 bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Trending Engine</h3>
        <div className="flex gap-2">
          {(["1h", "6h", "24h"] as const).map((w) => (
            <Button
              key={w}
              size="sm"
              variant={window === w ? "default" : "outline"}
              onClick={() => setWindow(w)}
            >
              {w}
            </Button>
          ))}
        </div>
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Calculating trend scores...</p>
      ) : !(data && data.length) ? (
        <p className="text-sm text-muted-foreground">No trending snapshots yet.</p>
      ) : (
        <div className="space-y-2">
          {data.slice(0, 8).map((item, idx) => (
            <div key={`${item.post_id}-${idx}`} className="flex items-center justify-between text-sm border-b border-border/40 pb-2">
              <span className="font-mono text-xs text-muted-foreground">#{idx + 1} {item.post_id.slice(0, 8)}</span>
              <span className="font-semibold">{item.score.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
