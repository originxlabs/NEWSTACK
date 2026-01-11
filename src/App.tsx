import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PreferencesProvider } from "@/contexts/PreferencesContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ScrollToTop } from "@/components/ScrollToTop";
import { StackBot } from "@/components/StackBot";
import { NewsletterPopup } from "@/components/NewsletterPopup";
import { MobileAppWrapper } from "@/components/mobile/MobileAppWrapper";
import { SplashScreen } from "@/components/SplashScreen";
import { useEffect, useState, useRef } from "react";
import Index from "./pages/Index";
import News from "./pages/News";
import Listen from "./pages/Listen";
import World from "./pages/World";
import Places from "./pages/Places";
import Topics from "./pages/Topics";
import Support from "./pages/Support";
import Features from "./pages/Features";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import RefundPolicy from "./pages/RefundPolicy";
import NotFound from "./pages/NotFound";
import StoryDetail from "./pages/StoryDetail";
import ApiLanding from "./pages/ApiLanding";
import NewsroomLayout from "./pages/newsroom/NewsroomLayout";
import NewsroomLogin from "./pages/newsroom/NewsroomLogin";
import NewsroomDashboard from "./pages/newsroom/NewsroomDashboard";
import NewsroomApiHealth from "./pages/newsroom/NewsroomApiHealth";
import NewsroomIngestion from "./pages/newsroom/NewsroomIngestion";
import NewsroomFeeds from "./pages/newsroom/NewsroomFeeds";
import NewsroomStories from "./pages/newsroom/NewsroomStories";
import NewsroomTrust from "./pages/newsroom/NewsroomTrust";
import NewsroomAlerts from "./pages/newsroom/NewsroomAlerts";
import NewsroomIntegrations from "./pages/newsroom/NewsroomIntegrations";
import NewsroomSettings from "./pages/newsroom/NewsroomSettings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false, // Prevent aggressive refetching
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

// Splash screen manager component
function SplashManager() {
  const location = useLocation();
  const [showSplash, setShowSplash] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const previousPath = useRef<string | null>(null);
  const hasShownInitial = useRef(false);

  // Show splash on initial page load
  useEffect(() => {
    if (!hasShownInitial.current) {
      setShowSplash(true);
      hasShownInitial.current = true;
      setIsInitialLoad(true);
    }
  }, []);

  // Show splash on route changes (navigation)
  useEffect(() => {
    if (previousPath.current !== null && previousPath.current !== location.pathname) {
      // Only show splash for major navigation (different base paths)
      const prevBase = previousPath.current.split('/')[1] || '';
      const currBase = location.pathname.split('/')[1] || '';
      
      if (prevBase !== currBase) {
        setShowSplash(true);
        setIsInitialLoad(false);
      }
    }
    previousPath.current = location.pathname;
  }, [location.pathname]);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  return (
    <>
      {showSplash && (
        <SplashScreen 
          onComplete={handleSplashComplete} 
          duration={isInitialLoad ? 2000 : 1200} 
        />
      )}
    </>
  );
}

function AppContent() {
  return (
    <>
      <ScrollToTop />
      <SplashManager />
      <StackBot />
      <NewsletterPopup />
      <MobileAppWrapper>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/news" element={<News />} />
          <Route path="/news/:storyId" element={<StoryDetail />} />
          <Route path="/listen" element={<Listen />} />
          <Route path="/world" element={<World />} />
          <Route path="/places" element={<Places />} />
          <Route path="/topics" element={<Topics />} />
          <Route path="/features" element={<Features />} />
          <Route path="/compare" element={<Features />} />
          <Route path="/support" element={<Support />} />
          <Route path="/api" element={<ApiLanding />} />
          {/* Enterprise Newsroom - separate from public */}
          <Route path="/newsroom/login" element={<NewsroomLogin />} />
          <Route path="/newsroom" element={<NewsroomLayout />}>
            <Route index element={<NewsroomDashboard />} />
            <Route path="api-health" element={<NewsroomApiHealth />} />
            <Route path="ingestion" element={<NewsroomIngestion />} />
            <Route path="feeds" element={<NewsroomFeeds />} />
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
