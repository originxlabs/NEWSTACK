import { useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Zap, Crown, Infinity } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    icon: Zap,
    description: "Get started with essential news",
    features: ["5 audio briefings/day", "Basic AI summaries", "1 language", "Limited topics", "Ads included"],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    price: "$9.99",
    period: "/month",
    icon: Crown,
    description: "Unlock the full NEWSTACK experience",
    features: ["Unlimited audio", "Deep AI analysis", "All 12 languages", "All topics", "Ad-free", "Local alerts", "Priority support"],
    cta: "Start Pro Trial",
    popular: true,
  },
  {
    name: "Lifetime",
    price: "$199",
    period: "one-time",
    icon: Infinity,
    description: "Own NEWSTACK forever",
    features: ["Everything in Pro", "Lifetime access", "Early features", "Founder badge", "Private Discord", "API access"],
    cta: "Get Lifetime",
    popular: false,
  },
];

const Pricing = () => {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Simple, Transparent Pricing</h1>
            <p className="text-muted-foreground text-lg">Choose the plan that fits your news consumption</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <motion.div key={plan.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={`glass-card rounded-2xl p-6 relative ${plan.popular ? "ring-2 ring-primary" : ""}`}>
                {plan.popular && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Most Popular</Badge>}
                <plan.icon className="h-10 w-10 text-primary mb-4" />
                <h3 className="font-display text-xl font-bold">{plan.name}</h3>
                <div className="flex items-baseline gap-1 my-2">
                  <span className="font-display text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
                <p className="text-muted-foreground text-sm mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-primary" />{f}</li>
                  ))}
                </ul>
                <Button className="w-full" variant={plan.popular ? "default" : "outline"}>{plan.cta}</Button>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Pricing;
