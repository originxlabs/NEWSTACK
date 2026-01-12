import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Check, X, Zap, Building2, Rocket, Crown, 
  Shield, Clock, Activity, Webhook, Radio,
  ArrowRight, Loader2, ExternalLink, Star
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";
import { cn } from "@/lib/utils";

const pricingPlans = [
  {
    id: "sandbox",
    name: "Sandbox",
    description: "For testing and development",
    price: { monthly: 0, annual: 0 },
    icon: Zap,
    color: "from-zinc-500 to-zinc-600",
    requests: "100/month",
    rateLimit: "2 req/s",
    features: [
      { name: "News API Access", included: true },
      { name: "World API Access", included: true },
      { name: "Places API Access", included: true },
      { name: "Confidence Data", included: true },
      { name: "Source Attribution", included: true },
      { name: "Streaming API", included: false },
      { name: "Webhooks", included: false },
      { name: "Priority Support", included: false },
      { name: "SLA Guarantee", included: false },
    ],
    cta: "Get Free Key",
    highlighted: false,
  },
  {
    id: "starter",
    name: "Starter",
    description: "For small projects and startups",
    price: { monthly: 299, annual: 249 },
    icon: Rocket,
    color: "from-blue-500 to-indigo-500",
    requests: "100K/month",
    rateLimit: "10 req/s",
    features: [
      { name: "News API Access", included: true },
      { name: "World API Access", included: true },
      { name: "Places API Access", included: true },
      { name: "Confidence Data", included: true },
      { name: "Source Attribution", included: true },
      { name: "Streaming API", included: false },
      { name: "Webhooks", included: false },
      { name: "Priority Support", included: false },
      { name: "SLA Guarantee", included: false },
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    id: "pro",
    name: "Pro",
    description: "For growing businesses",
    price: { monthly: 1200, annual: 999 },
    icon: Crown,
    color: "from-primary to-primary/80",
    requests: "1M/month",
    rateLimit: "50 req/s",
    features: [
      { name: "News API Access", included: true },
      { name: "World API Access", included: true },
      { name: "Places API Access", included: true },
      { name: "Confidence Data", included: true },
      { name: "Source Attribution", included: true },
      { name: "Streaming API", included: true },
      { name: "Webhooks", included: true },
      { name: "Priority Support", included: true },
      { name: "SLA Guarantee", included: false },
    ],
    cta: "Upgrade to Pro",
    highlighted: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large-scale deployments",
    price: { monthly: null, annual: null },
    icon: Building2,
    color: "from-amber-500 to-orange-500",
    requests: "Unlimited",
    rateLimit: "Custom",
    features: [
      { name: "News API Access", included: true },
      { name: "World API Access", included: true },
      { name: "Places API Access", included: true },
      { name: "Confidence Data", included: true },
      { name: "Source Attribution", included: true },
      { name: "Streaming API", included: true },
      { name: "Webhooks", included: true },
      { name: "Priority Support", included: true },
      { name: "SLA Guarantee", included: true },
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

const faqs = [
  {
    question: "What counts as an API request?",
    answer: "Each HTTP call to any NEWSTACK API endpoint counts as one request. This includes calls to News, World, and Places APIs. Streaming connections count based on the number of messages received.",
  },
  {
    question: "Can I upgrade or downgrade my plan?",
    answer: "Yes! You can upgrade at any time and the price will be prorated. Downgrades take effect at the start of your next billing cycle.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards via Razorpay, including Visa, Mastercard, American Express, and UPI for Indian customers.",
  },
  {
    question: "Is there a free trial for paid plans?",
    answer: "The Sandbox plan serves as a free trial with 100 requests per month. For extended trials on paid plans, contact our sales team.",
  },
  {
    question: "What happens if I exceed my request limit?",
    answer: "You'll receive email notifications at 80% and 100% usage. After reaching the limit, additional requests will return a 429 status until your limit resets or you upgrade.",
  },
];

export default function ApiPricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAnnual, setIsAnnual] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handlePlanSelect = async (planId: string) => {
    if (planId === "sandbox") {
      if (!user) {
        setShowAuthModal(true);
      } else {
        navigate("/enterprise/dashboard");
      }
    } else if (planId === "enterprise") {
      window.location.href = "mailto:sales@newstack.live?subject=NEWSTACK Enterprise API Inquiry";
    } else {
      // Redirect to payment flow for paid plans
      if (!user) {
        setShowAuthModal(true);
        return;
      }
      
      // Initiate Razorpay payment
      try {
        const { data, error } = await supabase.functions.invoke("create-api-subscription", {
          body: {
            planType: planId,
            billingCycle: isAnnual ? "annual" : "monthly",
            userId: user.id,
            email: user.email,
          },
        });

        if (error || !data) {
          toast.error("Failed to create subscription order");
          return;
        }

        if (!razorpayLoaded || !window.Razorpay) {
          toast.error("Payment gateway loading. Please try again.");
          return;
        }

        const options = {
          key: data.keyId,
          amount: data.amount,
          currency: data.currency,
          name: "NEWSTACK API",
          description: `${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan - ${isAnnual ? "Annual" : "Monthly"}`,
          order_id: data.orderId,
          handler: async (response: any) => {
            const verifyResult = await supabase.functions.invoke("verify-api-subscription", {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                subscriptionId: data.subscriptionId,
                userId: user.id,
              },
            });

            if (verifyResult.error) {
              toast.error("Payment verification failed");
            } else {
              toast.success("Subscription activated! Redirecting to dashboard...");
              navigate("/enterprise/dashboard");
            }
          },
          prefill: { email: user.email },
          theme: { color: "#10b981" },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } catch (err) {
        console.error("Payment error:", err);
        toast.error("Payment failed. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-16">
        <div className="container mx-auto max-w-6xl px-4">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <Badge variant="outline" className="mb-4">
              <Activity className="w-3 h-3 mr-1" />
              API Pricing
            </Badge>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Simple, Transparent <span className="text-primary">Pricing</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
              Choose the plan that fits your needs. Start free, scale as you grow.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4">
              <Label htmlFor="billing-toggle" className={cn(!isAnnual && "text-foreground font-medium")}>
                Monthly
              </Label>
              <Switch
                id="billing-toggle"
                checked={isAnnual}
                onCheckedChange={setIsAnnual}
              />
              <Label htmlFor="billing-toggle" className={cn(isAnnual && "text-foreground font-medium")}>
                Annual
                <Badge variant="secondary" className="ml-2 text-xs">Save 17%</Badge>
              </Label>
            </div>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={cn(
                  "relative h-full flex flex-col",
                  plan.highlighted && "border-primary shadow-lg shadow-primary/10"
                )}>
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary">
                        <Star className="w-3 h-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center bg-gradient-to-br",
                      plan.color
                    )}>
                      <plan.icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="pt-4">
                      {plan.price.monthly === null ? (
                        <span className="text-3xl font-bold">Custom</span>
                      ) : plan.price.monthly === 0 ? (
                        <span className="text-3xl font-bold">Free</span>
                      ) : (
                        <>
                          <span className="text-3xl font-bold">
                            ${isAnnual ? plan.price.annual : plan.price.monthly}
                          </span>
                          <span className="text-muted-foreground">/month</span>
                        </>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    {/* Usage Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Requests</p>
                        <p className="font-semibold">{plan.requests}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Rate Limit</p>
                        <p className="font-semibold">{plan.rateLimit}</p>
                      </div>
                    </div>

                    {/* Features */}
                    <ul className="space-y-3 flex-1 mb-6">
                      {plan.features.map((feature) => (
                        <li key={feature.name} className="flex items-center gap-2 text-sm">
                          {feature.included ? (
                            <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          ) : (
                            <X className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
                          )}
                          <span className={cn(!feature.included && "text-muted-foreground/50")}>
                            {feature.name}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className="w-full"
                      variant={plan.highlighted ? "default" : "outline"}
                      onClick={() => handlePlanSelect(plan.id)}
                    >
                      {plan.cta}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Features Comparison */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-16"
          >
            <h2 className="font-display text-2xl font-bold text-center mb-8">
              All Plans Include
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="pt-6 text-center">
                  <Shield className="w-10 h-10 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">SSL Encryption</h3>
                  <p className="text-sm text-muted-foreground">All API calls secured with TLS 1.3</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Clock className="w-10 h-10 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">99.9% Uptime</h3>
                  <p className="text-sm text-muted-foreground">Enterprise-grade reliability</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Webhook className="w-10 h-10 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">RESTful API</h3>
                  <p className="text-sm text-muted-foreground">OpenAPI 3.0 specification</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Radio className="w-10 h-10 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Global CDN</h3>
                  <p className="text-sm text-muted-foreground">Low latency worldwide</p>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* FAQs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="font-display text-2xl font-bold text-center mb-8">
              Frequently Asked Questions
            </h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {faqs.map((faq, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2">{faq.question}</h3>
                    <p className="text-sm text-muted-foreground">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center mt-16"
          >
            <Card className="max-w-2xl mx-auto bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="pt-8 pb-8">
                <h3 className="font-display text-xl font-bold mb-2">
                  Need a custom solution?
                </h3>
                <p className="text-muted-foreground mb-6">
                  Contact our sales team for custom pricing, dedicated support, and SLA guarantees.
                </p>
                <Button onClick={() => window.location.href = "mailto:sales@newstack.live"}>
                  Contact Sales
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      <Footer />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
