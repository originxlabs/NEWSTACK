import { Outlet } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { OpenNewsSubNav } from "@/modules/opennews/components/OpenNewsSubNav";

export function OpenNewsLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-20">
        <section className="border-b border-border/60 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent">
          <div className="container mx-auto max-w-6xl px-4 py-8">
            <h1 className="font-display text-3xl font-bold">OPENNEWS</h1>
            <p className="text-muted-foreground mt-2 max-w-3xl">
              Viral, independent journalism engine with anonymous reporting, verification, moderation, and political transparency.
            </p>
          </div>
        </section>
        <OpenNewsSubNav />
        <section className="container mx-auto max-w-6xl px-4 py-6">
          <Outlet />
        </section>
      </main>
      <Footer />
    </div>
  );
}
