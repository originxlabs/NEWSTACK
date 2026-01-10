import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Coffee, Zap, Crown, Check, ExternalLink, Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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

const Support = () => {
  const [selectedTier, setSelectedTier] = useState<string | null>("supporter");
  const [customAmount, setCustomAmount] = useState("");
  const [donationType, setDonationType] = useState<"one-time" | "monthly">("one-time");
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();

  const handleDonate = async (amount: number) => {
    setIsProcessing(true);
    
    try {
      // Create donation record
      const { error } = await supabase.from("donations").insert({
        user_id: user?.id || null,
        email: user?.email || null,
        amount: amount,
        currency: "INR",
        donation_type: donationType,
        status: "initiated",
      });

      if (error) throw error;

      // Open Razorpay (in production, this would be a proper integration)
      // For now, show a success message
      toast.success(
        "Thank you for your support! 💚",
        { description: "Razorpay payment gateway will be integrated for production." }
      );
    } catch (err) {
      console.error("Donation error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsProcessing(false);
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
              Keep NEWSTACK <span className="gradient-text">Free & Independent</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              NEWSTACK is free for everyone. No paywalls. No forced subscriptions. 
              Your support helps us stay independent and keep quality journalism accessible to all.
            </p>
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
                    selectedTier === tier.id
                      ? "ring-2 ring-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedTier(tier.id)}
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
                  placeholder="500"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setSelectedTier(null);
                  }}
                  className="pl-8 h-12"
                />
              </div>
              <Button
                size="lg"
                onClick={() => handleDonate(Number(customAmount) || donationTiers.find(t => t.id === selectedTier)?.amount || 299)}
                disabled={isProcessing || (!customAmount && !selectedTier)}
                className="px-8"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Heart className="h-4 w-4 mr-2" />
                )}
                Donate Now
              </Button>
            </div>
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
                <h4 className="font-semibold mb-2">🌍 Free for Everyone</h4>
                <p className="text-sm text-muted-foreground">
                  Every user gets unlimited news access and 50 free audio plays daily. Your support helps keep it that way.
                </p>
              </div>
              <div className="glass-card rounded-xl p-6">
                <h4 className="font-semibold mb-2">📰 No Bias, No Agenda</h4>
                <p className="text-sm text-muted-foreground">
                  We aggregate from multiple sources and use AI to present balanced, fact-checked summaries.
                </p>
              </div>
              <div className="glass-card rounded-xl p-6">
                <h4 className="font-semibold mb-2">🔒 Your Privacy Matters</h4>
                <p className="text-sm text-muted-foreground">
                  We don't sell your data. No trackers. No hidden agendas. Just honest journalism.
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
