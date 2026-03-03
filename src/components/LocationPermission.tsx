import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, X, Navigation, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePreferences } from "@/contexts/PreferencesContext";

const LOCATION_PERMISSION_KEY = "newstack_location_permission";

interface LocationPermissionProps {
  onComplete: () => void;
}

export function LocationPermission({ onComplete }: LocationPermissionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { detectLocation, country } = usePreferences();

  useEffect(() => {
    const permission = localStorage.getItem(LOCATION_PERMISSION_KEY);
    if (!permission) {
      // Show after cookie consent (slight delay)
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    } else {
      onComplete();
    }
  }, [onComplete]);

  const handleEnableLocation = async () => {
    setIsLoading(true);
    
    // First try browser geolocation
    if ("geolocation" in navigator) {
      try {
        await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 600000
          });
        });
        
        localStorage.setItem(LOCATION_PERMISSION_KEY, JSON.stringify({
          enabled: true,
          method: "browser",
          timestamp: Date.now()
        }));
      } catch {
        // Fall back to IP-based detection
        await detectLocation();
        localStorage.setItem(LOCATION_PERMISSION_KEY, JSON.stringify({
          enabled: true,
          method: "ip",
          timestamp: Date.now()
        }));
      }
    } else {
      // Fall back to IP-based detection
      await detectLocation();
      localStorage.setItem(LOCATION_PERMISSION_KEY, JSON.stringify({
        enabled: true,
        method: "ip",
        timestamp: Date.now()
      }));
    }
    
    setIsLoading(false);
    setIsVisible(false);
    onComplete();
  };

  const handleSkip = async () => {
    // Use IP-based detection as fallback
    await detectLocation();
    localStorage.setItem(LOCATION_PERMISSION_KEY, JSON.stringify({
      enabled: false,
      method: "ip",
      timestamp: Date.now()
    }));
    setIsVisible(false);
    onComplete();
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="glass-card rounded-2xl p-6 sm:p-8 max-w-md w-full border border-border/50 shadow-2xl relative"
        >
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 mb-6">
              <MapPin className="w-8 h-8 text-primary" />
            </div>

            <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-2">
              Enable Local News
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base mb-6">
              Allow NEWSTACK to access your location for personalized local news, 
              weather updates, and relevant stories from your area.
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 text-left">
                <Navigation className="w-5 h-5 text-primary flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Local News & Updates</p>
                  <p className="text-xs text-muted-foreground">Get news from your city and region</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 text-left">
                <Globe2 className="w-5 h-5 text-primary flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Trending Near You</p>
                  <p className="text-xs text-muted-foreground">See what's trending in your location</p>
                </div>
              </div>
            </div>

            {country && (
              <p className="text-xs text-muted-foreground mb-4">
                Detected: {country.flag_emoji} {country.name}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="flex-1"
                disabled={isLoading}
              >
                Maybe Later
              </Button>
              <Button
                variant="default"
                onClick={handleEnableLocation}
                className="flex-1 glow-accent"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Navigation className="w-4 h-4" />
                    </motion.div>
                    Detecting...
                  </span>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 mr-2" />
                    Enable Location
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
