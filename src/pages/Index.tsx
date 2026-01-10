import { useEffect } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { NewsFeed } from "@/components/NewsFeed";
import { PlacesSection } from "@/components/PlacesSection";
import { PricingSection } from "@/components/PricingSection";
import { Footer } from "@/components/Footer";

const Index = () => {
  // Enable dark mode by default
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <HeroSection />
        <NewsFeed />
        <PlacesSection />
        <PricingSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
