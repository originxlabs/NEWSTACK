import { useMemo, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { createAnonymousFingerprint } from "@/modules/opennews/lib/anonymous";
import { useCreateOpenNewsPost, useCreateOpenNewsReply, useOpenNewsMe } from "@/modules/opennews/hooks/use-opennews";

interface OpenNewsPostComposerProps {
  parentPostId?: string;
  defaultQuotePostId?: string;
  onPosted?: () => void;
}

export function OpenNewsPostComposer({ parentPostId, defaultQuotePostId, onPosted }: OpenNewsPostComposerProps) {
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [anonymous, setAnonymous] = useState(true);
  const [quotePostId, setQuotePostId] = useState(defaultQuotePostId || "");
  const [hasPoll, setHasPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptionA, setPollOptionA] = useState("");
  const [pollOptionB, setPollOptionB] = useState("");
  const [pollOptionC, setPollOptionC] = useState("");
  const [pollOptionD, setPollOptionD] = useState("");
  const { toast } = useToast();

  const { data: me } = useOpenNewsMe();
  const createPostMutation = useCreateOpenNewsPost();
  const createReplyMutation = useCreateOpenNewsReply();

  const isSubmitting = createPostMutation.isPending || createReplyMutation.isPending;

  const normalizedOptions = useMemo(
    () => [pollOptionA, pollOptionB, pollOptionC, pollOptionD].map((v) => v.trim()).filter(Boolean),
    [pollOptionA, pollOptionB, pollOptionC, pollOptionD],
  );

  async function onSubmit() {
    if (!body.trim()) return;

    const anonymousId = anonymous ? await createAnonymousFingerprint() : undefined;
    const payload: any = {
      headline: headline.trim() || null,
      body,
      comments_enabled: commentsEnabled,
      post_mode: anonymous ? "anonymous" : "named",
      anonymous_id: anonymousId,
      quote_post_id: quotePostId.trim() || null,
      parent_post_id: parentPostId || null,
    };

    if (hasPoll && pollQuestion.trim() && normalizedOptions.length >= 2) {
      payload.poll = {
        question: pollQuestion.trim(),
        options: normalizedOptions,
      };
    }

    try {
      if (parentPostId) {
        await createReplyMutation.mutateAsync({ postId: parentPostId, payload });
      } else {
        await createPostMutation.mutateAsync(payload);
      }

      setHeadline("");
      setBody("");
      setQuotePostId(defaultQuotePostId || "");
      setHasPoll(false);
      setPollQuestion("");
      setPollOptionA("");
      setPollOptionB("");
      setPollOptionC("");
      setPollOptionD("");

      toast({
        title: parentPostId ? "Reply posted" : "Post published",
        description: anonymous ? "Published via anonymous mode" : "Published with your account",
      });

      onPosted?.();
    } catch (err: any) {
      toast({
        title: "Unable to publish",
        description: err?.message || "Failed to publish",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{parentPostId ? "Reply to Thread" : "Create OpenNews Post"}</h3>
        <Badge variant="outline">Beta 1.0</Badge>
      </div>

      {!!me?.role && (
        <p className="text-xs text-muted-foreground">
          Role: <span className="font-medium">{me.role}</span>
          {me.can_moderate ? " · moderation enabled" : ""}
        </p>
      )}

      {!parentPostId && (
        <Input
          placeholder="Optional headline"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
        />
      )}

      <Textarea
        placeholder="Share verified ground updates, investigation leads, or debate points..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="min-h-28"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <Input
          placeholder="Quote post ID (optional)"
          value={quotePostId}
          onChange={(e) => setQuotePostId(e.target.value)}
        />
        <div className="flex items-center gap-2 rounded-md border border-border/60 px-3">
          <Switch checked={hasPoll} onCheckedChange={setHasPoll} id="opennews-has-poll" />
          <Label htmlFor="opennews-has-poll">Attach poll</Label>
        </div>
      </div>

      {hasPoll && (
        <div className="rounded-lg border border-border/60 p-3 space-y-2">
          <Input
            placeholder="Poll question"
            value={pollQuestion}
            onChange={(e) => setPollQuestion(e.target.value)}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Input placeholder="Option 1" value={pollOptionA} onChange={(e) => setPollOptionA(e.target.value)} />
            <Input placeholder="Option 2" value={pollOptionB} onChange={(e) => setPollOptionB(e.target.value)} />
            <Input placeholder="Option 3 (optional)" value={pollOptionC} onChange={(e) => setPollOptionC(e.target.value)} />
            <Input placeholder="Option 4 (optional)" value={pollOptionD} onChange={(e) => setPollOptionD(e.target.value)} />
          </div>
          <p className="text-xs text-muted-foreground">Minimum 2 options required.</p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch checked={anonymous} onCheckedChange={setAnonymous} id="opennews-anon" />
          <Label htmlFor="opennews-anon">Post anonymously</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={commentsEnabled} onCheckedChange={setCommentsEnabled} id="opennews-comments" />
          <Label htmlFor="opennews-comments">Comments enabled</Label>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onSubmit} disabled={isSubmitting || !body.trim()}>
          {isSubmitting ? "Publishing..." : parentPostId ? "Post Reply" : "Publish"}
        </Button>
      </div>
    </div>
  );
}
