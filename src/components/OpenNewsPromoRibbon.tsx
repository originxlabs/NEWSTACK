import { Link, useLocation } from "react-router-dom";
import { useMemo, useState } from "react";
import { Megaphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "opennews_promo_dismissed";

export function OpenNewsPromoRibbon() {
  const location = useLocation();
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === "1");

  const hidden = useMemo(
    () => dismissed || location.pathname.startsWith("/newsroom/login") || location.pathname.startsWith("/newsroom/owner"),
    [dismissed, location.pathname],
  );

  if (hidden) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] max-w-3xl rounded-xl border border-primary/30 bg-background/95 backdrop-blur px-3 py-2 shadow-lg">
      <div className="flex items-center gap-2">
        <Megaphone className="w-4 h-4 text-primary shrink-0" />
        <p className="text-xs sm:text-sm text-foreground/90">
          <span className="font-semibold">OpenNews Public Beta is live.</span> India-first, AI-guardrailed journalism with anonymous reporting, verified voices, and political transparency.
        </p>
        <Button asChild size="sm" className="h-7 px-2.5 text-xs">
          <Link to="/opennews">Try Open News</Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => {
            localStorage.setItem(DISMISS_KEY, "1");
            setDismissed(true);
          }}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
