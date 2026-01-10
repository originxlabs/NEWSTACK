import { useEffect } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { NewsFeed } from "@/components/NewsFeed";
import { PlacesSection } from "@/components/PlacesSection";
import { PricingSection } from "@/components/PricingSection";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { usePreferences } from "@/contexts/PreferencesContext";

const Index = () => {
  const { user, profile } = useAuth();
  const { country } = usePreferences();

  // Enable dark mode by default
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        {user && profile ? (
          <section className="pt-24 pb-8 px-4">
            <div className="container mx-auto">
              <h1 className="font-display text-3xl md:text-4xl font-bold">
                {getGreeting()}, {profile.display_name || profile.email?.split("@")[0] || "there"}! 👋
              </h1>
              <p className="text-muted-foreground mt-2">
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
        <PricingSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
