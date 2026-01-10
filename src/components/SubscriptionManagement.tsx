import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Crown, CreditCard, History, Sparkles, Check, X, Loader2, Calendar, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface Donation {
  id: string;
  amount: number;
  currency: string;
  donation_type: string;
  status: string;
  created_at: string;
  razorpay_payment_id: string | null;
}

interface PremiumFeature {
  id: string;
  name: string;
  icon: string;
  description: string;
  used: number;
  limit: number | null; // null = unlimited
}

export function SubscriptionManagement() {
  const { user, profile, refreshProfile } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isPremium = profile?.subscription_tier === "pro" || 
                    profile?.subscription_tier === "lifetime" || 
                    profile?.subscription_tier === "enterprise";

  const premiumFeatures: PremiumFeature[] = [
    { id: "tts", name: "Text-to-Speech", icon: "🎧", description: "Listen to articles", used: 0, limit: isPremium ? null : 50 },
    { id: "offline", name: "Offline Reading", icon: "📱", description: "Save for offline", used: 0, limit: isPremium ? null : 5 },
    { id: "topics", name: "Exclusive Topics", icon: "⭐", description: "Premium sources", used: 0, limit: isPremium ? null : 0 },
    { id: "adfree", name: "Ad-Free", icon: "🚫", description: "No promotions", used: 0, limit: isPremium ? null : 0 },
  ];

  useEffect(() => {
    if (user) {
      fetchDonations();
    }
  }, [user]);

  const fetchDonations = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from("donations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setDonations(data);
      }
    } catch (err) {
      console.error("Failed to fetch donations:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    toast.info("Monthly subscriptions can be canceled from your Razorpay dashboard. Contact support for assistance.");
  };

  const totalDonated = donations
    .filter(d => d.status === "completed")
    .reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="space-y-6">
      {/* Premium Status Card */}
      <Card className={`p-6 ${isPremium ? "bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30" : ""}`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${isPremium ? "bg-gradient-to-br from-amber-500 to-orange-500" : "bg-muted"}`}>
              <Crown className={`h-6 w-6 ${isPremium ? "text-white" : "text-muted-foreground"}`} />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold">
                {isPremium ? "Premium Member" : "Free Member"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isPremium 
                  ? "You have access to all premium features"
                  : "Upgrade to unlock all features"
                }
              </p>
            </div>
          </div>
          {isPremium && profile?.subscription_tier && (
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
              {profile.subscription_tier.toUpperCase()}
            </Badge>
          )}
        </div>

        {!isPremium && (
          <Link to="/support">
            <Button className="w-full gap-2">
              <Sparkles className="h-4 w-4" />
              Upgrade to Premium
            </Button>
          </Link>
        )}

        {isPremium && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total contributed</span>
            <span className="font-bold text-green-500">₹{totalDonated}</span>
          </div>
        )}
      </Card>

      {/* Premium Features Usage */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Feature Usage
        </h3>
        <div className="space-y-4">
          {premiumFeatures.map((feature) => (
            <div key={feature.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">{feature.icon}</span>
                <div>
                  <p className="font-medium text-sm">{feature.name}</p>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </div>
              <div className="text-right">
                {feature.limit === null ? (
                  <Badge variant="outline" className="text-green-500 border-green-500">
                    Unlimited
                  </Badge>
                ) : feature.limit === 0 ? (
                  <Badge variant="secondary" className="text-muted-foreground">
                    Premium Only
                  </Badge>
                ) : (
                  <div className="text-right">
                    <span className="text-sm font-medium">{feature.used}/{feature.limit}</span>
                    <Progress value={(feature.used / feature.limit) * 100} className="w-20 h-1.5 mt-1" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Donation History */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Donation History
        </h3>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : donations.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No donations yet</p>
            <Link to="/support">
              <Button variant="link" className="mt-2">Make your first donation</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {donations.slice(0, 10).map((donation) => (
              <motion.div
                key={donation.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    donation.status === "completed" ? "bg-green-500/10" : "bg-amber-500/10"
                  }`}>
                    {donation.status === "completed" ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Calendar className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      ₹{donation.amount} {donation.donation_type === "monthly" ? "/ month" : "one-time"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(donation.created_at).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <Badge variant={donation.status === "completed" ? "default" : "secondary"}>
                  {donation.status}
                </Badge>
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      {/* Monthly Subscription Management */}
      {isPremium && donations.some(d => d.donation_type === "monthly" && d.status === "completed") && (
        <Card className="p-6 border-amber-500/30">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-amber-500" />
            Monthly Subscription
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Your monthly donation helps keep NEWSTACK free for everyone.
          </p>
          <Button variant="outline" onClick={handleCancelSubscription} className="text-destructive">
            Cancel Subscription
          </Button>
        </Card>
      )}
    </div>
  );
}
