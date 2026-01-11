import { useState } from "react";
import { motion } from "framer-motion";
import { 
  ArrowRight, Code, Shield, Globe, Lock, Clock, Server, 
  FileJson, CheckCircle2, Copy, ExternalLink, Newspaper,
  MapPin, Zap, Radio, Bell, AlertTriangle, ChevronRight,
  Terminal, BookOpen, Activity, Key, Webhook, Play
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Documentation sidebar items
const docNavItems = [
  { id: "overview", label: "Overview", icon: BookOpen },
  { id: "authentication", label: "Authentication", icon: Key },
  { id: "rate-limits", label: "Rate Limits", icon: Activity },
  { id: "news-api", label: "News API", icon: Newspaper },
  { id: "world-api", label: "World API", icon: Globe },
  { id: "places-api", label: "Places API", icon: MapPin },
  { id: "webhooks", label: "Webhooks", icon: Webhook },
  { id: "streaming", label: "Streaming", icon: Radio },
  { id: "schemas", label: "Schemas", icon: FileJson },
];

const pricingTiers = [
  {
    name: "Starter",
    price: "$299",
    requests: "100k",
    access: "News",
    features: ["News intelligence endpoints", "Confidence data", "Source attribution", "10 req/s burst"],
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$1,200",
    requests: "1M",
    access: "News + Places",
    features: ["All Starter features", "Places intelligence", "World intelligence", "50 req/s burst", "Priority support"],
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    requests: "Unlimited",
    access: "Full + Streaming",
    features: ["All Pro features", "Real-time streaming", "Webhooks", "Custom SLA", "Dedicated support"],
    highlighted: false,
  },
];

const webhookEvents = [
  { event: "story.created", description: "New story cluster detected", payload: '{"event":"story.created","story_id":"abc123","confidence":"Low","sources":1}' },
  { event: "confidence.changed", description: "Confidence level changed", payload: '{"event":"confidence.changed","story_id":"abc123","previous":"Low","current":"Medium","reason":"Independent confirmation added"}' },
  { event: "story.contradicted", description: "Contradiction detected", payload: '{"event":"story.contradicted","story_id":"abc123","confidence":"Low","details":"Conflicting reports detected"}' },
  { event: "region.hotspot", description: "Regional intensity crossed threshold", payload: '{"event":"region.hotspot","region":"asia-pacific","active_narratives":15}' },
];

const CodeBlock = ({ code, language = "json" }: { code: string; language?: string }) => {
  const copyCode = () => {
    navigator.clipboard.writeText(code);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="relative group">
      <pre className="bg-zinc-950 text-zinc-100 p-4 rounded-lg text-sm overflow-x-auto font-mono">
        <code>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
        onClick={copyCode}
      >
        <Copy className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default function ApiLanding() {
  const [activeSection, setActiveSection] = useState("overview");

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-14">
        {/* Hero - Minimal, Credible */}
        <section className="py-16 sm:py-20 border-b border-border">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="flex items-center gap-2 mb-6">
              <Badge variant="outline" className="font-mono text-xs">
                v1.0.0
              </Badge>
              <Badge variant="secondary" className="font-mono text-xs">
                OpenAPI 3.0
              </Badge>
            </div>
            
            <h1 className="font-display text-3xl sm:text-4xl font-bold mb-4 text-balance">
              Structured news and place intelligence from open sources
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-2xl mb-8">
              Timelines, confidence signals, and verification-ready data — built for 
              developers, researchers, and media platforms.
            </p>
            
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" className="gap-2" onClick={() => scrollToSection("news-api")}>
                <BookOpen className="w-4 h-4" />
                View API Documentation
              </Button>
              <Button size="lg" variant="outline" className="gap-2">
                <Key className="w-4 h-4" />
                Get Sandbox API Key
              </Button>
              <Button size="lg" variant="ghost" className="gap-2">
                Pricing
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* What You Get - 3 Columns */}
        <section className="py-12 sm:py-16 border-b border-border bg-muted/20">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid md:grid-cols-3 gap-8">
              {/* News Intelligence */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Newspaper className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">News Intelligence</h3>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    Clustered stories (not articles)
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    Confidence levels (Low / Medium / High)
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    Timelines & contradictions
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    Source transparency
                  </li>
                </ul>
              </div>

              {/* World Intelligence */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">World Intelligence</h3>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    Regional narrative activity
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    Hotspot detection
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    Coverage gaps
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    Update velocity
                  </li>
                </ul>
              </div>

              {/* Places Intelligence */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">Places Intelligence</h3>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    Local developments (30-day window)
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    Travel-relevant signals
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    Nearby essentials
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    Context without opinions
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Main Documentation Area */}
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="flex gap-8">
              {/* Sidebar Navigation */}
              <aside className="hidden lg:block w-56 flex-shrink-0">
                <nav className="sticky top-20 space-y-1">
                  {docNavItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id)}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors text-left",
                        activeSection === item.id
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  ))}
                </nav>
              </aside>

              {/* Documentation Content */}
              <div className="flex-1 max-w-4xl space-y-16">
                {/* Overview */}
                <section id="overview">
                  <h2 className="font-display text-2xl font-bold mb-4">Overview</h2>
                  <p className="text-muted-foreground mb-6">
                    The NEWSTACK Intelligence API provides structured, auditable news and place intelligence 
                    derived from open public sources. Stories are evolving entities with confidence signals, 
                    timelines, and source transparency — not raw articles or opinions.
                  </p>
                  
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle className="text-base">Base URLs</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Production</p>
                        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                          https://api.newstack.ai/v1
                        </code>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Sandbox</p>
                        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                          https://sandbox.api.newstack.ai/v1
                        </code>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <Card className="border-emerald-500/30 bg-emerald-500/5">
                      <CardContent className="pt-6">
                        <h4 className="font-semibold mb-2 text-emerald-600 dark:text-emerald-400">What this API is</h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• Structured, auditable intelligence</li>
                          <li>• Story clustering with confidence</li>
                          <li>• Timelines and verification signals</li>
                          <li>• Local and regional context</li>
                        </ul>
                      </CardContent>
                    </Card>
                    <Card className="border-destructive/30 bg-destructive/5">
                      <CardContent className="pt-6">
                        <h4 className="font-semibold mb-2 text-destructive">What this API is NOT</h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• Not raw RSS feeds</li>
                          <li>• Not articles or opinions</li>
                          <li>• Not sentiment bait</li>
                          <li>• Not social signals</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </section>

                {/* Authentication */}
                <section id="authentication">
                  <h2 className="font-display text-2xl font-bold mb-4">Authentication</h2>
                  <p className="text-muted-foreground mb-6">
                    All API requests require an API key passed in the <code className="bg-muted px-1 rounded">X-API-Key</code> header.
                  </p>
                  
                  <CodeBlock 
                    code={`curl -X GET "https://api.newstack.ai/v1/news" \\
  -H "X-API-Key: your_api_key"`}
                    language="bash"
                  />

                  <div className="grid sm:grid-cols-2 gap-4 mt-6">
                    <Card>
                      <CardContent className="pt-6 flex items-center gap-3">
                        <Lock className="w-8 h-8 text-primary" />
                        <div>
                          <p className="font-medium text-sm">API Key Authentication</p>
                          <p className="text-xs text-muted-foreground">Secure header-based auth</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6 flex items-center gap-3">
                        <Shield className="w-8 h-8 text-primary" />
                        <div>
                          <p className="font-medium text-sm">Org-based Access Control</p>
                          <p className="text-xs text-muted-foreground">Team management built-in</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </section>

                {/* Rate Limits */}
                <section id="rate-limits">
                  <h2 className="font-display text-2xl font-bold mb-4">Rate Limits</h2>
                  <p className="text-muted-foreground mb-6">
                    Transparent rate limiting with retry headers. All responses include usage information.
                  </p>

                  <div className="overflow-x-auto mb-6">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium">Plan</th>
                          <th className="text-left py-3 px-4 font-medium">Requests</th>
                          <th className="text-left py-3 px-4 font-medium">Burst</th>
                          <th className="text-left py-3 px-4 font-medium">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-3 px-4">Starter</td>
                          <td className="py-3 px-4">100k / month</td>
                          <td className="py-3 px-4">10 rps</td>
                          <td className="py-3 px-4 text-muted-foreground">News only</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-4">Pro</td>
                          <td className="py-3 px-4">1M / month</td>
                          <td className="py-3 px-4">50 rps</td>
                          <td className="py-3 px-4 text-muted-foreground">News + Places</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4">Enterprise</td>
                          <td className="py-3 px-4">Custom</td>
                          <td className="py-3 px-4">Custom</td>
                          <td className="py-3 px-4 text-muted-foreground">Streaming</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Response Headers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CodeBlock 
                        code={`X-RateLimit-Limit: 100000
X-RateLimit-Remaining: 99847
X-RateLimit-Reset: 1704067200
Retry-After: 60  # Only on 429`}
                      />
                    </CardContent>
                  </Card>
                </section>

                {/* News API */}
                <section id="news-api">
                  <h2 className="font-display text-2xl font-bold mb-4">News API</h2>
                  <p className="text-muted-foreground mb-6">
                    Returns story clusters derived from multiple independent sources. 
                    Stories are evolving entities, not articles.
                  </p>

                  <Tabs defaultValue="feed" className="mb-6">
                    <TabsList>
                      <TabsTrigger value="feed">Get Story Feed</TabsTrigger>
                      <TabsTrigger value="detail">Get Story Detail</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="feed" className="mt-4">
                      <Card>
                        <CardHeader>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-emerald-500">GET</Badge>
                            <code className="text-sm font-mono">/news</code>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <p className="text-sm font-medium mb-2">Parameters</p>
                            <div className="space-y-2 text-sm">
                              <div className="flex gap-4">
                                <code className="bg-muted px-2 py-0.5 rounded text-xs">category</code>
                                <span className="text-muted-foreground">world, politics, business, tech, science, climate, health</span>
                              </div>
                              <div className="flex gap-4">
                                <code className="bg-muted px-2 py-0.5 rounded text-xs">confidence</code>
                                <span className="text-muted-foreground">Low, Medium, High</span>
                              </div>
                              <div className="flex gap-4">
                                <code className="bg-muted px-2 py-0.5 rounded text-xs">window</code>
                                <span className="text-muted-foreground">24h, 48h, 7d</span>
                              </div>
                            </div>
                          </div>
                          <CodeBlock 
                            code={`{
  "updated_at": "2026-01-11T16:00:00Z",
  "stories": [
    {
      "story_id": "abc123",
      "headline": "Major development in renewable energy sector",
      "state": "confirmed",
      "confidence": "High",
      "sources_count": 5,
      "category": "climate",
      "first_published_at": "2026-01-11T14:30:00Z"
    }
  ]
}`}
                          />
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="detail" className="mt-4">
                      <Card>
                        <CardHeader>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-emerald-500">GET</Badge>
                            <code className="text-sm font-mono">/news/{'{story_id}'}</code>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <CodeBlock 
                            code={`{
  "story_id": "abc123",
  "headline": "Major development in renewable energy sector",
  "state": "confirmed",
  "confidence": "High",
  "sources_count": 5,
  "timeline": [
    "2026-01-11T14:30:00Z - Initial report from Reuters",
    "2026-01-11T15:00:00Z - Confirmed by AP",
    "2026-01-11T15:45:00Z - Additional context from BBC"
  ],
  "sources": [
    {"name": "Reuters", "reliability_tier": "tier_1"},
    {"name": "AP", "reliability_tier": "tier_1"},
    {"name": "BBC", "reliability_tier": "tier_1"}
  ]
}`}
                          />
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </section>

                {/* World API */}
                <section id="world-api">
                  <h2 className="font-display text-2xl font-bold mb-4">World API</h2>
                  <p className="text-muted-foreground mb-6">
                    Returns region-level narrative activity and hotspots.
                  </p>

                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-emerald-500">GET</Badge>
                          <code className="text-sm font-mono">/world</code>
                        </div>
                        <p className="text-sm text-muted-foreground">Global narrative intelligence overview</p>
                      </CardHeader>
                      <CardContent>
                        <CodeBlock 
                          code={`{
  "updated_at": "2026-01-11T16:00:00Z",
  "total_narratives": 847,
  "regions": [
    {
      "region": "europe",
      "active_narratives": 156,
      "status": "active",
      "trending": ["EU policy", "Energy markets"]
    }
  ]
}`}
                        />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-emerald-500">GET</Badge>
                          <code className="text-sm font-mono">/world/regions/{'{region}'}</code>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Regions: north-america, europe, asia-pacific, middle-east, africa, south-america
                        </p>
                      </CardHeader>
                      <CardContent>
                        <CodeBlock 
                          code={`{
  "region": "asia-pacific",
  "active_narratives": 203,
  "status": "hotspot",
  "stories": [...],
  "trending_topics": ["Trade policy", "Technology"],
  "coverage_gaps": ["Central Asia", "Pacific Islands"]
}`}
                        />
                      </CardContent>
                    </Card>
                  </div>
                </section>

                {/* Places API */}
                <section id="places-api">
                  <h2 className="font-display text-2xl font-bold mb-4">Places API</h2>
                  <p className="text-muted-foreground mb-6">
                    Local intelligence about specific places — context, developments, and essentials.
                  </p>

                  <Tabs defaultValue="place" className="mb-6">
                    <TabsList className="flex-wrap h-auto gap-1">
                      <TabsTrigger value="place">Get Place</TabsTrigger>
                      <TabsTrigger value="intelligence">Intelligence</TabsTrigger>
                      <TabsTrigger value="news">Local News</TabsTrigger>
                      <TabsTrigger value="essentials">Essentials</TabsTrigger>
                    </TabsList>

                    <TabsContent value="place" className="mt-4">
                      <Card>
                        <CardHeader>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-emerald-500">GET</Badge>
                            <code className="text-sm font-mono">/places/{'{place_id}'}</code>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <CodeBlock 
                            code={`{
  "place_id": "pura-petali-id",
  "name": "Pura Petali",
  "type": "place_of_worship",
  "location": {
    "city": "Tabanan",
    "region": "Bali",
    "country": "Indonesia",
    "country_code": "ID",
    "lat": -8.369,
    "lng": 115.133
  },
  "description": "A historic temple complex in Bali.",
  "relevance_tags": ["culture", "religion", "tourism"],
  "last_updated": "2026-01-11T21:10:00Z"
}`}
                          />
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="intelligence" className="mt-4">
                      <Card>
                        <CardHeader>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-emerald-500">GET</Badge>
                            <code className="text-sm font-mono">/places/{'{place_id}'}/intelligence</code>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <CodeBlock 
                            code={`{
  "context": "Pura Petali is a culturally significant religious site in Bali.",
  "recent_developments": [
    "Local authorities announced infrastructure improvements.",
    "Tourism activity increased following seasonal festivals."
  ],
  "best_time_to_visit": {
    "season": "April to September",
    "reason": "Dry weather and improved accessibility"
  },
  "relevant_for": ["pilgrims", "tourists", "local authorities"],
  "confidence": "Medium",
  "sources_count": 3,
  "last_30_days": true
}`}
                          />
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="news" className="mt-4">
                      <Card>
                        <CardHeader>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-emerald-500">GET</Badge>
                            <code className="text-sm font-mono">/places/{'{place_id}'}/news?window=30d</code>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <CodeBlock 
                            code={`{
  "window": "30d",
  "stories": [
    {
      "story_id": "bali-tourism-update",
      "headline": "Tourist access to Bali viewpoints set to improve",
      "date": "2026-01-08",
      "confidence": "Medium",
      "sources": 2,
      "source_names": ["The Bali Sun", "Regional Times"]
    }
  ]
}`}
                          />
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="essentials" className="mt-4">
                      <Card>
                        <CardHeader>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-emerald-500">GET</Badge>
                            <code className="text-sm font-mono">/places/{'{place_id}'}/essentials?category=hotels</code>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Categories: hotels, restaurants, hospitals, transport
                          </p>
                        </CardHeader>
                        <CardContent>
                          <CodeBlock 
                            code={`{
  "category": "hotels",
  "radius_km": 5,
  "results": [
    {
      "name": "Sangiri Glamping Resort",
      "type": "guest_house",
      "distance_km": 4.0
    }
  ]
}`}
                          />
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </section>

                {/* Webhooks */}
                <section id="webhooks">
                  <h2 className="font-display text-2xl font-bold mb-4">Webhooks</h2>
                  <p className="text-muted-foreground mb-6">
                    Event-driven notifications when intelligence changes. Webhooks notify 
                    <em> when intelligence changes</em>, not when content exists.
                  </p>

                  <Card className="mb-6">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-500">POST</Badge>
                        <code className="text-sm font-mono">/webhooks</code>
                      </div>
                      <p className="text-sm text-muted-foreground">Register a webhook endpoint</p>
                    </CardHeader>
                    <CardContent>
                      <CodeBlock 
                        code={`{
  "url": "https://yourapp.com/webhooks/newstack",
  "events": [
    "story.created",
    "story.updated",
    "confidence.changed",
    "story.contradicted",
    "region.hotspot"
  ]
}`}
                      />
                    </CardContent>
                  </Card>

                  <h3 className="font-semibold text-lg mb-4">Webhook Events</h3>
                  <div className="space-y-3">
                    {webhookEvents.map((event) => (
                      <Card key={event.event}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <code className="text-sm font-mono text-primary">{event.event}</code>
                            <span className="text-xs text-muted-foreground">{event.description}</span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <CodeBlock code={event.payload} />
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Webhook Security
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          Signed payloads (HMAC SHA-256)
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          Retry with exponential backoff
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          Idempotency keys
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </section>

                {/* Streaming */}
                <section id="streaming">
                  <h2 className="font-display text-2xl font-bold mb-4">Streaming API</h2>
                  <Badge variant="outline" className="mb-4">Enterprise Only</Badge>
                  <p className="text-muted-foreground mb-6">
                    Real-time Server-Sent Events (SSE) for newsrooms, monitoring platforms, and risk dashboards.
                  </p>

                  <Card className="mb-6">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-500">GET</Badge>
                        <code className="text-sm font-mono">/stream/news</code>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">Headers</p>
                      <CodeBlock 
                        code={`Accept: text/event-stream
X-API-Key: your_key`}
                      />
                      <p className="text-sm text-muted-foreground mt-4 mb-3">Example Event</p>
                      <CodeBlock 
                        code={`event: story.update
data: {"story_id":"abc123","confidence":"Medium","sources":4,"state":"developing"}`}
                      />
                    </CardContent>
                  </Card>

                  <h3 className="font-semibold text-lg mb-4">Available Streams</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium">Stream</th>
                          <th className="text-left py-3 px-4 font-medium">Purpose</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-3 px-4"><code className="bg-muted px-2 py-0.5 rounded text-xs">/stream/news</code></td>
                          <td className="py-3 px-4 text-muted-foreground">Story updates</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-4"><code className="bg-muted px-2 py-0.5 rounded text-xs">/stream/world</code></td>
                          <td className="py-3 px-4 text-muted-foreground">Regional shifts</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-4"><code className="bg-muted px-2 py-0.5 rounded text-xs">/stream/places/{'{id}'}</code></td>
                          <td className="py-3 px-4 text-muted-foreground">Local intelligence</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4"><code className="bg-muted px-2 py-0.5 rounded text-xs">/stream/alerts</code></td>
                          <td className="py-3 px-4 text-muted-foreground">Misinformation / contradictions</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Schemas */}
                <section id="schemas">
                  <h2 className="font-display text-2xl font-bold mb-4">Schemas</h2>
                  <p className="text-muted-foreground mb-6">
                    Core data structures used across the API.
                  </p>

                  <Tabs defaultValue="story">
                    <TabsList>
                      <TabsTrigger value="story">Story</TabsTrigger>
                      <TabsTrigger value="place">Place</TabsTrigger>
                      <TabsTrigger value="intelligence">PlaceIntelligence</TabsTrigger>
                    </TabsList>

                    <TabsContent value="story" className="mt-4">
                      <CodeBlock 
                        code={`Story:
  type: object
  properties:
    story_id:
      type: string
    headline:
      type: string
    state:
      type: string
      enum: [single-source, developing, confirmed, contradicted]
    confidence:
      type: string
      enum: [Low, Medium, High]
    sources_count:
      type: integer
    timeline:
      type: array
      items:
        type: string`}
                      />
                    </TabsContent>

                    <TabsContent value="place" className="mt-4">
                      <CodeBlock 
                        code={`Place:
  type: object
  properties:
    place_id:
      type: string
    name:
      type: string
    type:
      type: string
    location:
      type: object
      properties:
        city: string
        region: string
        country: string
        country_code: string
        lat: number
        lng: number
    description:
      type: string
    relevance_tags:
      type: array
      items:
        type: string`}
                      />
                    </TabsContent>

                    <TabsContent value="intelligence" className="mt-4">
                      <CodeBlock 
                        code={`PlaceIntelligence:
  type: object
  properties:
    context:
      type: string
    recent_developments:
      type: array
      items:
        type: string
    best_time_to_visit:
      type: object
      properties:
        season: string
        reason: string
    relevant_for:
      type: array
      items:
        type: string
    confidence:
      type: string
      enum: [Low, Medium, High]`}
                      />
                    </TabsContent>
                  </Tabs>
                </section>
              </div>
            </div>
          </div>
        </section>

        {/* Sandbox Section */}
        <section className="py-12 sm:py-16 bg-muted/30 border-y border-border">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <Terminal className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold mb-2">Sandbox Environment</h2>
                <p className="text-muted-foreground">
                  Test the API with synthetic but realistic data. No billing, safe experimentation.
                </p>
              </div>
            </div>

            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <code className="text-sm font-mono bg-muted px-3 py-1.5 rounded">
                    https://sandbox.api.newstack.ai/v1
                  </code>
                  <Badge variant="outline" className="text-amber-500 border-amber-500/30">
                    X-Sandbox: true
                  </Badge>
                </div>
                <ul className="grid sm:grid-cols-2 gap-2 text-sm">
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Same schema as production
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Synthetic but realistic data
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    No billing
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    1,000 requests/day limit
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Button className="gap-2">
              <Play className="w-4 h-4" />
              Open in Swagger UI
              <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-12 sm:py-16">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-10">
              <h2 className="font-display text-2xl sm:text-3xl font-bold mb-3">
                Pricing
              </h2>
              <p className="text-muted-foreground">
                Visible, no sales gate
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
                  <Card className={cn(
                    "h-full",
                    tier.highlighted && "border-primary shadow-lg"
                  )}>
                    <CardHeader>
                      {tier.highlighted && (
                        <Badge className="w-fit mb-2">Recommended</Badge>
                      )}
                      <CardTitle className="text-xl">{tier.name}</CardTitle>
                      <div className="mt-2">
                        <span className="text-3xl font-bold">{tier.price}</span>
                        {tier.price !== "Custom" && <span className="text-muted-foreground">/month</span>}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span>{tier.requests} requests</span>
                        <span>•</span>
                        <span>{tier.access}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 mb-6">
                        {tier.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Button 
                        className="w-full" 
                        variant={tier.highlighted ? "default" : "outline"}
                      >
                        {tier.price === "Custom" ? "Contact Sales" : "Get Started"}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Promise Section */}
        <section className="py-12 sm:py-16 bg-zinc-950 text-zinc-100">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <Shield className="w-10 h-10 mx-auto mb-6 opacity-70" />
            <div className="space-y-2 text-lg">
              <p>No opinions.</p>
              <p>No social signals.</p>
              <p>No manipulation.</p>
              <p className="font-semibold pt-3 text-xl">Fully auditable intelligence built from public sources.</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}