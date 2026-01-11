import { useState } from "react";
import { motion } from "framer-motion";
import { 
  ArrowRight, Code, Shield, Globe, Lock, Clock, Server, 
  FileJson, CheckCircle2, Copy, ExternalLink, Newspaper,
  MapPin, Zap, Radio, Bell, AlertTriangle, ChevronRight,
  Terminal, BookOpen, Activity, Key, Webhook, Play, Send,
  Loader2, CheckCircle, XCircle
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// API Domain Configuration - Single domain, environment determined by API key
const API_DOMAIN = "https://api.newstack.online/v1";

// For testing via Supabase edge functions
const SUPABASE_API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

// Documentation sidebar items
const docNavItems = [
  { id: "overview", label: "Overview", icon: BookOpen },
  { id: "api-tester", label: "API Tester", icon: Play },
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

// Interactive API Tester Component
function ApiTester() {
  const [endpoint, setEndpoint] = useState("news");
  const [method, setMethod] = useState("GET");
  const [category, setCategory] = useState("");
  const [confidence, setConfidence] = useState("");
  const [window, setWindow] = useState("24h");
  const [region, setRegion] = useState("");
  const [placeId, setPlaceId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);

  const getEndpointUrl = () => {
    switch (endpoint) {
      case "news":
        return `${SUPABASE_API_BASE}/api-v1-news`;
      case "world":
        return `${SUPABASE_API_BASE}/api-v1-world`;
      case "world-region":
        return `${SUPABASE_API_BASE}/api-v1-world/regions/${region || "asia-pacific"}`;
      case "places":
        return `${SUPABASE_API_BASE}/api-v1-places/${placeId || "mumbai"}`;
      case "places-intelligence":
        return `${SUPABASE_API_BASE}/api-v1-places/${placeId || "mumbai"}/intelligence`;
      case "places-news":
        return `${SUPABASE_API_BASE}/api-v1-places/${placeId || "mumbai"}/news`;
      default:
        return `${SUPABASE_API_BASE}/api-v1-news`;
    }
  };

  const getDisplayUrl = () => {
    switch (endpoint) {
      case "news":
        let newsUrl = `${API_DOMAIN}/news`;
        const params = [];
        if (category) params.push(`category=${category}`);
        if (confidence) params.push(`confidence=${confidence}`);
        if (window !== "24h") params.push(`window=${window}`);
        if (params.length) newsUrl += `?${params.join("&")}`;
        return newsUrl;
      case "world":
        return `${API_DOMAIN}/world`;
      case "world-region":
        return `${API_DOMAIN}/world/regions/${region || "asia-pacific"}`;
      case "places":
        return `${API_DOMAIN}/places/${placeId || "mumbai"}`;
      case "places-intelligence":
        return `${API_DOMAIN}/places/${placeId || "mumbai"}/intelligence`;
      case "places-news":
        return `${API_DOMAIN}/places/${placeId || "mumbai"}/news?window=${window}`;
      default:
        return `${API_DOMAIN}/news`;
    }
  };

  const runTest = async () => {
    setIsLoading(true);
    setResponse(null);
    setResponseTime(null);
    setResponseStatus(null);

    const startTime = Date.now();

    try {
      let url = getEndpointUrl();
      const params = new URLSearchParams();
      params.append("sandbox", "true");
      
      if (endpoint === "news") {
        if (category) params.append("category", category);
        if (confidence) params.append("confidence", confidence);
        if (window) params.append("window", window);
      }

      url += `?${params.toString()}`;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });

      const data = await res.json();
      const endTime = Date.now();

      setResponse(data);
      setResponseTime(endTime - startTime);
      setResponseStatus(res.status);
    } catch (err) {
      console.error("API test error:", err);
      setResponse({ error: "Failed to connect to API" });
      setResponseStatus(500);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Play className="w-5 h-5 text-primary" />
            Live API Tester
          </CardTitle>
          <Badge variant="secondary" className="font-mono text-xs">
            Sandbox Mode
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Endpoint Selection */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Endpoint</Label>
            <Select value={endpoint} onValueChange={setEndpoint}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="news">GET /news - Story Feed</SelectItem>
                <SelectItem value="world">GET /world - Global Overview</SelectItem>
                <SelectItem value="world-region">GET /world/regions/:region</SelectItem>
                <SelectItem value="places">GET /places/:place_id</SelectItem>
                <SelectItem value="places-intelligence">GET /places/:place_id/intelligence</SelectItem>
                <SelectItem value="places-news">GET /places/:place_id/news</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dynamic Parameters */}
          {endpoint === "news" && (
          <div className="space-y-2">
              <Label>Category (optional)</Label>
              <Select value={category || "all"} onValueChange={(val) => setCategory(val === "all" ? "" : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="politics">Politics</SelectItem>
                  <SelectItem value="science">Science</SelectItem>
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="climate">Climate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {endpoint === "world-region" && (
            <div className="space-y-2">
              <Label>Region</Label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="north-america">North America</SelectItem>
                  <SelectItem value="europe">Europe</SelectItem>
                  <SelectItem value="asia-pacific">Asia Pacific</SelectItem>
                  <SelectItem value="middle-east">Middle East</SelectItem>
                  <SelectItem value="africa">Africa</SelectItem>
                  <SelectItem value="south-america">South America</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {(endpoint === "places" || endpoint === "places-intelligence" || endpoint === "places-news") && (
            <div className="space-y-2">
              <Label>Place ID (city or country code)</Label>
              <Input 
                value={placeId} 
                onChange={(e) => setPlaceId(e.target.value)}
                placeholder="e.g., mumbai, delhi, IN, US"
              />
            </div>
          )}
        </div>

        {endpoint === "news" && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Confidence (optional)</Label>
              <Select value={confidence || "all"} onValueChange={(val) => setConfidence(val === "all" ? "" : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="All levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Time Window</Label>
              <Select value={window} onValueChange={setWindow}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6h">Last 6 hours</SelectItem>
                  <SelectItem value="24h">Last 24 hours</SelectItem>
                  <SelectItem value="48h">Last 48 hours</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Request URL Preview */}
        <div className="space-y-2">
          <Label>Request URL</Label>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-muted px-3 py-2 rounded font-mono overflow-x-auto">
              {getDisplayUrl()}
            </code>
            <Button
              variant="outline"
              size="icon"
              className="flex-shrink-0"
              onClick={() => {
                navigator.clipboard.writeText(getDisplayUrl());
                toast.success("URL copied");
              }}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Run Button */}
        <Button 
          onClick={runTest} 
          disabled={isLoading}
          className="w-full gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending Request...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send Request
            </>
          )}
        </Button>

        {/* Response */}
        {(response || responseStatus) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Response</Label>
              <div className="flex items-center gap-2">
                {responseStatus && (
                  <Badge 
                    variant={responseStatus < 400 ? "default" : "destructive"}
                    className={cn(
                      "font-mono",
                      responseStatus < 400 && "bg-emerald-500/10 text-emerald-500"
                    )}
                  >
                    {responseStatus < 400 ? (
                      <CheckCircle className="w-3 h-3 mr-1" />
                    ) : (
                      <XCircle className="w-3 h-3 mr-1" />
                    )}
                    {responseStatus}
                  </Badge>
                )}
                {responseTime && (
                  <Badge variant="outline" className="font-mono">
                    {responseTime}ms
                  </Badge>
                )}
              </div>
            </div>
            <pre className="bg-zinc-950 text-zinc-100 p-4 rounded-lg text-xs overflow-x-auto font-mono max-h-96 overflow-y-auto">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ApiLanding() {
  const [activeSection, setActiveSection] = useState("overview");

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleGetSandboxKey = () => {
    toast.info("Contact sales@newstack.live for sandbox API access");
  };

  const handleContactSales = () => {
    window.location.href = "mailto:sales@newstack.live?subject=NEWSTACK API Enterprise Inquiry";
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
              <Button size="lg" className="gap-2" onClick={() => scrollToSection("api-tester")}>
                <Play className="w-4 h-4" />
                Try API Live
              </Button>
              <Button size="lg" variant="outline" className="gap-2" onClick={handleGetSandboxKey}>
                <Key className="w-4 h-4" />
                Get Sandbox API Key
              </Button>
              <Button size="lg" variant="secondary" className="gap-2" onClick={() => window.location.href = "/api/dashboard"}>
                <Activity className="w-4 h-4" />
                My Dashboard
              </Button>
              <Button size="lg" variant="ghost" className="gap-2" onClick={() => scrollToSection("pricing")}>
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
                      <CardTitle className="text-base">Base URL</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Single Endpoint (Sandbox & Production)</p>
                          <code className="text-sm font-mono font-medium">
                            https://api.newstack.online/v1
                          </code>
                        </div>
                        <Badge className="bg-primary/10 text-primary border-primary/30">
                          All Environments
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Environment is determined by your API key prefix:
                        <code className="ml-1 bg-muted px-1 rounded">nsk_test_*</code> → Sandbox |
                        <code className="ml-1 bg-muted px-1 rounded">nsk_live_*</code> → Production
                      </p>
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

                {/* API Tester */}
                <section id="api-tester">
                  <h2 className="font-display text-2xl font-bold mb-4">Interactive API Tester</h2>
                  <p className="text-muted-foreground mb-6">
                    Test the NEWSTACK API endpoints live. Sandbox mode provides access to real data with relaxed rate limits.
                  </p>
                  <ApiTester />
                </section>

                {/* Authentication */}
                <section id="authentication">
                  <h2 className="font-display text-2xl font-bold mb-4">Authentication</h2>
                  <p className="text-muted-foreground mb-6">
                    All API requests require an API key passed in the <code className="bg-muted px-1 rounded">X-API-Key</code> header.
                  </p>
                  
                  <CodeBlock 
                    code={`curl -X GET "https://api.newstack.online/v1/news" \\
  -H "X-API-Key: nsk_live_your_api_key_here"

# For sandbox testing:
curl -X GET "https://api.newstack.online/v1/news" \\
  -H "X-API-Key: nsk_test_your_api_key_here"`}
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
                          <p className="font-medium text-sm">Rate Limiting</p>
                          <p className="text-xs text-muted-foreground">Plan-based request limits</p>
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
X-Response-Time: 45ms
Retry-After: 60  # Only on 429`}
                      />
                    </CardContent>
                  </Card>
                </section>

                {/* News API */}
                <section id="news-api">
                  <h2 className="font-display text-2xl font-bold mb-4">News API</h2>
                  <p className="text-muted-foreground mb-6">
                    Access clustered news intelligence with confidence signals and source transparency.
                  </p>

                  <Tabs defaultValue="feed" className="mb-6">
                    <TabsList>
                      <TabsTrigger value="feed">Story Feed</TabsTrigger>
                      <TabsTrigger value="detail">Story Detail</TabsTrigger>
                    </TabsList>
                    <TabsContent value="feed" className="space-y-4 mt-4">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-500/10 text-emerald-600">GET</Badge>
                        <code className="font-mono text-sm">/news</code>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Returns clustered story intelligence. Stories are evolving entities, not articles.
                      </p>
                      <CodeBlock 
                        code={`GET https://api.newstack.online/v1/news?category=technology&confidence=high&window=24h

Response:
{
  "updated_at": "2026-01-11T16:00:00Z",
  "stories": [
    {
      "story_id": "abc123",
      "headline": "Major tech announcement...",
      "state": "confirmed",
      "confidence": "High",
      "sources_count": 5,
      "category": "Technology",
      "first_published_at": "2026-01-11T14:30:00Z",
      "timeline": [
        "2026-01-11T14:30:00Z: Reuters",
        "2026-01-11T14:45:00Z: Bloomberg"
      ]
    }
  ]
}`}
                      />
                    </TabsContent>
                    <TabsContent value="detail" className="space-y-4 mt-4">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-500/10 text-emerald-600">GET</Badge>
                        <code className="font-mono text-sm">/news/:story_id</code>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Get detailed intelligence for a specific story including full timeline and sources.
                      </p>
                      <CodeBlock 
                        code={`GET https://api.newstack.online/v1/news/abc123

Response:
{
  "story_id": "abc123",
  "headline": "Major tech announcement...",
  "summary": "AI-generated summary of the story...",
  "state": "confirmed",
  "confidence": "High",
  "sources_count": 5,
  "verified_sources_count": 4,
  "has_contradictions": false,
  "location": {
    "country_code": "US",
    "city": null,
    "is_global": true
  },
  "timeline": [...],
  "sources": [
    {
      "name": "Reuters",
      "url": "https://...",
      "published_at": "2026-01-11T14:30:00Z",
      "is_primary": true
    }
  ]
}`}
                      />
                    </TabsContent>
                  </Tabs>
                </section>

                {/* World API */}
                <section id="world-api">
                  <h2 className="font-display text-2xl font-bold mb-4">World API</h2>
                  <p className="text-muted-foreground mb-6">
                    Global narrative intelligence with regional breakdown and hotspot detection.
                  </p>

                  <Tabs defaultValue="overview" className="mb-6">
                    <TabsList>
                      <TabsTrigger value="overview">Global Overview</TabsTrigger>
                      <TabsTrigger value="region">Region Detail</TabsTrigger>
                    </TabsList>
                    <TabsContent value="overview" className="space-y-4 mt-4">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-500/10 text-emerald-600">GET</Badge>
                        <code className="font-mono text-sm">/world</code>
                      </div>
                      <CodeBlock 
                        code={`GET https://api.newstack.online/v1/world

Response:
{
  "updated_at": "2026-01-11T16:00:00Z",
  "total_stories": 450,
  "regions": [
    {
      "id": "asia-pacific",
      "name": "Asia Pacific",
      "status": "hotspot",
      "story_count": 120,
      "active_narratives": 8,
      "trending_narrative": "Technology"
    }
  ],
  "hotspots": ["asia-pacific"],
  "coverage_gaps": ["africa"]
}`}
                      />
                    </TabsContent>
                    <TabsContent value="region" className="space-y-4 mt-4">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-500/10 text-emerald-600">GET</Badge>
                        <code className="font-mono text-sm">/world/regions/:region</code>
                      </div>
                      <CodeBlock 
                        code={`GET https://api.newstack.online/v1/world/regions/asia-pacific

Response:
{
  "region": "asia-pacific",
  "name": "Asia Pacific",
  "status": "hotspot",
  "story_count": 120,
  "active_narratives": 8,
  "top_categories": [
    {"category": "Technology", "count": 45},
    {"category": "Business", "count": 30}
  ],
  "stories": [...]
}`}
                      />
                    </TabsContent>
                  </Tabs>
                </section>

                {/* Places API */}
                <section id="places-api">
                  <h2 className="font-display text-2xl font-bold mb-4">Places API</h2>
                  <p className="text-muted-foreground mb-6">
                    Location-based intelligence with local developments and travel signals.
                  </p>

                  <Tabs defaultValue="place" className="mb-6">
                    <TabsList>
                      <TabsTrigger value="place">Place Info</TabsTrigger>
                      <TabsTrigger value="intelligence">Intelligence</TabsTrigger>
                      <TabsTrigger value="news">Local News</TabsTrigger>
                    </TabsList>
                    <TabsContent value="place" className="space-y-4 mt-4">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-500/10 text-emerald-600">GET</Badge>
                        <code className="font-mono text-sm">/places/:place_id</code>
                      </div>
                      <CodeBlock 
                        code={`GET https://api.newstack.online/v1/places/mumbai

Response:
{
  "place_id": "mumbai",
  "name": "Mumbai",
  "type": "city",
  "location": {
    "display_name": "mumbai",
    "country_code": "IN"
  },
  "story_count": 25,
  "endpoints": {
    "intelligence": "/places/mumbai/intelligence",
    "news": "/places/mumbai/news"
  }
}`}
                      />
                    </TabsContent>
                    <TabsContent value="intelligence" className="space-y-4 mt-4">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-500/10 text-emerald-600">GET</Badge>
                        <code className="font-mono text-sm">/places/:place_id/intelligence</code>
                      </div>
                      <CodeBlock 
                        code={`GET https://api.newstack.online/v1/places/mumbai/intelligence

Response:
{
  "place_id": "mumbai",
  "context": "Intelligence summary for mumbai...",
  "story_count": 25,
  "confidence": "Medium",
  "recent_developments": [
    "Major infrastructure project announced",
    "Tech hub expansion planned"
  ],
  "top_categories": [
    {"category": "Business", "count": 10}
  ]
}`}
                      />
                    </TabsContent>
                    <TabsContent value="news" className="space-y-4 mt-4">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-500/10 text-emerald-600">GET</Badge>
                        <code className="font-mono text-sm">/places/:place_id/news</code>
                      </div>
                      <CodeBlock 
                        code={`GET https://api.newstack.online/v1/places/mumbai/news?window=30d

Response:
{
  "place_id": "mumbai",
  "window": "30d",
  "total": 25,
  "stories": [
    {
      "story_id": "xyz789",
      "headline": "Mumbai tech sector growth...",
      "category": "Business",
      "confidence": "high",
      "published_at": "2026-01-10T10:00:00Z"
    }
  ]
}`}
                      />
                    </TabsContent>
                  </Tabs>
                </section>

                {/* Webhooks */}
                <section id="webhooks">
                  <h2 className="font-display text-2xl font-bold mb-4">Webhooks</h2>
                  <p className="text-muted-foreground mb-6">
                    Event-driven notifications when intelligence changes. Available on Enterprise plans.
                  </p>

                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle className="text-base">Register Webhook</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CodeBlock 
                        code={`POST https://api.newstack.online/v1/webhooks

{
  "url": "https://yourapp.com/webhooks/newstack",
  "events": [
    "story.created",
    "confidence.changed",
    "story.contradicted",
    "region.hotspot"
  ]
}

Response:
{
  "id": "whk_abc123",
  "secret": "whsec_...",
  "events": [...],
  "created_at": "2026-01-11T16:00:00Z"
}`}
                      />
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Available Events</h3>
                    {webhookEvents.map((event) => (
                      <Card key={event.event}>
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="font-mono">{event.event}</Badge>
                            <span className="text-sm text-muted-foreground">{event.description}</span>
                          </div>
                          <pre className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto">
                            {event.payload}
                          </pre>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Card className="mt-6">
                    <CardContent className="pt-6">
                      <h4 className="font-semibold mb-2">Webhook Security</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• All payloads are signed with HMAC-SHA256</li>
                        <li>• Verify using the <code className="bg-muted px-1 rounded">X-NEWSTACK-Signature</code> header</li>
                        <li>• Retry with exponential backoff on failure</li>
                        <li>• Idempotency keys prevent duplicate processing</li>
                      </ul>
                    </CardContent>
                  </Card>
                </section>

                {/* Streaming */}
                <section id="streaming">
                  <h2 className="font-display text-2xl font-bold mb-4">Streaming API</h2>
                  <Badge variant="secondary" className="mb-4">Enterprise Only</Badge>
                  <p className="text-muted-foreground mb-6">
                    Real-time Server-Sent Events (SSE) for live intelligence updates.
                  </p>

                  <CodeBlock 
                    code={`GET https://api.newstack.online/v1/stream/news
Accept: text/event-stream
X-API-Key: nsk_live_your_key

event: story.update
data: {"story_id":"abc123","confidence":"Medium","sources":4,"state":"developing"}

event: story.update
data: {"story_id":"def456","confidence":"High","sources":6,"state":"confirmed"}`}
                  />

                  <div className="grid sm:grid-cols-2 gap-4 mt-6">
                    <Card>
                      <CardContent className="pt-6">
                        <code className="text-sm font-mono">/stream/news</code>
                        <p className="text-xs text-muted-foreground mt-1">Story updates</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <code className="text-sm font-mono">/stream/world</code>
                        <p className="text-xs text-muted-foreground mt-1">Regional shifts</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <code className="text-sm font-mono">/stream/places/:id</code>
                        <p className="text-xs text-muted-foreground mt-1">Local intelligence</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <code className="text-sm font-mono">/stream/alerts</code>
                        <p className="text-xs text-muted-foreground mt-1">Contradictions</p>
                      </CardContent>
                    </Card>
                  </div>
                </section>

                {/* Schemas */}
                <section id="schemas">
                  <h2 className="font-display text-2xl font-bold mb-4">Schemas</h2>
                  <p className="text-muted-foreground mb-6">
                    Core data models used across the API.
                  </p>

                  <Tabs defaultValue="story" className="mb-6">
                    <TabsList>
                      <TabsTrigger value="story">Story</TabsTrigger>
                      <TabsTrigger value="place">Place</TabsTrigger>
                      <TabsTrigger value="region">Region</TabsTrigger>
                    </TabsList>
                    <TabsContent value="story" className="mt-4">
                      <CodeBlock 
                        code={`Story {
  story_id: string
  headline: string
  summary?: string
  state: "single-source" | "developing" | "confirmed" | "contradicted"
  confidence: "Low" | "Medium" | "High"
  sources_count: integer
  verified_sources_count?: integer
  has_contradictions?: boolean
  category?: string
  first_published_at: datetime
  last_updated_at?: datetime
  location?: {
    country_code: string
    city?: string
    is_global: boolean
  }
  timeline?: string[]
  sources?: Source[]
}`}
                      />
                    </TabsContent>
                    <TabsContent value="place" className="mt-4">
                      <CodeBlock 
                        code={`Place {
  place_id: string
  name: string
  type: "city" | "country"
  location: {
    display_name: string
    country_code: string
  }
  story_count: integer
  endpoints: {
    intelligence: string
    news: string
    essentials?: string
  }
}`}
                      />
                    </TabsContent>
                    <TabsContent value="region" className="mt-4">
                      <CodeBlock 
                        code={`Region {
  id: string
  name: string
  status: "stable" | "active" | "hotspot"
  story_count: integer
  active_narratives: integer
  trending_narrative?: string
  top_categories: Category[]
}`}
                      />
                    </TabsContent>
                  </Tabs>
                </section>

                {/* Pricing */}
                <section id="pricing" className="py-8">
                  <h2 className="font-display text-2xl font-bold mb-4">Pricing</h2>
                  <p className="text-muted-foreground mb-8">
                    Transparent pricing with no hidden fees. Start with Sandbox for free.
                  </p>

                  <div className="grid md:grid-cols-3 gap-6">
                    {pricingTiers.map((tier) => (
                      <Card 
                        key={tier.name}
                        className={cn(
                          "relative",
                          tier.highlighted && "border-primary shadow-lg"
                        )}
                      >
                        {tier.highlighted && (
                          <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                            Most Popular
                          </Badge>
                        )}
                        <CardHeader>
                          <CardTitle className="text-lg">{tier.name}</CardTitle>
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold">{tier.price}</span>
                            {tier.price !== "Custom" && (
                              <span className="text-muted-foreground">/month</span>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Requests</span>
                            <span className="font-medium">{tier.requests}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Access</span>
                            <span className="font-medium">{tier.access}</span>
                          </div>
                          <ul className="space-y-2 pt-4 border-t">
                            {tier.features.map((feature) => (
                              <li key={feature} className="flex items-start gap-2 text-sm">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                          <Button 
                            className="w-full mt-4" 
                            variant={tier.highlighted ? "default" : "outline"}
                            onClick={tier.name === "Enterprise" ? handleContactSales : handleGetSandboxKey}
                          >
                            {tier.name === "Enterprise" ? "Contact Sales" : "Get Started"}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>

                {/* Promise Section */}
                <section className="py-8 border-t">
                  <Card className="bg-muted/50">
                    <CardContent className="pt-6 text-center">
                      <h3 className="font-display text-xl font-bold mb-4">Our Promise</h3>
                      <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        No opinions. No social signals. No manipulation.<br />
                        <span className="font-medium text-foreground">
                          Fully auditable intelligence built from public sources.
                        </span>
                      </p>
                    </CardContent>
                  </Card>
                </section>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
