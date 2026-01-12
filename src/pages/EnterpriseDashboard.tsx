import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Key, Copy, Eye, EyeOff, BarChart3, Activity, Zap, Clock,
  Shield, CheckCircle2, RefreshCw, Building2, TrendingUp,
  AlertTriangle, ExternalLink, BookOpen
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface SandboxApiKey {
  id: string;
  api_key: string;
  requests_limit: number;
  requests_used: number;
  rate_limit_per_second: number;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

const SANDBOX_MONTHLY_LIMIT = 100;

export default function EnterpriseDashboard() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const [sandboxKey, setSandboxKey] = useState<SandboxApiKey | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Please sign in to access your enterprise dashboard");
      navigate("/api");
    }
  }, [user, authLoading, navigate]);

  // Fetch or create sandbox key
  useEffect(() => {
    async function fetchSandboxKey() {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from("api_keys")
          .select("*")
          .eq("customer_email", user.email)
          .eq("is_sandbox", true)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Error fetching sandbox key:", error);
        }
        
        if (data) {
          setSandboxKey(data as SandboxApiKey);
        }
      } catch (err) {
        console.error("Failed to fetch sandbox key:", err);
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      fetchSandboxKey();
    }
  }, [user]);

  const generateSandboxKey = async () => {
    if (!user) return;
    
    setIsGenerating(true);
    try {
      // Generate API key using database function
      const { data: keyData, error: keyError } = await supabase.rpc("generate_api_key");
      
      if (keyError) throw keyError;

      const { data, error } = await supabase
        .from("api_keys")
        .insert({
          customer_name: profile?.display_name || user.email?.split("@")[0] || "Enterprise User",
          customer_email: user.email || "",
          api_key: keyData,
          plan: "sandbox",
          is_sandbox: true,
          requests_limit: SANDBOX_MONTHLY_LIMIT,
          rate_limit_per_second: 2,
          allowed_endpoints: ["news", "world", "places"],
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setSandboxKey(data as SandboxApiKey);
      setShowApiKey(true);
      toast.success("Sandbox API key generated successfully!");
    } catch (err) {
      console.error("Failed to generate sandbox key:", err);
      toast.error("Failed to generate API key. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyApiKey = () => {
    if (sandboxKey?.api_key) {
      navigator.clipboard.writeText(sandboxKey.api_key);
      toast.success("API key copied to clipboard");
    }
  };

  const usagePercentage = sandboxKey 
    ? Math.min(100, (sandboxKey.requests_used / SANDBOX_MONTHLY_LIMIT) * 100)
    : 0;

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-14 pb-12">
          <div className="container mx-auto max-w-4xl px-4 py-8">
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-4 w-96 mb-8" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-14 pb-12">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="w-8 h-8 text-primary" />
              <h1 className="text-2xl sm:text-3xl font-bold">Enterprise Dashboard</h1>
            </div>
            <p className="text-muted-foreground">
              Welcome back, {profile?.display_name || user.email?.split("@")[0]}
            </p>
          </motion.div>

          {/* Sandbox API Key Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="mb-6 border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="w-5 h-5 text-primary" />
                      Sandbox API Key
                    </CardTitle>
                    <CardDescription>
                      Free sandbox access with {SANDBOX_MONTHLY_LIMIT} requests/month
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                    Sandbox
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {sandboxKey ? (
                  <>
                    {/* API Key Display */}
                    <div className="p-4 bg-muted/50 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-muted-foreground">Your API Key</span>
                        <Badge 
                          variant={sandboxKey.is_active ? "default" : "destructive"}
                          className={cn(
                            sandboxKey.is_active && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          )}
                        >
                          {sandboxKey.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-sm font-mono bg-background px-3 py-2 rounded border truncate">
                          {showApiKey ? sandboxKey.api_key : "nsk_test_" + "•".repeat(28)}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="flex-shrink-0"
                          onClick={() => setShowApiKey(!showApiKey)}
                        >
                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="flex-shrink-0"
                          onClick={copyApiKey}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Usage Stats */}
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="p-4 rounded-lg bg-muted/30 border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-muted-foreground">Usage This Month</span>
                          <Zap className="w-4 h-4 text-primary" />
                        </div>
                        <p className="text-xl font-bold">
                          {sandboxKey.requests_used}
                          <span className="text-sm font-normal text-muted-foreground">
                            {" "}/ {SANDBOX_MONTHLY_LIMIT}
                          </span>
                        </p>
                        <Progress value={usagePercentage} className="mt-2 h-1.5" />
                      </div>

                      <div className="p-4 rounded-lg bg-muted/30 border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-muted-foreground">Rate Limit</span>
                          <Activity className="w-4 h-4 text-blue-500" />
                        </div>
                        <p className="text-xl font-bold">
                          {sandboxKey.rate_limit_per_second}
                          <span className="text-sm font-normal text-muted-foreground"> req/s</span>
                        </p>
                      </div>

                      <div className="p-4 rounded-lg bg-muted/30 border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-muted-foreground">Last Used</span>
                          <Clock className="w-4 h-4 text-amber-500" />
                        </div>
                        <p className="text-sm font-medium">
                          {sandboxKey.last_used_at 
                            ? formatDistanceToNow(new Date(sandboxKey.last_used_at), { addSuffix: true })
                            : "Never"
                          }
                        </p>
                      </div>
                    </div>

                    {/* Usage Warning */}
                    {usagePercentage >= 80 && (
                      <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-amber-600 dark:text-amber-400">
                            Approaching usage limit
                          </p>
                          <p className="text-sm text-muted-foreground">
                            You've used {usagePercentage.toFixed(0)}% of your monthly quota. 
                            Consider upgrading to a paid plan for more requests.
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Key className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No Sandbox Key Yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Generate a free sandbox API key to start testing the NEWSTACK API
                    </p>
                    <Button onClick={generateSandboxKey} disabled={isGenerating}>
                      {isGenerating ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Key className="w-4 h-4 mr-2" />
                          Generate Sandbox Key
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid sm:grid-cols-2 gap-4 mb-6"
          >
            <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate("/api/docs")}>
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">API Documentation</h3>
                  <p className="text-sm text-muted-foreground">View OpenAPI specs and examples</p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground ml-auto" />
              </CardContent>
            </Card>

            <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate("/api")}>
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Try Live API</h3>
                  <p className="text-sm text-muted-foreground">Test endpoints in the sandbox</p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground ml-auto" />
              </CardContent>
            </Card>
          </motion.div>

          {/* Plan Features */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Sandbox Plan Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>{SANDBOX_MONTHLY_LIMIT} API requests per month</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Access to News, World, and Places APIs</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>2 requests per second rate limit</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Full confidence and source data</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>No credit card required</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span>Streaming & Webhooks not included</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">Need more?</h4>
                      <p className="text-sm text-muted-foreground">
                        Upgrade to Pro or Enterprise for higher limits and more features
                      </p>
                    </div>
                    <Button variant="outline" onClick={() => navigate("/api#pricing")}>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      View Plans
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}