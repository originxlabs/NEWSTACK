import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOpenNewsMe, useSubmitVerificationRequest } from "@/modules/opennews/hooks/use-opennews";
import { useToast } from "@/hooks/use-toast";

export function OpenNewsVerificationRequestCard() {
  const { data: me } = useOpenNewsMe();
  const submitRequest = useSubmitVerificationRequest();
  const { toast } = useToast();

  const [note, setNote] = useState("");
  const [linksRaw, setLinksRaw] = useState("");

  async function onSubmit() {
    try {
      const links = linksRaw
        .split("\n")
        .map((v) => v.trim())
        .filter(Boolean)
        .slice(0, 10);

      await submitRequest.mutateAsync({ note, links });
      setNote("");
      setLinksRaw("");
      toast({ title: "Verification request submitted" });
    } catch (err: any) {
      toast({ title: "Failed", description: err?.message || "Unable to submit request", variant: "destructive" });
    }
  }

  return (
    <section className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Journalist Verification Workflow</h3>
        <Badge variant="outline">Role: {me?.role || "anonymous"}</Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        Submit your verification request with profile context and public links. Moderators review and approve journalist status.
      </p>

      <Textarea
        placeholder="Why should this account be verified?"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <Textarea
        placeholder="Reference links (one per line)"
        value={linksRaw}
        onChange={(e) => setLinksRaw(e.target.value)}
        className="min-h-20"
      />

      <div className="flex justify-end">
        <Button onClick={onSubmit} disabled={submitRequest.isPending}>
          {submitRequest.isPending ? "Submitting..." : "Submit verification request"}
        </Button>
      </div>
    </section>
  );
}
