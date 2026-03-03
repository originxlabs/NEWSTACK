import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PreferencesProvider } from "@/contexts/PreferencesContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ScrollToTop } from "@/components/ScrollToTop";
import { OpenNews } from "@/components/StackBot";
import { OpenNewsPromoRibbon } from "@/components/OpenNewsPromoRibbon";
import { NewsletterPopup } from "@/components/NewsletterPopup";
import { MobileAppWrapper } from "@/components/mobile/MobileAppWrapper";
import { SplashScreen } from "@/components/SplashScreen";
import { useBreakingPush } from "@/hooks/use-breaking-push";
import { useEffect, useState, useRef, lazy, Suspense } from "react";

// === Eagerly loaded: Index (home) + News (most visited) ===
import Index from "./pages/Index";
import News from "./pages/News";

// === Lazy loaded: everything else (loaded on demand for fast initial load) ===
const Listen = lazy(() => import("./pages/Listen"));
const World = lazy(() => import("./pages/World"));
const Places = lazy(() => import("./pages/Places"));
const Topics = lazy(() => import("./pages/Topics"));
const Features = lazy(() => import("./pages/Features"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const NotFound = lazy(() => import("./pages/NotFound"));
const StoryDetail = lazy(() => import("./pages/StoryDetail"));
const ApiLanding = lazy(() => import("./pages/ApiLanding"));
const ApiPricing = lazy(() => import("./pages/ApiPricing"));
const Sources = lazy(() => import("./pages/Sources"));
const IndiaStates = lazy(() => import("./pages/IndiaStates"));
const StatePage = lazy(() => import("./pages/StatePage"));
const CountryPage = lazy(() => import("./pages/CountryPage"));
const ProvincePage = lazy(() => import("./pages/ProvincePage"));
const ContinentPage = lazy(() => import("./pages/ContinentPage"));
const ApiDocs = lazy(() => import("./pages/ApiDocs"));
const ApiDashboard = lazy(() => import("./pages/ApiDashboard"));
const EnterpriseDashboard = lazy(() => import("./pages/EnterpriseDashboard"));
const Contact = lazy(() => import("./pages/Contact"));
const NewsroomLayout = lazy(() => import("./pages/newsroom/NewsroomLayout"));
const NewsroomLogin = lazy(() => import("./pages/newsroom/NewsroomLogin"));
const NewsroomDashboard = lazy(() => import("./pages/newsroom/NewsroomDashboard"));
const NewsroomApiHealth = lazy(() => import("./pages/newsroom/NewsroomApiHealth"));
const NewsroomApiKeys = lazy(() => import("./pages/newsroom/NewsroomApiKeys"));
const NewsroomWebhooks = lazy(() => import("./pages/newsroom/NewsroomWebhooks"));
const NewsroomIngestion = lazy(() => import("./pages/newsroom/NewsroomIngestion"));
const NewsroomFeeds = lazy(() => import("./pages/newsroom/NewsroomFeeds"));
const NewsroomStories = lazy(() => import("./pages/newsroom/NewsroomStories"));
const NewsroomTrust = lazy(() => import("./pages/newsroom/NewsroomTrust"));
const NewsroomAlerts = lazy(() => import("./pages/newsroom/NewsroomAlerts"));
const NewsroomIntegrations = lazy(() => import("./pages/newsroom/NewsroomIntegrations"));
const NewsroomSettings = lazy(() => import("./pages/newsroom/NewsroomSettings"));
const NewsroomAnalytics = lazy(() => import("./pages/newsroom/NewsroomAnalytics"));
const NewsroomOwnerSetup = lazy(() => import("./pages/newsroom/NewsroomOwnerSetup"));
const NewsroomOwnerLogin = lazy(() => import("./pages/newsroom/NewsroomOwnerLogin"));
const NewsroomAuditLogs = lazy(() => import("./pages/newsroom/NewsroomAuditLogs"));
const NewsroomIngestionStatus = lazy(() => import("./pages/newsroom/NewsroomIngestionStatus"));
const NewsroomIngestionLogs = lazy(() => import("./pages/newsroom/NewsroomIngestionLogs"));
const NewsroomIngestionMonitor = lazy(() => import("./pages/newsroom/NewsroomIngestionMonitor"));
const NewsroomAccessUsers = lazy(() => import("./pages/newsroom/NewsroomAccessUsers"));
const IngestionPortal = lazy(() => import("./pages/IngestionPortal"));
import { AdminRouteGuard } from "./components/newsroom/AdminRouteGuard";
const OpenNewsLayoutPage = lazy(() => import("./pages/opennews/OpenNewsLayoutPage"));
const OpenNewsOverviewPage = lazy(() => import("./pages/opennews/OpenNewsOverviewPage"));
const OpenNewsThreadPage = lazy(() => import("./pages/opennews/OpenNewsThreadPage"));
const OpenPoliticsPage = lazy(() => import("./pages/OpenPolitics"));
const PublicGrievances = lazy(() => import("./pages/PublicGrievances"));
const SupportOpenNews = lazy(() => import("./pages/SupportOpenNews"));

// Named-export lazy wrappers
const OpenNewsAnonymousReportsPage = lazy(() => import("./pages/opennews/OpenNewsSubRoutes").then(m => ({ default: m.OpenNewsAnonymousReportsPage })));
const OpenNewsDebateArenaPage = lazy(() => import("./pages/opennews/OpenNewsSubRoutes").then(m => ({ default: m.OpenNewsDebateArenaPage })));
const OpenNewsInvestigationsPage = lazy(() => import("./pages/opennews/OpenNewsSubRoutes").then(m => ({ default: m.OpenNewsInvestigationsPage })));
const OpenNewsLatestPage = lazy(() => import("./pages/opennews/OpenNewsSubRoutes").then(m => ({ default: m.OpenNewsLatestPage })));
const OpenNewsPoliticalTrackerPage = lazy(() => import("./pages/opennews/OpenNewsSubRoutes").then(m => ({ default: m.OpenNewsPoliticalTrackerPage })));
const OpenNewsVerifiedJournalistsPage = lazy(() => import("./pages/opennews/OpenNewsSubRoutes").then(m => ({ default: m.OpenNewsVerifiedJournalistsPage })));
const DiscussionsPage = lazy(() => import("./pages/opennews/OpenNewsStandalone").then(m => ({ default: m.DiscussionsPage })));
const OpenNewsAdminStandalonePage = lazy(() => import("./pages/opennews/OpenNewsStandalone").then(m => ({ default: m.OpenNewsAdminStandalonePage })));
const VideoWire = lazy(() => import("./pages/VideoWire"));

// Minimal skeleton shown while lazy chunks load
function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        Loading...
      </div>
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes — show cached data instantly
      gcTime: 30 * 60 * 1000, // 30 minutes — keep in memory for fast back-navigation
      retry: 2,
      refetchOnWindowFocus: false, // Don't spam refetch on tab focus
      refetchOnMount: true, // Refetch when component mounts if stale
    },
  },
});

// Initialize theme on app load (default to light)
function ThemeInitializer() {
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    // Default to light mode unless explicitly set to dark
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      // Set default if not set
      if (!savedTheme) {
        localStorage.setItem("theme", "light");
      }
    }
  }, []);
  
  return null;
}

// Splash screen manager component - Only shows on initial cold start, NOT on navigation
function SplashManager() {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  if (!showSplash) return null;

  return (
    <SplashScreen
      onComplete={handleSplashComplete}
      duration={1500}
    />
  );
}

function AppContent() {
  // Initialize breaking news push notifications
  useBreakingPush();
  
  return (
    <>
      <ScrollToTop />
      <SplashManager />
      <OpenNews />
      <OpenNewsPromoRibbon />
      <NewsletterPopup />
      <MobileAppWrapper>
        <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/news" element={<News />} />
          <Route path="/news/:storyId" element={<StoryDetail />} />
          <Route path="/listen" element={<Listen />} />
          <Route path="/world" element={<World />} />
          <Route path="/world/continent/:continentId" element={<ContinentPage />} />
          <Route path="/world/:countryCode" element={<CountryPage />} />
          <Route path="/world/:countryCode/:provinceId" element={<ProvincePage />} />
          <Route path="/india" element={<IndiaStates />} />
          <Route path="/india/:stateId" element={<StatePage />} />
          <Route path="/places" element={<Places />} />
          <Route path="/topics" element={<Topics />} />
          <Route path="/features" element={<Features />} />
          <Route path="/compare" element={<Features />} />
          <Route path="/api" element={<ApiLanding />} />
          <Route path="/api/docs" element={<ApiDocs />} />
          <Route path="/api/pricing" element={<ApiPricing />} />
          <Route path="/api/dashboard" element={<ApiDashboard />} />
          <Route path="/opennews" element={<OpenNewsLayoutPage />}>
            <Route index element={<OpenNewsOverviewPage />} />
            <Route path="latest" element={<OpenNewsLatestPage />} />
            <Route path="investigations" element={<OpenNewsInvestigationsPage />} />
            <Route path="anonymous-reports" element={<OpenNewsAnonymousReportsPage />} />
            <Route path="verified-journalists" element={<OpenNewsVerifiedJournalistsPage />} />
            <Route path="debate-arena" element={<OpenNewsDebateArenaPage />} />
            <Route path="political-tracker" element={<OpenNewsPoliticalTrackerPage />} />
            <Route path="thread/:postId" element={<OpenNewsThreadPage />} />
          </Route>
          <Route path="/discussions" element={<DiscussionsPage />} />
          <Route path="/video-wire" element={<VideoWire />} />
          <Route path="/trending" element={<VideoWire />} />
          <Route path="/politicians" element={<OpenPoliticsPage />} />
          <Route path="/opennews/admin" element={<OpenNewsAdminStandalonePage />} />
          <Route path="/open-politics" element={<OpenPoliticsPage />} />
          <Route path="/open-governance" element={<OpenPoliticsPage />} />
          <Route path="/public-grievances" element={<PublicGrievances />} />
          <Route path="/support-opennews" element={<SupportOpenNews />} />
          <Route path="/support" element={<SupportOpenNews />} />
          <Route path="/enterprise/dashboard" element={<EnterpriseDashboard />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/ingestion" element={<IngestionPortal />} />
          {/* Enterprise Newsroom - separate from public */}
          <Route path="/newsroom/login" element={<NewsroomLogin />} />
          <Route path="/newsroom/owner-init" element={<NewsroomOwnerSetup />} />
          <Route path="/newsroom/owner-login" element={<NewsroomOwnerLogin />} />
          <Route path="/newsroom" element={<NewsroomLayout />}>
            <Route index element={<NewsroomDashboard />} />
            <Route path="api-health" element={<AdminRouteGuard pageName="API Health"><NewsroomApiHealth /></AdminRouteGuard>} />
            <Route path="api-keys" element={<AdminRouteGuard pageName="API Keys"><NewsroomApiKeys /></AdminRouteGuard>} />
            <Route path="webhooks" element={<AdminRouteGuard pageName="Webhooks"><NewsroomWebhooks /></AdminRouteGuard>} />
            <Route path="analytics" element={<AdminRouteGuard pageName="Analytics"><NewsroomAnalytics /></AdminRouteGuard>} />
            <Route path="ingestion" element={<AdminRouteGuard pageName="Ingestion"><NewsroomIngestion /></AdminRouteGuard>} />
            <Route path="ingestion-status" element={<NewsroomIngestionStatus />} />
            <Route path="ingestion-monitor" element={<AdminRouteGuard pageName="Ingestion Monitor"><NewsroomIngestionMonitor /></AdminRouteGuard>} />
            <Route path="access-users" element={<AdminRouteGuard pageName="Access Users"><NewsroomAccessUsers /></AdminRouteGuard>} />
            <Route path="feeds" element={<AdminRouteGuard pageName="RSS Feeds"><NewsroomFeeds /></AdminRouteGuard>} />
            <Route path="sources" element={<Sources />} />
            <Route path="audit-logs" element={<NewsroomAuditLogs />} />
            <Route path="ingestion-logs" element={<NewsroomIngestionLogs />} />
            <Route path="stories" element={<NewsroomStories />} />
            <Route path="trust" element={<NewsroomTrust />} />
            <Route path="alerts" element={<NewsroomAlerts />} />
            <Route path="integrations" element={<NewsroomIntegrations />} />
            <Route path="settings" element={<NewsroomSettings />} />
          </Route>
          {/* Legal pages */}
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/refund" element={<RefundPolicy />} />
          <Route path="/cookies" element={<PrivacyPolicy />} />
          <Route path="/licenses" element={<TermsOfService />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </MobileAppWrapper>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <PreferencesProvider>
        <ThemeProvider>
          <TooltipProvider>
            <ThemeInitializer />
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </PreferencesProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
