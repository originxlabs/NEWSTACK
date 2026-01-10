import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PreferencesProvider } from "@/contexts/PreferencesContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ScrollToTop } from "@/components/ScrollToTop";
import { StackBot } from "@/components/StackBot";
import { NewsletterPopup } from "@/components/NewsletterPopup";
import { MobileAppWrapper } from "@/components/mobile/MobileAppWrapper";
import { useEffect } from "react";
import Index from "./pages/Index";
import News from "./pages/News";
import Listen from "./pages/Listen";
import World from "./pages/World";
import Places from "./pages/Places";
import Topics from "./pages/Topics";
import Support from "./pages/Support";
import Profile from "./pages/Profile";
import Features from "./pages/Features";
import SavedArticles from "./pages/SavedArticles";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import RefundPolicy from "./pages/RefundPolicy";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import Pricing from "./pages/Pricing";

const queryClient = new QueryClient();

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
              <ScrollToTop />
              <StackBot />
              <NewsletterPopup />
              <MobileAppWrapper>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/news" element={<News />} />
                  <Route path="/listen" element={<Listen />} />
                  <Route path="/world" element={<World />} />
                  <Route path="/places" element={<Places />} />
                  <Route path="/topics" element={<Topics />} />
                  <Route path="/features" element={<Features />} />
                  <Route path="/compare" element={<Features />} />
                  <Route path="/support" element={<Support />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/saved" element={<SavedArticles />} />
                  <Route path="/settings" element={<Profile />} />
                  <Route path="/admin" element={<Admin />} />
                  {/* Legal pages */}
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="/refund" element={<RefundPolicy />} />
                  <Route path="/cookies" element={<PrivacyPolicy />} />
                  <Route path="/licenses" element={<TermsOfService />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </MobileAppWrapper>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </PreferencesProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
