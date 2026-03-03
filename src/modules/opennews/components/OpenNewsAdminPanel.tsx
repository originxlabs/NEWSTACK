import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  useAddBannedTerm,
  useBannedTerms,
  useModerationDecision,
  useModerationQueue,
  useOpenNewsMe,
  useReviewVerificationRequest,
  useTrendingConfig,
  useUpdateTrendingConfig,
  useVerificationRequests,
} from "@/modules/opennews/hooks/use-opennews";
import { useToast } from "@/hooks/use-toast";

export function OpenNewsAdminPanel() {
  const { data: me } = useOpenNewsMe();
  const { toast } = useToast();

  const { data: queueData, refetch: refetchQueue } = useModerationQueue();
  const moderationDecision = useModerationDecision();

  const { data: termsData, refetch: refetchTerms } = useBannedTerms();
  const addTerm = useAddBannedTerm();
  const [term, setTerm] = useState("");
  const [mode, setMode] = useState<"exact" | "regex">("exact");

  const { data: trendingConfigData, refetch: refetchCfg } = useTrendingConfig();
  const updateCfg = useUpdateTrendingConfig();
  const [cfgPatch, setCfgPatch] = useState<Record<string, string>>({});

  const { data: verificationData, refetch: refetchVerification } = useVerificationRequests();
  const reviewVerification = useReviewVerificationRequest();

  const queue = queueData?.queue || [];
  const terms = termsData?.terms || [];
  const cfg = trendingConfigData?.config || {};
  const requests = verificationData?.requests || [];

  const canModerate = !!me?.can_moderate;

  const cfgFields = useMemo(
    () => [
      "like_weight",
      "repost_weight",
      "quote_weight",
      "reply_weight",
      "bookmark_weight",
      "poll_vote_weight",
      "unique_engager_weight",
      "decay_half_life_hours",
      "journalist_weight",
      "newsroom_weight",
      "controversy_multiplier",
    ],
    [],
  );

  if (!canModerate) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
        Moderator access required for OpenNews admin controls.
      </div>
    );
  }

  async function handleDecision(queueId: string, decision: "approve" | "reject" | "hide" | "unhide") {
    try {
      await moderationDecision.mutateAsync({ queueId, decision });
      await refetchQueue();
      toast({ title: "Moderation updated", description: `Decision: ${decision}` });
    } catch (err: any) {
      toast({ title: "Failed", description: err?.message || "Moderation update failed", variant: "destructive" });
    }
  }

  async function handleAddTerm() {
    if (!term.trim()) return;
    try {
      await addTerm.mutateAsync({ term: term.trim(), mode, severity: 3 });
      setTerm("");
      await refetchTerms();
      toast({ title: "Banned term added" });
    } catch (err: any) {
      toast({ title: "Failed", description: err?.message || "Unable to add term", variant: "destructive" });
    }
  }

  async function handleUpdateConfig() {
    try {
      const payload: Record<string, number> = {};
      for (const [key, value] of Object.entries(cfgPatch)) {
        if (value !== "") payload[key] = Number(value);
      }
      await updateCfg.mutateAsync(payload);
      setCfgPatch({});
      await refetchCfg();
      toast({ title: "Trending config updated" });
    } catch (err: any) {
      toast({ title: "Failed", description: err?.message || "Unable to update config", variant: "destructive" });
    }
  }

  async function handleReview(requestId: string, decision: "approve" | "reject") {
    try {
      await reviewVerification.mutateAsync({ requestId, decision });
      await refetchVerification();
      toast({ title: "Verification reviewed", description: decision });
    } catch (err: any) {
      toast({ title: "Failed", description: err?.message || "Unable to review", variant: "destructive" });
    }
  }

  return (
    <Tabs defaultValue="queue" className="space-y-4">
      <TabsList className="grid grid-cols-4 w-full">
        <TabsTrigger value="queue">Flagged Queue</TabsTrigger>
        <TabsTrigger value="terms">Banned Terms</TabsTrigger>
        <TabsTrigger value="trending">Trending Weights</TabsTrigger>
        <TabsTrigger value="verification">Journalist Verify</TabsTrigger>
      </TabsList>

      <TabsContent value="queue" className="space-y-3">
        {!queue.length ? (
          <p className="text-sm text-muted-foreground">No flagged posts in queue.</p>
        ) : (
          queue.map((item: any) => (
            <article key={item.id} className="rounded-xl border border-border/60 bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">Priority {item.priority}</Badge>
                <Badge variant="secondary">{item.status}</Badge>
              </div>
              <p className="text-sm font-medium mb-2">{item.post?.headline || "Untitled"}</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.post?.body}</p>
              <p className="text-xs text-muted-foreground mt-2">Flags: {(item.flagged_categories || []).join(", ") || "none"}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => handleDecision(item.id, "approve")}>Approve</Button>
                <Button size="sm" variant="outline" onClick={() => handleDecision(item.id, "hide")}>Hide</Button>
                <Button size="sm" variant="destructive" onClick={() => handleDecision(item.id, "reject")}>Reject</Button>
              </div>
            </article>
          ))
        )}
      </TabsContent>

      <TabsContent value="terms" className="space-y-3">
        <div className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
          <h4 className="font-medium">Add banned term/pattern</h4>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_120px_auto] gap-2">
            <Input placeholder="term or regex" value={term} onChange={(e) => setTerm(e.target.value)} />
            <select
              className="h-10 rounded-md border border-border bg-background px-2 text-sm"
              value={mode}
              onChange={(e) => setMode(e.target.value as "exact" | "regex")}
            >
              <option value="exact">exact</option>
              <option value="regex">regex</option>
            </select>
            <Button onClick={handleAddTerm}>Add</Button>
          </div>
        </div>

        <div className="space-y-2">
          {terms.map((t: any) => (
            <div key={t.id} className="rounded-lg border border-border/60 px-3 py-2 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t.term}</p>
                <p className="text-xs text-muted-foreground">mode: {t.mode} · severity: {t.severity}</p>
              </div>
              <Badge variant={t.is_active ? "default" : "outline"}>{t.is_active ? "active" : "inactive"}</Badge>
            </div>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="trending" className="space-y-3">
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <h4 className="font-medium mb-3">Trending parameter control</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {cfgFields.map((field) => (
              <div key={field} className="space-y-1">
                <LabelFor field={field} />
                <Input
                  type="number"
                  step="0.01"
                  placeholder={String(cfg?.[field] ?? "")}
                  value={cfgPatch[field] ?? ""}
                  onChange={(e) => setCfgPatch((prev) => ({ ...prev, [field]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-end">
            <Button onClick={handleUpdateConfig}>Update weights</Button>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="verification" className="space-y-3">
        {!requests.length ? (
          <p className="text-sm text-muted-foreground">No verification requests pending.</p>
        ) : (
          requests.map((r: any) => (
            <article key={r.id} className="rounded-xl border border-border/60 bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">{r.status}</Badge>
                <Badge variant="secondary">{r.user_id.slice(0, 8)}</Badge>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                Note: {r.documents?.note || "No note"}
              </p>
              {!!r.documents?.links?.length && (
                <p className="text-xs text-muted-foreground mt-2">Links: {r.documents.links.join(", ")}</p>
              )}
              {r.status === "pending" && (
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={() => handleReview(r.id, "approve")}>Approve Journalist</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleReview(r.id, "reject")}>Reject</Button>
                </div>
              )}
            </article>
          ))
        )}
      </TabsContent>
    </Tabs>
  );
}

function LabelFor({ field }: { field: string }) {
  return <p className="text-xs text-muted-foreground">{field}</p>;
}
