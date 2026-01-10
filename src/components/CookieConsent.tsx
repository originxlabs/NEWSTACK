import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X, Settings2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const COOKIE_CONSENT_KEY = "newstack_cookie_consent";

interface CookieConsentProps {
  onAccept: () => void;
}

export function CookieConsent({ onAccept }: CookieConsentProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Delay showing the banner for better UX
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      necessary: true,
      analytics: true,
      preferences: true,
      timestamp: Date.now()
    }));
    setIsVisible(false);
    onAccept();
  };

  const handleAcceptNecessary = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      necessary: true,
      analytics: false,
      preferences: false,
      timestamp: Date.now()
    }));
    setIsVisible(false);
    onAccept();
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6"
      >
        <div className="container mx-auto max-w-4xl">
          <div className="glass-card rounded-2xl p-4 sm:p-6 border border-border/50 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 flex-shrink-0">
                <Cookie className="w-6 h-6 text-primary" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-display font-semibold text-foreground text-lg mb-1">
                      We value your privacy 🍪
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      NEWSTACK uses cookies to enhance your experience, analyze site traffic, and personalize content. 
                      By clicking "Accept All", you consent to our use of cookies.
                    </p>
                  </div>
                  <button
                    onClick={handleAcceptNecessary}
                    className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 sm:hidden"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <AnimatePresence>
                  {showDetails && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-border/50 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-foreground">Necessary Cookies</span>
                          <p className="text-xs text-muted-foreground">Required for basic site functionality</p>
                        </div>
                        <Check className="w-5 h-5 text-success" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-foreground">Analytics Cookies</span>
                          <p className="text-xs text-muted-foreground">Help us understand how you use the site</p>
                        </div>
                        <div className="w-10 h-6 rounded-full bg-primary/20 flex items-center justify-end px-1">
                          <div className="w-4 h-4 rounded-full bg-primary" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-foreground">Preference Cookies</span>
                          <p className="text-xs text-muted-foreground">Remember your settings and preferences</p>
                        </div>
                        <div className="w-10 h-6 rounded-full bg-primary/20 flex items-center justify-end px-1">
                          <div className="w-4 h-4 rounded-full bg-primary" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDetails(!showDetails)}
                    className="order-2 sm:order-1"
                  >
                    <Settings2 className="w-4 h-4 mr-2" />
                    {showDetails ? "Hide Details" : "Cookie Settings"}
                  </Button>
                  <div className="flex items-center gap-2 order-1 sm:order-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleAcceptNecessary}
                      className="flex-1 sm:flex-initial"
                    >
                      Necessary Only
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleAcceptAll}
                      className="flex-1 sm:flex-initial glow-accent"
                    >
                      Accept All
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
