import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { OpenNewsTrendingPanel } from "@/modules/opennews/components/OpenNewsTrendingPanel";
import { OpenNewsFeed } from "@/modules/opennews/components/OpenNewsFeed";
import { OpenNewsPoliticianSearch } from "@/modules/opennews/components/OpenNewsPoliticianSearch";
import { OpenNewsAdminPanel } from "@/modules/opennews/components/OpenNewsAdminPanel";
import { TrendingHeaderSlider } from "@/components/TrendingHeaderSlider";

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-20 container mx-auto max-w-6xl px-4 py-6 space-y-4">
        <h1 className="font-display text-3xl font-bold">{title}</h1>
        {children}
      </main>
      <Footer />
    </div>
  );
}

export function OpenNewsDiscussionsPage() {
  return (
    <Shell title="OpenNews Discussions">
      <OpenNewsFeed scope="debate" />
    </Shell>
  );
}

export function OpenNewsTrendingPage() {
  return (
    <Shell title="OpenNews Trending">
      <TrendingHeaderSlider />
      <OpenNewsTrendingPanel />
      <OpenNewsFeed scope="trending" />
    </Shell>
  );
}

export function OpenNewsPoliticiansPage() {
  return (
    <Shell title="OpenNews Politicians">
      <OpenNewsPoliticianSearch />
      <OpenNewsFeed scope="political_tracker" />
    </Shell>
  );
}

export function OpenNewsAdminPage() {
  return (
    <Shell title="OpenNews Admin">
      <OpenNewsAdminPanel />
    </Shell>
  );
}
