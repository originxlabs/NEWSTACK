import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Sparkles, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";

const POPUP_SCHEDULE_MINUTES = [2, 6, 10, 15, 30];
const POPUP_START_TS_KEY = "newstack_newsletter_popup_start_ts";
const POPUP_NEXT_INDEX_KEY = "newstack_newsletter_popup_next_index";
const POPUP_SUBSCRIBED_KEY = "newstack_newsletter_subscribed";
const SESSION_ID_KEY = "newstack_session_id";

// Get or create a stable session ID for analytics
const getSessionId = (): string => {
  let sessionId = localStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
};

export function NewsletterPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const currentTriggerMinute = useRef<number | null>(null);
  const hasTrackedView = useRef(false);

  // Track popup events for analytics
  const trackPopupEvent = useCallback(async (
    eventType: 'view' | 'close' | 'submit',
    emailValue?: string
  ) => {
    try {
      await supabase.from("newsletter_popup_events").insert({
        event_type: eventType,
        session_id: getSessionId(),
        user_agent: navigator.userAgent,
        referrer: document.referrer || null,
        page_url: window.location.href,
        popup_trigger_minute: currentTriggerMinute.current,
        email: eventType === 'submit' ? emailValue : null,
      });
    } catch (err) {
      console.error("Failed to track popup event:", err);
    }
  }, []);

  useEffect(() => {
    const alreadySubscribed = localStorage.getItem(POPUP_SUBSCRIBED_KEY);
    if (alreadySubscribed || isOpen) return;

    // Anchor schedule to the user's first visit time (per device/browser)
    const startTsRaw = localStorage.getItem(POPUP_START_TS_KEY);
    const startTs = startTsRaw ? Number(startTsRaw) : Date.now();
    if (!startTsRaw) localStorage.setItem(POPUP_START_TS_KEY, String(startTs));

    const nextIndexRaw = localStorage.getItem(POPUP_NEXT_INDEX_KEY);
    const nextIndex = nextIndexRaw ? Number(nextIndexRaw) : 0;
    if (!nextIndexRaw) localStorage.setItem(POPUP_NEXT_INDEX_KEY, "0");

    if (Number.isNaN(nextIndex) || nextIndex >= POPUP_SCHEDULE_MINUTES.length) return;

    const elapsedMs = Date.now() - startTs;
    const targetMs = POPUP_SCHEDULE_MINUTES[nextIndex] * 60 * 1000;
    const delayMs = Math.max(0, targetMs - elapsedMs);

    const timer = setTimeout(() => {
      setIsOpen((prev) => {
        if (prev) return prev;
        currentTriggerMinute.current = POPUP_SCHEDULE_MINUTES[nextIndex];
        localStorage.setItem(POPUP_NEXT_INDEX_KEY, String(nextIndex + 1));
        return true;
      });
    }, delayMs);

    return () => clearTimeout(timer);
  }, [isSubscribed, isOpen]);

  // Track view when popup opens
  useEffect(() => {
    if (isOpen && !hasTrackedView.current) {
      hasTrackedView.current = true;
      trackPopupEvent('view');
    }
    if (!isOpen) {
      hasTrackedView.current = false;
    }
  }, [isOpen, trackPopupEvent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }

    setIsSubmitting(true);
    try {
      const trimmedEmail = email.toLowerCase().trim();
      const { error } = await supabase.from("newsletter_subscribers").insert({
        email: trimmedEmail,
      });

      if (error) {
        if (error.code === "23505") {
          toast.info("You're already subscribed!");
          setIsSubscribed(true);
          localStorage.setItem(POPUP_SUBSCRIBED_KEY, "true");
          await trackPopupEvent('submit', trimmedEmail);
        } else {
          throw error;
        }
      } else {
        setIsSubscribed(true);
        localStorage.setItem(POPUP_SUBSCRIBED_KEY, "true");
        toast.success("Welcome to the NEWSTACK newsletter! 📬");
        await trackPopupEvent('submit', trimmedEmail);
      }
    } catch (err) {
      console.error("Newsletter signup error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = async () => {
    if (!isSubscribed) {
      await trackPopupEvent('close');
    }
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100]"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-[min(92vw,28rem)]"
          >
            <div className="glass-card rounded-2xl p-6 sm:p-8 relative overflow-hidden max-h-[90vh] overflow-y-auto">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-primary/10 to-cyan-500/10 rounded-full blur-2xl" />

              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>

              <div className="relative">
                {isSubscribed ? (
                  <div className="text-center py-4">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                      <Check className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="font-display text-xl font-bold mb-2">You're In! 🎉</h3>
                    <p className="text-muted-foreground mb-4">
                      We'll send you the best news stories, curated just for you.
                    </p>
                    <Button onClick={handleClose}>Continue Reading</Button>
                  </div>
                ) : (
                  <>
                    {/* Header */}
                    <div className="text-center mb-6">
                      <Logo size="sm" className="justify-center mb-4" showText={false} />
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs mb-3">
                        <Sparkles className="w-3 h-3" />
                        Stay Informed
                      </div>
                      <h3 className="font-display text-2xl font-bold mb-2">
                        Get the Best Stories
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        Join thousands of readers. Get AI-curated news highlights delivered to your inbox.
                      </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 h-12"
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full h-12"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Mail className="w-4 h-4 mr-2" />
                        )}
                        {isSubmitting ? "Subscribing..." : "Subscribe for Free"}
                      </Button>
                    </form>

                    {/* Footer */}
                    <p className="text-xs text-center text-muted-foreground mt-4">
                      No spam, ever. Unsubscribe anytime.
                    </p>

                    {/* Skip button */}
                    <button
                      onClick={handleClose}
                      className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Maybe later
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
