import { useEffect, useMemo, useState } from "react";
import { subHours, formatDistanceToNow } from "date-fns";
import { BarChart3, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ReliabilityTier = "tier_1" | "tier_2" | "tier_3" | null;

interface RSSFeedRow {
  id: string;
  name: string;
  url: string;
  reliability_tier: ReliabilityTier;
  source_type: string | null;
  language: string | null;
  category: string | null;
  is_active: boolean | null;
  last_fetched_at: string | null;
}

interface StorySourceRow {
  story_id: string;
  source_name: string;
  published_at: string;
}

function tierBaseScore(tier: ReliabilityTier) {
  switch (tier) {
    case "tier_1":
      return 90;
    case "tier_2":
      return 75;
    case "tier_3":
      return 55;
    default:
      return 60;
  }
}

function tierLabel(tier: ReliabilityTier) {
  switch (tier) {
    case "tier_1":
      return "Tier 1";
    case "tier_2":
      return "Tier 2";
    case "tier_3":
      return "Tier 3";
    default:
      return "Unknown";
  }
}

function freshnessPenalty(lastFetchedAt: string | null) {
  if (!lastFetchedAt) return 10; // unknown freshness
  const ageMs = Date.now() - new Date(lastFetchedAt).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);
  if (ageHours > 24) return 20;
  if (ageHours > 6) return 10;
  return 0;
}

export function SourceQualityDashboard({ className }: { className?: string }) {
  const [feeds, setFeeds] = useState<RSSFeedRow[]>([]);
  const [sources72h, setSources72h] = useState<StorySourceRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState("");

  const refresh = async () => {
    setIsLoading(true);
    try {
      const cutoff72h = subHours(new Date(), 72).toISOString();

      const [{ data: feedRows, error: feedErr }, { data: srcRows, error: srcErr }] =
        await Promise.all([
          supabase
            .from("rss_feeds")
            .select(
              "id,name,url,reliability_tier,source_type,language,category,is_active,last_fetched_at"
            )
            .order("reliability_tier", { ascending: true })
            .order("priority", { ascending: false }),
          supabase
            .from("story_sources")
            .select("story_id,source_name,published_at")
            .gte("published_at", cutoff72h),
        ]);

      if (feedErr) throw feedErr;
      if (srcErr) throw srcErr;

      setFeeds((feedRows || []) as RSSFeedRow[]);
      setSources72h((srcRows || []) as StorySourceRow[]);
    } catch (e) {
      console.error("[SourceQualityDashboard] refresh failed", e);
    } finally {
      setIsLoading(false);
    }
  };

  const rows = useMemo(() => {
    const cutoff24h = subHours(new Date(), 24).getTime();

    const sourcesByFeed = new Map<
      string,
      { stories24h: Set<string>; stories72h: Set<string>; sources72h: number }
    >();

    for (const s of sources72h) {
      const key = s.source_name;
      const entry = sourcesByFeed.get(key) || {
        stories24h: new Set<string>(),
        stories72h: new Set<string>(),
        sources72h: 0,
      };
      entry.sources72h += 1;
      entry.stories72h.add(s.story_id);
      if (new Date(s.published_at).getTime() >= cutoff24h) {
        entry.stories24h.add(s.story_id);
      }
      sourcesByFeed.set(key, entry);
    }

    const enriched = feeds.map((f) => {
      const agg = sourcesByFeed.get(f.name) || {
        stories24h: new Set<string>(),
        stories72h: new Set<string>(),
        sources72h: 0,
      };

      const base = tierBaseScore(f.reliability_tier);
      const penalty = freshnessPenalty(f.last_fetched_at);
      const coverageBoost = Math.min(10, agg.stories24h.size); // +0..+10
      const score = Math.max(0, Math.min(100, base - penalty + coverageBoost));

      return {
        ...f,
        score,
        stories24h: agg.stories24h.size,
        stories72h: agg.stories72h.size,
        sources72h: agg.sources72h,
      };
    });

    const q = query.trim().toLowerCase();
    return enriched
      .filter((r) =>
        !q
          ? true
          : r.name.toLowerCase().includes(q) ||
            r.url.toLowerCase().includes(q) ||
            (r.category || "").toLowerCase().includes(q)
      )
      .sort((a, b) => b.score - a.score);
  }, [feeds, sources72h, query]);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium">
              Source Quality Dashboard
            </CardTitle>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={refresh}
            disabled={isLoading}
            className="h-7 w-7 p-0"
            aria-label="Refresh source quality"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between mb-3">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search feeds (name, url, category)"
            className="sm:max-w-sm"
          />
          <div className="text-xs text-muted-foreground">
            Coverage is computed from story sources in the last 72h.
          </div>
        </div>

        {feeds.length === 0 && !isLoading ? (
          <div className="text-sm text-muted-foreground py-6">
            No data yet — click refresh.
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="py-2 pr-4 font-medium">Feed</th>
                  <th className="py-2 pr-4 font-medium">Tier</th>
                  <th className="py-2 pr-4 font-medium">Score</th>
                  <th className="py-2 pr-4 font-medium">Stories (24h)</th>
                  <th className="py-2 pr-4 font-medium">Stories (72h)</th>
                  <th className="py-2 pr-4 font-medium">Last fetched</th>
                  <th className="py-2 pr-0 font-medium">Active</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-border/50">
                    <td className="py-3 pr-4 min-w-[240px]">
                      <div className="font-medium truncate">{r.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {r.url}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant="outline" className="text-[10px]">
                        {tierLabel(r.reliability_tier)}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant="secondary" className="text-[10px]">
                        {r.score}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4">{r.stories24h}</td>
                    <td className="py-3 pr-4">{r.stories72h}</td>
                    <td className="py-3 pr-4">
                      {r.last_fetched_at ? (
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(r.last_fetched_at), {
                            addSuffix: true,
                          })}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">never</span>
                      )}
                    </td>
                    <td className="py-3 pr-0">
                      <Badge
                        variant={r.is_active ? "secondary" : "outline"}
                        className="text-[10px]"
                      >
                        {r.is_active ? "Active" : "Paused"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
