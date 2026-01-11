import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Sparkles, 
  Headphones, 
  Shield, 
  TrendingUp, 
  MapPin, 
  Smartphone, 
  Globe,
  Check,
  X,
  Zap,
  Eye,
  Users,
  Volume2,
  Star
} from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered News Summaries",
    description: "Our AI summarizes complex stories so you spend less time reading and more time understanding. Get the key facts in seconds.",
    highlight: "Best in Class",
  },
  {
    icon: Headphones,
    title: "Free Audio News (TTS)",
    description: "Listen to news summaries with our text-to-speech player. 50 free plays per day for all users.",
    highlight: "50 Free/Day",
  },
  {
    icon: Shield,
    title: "Trusted & Transparent Citations",
    description: "Every article shows exact sources, publisher names, and timestamps. We never hide where news comes from.",
    highlight: "100% Transparent",
  },
  {
    icon: TrendingUp,
    title: "Trending Topics Algorithm",
    description: "Our multi-signal algorithm ranks stories by freshness, source coverage, and engagement — no bias, no paywall.",
    highlight: "Real-Time",
  },
  {
    icon: MapPin,
    title: "Place Intelligence",
    description: "Get local news, weather, AQI, and events for any location. Understand what's happening before you visit.",
    highlight: "Unique Feature",
  },
  {
    icon: Smartphone,
    title: "Installable PWA",
    description: "Install NEWSTACK directly from your browser. No app store needed. Works offline with cached news.",
    highlight: "Home Screen Ready",
  },
  {
    icon: Globe,
    title: "Multi-Language Support",
    description: "Read news in your preferred language with AI-powered translations. Supporting 10+ languages including Hindi, Tamil, Telugu.",
    highlight: "10+ Languages",
  },
];

const comparisonData = [
  { feature: "Free Forever", newstack: true, google: true, inshorts: true, dailyhunt: true, apple: "partial", perplexity: "partial" },
  { feature: "AI Summaries & Explanations", newstack: true, google: false, inshorts: false, dailyhunt: false, apple: false, perplexity: true },
  { feature: "Trusted Source Citations", newstack: true, google: true, inshorts: false, dailyhunt: false, apple: true, perplexity: "partial" },
  { feature: "Audio News (TTS)", newstack: true, google: false, inshorts: false, dailyhunt: false, apple: true, perplexity: false },
  { feature: "Place Intelligence + AQI", newstack: true, google: false, inshorts: false, dailyhunt: false, apple: false, perplexity: false },
  { feature: "Place Intelligence + AQI", newstack: true, google: false, inshorts: false, dailyhunt: false, apple: false, perplexity: false },
  { feature: "Installable PWA", newstack: true, google: false, inshorts: true, dailyhunt: true, apple: false, perplexity: false },
  { feature: "Multi-Language AI Translation", newstack: true, google: true, inshorts: "partial", dailyhunt: true, apple: "partial", perplexity: false },
];

const renderStatus = (status: boolean | string) => {
  if (status === true) return <Check className="w-5 h-5 text-green-500" />;
  if (status === false) return <X className="w-5 h-5 text-muted-foreground" />;
  return <span className="text-xs text-yellow-500">Partial</span>;
};

export default function Features() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <main className="pt-24">
        {/* Hero Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-5xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge className="mb-4 bg-primary/10 text-primary">Why NEWSTACK?</Badge>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                Free AI News, Summaries & Local Intelligence
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
                NEWSTACK is the best free AI news app with trusted sources, audio listening, trending topics, 
                and place-based intelligence. No paywalls, no ads pressure, just quality journalism.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/">
                  <Button size="lg" className="gap-2">
                    <Zap className="w-5 h-5" />
                    Start Reading Free
                  </Button>
                </Link>
                <Link to="/support">
                  <Button size="lg" variant="outline" className="gap-2">
                    <Star className="w-5 h-5" />
                    Support NEWSTACK
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
                Everything You Need in One News App
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                NEWSTACK combines AI intelligence, trusted journalism, and community insights.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                        <feature.icon className="w-6 h-6 text-primary" />
                      </div>
                      <Badge variant="secondary" className="mb-3 text-xs">
                        {feature.highlight}
                      </Badge>
                      <h3 className="font-display text-lg font-semibold mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
                NEWSTACK vs Other News Apps
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                See how NEWSTACK compares to Google News, Inshorts, Dailyhunt, Apple News, and Perplexity.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold">Feature</th>
                    <th className="p-4 font-semibold text-primary">NEWSTACK</th>
                    <th className="p-4 font-semibold text-muted-foreground">Google News</th>
                    <th className="p-4 font-semibold text-muted-foreground">Inshorts</th>
                    <th className="p-4 font-semibold text-muted-foreground">Dailyhunt</th>
                    <th className="p-4 font-semibold text-muted-foreground">Apple News</th>
                    <th className="p-4 font-semibold text-muted-foreground">Perplexity</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((row, index) => (
                    <tr key={row.feature} className={index % 2 === 0 ? "bg-muted/30" : ""}>
                      <td className="p-4 font-medium">{row.feature}</td>
                      <td className="p-4 text-center">{renderStatus(row.newstack)}</td>
                      <td className="p-4 text-center">{renderStatus(row.google)}</td>
                      <td className="p-4 text-center">{renderStatus(row.inshorts)}</td>
                      <td className="p-4 text-center">{renderStatus(row.dailyhunt)}</td>
                      <td className="p-4 text-center">{renderStatus(row.apple)}</td>
                      <td className="p-4 text-center">{renderStatus(row.perplexity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 px-4 bg-primary/5">
          <div className="container mx-auto max-w-5xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-3">
                  <Eye className="w-6 h-6 text-primary" />
                </div>
                <div className="font-display text-3xl font-bold">307+</div>
                <div className="text-sm text-muted-foreground">Stories/Day</div>
              </div>
              <div>
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-3">
                  <Globe className="w-6 h-6 text-primary" />
                </div>
                <div className="font-display text-3xl font-bold">15+</div>
                <div className="text-sm text-muted-foreground">Trusted Sources</div>
              </div>
              <div>
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-3">
                  <Volume2 className="w-6 h-6 text-primary" />
                </div>
                <div className="font-display text-3xl font-bold">50</div>
                <div className="text-sm text-muted-foreground">Free Audio/Day</div>
              </div>
              <div>
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-3">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div className="font-display text-3xl font-bold">∞</div>
                <div className="text-sm text-muted-foreground">Free Reading</div>
              </div>
            </div>
          </div>
        </section>

        {/* PWA Install Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Install NEWSTACK on Your Home Screen
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              NEWSTACK is a Progressive Web App — install it directly from your browser with a single tap. 
              No app store required. Works offline with cached news.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="bg-muted/50 rounded-xl p-6 max-w-sm">
                <h3 className="font-semibold mb-2">📱 iOS (Safari)</h3>
                <p className="text-sm text-muted-foreground">
                  Tap the Share button → "Add to Home Screen"
                </p>
              </div>
              <div className="bg-muted/50 rounded-xl p-6 max-w-sm">
                <h3 className="font-semibold mb-2">🤖 Android (Chrome)</h3>
                <p className="text-sm text-muted-foreground">
                  Tap Menu (⋮) → "Install App" or "Add to Home Screen"
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Ready to Experience the Future of News?
            </h2>
            <p className="text-muted-foreground mb-8">
              Join thousands of readers who trust NEWSTACK for their daily news.
            </p>
            <Link to="/">
              <Button size="lg" className="gap-2">
                <Sparkles className="w-5 h-5" />
                Start Reading Now — It's Free
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
