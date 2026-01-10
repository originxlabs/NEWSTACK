import { motion } from "framer-motion";
import { Check, Crown, Zap, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Get started with essential features",
    features: [
      "10 AI summaries per day",
      "5 audio articles per day",
      "Basic personalization",
      "Single language",
      "Ad-supported",
    ],
    cta: "Get Started",
    variant: "outline" as const,
  },
  {
    name: "Pro",
    price: "$9.99",
    period: "per month",
    description: "For news enthusiasts who want more",
    features: [
      "Unlimited AI summaries",
      "Unlimited audio articles",
      "Advanced personalization",
      "10 languages",
      "Ad-free experience",
      "Local news alerts",
      "Priority support",
    ],
    cta: "Start Free Trial",
    variant: "hero" as const,
    popular: true,
  },
  {
    name: "Lifetime",
    price: "$199",
    period: "one-time",
    description: "Own NEWSTACK forever",
    features: [
      "Everything in Pro",
      "50+ languages",
      "API access",
      "Early access to features",
      "Exclusive community",
      "Custom news alerts",
      "White-label reports",
    ],
    cta: "Get Lifetime Access",
    variant: "premium" as const,
  },
];

export function PricingSection() {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge variant="topic" className="mb-4">
            <Crown className="w-3 h-3 mr-1" />
            Premium Plans
          </Badge>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Upgrade Your News Experience
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your needs. All plans include a 7-day free trial.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                variant={plan.popular ? "elevated" : "glass"}
                className={`relative h-full ${plan.popular ? "border-primary shadow-lg" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-4">
                  <CardTitle className="font-display text-xl mb-2">{plan.name}</CardTitle>
                  <div className="mb-2">
                    <span className="font-display text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground ml-2">/{plan.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant={plan.variant} className="w-full">
                    {plan.variant === "premium" && <Zap className="w-4 h-4 mr-2" />}
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
