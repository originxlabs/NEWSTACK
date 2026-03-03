import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function OpenNewsGlobalCTA() {
  return (
    <section className="border-t border-border/50 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
      <div className="container mx-auto px-4 py-10">
        <div className="rounded-2xl border border-primary/20 bg-card p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary font-semibold">OpenNews</p>
            <h3 className="font-display text-2xl font-bold">Build the next media standard, together</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Free and open-source core. AI-agent guardrails. Human editorial accountability. Faster and cleaner than legacy social noise.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/opennews">Why Open News</Link>
            </Button>
            <Button asChild>
              <Link to="/opennews/latest">Enter Open News</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
