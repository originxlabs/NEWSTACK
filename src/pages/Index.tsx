import { useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  ArrowRight, Layers, Shield, Activity, Clock, 
  TrendingUp, Globe, MapPin, ChevronRight, RefreshCw
} from "lucide-react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { Footer } from "@/components/Footer";
import { BreakingNewsBanner } from "@/components/BreakingNewsBanner";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { CookieConsent } from "@/components/CookieConsent";
import { LocationPermission } from "@/components/LocationPermission";
import { InterestsOnboarding, useInterestsOnboarding } from "@/components/InterestsOnboarding";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { MediaSourceMarquee } from "@/components/MediaSourceMarquee";
import { WhatChangedToday, StoryCluster } from "@/components/intelligence";
import { LatestNewsCards } from "@/components/LatestNewsCards";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useNews } from "@/hooks/use-news";
import { useNavigate } from "react-router-dom";

const COOKIE_CONSENT_KEY = "newstack_cookie_consent";

function determineConfidence(sourceCount?: number): "low" | "medium" | "high" {
  if (!sourceCount || sourceCount < 2) return "low";
  if (sourceCount < 4) return "medium";
  return "high";
}

const Index = () => {
  const { user, profile } = useAuth();
  const { country, loading: preferencesLoading } = usePreferences();
  const [showCookieConsent, setShowCookieConsent] = useState(false);
  const [showLocationPermission, setShowLocationPermission] = useState(false);
  const [consentCompleted, setConsentCompleted] = useState(false);
  const { showOnboarding, completeOnboarding } = useInterestsOnboarding();
  const navigate = useNavigate();
  const selectedInterests = useMemo(() => {
    try {
      const raw = localStorage.getItem("newstack_interests");
      if (!raw) return [] as string[];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((value) => typeof value === "string") : [];
    } catch {
      return [] as string[];
    }
  }, []);
  const primaryInterest = selectedInterests[0];
  
  // Personalized latest stories (refresh every 1 hour)
  const { data: latestNewsData, isLoading } = useNews({
    feedType: user ? "foryou" : "recent",
    pageSize: 20,
    sortBy: "latest",
    country: country?.code,
    topic: primaryInterest,
    refetchIntervalMs: 60 * 60 * 1000,
  });

  // Trending stories for pulse strip and cluster grouping
  const { data: trendingNewsData } = useNews({
    feedType: "trending",
    pageSize: 20,
    country: country?.code,
    refetchIntervalMs: 5 * 60 * 1000,
  });

  // Fetch top 20 global/world stories for Hero card stack (refreshes every 4 hours)
  const { data: worldNewsData, isLoading: isLoadingWorldNews } = useNews({
    feedType: "trending",
    pageSize: 20,
    sortBy: "sources",
  });

  const worldNewsArticles = useMemo(() =>
    (worldNewsData?.articles || []).map(a => ({
      id: a.id,
      headline: a.headline,
      summary: a.summary || a.ai_analysis || "",
      topic: a.topic_slug,
      imageUrl: a.image_url,
      publishedAt: a.published_at,
      sourceCount: a.source_count,
    })),
    [worldNewsData]
  );
  
  const trendingStories = useMemo(() => 
    (trendingNewsData?.articles || []).map(a => ({
      id: a.id,
      headline: a.headline,
      topic: a.topic_slug,
      sourceCount: a.source_count,
      publishedAt: a.published_at,
    })),
    [trendingNewsData]
  );

  const storyClusters = useMemo(() => 
    (trendingNewsData?.articles || []).slice(0, 6).map(a => ({
      id: a.id,
      headline: a.headline,
      summary: a.summary || a.ai_analysis || "",
      sourceCount: a.source_count || 1,
      sources: (a as any).sources || [],
      publishedAt: a.published_at,
      topic: a.topic_slug || "world",
      confidence: determineConfidence(a.source_count),
    })),
    [trendingNewsData]
  );

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
      {/* Consent Modals */}
      {showCookieConsent && <CookieConsent onAccept={handleCookieAccept} />}
      {showLocationPermission && !preferencesLoading && (
        <LocationPermission onComplete={handleLocationComplete} />
      )}
      {consentCompleted && showOnboarding && (
        <InterestsOnboarding isOpen={showOnboarding} onComplete={completeOnboarding} />
      )}

      <BreakingNewsBanner />
      <Header />
      
      <main>
        {/* Hero Section */}
        {user && profile ? (
          <section className="pt-24 pb-8 px-4 gradient-hero-bg">
            <div className="container mx-auto max-w-5xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-semibold text-foreground mb-2">
                  {getGreeting()}, {profile.display_name || profile.email?.split("@")[0] || "there"}
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Your personalized intelligence briefing
                  {country && ` • ${country.flag_emoji} ${country.name}`}
                </p>
              </motion.div>
            </div>
          </section>
        ) : (
          <HeroSection worldNews={worldNewsArticles} isLoadingNews={isLoadingWorldNews} />
        )}

        <MediaSourceMarquee />

        {/* What Changed Today Strip */}
        {trendingStories.length > 0 && (
          <WhatChangedToday stories={trendingStories} />
        )}

        {/* Latest 20 News Cards - GSAP animated */}
        <LatestNewsCards
          articles={(latestNewsData?.articles || []).map(a => ({
            id: a.id,
            headline: a.headline,
            topic: a.topic_slug,
            sourceCount: a.source_count,
            publishedAt: a.published_at,
            summary: a.summary || a.ai_analysis || "",
            tags: [
              a.topic_slug ? `#${String(a.topic_slug).replace(/\s+/g, "-").toLowerCase()}` : "#news",
              a.country_code ? `#${String(a.country_code).toLowerCase()}` : "#global",
              (a.source_count || 0) >= 4 ? "#multi-source" : "#verified",
            ],
          }))}
          isLoading={isLoading}
        />

        {/* Major Story Clusters */}
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-5xl">
            {/* Section Header */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center justify-between mb-6"
            >
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-semibold text-foreground mb-1">
                  Major Story Clusters
                </h2>
                <p className="text-sm text-muted-foreground">
                  Stories verified across multiple independent sources
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-1"
                onClick={() => navigate("/news")}
              >
                View all
                <ChevronRight className="w-4 h-4" />
              </Button>
            </motion.div>

            {/* Clusters Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-40 rounded-lg bg-muted animate-shimmer" />
                ))}
              </div>
            ) : storyClusters.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-lg border border-dashed border-border/50 bg-muted/20">
                <Activity className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-medium text-foreground mb-1">No stories available right now</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                  Our news ingestion system is updating. Stories from 170+ verified sources will appear here shortly.
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {storyClusters.map((cluster, i) => (
                  <motion.div
                    key={cluster.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <StoryCluster
                      {...cluster}
                      onReadMore={() => navigate(`/news/${cluster.id}`)}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Quick Navigation */}
        <section className="py-8 px-4 border-y border-border/50 bg-muted/20">
          <div className="container mx-auto max-w-5xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <NavCard 
                icon={<TrendingUp className="w-5 h-5" />}
                title="Signal Stream"
                description="All stories by signal type"
                href="/news"
              />
              <NavCard 
                icon={<Globe className="w-5 h-5" />}
                title="Global Pulse"
                description="Regional intensity map"
                href="/world"
              />
              <NavCard 
                icon={<MapPin className="w-5 h-5" />}
                title="Local Intelligence"
                description="News from your area"
                href="/places"
              />
              <NavCard 
                icon={<Layers className="w-5 h-5" />}
                title="Source Network"
                description="550+ verified sources"
                href="/news?filter=sources"
              />
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="intel-card p-6 text-center"
            >
              <h2 className="font-display text-lg font-semibold mb-2">
                Daily Intelligence Digest
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Top verified multi-source stories delivered at 8 AM
              </p>
              <div className="max-w-sm mx-auto">
                <NewsletterSignup />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Methodology Note */}
        <section className="py-8 px-4 border-t border-border/50">
          <div className="container mx-auto max-w-3xl text-center">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">How it works:</strong> Stories are ingested from 550+ independent public sources every 15 minutes. 
              Similar reports are clustered into evolving stories, timelines are built automatically, and credibility is assessed based on source diversity and consistency.
              This platform organizes information — it does not publish opinions.
            </p>
          </div>
        </section>
      </main>

      <Footer />
      <PWAInstallPrompt />
    </div>
  );
};

function NavCard({ 
  icon, 
  title, 
  description, 
  href 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  href: string;
}) {
  const navigate = useNavigate();
  
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(href)}
      className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors text-left group"
    >
      <div className="text-muted-foreground group-hover:text-primary transition-colors mb-2">
        {icon}
      </div>
      <h3 className="font-medium text-sm text-foreground mb-0.5">{title}</h3>
      <p className="text-xs text-muted-foreground">{description}</p>
    </motion.button>
  );
}

export default Index;
