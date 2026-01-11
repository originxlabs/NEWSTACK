import { motion } from "framer-motion";
import { 
  ArrowRight, Code, Shield, Zap, Globe, BarChart3, 
  Lock, Clock, Server, FileJson, AlertTriangle, CheckCircle2
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const apiFeatures = [
  {
    title: "Story Intelligence",
    description: "Normalized stories, confidence levels, timelines, and source attribution",
    icon: FileJson,
    items: ["Structured story data", "Confidence scoring", "Source diversity", "Timeline events"],
  },
  {
    title: "Breaking & Risk Signals",
    description: "Early detection, escalation flags, and contradiction alerts",
    icon: AlertTriangle,
    items: ["Breaking alerts", "Escalation detection", "Contradiction flags", "Update consistency"],
  },
  {
    title: "World & Places Intelligence",
    description: "Country signals, local impact summaries, and coverage gaps",
    icon: Globe,
    items: ["Regional signals", "Impact analysis", "Coverage mapping", "Geolocation data"],
  },
];

const pricingTiers = [
  {
    name: "API Starter",
    price: "$299",
    period: "/month",
    requests: "100k requests",
    description: "Story intelligence only",
    features: [
      "Story endpoints",
      "Confidence data",
      "Source attribution",
      "Basic rate limits",
    ],
    highlighted: false,
  },
  {
    name: "API Pro",
    price: "$1,200",
    period: "/month",
    requests: "1M requests",
    description: "Full intelligence + misinformation",
    features: [
      "All Starter features",
      "Breaking alerts",
      "Contradiction detection",
      "Priority support",
      "Higher rate limits",
    ],
    highlighted: true,
  },
  {
    name: "API Enterprise",
    price: "Custom",
    period: "",
    requests: "Unlimited",
    description: "SLA, streaming, private endpoints",
    features: [
      "All Pro features",
      "Dedicated endpoints",
      "Real-time streaming",
      "Custom SLAs",
      "Direct integration support",
    ],
    highlighted: false,
  },
];

const authFeatures = [
  { icon: Lock, label: "API key authentication" },
  { icon: Clock, label: "Rate limiting with retry headers" },
  { icon: Server, label: "Throttling protection" },
  { icon: Shield, label: "Org-based access control" },
];

export default function ApiLanding() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-14">
        {/* Hero */}
        <section className="py-20 sm:py-28 gradient-hero-bg">
          <div className="container mx-auto px-4 max-w-5xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge variant="outline" className="mb-6 text-sm">
                <Code className="w-3.5 h-3.5 mr-1.5" />
                Developer API
              </Badge>
              
              <h1 className="font-display text-4xl sm:text-5xl font-bold mb-6 text-balance">
                Structured news intelligence from open sources
              </h1>
              
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                Timelines, confidence signals, and verification-ready data — built for 
                developers, researchers, and media platforms.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" className="gap-2">
                  View API Documentation
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button size="lg" variant="outline">
                  Request Access
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* What the API Provides */}
        <section className="py-16 sm:py-20 border-t border-border/50">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4">
                What the API Provides
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Structured, normalized intelligence ready for integration
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {apiFeatures.map((feature, idx) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="h-full">
                    <CardHeader>
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                        <feature.icon className="w-5 h-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {feature.items.map((item) => (
                          <li key={item} className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Auth & Limits */}
        <section className="py-16 sm:py-20 bg-muted/30 border-y border-border/50">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-10">
              <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4">
                Authentication & Limits
              </h2>
              <p className="text-muted-foreground">
                Enterprise-grade security with transparent rate limiting
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {authFeatures.map((feature) => (
                <Card key={feature.label} className="text-center">
                  <CardContent className="pt-6">
                    <feature.icon className="w-8 h-8 mx-auto mb-3 text-primary" />
                    <p className="text-sm font-medium">{feature.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-16 sm:py-20">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4">
                API Pricing
              </h2>
              <p className="text-muted-foreground">
                Transparent pricing, no hidden fees
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {pricingTiers.map((tier, idx) => (
                <motion.div
                  key={tier.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className={tier.highlighted ? "border-primary shadow-lg" : ""}>
                    <CardHeader>
                      {tier.highlighted && (
                        <Badge className="w-fit mb-2">Most Popular</Badge>
                      )}
                      <CardTitle className="text-xl">{tier.name}</CardTitle>
                      <div className="mt-2">
                        <span className="text-3xl font-bold">{tier.price}</span>
                        <span className="text-muted-foreground">{tier.period}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{tier.requests}</p>
                      <p className="text-sm text-muted-foreground mt-1">{tier.description}</p>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {tier.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Button 
                        className="w-full mt-6" 
                        variant={tier.highlighted ? "default" : "outline"}
                      >
                        Get Started
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Promise Section */}
        <section className="py-16 sm:py-20 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <Shield className="w-12 h-12 mx-auto mb-6 opacity-80" />
            <h2 className="font-display text-2xl sm:text-3xl font-bold mb-6">
              Our Promise
            </h2>
            <div className="space-y-4 text-lg opacity-90">
              <p>No opinions.</p>
              <p>No social signals.</p>
              <p>No manipulation.</p>
              <p className="font-semibold pt-2">Fully auditable intelligence.</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
