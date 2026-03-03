import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bot, GitBranch, Landmark, Sparkles } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OpenPoliticsTree } from "@/modules/openpolitics/components/OpenPoliticsTree";
import { OpenPoliticsProfilePanel } from "@/modules/openpolitics/components/OpenPoliticsProfilePanel";
import { useOpenPoliticsProfile, useOpenPoliticsTree } from "@/modules/openpolitics/hooks/use-openpolitics";
import type { OpenPoliticsNode, OpenPoliticsScope } from "@/modules/openpolitics/types";

function findFirstNode(nodes: OpenPoliticsNode[]): OpenPoliticsNode | null {
  for (const node of nodes) {
    if (node) return node;
    const nested = findFirstNode(node.children || []);
    if (nested) return nested;
  }
  return null;
}

export function OpenPoliticsRoute() {
  const [scope, setScope] = useState<OpenPoliticsScope>("india");
  const { data: treeData, isLoading: treeLoading } = useOpenPoliticsTree(scope);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const { data: profileData, isLoading: profileLoading } = useOpenPoliticsProfile(selectedSlug);

  useEffect(() => {
    if (!treeData?.roots?.length) return;
    const first = findFirstNode(treeData.roots);
    if (first?.slug) setSelectedSlug(first.slug);
  }, [treeData?.roots, scope]);

  const rootCount = useMemo(() => treeData?.roots?.length || 0, [treeData?.roots]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-20">
        <section className="border-b border-border/60 bg-gradient-to-br from-primary/10 via-background to-background">
          <div className="container mx-auto max-w-7xl px-4 py-8 md:py-10">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge variant="outline">Open Politics</Badge>
              <Badge variant="outline">AI + Human Guardrails</Badge>
              <Badge variant="outline">Public Source Ledger</Badge>
              <Badge variant="outline">2026+ Governance Graph</Badge>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
              Open Politics: transparent leader intelligence for India and the world
            </h1>
            <p className="text-muted-foreground mt-3 max-w-4xl">
              Open Politics is the governance graph inside NEWSTACK. It tracks leaders, parties, terms, controversies, and source links with timestamped
              snapshots. AI agents score and structure records, while humans review policy-sensitive updates.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant={scope === "india" ? "default" : "outline"} onClick={() => setScope("india")}>
                India (National + State)
              </Button>
              <Button variant={scope === "world" ? "default" : "outline"} onClick={() => setScope("world")}>
                World (Country Leaders)
              </Button>
              <Button asChild variant="outline">
                <Link to="/opennews">OpenNews Overview</Link>
              </Button>
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <GitBranch className="h-3.5 w-3.5" />
                Arrow-linked hierarchy trees
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Bot className="h-3.5 w-3.5" />
                Multi-agent profiling pipeline
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Public-source based snapshots
              </span>
            </div>
          </div>
        </section>

        <section className="container mx-auto max-w-7xl px-4 py-6">
          <div className="mb-4 flex items-center justify-between gap-2 text-sm">
            <p className="text-muted-foreground inline-flex items-center gap-2">
              <Landmark className="h-4 w-4 text-primary" />
              {scope === "india" ? "India governance map (union + state leadership)" : "World governance map (country-level leadership)"}
            </p>
            <p className="text-xs text-muted-foreground">
              {treeData?.last_synced_at ? `Last sync: ${new Date(treeData.last_synced_at).toLocaleString()}` : "Waiting for sync"} · Root nodes {rootCount}
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-4 items-start">
            {treeLoading ? (
              <div className="rounded-2xl border border-border/60 bg-card p-5">
                <div className="h-6 w-36 animate-pulse rounded bg-muted mb-4" />
                <div className="space-y-2">
                  <div className="h-14 w-full animate-pulse rounded bg-muted" />
                  <div className="h-14 w-full animate-pulse rounded bg-muted" />
                  <div className="h-14 w-full animate-pulse rounded bg-muted" />
                </div>
              </div>
            ) : (
              <OpenPoliticsTree
                roots={treeData?.roots || []}
                selectedSlug={selectedSlug}
                onSelect={(node) => setSelectedSlug(node.slug)}
              />
            )}

            <div className="xl:sticky xl:top-24">
              <OpenPoliticsProfilePanel data={profileData} isLoading={profileLoading} />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
