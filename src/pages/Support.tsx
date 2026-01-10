import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, Coffee, Zap, Crown, Check, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: { email?: string };
  theme: { color: string };
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

const donationTiers = [
  {
    id: "coffee",
    name: "Buy us a Coffee",
    amount: 99,
    icon: Coffee,
    color: "from-amber-500 to-orange-500",
    description: "Support independent journalism",
    perks: ["Our heartfelt thanks", "Support free news for all"],
  },
  {
    id: "supporter",
    name: "Supporter",
    amount: 299,
    icon: Heart,
    color: "from-pink-500 to-rose-500",
    description: "Help keep NEWSTACK free",
    perks: ["All Coffee perks", "Supporter badge on discussions", "Early access to features"],
    popular: true,
  },
  {
    id: "champion",
    name: "Champion",
    amount: 999,
    icon: Zap,
    color: "from-purple-500 to-indigo-500",
    description: "Champion of free media",
    perks: ["All Supporter perks", "Champion badge", "Priority support", "Name in credits"],
  },
  {
    id: "patron",
    name: "Patron",
    amount: 2999,
    icon: Crown,
    color: "from-yellow-500 to-amber-500",
    description: "Become a founding patron",
    perks: ["All Champion perks", "Patron badge", "Direct feedback channel", "Exclusive updates"],
  },
];

const premiumFeatures = [
  { icon: "🎧", title: "Unlimited TTS Listens", description: "Listen to unlimited articles with AI voice" },
  { icon: "🚫", title: "Ad-Free Experience", description: "No promotional content, ever" },
  { icon: "⭐", title: "Exclusive Topics", description: "Access premium news sources and topics" },
  { icon: "📱", title: "Offline Reading", description: "Download articles for offline access" },
];

const Support = () => {
  const [selectedTier, setSelectedTier] = useState<string | null>("supporter");
  const [customAmount, setCustomAmount] = useState("");
  const [donationType, setDonationType] = useState<"one-time" | "monthly">("one-time");
  const [isProcessing, setIsProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const { user, refreshProfile } = useAuth();

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const getSelectedAmount = (): number => {
    if (customAmount) {
      return parseInt(customAmount) || 0;
    }
    return donationTiers.find(t => t.id === selectedTier)?.amount || 0;
  };

  const handleDonate = async () => {
    const amount = getSelectedAmount();
    
    if (amount < 10) {
      toast.error("Minimum donation amount is ₹10");
      return;
    }

    if (!razorpayLoaded) {
      toast.error("Payment gateway is loading. Please try again.");
      return;
    }

    setIsProcessing(true);
    
    try {
      // Create Razorpay order via edge function
      const { data, error } = await supabase.functions.invoke("create-razorpay-order", {
        body: {
          amount,
          email: user?.email || null,
          donationType,
          userId: user?.id || null,
        },
      });

      if (error || !data) {
        throw new Error(error?.message || "Failed to create order");
      }

      // Open Razorpay checkout
      const options: RazorpayOptions = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "NEWSTACK",
        description: `${donationType === "monthly" ? "Monthly" : "One-time"} Donation - ₹${amount}`,
        order_id: data.orderId,
        handler: async (response: RazorpayResponse) => {
          // Verify payment
          try {
            const verifyResult = await supabase.functions.invoke("verify-razorpay-payment", {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                userId: user?.id || null,
              },
            });

            if (verifyResult.error) {
              toast.error("Payment verification failed");
            } else {
              toast.success("Thank you for your support! 💚 Premium features activated!");
              if (user) {
                await refreshProfile();
              }
            }
          } catch (err) {
            console.error("Verification error:", err);
            toast.error("Payment verification failed");
          }
        },
        prefill: {
          email: user?.email || undefined,
        },
        theme: {
          color: "#10b981",
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error("Donation error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCustomAmountChange = (value: string) => {
    const num = parseInt(value) || 0;
    setCustomAmount(value);
    if (num >= 10) {
      setSelectedTier(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto max-w-5xl px-4">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm mb-6">
              <Heart className="h-4 w-4" />
              Support Independent Journalism
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Keep NEWSTACK <span className="gradient-text">Free Forever</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-4">
              NEWSTACK is free for everyone. No paywalls. No forced subscriptions. No ads.
              Your support helps us stay independent and unlocks premium features for you.
            </p>
          </motion.div>

          {/* Premium Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-2xl p-6 mb-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-semibold">Unlock Premium Features</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {premiumFeatures.map((feature) => (
                <div key={feature.title} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <span className="text-2xl">{feature.icon}</span>
                  <div>
                    <h3 className="font-medium text-sm">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Donation Type Toggle */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex rounded-full bg-muted p-1">
              <button
                onClick={() => setDonationType("one-time")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  donationType === "one-time"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                One-time
              </button>
              <button
                onClick={() => setDonationType("monthly")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  donationType === "monthly"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          {/* Donation Tiers */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {donationTiers.map((tier, index) => (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`relative p-6 cursor-pointer transition-all hover:scale-[1.02] ${
                    selectedTier === tier.id && !customAmount
                      ? "ring-2 ring-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => {
                    setSelectedTier(tier.id);
                    setCustomAmount("");
                  }}
                >
                  {tier.popular && (
                    <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">
                      Most Popular
                    </Badge>
                  )}
                  
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center mb-4`}>
                    <tier.icon className="h-6 w-6 text-white" />
                  </div>
                  
                  <h3 className="font-display text-lg font-semibold mb-1">{tier.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{tier.description}</p>
                  
                  <div className="mb-4">
                    <span className="text-3xl font-bold">₹{tier.amount}</span>
                    {donationType === "monthly" && (
                      <span className="text-muted-foreground text-sm">/month</span>
                    )}
                  </div>
                  
                  <ul className="space-y-2">
                    {tier.perks.map((perk) => (
                      <li key={perk} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary" />
                        {perk}
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Custom Amount */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card rounded-2xl p-6 mb-12"
          >
            <h3 className="font-display text-xl font-semibold mb-4 text-center">
              Or enter a custom amount
            </h3>
            <div className="flex gap-4 max-w-md mx-auto">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                <Input
                  type="number"
                  placeholder="Minimum ₹10"
                  min={10}
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  className="pl-8 h-12"
                />
              </div>
              <Button
                size="lg"
                onClick={handleDonate}
                disabled={isProcessing || getSelectedAmount() < 10}
                className="px-8"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Heart className="h-4 w-4 mr-2" />
                )}
                {isProcessing ? "Processing..." : "Donate Now"}
              </Button>
            </div>
            {customAmount && parseInt(customAmount) < 10 && parseInt(customAmount) > 0 && (
              <p className="text-center text-sm text-destructive mt-2">
                Minimum amount is ₹10
              </p>
            )}
          </motion.div>

          {/* Trust Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center"
          >
            <h3 className="font-display text-2xl font-semibold mb-6">Why Support NEWSTACK?</h3>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="glass-card rounded-xl p-6">
                <h4 className="font-semibold mb-2">🌍 Free Forever</h4>
                <p className="text-sm text-muted-foreground">
                  No paywalls. No ads. No forced subscriptions. Every user gets full access to all news.
                </p>
              </div>
              <div className="glass-card rounded-xl p-6">
                <h4 className="font-semibold mb-2">📰 Source-First Journalism</h4>
                <p className="text-sm text-muted-foreground">
                  Every story shows its original sources. AI summaries complement, never replace, the original reporting.
                </p>
              </div>
              <div className="glass-card rounded-xl p-6">
                <h4 className="font-semibold mb-2">🔒 Community Funded</h4>
                <p className="text-sm text-muted-foreground">
                  NEWSTACK is funded entirely by readers. No corporate interests. No data selling. Just honest journalism.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Secure Payment Note */}
          <div className="text-center mt-8 text-sm text-muted-foreground">
            <p className="flex items-center justify-center gap-2">
              🔐 Secure payments powered by Razorpay
              <ExternalLink className="h-3 w-3" />
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Support;
