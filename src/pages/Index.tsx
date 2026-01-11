import { useEffect, useState, useCallback } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { TrendingNewsGrid } from "@/components/TrendingNewsGrid";
import { PlacesSection } from "@/components/PlacesSection";
import { Footer } from "@/components/Footer";
import { BreakingNewsBanner } from "@/components/BreakingNewsBanner";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { CookieConsent } from "@/components/CookieConsent";
import { LocationPermission } from "@/components/LocationPermission";
import { InterestsOnboarding, useInterestsOnboarding } from "@/components/InterestsOnboarding";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { useAuth } from "@/contexts/AuthContext";
import { usePreferences } from "@/contexts/PreferencesContext";

const COOKIE_CONSENT_KEY = "newstack_cookie_consent";

const Index = () => {
  const { user, profile } = useAuth();
  const { country, loading: preferencesLoading } = usePreferences();
  const [showCookieConsent, setShowCookieConsent] = useState(false);
  const [showLocationPermission, setShowLocationPermission] = useState(false);
  const [consentCompleted, setConsentCompleted] = useState(false);
  const { showOnboarding, completeOnboarding } = useInterestsOnboarding();

  // Check if cookie consent is needed
  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      setShowCookieConsent(true);
    } else {
      setConsentCompleted(true);
    }
  }, []);

  // Enable dark mode by default
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const handleCookieAccept = useCallback(() => {
    setShowCookieConsent(false);
    // Show location permission after cookie consent
    setShowLocationPermission(true);
  }, []);

  const handleLocationComplete = useCallback(() => {
    setShowLocationPermission(false);
    setConsentCompleted(true);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Cookie Consent - shows first */}
      {showCookieConsent && (
        <CookieConsent onAccept={handleCookieAccept} />
      )}
      
      {/* Location Permission - shows after cookie consent */}
      {showLocationPermission && !preferencesLoading && (
        <LocationPermission onComplete={handleLocationComplete} />
      )}

      {/* Interests Onboarding - shows after location permission */}
      {consentCompleted && showOnboarding && (
        <InterestsOnboarding isOpen={showOnboarding} onComplete={completeOnboarding} />
      )}

      <BreakingNewsBanner />
      <Header />
      <main>
        {user && profile ? (
          <section className="pt-24 pb-8 px-4">
            <div className="container mx-auto">
              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                {getGreeting()}, {profile.display_name || profile.email?.split("@")[0] || "there"}! 👋
              </h1>
              <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                Here's your personalized news feed
                {country && ` from ${country.flag_emoji} ${country.name}`}
              </p>
            </div>
          </section>
        ) : (
          <HeroSection />
        )}
        
        {/* Trending News Grid - Card layout with modal */}
        <TrendingNewsGrid />
        
        {/* Newsletter Signup Section */}
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-2xl">
            <div className="glass-card rounded-2xl p-8 text-center bg-gradient-to-br from-primary/5 via-background to-accent/5 border border-primary/10">
              <div className="mb-4">
                <span className="text-4xl">📬</span>
              </div>
              <h2 className="font-display text-2xl font-bold mb-2">
                Get the Daily Digest
              </h2>
              <p className="text-muted-foreground mb-6">
                Top verified multi-source stories delivered to your inbox every morning at 8 AM
              </p>
              <div className="max-w-md mx-auto">
                <NewsletterSignup />
              </div>
            </div>
          </div>
        </section>
        
        <PlacesSection />
      </main>
      <Footer />
      <PWAInstallPrompt />
    </div>
  );
};

export default Index;
