import { useEffect } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { NewsFeed } from "@/components/NewsFeed";
import { PlacesSection } from "@/components/PlacesSection";
import { Footer } from "@/components/Footer";
import { BreakingNewsBanner } from "@/components/BreakingNewsBanner";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { useAuth } from "@/contexts/AuthContext";
import { usePreferences } from "@/contexts/PreferencesContext";

const Index = () => {
  const { user, profile } = useAuth();
  const { country } = usePreferences();

  // Enable dark mode by default
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <BreakingNewsBanner />
      <Header />
      <main>
        {user && profile ? (
          <section className="pt-24 pb-8 px-4">
            <div className="container mx-auto">
              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold">
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
        <NewsFeed />
        <PlacesSection />
      </main>
      <Footer />
      <PWAInstallPrompt />
    </div>
  );
};

export default Index;
